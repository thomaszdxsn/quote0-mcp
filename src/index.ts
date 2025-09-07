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
const API_URL = process.env.QUOTE0_API_URL || 'https://dot.mindreset.tech/api/open/text';

if (!API_KEY) {
  console.error('Error: QUOTE0_API_KEY environment variable is required');
  console.error('Please set QUOTE0_API_KEY in your .env file or environment variables');
  process.exit(1);
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
  deviceId: z.string().describe('Device serial number - required to identify which Quote0 device to send the text to'),
  title: z.string().optional().describe('Text title - displays as the header of the message on the device'),
  message: z.string().optional().describe('Text content - the main body of the message to display'),
  signature: z.string().optional().describe('Text signature - appears at the bottom of the message, typically for author attribution'),
  icon: z.string().optional().describe('Base64 encoded PNG icon (40px*40px) - displays alongside the message for visual identification'),
  link: z.string().optional().describe('HTTP/HTTPS URL or Scheme URL - when user taps the message, opens this link'),
  refreshNow: z.boolean().default(false).describe('Whether to immediately display the content on device, bypassing the 5-minute minimum display interval'),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'send_text_to_quote0',
        description: 'Send text content to a Quote0 device. Quote0 is a smart display device that shows text messages. This API allows you to update the content shown on the device. Rate limited to 1 request per second.',
        inputSchema: {
          type: 'object',
          properties: {
            deviceId: {
              type: 'string',
              description: 'Device serial number - required to identify which Quote0 device to send the text to',
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
              description: 'Whether to immediately display the content on device, bypassing the 5-minute minimum display interval',
              default: false,
            },
          },
          required: ['deviceId'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'send_text_to_quote0') {
    const args = SendTextSchema.parse(request.params.arguments);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshNow: args.refreshNow,
          deviceId: args.deviceId,
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
        return {
          content: [
            {
              type: 'text',
              text: `Successfully sent text to Quote0 device.\nResponse: ${data.message}\nDevice message: ${data.result?.message || 'N/A'}`,
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

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Quote0 MCP server running on stdio');
  console.error('API Key configured:', API_KEY!.substring(0, 8) + '...');
  console.error('API URL:', API_URL);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
