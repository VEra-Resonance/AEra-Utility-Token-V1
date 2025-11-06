# 🎯 AEra Token — Quick Reference Card

**Version:** 1.0  
**Last Updated:** 6. November 2025

---

## 📍 Wichtige Adressen

```
Token:          0x5032206396A6001eEaD2e0178C763350C794F69e
Safe (Owner):   0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93
Burn Address:   0x0000000000000000000000000000000000000000
```

---

## 🔥 Schnell Burnen

### Via Etherscan (1 Click)
```
1. Öffne:   https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#writeContract
2. Connect: MetaMask
3. Function: burn()
4. Amount:   1000000000000000000 (= 1 AERA)
5. Write & Confirm
```

### Via Safe (2-of-3)
```
1. Öffne:   https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93
2. New Transaction → Contract Interaction
3. Function: burn(uint256 amount)
4. Amount:   1000000000000000000
5. Review → Submit → 2 Signaturen
```

---

## 💰 Token Infos

| Feld | Wert |
|------|------|
| Name | AEra Token |
| Symbol | AERA |
| Decimals | 18 |
| Current Supply | 99,999,998 AERA |
| Max Supply | 1,000,000,000 AERA |
| Status | ✅ Deployed & Verified |

---

## 🔗 Wichtige Links

| Link | URL |
|------|-----|
| **Etherscan** | https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e |
| **Safe** | https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93 |
| **Docs** | siehe `/docs/` Ordner |
| **GitHub** | https://github.com/koal0308/AEra |

---

## 🔐 Multi-Sig Info

```
Typ:            2-of-3 Gnosis Safe
Status:         ✅ Operational
Nonce:          5 (current)
Nächste:        6
Signers:        3 (2 required)
```

---

## 📊 Letzte Transaktionen

### Burn #1 (Direct)
```
Hash:   0x90d7184b6bf45c885508b9ad1a500db86a0c9f9d171bac88a21c24287c6147d0
Block:  9571057
Time:   Nov 6, 2025 06:27 UTC
Amount: 1 AERA
Status: ✅ SUCCESS
```

### Burn #2 (Safe)
```
Created:  Nov 6, 2025 07:24 UTC
Executed: Nov 6, 2025 07:27 UTC
Nonce:    5
Amount:   1 AERA
Status:   ✅ EXECUTED
```

---

## 🛠️ Häufige Befehle

```bash
# Compile
npm run compile

# Test
npm run test

# Deploy Localhost
npm run deploy:localhost

# Deploy Sepolia
npm run deploy:sepolia

# Verify
npm run verify:sepolia

# Debug
npx hardhat run scripts/debug-safe-burn.js --network sepolia
```

---

## 🎯 Funktionen

| Funktion | Wer | Status |
|----------|-----|--------|
| `burn()` | Jeder | ✅ Working |
| `burnFrom()` | Mit Genehmigung | ✅ Working |
| `transfer()` | Jeder | ✅ Working |
| `approve()` | Jeder | ✅ Working |
| `mint()` | Nur Owner (Safe) | ✅ Working |
| `pause()` | Nur Owner | ✅ Available |
| `unpause()` | Nur Owner | ✅ Available |

---

## 🔍 Netzwerk Info

```
Network:        Sepolia Testnet
Chain ID:       11155111
RPC:            https://rpc.sepolia.org
Explorer:       https://sepolia.etherscan.io/
```

---

## ⚠️ Häufige Fehler

| Error | Ursache | Lösung |
|-------|---------|--------|
| **GS013** | safeTxGas=0 | Setzen Sie safeTxGas > 0 |
| **Port 443 blocked** | Firewall | Nutzen Sie VPN |
| **burnFrom() fails** | Keine approve() | approve() VORHER aufrufen |
| **MetaMask disconnect** | Netzwerk | Schalten Sie zwischen Netzwerken um |

---

## 📞 Kontakt

- **Telegram:** [@AEra_Go_Live_bot](https://t.me/AEra_Go_Live_bot)
- **GitHub:** https://github.com/koal0308/AEra
- **Docs:** `/docs/` Ordner

---

## ✅ Checkliste vor Burn

- [ ] Richtige Wallet verbunden?
- [ ] Sepolia Netzwerk?
- [ ] Mindestens 1 AERA + Gas vorhanden?
- [ ] Amount: 1000000000000000000 (1 AERA in Wei)?
- [ ] Safe: 2-of-3 Signaturen gesammelt?

---

**Laminiert für schnelle Referenz! 🎯**
