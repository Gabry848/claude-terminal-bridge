// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import WebSocket, { WebSocketServer } from 'ws';

interface MCPRequest {
	type: 'execute' | 'create_terminal' | 'close_terminal' | 'ping';
	id: string;
	data?: {
		command?: string;
		terminalName?: string;
		terminalId?: string;
	};
}

interface MCPResponse {
	type: 'output' | 'error' | 'success' | 'pong' | 'terminal_created';
	id: string;
	data?: {
		output?: string;
		error?: string;
		terminalId?: string;
		terminalName?: string;
	};
}

class TerminalBridge {
	private wss: WebSocketServer | null = null;
	private clients: Set<WebSocket> = new Set();
	private terminals: Map<string, vscode.Terminal> = new Map();
	private selectedTerminal: vscode.Terminal | null = null;
	private outputChannel: vscode.OutputChannel;
	private statusBarItem: vscode.StatusBarItem;
	private isConnected: boolean = false;

	constructor(private context: vscode.ExtensionContext) {
		this.outputChannel = vscode.window.createOutputChannel('Claude Terminal Bridge');
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.statusBarItem.command = 'claude-terminal-bridge.status';
		this.context.subscriptions.push(this.statusBarItem);
		this.updateStatusBar();

		// Monitor terminal closure
		vscode.window.onDidCloseTerminal((terminal) => {
			// Clear selected terminal if it was closed
			if (this.selectedTerminal === terminal) {
				this.selectedTerminal = null;
				this.log('Selected terminal was closed');
				this.updateStatusBar();
			}

			for (const [id, term] of this.terminals.entries()) {
				if (term === terminal) {
					this.terminals.delete(id);
					this.log(`Terminal ${id} closed`);
					break;
				}
			}
		});
	}

	private log(message: string) {
		const timestamp = new Date().toISOString();
		this.outputChannel.appendLine(`[${timestamp}] ${message}`);
	}

	private updateStatusBar() {
		const terminalInfo = this.selectedTerminal
			? ` | Terminal: ${this.selectedTerminal.name}`
			: ' | No terminal selected';

		if (this.isConnected) {
			this.statusBarItem.text = `$(plug) MCP Connected${terminalInfo}`;
			this.statusBarItem.backgroundColor = undefined;
			this.statusBarItem.tooltip = `Connected to MCP Server\n${this.selectedTerminal ? `Selected: ${this.selectedTerminal.name}` : 'No terminal selected'}`;
		} else {
			this.statusBarItem.text = `$(debug-disconnect) MCP Disconnected${terminalInfo}`;
			this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
			this.statusBarItem.tooltip = `Disconnected from MCP Server\n${this.selectedTerminal ? `Selected: ${this.selectedTerminal.name}` : 'No terminal selected'}`;
		}
		this.statusBarItem.show();
	}

	async connect(port?: number, silent: boolean = false): Promise<void> {
		if (this.wss) {
			if (!silent) {
				vscode.window.showWarningMessage('Server is already running');
			}
			return;
		}

		const config = vscode.workspace.getConfiguration('claudeTerminalBridge');
		const serverPort = port || this.parsePort(config.get<string>('mcpServerUrl') || 'ws://localhost:3000');

		if (!silent) {
			this.log(`Starting WebSocket server on port ${serverPort}...`);
		}

		return new Promise((resolve, reject) => {
			try {
				this.wss = new WebSocketServer({ port: serverPort });

				this.wss.on('listening', () => {
					this.isConnected = true;
					this.updateStatusBar();
					this.log(`WebSocket server listening on port ${serverPort}`);
					vscode.window.showInformationMessage(`✓ WebSocket server started on port ${serverPort}`);
					resolve();
				});

				this.wss.on('connection', (ws: WebSocket) => {
					this.log('Client connected');
					this.clients.add(ws);

					ws.on('message', (data: WebSocket.Data) => {
						this.handleMessage(data.toString(), ws);
					});

					ws.on('error', (error: Error) => {
						this.log(`Client error: ${error.message}`);
					});

					ws.on('close', () => {
						this.log('Client disconnected');
						this.clients.delete(ws);
					});
				});

				this.wss.on('error', (error: Error) => {
					if (!silent) {
						this.log(`Server error: ${error.message}`);
					}
					this.isConnected = false;
					this.updateStatusBar();
					reject(error);
				});

			} catch (error) {
				if (!silent) {
					this.log(`Failed to start server: ${error}`);
				}
				reject(error);
			}
		});
	}

	private parsePort(url: string): number {
		try {
			const urlObj = new URL(url);
			return parseInt(urlObj.port) || 3000;
		} catch {
			return 3000;
		}
	}

	disconnect() {
		if (this.wss) {
			// Close all client connections
			for (const client of this.clients) {
				client.close();
			}
			this.clients.clear();

			// Close the server
			this.wss.close(() => {
				this.log('WebSocket server stopped');
			});
			this.wss = null;
			this.isConnected = false;
			this.updateStatusBar();
			vscode.window.showInformationMessage('WebSocket server stopped');
		}
	}

	private handleMessage(message: string, client: WebSocket) {
		try {
			const request: MCPRequest = JSON.parse(message);
			this.log(`Received request: ${request.type} (ID: ${request.id})`);

			switch (request.type) {
				case 'ping':
					this.sendResponse({
						type: 'pong',
						id: request.id
					}, client);
					break;

				case 'create_terminal':
					this.handleCreateTerminal(request, client);
					break;

				case 'execute':
					this.handleExecute(request, client);
					break;

				case 'close_terminal':
					this.handleCloseTerminal(request, client);
					break;

				default:
					this.sendResponse({
						type: 'error',
						id: request.id,
						data: { error: `Unknown request type: ${request.type}` }
					}, client);
			}
		} catch (error) {
			this.log(`Error handling message: ${error}`);
		}
	}

	private handleCreateTerminal(request: MCPRequest, client: WebSocket) {
		try {
			const terminalName = request.data?.terminalName || `MCP Terminal ${this.terminals.size + 1}`;
			const terminal = vscode.window.createTerminal({
				name: terminalName,
				hideFromUser: false
			});

			const terminalId = request.id;
			this.terminals.set(terminalId, terminal);
			terminal.show();

			this.log(`Created terminal: ${terminalName} (ID: ${terminalId})`);

			this.sendResponse({
				type: 'terminal_created',
				id: request.id,
				data: {
					terminalId: terminalId,
					terminalName: terminalName
				}
			}, client);
		} catch (error) {
			this.sendResponse({
				type: 'error',
				id: request.id,
				data: { error: `Failed to create terminal: ${error}` }
			}, client);
		}
	}

	private async handleExecute(request: MCPRequest, client: WebSocket) {
		try {
			const command = request.data?.command;

			if (!command) {
				this.sendResponse({
					type: 'error',
					id: request.id,
					data: { error: 'No command provided' }
				}, client);
				return;
			}

			if (!this.selectedTerminal) {
				this.sendResponse({
					type: 'error',
					id: request.id,
					data: { error: 'No terminal selected. Please select a terminal first using the "Select Terminal" command.' }
				}, client);
				return;
			}

			this.selectedTerminal.show();
			this.selectedTerminal.sendText(command);

			this.log(`Executed command on ${this.selectedTerminal.name}: ${command}`);

			// Simulate output capture (VSCode API doesn't provide direct terminal output access)
			// In a real implementation, you'd need to use a custom pseudoterminal
			this.sendResponse({
				type: 'success',
				id: request.id,
				data: {
					output: `Command executed on ${this.selectedTerminal.name}: ${command}\nNote: Direct output capture requires custom pseudoterminal implementation.`
				}
			}, client);

		} catch (error) {
			this.sendResponse({
				type: 'error',
				id: request.id,
				data: { error: `Failed to execute command: ${error}` }
			}, client);
		}
	}

	private handleCloseTerminal(request: MCPRequest, client: WebSocket) {
		try {
			const terminalId = request.data?.terminalId;

			if (!terminalId) {
				this.sendResponse({
					type: 'error',
					id: request.id,
					data: { error: 'No terminal ID provided' }
				}, client);
				return;
			}

			const terminal = this.terminals.get(terminalId);
			if (terminal) {
				terminal.dispose();
				this.terminals.delete(terminalId);
				this.log(`Closed terminal: ${terminalId}`);

				this.sendResponse({
					type: 'success',
					id: request.id,
					data: { output: `Terminal ${terminalId} closed` }
				}, client);
			} else {
				this.sendResponse({
					type: 'error',
					id: request.id,
					data: { error: `Terminal ${terminalId} not found` }
				}, client);
			}
		} catch (error) {
			this.sendResponse({
				type: 'error',
				id: request.id,
				data: { error: `Failed to close terminal: ${error}` }
			}, client);
		}
	}

	private sendResponse(response: MCPResponse, client: WebSocket) {
		if (client && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(response));
			this.log(`Sent response: ${response.type} (ID: ${response.id})`);
		}
	}

	async selectTerminal() {
		const terminals = vscode.window.terminals;

		if (terminals.length === 0) {
			vscode.window.showWarningMessage('No terminals available. Please create a terminal first.');
			return;
		}

		const items = terminals.map(terminal => ({
			label: terminal.name,
			terminal: terminal
		}));

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: 'Select a terminal for MCP commands'
		});

		if (selected) {
			this.selectedTerminal = selected.terminal;
			this.log(`Selected terminal: ${selected.terminal.name}`);
			this.updateStatusBar();
			vscode.window.showInformationMessage(`✓ Terminal selected: ${selected.terminal.name}`);
		}
	}

	selectTerminalFromContext(terminal: vscode.Terminal) {
		this.selectedTerminal = terminal;
		this.log(`Selected terminal from context menu: ${terminal.name}`);
		this.updateStatusBar();
		vscode.window.showInformationMessage(`✓ Terminal selected: ${terminal.name}`);
	}

	showStatus() {
		const terminalCount = this.terminals.size;
		const status = this.isConnected ? 'Connected' : 'Disconnected';
		const config = vscode.workspace.getConfiguration('claudeTerminalBridge');
		const serverUrl = config.get<string>('mcpServerUrl');
		const selectedTerminalName = this.selectedTerminal ? this.selectedTerminal.name : 'None';

		const message = `
Claude Terminal Bridge Status:
- Connection: ${status}
- Server URL: ${serverUrl}
- Selected Terminal: ${selectedTerminalName}
- Active Terminals: ${terminalCount}
		`;

		vscode.window.showInformationMessage(message.trim());
		this.outputChannel.show();
	}

	dispose() {
		this.disconnect();
		this.outputChannel.dispose();
		this.statusBarItem.dispose();
		
		// Close all managed terminals
		for (const terminal of this.terminals.values()) {
			terminal.dispose();
		}
		this.terminals.clear();
	}
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Claude Terminal Bridge is now active!');

	const bridge = new TerminalBridge(context);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('claude-terminal-bridge.connect', async () => {
			try {
				await bridge.connect();
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to connect: ${error}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('claude-terminal-bridge.disconnect', () => {
			bridge.disconnect();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('claude-terminal-bridge.status', () => {
			bridge.showStatus();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('claude-terminal-bridge.selectTerminal', async () => {
			await bridge.selectTerminal();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('claude-terminal-bridge.selectTerminalFromContext', (terminal: vscode.Terminal) => {
			bridge.selectTerminalFromContext(terminal);
		})
	);

	// Auto-connect on startup if configured
	const config = vscode.workspace.getConfiguration('claudeTerminalBridge');
	if (config.get<boolean>('autoConnect')) {
		const silentMode = config.get<boolean>('silentAutoConnect', true);
		setTimeout(() => {
			bridge.connect(undefined, silentMode).catch((error) => {
				if (!silentMode) {
					console.error('Auto-connect failed:', error);
				}
			});
		}, 1000);
	}

	// Clean up on deactivation
	context.subscriptions.push({
		dispose: () => bridge.dispose()
	});
}

// This method is called when your extension is deactivated
export function deactivate() {
	console.log('Claude Terminal Bridge deactivated');
}
