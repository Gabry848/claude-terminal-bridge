# 🚀 Guida per Creare il Server MCP

Questa guida spiega come creare un server MCP (Model Context Protocol) compatibile con l'estensione **Claude Terminal Bridge**.

## 📋 Cosa Devi Creare

Un server WebSocket Node.js che:
1. Ascolta sulla porta `3000` (o configurabile)
2. Accetta connessioni WebSocket
3. Invia comandi all'estensione VSCode
4. Riceve risposte dall'estensione

## 🛠️ Stack Tecnologico Consigliato

- **Node.js** (v18 o superiore)
- **ws** - Libreria WebSocket per Node.js
- **TypeScript** (opzionale ma consigliato)

## 📦 Setup Iniziale

```bash
# Crea una nuova directory per il server
mkdir mcp-server
cd mcp-server

# Inizializza il progetto Node.js
npm init -y

# Installa le dipendenze
npm install ws
npm install --save-dev @types/ws typescript @types/node

# Crea tsconfig.json
npx tsc --init
```

## 🏗️ Struttura del Progetto

```
mcp-server/
├── src/
│   └── server.ts          # Server principale
├── package.json
├── tsconfig.json
└── README.md
```

## 💻 Codice del Server

### File: `src/server.ts`

```typescript
import WebSocket, { WebSocketServer } from 'ws';

// Interfacce per la comunicazione
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

class MCPServer {
    private wss: WebSocketServer;
    private clients: Set<WebSocket> = new Set();
    private port: number;

    constructor(port: number = 3000) {
        this.port = port;
        this.wss = new WebSocketServer({ port: this.port });
        this.setupServer();
    }

    private setupServer() {
        this.wss.on('listening', () => {
            console.log(`🚀 MCP Server listening on ws://localhost:${this.port}`);
            console.log('📡 Waiting for VSCode extension to connect...');
        });

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('✅ VSCode extension connected!');
            this.clients.add(ws);

            // Invia un ping di benvenuto
            this.sendPing(ws);

            ws.on('message', (data: Buffer) => {
                this.handleMessage(ws, data.toString());
            });

            ws.on('close', () => {
                console.log('❌ VSCode extension disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        this.wss.on('error', (error) => {
            console.error('Server error:', error);
        });
    }

    private handleMessage(ws: WebSocket, message: string) {
        try {
            const response: MCPResponse = JSON.parse(message);
            console.log(`📨 Received response:`, response);

            // Qui puoi gestire le risposte dall'estensione
            switch (response.type) {
                case 'pong':
                    console.log('🏓 Pong received - connection is alive');
                    break;
                case 'terminal_created':
                    console.log(`✅ Terminal created: ${response.data?.terminalName}`);
                    break;
                case 'success':
                    console.log(`✅ Command executed successfully`);
                    if (response.data?.output) {
                        console.log(`Output: ${response.data.output}`);
                    }
                    break;
                case 'error':
                    console.error(`❌ Error: ${response.data?.error}`);
                    break;
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    // Metodi per inviare comandi all'estensione VSCode

    public sendPing(ws?: WebSocket) {
        const request: MCPRequest = {
            type: 'ping',
            id: this.generateId()
        };
        this.broadcast(request, ws);
    }

    public createTerminal(terminalName: string = 'MCP Terminal', ws?: WebSocket) {
        const request: MCPRequest = {
            type: 'create_terminal',
            id: this.generateId(),
            data: { terminalName }
        };
        this.broadcast(request, ws);
    }

    public executeCommand(command: string, terminalId?: string, ws?: WebSocket) {
        const request: MCPRequest = {
            type: 'execute',
            id: this.generateId(),
            data: { command, terminalId }
        };
        this.broadcast(request, ws);
    }

    public closeTerminal(terminalId: string, ws?: WebSocket) {
        const request: MCPRequest = {
            type: 'close_terminal',
            id: this.generateId(),
            data: { terminalId }
        };
        this.broadcast(request, ws);
    }

    private broadcast(request: MCPRequest, targetClient?: WebSocket) {
        const message = JSON.stringify(request);

        if (targetClient) {
            targetClient.send(message);
            console.log(`📤 Sent to client:`, request);
        } else {
            // Invia a tutti i client connessi
            this.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
            console.log(`📤 Broadcast to ${this.clients.size} client(s):`, request);
        }
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Metodo per fermare il server
    public stop() {
        console.log('🛑 Stopping MCP server...');
        this.wss.close();
    }
}

// Avvia il server
const server = new MCPServer(3000);

// Esempio di utilizzo: invia comandi ogni 10 secondi (per test)
// Rimuovi o modifica questo codice per il tuo caso d'uso
let testMode = false; // Cambia a true per testare

if (testMode) {
    let testInterval: NodeJS.Timeout;

    // Aspetta che si connetta un client
    const checkConnection = setInterval(() => {
        if (server['clients'].size > 0) {
            clearInterval(checkConnection);
            console.log('\n🧪 Test mode enabled - sending test commands...\n');

            // Sequenza di test
            setTimeout(() => server.createTerminal('Test Terminal'), 2000);
            setTimeout(() => server.executeCommand('echo "Hello from MCP!"'), 4000);
            setTimeout(() => server.executeCommand('node --version'), 6000);
            setTimeout(() => server.executeCommand('npm --version'), 8000);
        }
    }, 1000);
}

// Gestione chiusura pulita
process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
});

// Esporta per uso come modulo
export default MCPServer;
```

## 📝 File: `package.json`

Aggiungi questi script:

```json
{
  "name": "mcp-server",
  "version": "1.0.0",
  "description": "MCP WebSocket Server for Claude Terminal Bridge",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsc && node dist/server.js",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/ws": "^8.5.13",
    "typescript": "^5.9.0"
  }
}
```

## 🚀 Come Compilare ed Eseguire

```bash
# Compila il TypeScript
npm run build

# Avvia il server
npm start

# Oppure in un solo comando (dev mode)
npm run dev
```

## 🧪 Come Testare

### 1. Avvia il server MCP

```bash
npm run dev
```

Dovresti vedere:
```
🚀 MCP Server listening on ws://localhost:3000
📡 Waiting for VSCode extension to connect...
```

### 2. Avvia l'estensione VSCode

- Apri VSCode con l'estensione Claude Terminal Bridge
- L'estensione si connetterà automaticamente
- Vedrai nel server: `✅ VSCode extension connected!`

### 3. Testa i comandi

Modifica il codice per abilitare la modalità test (`testMode = true`) oppure usa la console Node.js interattiva:

```javascript
// Nel file server.ts, dopo l'avvio
server.createTerminal('My Terminal');
server.executeCommand('echo "Hello World!"');
server.executeCommand('ls -la');
```

## 🎯 Comandi Supportati

### 1. **Ping** - Verifica connessione
```typescript
{
    type: 'ping',
    id: 'unique-id'
}
```

### 2. **Create Terminal** - Crea nuovo terminale
```typescript
{
    type: 'create_terminal',
    id: 'unique-id',
    data: {
        terminalName: 'My Terminal'
    }
}
```

### 3. **Execute Command** - Esegui comando
```typescript
{
    type: 'execute',
    id: 'unique-id',
    data: {
        command: 'npm install',
        terminalId: 'optional-terminal-id'
    }
}
```

### 4. **Close Terminal** - Chiudi terminale
```typescript
{
    type: 'close_terminal',
    id: 'unique-id',
    data: {
        terminalId: 'terminal-id'
    }
}
```

## 📨 Risposte dall'Estensione

L'estensione risponderà con uno di questi tipi:

### Pong
```typescript
{
    type: 'pong',
    id: 'request-id'
}
```

### Terminal Created
```typescript
{
    type: 'terminal_created',
    id: 'request-id',
    data: {
        terminalId: 'terminal-id',
        terminalName: 'Terminal Name'
    }
}
```

### Success
```typescript
{
    type: 'success',
    id: 'request-id',
    data: {
        output: 'Command executed successfully'
    }
}
```

### Error
```typescript
{
    type: 'error',
    id: 'request-id',
    data: {
        error: 'Error message'
    }
}
```

## 🔧 Personalizzazione

### Cambiare la Porta

Nel costruttore:
```typescript
const server = new MCPServer(8080); // Usa porta 8080
```

E aggiorna le impostazioni dell'estensione VSCode:
```json
{
    "claudeTerminalBridge.mcpServerUrl": "ws://localhost:8080"
}
```

### Aggiungere Autenticazione

```typescript
this.wss.on('connection', (ws: WebSocket, req) => {
    const token = req.headers['authorization'];
    if (token !== 'your-secret-token') {
        ws.close(1008, 'Unauthorized');
        return;
    }
    // ... resto del codice
});
```

## 🎓 Esempio Completo di Utilizzo

```typescript
import MCPServer from './server';

const server = new MCPServer(3000);

// Quando un client si connette
server.on('clientConnected', (ws) => {
    // 1. Crea un terminale
    server.createTerminal('Build Terminal', ws);

    // 2. Aspetta un po' e poi esegui comandi
    setTimeout(() => {
        server.executeCommand('npm install', undefined, ws);
    }, 1000);

    setTimeout(() => {
        server.executeCommand('npm run build', undefined, ws);
    }, 5000);
});
```

## ⚠️ Note Importanti

1. **Sicurezza**: Questo server permette l'esecuzione di comandi arbitrari. Usalo solo in ambienti fidati!
2. **Output Capture**: L'API di VSCode non fornisce l'output del terminale in tempo reale. Riceverai solo conferme di esecuzione.
3. **IDs Unici**: Ogni comando deve avere un ID univoco per tracciare le risposte.

## 📚 Risorse Aggiuntive

- [Specifiche Protocollo MCP](./mcp_requirements.md)
- [Documentazione ws](https://github.com/websockets/ws)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 🐛 Troubleshooting

### Il server non si avvia
- Verifica che la porta 3000 non sia già in uso: `netstat -an | grep 3000`
- Prova a cambiare porta

### L'estensione non si connette
- Verifica che il server sia in ascolto
- Controlla l'URL nelle impostazioni VSCode
- Verifica i firewall

### I comandi non vengono eseguiti
- Controlla i log del server
- Verifica che il formato JSON sia corretto
- Controlla i log dell'estensione in VSCode (Output → Claude Terminal Bridge)

---

**✅ Sei pronto!** Copia questo codice e istruzioni a Claude Code per creare il server MCP.
