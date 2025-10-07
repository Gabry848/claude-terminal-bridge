#!/usr/bin/env python3
"""
Example MCP Client for Claude Terminal Bridge (Python)

This client connects to the VSCode extension and provides an interactive
CLI for controlling terminals.
"""

import asyncio
import json
import sys
from datetime import datetime
import websockets


class MCPClient:
    def __init__(self, url="ws://localhost:3000"):
        self.url = url
        self.ws = None
        self.terminals = {}  # Store created terminal IDs
        self.connected = False

    async def connect(self):
        """Connect to the VSCode extension WebSocket server"""
        print(f"🔌 Connecting to {self.url}...")

        try:
            self.ws = await websockets.connect(self.url)
            self.connected = True
            print("✅ Connected to Claude Terminal Bridge!")

            # Start message handler
            asyncio.create_task(self.message_handler())

            # Send initial ping
            await self.send_ping()

        except Exception as e:
            print(f"❌ Connection error: {e}")
            print("\n💡 Make sure:")
            print("  1. VSCode is running")
            print("  2. Claude Terminal Bridge extension is installed and active")
            print("  3. The extension is listening on port 3000")
            sys.exit(1)

    async def message_handler(self):
        """Handle incoming messages from the extension"""
        try:
            async for message in self.ws:
                await self.handle_message(message)
        except websockets.exceptions.ConnectionClosed:
            print("\n❌ Disconnected from server")
            self.connected = False

    async def handle_message(self, message):
        """Process incoming messages"""
        try:
            response = json.loads(message)
            msg_type = response.get("type")
            msg_id = response.get("id")

            print(f"\n📨 Response: {msg_type} (id: {msg_id})")

            if msg_type == "pong":
                print("🏓 Pong received - connection is alive")

            elif msg_type == "terminal_created":
                name = response["data"]["terminalName"]
                term_id = response["data"]["terminalId"]
                print(f"✅ Terminal created: \"{name}\"")
                print(f"   Terminal ID: {term_id}")
                self.terminals[term_id] = name

            elif msg_type == "success":
                output = response["data"]["output"]
                print(f"✅ Success: {output}")

            elif msg_type == "error":
                error = response["data"]["error"]
                print(f"❌ Error: {error}")

            else:
                print(f"📦 Unknown response type: {response}")

        except json.JSONDecodeError as e:
            print(f"Failed to parse message: {e}")

    async def send_message(self, msg_type, data=None):
        """Send a message to the extension"""
        if not self.connected:
            print("❌ Not connected to server")
            return

        message = {
            "type": msg_type,
            "id": f"{msg_type}-{datetime.now().timestamp()}",
            "data": data or {}
        }

        print(f"\n📤 Sending: {msg_type}")
        await self.ws.send(json.dumps(message))

    async def send_ping(self):
        """Send a ping message"""
        await self.send_message("ping")

    async def create_terminal(self, name):
        """Create a new terminal"""
        await self.send_message("create_terminal", {"terminalName": name})

    async def execute_command(self, command, terminal_id=None):
        """Execute a command in a terminal"""
        data = {"command": command}
        if terminal_id:
            data["terminalId"] = terminal_id
        await self.send_message("execute", data)

    async def close_terminal(self, terminal_id):
        """Close a terminal"""
        await self.send_message("close_terminal", {"terminalId": terminal_id})
        if terminal_id in self.terminals:
            del self.terminals[terminal_id]

    def list_terminals(self):
        """List all active terminals"""
        print("\n📋 Active Terminals:")
        if not self.terminals:
            print("   (none)")
        else:
            for term_id, name in self.terminals.items():
                print(f"   - {name} (ID: {term_id})")

    @staticmethod
    def show_menu():
        """Display the interactive menu"""
        print("\n╔════════════════════════════════════════╗")
        print("║   Claude Terminal Bridge MCP Client   ║")
        print("╚════════════════════════════════════════╝")
        print("\nCommands:")
        print("  1 - Create new terminal")
        print("  2 - Execute command")
        print("  3 - Close terminal")
        print("  4 - List terminals")
        print("  5 - Send ping")
        print("  q - Quit")


async def main():
    """Main execution function"""
    client = MCPClient("ws://localhost:3000")
    await client.connect()

    client.show_menu()

    # Interactive CLI loop
    while True:
        try:
            command = await asyncio.get_event_loop().run_in_executor(
                None, input, "\nEnter command: "
            )
            command = command.strip()

            if command == "1":
                name = await asyncio.get_event_loop().run_in_executor(
                    None, input, "Terminal name: "
                )
                await client.create_terminal(name or "MCP Terminal")

            elif command == "2":
                if not client.terminals:
                    print("❌ No terminals available. Create one first.")
                    client.show_menu()
                    continue

                client.list_terminals()
                term_id = await asyncio.get_event_loop().run_in_executor(
                    None, input, "Terminal ID (or press Enter for default): "
                )
                cmd = await asyncio.get_event_loop().run_in_executor(
                    None, input, "Command to execute: "
                )
                await client.execute_command(cmd, term_id or None)

            elif command == "3":
                if not client.terminals:
                    print("❌ No terminals available.")
                    client.show_menu()
                    continue

                client.list_terminals()
                term_id = await asyncio.get_event_loop().run_in_executor(
                    None, input, "Terminal ID to close: "
                )
                if term_id in client.terminals:
                    await client.close_terminal(term_id)
                else:
                    print("❌ Invalid terminal ID")
                    client.show_menu()

            elif command == "4":
                client.list_terminals()
                client.show_menu()

            elif command == "5":
                await client.send_ping()

            elif command == "q":
                print("\n👋 Goodbye!")
                break

            else:
                print("❌ Invalid command")
                client.show_menu()

        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
