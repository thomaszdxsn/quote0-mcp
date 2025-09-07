# Quote0 MCP

A Model Context Protocol (MCP) server for interacting with Quote0 smart display devices.

## Features

Send text content to Quote0 devices with support for:
- Title, message, and signature
- Custom icons (Base64 encoded PNG)
- Clickable links
- Immediate refresh option

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure your environment:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your configuration
QUOTE0_API_KEY=your_actual_api_key_here
QUOTE0_API_URL=https://dot.mindreset.tech/api/open/text  # Optional, uses default if not set
```

3. Build the project:
```bash
pnpm build
```

## Usage

Run the MCP server:
```bash
# Development mode
pnpm dev

# Production mode
pnpm start
```

## API Tool

The server provides one tool: `send_text_to_quote0`

### Parameters:
- `deviceId` (required): Device serial number
- `title` (optional): Text title header
- `message` (optional): Main text content
- `signature` (optional): Text signature/author
- `icon` (optional): Base64 encoded PNG icon (40x40px)
- `link` (optional): HTTP/HTTPS URL or Scheme URL
- `refreshNow` (optional): Bypass 5-minute display interval

### Rate Limiting
API requests are limited to 1 per second.

## Technologies

- TypeScript
- @modelcontextprotocol/sdk
- Zod for schema validation
- dotenv for environment configuration