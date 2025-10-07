# Claude Terminal Bridge

<p align="center">
  <img src="images/icon.png" alt="Claude Terminal Bridge Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Enable Model Context Protocol (MCP) clients to control VSCode terminals via WebSocket</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER.claude-terminal-bridge">
    <img src="https://img.shields.io/visual-studio-marketplace/v/YOUR_PUBLISHER.claude-terminal-bridge?style=flat-square" alt="VS Marketplace Version">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER.claude-terminal-bridge">
    <img src="https://img.shields.io/visual-studio-marketplace/d/YOUR_PUBLISHER.claude-terminal-bridge?style=flat-square" alt="Downloads">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER.claude-terminal-bridge">
    <img src="https://img.shields.io/visual-studio-marketplace/r/YOUR_PUBLISHER.claude-terminal-bridge?style=flat-square" alt="Rating">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License">
  </a>
</p>

---

## 📖 Overview

**Claude Terminal Bridge** is a VSCode extension that exposes terminal control capabilities through a WebSocket server, enabling AI assistants and MCP (Model Context Protocol) clients to interact with your development environment seamlessly.

Perfect for:
- 🤖 AI-powered development workflows
- 🔧 Automated build and deployment pipelines
- 🧪 Remote testing and continuous integration
- 📊 Development environment monitoring

---

## ✨ Features

### 🎛️ **Full Terminal Control**
Create, manage, and close VSCode terminals remotely through a simple WebSocket API.

### ⚡ **Real-time Command Execution**
Execute shell commands directly from your MCP server with instant feedback.

### 🔌 **WebSocket Server**
Built-in WebSocket server (runs on port 3000 by default) for bidirectional communication.

### 🔄 **Auto-Reconnection**
Automatic reconnection on disconnection ensures your workflows never break.

### 📊 **Visual Status Indicator**
Real-time connection status displayed in the VSCode status bar.

### 🎯 **Multi-Terminal Support**
Manage multiple terminal instances simultaneously with unique identifiers.

---

## 🎬 Demo

<!-- Replace with actual demo -->
<p align="center">
  <img src="images/demo.gif" alt="Claude Terminal Bridge Demo" width="800">
</p>

*Example: Creating a terminal and executing commands via WebSocket*

---

## 🚀 Quick Start

### Installation

1. **Install from VSCode Marketplace** (Recommended)

   Search for "Claude Terminal Bridge" in the Extensions view (`Ctrl+Shift+X`) and click Install.

2. **Or install from VSIX**

   Download the `.vsix` file from [Releases](https://github.com/Gabry848/claude-terminal-bridge/releases) and install via:
   ```
   Extensions → ⋯ → Install from VSIX...
   ```

### Basic Usage

1. **The extension starts automatically** when you open VSCode
2. **Check the status bar** (bottom-right) for connection status:
   - `$(plug) MCP Server Active` = Server is running
   - `$(debug-disconnect) MCP Server Inactive` = Server is stopped
3. **Connect your MCP client** to `ws://localhost:3000`
4. **Start sending commands!**

---

## ⚙️ Configuration

Open VSCode settings (`Ctrl+,`) and search for "Claude Terminal Bridge":

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `claudeTerminalBridge.mcpServerUrl` | string | `ws://localhost:3000` | WebSocket server URL (port is configurable) |
| `claudeTerminalBridge.autoConnect` | boolean | `true` | Automatically start server on VSCode startup |
| `claudeTerminalBridge.silentAutoConnect` | boolean | `true` | Suppress error notifications during auto-start |

### Example `settings.json`

```json
{
  "claudeTerminalBridge.mcpServerUrl": "ws://localhost:3000",
  "claudeTerminalBridge.autoConnect": true,
  "claudeTerminalBridge.silentAutoConnect": true
}
```

---

## 📡 Available Commands

Access these commands via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `Claude Terminal Bridge: Start WebSocket Server` | Start the WebSocket server manually |
| `Claude Terminal Bridge: Stop WebSocket Server` | Stop the WebSocket server |
| `Claude Terminal Bridge: Show Connection Status` | Display current connection status |

---

## 🏗️ Architecture

```
┌─────────────────────┐
│   MCP Client        │  Your AI assistant, automation script,
│   (Your Server)     │  or custom application
└──────────┬──────────┘
           │
           │ WebSocket (JSON)
           │ ws://localhost:3000
           │
┌──────────▼──────────┐
│  VSCode Extension   │  This extension (runs WebSocket server)
│  Terminal Bridge    │
└──────────┬──────────┘
           │
           │ VSCode API
           │
┌──────────▼──────────┐
│  VSCode Terminals   │  Native VSCode terminal instances
└─────────────────────┘
```

> **Note**: Unlike typical MCP setups, this extension **runs the server**. Your MCP client **connects to** this extension.

---

## 🔌 MCP Protocol

### Request Format (Client → Extension)

```json
{
  "type": "create_terminal" | "execute" | "close_terminal" | "ping",
  "id": "unique-request-id",
  "data": {
    // Request-specific data
  }
}
```

### Response Format (Extension → Client)

```json
{
  "type": "terminal_created" | "success" | "error" | "pong",
  "id": "same-request-id",
  "data": {
    // Response-specific data
  }
}
```

### Supported Operations

#### 1. Create Terminal
```json
{
  "type": "create_terminal",
  "id": "terminal-1",
  "data": {
    "terminalName": "Build Terminal"
  }
}
```

#### 2. Execute Command
```json
{
  "type": "execute",
  "id": "cmd-1",
  "data": {
    "command": "npm install",
    "terminalId": "terminal-1"
  }
}
```

#### 3. Close Terminal
```json
{
  "type": "close_terminal",
  "id": "close-1",
  "data": {
    "terminalId": "terminal-1"
  }
}
```

#### 4. Ping
```json
{
  "type": "ping",
  "id": "ping-1"
}
```

### Complete Protocol Documentation

For detailed protocol specifications and implementation examples:

- **[MCP Protocol Specification](mcp_requirements.md)** - Complete request/response reference
- **[MCP Server Implementation Guide](MCP_SERVER_GUIDE.md)** - Step-by-step server setup

---

## 📸 Screenshots

### Status Bar Integration
<img src="images/status-bar-connected.png" alt="Status bar showing connected state" width="400">

### Terminal Creation
<img src="images/terminal-creation.png" alt="Terminal being created via WebSocket" width="600">

### Command Execution
<img src="images/command-execution.png" alt="Commands being executed in terminal" width="600">

### Output Channel Logs
<img src="images/output-channel.png" alt="Extension logs in Output channel" width="600">

---

## 🛠️ Development

### Prerequisites

- Node.js 18+
- VSCode 1.104.0+
- TypeScript 5.9+

### Setup

```bash
# Clone the repository
git clone https://github.com/Gabry848/claude-terminal-bridge.git
cd claude-terminal-bridge

# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

### Running in Development

1. Open the project in VSCode
2. Press `F5` to launch Extension Development Host
3. The extension will be loaded in a new VSCode window
4. View logs: `View` → `Output` → `Claude Terminal Bridge`

### Testing

```bash
# Run linter
npm run lint

# Run tests
npm test

# Watch mode
npm run watch
```

### Building VSIX

```bash
# Install vsce (first time only)
npm install -g @vscode/vsce

# Create package
vsce package

# Output: claude-terminal-bridge-X.X.X.vsix
```

---

## 📝 Technical Notes

### ⚠️ VSCode API Limitations

**Important**: The VSCode Terminal API does not provide direct access to terminal output.

| Feature | Status |
|---------|--------|
| Send commands to terminal | ✅ Supported |
| Receive command execution confirmation | ✅ Supported |
| Capture real-time terminal output | ❌ Not supported by VSCode API |

**Workaround**: To capture output, you would need to implement a custom Pseudoterminal with `vscode.window.createTerminal({ pty: customPty })`.

### Terminal ID Management

- When creating a terminal, the request `id` becomes the `terminalId`
- Store the returned `terminalId` for subsequent operations
- Terminal IDs are unique per terminal instance
- Terminals are automatically cleaned up when closed

### Auto-Reconnection Behavior

- Reconnection attempts occur every 5 seconds
- Only active when `autoConnect` is enabled
- Failed attempts are silent when `silentAutoConnect` is true

---

## 🐛 Troubleshooting

<details>
<summary><strong>Server won't start</strong></summary>

- Check if port 3000 is already in use: `netstat -an | findstr 3000` (Windows) or `lsof -i :3000` (Mac/Linux)
- Try changing the port in settings
- Check firewall rules
- View logs in Output Channel: `View` → `Output` → `Claude Terminal Bridge`
</details>

<details>
<summary><strong>Client can't connect</strong></summary>

- Verify the extension is running (check status bar)
- Ensure the WebSocket URL is correct (`ws://localhost:3000`)
- Disable any proxy settings that might interfere
- Check VSCode settings for the correct port configuration
</details>

<details>
<summary><strong>Commands not executing</strong></summary>

- Verify the terminal was created successfully
- Check that you're using the correct `terminalId`
- Ensure JSON message format is valid
- Look for error responses from the extension
</details>

<details>
<summary><strong>Status bar not updating</strong></summary>

- Reload VSCode window (`Ctrl+R` or `Cmd+R`)
- Disable and re-enable the extension
- Check for conflicting extensions
</details>

---

## 🔒 Security Considerations

⚠️ **Important**: This extension allows remote command execution in VSCode terminals.

**Recommendations:**
- ✅ Use only in trusted development environments
- ✅ Implement authentication in your MCP client
- ✅ Use WSS (secure WebSocket) in production
- ✅ Validate and sanitize all commands
- ✅ Run in isolated/sandboxed environments when possible
- ❌ Do not expose to public networks
- ❌ Do not use with untrusted MCP clients

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [VSCode Extension API](https://code.visualstudio.com/api) - VSCode documentation
- [ws](https://github.com/websockets/ws) - WebSocket library

---

## 📞 Support & Feedback

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Gabry848/claude-terminal-bridge/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/Gabry848/claude-terminal-bridge/discussions)
- ⭐ **Rate on Marketplace**: [Leave a Review](https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER.claude-terminal-bridge)
- 📧 **Email**: your.email@example.com

---

## 🗺️ Roadmap

- [ ] Real-time output capture using Pseudoterminal
- [ ] Built-in authentication support
- [ ] Terminal session persistence
- [ ] Command history and replay
- [ ] Multi-workspace support
- [ ] WebSocket Secure (WSS) support
- [ ] Terminal output streaming API
- [ ] Performance metrics and monitoring

---

<p align="center">
  Made with ❤️ for the VSCode community
</p>

<p align="center">
  <a href="https://github.com/Gabry848/claude-terminal-bridge">GitHub</a> •
  <a href="https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER.claude-terminal-bridge">Marketplace</a> •
  <a href="CHANGELOG.md">Changelog</a>
</p>
