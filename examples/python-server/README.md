# Python MCP Client Example

A complete, interactive MCP client for controlling VSCode terminals through Claude Terminal Bridge.

## 📋 Prerequisites

- Python 3.8+
- VSCode with Claude Terminal Bridge extension installed
- The extension must be running (check status bar)

## 🚀 Quick Start

1. **Create virtual environment** (recommended)

   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Run the client**

   ```bash
   python server.py
   ```

4. **Use the interactive menu**

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
2. Enter terminal name (e.g., "Python Build")
3. Terminal will be created in VSCode

### Execute Commands

1. Press `2`
2. Enter terminal ID (or press Enter for default)
3. Enter the command (e.g., `pip install`, `pytest`)
4. Command will execute in the VSCode terminal

### Manage Terminals

- Press `4` to list all active terminals
- Press `3` to close a specific terminal
- Press `5` to test the connection with a ping

## 🔧 Configuration

Edit the connection URL in `server.py`:

```python
client = MCPClient("ws://localhost:3000")
```

## 📝 Code Structure

- **MCPClient class**: Handles WebSocket connection using `websockets` library
- **Async message handler**: Processes responses in real-time
- **Interactive CLI**: Provides user-friendly command interface

## 🐛 Troubleshooting

**Connection refused**
- Verify VSCode is running
- Check extension is active (status bar should show "MCP Server Active")
- Ensure port 3000 is not blocked by firewall

**Commands not executing**
- Create a terminal first (option 1)
- Use the correct terminal ID
- Check VSCode Output Channel for errors

**Import errors**
- Make sure you activated the virtual environment
- Run `pip install -r requirements.txt`

## 📚 Next Steps

- Modify `server.py` to add custom commands
- Integrate with your Python scripts
- Build test automation using this client
- Use with CI/CD pipelines
