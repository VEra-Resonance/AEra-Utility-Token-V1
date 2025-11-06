# ÆRA Token - Sepolia Testnet Setup Guide

## 🚀 **Schritt-für-Schritt Sepolia Deployment**

### **1. Testnet ETH besorgen**
1. Gehe zu: https://sepoliafaucet.com/
2. Verbinde deine MetaMask Wallet
3. Fordere kostenlose Sepolia ETH an (0.5 ETH reichen)

### **2. Umgebungsvariablen einrichten**
```bash
cp .env.example .env
```

Fülle die .env Datei:
```env
# Dein privater Schlüssel (OHNE 0x)
PRIVATE_KEY=dein_privater_schlüssel_hier

# Alchemy/Infura Sepolia RPC URL (kostenlos)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/dein-api-key

# Etherscan API Key (für Verifizierung, kostenlos)
ETHERSCAN_API_KEY=dein_etherscan_api_key
```

### **3. Deployment ausführen**
```bash
npm run deploy:sepolia
```

### **4. Contract verifizieren**
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS 100000000 OWNER_ADDRESS
```

### **5. Öffentlich zugänglich machen**
- Contract auf Etherscan anzeigen
- Token-Adresse teilen
- Community-Testing starten

## 🔗 **Wichtige Links**
- Sepolia Faucet: https://sepoliafaucet.com/
- Alchemy (RPC): https://www.alchemy.com/
- Etherscan Sepolia: https://sepolia.etherscan.io/
- Etherscan API Keys: https://etherscan.io/apis

## 📊 **Nach dem Deployment**
Du erhältst:
- Öffentliche Contract-Adresse
- Etherscan-Link zum Contract
- Verifizierten Source Code
- Öffentlich testbaren Token

## 🎯 **Warum Sepolia zuerst?**
- ✅ Kostenlos testen
- ✅ Öffentlich zugänglich
- ✅ Community kann mitmachen
- ✅ Echte Blockchain-Umgebung
- ✅ Basis für Mainnet-Deployment