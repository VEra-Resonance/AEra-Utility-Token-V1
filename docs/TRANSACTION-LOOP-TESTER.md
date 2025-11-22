# 🧪 Transaction Loop Tester

Automatisierter Transaktions-Tester für AERA Token auf Sepolia Testnet.

## Features

✅ **Automatisierte Transaction Loops**
- Konfigurierbare Anzahl von Iterationen (1-100)
- Verzögerung zwischen Transaktionen (verhindert Nonce-Konflikte)
- Unterstützung für Burn und Transfer Operations

✅ **Detailliertes Logging**
- JSON-Log mit allen Transaktionsdetails
- CSV-Export für Excel/Analyse
- Live-Konsolen-Output mit Timestamps
- Fehler-Tracking und Recovery

✅ **Metriken & Reporting**
- Gas-Verbrauch pro Transaktion
- USD-Kosten Berechnung
- Success/Failure Rate
- Durchschnittliche Kosten pro TX
- Gesamtdauer

## Setup

### 1. Test-Wallets konfigurieren

Öffne `.env.local` und trage deine Test-Wallet Keys ein:

```bash
# Test Wallet #1 (SEPOLIA ONLY)
TEST_WALLET_1_ADDRESS=0x1234567890123456789012345678901234567890
TEST_WALLET_1_PRIVATE_KEY=0x1234567890abcdef...

# Test Wallet #2 (SEPOLIA ONLY)
TEST_WALLET_2_ADDRESS=0x0987654321098765432109876543210987654321
TEST_WALLET_2_PRIVATE_KEY=0xfedcba9876543210...
```

### 2. Test-Parameter anpassen (optional)

```bash
# Anzahl Transaktionen (1-100)
TX_LOOP_COUNT=10

# Verzögerung zwischen TXs in Millisekunden
TX_DELAY_MS=30000

# Test-Typ: "burn", "transfer", oder "all"
TX_TEST_TYPE=all

# Logging aktivieren/deaktivieren
SAVE_TX_LOG=true
EXPORT_CSV=true
```

### 3. Testwallets mit ETH und AERA füllen

Die Test-Wallets brauchen:
- Mindestens 0.01 ETH (für Gas)
- Mindestens 0.5 AERA zum Testen

Beantrage ETH von [Sepolia Faucet](https://www.sepolia-faucet.pk910.de/)

## Ausführung

### Option 1: Mit Helper-Script (empfohlen)

```bash
./run-tx-test.sh
```

Das Script validiert die Konfiguration und bestätigt deine Eingabe vor dem Start.

### Option 2: Direkt mit Node.js

```bash
node scripts/transaction-loop-tester.js
```

## Output & Logging

### Konsolen-Output

```
[2025-11-06T14:30:45.123Z] [INFO] 🧪 Starte Loop mit 10 Transaktionen...
[2025-11-06T14:30:45.456Z] [INFO] 📍 Iteration 1/10
[2025-11-06T14:30:46.789Z] [INFO] 🔥 Burn TX von 0x1234...
[2025-11-06T14:30:47.012Z] [INFO] ⏳ Warte auf Bestätigung... 0xabcd...
[2025-11-06T14:30:50.345Z] [SUCCESS] ✅ Burn erfolgreich! Gas: 48250, Kosten: $0.0542
```

### Log-Verzeichnis

Logs werden in `logs/tx-tests/{testId}/` gespeichert:

```
logs/tx-tests/
└── test-1730887445123/
    ├── transaction-log.json     # Detailliertes JSON-Log
    └── transactions.csv         # CSV für Excel-Import
```

### JSON-Log Format

```json
{
  "startTime": "2025-11-06T14:30:45.123Z",
  "testId": "test-1730887445123",
  "config": {
    "network": "sepolia",
    "loopCount": 10,
    "delayMs": 30000,
    "testType": "all"
  },
  "results": {
    "total": 20,
    "success": 19,
    "failed": 1,
    "totalGas": "948512",
    "totalCost": 1.0634
  },
  "transactions": [
    {
      "timestamp": "2025-11-06T14:30:46.789Z",
      "type": "BURN",
      "from": "0x1234...",
      "to": "0x5032...",
      "amount": "0.1",
      "status": "success",
      "hash": "0xabcd...",
      "gasUsed": "48250",
      "gasPrice": "1.5",
      "costUsd": "0.0542",
      "nonce": 0,
      "duration": 3556,
      "error": null
    }
  ]
}
```

### CSV-Export Format

```csv
Index,Timestamp,Hash,Type,From,To,Amount,Status,Gas Used,Gas Price (Gwei),Cost (USD),Nonce,Duration (ms),Error
1,2025-11-06T14:30:46.789Z,0xabcd...,BURN,0x1234...,0x5032...,0.1,success,48250,1.5,0.0542,0,3556,
2,2025-11-06T14:30:50.345Z,0xfghi...,TRANSFER,0x1234...,0x0987...,0.05,success,52100,1.5,0.0585,1,3567,
```

## Test-Szenarien

### Szenario 1: Reine Burn-Tests

```bash
TX_LOOP_COUNT=20
TX_TEST_TYPE=burn
TX_DELAY_MS=45000
```

Testet nur Burn-Funktionalität mit längeren Verzögerungen.

### Szenario 2: Reine Transfer-Tests

```bash
TX_LOOP_COUNT=15
TX_TEST_TYPE=transfer
TX_DELAY_MS=30000
```

Testet nur Transfer zwischen den beiden Wallets.

### Szenario 3: Mixed Operations (Standard)

```bash
TX_LOOP_COUNT=10
TX_TEST_TYPE=all
TX_DELAY_MS=30000
```

Testet Burn und Transfer im Wechsel.

## Fehlerbehandlung

### Gas zu niedrig
```
Error: Transaction reverted!
```
→ Erhöhe `TX_DELAY_MS` oder reduziere `TX_LOOP_COUNT`

### Nonce-Konflikt
```
Error: nonce too low
```
→ Erhöhe `TX_DELAY_MS` auf 45000+ ms

### Unzureichend AERA-Balance
```
⚠️ Wallet 1 hat weniger als 0.5 AERA
```
→ Befülle die Test-Wallet mit mehr AERA

### RPC-Fehler
```
Error: Network timeout
```
→ Prüfe `SEPOLIA_RPC_URL` in `.env.local`
→ Nutze VPN falls blockiert

## Best Practices

✅ **Sicherheit:**
- Nutze NUR Testnet-Wallets
- NIEMALS echte Private Keys verwenden
- Nach Tests: Keys löschen und `.env.local` bereinigen

✅ **Performance:**
- Starte mit `TX_LOOP_COUNT=5` zum Testen
- Erhöhe `TX_DELAY_MS` wenn Nonce-Fehler auftreten
- Verwende separate Test-Wallets für parallele Tests

✅ **Debugging:**
- Prüfe Logs in `logs/tx-tests/`
- CSV-Export in Excel für Analyse
- Nutze [Tenderly](https://tenderly.co) für TX-Traces

## Cleanup nach Tests

Nach dem Testing Wallets aufräumen:

```bash
# Keys aus .env.local löschen
nano .env.local

# Oder alte Logs löschen
rm -rf logs/tx-tests/test-*
```

## Support

Probleme? Prüfe:
1. Alle `.env.local` Variablen korrekt gesetzt?
2. Test-Wallets haben genug ETH & AERA?
3. Sepolia RPC erreichbar?
4. Nonce-Konflikt? → Erhöhe `TX_DELAY_MS`

---

**Version:** 1.0.0  
**Letztes Update:** Nov 6, 2025
