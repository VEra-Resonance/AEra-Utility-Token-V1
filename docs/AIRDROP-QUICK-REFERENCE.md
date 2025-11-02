# AERA Airdrop — Quick Reference Card

**Your Minimal-Secure Airdrop in One Page**

---

## 🎯 The Vision

**Secure Testnet Airdrop using Wallet Signatures (Zero KYC)**

```
User Signs Message with Wallet → Backend Verifies → Smart Contract Mints
```

No private keys, no databases, no central authority. **Blockchain-native.**

---

## 🏗️ Architecture (4 Layers)

```
┌─────────────────────────────────────────────────┐
│ LAYER 1: FRONTEND (Telegram Bot + Web UI)      │
│ /airdrop-signup → Opens Web UI                 │
│ User connects MetaMask → Signs message         │
└────────────────┬────────────────────────────────┘
                 │ { address, message, signature }
                 ▼
┌─────────────────────────────────────────────────┐
│ LAYER 2: BACKEND API (Express.js)              │
│ POST /api/airdrop/claim                        │
│ - Verify signature (ECDSA recovery)            │
│ - Check if already claimed                     │
│ - Submit claim() TX to contract                │
│ - Log to CSV/JSON                              │
└────────────────┬────────────────────────────────┘
                 │ Send transaction
                 ▼
┌─────────────────────────────────────────────────┐
│ LAYER 3: SMART CONTRACT (Solidity)             │
│ function claim(message, signature)             │
│ - Recover signer from signature                │
│ - Verify signer == msg.sender                  │
│ - Check max distribution                       │
│ - Mint 50 AERA to claimer                      │
│ - Emit event                                   │
└────────────────┬────────────────────────────────┘
                 │ TX on blockchain
                 ▼
┌─────────────────────────────────────────────────┐
│ LAYER 4: LOGGING & AUDIT                       │
│ /docs/airdrops/claims.csv                      │
│ - All TX-hashes public                         │
│ - Verifiable on Etherscan                      │
│ - Community audit trail                        │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Security Features (6 Core)

1. **EIP-4361 (Sign-in with Ethereum)**
   - User signs message = proves wallet ownership
   - No private keys exposed
   - No password needed

2. **Smart Contract Verification**
   - Contract checks signature validity
   - Uses ECDSA (cryptographic proof)
   - Max 50 AERA per wallet (hard limit)
   - Only 1 claim per wallet

3. **No Central Keys**
   - Admin functions via Safe (2-of-3)
   - No private key in bot
   - No single point of failure

4. **Rate Limiting**
   - Max claims per IP
   - Backend enforces limits
   - Smart contract enforces limits

5. **Immutable Audit Trail**
   - All TX-hashes on Sepolia Etherscan
   - Public CSV log
   - Verifiable by anyone

6. **Legal Disclaimers**
   - "This is a testtoken"
   - "Not an investment"
   - Consent required before claim

---

## 📋 Files to Create

### Smart Contract
```
contracts/
├── AeraAirdrop.sol (300 lines)
│   ├── claim(message, signature) - Main function
│   ├── pause/unpause - Emergency control
│   ├── setClaimAmount - Adjust rewards
│   └── drain - Emergency withdrawal
└── Test file (50+ test cases)
```

### Backend
```
backend/
├── src/api/airdrop.js (150 lines)
│   ├── POST /api/airdrop/claim
│   ├── GET /api/airdrop/info
│   └── GET /api/airdrop/status/:address
├── src/services/signatureService.js
│   └── verifySignature()
├── src/services/loggingService.js
│   └── logClaim() → CSV/JSON
└── package.json
```

### Frontend
```
frontend/
├── src/pages/Claim.jsx (200 lines)
│   ├── ConnectButton (MetaMask)
│   ├── Consent dialog
│   ├── Sign message button
│   └── TX result display
├── src/components/*.jsx
└── public/
```

### Telegram Bot Update
```
telegram-marketing/marketing-bot.js
├── /airdrop-signup command
└── Inline button with web_app link
```

### Logs
```
docs/airdrops/
├── claims.csv (timestamp, address, tx, block, status)
├── claims.json (structured)
└── audit-report.md (public report)
```

---

## 🚀 Implementation Timeline

| Phase | Duration | What |
|-------|----------|------|
| **1: Smart Contract** | Week 1-2 | Design, code, test, deploy |
| **2: Backend API** | Week 1-2 | Signature verify, logging |
| **3: Frontend UI** | Week 1-3 | React, wallet connect, sign |
| **4: Bot Integration** | 1 day | Add command + button |
| **5: Testing & Audit** | Week 1-2 | Load test, security review |
| **6: Go-Live** | 1 day | Launch! 🎉 |

**Total:** ~6 weeks to production

---

## 💰 Costs (Testnet)

| Item | Cost |
|------|------|
| Deploy contract | $5 |
| Hosting (frontend/backend) | $10/month |
| Domain | $1/month |
| **Total Setup** | **$50** |

*(Mainnet would be ~$6k-15k with audit)*

---

## 🔍 User Flow (30 seconds)

```
1. User: /airdrop-signup in Telegram
2. Bot: Shows button "Sign-in with MetaMask"
3. User: Clicks button → Opens web UI
4. Frontend: "Connect MetaMask" button
5. User: Clicks → MetaMask popup
6. User: Confirms network (Sepolia)
7. Frontend: "Consent & Claim" button (after consent)
8. User: Clicks → "Sign message" popup in MetaMask
9. User: Reads message (testtoken warning) & signs
10. Frontend: Sends to backend
11. Backend: Verifies signature → Calls contract.claim()
12. Contract: Mints 50 AERA to user
13. Blockchain: TX confirmed (~15 seconds)
14. Frontend: ✅ "Claim successful! TX: 0x..."
15. Logs: CSV updated with TX-hash

TOTAL TIME: ~30-45 seconds
COST TO USER: $0 (backend pays gas)
```

---

## 🛡️ Attack Prevention

| Attack | Prevention |
|--------|-----------|
| Duplicate claims | Smart contract: `hasClaimed[address]` |
| Replay attacks | Message includes timestamp + nonce |
| Spam | Rate limiting + CAPTCHA (optional) |
| Over-minting | Max distribution cap in contract |
| Backend compromise | Signature verification is math (can't fake) |
| Missing logs | Blockchain = immutable log |

---

## ✅ Compliance Checklist

- [ ] **No investment language** — Only "testtoken", "airdrop", "test"
- [ ] **Legal notice** — Disclaimer before every claim
- [ ] **Consent dialog** — User must actively accept
- [ ] **Zero KYC** — Only wallet + message signature
- [ ] **Testnet only** — Sepolia (never mainnet without audit)
- [ ] **Open source** — Code public on GitHub
- [ ] **Audit trail** — All TX-hashes logged
- [ ] **No private keys** — Only public Safe keys
- [ ] **Rate limiting** — Backend + contract enforced
- [ ] **Emergency stop** — Safe can pause contract

---

## 📞 Getting Help

**Questions?**
- 📖 Full docs: `docs/AIRDROP-ARCHITECTURE.md`
- 🗺️ Timeline: `docs/AIRDROP-ROADMAP.md`
- 💬 Telegram: @AEra_Official_Bot → /help
- 🐙 GitHub: https://github.com/koal0308/AEra/issues

**Bug report?**
- Create GitHub issue with details
- Include tx-hash if applicable

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Claims week 1 | 100+ |
| System uptime | 99.9% |
| Claim success rate | 99%+ |
| Avg claim time | <1 minute |
| User satisfaction | 4.5/5 ⭐ |

---

**Status:** ✅ Ready to implement  
**Last Updated:** 2. November 2025  
**Questions?** → Open GitHub issue or ask in Telegram

🚀 **Let's build the most secure testnet airdrop!**
