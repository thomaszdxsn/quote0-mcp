# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Quote0 MCP server that allows sending text and images to Quote0 smart display devices (e-ink screens). The project is documented in Chinese for end users.

## Commands

### Development
- `pnpm dev` - Run the MCP server in development mode with hot reload (uses tsx)
- `pnpm build` - Compile TypeScript to JavaScript in dist/
- `pnpm start` - Run the compiled server from dist/

### Installation
- `pnpm install` - Install dependencies using pnpm (required package manager)

## Architecture

This is a Model Context Protocol (MCP) server that provides an interface for sending content to Quote0 smart display devices. The server:

1. **Two Tool Implementation**: 
   - `send_text_to_quote0`: Sends formatted text messages to Quote0 devices
   - `send_image_to_quote0`: Sends images with e-ink optimization to Quote0 devices
2. **Device Management**: Supports multiple devices with friendly names via `QUOTE0_DEVICE_IDS` environment variable
3. **Stdio Transport**: Uses stdio for communication with MCP clients (standard for MCP servers)
4. **Environment Configuration**: Requires `QUOTE0_API_KEY`; optionally accepts `QUOTE0_TEXT_API_URL`, `QUOTE0_IMAGE_API_URL` and `QUOTE0_DEVICE_IDS`
5. **Schema Validation**: Uses Zod for runtime validation of tool parameters
6. **ES Modules**: Project uses ES module syntax (`"type": "module"` in package.json)

## Key Implementation Details

- Main entry point: `src/index.ts` - Contains all server logic in a single file
- API endpoint: Sends POST requests to Quote0 API with Bearer token authentication
- Rate limiting: API is limited to 1 request per second (enforced by Quote0 API)
- Error handling: Maps HTTP status codes to user-friendly error messages
- TypeScript target: ES2022 with strict mode enabled

## Environment Setup

Before running the server, create a `.env` file with:
```
QUOTE0_API_KEY=your_actual_api_key
QUOTE0_TEXT_API_URL=https://dot.mindreset.tech/api/open/text  # Optional
QUOTE0_IMAGE_API_URL=https://dot.mindreset.tech/api/open/image  # Optional
QUOTE0_DEVICE_IDS="name1:id1,name2:id2"  # Optional, for device name mapping
```

Device names can be in any language (e.g., "desk:a001,冰箱:a002"). When configured, the tools accept friendly names instead of device IDs.