# Claude Terminal Bridge

Allow Claude to control your VSCode terminal via MCP

---

<!-- Add screenshots/demo GIF here -->
![Demo](images/demo.gif)

<!-- Add usage video here -->
[![Watch the demo](images/video-thumbnail.png)](https://youtu.be/YOUR_VIDEO_ID)

---

## 🚀 Features

- **Seamless Integration**: Let Claude AI execute commands directly in your VSCode terminal
- **Real-time Communication**: Instant command execution and output streaming
- **Safe & Controlled**: You maintain full visibility and control over executed commands
- **Collaborative Workflow**: Work alongside Claude in the same terminal environment

## 📋 Prerequisites

Before installing this extension, you need to set up the MCP server:

1. **Install the MCP Server** from the companion repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/claude-terminal-mcp-server
   cd claude-terminal-mcp-server
   npm install
   ```

2. **Configure Claude Desktop** to connect to the MCP server by adding this to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "terminal": {
         "command": "node",
         "args": ["/path/to/claude-terminal-mcp-server/dist/index.js"]
       }
     }
   }
   ```

   The config file location:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

## 📦 Installation

### From VSCode Marketplace (Recommended)
1. Open VSCode
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Claude Terminal Bridge"
4. Click **Install**

### From VSIX file
1. Download the `.vsix` file from [Releases](https://github.com/YOUR_USERNAME/vscode-claude-terminal-bridge/releases)
2. Open VSCode
3. Go to Extensions
4. Click `...` → "Install from VSIX..."
5. Select the downloaded file

## ⚙️ Configuration

Access settings via `File > Preferences > Settings` and search for "MCP Terminal":

| Setting | Default | Description |
|---------|---------|-------------|
| `mcpTerminal.port` | `3000` | WebSocket port for communication with MCP server |
| `mcpTerminal.autoStart` | `true` | Automatically start the bridge when VSCode opens |
| `mcpTerminal.autoConnect` | `true` | Automatically connect to MCP server on startup |

## 🎯 Usage

### Starting the Bridge

1. **Automatic** (if `autoStart` is enabled): The extension starts automatically when you open VSCode
2. **Manual**: Use Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run:
   - `MCP Terminal: Start Server`

### Using with Claude

Once both the extension and MCP server are running:

1. Open Claude Desktop
2. Start a conversation
3. Ask Claude to execute terminal commands, for example:
   - "Can you run `npm install` in my terminal?"
   - "Execute `git status` and show me the output"
   - "Run the tests with `npm test`"

Claude will execute the commands in your VSCode terminal and show you the results!

### Monitoring Connection

Check the status bar at the bottom of VSCode:
- 🟢 **Connected**: Bridge is active and ready
- 🟡 **Connecting**: Attempting to establish connection
- 🔴 **Disconnected**: Bridge is not running or MCP server is unreachable

## 🛠️ How It Works

```
┌─────────────────┐
│  Claude Desktop │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│   MCP Server    │ ← You need to install this separately
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│ VSCode Extension│ ← This extension
└────────┬────────┘
         │ VSCode API
         ▼
┌─────────────────┐
│  VSCode Terminal│
└─────────────────┘
```

## 🔧 Commands

Available commands via Command Palette:

- `MCP Terminal: Start Server` - Start the terminal bridge
- `MCP Terminal: Stop Server` - Stop the terminal bridge
- `MCP Terminal: Reconnect` - Reconnect to MCP server
- `MCP Terminal: Show Status` - Display connection status

## 🐛 Troubleshooting

### Extension not connecting
1. Verify the MCP server is running
2. Check the port number matches in both configurations
3. Look for errors in Output panel: `View > Output > MCP Terminal`

### Claude can't execute commands
1. Ensure `claude_desktop_config.json` is correctly configured
2. Restart Claude Desktop after configuration changes
3. Check that the MCP server path is absolute and correct

### Commands not executing
1. Make sure a terminal is open in VSCode
2. Check the Output panel for error messages
3. Try stopping and restarting the bridge

### View Logs
- Extension logs: `View > Output > MCP Terminal`
- MCP Server logs: Check the terminal where you started the server

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [MCP Server Repository](https://github.com/YOUR_USERNAME/claude-terminal-mcp-server) - Required companion server
- [Model Context Protocol](https://modelcontextprotocol.io/) - Learn more about MCP

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/vscode-claude-terminal-bridge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/vscode-claude-terminal-bridge/discussions)

## ⚠️ Security Note

This extension allows Claude AI to execute commands in your terminal. Always review the commands Claude suggests before they are executed. Use in trusted environments only.

---

Made with ❤️ for the Claude community