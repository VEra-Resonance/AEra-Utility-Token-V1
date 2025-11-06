# 🪙 AERA Token minten - Anleitung

**Datum:** 2. November 2025  
**Network:** Sepolia Testnet  
**Contract:** 0x5032206396A6001eEaD2e0178C763350C794F69e  
**Owner:** 0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93 (Gnosis Safe Multi-Sig 2-of-3)

---

## ⚠️ WICHTIG: Multi-Sig Ownership

Das Minting wird jetzt durch eine **Gnosis Safe Multi-Signature Wallet** geschützt:

- **Owner Address:** 0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93
- **Typ:** 2-of-3 Multi-Sig (2 von 3 Unterschriften erforderlich)
- **Bedeutung:** NIEMAND kann alleine minten → Minimales Vertrauen erforderlich
- **Sicherheit:** Tokens sind maximal geschützt vor unkontrolliertem Minting

### Warum Multi-Sig?
✅ Keine Einzelperson kann alleine Token creieren  
✅ Mindestens 2 unabhängige Bestätigungen nötig  
✅ Transparenz & Governance durch Blockchain  
✅ Maximale Sicherheit für AERA Holder  

---

## 🎯 Überblick: 3 Wege zum Minten

| Methode | Schwierigkeit | Zeit | Beschreibung |
|---------|---------------|------|-------------|
| **1. MetaMask (Etherscan UI)** | ⭐ Einfach | 5 min | Web-Interface |
| **2. Hardhat Script** | ⭐⭐ Mittel | 10 min | Automatisiert |
| **3. Web3.js Code** | ⭐⭐⭐ Komplex | 15 min | Programmiert |

---

## ✅ Methode 1: MetaMask + Etherscan (EINFACHSTE METHODE)

### ⚠️ WICHTIG: Safe-Bestätigung erforderlich

Da der Contract im Besitz einer **Gnosis Safe Multi-Sig Wallet** ist, wird jede Mint-Transaktion so funktionieren:

1. **Transaktion wird eingereicht** → In der Safe als "Proposal" angezeigt
2. **Erste Bestätigung** → Ein Signer bestätigt die Transaktion
3. **Zweite Bestätigung** → Ein zweiter Signer bestätigt → **Transaktion wird ausgeführt**

**Safe-Link:** https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

---

### Schritt 1: Etherscan öffnen

Gehe zu: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#writeContract

### Schritt 2: Contract Interaction öffnen

1. Klicke auf **"Code"** Tab
2. Scrolle zu **"Write Contract"** Sektion
3. Klicke **"Connect to Web3"**
4. Wähle **MetaMask**
5. Bestätige in MetaMask

### Schritt 3: Mint Function aufrufen

1. Finde die Funktion: **`mint`**
   ```
   mint(address to, uint256 amount)
   ```

2. Fülle folgende Felder aus:

   🔴 **KRITISCH:** Das `To`-Feld muss der **Token-Contract** sein (0x5032206396A6001eEaD2e0178C763350C794F69e), **NICHT die Safe-Adresse**! Sonst funktioniert das Minting nicht.

   **`to` (address):**
   ```
   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```
   (Oder deine eigene Wallet-Adresse)

   **`amount` (uint256):**
   ```
   1000000000000000000
   ```
   (Das sind 1 AERA Token, da 18 Dezimalstellen)

   **Oder für 1.000 AERA:**
   ```
   1000000000000000000000
   ```

### Schritt 4: Transaktion senden

1. Klicke **"Write"** Button
2. MetaMask öffnet sich
3. Überprüfe Gas-Gebühren
4. Klicke **"Confirm"**
5. **Safe wird aktiviert:**
   - Transaktion erscheint in der Safe als "Pending"
   - **Signer 1** muss bestätigen
   - **Signer 2** muss bestätigen (triggert Ausführung)
   - Warte ~30 Sekunden bis Transaktion auf Blockchain ist

### ✅ Fertig!

Neue Tokens sind in deiner Wallet! 🎉

**Safe-Status überprüfen:** https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

---

## ⚙️ Methode 2: Hardhat Script (AUTOMATISIERT)

### Schritt 1: Mint-Script erstellen

```bash
cd /home/karlheinz/krypto/aera-token
nano scripts/mint-tokens.js
```

### Schritt 2: Folgendes einfügen

```javascript
const hre = require("hardhat");
require('dotenv').config();

async function main() {
    const AERA_TOKEN_ADDRESS = process.env.AERA_TOKEN_ADDRESS;
    const AMOUNT_TO_MINT = process.env.MINT_AMOUNT || "1000000000000000000"; // 1 AERA default
    
    if (!AERA_TOKEN_ADDRESS || AERA_TOKEN_ADDRESS === 'your_deployed_contract_address_here') {
        console.log('❌ AERA_TOKEN_ADDRESS not set in .env');
        process.exit(1);
    }
    
    console.log('🪙 AERA Token Minting...\n');
    console.log(`📍 Contract: ${AERA_TOKEN_ADDRESS}`);
    console.log(`📊 Amount: ${hre.ethers.utils.formatEther(AMOUNT_TO_MINT)} AERA`);
    console.log(`🌐 Network: Sepolia\n`);
    
    // Get contract instance
    const AeraToken = await hre.ethers.getContractAt('AeraToken', AERA_TOKEN_ADDRESS);
    
    // Get signer (owner)
    const [signer] = await hre.ethers.getSigners();
    console.log(`👤 Signer: ${signer.address}\n`);
    
    // Check owner
    const owner = await AeraToken.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log('❌ Only owner can mint! You are not the owner.');
        console.log(`Owner: ${owner}`);
        console.log(`Your Address: ${signer.address}`);
        process.exit(1);
    }
    
    // Perform mint
    try {
        console.log('⏳ Minting tokens...');
        const tx = await AeraToken.mint(signer.address, AMOUNT_TO_MINT);
        console.log(`📝 Transaction: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Minted successfully!\n`);
        
        // Check new balance
        const balance = await AeraToken.balanceOf(signer.address);
        console.log(`💰 Your new balance: ${hre.ethers.utils.formatEther(balance)} AERA`);
        
        // Check total supply
        const totalSupply = await AeraToken.totalSupply();
        console.log(`📈 Total Supply: ${hre.ethers.utils.formatEther(totalSupply)} AERA`);
        
        // Check max supply
        const maxSupply = await AeraToken.MAX_SUPPLY();
        console.log(`🔒 Max Supply: ${hre.ethers.utils.formatEther(maxSupply)} AERA\n`);
        
        console.log('🎉 Minting complete!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
```

### Schritt 3: .env aktualisieren

```bash
nano .env
```

Füge diese Zeile hinzu:

```env
MINT_AMOUNT=1000000000000000000
```

(Das ist 1 AERA Token)

### Schritt 4: Script ausführen

```bash
npm run mint
```

Oder manuell:

```bash
npx hardhat run scripts/mint-tokens.js --network sepolia
```

### Output Beispiel:

```
🪙 AERA Token Minting...

📍 Contract: 0x5032206396A6001eEaD2e0178C763350C794F69e
📊 Amount: 1.0 AERA
🌐 Network: Sepolia

👤 Signer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

⏳ Minting tokens...
📝 Transaction: 0x1234...
✅ Minted successfully!

💰 Your new balance: 101.0 AERA
📈 Total Supply: 101.0 AERA
🔒 Max Supply: 1000000000.0 AERA

🎉 Minting complete!
```

---

## 💻 Methode 3: Web3.js Code (PROGRAMMIERT)

### Schritt 1: Script erstellen

```bash
nano scripts/mint-advanced.js
```

### Schritt 2: Code einfügen

```javascript
const { Web3 } = require('web3');
require('dotenv').config();

const web3 = new Web3(process.env.SEPOLIA_RPC_URL);

const AERA_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

async function mintTokens() {
    try {
        const contract = new web3.eth.Contract(
            AERA_ABI,
            process.env.AERA_TOKEN_ADDRESS
        );

        const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
        web3.eth.accounts.wallet.add(account);

        const amountToMint = web3.utils.toWei('100', 'ether'); // 100 AERA
        
        console.log('🪙 Minting AERA Tokens...');
        console.log(`Amount: ${web3.utils.fromWei(amountToMint, 'ether')} AERA`);
        
        const tx = contract.methods.mint(account.address, amountToMint);
        const gas = await tx.estimateGas({ from: account.address });
        
        const txData = {
            to: process.env.AERA_TOKEN_ADDRESS,
            data: tx.encodeABI(),
            gas,
            gasPrice: await web3.eth.getGasPrice(),
            from: account.address,
            nonce: await web3.eth.getTransactionCount(account.address)
        };

        const signedTx = await web3.eth.accounts.signTransaction(txData, process.env.PRIVATE_KEY);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        console.log(`✅ Minted! Transaction: ${receipt.transactionHash}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

mintTokens();
```

### Schritt 3: Ausführen

```bash
node scripts/mint-advanced.js
```

---

## 🔍 Mint Status überprüfen

### Option 1: Etherscan

1. Gehe zu: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
2. Klicke **"Read Contract"**
3. Suche `totalSupply()` - gibt aktuelle Gesamtmenge
4. Suche `balanceOf()` - gibt deine Balance

### Option 2: Hardhat Console

```bash
npx hardhat console --network sepolia
```

```javascript
const AeraToken = await ethers.getContractAt('AeraToken', '0x5032206396A6001eEaD2e0178C763350C794F69e');
const totalSupply = await AeraToken.totalSupply();
console.log(ethers.utils.formatEther(totalSupply));
```

### Option 3: Script

```bash
npx hardhat run scripts/check-balance.js --network sepolia
```

---

## ⚠️ WICHTIGE REGELN BEIM MINTEN

### ✅ Erlaubt:
- Minten bis zur MAX_SUPPLY (1 Milliarde)
- Nur der Multi-Sig Owner kann Mint-Transaktionen initiieren
- Benötigt 2 von 3 Signer-Bestätigungen in der Safe
- Unlimited Mint-Anzahl (solange unter Max)

### ❌ Verboten:
- Minten über MAX_SUPPLY hinaus → **Error!**
- Minten ohne Safe-Bestätigung → **Transaktion scheitert!**
- Minten ohne 2-of-3 Bestätigungen → **Transaktion wird nicht ausgeführt!**

### Multi-Sig Sicherheit:
```
Mint-Transaktion:
1. Initiator submittet Transaktion an Safe
2. Signer 1: ✅ Bestätigt (1/2)
3. Signer 2: ✅ Bestätigt → Transaktion AUSGEFÜHRT! ✅
4. Signer 3: (nicht nötig bei 2-of-3)
```

### Beispiel: MAX_SUPPLY erreichen

```javascript
// MAX_SUPPLY = 1.000.000.000 AERA
// Aktuell: 100.000.000 AERA geminted

// ✅ OK: 900.000.000 AERA minten (bleibt unter Max)
const amount = ethers.utils.parseEther("900000000");
await AeraToken.mint(yourAddress, amount);

// ❌ FEHLER: 901.000.000 AERA minten (überschreitet Max)
const amount = ethers.utils.parseEther("901000000");
await AeraToken.mint(yourAddress, amount); // Throws error!
```

---

## 🧮 AERA Menge berechnen

Dein Token hat **18 Dezimalstellen** wie ETH.

### Formel:
```
Menge in Tokens = Eingabe / (10^18)
Eingabe = Menge in Tokens * (10^18)
```

### Beispiele:

| Tokens | Input (Wei) |
|--------|-------------|
| 1 AERA | `1000000000000000000` |
| 10 AERA | `10000000000000000000` |
| 100 AERA | `100000000000000000000` |
| 1.000 AERA | `1000000000000000000000` |
| 1.000.000 AERA | `1000000000000000000000000` |

### Einfacher: Nutze `ethers.utils.parseEther()`

```javascript
ethers.utils.parseEther("1")        // = 1.000.000.000.000.000.000
ethers.utils.parseEther("100")      // = 100.000.000.000.000.000.000
ethers.utils.parseEther("1000000")  // = 1.000.000.000.000.000.000.000000
```

---

## 📊 MINT STATUS PRÜFEN

```bash
npx hardhat run << 'EOF'
const contractAddress = '0x5032206396A6001eEaD2e0178C763350C794F69e';
const AeraToken = await ethers.getContractAt('AeraToken', contractAddress);

const totalSupply = await AeraToken.totalSupply();
const maxSupply = await AeraToken.MAX_SUPPLY();
const balance = await ethers.provider.getBalance(await ethers.getSigners().then(s => s[0].getAddress()));

console.log('📊 AERA Token Status:');
console.log(`Total Supply: ${ethers.utils.formatEther(totalSupply)} AERA`);
console.log(`Max Supply: ${ethers.utils.formatEther(maxSupply)} AERA`);
console.log(`Minted Percentage: ${(totalSupply * 100n / maxSupply).toString()}%`);
console.log(`Your Balance: ${ethers.utils.formatEther(balance)} ETH`);
EOF
```

---

## 🎯 SCHNELL-ANLEITUNG

### Schnellste Methode (MetaMask):
1. Gehe zu: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#writeContract
2. Connect MetaMask
3. Nutze `mint()` Funktion
4. Gib Adresse & Menge ein
5. Confirm - Fertig! ✅

### Automatisiert (Hardhat):
```bash
npx hardhat run scripts/mint-tokens.js --network sepolia
```

### Mit npm Script:
```bash
npm run mint
```

(Nach Installation des Scripts oben)

---

## 🔗 Nützliche Links

**Contract auf Etherscan:**
https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#code

**Write Contract (für MetaMask):**
https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#writeContract

**Read Contract (Status überprüfen):**
https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#readContract

---

## ❓ FAQ

**F: Kann ich als nicht-Owner minten?**  
A: ❌ Nein, nur die Safe (0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93) kann Minting initiieren. Und dann benötigt es 2-of-3 Bestätigungen.

**F: Was ist die Mint-Grenze?**  
A: Max 1 Milliarde AERA. Danach geht's nicht mehr.

**F: Kann ich den Owner ändern?**  
A: ✅ Nur wenn 2-of-3 Signer in der Safe zustimmen (transferOwnership).

**F: Fallen Gas-Gebühren an?**  
A: ✅ Ja, aber auf Sepolia sehr billig (Test-ETH). Plus Safe-Bestätigungen benötigen auch Gas.

**F: Wie lange dauert eine Mint-Transaktion?**  
A: ~30 Sekunden bis Ausführung + Zeit bis 2 Signer bestätigen (variabel, normalerweise <5 min).

**F: Kann ich das Minten deaktivieren?**  
A: ✅ Ja, mit `renounceOwnership()` (benötigt 2-of-3 Safe-Bestätigungen) - dann kann niemand mehr minten.

**F: Sind Mint-Transaktionen öffentlich sichtbar?**  
A: ✅ Ja! Alles auf dem Sepolia Testnet:
   - https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
   - Safe-Transaktionen: https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

---

## 🎊 Zusammenfassung

**3 Wege zum Minten:**

1. **MetaMask (Web)** - Einfachste Methode ⭐
   - https://sepolia.etherscan.io/address/.../writeContract
   - 5 Minuten, keine Programmierung

2. **Hardhat Script** - Automatisiert ⭐⭐
   - `npx hardhat run scripts/mint-tokens.js --network sepolia`
   - 10 Minuten, einfache Anleitung oben

3. **Web3.js** - Programmiert ⭐⭐⭐
   - Maximale Kontrolle & Flexibilität
   - Für Advanced Developer

**Empfehlung:** Nutze Methode 1 (MetaMask) zum Start! 🚀

---

**Erstellt:** 2. November 2025  
**Network:** Sepolia Testnet  
**Status:** ✅ Ready to Mint!

🪙 **Viel Spaß beim Minten deiner AERA Tokens!** 🚀

---

# === RPC URLS (PUBLIC - sicher) ===
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/[REDACTED-API-KEY]
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/[REDACTED-API-KEY]

# === API KEYS (PUBLIC - sicher) ===
ETHERSCAN_API_KEY=K5SUWMCY8GVHXHIUK8K1WZVBVXB2N6K45Y

# === CONTRACT ===
AERA_TOKEN_ADDRESS=0x5032206396A6001eEaD2e0178C763350C794F69e

# === LEDGER (für zukünftige Deployments) ===
# Falls du wieder deployen willst: Ledger Hardware Wallet verwenden!
# PRIVATE_KEY=<NIE WIEDER HARDCODED!>
