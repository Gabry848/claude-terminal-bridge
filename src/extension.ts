// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import WebSocket from 'ws';

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
	private ws: WebSocket | null = null;
	private terminals: Map<string, vscode.Terminal> = new Map();
	private outputChannel: vscode.OutputChannel;
	private statusBarItem: vscode.StatusBarItem;
	private isConnected: boolean = false;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private outputBuffers: Map<string, string> = new Map();

	constructor(private context: vscode.ExtensionContext) {
		this.outputChannel = vscode.window.createOutputChannel('Claude Terminal Bridge');
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		this.statusBarItem.command = 'claude-terminal-bridge.status';
		this.context.subscriptions.push(this.statusBarItem);
		this.updateStatusBar();

		// Monitor terminal closure
		vscode.window.onDidCloseTerminal((terminal) => {
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
		if (this.isConnected) {
			this.statusBarItem.text = '$(plug) MCP Connected';
			this.statusBarItem.backgroundColor = undefined;
			this.statusBarItem.tooltip = 'Connected to MCP Server';
		} else {
			this.statusBarItem.text = '$(debug-disconnect) MCP Disconnected';
			this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
			this.statusBarItem.tooltip = 'Disconnected from MCP Server';
		}
		this.statusBarItem.show();
	}

	async connect(url?: string): Promise<void> {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			vscode.window.showWarningMessage('Already connected to MCP server');
			return;
		}

		const config = vscode.workspace.getConfiguration('claudeTerminalBridge');
		const serverUrl = url || config.get<string>('mcpServerUrl') || 'ws://localhost:3000';

		this.log(`Connecting to MCP server at ${serverUrl}...`);

		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(serverUrl);
				const ws = this.ws; // Non-null reference per TypeScript

				ws.on('open', () => {
					this.isConnected = true;
					this.updateStatusBar();
					this.log('Connected to MCP server');
					vscode.window.showInformationMessage('Connected to MCP server');
					resolve();
				});

				ws.on('message', (data: WebSocket.Data) => {
					this.handleMessage(data.toString());
				});

				ws.on('error', (error) => {
					this.log(`WebSocket error: ${error.message}`);
					this.isConnected = false;
					this.updateStatusBar();
					reject(error);
				});

				ws.on('close', () => {
					this.isConnected = false;
					this.updateStatusBar();
					this.log('Disconnected from MCP server');
					
					// Auto-reconnect after 5 seconds
					const config = vscode.workspace.getConfiguration('claudeTerminalBridge');
					if (config.get<boolean>('autoConnect')) {
						this.scheduleReconnect(serverUrl);
					}
				});

			} catch (error) {
				this.log(`Failed to connect: ${error}`);
				reject(error);
			}
		});
	}

	private scheduleReconnect(url: string) {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}

		this.reconnectTimer = setTimeout(() => {
			this.log('Attempting to reconnect...');
			this.connect(url).catch((error) => {
				this.log(`Reconnection failed: ${error.message}`);
			});
		}, 5000);
	}

	disconnect() {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
			this.isConnected = false;
			this.updateStatusBar();
			this.log('Disconnected from MCP server');
			vscode.window.showInformationMessage('Disconnected from MCP server');
		}
	}

	private handleMessage(message: string) {
		try {
			const request: MCPRequest = JSON.parse(message);
			this.log(`Received request: ${request.type} (ID: ${request.id})`);

			switch (request.type) {
				case 'ping':
					this.sendResponse({
						type: 'pong',
						id: request.id
					});
					break;

				case 'create_terminal':
					this.handleCreateTerminal(request);
					break;

				case 'execute':
					this.handleExecute(request);
					break;

				case 'close_terminal':
					this.handleCloseTerminal(request);
					break;

				default:
					this.sendResponse({
						type: 'error',
						id: request.id,
						data: { error: `Unknown request type: ${request.type}` }
					});
			}
		} catch (error) {
			this.log(`Error handling message: ${error}`);
		}
	}

	private handleCreateTerminal(request: MCPRequest) {
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
			});
		} catch (error) {
			this.sendResponse({
				type: 'error',
				id: request.id,
				data: { error: `Failed to create terminal: ${error}` }
			});
		}
	}

	private async handleExecute(request: MCPRequest) {
		try {
			const command = request.data?.command;
			const terminalId = request.data?.terminalId;

			if (!command) {
				this.sendResponse({
					type: 'error',
					id: request.id,
					data: { error: 'No command provided' }
				});
				return;
			}

			let terminal: vscode.Terminal;

			if (terminalId && this.terminals.has(terminalId)) {
				terminal = this.terminals.get(terminalId)!;
			} else {
				// Create a new terminal if none specified or not found
				terminal = vscode.window.createTerminal({
					name: 'MCP Terminal'
				});
				const newId = request.id;
				this.terminals.set(newId, terminal);
			}

			terminal.show();
			terminal.sendText(command);

			this.log(`Executed command: ${command}`);

			// Simulate output capture (VSCode API doesn't provide direct terminal output access)
			// In a real implementation, you'd need to use a custom pseudoterminal
			this.sendResponse({
				type: 'success',
				id: request.id,
				data: {
					output: `Command executed: ${command}\nNote: Direct output capture requires custom pseudoterminal implementation.`
				}
			});

		} catch (error) {
			this.sendResponse({
				type: 'error',
				id: request.id,
				data: { error: `Failed to execute command: ${error}` }
			});
		}
	}

	private handleCloseTerminal(request: MCPRequest) {
		try {
			const terminalId = request.data?.terminalId;

			if (!terminalId) {
				this.sendResponse({
					type: 'error',
					id: request.id,
					data: { error: 'No terminal ID provided' }
				});
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
				});
			} else {
				this.sendResponse({
					type: 'error',
					id: request.id,
					data: { error: `Terminal ${terminalId} not found` }
				});
			}
		} catch (error) {
			this.sendResponse({
				type: 'error',
				id: request.id,
				data: { error: `Failed to close terminal: ${error}` }
			});
		}
	}

	private sendResponse(response: MCPResponse) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(response));
			this.log(`Sent response: ${response.type} (ID: ${response.id})`);
		}
	}

	showStatus() {
		const terminalCount = this.terminals.size;
		const status = this.isConnected ? 'Connected' : 'Disconnected';
		const config = vscode.workspace.getConfiguration('claudeTerminalBridge');
		const serverUrl = config.get<string>('mcpServerUrl');

		const message = `
Claude Terminal Bridge Status:
- Connection: ${status}
- Server URL: ${serverUrl}
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

	// Auto-connect on startup if configured
	const config = vscode.workspace.getConfiguration('claudeTerminalBridge');
	if (config.get<boolean>('autoConnect')) {
		setTimeout(() => {
			bridge.connect().catch((error) => {
				console.error('Auto-connect failed:', error);
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
