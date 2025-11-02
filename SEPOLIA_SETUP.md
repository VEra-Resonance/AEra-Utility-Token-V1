# Sepolia Testnet Setup - Schritt für Schritt

## 🔗 **1. Alchemy Account erstellen (kostenlos)**

1. Gehe zu: https://www.alchemy.com/
2. Erstelle kostenlosen Account
3. Klicke "Create App"
4. Wähle:
   - Name: "ÆRA Token Testnet"
   - Chain: Ethereum
   - Network: Sepolia
5. Kopiere die RPC URL (sieht aus wie: https://eth-sepolia.g.alchemy.com/v2/abc123...)

## 🎁 **2. Testnet ETH besorgen (kostenlos)**

1. Gehe zu: https://sepoliafaucet.com/
2. Oder: https://faucet.sepolia.dev/
3. Verbinde MetaMask mit Sepolia Netzwerk
4. Fordere 0.5 ETH an (reicht für mehrere Deployments)

## 🔑 **3. Etherscan API Key (kostenlos, für Verifizierung)**

1. Gehe zu: https://etherscan.io/apis
2. Erstelle Account
3. Erstelle neuen API Key
4. Kopiere den Key

## ⚙️ **4. .env Datei konfigurieren**

Die Datei .env.example ist schon da, kopiere sie:
```bash
cp .env.example .env
```

Dann fülle sie mit deinen echten Werten aus.

## 🚀 **5. Deployment starten**
```bash
npm run deploy:sepolia
```

## ✅ **6. Contract verifizieren**
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS 100000000 OWNER_ADDRESS
```

Nach erfolgreichem Deployment:
- Contract ist öffentlich auf Sepolia
- Jeder kann ihn auf Etherscan sehen
- Community kann testen
- Basis für Mainnet-Deployment