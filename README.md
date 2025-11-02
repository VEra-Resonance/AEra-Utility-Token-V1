# ÆRA Token 🪙

Ein fortschrittlicher ERC-20 Token auf der Ethereum Blockchain mit erweiterten Funktionen.

## 🌟 Features

- **ERC-20 Standard**: Vollständig kompatibel mit dem ERC-20 Token-Standard
- **Pausierbar**: Token-Transfers können vom Owner pausiert werden
- **Verbrennbar**: Token können dauerhaft aus dem Umlauf entfernt werden
- **Mintbar**: Neue Token können bis zur maximalen Obergrenze geprägt werden
- **ERC-20 Permit**: Gaslose Genehmigungen durch Off-Chain-Signaturen
- **Sicherheit**: Basiert auf bewährten OpenZeppelin-Contracts
- **Emergency Functions**: Notfall-Funktionen für versehentlich gesendete Assets

## 📊 Token-Details

| Eigenschaft | Wert |
|-------------|------|
| Name | ÆRA Token |
| Symbol | AERA |
| Decimals | 18 |
| Initial Supply | 100.000.000 AERA |
| Max Supply | 1.000.000.000 AERA |
| Standard | ERC-20 |

## 🚀 Schnellstart

### 1. Repository klonen und Dependencies installieren

```bash
cd aera-token
npm install
```

### 2. Umgebungsvariablen einrichten

```bash
cp .env.example .env
# Bearbeite .env mit deinen echten Werten
```

### 3. Smart Contract kompilieren

```bash
npm run compile
```

### 4. Tests ausführen

```bash
npm test
```

### 5. Lokales Deployment

```bash
# In einem Terminal: Lokale Blockchain starten
npx hardhat node

# In einem anderen Terminal: Contract deployen
npm run deploy:localhost
```

## 📁 Projektstruktur

```
aera-token/
├── contracts/          # Smart Contracts
│   └── AeraToken.sol
├── scripts/            # Deployment & Interaktion
│   ├── deploy.js
│   └── interact.js
├── test/              # Tests
│   └── AeraToken.test.js
├── hardhat.config.js  # Hardhat-Konfiguration
├── package.json       # Dependencies
├── .env.example       # Umgebungsvariablen-Vorlage
└── README.md
```

## 🔧 Konfiguration

### .env Datei erstellen

```bash
cp .env.example .env
```

Fülle die .env Datei mit deinen echten Werten:

```env
PRIVATE_KEY=dein_privater_schlüssel_hier
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/DEIN-API-KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/DEIN-API-KEY
ETHERSCAN_API_KEY=dein_etherscan_api_key
```

## 🌐 Deployment

### Lokales Netzwerk (Testzwecke)

```bash
# Lokale Blockchain starten
npx hardhat node

# Contract deployen
npm run deploy:localhost
```

### Sepolia Testnet

```bash
npm run deploy:sepolia
```

### Ethereum Mainnet

```bash
npm run deploy:mainnet
```

## 🔍 Contract Verification

Nach dem Deployment auf einem öffentlichen Netzwerk:

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS 100000000 OWNER_ADDRESS
```

## 🧪 Tests

Alle Tests ausführen:

```bash
npm test
```

Tests mit Gas-Report:

```bash
REPORT_GAS=true npm test
```

Tests mit Coverage:

```bash
npx hardhat coverage
```

## 🎯 Interaktion mit dem Contract

Nach dem Deployment kannst du das Interaktions-Skript verwenden:

```bash
AERA_TOKEN_ADDRESS=0x... npx hardhat run scripts/interact.js --network localhost
```

## 🔐 Sicherheitsfeatures

### Owner-Funktionen

- `mint(address to, uint256 amount)`: Neue Token prägen
- `pause()`: Alle Transfers pausieren
- `unpause()`: Pausierung aufheben
- `emergencyEthWithdraw()`: ETH-Notfall-Abhebung
- `emergencyTokenWithdraw(address token, uint256 amount)`: Token-Notfall-Abhebung

### Benutzer-Funktionen

- `burn(uint256 amount)`: Eigene Token verbrennen
- `burnFrom(address account, uint256 amount)`: Genehmigte Token verbrennen
- Standard ERC-20 Funktionen: `transfer`, `approve`, etc.
- ERC-20 Permit: Gaslose Genehmigungen

## 📚 Smart Contract Details

### Hauptfunktionen

```solidity
// Minting (nur Owner)
function mint(address to, uint256 amount) external onlyOwner

// Pausierung (nur Owner)
function pause() external onlyOwner
function unpause() external onlyOwner

// Verbrennen
function burn(uint256 amount) public
function burnFrom(address account, uint256 amount) public

// Emergency Functions (nur Owner)
function emergencyEthWithdraw() external onlyOwner
function emergencyTokenWithdraw(address token, uint256 amount) external onlyOwner
```

### Events

```solidity
event TokensMinted(address indexed to, uint256 amount);
event TokensBurned(address indexed from, uint256 amount);
```

## 🛡️ Sicherheitsüberlegungen

1. **Owner Privileges**: Der Contract-Owner hat erweiterte Rechte. Verwende Multi-Sig-Wallets für Produktionsumgebungen.

2. **Pausierung**: Die Pausierungsfunktion kann alle Transfers stoppen. Verwende sie verantwortungsvoll.

3. **Max Supply**: Die maximale Token-Anzahl ist fest bei 1 Milliarde AERA begrenzt.

4. **Emergency Functions**: Nur für echte Notfälle verwenden, um versehentlich gesendete Assets zu retten.

## 📈 Deployment-Kosten (Schätzung)

| Netzwerk | Geschätzte Kosten |
|----------|-------------------|
| Sepolia Testnet | ~0.005 ETH |
| Ethereum Mainnet | ~0.02-0.05 ETH (je nach Gas-Preis) |

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Committe deine Änderungen
4. Push den Branch
5. Erstelle einen Pull Request

## 📄 Lizenz

MIT License - siehe LICENSE Datei für Details.

## ⚠️ Haftungsausschluss

Dieser Smart Contract wird "wie besehen" bereitgestellt. Teste gründlich auf Testnets bevor du auf Mainnet deployest. Die Autoren übernehmen keine Verantwortung für Verluste oder Schäden.

## 📞 Support

Bei Fragen oder Problemen erstelle ein Issue im Repository oder kontaktiere das Team.

---

**🎉 Viel Erfolg mit deinem ÆRA Token! 🎉**