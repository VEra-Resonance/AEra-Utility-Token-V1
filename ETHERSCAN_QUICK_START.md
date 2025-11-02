# ⚡ Etherscan Verification - Quick Start

## 🎯 In 5 Schritten zur Verifizierung

### Schritt 1: Etherscan API Key besorgen (2 Minuten)
```bash
1. Gehe zu: https://etherscan.io/apis
2. Registriere dich / Melde dich an
3. Bestätige deine Email
4. Klicke "+ Add" → "Free"
5. Kopiere deinen API Key
```

### Schritt 2: .env Datei aktualisieren
```bash
# Öffne: /home/karlheinz/krypto/aera-token/.env

# Füge diese Zeilen hinzu/aktualisiere sie:
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY_HERE
AERA_TOKEN_ADDRESS=0x5032206396A6001eEaD2e0178C763350C794F69e
```

### Schritt 3: Deployer-Adresse herausfinden
```bash
# In der Konsole beim Deployment sollte diese Zeile erscheinen:
# 🔑 Deploying with account: 0x{DEPLOYER_ADDRESS}

# Diese Adresse brauchst du gleich!
```

### Schritt 4: Verifizierung ausführen
```bash
# Navigiere ins Projektverzeichnis:
cd /home/karlheinz/krypto/aera-token

# Führe das Verifikations-Script aus:
npx hardhat run scripts/verify-etherscan.js --network sepolia

# ODER manuell mit hardhat verify:
npx hardhat verify --network sepolia 0x5032206396A6001eEaD2e0178C763350C794F69e 100000000 0x{DEPLOYER_ADDRESS}
```

### Schritt 5: Überprüfen
```bash
# Besuche die Etherscan Seite:
https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#code

# ✅ Wenn grüner Haken: Erfolgreich verifiziert!
```

---

## 📝 Parameter erklären

```bash
npx hardhat verify --network sepolia {CONTRACT_ADDRESS} {INITIAL_SUPPLY} {OWNER_ADDRESS}
```

| Parameter | Wert | Erklärung |
|-----------|------|-----------|
| `--network sepolia` | sepolia | Netzwerk (Sepolia Testnet) |
| `{CONTRACT_ADDRESS}` | 0x5032... | Die Contract-Adresse auf Sepolia |
| `{INITIAL_SUPPLY}` | 100000000 | 100 Million Token (NICHT in Wei!) |
| `{OWNER_ADDRESS}` | 0x... | Die Wallet-Adresse des Owners |

---

## ❌ Häufige Fehler

### Fehler 1: "Invalid API key"
```
❌ Lösung: Überprüfe, dass ETHERSCAN_API_KEY korrekt in .env eingetragen ist
```

### Fehler 2: "Contract not found"
```
❌ Lösung: Stelle sicher, dass die Contract Address auf Sepolia deployed ist
```

### Fehler 3: "Constructor arguments invalid"
```
❌ Lösung: Initial Supply muss 100000000 sein, NICHT 100000000 * 10^18
✅ Korrekt: npx hardhat verify ... 100000000 0x...
❌ Falsch:  npx hardhat verify ... 100000000000000000000000000 0x...
```

### Fehler 4: "Already Verified"
```
✅ Bedeutet: Contract ist schon verifiziert! Das ist gut!
🔗 Ansicht: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#code
```

---

## 🔗 Nützliche Links

- **Etherscan Sepolia:** https://sepolia.etherscan.io
- **Unser Contract:** https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
- **Hardhat Docs:** https://hardhat.org/hardhat-runner/docs/guides/verifying

---

## 💡 Pro-Tipps

### Tipps 1: Mehrere Versuche sparen
```bash
# Speichere die Constructor Args in eine Datei:
npx hardhat run scripts/encode-constructor-args.js

# Dann kannst du sie immer wieder verwenden
```

### Tipps 2: Manuelle Verifizierung als Backup
```bash
# Falls das Skript fehlschlägt:

1. Generiere flattened source code:
   npx hardhat flatten contracts/AeraToken.sol > AeraToken_flat.sol

2. Gehe zu Etherscan und lade den Code manuell hoch
3. Füge die Constructor Args im ABI-Format ein
```

### Tipps 3: Nach Mainnet
```bash
# Gleiche Schritte, aber für Mainnet:

# 1. Update .env für Mainnet
# 2. Deploy auf Mainnet
# 3. Verifiziere auf Mainnet:
npx hardhat verify --network mainnet {CONTRACT_ADDRESS} 100000000 0x{OWNER}
```

---

## ✅ Checkliste

- [ ] Etherscan Account erstellt
- [ ] API Key in .env eingetragen
- [ ] Contract auf Sepolia deployed
- [ ] AERA_TOKEN_ADDRESS in .env
- [ ] Deployer-Adresse notiert
- [ ] Verifizierungs-Script ausgeführt
- [ ] Grüner Haken auf Etherscan ✅

---

**Hilfreiche Ressource:** Siehe ETHERSCAN_VERIFICATION.md für detaillierte Anleitung
