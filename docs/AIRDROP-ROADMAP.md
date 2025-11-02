# AERA Airdrop — Implementation Roadmap

**Status:** Planning Phase  
**Start Date:** November 2025  
**Target Mainnet Launch:** Q4 2026 (Earliest)

---

## 📅 Timeline Overview

```
Nov 2025 ────► Dec 2025 ────► Jan 2026 ────► Feb 2026 ────► Q1-Q4 2026
  │              │              │              │              │
  └─ Planning    └─ Development └─ Testing    └─ Launch      └─ Audit & Mainnet
     & Review       & Integration   & Audit      (Sepolia)      (Q4 2026)
```

---

## Phase Overview

| Phase | Timeframe | Focus |
|-------|-----------|-------|
| **Phase 1** | Nov-Dec 2025 | Smart Contract Development |
| **Phase 2** | Dec 2025-Jan 2026 | Backend API Implementation |
| **Phase 3** | Jan-Feb 2026 | Frontend Development |
| **Phase 4** | Feb 2026 | Bot Integration & Testing |
| **Phase 5** | Feb-Mar 2026 | Security Audit & Refinement |
| **Phase 6** | Q4 2026 (Earliest) | Mainnet Deployment |

---

## Phase 1: Smart Contract Development (Nov 2025 - Week 1-2)

### Week 1: Design & Development

**Tasks:**

1. **Design Review** (2h)
   - [ ] Review AeraAirdrop.sol design with team
   - [ ] Confirm limits: 50 AERA per wallet, 1x claim, max 2000 wallets
   - [ ] Confirm pause/unpause mechanism

2. **Smart Contract Implementation** (8h)
   - [ ] Create `contracts/AeraAirdrop.sol`
   - [ ] Implement `claim(message, signature)` function
   - [ ] Implement signature verification (ECDSA)
   - [ ] Add Pausable functionality
   - [ ] Add owner controls (setClaimAmount, drain)
   - [ ] Add events (ClaimedEvent, PausedEvent, etc.)

3. **Test Suite** (6h)
   - [ ] Test successful claim
   - [ ] Test duplicate claim prevention
   - [ ] Test max distribution cap
   - [ ] Test signature verification failure
   - [ ] Test pause/unpause
   - [ ] Test owner functions
   - [ ] Gas optimization tests

4. **Documentation** (2h)
   - [ ] Add NatSpec comments
   - [ ] Create deployment guide
   - [ ] Create safety audit checklist

**Deliverables:**
- ✅ `contracts/AeraAirdrop.sol` (fully tested)
- ✅ 50+ test cases passing
- ✅ Deployment script: `scripts/deploy-airdrop.js`

**Estimated Duration:** 5-7 days

---

### Week 2: Deployment & Security Review

**Tasks:**

1. **Local Testing** (2h)
   - [ ] Run full test suite
   - [ ] Check gas usage per function
   - [ ] Verify no warnings/errors

2. **Deploy to Sepolia** (2h)
   - [ ] Deploy AeraAirdrop contract
   - [ ] Verify deployment
   - [ ] Transfer ownership to Safe (2-of-3)
   - [ ] Confirm events work

3. **Security Review** (4h)
   - [ ] Self-audit: Check for common vulnerabilities
   - [ ] Review ECDSA usage
   - [ ] Check reentrancy protection
   - [ ] Verify access controls
   - [ ] Test edge cases

4. **Etherscan Verification** (1h)
   - [ ] Flatten or multi-file verify
   - [ ] Publish source code (MIT License)
   - [ ] Confirm verified badge

**Deliverables:**
- ✅ Contract deployed: `0x...AeraAirdrop`
- ✅ Owner set to Safe: `0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93`
- ✅ Verified on Etherscan
- ✅ Security checklist completed

**Estimated Duration:** 3-5 days

---

## Phase 2: Backend API Development (Dec 2025 - Week 1-2)

### Week 1: API Implementation

**Tasks:**

1. **Project Setup** (2h)
   - [ ] Initialize Node.js project
   - [ ] Setup Express.js server
   - [ ] Configure environment variables
   - [ ] Setup ethers.js provider

2. **Claim Endpoint** (6h)
   - [ ] Create `/api/airdrop/claim` endpoint
   - [ ] Implement signature verification
   - [ ] Add rate limiting middleware
   - [ ] Add error handling
   - [ ] Add logging to file
   - [ ] Test with MetaMask signature

3. **Info & Status Endpoints** (3h)
   - [ ] Create `/api/airdrop/info` (stats)
   - [ ] Create `/api/airdrop/status/:address`
   - [ ] Add caching for performance

4. **Logging System** (2h)
   - [ ] Create CSV logger
   - [ ] Create JSON logger
   - [ ] Implement append-only design
   - [ ] Add timestamp standardization

**Deliverables:**
- ✅ Backend server running locally
- ✅ All endpoints tested with Postman
- ✅ Logging working correctly
- ✅ `docs/airdrops/claims.csv` created

**Estimated Duration:** 5-7 days

---

### Week 2: Integration & Testing

**Tasks:**

1. **Contract Integration** (3h)
   - [ ] Connect to deployed AeraAirdrop contract
   - [ ] Verify contract calls work
   - [ ] Test claim flow end-to-end
   - [ ] Confirm logs are written

2. **Webhook Listener** (3h)
   - [ ] Setup block event listener
   - [ ] Implement TX confirmation tracking
   - [ ] Update logs when TX confirmed
   - [ ] Add error recovery

3. **Testing & Debugging** (3h)
   - [ ] Load test: 100 concurrent claims
   - [ ] Test error handling (invalid address, failed TX)
   - [ ] Test rate limiting
   - [ ] Debug any issues

4. **Deployment Prep** (1h)
   - [ ] Create `.env.example`
   - [ ] Document deployment steps
   - [ ] Create Docker setup (optional)

**Deliverables:**
- ✅ Backend fully integrated with contract
- ✅ Load testing passed (100+ concurrent)
- ✅ Deployment documentation
- ✅ Ready for frontend integration

**Estimated Duration:** 3-5 days

---

## Phase 3: Frontend Development (Dec 2025 - Jan 2026, Week 1-3)

### Week 1: Project Setup & UI

**Tasks:**

1. **React Project Setup** (2h)
   - [ ] Create React app with wagmi + ethers.js
   - [ ] Setup TailwindCSS for styling
   - [ ] Configure wallet connector (MetaMask)
   - [ ] Setup environment variables

2. **Connect Wallet UI** (3h)
   - [ ] Create ConnectButton component
   - [ ] Show connected wallet address
   - [ ] Handle disconnect
   - [ ] Add network detection (Sepolia)

3. **Claim Page UI** (3h)
   - [ ] Create claim form
   - [ ] Add consent dialog/checkbox
   - [ ] Show airdrop info (amount, status)
   - [ ] Add claim button (disabled until ready)

4. **Styling & Responsiveness** (2h)
   - [ ] Mobile responsive design
   - [ ] Dark/light mode toggle (optional)
   - [ ] Accessibility (WCAG 2.1)

**Deliverables:**
- ✅ Frontend running locally
- ✅ Wallet connect working
- ✅ UI matches design mockup
- ✅ All components styled

**Estimated Duration:** 4-6 days

---

### Week 2: Signature & API Integration

**Tasks:**

1. **Message Signing** (3h)
   - [ ] Create signing logic (EIP-4361)
   - [ ] Handle MetaMask sign popup
   - [ ] Display message before signing
   - [ ] Capture signature

2. **Backend Integration** (3h)
   - [ ] Call backend `/api/airdrop/claim` endpoint
   - [ ] Pass address, message, signature
   - [ ] Handle response (success/error)
   - [ ] Show loading state during claim

3. **TX Display** (2h)
   - [ ] Show TX hash after success
   - [ ] Link to Etherscan
   - [ ] Show claim status
   - [ ] Add copy-to-clipboard button

4. **Error Handling** (2h)
   - [ ] Handle wallet errors
   - [ ] Handle backend errors
   - [ ] Show user-friendly messages
   - [ ] Retry logic

**Deliverables:**
- ✅ Full claim flow working locally
- ✅ Messages signing correctly
- ✅ Backend integration successful
- ✅ TX confirmation showing

**Estimated Duration:** 4-6 days

---

### Week 3: Testing & Deployment

**Tasks:**

1. **Testing** (3h)
   - [ ] Test all happy paths
   - [ ] Test error scenarios
   - [ ] Test on real Sepolia network
   - [ ] Cross-browser testing (Chrome, Firefox, Safari)

2. **Deployment** (2h)
   - [ ] Build production bundle
   - [ ] Deploy to hosting (Vercel/Netlify)
   - [ ] Setup custom domain
   - [ ] Configure CORS headers

3. **Documentation** (2h)
   - [ ] Create user guide
   - [ ] Create troubleshooting guide
   - [ ] Document API endpoints
   - [ ] Create developer setup guide

**Deliverables:**
- ✅ Frontend deployed to production URL
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Ready for public testing

**Estimated Duration:** 2-4 days

---

## Phase 4: Telegram Bot Integration (Jan 2026)

**Tasks:**

1. **Update Bot Commands** (2h)
   - [ ] Add `/airdrop-signup` command
   - [ ] Add inline button with web_app link
   - [ ] Update `/help` command
   - [ ] Add error handling

2. **Testing** (1h)
   - [ ] Test command in Telegram
   - [ ] Test button opens correct URL
   - [ ] Test on mobile (Telegram app)

3. **Deployment** (1h)
   - [ ] Update bot code
   - [ ] Restart bot service
   - [ ] Verify working in live bot

**Deliverables:**
- ✅ Bot has working airdrop command
- ✅ Inline button links to frontend
- ✅ Tested in production

**Estimated Duration:** 1-2 days

---

## Phase 5: Testing & Security Audit (Jan 2026 - Week 4-5)

### Week 4: Internal Testing

**Tasks:**

1. **Load Testing** (2h)
   - [ ] Simulate 1000+ concurrent claims
   - [ ] Monitor backend performance
   - [ ] Monitor contract gas usage
   - [ ] Identify bottlenecks

2. **Security Testing** (3h)
   - [ ] Test signature validation edge cases
   - [ ] Attempt replay attacks
   - [ ] Test rate limiting
   - [ ] Fuzz testing

3. **UAT (User Acceptance Testing)** (2h)
   - [ ] Test with real wallets (5+ testers)
   - [ ] Test claim flow end-to-end
   - [ ] Verify logs are correct
   - [ ] Gather feedback

4. **Bug Fixes & Polish** (1h)
   - [ ] Fix any issues found
   - [ ] Improve UX based on feedback
   - [ ] Final polish

**Deliverables:**
- ✅ Load test report (1000+ users)
- ✅ Security test report
- ✅ UAT sign-off
- ✅ All bugs fixed

**Estimated Duration:** 3-5 days

---

### Week 5: Final Audit & Launch Prep

**Tasks:**

1. **External Security Audit** (Optional, 1-2 weeks)
   - [ ] Hire auditor (if budget available)
   - [ ] Provide code for review
   - [ ] Fix any findings
   - [ ] Get audit report

2. **Legal Review** (1h)
   - [ ] Review disclaimer text
   - [ ] Confirm testnet messaging
   - [ ] Verify no investment claims
   - [ ] Get legal approval

3. **Documentation & Monitoring** (2h)
   - [ ] Create runbook (how to operate)
   - [ ] Setup monitoring alerts
   - [ ] Create emergency procedures
   - [ ] Train admin team

4. **Launch Preparation** (2h)
   - [ ] Create launch announcement
   - [ ] Prepare Telegram messages
   - [ ] Setup communication channels
   - [ ] Final checklist review

**Deliverables:**
- ✅ Security audit complete (if done)
- ✅ Legal approval
- ✅ Monitoring setup
- ✅ Launch documentation
- ✅ Ready to go live!

**Estimated Duration:** 2-3 weeks

---

## Phase 6: Go-Live (Feb 2026)

**Launch Day:**

1. **Pre-Launch** (1h before)
   - [ ] Final backend & frontend check
   - [ ] Verify contract is funded with AERA
   - [ ] Confirm Safe is operational
   - [ ] Final monitoring setup

2. **Launch** (T+0)
   - [ ] Announce in Telegram channel
   - [ ] Post launch tweet
   - [ ] Update bot commands live
   - [ ] Monitor for issues

3. **Post-Launch** (First 24h)
   - [ ] Monitor claim volume
   - [ ] Watch for errors
   - [ ] Respond to user support
   - [ ] Celebrate! 🎉

**Success Criteria:**
- ✅ 100+ users claim tokens
- ✅ Zero critical errors
- ✅ Logs show all claims correctly
- ✅ Community feedback positive

---

## Resource Requirements

### Development Team

| Role | Hours | Effort |
|------|-------|--------|
| Smart Contract Dev | 40h | 1 FTE |
| Backend Dev | 40h | 1 FTE |
| Frontend Dev | 50h | 1.25 FTE |
| QA / Testing | 30h | 0.75 FTE |
| DevOps / Infrastructure | 20h | 0.5 FTE |
| Project Lead | 30h | 0.75 FTE |
| **Total** | **210h** | **~6 weeks** |

### Infrastructure

| Component | Cost (Testnet) | Cost (Mainnet) |
|-----------|----------------|----------------|
| Smart Contract Deployment | $5 | $500 |
| Hosting (Frontend/Backend) | $10/month | $50/month |
| Domain Name | $12/year | $12/year |
| Security Audit | $0 (optional) | $5,000-15,000 |
| Monitoring Tools | Free tier | $100-500/month |
| **Total Setup** | **~$50** | **~$6,000** |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Smart Contract Bug | Medium | Critical | Thorough testing + audit |
| Backend Outage | Low | High | Monitoring + redundancy |
| Signature Spam | Medium | Medium | Rate limiting + Captcha |
| Legal Issue | Low | Critical | Legal review + disclaimers |
| Gas Price Spike | Low | Medium | Frontend displays cost |

---

## Contingency Plan

### If Smart Contract Has Bug

1. Pause contract via Safe
2. Fix contract
3. Deploy new version
4. Migrate users to new contract
5. Communicate clearly to community

### If Backend Crashes

1. Switch to read-only mode
2. Fix backend
3. Redeploy
4. Resume claiming

### If Claims Reach Cap Early

1. Announce cap reached
2. Wait for next batch
3. Document all attempts in logs

---

## Success Metrics

- **Usage:** 500+ claims in first week
- **Reliability:** 99.9% uptime
- **User Satisfaction:** 4.5+/5 rating
- **Transparency:** 100% TX audit trail
- **Security:** Zero exploits/hacks
- **Cost:** Within budget ($50 testnet, $6k mainnet)

---

## Next Steps

1. **Week 1 (Nov 2025):** Get team approval on this roadmap
2. **Week 2:** Begin Phase 1 Smart Contract development
3. **Weekly:** Progress review meetings
4. **End of Phase 5:** Security audit & final checklist
5. **Feb 2026:** Go-live! 🚀

---

**Owner:** AEra Development Team  
**Last Updated:** 2. November 2025  
**Status:** ✅ Approved for planning phase

---

Questions or changes? 
→ Open GitHub issue or discuss in team meetings
