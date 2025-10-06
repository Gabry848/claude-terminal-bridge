# 📋 Requisiti Server MCP

Questo documento descrive come deve essere implementato il server MCP per comunicare con l'estensione VSCode Claude Terminal Bridge.

## 🔌 Protocollo di Comunicazione

Il server MCP deve comunicare con l'estensione tramite **WebSocket** utilizzando messaggi JSON.

**URL WebSocket predefinito**: `ws://localhost:3000`

## 📤 Messaggi che il Server MCP può Inviare (Richieste)

### 1. Ping - Verifica Connessione

**Scopo**: Verificare che l'estensione sia ancora connessa e responsiva.

```json
{
  "type": "ping",
  "id": "unique-request-id"
}
```

**Campi**:
- `type`: Deve essere `"ping"`
- `id`: Identificatore univoco della richiesta (stringa)

---

### 2. Create Terminal - Crea Nuovo Terminale

**Scopo**: Creare un nuovo terminale in VSCode.

```json
{
  "type": "create_terminal",
  "id": "unique-request-id",
  "data": {
    "terminalName": "Nome del Terminale"
  }
}
```

**Campi**:
- `type`: Deve essere `"create_terminal"`
- `id`: Identificatore univoco della richiesta (stringa)
- `data.terminalName`: Nome da assegnare al terminale (opzionale, default: "MCP Terminal N")

---

### 3. Execute - Esegui Comando

**Scopo**: Eseguire un comando shell in un terminale VSCode.

```json
{
  "type": "execute",
  "id": "unique-request-id",
  "data": {
    "command": "npm install",
    "terminalId": "terminal-id"
  }
}
```

**Campi**:
- `type`: Deve essere `"execute"`
- `id`: Identificatore univoco della richiesta (stringa)
- `data.command`: Comando shell da eseguire (stringa, **obbligatorio**)
- `data.terminalId`: ID del terminale dove eseguire il comando (opzionale, se omesso crea un nuovo terminale)

---

### 4. Close Terminal - Chiudi Terminale

**Scopo**: Chiudere un terminale specifico in VSCode.

```json
{
  "type": "close_terminal",
  "id": "unique-request-id",
  "data": {
    "terminalId": "terminal-id"
  }
}
```

**Campi**:
- `type`: Deve essere `"close_terminal"`
- `id`: Identificatore univoco della richiesta (stringa)
- `data.terminalId`: ID del terminale da chiudere (stringa, **obbligatorio**)

---

## 📥 Messaggi che l'Estensione Invia (Risposte)

### 1. Pong - Risposta al Ping

**Quando**: In risposta a una richiesta `ping`.

```json
{
  "type": "pong",
  "id": "request-id"
}
```

**Campi**:
- `type`: Sempre `"pong"`
- `id`: Stesso ID della richiesta `ping` originale

---

### 2. Terminal Created - Terminale Creato

**Quando**: Dopo aver creato con successo un nuovo terminale.

```json
{
  "type": "terminal_created",
  "id": "request-id",
  "data": {
    "terminalId": "terminal-id",
    "terminalName": "Nome del Terminale"
  }
}
```

**Campi**:
- `type`: Sempre `"terminal_created"`
- `id`: Stesso ID della richiesta `create_terminal` originale
- `data.terminalId`: ID univoco assegnato al terminale (da usare per operazioni successive)
- `data.terminalName`: Nome effettivo del terminale creato

---

### 3. Success - Operazione Completata

**Quando**: Comando eseguito con successo o terminale chiuso.

```json
{
  "type": "success",
  "id": "request-id",
  "data": {
    "output": "Messaggio di conferma"
  }
}
```

**Campi**:
- `type`: Sempre `"success"`
- `id`: Stesso ID della richiesta originale
- `data.output`: Messaggio descrittivo dell'operazione completata

---

### 4. Error - Errore

**Quando**: Si verifica un errore durante l'esecuzione di una richiesta.

```json
{
  "type": "error",
  "id": "request-id",
  "data": {
    "error": "Descrizione dell'errore"
  }
}
```

**Campi**:
- `type`: Sempre `"error"`
- `id`: Stesso ID della richiesta originale
- `data.error`: Descrizione dell'errore (stringa)

---

## 🔄 Flusso di Comunicazione Tipico

### Scenario 1: Creare un Terminale ed Eseguire un Comando

```
Server MCP → VSCode Extension
{
  "type": "create_terminal",
  "id": "req-1",
  "data": { "terminalName": "Build Terminal" }
}

VSCode Extension → Server MCP
{
  "type": "terminal_created",
  "id": "req-1",
  "data": {
    "terminalId": "req-1",
    "terminalName": "Build Terminal"
  }
}

Server MCP → VSCode Extension
{
  "type": "execute",
  "id": "req-2",
  "data": {
    "command": "npm run build",
    "terminalId": "req-1"
  }
}

VSCode Extension → Server MCP
{
  "type": "success",
  "id": "req-2",
  "data": {
    "output": "Command executed: npm run build"
  }
}
```

### Scenario 2: Gestione Errori

```
Server MCP → VSCode Extension
{
  "type": "close_terminal",
  "id": "req-3",
  "data": { "terminalId": "non-existing-id" }
}

VSCode Extension → Server MCP
{
  "type": "error",
  "id": "req-3",
  "data": {
    "error": "Terminal non-existing-id not found"
  }
}
```

---

## ⚙️ Comportamento del Server MCP

### Gestione Connessione

1. **Apertura Connessione**: Il server deve accettare connessioni WebSocket sulla porta configurata (default: 3000)

2. **Mantenimento Connessione**: Inviare periodicamente messaggi `ping` (es. ogni 30 secondi) per verificare che l'estensione sia attiva

3. **Riconnessione**: L'estensione tenta automaticamente di riconnettersi ogni 5 secondi in caso di disconnessione (se auto-connect è abilitato)

4. **Chiusura**: Gestire correttamente la chiusura della connessione e cleanup delle risorse

### Gestione ID Richieste

- Ogni richiesta deve avere un `id` univoco
- L'estensione risponderà sempre con lo stesso `id` della richiesta
- Usare gli ID per associare richieste e risposte (pattern request-response)

### Gestione Terminal ID

- Quando crei un terminale con `create_terminal`, l'estensione usa l'`id` della richiesta come `terminalId`
- Salvare il `terminalId` ricevuto nella risposta `terminal_created`
- Usare questo `terminalId` per operazioni successive (`execute`, `close_terminal`)

### Best Practices

1. **Timeout**: Implementare timeout per le risposte (es. 30 secondi)
2. **Retry Logic**: Gestire errori di rete con retry automatico
3. **Logging**: Loggare tutte le richieste e risposte per debug
4. **Validazione**: Validare le risposte ricevute dall'estensione
5. **Error Handling**: Gestire gracefully gli errori e le disconnessioni

---

## 🚨 Limitazioni Attuali

### Output del Terminale

**⚠️ IMPORTANTE**: L'API di VSCode non fornisce accesso diretto all'output del terminale.

**Cosa succede attualmente**:
- L'estensione può INVIARE comandi al terminale
- L'estensione può confermare che il comando è stato inviato
- L'estensione **NON PUÒ** catturare l'output del comando in tempo reale

**Messaggio di risposta**:
```json
{
  "type": "success",
  "id": "req-id",
  "data": {
    "output": "Command executed: <comando>\nNote: Direct output capture requires custom pseudoterminal implementation."
  }
}
```

### Soluzione Futura

Per catturare l'output del terminale, è necessario implementare un **Pseudoterminal** personalizzato usando l'API `vscode.window.createTerminal()` con un `pty` personalizzato.

---

## 📊 Esempio Implementazione Server (Pseudocodice)

```javascript
// Server WebSocket
const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Ping periodico
  const pingInterval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'ping',
      id: `ping-${Date.now()}`
    }));
  }, 30000);
  
  // Gestione messaggi
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    switch(message.type) {
      case 'pong':
        console.log('Pong received');
        break;
      case 'terminal_created':
        // Salva terminalId per usi futuri
        saveTerminalId(message.data.terminalId);
        break;
      case 'success':
        console.log('Success:', message.data.output);
        break;
      case 'error':
        console.error('Error:', message.data.error);
        break;
    }
  });
  
  // Cleanup
  ws.on('close', () => {
    clearInterval(pingInterval);
    console.log('Client disconnected');
  });
});

// Funzioni helper per inviare comandi
function createTerminal(ws, name) {
  ws.send(JSON.stringify({
    type: 'create_terminal',
    id: generateUniqueId(),
    data: { terminalName: name }
  }));
}

function executeCommand(ws, command, terminalId) {
  ws.send(JSON.stringify({
    type: 'execute',
    id: generateUniqueId(),
    data: { command, terminalId }
  }));
}

function closeTerminal(ws, terminalId) {
  ws.send(JSON.stringify({
    type: 'close_terminal',
    id: generateUniqueId(),
    data: { terminalId }
  }));
}
```

---

## 🔐 Sicurezza (Raccomandazioni Opzionali)

Per un ambiente di produzione, considera:

1. **Autenticazione**: Implementare token-based authentication
2. **Crittografia**: Usare WSS (WebSocket Secure) invece di WS
3. **Validazione Comandi**: Whitelist di comandi permessi
4. **Rate Limiting**: Limitare il numero di richieste per prevenire abuse
5. **Sandboxing**: Eseguire comandi in un ambiente isolato

---

## 📞 Supporto

Per domande o problemi:
- Controlla i log nell'Output Channel "Claude Terminal Bridge" in VSCode
- Verifica la connessione WebSocket
- Assicurati che i messaggi JSON siano validi
- Controlla che gli ID delle richieste siano univoci
