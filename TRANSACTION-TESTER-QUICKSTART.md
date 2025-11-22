# 🚀 Transaction Loop Tester - Quick Start

## ⏱️ 5-Minuten Setup

### Schritt 1: Test-Wallets auf Sepolia erstellen (2 Min)

```bash
# Option A: MetaMask (einfachste Methode)
# 1. Öffne MetaMask → Network wechseln zu "Sepolia"
# 2. Account erstellen: Klick auf "+" neben Account-Name
# 3. Name: "Test Wallet 1"
# 4. Wiederhole für "Test Wallet 2"
# 5. Export Private Keys:
#    - Klick Account-Menü → Details → "Export Private Key"
#    - Passwort eingeben
#    - Key kopieren

# Option B: programmatisch
node -e "
const ethers = require('ethers');
const w1 = ethers.Wallet.createRandom();
const w2 = ethers.Wallet.createRandom();
console.log('Wallet 1:', w1.address, '\nKey:', w1.privateKey);
console.log('Wallet 2:', w2.address, '\nKey:', w2.privateKey);
"
```

### Schritt 2: Keys in .env.local eintragen (1 Min)

```bash
# .env.local öffnen
nano .env.local
```

Ersetze diese Zeilen:

```bash
# TEST WALLET #1
TEST_WALLET_1_ADDRESS=0x1234567890ABCDEF...  # ← Deine Wallet 1 Adresse
TEST_WALLET_1_PRIVATE_KEY=0x1234567890ABCDEF...  # ← Dein Private Key 1

# TEST WALLET #2
TEST_WALLET_2_ADDRESS=0xABCDEF1234567890...  # ← Deine Wallet 2 Adresse
TEST_WALLET_2_PRIVATE_KEY=0xABCDEF1234567890...  # ← Dein Private Key 2
```

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Schritt 3: Testnet ETH + AERA besorgen (2 Min)

```bash
# 1. Besuche Sepolia Faucet für ETH:
#    https://www.sepolia-faucet.pk910.de/
#    (Trage Wallet 1 + Wallet 2 ein, erhalte 0.05 ETH pro Wallet)

# 2. Erhalte AERA von Test-Account (wenn verfügbar)
#    oder Transfer selbst:
#    - Öffne .env.local
#    - Finde: LEDGER_WALLET_1=0x27F8...
#    - Das ist ein Account mit AERA
#    - Transfer dorthin 0.1 AERA (falls du Admin bist)
```

### Schritt 4: Test starten! (1 Min)

```bash
# Mit interaktivem Script (empfohlen):
./run-tx-test.sh

# Oder direkt:
node scripts/transaction-loop-tester.js
```

## 📊 Was passiert während des Tests?

```
🧪 Transaktions-Loop-Tester

✅ Umgebungsvariablen validiert
📊 Test-Konfiguration:
   Schleife: 10
   Verzögerung: 30000ms
   Test-Typ: all
   Netzwerk: Sepolia

🔧 Setup validiere...
✅ Setup validiert
  Wallet 1: 0.1 AERA, 0.02 ETH
  Wallet 2: 0.05 AERA, 0.015 ETH

🚀 Starte Loop mit 10 Transaktionen...
⏱️  Verzögerung zwischen TXs: 30000ms

📍 Iteration 1/10
🔥 Burn TX von 0x1234...
⏳ Warte auf Bestätigung... 0xabcd...
✅ Burn erfolgreich! Gas: 48250, Kosten: $0.0542

💸 Transfer TX von 0x1234... zu 0x0987...
⏳ Warte auf Bestätigung... 0xfghi...
✅ Transfer erfolgreich! Gas: 52100, Kosten: $0.0585

...

═════════════════════════════════════════
📊 TEST SUMMARY
═════════════════════════════════════════
Test ID: test-1730887445123
Start Time: 2025-11-06T14:30:45.123Z
End Time: 2025-11-06T14:42:30.456Z
Duration: 705.33s

Total Transactions: 20
Success: 20 (100%)
Failed: 0

Total Gas: 2050000
Total Cost: $2.31
Avg Cost per TX: $0.1155
═════════════════════════════════════════

✅ Log gespeichert: logs/tx-tests/test-1730887445123/transaction-log.json
✅ CSV gespeichert: logs/tx-tests/test-1730887445123/transactions.csv
✅ Test abgeschlossen!
```

## 📁 Nach dem Test: Logs analysieren

```bash
# JSON-Log anschauen:
cat logs/tx-tests/test-1730887445123/transaction-log.json | jq

# CSV in Excel öffnen:
open logs/tx-tests/test-1730887445123/transactions.csv
```

## 🔧 Konfigurationen anpassen

### Schnelle Tests (5 Min)
```bash
TX_LOOP_COUNT=3
TX_DELAY_MS=15000
TX_TEST_TYPE=transfer
```

### Langzeitbelastungstest (30 Min)
```bash
TX_LOOP_COUNT=30
TX_DELAY_MS=60000
TX_TEST_TYPE=all
```

### Nur Burn testen
```bash
TX_LOOP_COUNT=10
TX_TEST_TYPE=burn
```

### Nur Transfer testen
```bash
TX_LOOP_COUNT=10
TX_TEST_TYPE=transfer
```

## ⚠️ Häufige Fehler & Lösungen

### "Test Wallet hat weniger als 0.5 AERA"
```
→ Gib mehr AERA an Wallet1 ein von deinem Hauptaccount
→ Oder reduziere TX_LOOP_COUNT
```

### "nonce too low" oder "nonce too high"
```
→ Erhöhe TX_DELAY_MS von 30000 auf 45000 oder 60000
→ Dies verhindert Nonce-Konflikte
```

### "Network timeout"
```
→ Prüfe ob du VPN brauchst (Port 443 blockiert?)
→ Oder verwende alternative RPC in .env.local
```

### "Transaction reverted"
```
→ Check Wallet hat genug ETH für Gas
→ Check Wallet hat genug AERA zum Burn
→ Check Gas-Limit nicht zu niedrig
```

## 🔐 Nach dem Test: Cleanup!

```bash
# Test-Wallets aus .env.local löschen:
nano .env.local
# → Setze zurück auf "your_test_wallet_X_address_here" etc.

# Oder alte Logs löschen wenn nicht mehr nötig:
rm -rf logs/tx-tests/test-*

# Private Keys aus Ledger sind NICHT betroffen
# (die sind nur auf der Hardware Wallet!)
```

## 📖 Ausführliche Dokumentation

Siehe: `docs/TRANSACTION-LOOP-TESTER.md`

---

**Viel Erfolg beim Testing! 🚀**

Need help? Check the logs in `logs/tx-tests/`
