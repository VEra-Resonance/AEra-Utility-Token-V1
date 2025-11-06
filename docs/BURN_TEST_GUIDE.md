# 🔥 Token Burn Test - Anleitung

**Datum:** November 5, 2025  
**Aktion:** Burn 1 AERA Token von deiner Wallet  
**Network:** Sepolia Testnet  

---

## 🎯 Was wir machen:

Wir verbrennen **1 AERA Token** permanent (Decreases Total Supply).

Das ist ein Test der `burn()` Funktion des Smart Contracts.

---

## 📋 Voraussetzungen

✅ Du brauchst mindestens **1 AERA Token** in deiner Wallet
✅ Die Wallet muss auf Sepolia Testnet sein
✅ Du brauchst ein wenig Sepolia ETH für Gas

---

## 🔥 Methode 1: MetaMask + Etherscan (EINFACHSTE)

### Schritt 1: Gehe zu Etherscan Write Contract
https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#writeContract

### Schritt 2: Connect MetaMask
1. Klicke "Connect to Web3"
2. Wähle MetaMask
3. Bestätige

### Schritt 3: Rufe burn() Funktion auf
1. Finde die Funktion: **`burn`**
2. Parameter:
   ```
   amount (uint256): 1000000000000000000
   ```
   (Das sind 1 AERA mit 18 Dezimalstellen)

3. Klicke **"Write"**
4. MetaMask Popup bestätigen

### Schritt 4: Warte auf Bestätigung
- Die TX sollte in ~20-30 Sekunden bestätigt sein
- Dann ist 1 AERA für immer weg! 🔥

**Fertig!** ✅

---

## 💻 Methode 2: Hardhat Console (PROGRAMMIERT)

```bash
cd /home/karlheinz/krypto/aera-token
npx hardhat console --network sepolia
```

Dann im Console:

```javascript
// Lade Contract
const aera = await ethers.getContractAt('AeraToken', '0x5032206396A6001eEaD2e0178C763350C794F69e');

// Hole Signer
const [signer] = await ethers.getSigners();

// Überprüfe Balance
const bal = await aera.balanceOf(signer.address);
console.log('Balance:', ethers.utils.formatEther(bal), 'AERA');

// Burn 1 AERA
const tx = await aera.burn(ethers.utils.parseEther('1'));
console.log('TX:', tx.hash);

// Warte auf Bestätigung
await tx.wait();
console.log('Burned!');

// Neue Balance
const newBal = await aera.balanceOf(signer.address);
console.log('New Balance:', ethers.utils.formatEther(newBal), 'AERA');

// Verlasse Console
.exit
```

---

## 📊 Was passiert beim Burn:

**Vorher:**
- Deine Balance: z.B. 2 AERA
- Total Supply: z.B. 102 AERA

**Burn 1 AERA:**
- ❌ 1 AERA wird aus deiner Wallet entfernt
- ❌ 1 AERA wird aus dem Total Supply entfernt
- 🔥 Die 1 AERA sind für immer weg (nicht wiederherstellbar!)

**Nachher:**
- Deine Balance: 1 AERA
- Total Supply: 101 AERA

---

## ✅ Verifizierung

Nach dem Burn kannst du überprüfen:

**Etherscan:**
https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#readContract

1. Klicke "Read Contract"
2. Suche `totalSupply()`
3. Total Supply sollte um 1 reduziert sein

---

## 🔍 Burn Event prüfen

Die `Transfer` Event zeigt den Burn (weil Burn ein Transfer zu 0x0000...0000 ist):

Auf Etherscan kannst du den TX anklicken und siehst:
```
From: [Deine Adresse]
To: 0x0000000000000000000000000000000000000000 (Dead Address)
Amount: 1 AERA
```

---

## ⚠️ WICHTIG

- **Burn ist PERMANENT** - du kannst die Token nicht zurückbekommen!
- **Es ist ein Test** - probiere es mit 1 AERA aus
- **Gas Kosten** - der Burn kostet ein wenig Sepolia ETH für Gas

---

## 🎯 Status

- [ ] Wähle Methode 1 oder 2
- [ ] Führe den Burn durch
- [ ] Überprüfe auf Etherscan
- [ ] Total Supply sollte um 1 reduziert sein

**Ready to burn? 🔥**

