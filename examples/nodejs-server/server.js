import WebSocket from 'ws';
import readline from 'readline';

/**
 * Example MCP Server for Claude Terminal Bridge
 *
 * This server connects to the VSCode extension and allows you to
 * control terminals interactively via the command line.
 */

class MCPClient {
  constructor(url = 'ws://localhost:3000') {
    this.url = url;
    this.ws = null;
    this.terminals = new Map(); // Store created terminal IDs
    this.connected = false;
  }

  connect() {
    console.log(`🔌 Connecting to ${this.url}...`);

    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log('✅ Connected to Claude Terminal Bridge!');
      this.connected = true;
      this.sendPing();
      this.showMenu();
    });

    this.ws.on('message', (data) => {
      this.handleMessage(data.toString());
    });

    this.ws.on('close', () => {
      console.log('❌ Disconnected from server');
      this.connected = false;
    });

    this.ws.on('error', (error) => {
      console.error('❌ Connection error:', error.message);
      console.log('\n💡 Make sure:');
      console.log('  1. VSCode is running');
      console.log('  2. Claude Terminal Bridge extension is installed and active');
      console.log('  3. The extension is listening on port 3000');
      process.exit(1);
    });
  }

  handleMessage(message) {
    try {
      const response = JSON.parse(message);
      console.log(`\n📨 Response: ${response.type} (id: ${response.id})`);

      switch (response.type) {
        case 'pong':
          console.log('🏓 Pong received - connection is alive');
          break;

        case 'terminal_created':
          console.log(`✅ Terminal created: "${response.data.terminalName}"`);
          console.log(`   Terminal ID: ${response.data.terminalId}`);
          this.terminals.set(response.data.terminalId, response.data.terminalName);
          break;

        case 'success':
          console.log(`✅ Success: ${response.data.output}`);
          break;

        case 'error':
          console.error(`❌ Error: ${response.data.error}`);
          break;

        default:
          console.log('📦 Unknown response type:', response);
      }

      this.showMenu();
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  sendMessage(type, data = {}) {
    if (!this.connected) {
      console.error('❌ Not connected to server');
      return;
    }

    const message = {
      type,
      id: `${type}-${Date.now()}`,
      data
    };

    console.log(`\n📤 Sending: ${type}`);
    this.ws.send(JSON.stringify(message));
  }

  sendPing() {
    this.sendMessage('ping');
  }

  createTerminal(name) {
    this.sendMessage('create_terminal', { terminalName: name });
  }

  executeCommand(command, terminalId) {
    this.sendMessage('execute', { command, terminalId });
  }

  closeTerminal(terminalId) {
    this.sendMessage('close_terminal', { terminalId });
    this.terminals.delete(terminalId);
  }

  listTerminals() {
    console.log('\n📋 Active Terminals:');
    if (this.terminals.size === 0) {
      console.log('   (none)');
    } else {
      this.terminals.forEach((name, id) => {
        console.log(`   - ${name} (ID: ${id})`);
      });
    }
  }

  showMenu() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Claude Terminal Bridge MCP Client   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\nCommands:');
    console.log('  1 - Create new terminal');
    console.log('  2 - Execute command');
    console.log('  3 - Close terminal');
    console.log('  4 - List terminals');
    console.log('  5 - Send ping');
    console.log('  q - Quit');
    console.log('\nEnter command: ');
  }
}

// Main execution
const client = new MCPClient('ws://localhost:3000');
client.connect();

// Interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', async (input) => {
  const command = input.trim();

  switch (command) {
    case '1':
      rl.question('Terminal name: ', (name) => {
        client.createTerminal(name || 'MCP Terminal');
      });
      break;

    case '2':
      if (client.terminals.size === 0) {
        console.log('❌ No terminals available. Create one first.');
        client.showMenu();
        break;
      }

      client.listTerminals();
      rl.question('Terminal ID (or press Enter for default): ', (terminalId) => {
        rl.question('Command to execute: ', (cmd) => {
          client.executeCommand(cmd, terminalId || undefined);
        });
      });
      break;

    case '3':
      if (client.terminals.size === 0) {
        console.log('❌ No terminals available.');
        client.showMenu();
        break;
      }

      client.listTerminals();
      rl.question('Terminal ID to close: ', (terminalId) => {
        if (client.terminals.has(terminalId)) {
          client.closeTerminal(terminalId);
        } else {
          console.log('❌ Invalid terminal ID');
          client.showMenu();
        }
      });
      break;

    case '4':
      client.listTerminals();
      client.showMenu();
      break;

    case '5':
      client.sendPing();
      break;

    case 'q':
      console.log('\n👋 Goodbye!');
      process.exit(0);

    default:
      console.log('❌ Invalid command');
      client.showMenu();
  }
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  process.exit(0);
});
