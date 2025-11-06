# 🎯 GS013 Fehlerbehandlung — Master Guide

**Konsolidiert aus:** DEBUG-GS013.md + SAFE-BURN-GS013.md  
**Version:** 2.0 (Merged & Optimized)  
**Datum:** 6. November 2025

---

## 🔍 Was ist GS013?

### Der Fehler

```solidity
Error: GS013
require(success || safeTxGas != 0 || gasPrice != 0, "GS013");
at SafeL2.execTransaction()
```

### Bedeutung

Die Gnosis Safe benötigt **EINES** der folgenden:

| Bedingung | Wert | Beispiel |
|-----------|------|---------|
| **success** | true | Innere TX erfolgreich ✅ |
| **safeTxGas** | > 0 | 150000 (Fehler toleriert) |
| **gasPrice** | > 0 | 1 Gwei (Refund möglich) |

**Wenn ALLE drei falsch sind → GS013 Error!**

---

## 🎯 Häufige Ursachen

### Ursache 1: Innere Funktion schlägt fehl ❌

**Beispiel:** `burn()` wird blockiert

**Gründe:**
- ❌ Safe hat keine Tokens
- ❌ Contract ist pausiert
- ❌ MAX_SUPPLY überschritten

**Lösung:**
```javascript
// Debug-Script ausführen
npx hardhat run scripts/debug-safe-burn.js --network sepolia
```

### Ursache 2: Keine Fehlertoleranz 🔧

**safeTxGas = 0, baseGas = 0, gasPrice = 0**

**Bedeutung:** Safe sagt "Wenn Fehler → sofort abbrechen"

**Lösung:**
```
Im Safe Dashboard vor Submit:
Advanced Options:
  SafeTxGas: 150000  ← NICHT 0!
  BaseGas: 0
  GasPrice: 0
```

### Ursache 3: Unvollständige Signaturen 🔐

**Nur 1 Signatur statt 2-of-3**

**Symptom:**
```
Pending Confirmations: 1/2
Status: Waiting for confirmations...
```

**Lösung:**
1. Signer 1 klickt "Confirm"
2. Wartet auf Pending
3. Signer 2 klickt "Confirm"
4. Nach 2. Signatur: Auto-Execute

---

## ✅ Lösungs-Workflow

### Schritt 1: Root Cause identifizieren

```bash
# A) Innere Funktion debuggen
npx hardhat run scripts/debug-safe-burn.js --network sepolia

# B) Ausgabe analysieren:
#    - Safe hat Tokens?
#    - Contract pausiert?
#    - Supply OK?
```

### Schritt 2: Safe-Parameter korrigieren

**Im Safe Dashboard:**

```
1. New Transaction
2. Contract Interaction
3. Wähle Funktion (z.B. burn)
4. WICHTIG: Advanced Options öffnen
5. Setze SafeTxGas: 150000
6. Review & Submit
```

### Schritt 3: Vollständige Signaturen

```
1. Nach Submit → Pending Confirmations: 0/2
2. Signer 1 öffnet Safe → "Confirm"
3. Warten auf: Pending Confirmations: 1/2
4. Signer 2 öffnet Safe → "Confirm"
5. Automatische Execution nach 2. Signatur ✅
```

---

## 🔥 Burn-spezifische Probleme

### Problem: Burn von Safe schlägt fehl

**Häufigste Ursache:** Safe hat keine Tokens!

**Check:**
```bash
# Auf Etherscan schauen
https://sepolia.etherscan.io/address/0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

# Token Holdings anschauen
# Sollte AERA Token mit Balance > 0 zeigen
```

**Wenn Balance = 0:**
```
Lösung 1: Transfer Tokens zur Safe (von Owner)
Lösung 2: Von anderer Wallet burnen (die Tokens hat)
```

### Problem: Nur 1 Signatur

**Ursache:** Nur ein Signer hat bestätigt

**Lösung:**
```
Safe Dashboard → Pending Transactions
├─ Signer 1: ✅ Confirmed
├─ Signer 2: ⏳ Waiting for confirmation
└─ Nach Signer 2 Bestätigung:
   Automatische Execution!
```

### Problem: Nonce-Mismatch

**Symptom:** Alte Transaktionen können nicht ausgeführt werden

**Lösung:**
```
Safe Dashboard → Settings → Nonce
Sollte sequenziell sein:
0 → 1 → 2 → 3 → 4 → 5 → 6
```

---

## 📋 Checkliste für erfolgreiche Safe TX

### ✅ Vorbereitung
- [ ] Richtige Wallet verbunden?
- [ ] Sepolia Netzwerk?
- [ ] Safe hat genug Tokens/ETH?
- [ ] 2-of-3 Signer verfügbar?

### ✅ Transaktions-Erstellung
- [ ] Richtige Funktion gewählt?
- [ ] Richtige Parameter (Amount)?
- [ ] Advanced Options: SafeTxGas > 0
- [ ] Review angeschaut?

### ✅ Signierung
- [ ] Signer 1: "Confirm" geklickt?
- [ ] Warten auf Pending?
- [ ] Signer 2: "Confirm" geklickt?
- [ ] Status: "Pending for Execution"?

### ✅ Execution
- [ ] Nach 2. Signatur: Auto-Execute?
- [ ] TX-Hash auf Etherscan?
- [ ] Status: "Success"?

---

## 🛠️ Debug-Tools

### Script 1: Burn Debugging
```bash
npx hardhat run scripts/debug-safe-burn.js --network sepolia
```

**Prüft:**
- Safe Token-Balance
- Contract Pause-Status
- Supply-Limits
- Recipient-Validierung

### Script 2: Mint Debugging
```bash
npx hardhat run scripts/debug-safe-mint.js --network sepolia
```

**Prüft:**
- Owner ist Safe?
- MAX_SUPPLY Limits
- Nonce-Status

### Script 3: Netzwerk Diagnostik
```bash
bash scripts/diagnose-network.sh
```

**Prüft:**
- DNS-Auflösung
- Port 443 (HTTPS)
- RPC-Erreichbarkeit
- Lokale Firewall

---

## 📊 Häufige Parameter-Werte

### Safe Burn TX
```
Function:       burn()
Amount:         1000000000000000000 (1 AERA in Wei)
SafeTxGas:      150000 ← Immer > 0!
BaseGas:        0
GasPrice:       0
Nonce:          [sequenziell]
Signaturen:     2-of-3 ✅
```

### Safe Mint TX
```
Function:       mint()
Recipient:      0x...
Amount:         1000000000000000000
SafeTxGas:      150000 ← Immer > 0!
BaseGas:        0
GasPrice:       0
Nonce:          [sequenziell]
Signaturen:     2-of-3 ✅
```

---

## 🔗 Referenzen

### Safe Dokumentation
- **Gnosis Safe Docs:** https://docs.safe.global/
- **GS013 Error:** https://github.com/safe-global/safe-contracts/blob/main/contracts/base/Executor.sol
- **Safe Dashboard:** https://app.safe.global/

### On-Chain Verifikation
```
Safe:       https://sepolia.etherscan.io/address/0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93
Token:      https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
```

---

## ✅ Erfolgs-Beispiele

### ✅ Burn TX #1 (Direct)
```
Status:     SUCCESS
TX:         0x90d7184b6bf45c885508b9ad1a500db86a0c9f9d171bac88a21c24287c6147d0
Amount:     1 AERA
Gas:        79,714 (optimiert)
Cost:       0.000119571 ETH (~$0.32)
```

### ✅ Burn TX #2 (Safe Multi-Sig)
```
Status:     EXECUTED
Created:    6.11.2025 07:24 UTC
Executed:   6.11.2025 07:27 UTC
Signers:    2-of-3 ✅
Nonce:      5
Amount:     1 AERA
```

**Beide erfolgreich weil:**
- ✅ SafeTxGas > 0 (Fehlertoleranz gesetzt)
- ✅ 2 Signaturen gesammelt
- ✅ Nonce sequenziell
- ✅ Parameter korrekt

---

## 🎓 Best Practices

### DO ✅
- ✅ Immer SafeTxGas > 0 setzen (z.B. 150000)
- ✅ Beide Signer müssen "Confirm" klicken
- ✅ Nonce-Sequenz beibehalten
- ✅ Debug-Scripts vor wichtigen TXs laufen
- ✅ Alles auf Etherscan verifizieren

### DON'T ❌
- ❌ Nicht SafeTxGas = 0 lassen
- ❌ Nicht mit nur 1 Signatur submitten
- ❌ Nicht Nonce-Sequenz durcheinander bringen
- ❌ Nicht ohne Debug verifizieren
- ❌ Nicht ohne Etherscan-Überprüfung trauen

---

## 📞 Troubleshooting Flowchart

```
GS013 Fehler erhalten?
│
├─ Innere TX (burn/mint) schlägt fehl?
│  ├─ JA → Siehe "Ursache 1"
│  │      Führe debug-safe-burn.js aus
│  └─ NEIN → Weiter
│
├─ SafeTxGas = 0?
│  ├─ JA → Siehe "Ursache 2"
│  │      Setze SafeTxGas = 150000
│  └─ NEIN → Weiter
│
├─ Nur 1 Signatur?
│  ├─ JA → Siehe "Ursache 3"
│  │      2. Signer muss "Confirm" klicken
│  └─ NEIN → Weitere Hilfe nötig
│
└─ Problem gelöst ✅
```

---

**Diese Master-Dokumentation ersetzt:**
- ❌ DEBUG-GS013.md (alte mint-fokussierte Version)
- ❌ SAFE-BURN-GS013.md (alte burn-fokussierte Version)
- ✅ GS013-FEHLERBEHANDLUNG.md (diese neue konsolidierte Version)

Alle Informationen sind hier zentral dokumentiert!
