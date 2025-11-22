# 💰 Portfolio Consolidator - Quick Start

## ⚡ 2-Minuten Setup

### Was es macht:

```
Test Wallet 1: 49 AERA + 0.039 ETH
Test Wallet 2: 101 AERA + 0.050 ETH
         ↓
    [Programm analysiert]
         ↓
Ledger Wallet: 150 AERA + 0.089 ETH ✅
```

---

## 🚀 STARTEN

### Schritt 1: Konfiguration prüfen

```bash
cat .env.local | grep LEDGER
```

Sollte zeigen:
```
LEDGER_WALLET_1=0x27F8233Ae2FC3945064c0bad72267e68bC28AaAa
```

✅ Das ist deine Ledger Wallet - automatisch konfiguriert!

---

### Schritt 2: Programm starten

```bash
npm run consolidate:portfolio
```

---

### Schritt 3: Output reviewen

Das Programm zeigt:
1. **Analyse** - Was auf jeder Wallet ist
2. **Summary** - Gesamt-Vermögen
3. **Plan** - Welche Transfers geplant
4. **Execution** - Transfers werden durchgeführt
5. **Report** - Finales Ergebnis

---

## 📊 BEISPIEL-OUTPUT

```
╔═══════════════════════════════════════════════════╗
║  💰 Portfolio Analyzer & Consolidator             ║
╚═══════════════════════════════════════════════════╝

📊 Analysiere Test Wallet 1...
📊 Analysiere Test Wallet 2...

💰 PORTFOLIO SUMMARY
═══════════════════════════════════════════════════

📍 Test Wallet 1
   ETH: 0.039900 ETH
   AERA: 49.00 AERA

📍 Test Wallet 2
   ETH: 0.050000 ETH
   AERA: 101.00 AERA

📊 GESAMT-VERMÖGEN:
   Total ETH: 0.089900 ETH
   Total AERA: 150.00 AERA

🚀 KONSOLIDIERUNGS-PLAN
═══════════════════════════════════════════════════
📋 4 Transaktionen geplant:
   1. Test Wallet 1 → Send 0.0349 ETH
   2. Test Wallet 1 → Send 49 AERA
   3. Test Wallet 2 → Send 0.0500 ETH
   4. Test Wallet 2 → Send 101 AERA

💸 STARTE KONSOLIDIERUNG...
📍 Transfer 1/4 ... ✅ Success
📍 Transfer 2/4 ... ✅ Success
📍 Transfer 3/4 ... ✅ Success
📍 Transfer 4/4 ... ✅ Success

📊 KONSOLIDIERUNGS-REPORT
✅ Erfolgreich: 4
❌ Fehler: 0
```

---

## 🔒 SICHERHEIT

✅ **Private Keys bleiben lokal**
- Werden NICHT hochgeladen
- Nur zur lokalen Signaturen

✅ **Nur Adresse zu Ledger nötig**
- Kein Private Key erforderlich
- 100% sicher

✅ **ETH Gebührenreserve**
- Behält 0.005 ETH
- Für zukünftige Transaktionen

---

## 🎯 WAS WIRD GEMACHT

### 1. Analyse Phase
```
├─ Test Wallet 1
│  ├─ Sepolia ETH Balance: 0.039900
│  └─ Sepolia AERA Balance: 49.00
└─ Test Wallet 2
   ├─ Sepolia ETH Balance: 0.050000
   └─ Sepolia AERA Balance: 101.00
```

### 2. Consolidation Phase
```
Transfer 1: 0.0349 ETH von Wallet1 → Ledger
Transfer 2: 49 AERA von Wallet1 → Ledger
Transfer 3: 0.0500 ETH von Wallet2 → Ledger
Transfer 4: 101 AERA von Wallet2 → Ledger
```

### 3. Result
```
Ledger Wallet hat jetzt:
✅ 0.0849 ETH (für zukünftige TXs)
✅ 150 AERA (dein ganzes Portfolio)
```

---

## 📋 ABLAUF

```
1. Programm startet
   ↓
2. Liest .env.local
   ├─ TEST_WALLET_1_PRIVATE_KEY
   ├─ TEST_WALLET_2_PRIVATE_KEY
   └─ LEDGER_WALLET_1 (Ziel)
   ↓
3. Verbindet zu Sepolia RPC
   ↓
4. Liest Balances von Test Wallets
   ├─ ETH Balance
   └─ AERA Balance
   ↓
5. Erstellt Transfer-Plan
   ↓
6. Für jeden Transfer:
   ├─ Erstellt TX
   ├─ Signiert lokal
   ├─ Sendet zu Blockchain
   └─ Wartet auf Bestätigung
   ↓
7. Zeigt Report
```

---

## ⚠️ WICHTIG

1. **Ledger Wallet verifizieren**
   ```bash
   # Das sollte DEINE Adresse sein:
   0x27F8233Ae2FC3945064c0bad72267e68bC28AaAa
   ```

2. **Nur Sepolia zum Testen**
   - Aktuell: Nur Testnet
   - AERA + ETH sind billig zum Testen

3. **Private Keys geschützt**
   - Bleiben in `.env.local`
   - In `.gitignore` (nicht commited)

---

## 🚀 STARTEN

```bash
# Ready to go!
npm run consolidate:portfolio
```

Das wars! 💰

---

**Hinweis:** Nach dem Test werden alle Assets zu deiner Ledger Wallet konsolidiert!

**Nächste Features:**
- [ ] User Confirmation vor Execution
- [ ] Mainnet Support
- [ ] Mehr Token-Types
- [ ] Mehr Chains (Polygon, Arbitrum, etc.)
