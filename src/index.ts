#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

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

const CalculateSchema = z.object({
  a: z.number().describe('First number'),
  b: z.number().describe('Second number'),
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('Operation to perform'),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'calculate',
        description: 'Perform basic arithmetic operations',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: 'First number' },
            b: { type: 'number', description: 'Second number' },
            operation: {
              type: 'string',
              enum: ['add', 'subtract', 'multiply', 'divide'],
              description: 'Operation to perform',
            },
          },
          required: ['a', 'b', 'operation'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'calculate') {
    const args = CalculateSchema.parse(request.params.arguments);

    let result: number;
    switch (args.operation) {
      case 'add':
        result = args.a + args.b;
        break;
      case 'subtract':
        result = args.a - args.b;
        break;
      case 'multiply':
        result = args.a * args.b;
        break;
      case 'divide':
        if (args.b === 0) {
          throw new Error('Division by zero');
        }
        result = args.a / args.b;
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: `Result: ${result}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Quote0 MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
