# Claude Terminal Bridge

Un'estensione VSCode che permette a Claude (tramite server MCP) di controllare il terminale di VSCode via WebSocket.

## 🎯 Funzionalità

- **Controllo Terminale**: Crea, controlla e chiude terminali VSCode da remoto
- **Esecuzione Comandi**: Esegui comandi shell direttamente dal server MCP
- **Connessione WebSocket**: Comunicazione in tempo reale con il server MCP
- **Auto-Riconnessione**: Riconnessione automatica in caso di disconnessione
- **Status Bar**: Indicatore visivo dello stato di connessione
- **Multi-Terminal**: Gestione di multipli terminali simultaneamente

## 📋 Requisiti

- Visual Studio Code ^1.104.0
- Un server MCP WebSocket in esecuzione (default: `ws://localhost:3000`)
  - **Nota**: Il server MCP deve essere implementato separatamente seguendo le specifiche nel file `mcp_requirements.md`

## 📦 Installazione

### Sviluppo Locale

1. Clona o scarica questo repository
2. Apri la cartella in VSCode
3. Esegui `npm install` per installare le dipendenze
4. Premi `F5` per avviare l'estensione in modalità debug

### Da VSIX (Produzione)

1. Compila l'estensione: `npm run compile`
2. Crea il pacchetto VSIX: `vsce package`
3. Installa in VSCode: `Extensions > ... > Install from VSIX...`

## ⚙️ Configurazione

L'estensione può essere configurata tramite le impostazioni di VSCode:

```json
{
  "claudeTerminalBridge.mcpServerUrl": "ws://localhost:3000",
  "claudeTerminalBridge.autoConnect": true
}
```

- `mcpServerUrl`: URL del server MCP WebSocket
- `autoConnect`: Connessione automatica all'avvio (default: true)

## 📡 Comandi

L'estensione fornisce i seguenti comandi (accessibili dalla Command Palette `Ctrl+Shift+P`):

- `Claude Terminal Bridge: Connect to MCP Server` - Connetti al server MCP
- `Claude Terminal Bridge: Disconnect from MCP Server` - Disconnetti dal server MCP
- `Claude Terminal Bridge: Show Connection Status` - Mostra lo stato della connessione

## 🎯 Utilizzo

1. **Avvia il tuo server MCP** (implementazione separata - vedi `mcp_requirements.md`)
2. **L'estensione si connette automaticamente** all'avvio di VSCode (se `autoConnect` è abilitato)
3. **Verifica la connessione** guardando la status bar in basso a destra:
   - `$(plug) MCP Connected` - Connesso e pronto
   - `$(debug-disconnect) MCP Disconnected` - Non connesso
4. **Il server MCP può ora controllare il terminale** inviando comandi via WebSocket

### Monitoraggio

Per vedere i log dell'estensione:
1. Vai su `View` → `Output`
2. Seleziona `Claude Terminal Bridge` dal dropdown
3. Vedrai tutti i log di connessione ed esecuzione comandi

## 🏗️ Architettura

```text
┌─────────────────┐         WebSocket          ┌──────────────────┐
│   MCP Server    │ <----------------------->   │  VSCode Extension │
│ (da implementare)│      JSON Messages        │  (questa repo)   │
└─────────────────┘                             └──────────────────┘
                                                         │
                                                         │ VSCode API
                                                         ▼
                                                ┌──────────────────┐
                                                │  VSCode Terminal │
                                                └──────────────────┘
```

## � Protocollo MCP

Per i dettagli completi su come implementare il server MCP e comunicare con questa estensione, consulta:

**📖 [mcp_requirements.md](mcp_requirements.md)** - Specifiche complete del protocollo

Breve sommario delle operazioni supportate:
- **ping** - Verifica connessione
- **create_terminal** - Crea nuovo terminale
- **execute** - Esegui comando shell
- **close_terminal** - Chiudi terminale

## 🛠️ Sviluppo

### Struttura del Progetto

```text
claude-terminal-bridge/
├── src/
│   ├── extension.ts          # Codice principale dell'estensione
│   └── test/
│       └── extension.test.ts
├── package.json              # Manifest dell'estensione
├── tsconfig.json            # Configurazione TypeScript
├── mcp_requirements.md      # Specifiche protocollo MCP
├── TESTING.md              # Guida al testing
└── README.md               # Questo file
```

### Build

```bash
npm run compile      # Compila TypeScript
npm run watch        # Watch mode per sviluppo
npm test            # Esegui test
```

### Debug

1. Apri la cartella in VSCode
2. Premi `F5` per avviare l'Extension Development Host
3. Apri l'Output Channel "Claude Terminal Bridge" per vedere i log

## 📝 Note Tecniche

### Limitazioni VSCode API

⚠️ **IMPORTANTE**: L'API di VSCode non fornisce accesso diretto all'output del terminale.

Questa implementazione:
- ✅ Invia comandi al terminale
- ✅ Riceve conferma dell'esecuzione
- ❌ Non cattura direttamente l'output in tempo reale

Per catturare l'output in tempo reale, è necessario implementare un `Pseudoterminal` personalizzato.

### Auto-Riconnessione

L'estensione tenta automaticamente di riconnettersi ogni 5 secondi in caso di disconnessione (se `autoConnect` è abilitato).

## 🐛 Troubleshooting

### L'estensione non si connette

1. Verifica che il server MCP sia in esecuzione
2. Controlla l'URL nelle impostazioni: `Settings` → `Claude Terminal Bridge` → `Mcp Server Url`
3. Verifica che non ci siano firewall che bloccano la porta
4. Controlla i log nell'Output Channel

### I comandi non vengono eseguiti

1. Verifica che il terminale sia stato creato
2. Controlla i log per errori
3. Verifica che il `terminalId` sia corretto
4. Assicurati che il formato JSON del messaggio sia valido

### Status bar non si aggiorna

1. Ricarica la finestra VSCode (`Ctrl+R` o `Cmd+R`)
2. Verifica che l'estensione sia attivata
3. Controlla la console developer per errori

## 🤝 Contribuire

Le pull request sono benvenute! Per modifiche importanti, apri prima un issue per discutere cosa vorresti cambiare.

## 📄 Licenza

[MIT](LICENSE)

## 🔗 Link Utili

- [VSCode Extension API](https://code.visualstudio.com/api)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

**⚠️ Nota di Sicurezza**: Questa estensione consente l'esecuzione di comandi nel terminale da remoto. Usare solo in ambienti fidati e con server MCP sicuri.