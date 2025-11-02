# 🔍 Etherscan Contract Verification Guide - AERA Token

## 📋 Deployment-Informationen

### Contract Details
- **Contract Name:** AeraToken
- **Network:** Ethereum Sepolia Testnet (Netzwerk-ID: 11155111)
- **Solidity Version:** 0.8.20
- **License:** MIT
- **Compiler Optimization:** Enabled (200 runs)

### Deployment Parameter
```javascript
// Constructor Arguments
initialSupply: 100_000_000      // 100 Million AERA Token
initialOwner: {DEPLOYER_ADDRESS} // Wallet-Adresse des Owners
```

### Token Information
- **Token Name:** AEra Token
- **Token Symbol:** AERA
- **Decimals:** 18
- **Max Supply:** 1,000,000,000 AERA (1 Billion)
- **Initial Supply:** 100,000,000 AERA (100 Million)

---

## 🚀 Schritt-für-Schritt Verification auf Etherscan

### Methode 1: Automatische Verifizierung mit Hardhat (EMPFOHLEN)

#### Schritt 1: Etherscan API Key besorgen
1. Gehe zu https://etherscan.io/apis
2. Registriere dich und bestätige deine Email
3. Erstelle einen neuen API Key
4. Kopiere deinen API Key

#### Schritt 2: Umgebungsvariablen aktualisieren
```bash
# Bearbeite .env Datei:
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY_HERE
AERA_TOKEN_ADDRESS=0x5032206396A6001eEaD2e0178C763350C794F69e
```

#### Schritt 3: Automatische Verifizierung
```bash
# Navigiere zum Projektverzeichnis
cd /home/karlheinz/krypto/aera-token

# Führe das Verifikations-Skript aus
npx hardhat verify --network sepolia 0x5032206396A6001eEaD2e0178C763350C794F69e 100000000 0x{DEPLOYER_ADDRESS}
```

**Erklärung der Parameter:**
- `--network sepolia`: Netzwerk angeben
- `0x5032206396A6001eEaD2e0178C763350C794F69e`: Contract Address
- `100000000`: Initial Supply (100M Token in ganzen Token, nicht Wei)
- `0x{DEPLOYER_ADDRESS}`: Owner-Adresse (mit 0x prefix)

---

### Methode 2: Manuelle Verifizierung auf Etherscan.io

#### Schritt 1: Flattened Source Code vorbereiten
```bash
# Generiere einen flattened/kombinierten Sourcecode
npx hardhat flatten contracts/AeraToken.sol > AeraToken_flat.sol
```

#### Schritt 2: Auf Etherscan hochladen
1. Gehe zu: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#code
2. Klicke auf "Code"
3. Klicke auf "Verify and Publish"
4. Wähle:
   - Compiler Type: **Solidity (Single file)**
   - Compiler Version: **v0.8.20+commit.a35305b**
   - Open Source License Type: **MIT**

#### Schritt 3: Quellcode hochladen
- Kopiere den kompletten Inhalt aus `AeraToken_flat.sol`
- Paste in das Etherscan-Formular
- Klicke "Verify and Publish"

---

## 📝 Constructor Arguments (ABI-Encoded)

Wenn Etherscan fragt nach konstruktor-Argumenten im ABI-Encoded Format:

```bash
# Generiere ABI-encoded constructor arguments
npx hardhat run scripts/encode-constructor-args.js --network sepolia
```

Oder manuell (mit web3.js):
```javascript
const web3 = require('web3');

const initialSupply = web3.utils.toBN('100000000');
const initialOwner = '0x{DEPLOYER_ADDRESS}';

const encoded = web3.eth.abi.encodeParameters(
    ['uint256', 'address'],
    [initialSupply, initialOwner]
);

console.log('ABI-Encoded Constructor Args:', encoded);
```

---

## ✅ Verifizierungs-Checkliste

- [ ] Etherscan API Key erstellt
- [ ] .env Datei mit API Key aktualisiert
- [ ] AERA_TOKEN_ADDRESS in .env eingetragen
- [ ] Solidity-Version korrekt (0.8.20)
- [ ] Constructor-Parameter korrekt (100_000_000, Owner-Adresse)
- [ ] Compiler-Optimierung richtig (Enabled, 200 runs)
- [ ] License ist MIT

---

## 🔗 Wichtige Links

### Sepolia Testnet
- **Etherscan Sepolia:** https://sepolia.etherscan.io
- **Contract Address:** https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
- **Sepolia Faucet:** https://sepolia-faucet.pk910.de

### Ethereum Mainnet
- **Etherscan Mainnet:** https://etherscan.io
- **Mainnet Deployment:** Erst nach erfolgreichem Testnet-Test

---

## 📚 Zusätzliche Ressourcen

### Contract Features
✅ **ERC-20 Standard** - Vollständig kompatibel
✅ **Burnable** - Token können verbrannt werden
✅ **Pausable** - Transfers können pausiert werden
✅ **ERC-20 Permit** - Gaslose Genehmigungen
✅ **Ownable** - Nur Owner kann Funktionen ausführen
✅ **Emergency Functions** - Für versehentlich gesendete Token/ETH

### Kompilierungs-Details
```javascript
// hardhat.config.js Settings
solidity: {
  version: "0.8.20",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
```

---

## ⚠️ Wichtige Hinweise

1. **Private Keys:** Teile niemals deinen Private Key! Die .env Datei sollte NIEMALS committed werden.
2. **Gas Kosten:** Verifizierung kostet keine Gas, ist aber begrenzt auf einige Versuche pro Stunde.
3. **Compiler Version:** Muss exakt mit der verwendeten Version übereinstimmen.
4. **OpenZeppelin:** Wird automatisch flattened und inkludiert.

---

## 🆘 Troubleshooting

### Problem: "Compiler version mismatch"
- Stelle sicher, dass die Hardhat-Compiler Version mit der Contract-Version übereinstimmt
- Lösche `artifacts/` und `cache/` und recompiliere: `npx hardhat compile`

### Problem: "Constructor arguments invalid"
- Überprüfe die Reihenfolge: `initialSupply` dann `initialOwner`
- Der Wert muss in ganzen Token sein, nicht Wei (100_000_000, nicht 100_000_000 * 10^18)

### Problem: "Cannot find contract to verify"
- Stelle sicher, dass die Contract Address korrekt auf Sepolia deployed ist
- Nutze: `npx hardhat verify --list-networks` um alle Netzwerke zu sehen

---

## 📞 Support

Bei Fragen:
- 📖 Hardhat Docs: https://hardhat.org/hardhat-runner/docs/guides/verifying
- 🔗 Etherscan Help: https://info.etherscan.com/how-to-verify-a-smart-contract/
- 💬 Telegram Bot Support: @AERASupport

---

**Zuletzt aktualisiert:** 2. November 2025  
**Status:** Bereit für Verifizierung auf Sepolia Testnet  
**Nächster Schritt:** Mainnet Deployment nach erfolgreichem Testnet-Test
