#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.QUOTE0_API_KEY;
const TEXT_API_URL = process.env.QUOTE0_TEXT_API_URL || 'https://dot.mindreset.tech/api/open/text';
const IMAGE_API_URL = process.env.QUOTE0_IMAGE_API_URL || 'https://dot.mindreset.tech/api/open/image';
const DEVICE_IDS_STRING = process.env.QUOTE0_DEVICE_IDS || '';

if (!API_KEY) {
  console.error('Error: QUOTE0_API_KEY environment variable is required');
  console.error('Please set QUOTE0_API_KEY in your .env file or environment variables');
  process.exit(1);
}

// Parse device IDs from environment variable
// Format: "name1:id1,name2:id2,name3:id3"
const deviceMap = new Map<string, string>();
const deviceList: Array<{ name: string; id: string }> = [];

if (DEVICE_IDS_STRING) {
  const pairs = DEVICE_IDS_STRING.split(',');
  for (const pair of pairs) {
    const [name, id] = pair.trim().split(':');
    if (name && id) {
      deviceMap.set(name.trim(), id.trim());
      deviceList.push({ name: name.trim(), id: id.trim() });
    }
  }

  if (deviceMap.size === 0) {
    console.error('Warning: QUOTE0_DEVICE_IDS is set but no valid device pairs found');
    console.error('Expected format: "name1:id1,name2:id2"');
  } else {
    console.error(`Loaded ${deviceMap.size} device(s):`, Array.from(deviceMap.keys()).join(', '));
  }
}

const server = new Server(
  {
    name: 'quote0-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const SendTextSchema = z.object({
  device: z.string().describe('Device name (if configured) or device serial number - identifies which Quote0 device to send the text to'),
  title: z.string().optional().describe('Text title - displays as the header of the message on the device'),
  message: z.string().optional().describe('Text content - the main body of the message to display'),
  signature: z.string().optional().describe('Text signature - appears at the bottom of the message, typically for author attribution'),
  icon: z.string().optional().describe('Base64 encoded PNG icon (40px*40px) - displays alongside the message for visual identification'),
  link: z.string().optional().describe('HTTP/HTTPS URL or Scheme URL - when user taps the message, opens this link'),
  refreshNow: z.boolean().default(true).describe('Whether to immediately display the content on device (default: true)'),
});

const SendImageSchema = z.object({
  device: z.string().describe('Device name (if configured) or device serial number - identifies which Quote0 device to send the image to'),
  image: z.string().describe('Base64 encoded PNG image data to display on the device'),
  refreshNow: z.boolean().default(true).describe('Whether to immediately display the content on device (default: true)'),
  link: z.string().optional().describe('HTTP/HTTPS URL or Scheme URL - when user taps the image, opens this link'),
  border: z.number().optional().describe('Color number for screen edge border'),
  ditherType: z.string().optional().describe('Image dithering algorithm for e-ink display optimization'),
  ditherKernel: z.string().optional().describe('Specific dithering method to use'),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Build device description
  let deviceDescription = 'Device name (if configured) or device serial number - identifies which Quote0 device to send the text to';
  if (deviceList.length > 0) {
    const deviceNames = deviceList.map(d => `"${d.name}"`).join(', ');
    deviceDescription = `Device name or serial number. Available devices: ${deviceNames}`;
  }

  return {
    tools: [
      {
        name: 'send_text_to_quote0',
        description: 'Send text content to a Quote0 device. Quote0 is a smart display device that shows text messages. This API allows you to update the content shown on the device. Rate limited to 1 request per second.',
        inputSchema: {
          type: 'object',
          properties: {
            device: {
              type: 'string',
              description: deviceDescription,
            },
            title: {
              type: 'string',
              description: 'Text title - displays as the header of the message on the device',
            },
            message: {
              type: 'string',
              description: 'Text content - the main body of the message to display',
            },
            signature: {
              type: 'string',
              description: 'Text signature - appears at the bottom of the message, typically for author attribution',
            },
            icon: {
              type: 'string',
              description: 'Base64 encoded PNG icon (40px*40px) - displays alongside the message for visual identification',
            },
            link: {
              type: 'string',
              description: 'HTTP/HTTPS URL or Scheme URL - when user taps the message, opens this link',
            },
            refreshNow: {
              type: 'boolean',
              description: 'Whether to immediately display the content on device (default: true)',
              default: true,
            },
          },
          required: ['device'],
        },
      },
      {
        name: 'send_image_to_quote0',
        description: 'Send an image to a Quote0 device. The image will be displayed on the e-ink screen with optional dithering for better quality. Rate limited to 1 request per second.',
        inputSchema: {
          type: 'object',
          properties: {
            device: {
              type: 'string',
              description: deviceDescription,
            },
            image: {
              type: 'string',
              description: 'Base64 encoded PNG image data to display on the device',
            },
            refreshNow: {
              type: 'boolean',
              description: 'Whether to immediately display the content on device (default: true)',
              default: true,
            },
            link: {
              type: 'string',
              description: 'HTTP/HTTPS URL or Scheme URL - when user taps the image, opens this link',
            },
            border: {
              type: 'number',
              description: 'Color number for screen edge border',
            },
            ditherType: {
              type: 'string',
              description: 'Image dithering algorithm for e-ink display optimization',
            },
            ditherKernel: {
              type: 'string',
              description: 'Specific dithering method to use',
            },
          },
          required: ['device', 'image'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'send_text_to_quote0') {
    const args = SendTextSchema.parse(request.params.arguments);

    // Resolve device name to ID if configured
    let deviceId = args.device;
    if (deviceMap.has(args.device)) {
      deviceId = deviceMap.get(args.device)!;
      console.error(`Resolved device name "${args.device}" to ID: ${deviceId}`);
    } else if (deviceMap.size > 0) {
      // If device map exists but name not found, check if it might be a direct ID
      console.error(`Using provided value as device ID: ${args.device}`);
    }

    try {
      const response = await fetch(TEXT_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshNow: args.refreshNow,
          deviceId: deviceId,
          title: args.title,
          message: args.message,
          signature: args.signature,
          icon: args.icon,
          link: args.link,
        }),
      });

      const data = await response.json() as {
        code: number;
        message: string;
        result?: {
          message?: string;
        };
      };

      if (response.ok) {
        const deviceInfo = deviceMap.has(args.device)
          ? `device "${args.device}" (${deviceId})`
          : `device ${deviceId}`;

        return {
          content: [
            {
              type: 'text',
              text: `Successfully sent text to Quote0 ${deviceInfo}.\nResponse: ${data.message}\nDevice message: ${data.result?.message || 'N/A'}`,
            },
          ],
        };
      } else {
        let errorMessage = `Failed to send text to Quote0 device.\nStatus: ${response.status}\nMessage: ${data.message}`;

        switch (response.status) {
          case 400:
            errorMessage += '\nError: Parameter error - check your input parameters';
            break;
          case 403:
            errorMessage += '\nError: Insufficient permissions - check your API key';
            break;
          case 404:
            errorMessage += '\nError: Device or content not found';
            break;
          case 500:
            errorMessage += '\nError: Device response failure';
            break;
        }

        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error calling Quote0 API: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (request.params.name === 'send_image_to_quote0') {
    const args = SendImageSchema.parse(request.params.arguments);

    // Resolve device name to ID if configured
    let deviceId = args.device;
    if (deviceMap.has(args.device)) {
      deviceId = deviceMap.get(args.device)!;
      console.error(`Resolved device name "${args.device}" to ID: ${deviceId}`);
    } else if (deviceMap.size > 0) {
      // If device map exists but name not found, check if it might be a direct ID
      console.error(`Using provided value as device ID: ${args.device}`);
    }

    try {
      const response = await fetch(IMAGE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshNow: args.refreshNow,
          deviceId: deviceId,
          image: args.image,
          link: args.link,
          border: args.border,
          ditherType: args.ditherType,
          ditherKernel: args.ditherKernel,
        }),
      });

      const data = await response.json() as {
        code: number;
        message: string;
        result?: {
          message?: string;
        };
      };

      if (response.ok) {
        const deviceInfo = deviceMap.has(args.device)
          ? `device "${args.device}" (${deviceId})`
          : `device ${deviceId}`;

        return {
          content: [
            {
              type: 'text',
              text: `Successfully sent image to Quote0 ${deviceInfo}.\nResponse: ${data.message}\nDevice message: ${data.result?.message || 'N/A'}`,
            },
          ],
        };
      } else {
        let errorMessage = `Failed to send image to Quote0 device.\nStatus: ${response.status}\nMessage: ${data.message}`;

        switch (response.status) {
          case 400:
            errorMessage += '\nError: Parameter error - check your input parameters';
            break;
          case 403:
            errorMessage += '\nError: Insufficient permissions - check your API key';
            break;
          case 404:
            errorMessage += '\nError: Device or content not found';
            break;
          case 500:
            errorMessage += '\nError: Device response failure';
            break;
        }

        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error calling Quote0 Image API: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Quote0 MCP server running on stdio');
  console.error('API Key configured:', API_KEY!.substring(0, 8) + '...');
  console.error('Text API URL:', TEXT_API_URL);
  console.error('Image API URL:', IMAGE_API_URL);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
