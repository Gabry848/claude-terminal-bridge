# 🧪 Guida al Testing dell'Estensione

Questa guida spiega come testare l'estensione Claude Terminal Bridge.

## 📋 Prerequisiti

1. Node.js installato
2. VSCode installato
3. Dipendenze npm installate (`npm install`)

## 🚀 Setup Test Environment

### 1. Avvia il Server MCP di Test

Apri un terminale e esegui:

```bash
node mcp-server-example.js
```

Dovresti vedere:

```
🚀 MCP Server in ascolto sulla porta 3000
   WebSocket URL: ws://localhost:3000

📋 Comandi disponibili (digita nella console):
   1 - Crea nuovo terminale
   2 - Esegui comando "node --version"
   3 - Esegui comando "npm --version"
   4 - Esegui comando personalizzato
   5 - Chiudi terminale
```

### 2. Avvia l'Estensione in Debug Mode

1. Apri la cartella `claude-terminal-bridge` in VSCode
2. Premi `F5` per avviare l'Extension Development Host
3. Si aprirà una nuova finestra VSCode con l'estensione caricata

### 3. Verifica la Connessione

Nella nuova finestra VSCode:

1. Guarda la Status Bar in basso a destra
2. Dovresti vedere: `$(plug) MCP Connected` (se auto-connect è abilitato)
3. Se vedi `$(debug-disconnect) MCP Disconnected`, usa la Command Palette:
   - Premi `Ctrl+Shift+P` (o `Cmd+Shift+P` su Mac)
   - Cerca: `Claude Terminal Bridge: Connect to MCP Server`

## 🧪 Scenari di Test

### Test 1: Creazione Terminale

1. Nel terminale dove gira il server MCP, digita `1` e premi Enter
2. Nella finestra VSCode dovresti vedere un nuovo terminale aprirsi
3. Nel server dovresti vedere: `✓ Terminale creato: MCP Test Terminal 1`

### Test 2: Esecuzione Comando

1. Digita `2` nel terminale del server (esegue `node --version`)
2. Il comando verrà eseguito nel terminale VSCode
3. Verifica che il comando sia stato eseguito

### Test 3: Comando Personalizzato

1. Digita `4` nel terminale del server
2. Inserisci un comando, esempio: `echo "Hello from MCP!"`
3. Il comando verrà eseguito nel terminale VSCode

### Test 4: Chiusura Terminale

1. Digita `5` nel terminale del server
2. Il terminale VSCode dovrebbe chiudersi

### Test 5: Reconnection

1. Chiudi il server MCP (`Ctrl+C`)
2. Nella VSCode Extension, la status bar dovrebbe mostrare `MCP Disconnected`
3. Riavvia il server MCP
4. L'estensione dovrebbe riconnettersi automaticamente dopo ~5 secondi

## 📊 Monitoraggio e Debug

### Output Channel

Per vedere i log dettagliati dell'estensione:

1. In VSCode, vai su `View` → `Output`
2. Seleziona `Claude Terminal Bridge` dal dropdown
3. Vedrai tutti i log di connessione e esecuzione

### Developer Console

Per vedere i log di sistema:

1. Nella finestra Extension Development Host
2. Premi `Ctrl+Shift+I` (o `Cmd+Option+I` su Mac)
3. Vai nella tab Console

## 🔧 Testing Manuale con Postman/WebSocket Client

Puoi anche testare manualmente con un client WebSocket:

### Connessione

```
ws://localhost:3000
```

### Invia Richiesta (Crea Terminale)

```json
{
  "type": "create_terminal",
  "id": "test-1",
  "data": {
    "terminalName": "Test Terminal"
  }
}
```

### Risposta Attesa

```json
{
  "type": "terminal_created",
  "id": "test-1",
  "data": {
    "terminalId": "test-1",
    "terminalName": "Test Terminal"
  }
}
```

### Esegui Comando

```json
{
  "type": "execute",
  "id": "test-2",
  "data": {
    "command": "npm --version",
    "terminalId": "test-1"
  }
}
```

## 🐛 Troubleshooting

### L'estensione non si connette

1. Verifica che il server MCP sia in esecuzione
2. Controlla l'URL nelle impostazioni: `Settings` → `Claude Terminal Bridge` → `Mcp Server Url`
3. Verifica che non ci siano firewall che bloccano la porta 3000

### I comandi non vengono eseguiti

1. Verifica che il terminale sia stato creato
2. Controlla l'Output Channel per errori
3. Verifica che il `terminalId` sia corretto

### Il terminale non mostra output

Questa è una limitazione nota. L'API VSCode non fornisce accesso diretto all'output del terminale. Per catturare l'output, è necessario implementare un Pseudoterminal personalizzato.

## 📝 Test Checklist

- [ ] Connessione al server MCP
- [ ] Creazione di un nuovo terminale
- [ ] Esecuzione comando semplice (node --version)
- [ ] Esecuzione comando con output (echo "test")
- [ ] Esecuzione comando che richiede input interattivo
- [ ] Chiusura terminale
- [ ] Disconnessione dal server
- [ ] Riconnessione automatica
- [ ] Gestione multipli terminali
- [ ] Status bar aggiornato correttamente
- [ ] Log nell'Output Channel

## 🎯 Next Steps

Dopo aver testato con successo:

1. Integra con un vero server MCP
2. Implementa cattura output con Pseudoterminal
3. Aggiungi autenticazione WebSocket
4. Implementa gestione sessioni multiple
5. Aggiungi persistenza stato terminali

## 📚 Risorse

- [VSCode Extension API](https://code.visualstudio.com/api)
- [VSCode Terminal API](https://code.visualstudio.com/api/references/vscode-api#Terminal)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Node.js ws Library](https://github.com/websockets/ws)
