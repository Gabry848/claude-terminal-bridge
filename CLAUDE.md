# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Claude Terminal Bridge** is a VSCode extension that exposes VSCode terminal control via a WebSocket server. It allows external MCP (Model Context Protocol) clients to create, control, and close VSCode terminals remotely.

## Architecture

### Core Components

1. **TerminalBridge Class** ([src/extension.ts](src/extension.ts))
   - Main class managing WebSocket server and terminal operations
   - Runs a WebSocket server (default port 3000) that **receives** connections from MCP clients
   - Manages a map of terminal instances indexed by unique IDs
   - Handles all MCP protocol message types: `ping`, `create_terminal`, `execute`, `close_terminal`

2. **Important Inversion**: Unlike typical MCP architecture, this extension runs the **WebSocket server**, not the client. External MCP implementations connect **to** this extension.

3. **WebSocket Communication**:
   - Extension acts as **server** (WebSocketServer from `ws` package)
   - External MCP clients connect **to** the extension
   - Bi-directional JSON message exchange using request/response pattern
   - Each request has a unique `id` that is echoed in responses

### Key Message Types

**Incoming Requests (from MCP client → extension):**
- `ping` - Health check
- `create_terminal` - Create new VSCode terminal (uses request `id` as `terminalId`)
- `execute` - Send command to terminal (requires `command`, optional `terminalId`)
- `close_terminal` - Dispose terminal (requires `terminalId`)

**Outgoing Responses (from extension → MCP client):**
- `pong` - Ping response
- `terminal_created` - Confirms terminal creation with `terminalId` and `terminalName`
- `success` - Command executed successfully
- `error` - Operation failed with error message

### Configuration

Settings in `package.json` contributions:
- `claudeTerminalBridge.mcpServerUrl`: WebSocket URL (default: `ws://localhost:3000`) - only port is used
- `claudeTerminalBridge.autoConnect`: Auto-start server on activation (default: `true`)
- `claudeTerminalBridge.silentAutoConnect`: Suppress errors during auto-connect (default: `true`)

## Development Commands

```bash
# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run linter
npm run lint

# Run tests
npm run pretest    # Compile + lint
npm test          # Run via vscode-test

# Build for production
npm run vscode:prepublish
```

## Development Workflow

1. Press `F5` in VSCode to launch Extension Development Host
2. Check logs in Output Channel: "Claude Terminal Bridge"
3. Status bar shows connection state: `$(plug) MCP Connected` or `$(debug-disconnect) MCP Disconnected`
4. Use commands from Command Palette:
   - `Claude Terminal Bridge: Connect to MCP Server`
   - `Claude Terminal Bridge: Disconnect from MCP Server`
   - `Claude Terminal Bridge: Show Connection Status`

## Important Limitations

**VSCode Terminal Output**: The VSCode API does **not** provide direct access to terminal output. The extension can:
- ✅ Send commands to terminals via `terminal.sendText()`
- ✅ Confirm command was sent
- ❌ Capture real-time output from terminal

Current implementation returns a success message but cannot stream terminal output. To capture output, a custom Pseudoterminal implementation using `vscode.window.createTerminal({ pty: customPty })` would be required.

## Terminal ID Management

- When creating a terminal, the request `id` becomes the `terminalId`
- `terminalId` is returned in the `terminal_created` response
- Use this `terminalId` for subsequent `execute` and `close_terminal` operations
- Terminals are tracked in `Map<string, vscode.Terminal>` and cleaned up on close

## Protocol Documentation

See companion files for complete protocol specifications:
- [mcp_requirements.md](mcp_requirements.md) - Complete MCP protocol specification
- [MCP_SERVER_GUIDE.md](MCP_SERVER_GUIDE.md) - Guide for implementing external MCP client

## Code Conventions

- TypeScript strict mode enabled
- Target: ES2022, Module: Node16
- Interfaces: `MCPRequest` and `MCPResponse` define message structure
- All WebSocket messages logged to Output Channel with timestamps
- Status bar updates on connection state changes
