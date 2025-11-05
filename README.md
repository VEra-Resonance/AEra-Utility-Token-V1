# 🌀 AEra Token — The Resonant Standard

> "In a world obsessed with price, we built something that measures alignment."

## 🧭 Overview

AEra is an open-source ERC-20 token project designed as a resonance experiment, not a speculation vehicle. It explores whether blockchain technology can represent clarity, integrity, and collaboration instead of greed and hype.

AEra is part of the wider **VERA / PAXIS ecosystem** — an initiative focused on transparent AI-human cooperation, ethical technology, and self-sovereign systems.

---

## 💠 Contract Information

| Field | Value |
|-------|-------|
| **Network** | Ethereum Sepolia Testnet (Chain ID: 11155111) |
| **Contract Address** | `0x5032206396A6001eEaD2e0178C763350C794F69e` |
| **Compiler Version** | Solidity 0.8.20 |
| **Optimization** | Enabled (200 runs) |
| **License** | MIT © 2025 AEra Collective |
| **Verification** | ✅ Etherscan & Sourcify (Match ID: 9753387) |

### 🔗 Quick Links
- **Etherscan:** https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
- **Sourcify:** https://sourcify.dev/#/verify/0x5032206396A6001eEaD2e0178C763350C794F69e?network=11155111
- **Write Contract:** https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#writeContract

---

## ⚙️ Tokenomics

| Parameter | Value |
|-----------|-------|
| **Token Name** | AEra Token |
| **Symbol** | AERA |
| **Initial Supply** | 100,000,000 AERA |
| **Max Supply** | 1,000,000,000 AERA (hard-coded) |
| **Decimals** | 18 |
| **Owner** | Gnosis Safe Multi-Sig (2-of-3) |
| **Standards** | ERC-20, ERC-2612 Permit, OpenZeppelin v5.0.0 |

### 🔐 Core Features
- ✅ **Burnable:** Owners can destroy tokens to adjust supply
- ✅ **Pausable:** Emergency stop mechanism for transfers
- ✅ **Permit (EIP-2612):** Gasless approvals via signature
- ✅ **Multi-Sig Governance:** 2-of-3 required for critical actions
- ✅ **Fully Verified:** Public code on Etherscan & Sourcify

---

## 🔒 Security & Governance

### Multi-Signature Protection
- **Safe Address:** `0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93`
- **Type:** 2-of-3 Gnosis Safe Multi-Sig
- **Ownership TX:** https://sepolia.etherscan.io/tx/0xa0a1a525bc96a3b4c813fa363f7b7d20694ef6e28a1958e1d1c0264cf59c6c30
- **Block:** 9545535
- **Safe Dashboard:** https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

### Security Features
✅ **OpenZeppelin v5.0.0** — Industry-standard, battle-tested  
✅ **Static Analysis** — Slither verified (25 contracts, 0 critical issues)  
✅ **Professional Audit** — Trail of Bits planned (Q2 2026)  
✅ **Code Transparency** — 100% publicly reviewable  
✅ **Emergency Mechanisms** — Pausable transfers if needed  
✅ **Supply Protection** — Hard-coded MAX_SUPPLY enforced  

### 📊 Verification Status
- ✅ **Etherscan:** Verified & Published
- ✅ **Sourcify:** Exact Match (ID: 9753387)
- ✅ **Slither Analysis:** https://github.com/koal0308/AEra/blob/master/SLITHER-REPORT.md
- ✅ **Multi-Sig Minting:** TESTED & VERIFIED ✅ (Nov 5, 2025)
  - Test 1: 1 AERA minted (Block 9560611)
  - Test 2: Debug iteration
  - Test 3: 1 AERA minted (Block 9563594) — **SUCCESSFUL**
  - **Final Balance: 2.0 AERA on-chain verified**
- ✅ **Deployment Checklist:** 18/18 tasks complete

---

## 🌐 Philosophy

**Resonance over speculation.**  
**Alignment over marketing.**  
**Transparency over hype.**

AEra is not about "price." It's about proof of coherence — a live demonstration that digital systems can embody honesty, precision, and resonance with human ethics.

We see AEra as a prototype for trustable, verifiable digital value, forming the foundation for the VERA project's economic layer.

---

## �� Roadmap

### **Phase 0 — Foundation** ✅ COMPLETE
**Timeline:** Q4 2025  
- ✅ Smart contract deployed & verified on Sepolia
- ✅ Multi-Sig Safe ownership transferred (2-of-3 governance)
- ✅ **Multi-Sig Minting System tested & verified** (Nov 5, 2025)
  - ✅ Safe 2-of-3 workflow functional
  - ✅ Mint transactions confirmed on-chain
  - ✅ 2 AERA successfully minted to test wallet
- ✅ Complete transparency documentation published
- ✅ Slither security analysis completed (0 critical issues)
- ✅ Telegram bot operational (@AEra_Go_Live_bot)

### **Phase 1 — Community Test & Airdrop** 🔄 Q1 2026
- 🔲 Public test airdrop (EIP-4361 Sign-in with Ethereum)
- 🔲 Community feedback collection
- 🔲 Bot governance integration testing
- 🔲 Backend API development

### **Phase 2 — Security & Governance** 📅 Q2 2026
- 🔲 Professional security audit (Trail of Bits or equivalent)
- 🔲 Final compliance review
- 🔲 Governance module integration
- 🔲 Snapshot DAO setup

### **Phase 3 — Mainnet Preparation** 📅 Q3 2026
- 🔲 Mainnet infrastructure setup
- 🔲 Liquidity framework design
- 🔲 Final security testing
- 🔲 Community governance vote

### **Phase 4 — Mainnet Deployment** 🚀 Q4 2026 (Earliest)
- 🔲 **Mainnet Launch**
- 🔲 DEX/CEX listings
- 🔲 Official public announcement
- 🔲 1:1 Testnet → Mainnet token swap

### **Phase 5 — Ecosystem Integration** 📅 Q4 2026 → 2027
- 🔲 VERA / PAXIS network bridge
- 🔲 AI-resonance metrics API
- 🔲 Long-term governance evolution

---

## 📁 Repository Structure

```
aera-token/
├── /contracts/              → Solidity smart contract source
├── /scripts/                → Deployment & verification scripts
├── /docs/                   → Documentation (white paper, architecture)
├── /test/                   → Unit & integration tests
├── /artifacts/              → Compiled contract ABIs
├── WHITEPAPER.md            → Official white paper
├── SECURITY-GUARANTEE.md    → Security model explanation
├── TRANSPARENCY-LOG.md      → Complete verification data
├── DEPLOYMENT-CHECKLIST.md  → Phase 0 completion status
├── SLITHER-REPORT.md        → Security analysis results
├── README.md                → This file
└── hardhat.config.js        → Hardhat configuration
```

---

## 🧱 Governance

AEra is governed via a **2-of-3 Gnosis Safe Multi-Sig** for all administrative actions:

- **Safe Address:** `0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93`
- **Ownership TX:** `0xa0a1a525bc96a3b4c813fa363f7b7d20694ef6e28a1958e1d1c0264cf59c6c30`
- **Block:** 9545535

All transactions, parameters, and updates are logged on-chain and documented in the repository for full traceability.

---

## 📚 Documentation

| Document | Link | Purpose |
|----------|------|---------|
| **White Paper v1.0** | [WHITEPAPER.md](./WHITEPAPER.md) | Official project vision & roadmap |
| **Security Guarantee** | [SECURITY-GUARANTEE.md](./SECURITY-GUARANTEE.md) | Why your tokens are safe |
| **Transparency Log** | [TRANSPARENCY-LOG.md](./TRANSPARENCY-LOG.md) | All TX hashes & verification IDs |
| **Deployment Checklist** | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) | Phase 0 completion evidence |
| **Slither Report** | [SLITHER-REPORT.md](./SLITHER-REPORT.md) | Static security analysis |
| **Airdrop Architecture** | [docs/AIRDROP-ARCHITECTURE.md](./docs/AIRDROP-ARCHITECTURE.md) | Airdrop system design |
| **Documentation Index** | [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md) | Complete docs directory |

---

## 🌍 Community

| Platform | Link |
|----------|------|
| **Telegram Bot** | [@AEra_Go_Live_bot](https://t.me/AEra_Go_Live_bot) |
| **GitHub** | [koal0308/AEra](https://github.com/koal0308/AEra) |
| **Safe Governance** | [Gnosis Safe](https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93) |
| **Etherscan** | [Contract](https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e) |
| **Sourcify** | [Verification](https://sourcify.dev/#/verify/0x5032206396A6001eEaD2e0178C763350C794F69e?network=11155111) |

---

## 🪶 License

This project is released under the **MIT License**.

You are free to use, modify, and share this code, as long as attribution is provided.

---

## ⚡ Quick Start

### View Contract
```bash
# Visit Etherscan to see the contract
https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
```

### Interact with Contract
```bash
# Use MetaMask + Etherscan Write Contract interface
https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#writeContract
```

### Verify Deployment
```bash
# Check transparency log for all TX hashes
cat TRANSPARENCY-LOG.md

# Run Slither analysis
slither . --solc ~/.solc-select/artifacts/solc-0.8.20/solc-0.8.20 --json
```

---

## 📊 Summary

```
AEra = Transparency × Resonance ÷ Speculation
```

✅ Open Source  
✅ Multi-Sig Protected  
✅ Fully Verified  
✅ Community-Governed  

**A token not for hype, but for harmony.**  
**A structure for those who build — not trade.**

---

## 🔗 More Information

- **Get started:** Read the [WHITEPAPER.md](./WHITEPAPER.md)
- **Understand security:** See [SECURITY-GUARANTEE.md](./SECURITY-GUARANTEE.md)
- **Check verification:** Visit [TRANSPARENCY-LOG.md](./TRANSPARENCY-LOG.md)
- **Join community:** Message [@AEra_Go_Live_bot](https://t.me/AEra_Go_Live_bot)

---

**Stay critical. Stay curious. Stay resonant.**

— *The AEra Collective*

*Last Updated: November 3, 2025*
