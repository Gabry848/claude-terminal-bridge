# Node.js MCP Client Example

A complete, interactive MCP client for controlling VSCode terminals through Claude Terminal Bridge.

## 📋 Prerequisites

- Node.js 18+
- VSCode with Claude Terminal Bridge extension installed
- The extension must be running (check status bar)

## 🚀 Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the server**

   ```bash
   npm start
   ```

3. **Use the interactive menu**

   ```
   ╔════════════════════════════════════════╗
   ║   Claude Terminal Bridge MCP Client   ║
   ╚════════════════════════════════════════╝

   Commands:
     1 - Create new terminal
     2 - Execute command
     3 - Close terminal
     4 - List terminals
     5 - Send ping
     q - Quit
   ```

## 💻 Usage Examples

### Create a Terminal

1. Press `1`
2. Enter terminal name (e.g., "Build Terminal")
3. Terminal will be created in VSCode

### Execute Commands

1. Press `2`
2. Enter terminal ID (or press Enter for default)
3. Enter the command (e.g., `npm install`, `git status`)
4. Command will execute in the VSCode terminal

### Manage Terminals

- Press `4` to list all active terminals
- Press `3` to close a specific terminal
- Press `5` to test the connection with a ping

## 🔧 Configuration

Edit the connection URL in `server.js`:

```javascript
const client = new MCPClient('ws://localhost:3000');
```

## 📝 Code Structure

- **MCPClient class**: Handles WebSocket connection and protocol
- **Interactive CLI**: Provides user-friendly command interface
- **Message handling**: Processes all response types from the extension

## 🐛 Troubleshooting

**Connection refused**
- Verify VSCode is running
- Check extension is active (status bar should show "MCP Server Active")
- Ensure port 3000 is not blocked by firewall

**Commands not executing**
- Create a terminal first (option 1)
- Use the correct terminal ID
- Check VSCode Output Channel for errors

## 📚 Next Steps

- Modify `server.js` to add custom commands
- Integrate with your own automation workflows
- Build CI/CD pipelines using this client
