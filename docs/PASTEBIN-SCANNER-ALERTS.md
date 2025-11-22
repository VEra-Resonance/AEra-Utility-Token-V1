# 🚨 PASTEBIN SCANNER - ALERT ACTIONS GUIDE

## WHEN SECRETS ARE FOUND

**Status:** When a scan completes with findings, follow this guide

---

## 🔴 CRITICAL FINDINGS (Ethereum Private Keys)

### IMMEDIATE ACTIONS (Within 1 Hour)

**1. Verify the Finding**
```bash
# Check if finding is real (not false positive)
paste_url="https://pastebin.com/abc123xyz"
curl -s "$paste_url" | grep -i "private\|seed\|key" | head -5
```

**2. Assess Risk**
- ❌ Is wallet still active? → Check Etherscan
- ❌ Are there recent transactions? → Check balance
- ❌ How much is at risk? → Calculate exposure

**3. Contact Wallet Owner (If Possible)**
```
Subject: [URGENT] Your Ethereum Private Key Was Exposed!

Hi,

We detected your Ethereum private key publicly exposed on Pastebin.

ACTIONS REQUIRED:
1. Transfer all funds to a NEW wallet immediately
2. Do NOT use the old wallet again
3. The exposed key:
   0xf7a4868f...f30676 (truncated for safety)

More info: [Scanner Alert Link]
```

**4. Create GitHub Issue (Optional)**
```bash
# If key is from open source project
gh issue create \
  --title "🚨 SECURITY: Private Key Exposed on Pastebin" \
  --body "Key exposed: $(date). See logs for details."
```

**5. Log the Alert**
```bash
# Findings are auto-logged to:
logs/pastebin-findings/pastebin-findings-$(date +%Y-%m-%d).json
```

---

## 🟠 HIGH FINDINGS (API Keys / Mnemonic Phrases)

### URGENT ACTIONS (Within 2-4 Hours)

**1. Identify the Key Source**
```
API_KEY patterns:
- ALCHEMY_API_KEY
- INFURA_PROJECT_ID
- ETHERSCAN_API_KEY
- AWS_ACCESS_KEY
- Other platform keys
```

**2. Notify Project Owner**
```
Subject: API Key Exposure - Immediate Action Required

Found your [ALCHEMY/INFURA/etc] API key on Pastebin:
API_KEY=xxxxxxxxx...

ACTIONS REQUIRED:
1. Revoke this key in your project dashboard
2. Generate a new key
3. Update all services using the old key
4. Monitor for unusual API usage

Exposed: [Pastebin URL]
Time: [Detection Time]
```

**3. Check for Abuse**
```bash
# Example: Check Alchemy API usage
curl -s "https://api.alchemy.com/usage?apiKey=..." | jq .

# Check if key was used by attackers
# Look for unusual RPC calls
```

**4. Rotate the Key**
```bash
# Steps vary by platform
# Example (Alchemy):
1. Login to dashboard
2. Settings → API Keys
3. Delete exposed key
4. Create new key
5. Update .env files
6. Restart services
```

**5. Monitor for 24-48 Hours**
```bash
# Watch for unauthorized usage
# Check transaction logs
# Verify service still works with new key
```

---

## 🟡 MEDIUM FINDINGS (Wallet Addresses / Seed References)

### FOLLOW-UP ACTIONS (Within 24 Hours)

**1. Document the Address**
```
Exposed Address: 0x8b0d1caa...6a
Context: Found in blog post / forum
Source: [Pastebin URL]
Risk: Medium (no private key, but tracked)
```

**2. Monitor the Address**
```bash
# Check balance
curl "https://api.etherscan.io/api?module=account&action=balance&address=0x8b0d1caa...6a&apikey=YOUR_KEY"

# Check transactions
curl "https://api.etherscan.io/api?module=account&action=txlist&address=0x8b0d1caa...6a"

# Set up monitoring (optional)
npm run scan:blockchain -- --watch 0x8b0d1caa...6a
```

**3. Alert Owner (If Possible)**
```
Subject: Your Ethereum Address Appeared on Pastebin

Your public Ethereum address was found in a paste:
0x8b0d1caa...6a

Context: "blog post about DeFi"
Source: https://pastebin.com/xyz

ACTION: Keep an eye on this address for unusual activity.
We'll continue monitoring it.
```

**4. Log for Pattern Analysis**
```javascript
// Add to monitoring database
{
  type: "MEDIUM",
  address: "0x8b0d1caa...6a",
  source: "pastebin",
  context: "found_in_forum_post",
  dateFound: "2025-11-08T15:30:00Z",
  monitoringStatus: "active"
}
```

---

## 📋 ALERT CLASSIFICATION TEMPLATE

Create a standardized alert for each finding:

```markdown
## ALERT REPORT

**Severity:** [CRITICAL / HIGH / MEDIUM]
**Type:** [Ethereum Private Key / API Key / Mnemonic / Address / etc]
**Detection Time:** [ISO timestamp]
**Pastebin URL:** https://pastebin.com/...
**Paste Title:** [Title from paste]
**Paste Author:** [anonymous_user or known]

### Finding Details
```
[Secret Details - Truncated]
```

### Risk Assessment
- **Financial Exposure:** $XXX,XXX
- **Time Since Exposure:** X hours
- **Active Wallet:** Yes/No
- **Recent Transactions:** Yes/No

### Actions Taken
- [x] Verified finding
- [x] Assessed risk
- [ ] Contacted owner
- [ ] Created GitHub issue
- [ ] Rotated keys
- [ ] Set up monitoring

### Follow-up
- Owner notified: [Yes/No/Attempted]
- Next check: [Date/Time]
- Status: [Resolved/Pending/Monitoring]
```

---

## 🔄 WORKFLOW EXAMPLES

### Example 1: Private Key Found

```
SCAN RESULT:
🚨 Finding: Ethereum Private Key
   Paste: "My wallet backup (DO NOT STEAL!)"
   URL: https://pastebin.com/abc123xyz

1. ✅ VERIFY
   curl -s "https://pastebin.com/raw/abc123xyz" | grep "0x" | head -1
   → Confirmed: real key detected

2. ✅ ASSESS
   Key: 0xf7a4868f...f30676
   Wallet: 0x8b0d1caa...6a
   Balance: 2.5 ETH ($5,000 exposure)
   Last TX: 2 hours ago
   Status: ACTIVE & RECENT

3. 🚨 ALERT
   Subject: URGENT - Your Private Key Was Exposed!
   To: [attempt to identify owner]
   Message: [Standard template from above]

4. ✅ LOG
   logs/pastebin-findings/CRITICAL-2025-11-08.json
   Added incident record

5. ⏳ FOLLOW-UP
   Check in 24h: Is wallet still active?
   Did owner recover? Any fund transfers?
```

### Example 2: API Key Found

```
SCAN RESULT:
🟠 Finding: API Key (ALCHEMY_API_KEY)
   Paste: "Ethereum project .env backup"
   URL: https://pastebin.com/xyz456

1. ✅ VERIFY
   curl "https://api.alchemy.com/status?apiKey=abc123..."
   → Confirmed: API key is valid/active

2. ✅ ASSESS
   Service: Alchemy (Ethereum RPC)
   Tier: Free/Pro/Enterprise
   Exposure: All RPC calls (high)
   Abuse Risk: CRITICAL

3. 🚨 ALERT
   Platform: GitHub Issue / Discord / Email
   Project: [Identified from env file]
   Message: [Standard template]

4. ✅ ROTATE
   1. Log into Alchemy dashboard
   2. Delete exposed key
   3. Create new key
   4. Update project .env
   5. Redeploy services

5. ⏳ FOLLOW-UP
   Monitor: API usage in next 24h
   Check: No unauthorized calls
   Verify: All services still working
```

### Example 3: Wallet Address Found

```
SCAN RESULT:
🟡 Finding: Ethereum Address
   Context: "My portfolio address for Twitter"
   URL: https://pastebin.com/xyz789

1. ✅ VERIFY
   Address: 0x8b0d1caa...6a
   Confirmed: Valid Ethereum address

2. ✅ ASSESS
   Balance: 15 ETH ($30,000)
   Activity: Active trader (many TXs)
   Risk: Medium (no keys exposed, but tracked)

3. 📧 NOTIFY (Optional)
   "Your address appeared publicly on Pastebin.
    We're monitoring it for unusual activity."

4. ✅ MONITOR
   - Set up Etherscan alert
   - Track for sudden outflows
   - Monitor for suspicious behavior

5. ⏳ FOLLOW-UP
   Daily check: Any unusual activity?
   Weekly summary: Transaction review
```

---

## 📊 RESPONSE TIME TARGETS

| Severity | Action | Target Time |
|----------|--------|------------|
| 🔴 CRITICAL | Verify + Alert Owner | 1 hour |
| 🟠 HIGH | Verify + Notify | 2-4 hours |
| 🟡 MEDIUM | Log + Monitor | 24 hours |

---

## 📞 COMMUNICATION TEMPLATES

### Template 1: Critical Alert (Email)

```
Subject: 🚨 URGENT - Your Ethereum Key Exposed (Action Required)

Hi there,

Your Ethereum private key was found publicly exposed on Pastebin.

⚠️ IMMEDIATE ACTION REQUIRED:

1. DO NOT use this wallet for new transfers
2. Transfer all funds to a new wallet RIGHT NOW
3. Never import this key again
4. Document this incident

EXPOSURE DETAILS:
Exposed Key: 0xf7a4868f...f30676 (TRUNCATED)
Affected Wallet: 0x8b0d1caa...6a
Balance at Risk: 2.5 ETH (~$5,000)
Time Found: 2025-11-08 15:30 UTC
Source: https://pastebin.com/abc123xyz

WHY THIS HAPPENED:
- Key was accidentally pasted on Pastebin
- Pastebin data is public and searchable
- Anyone can see it

WHAT WE DID:
✅ Detected automatically via security scanner
✅ Verified it's a real key
✅ Calculated exposure
✅ Alerted you immediately

HOW TO RECOVER:
1. Create new Ethereum wallet (MetaMask / Hardware wallet)
2. Transfer all funds from old wallet to new wallet
3. Document transaction hash
4. Never reuse old wallet

NEED HELP?
- Etherscan: https://sepolia.etherscan.io/address/0x8b0d1caa...6a
- Recovery Guide: [link]

Stay safe,
Security Scanner Team
```

### Template 2: API Key Alert

```
Subject: ⚠️ Security Alert - API Key Exposed (Rotation Required)

Hi,

An API key for your service was found on Pastebin.

KEY DETAILS:
Service: Alchemy (ALCHEMY_API_KEY)
Exposure Time: ~4 hours
Status: ACTIVE (not yet rotated)

IMMEDIATE STEPS:
1. Log into Alchemy dashboard
2. Go to Settings → API Keys
3. Click "Delete" on the exposed key
4. Create a NEW API key
5. Update your .env file
6. Redeploy/restart services

VERIFICATION:
curl https://api.alchemy.com/status?apiKey=YOUR_KEY

MONITORING:
- Check API usage in next 24h for suspicious calls
- Monitor billing for unexpected charges
- Verify all services still work

Questions? Reply to this email.

Security Team
```

---

## ✅ CHECKLIST FOR EACH FINDING

- [ ] Finding is verified (not false positive)
- [ ] Severity level is correct
- [ ] Owner has been identified (if possible)
- [ ] Alert has been sent (email/GitHub/other)
- [ ] Finding is logged with timestamp
- [ ] Follow-up date is scheduled
- [ ] Monitoring is set up (if needed)
- [ ] Incident document is created

---

## 🔗 INTEGRATION WITH OTHER SYSTEMS

### Send Alerts to Discord:
```javascript
// Add to scanner after finding secrets
const webhook = process.env.DISCORD_WEBHOOK;
await fetch(webhook, {
  method: 'POST',
  body: JSON.stringify({
    content: `🚨 CRITICAL: Ethereum Key Exposed on Pastebin!\n${paste.url}`
  })
});
```

### Send to Email:
```javascript
// Using nodemailer
await transporter.sendMail({
  to: 'owner@example.com',
  subject: '🚨 Your API Key Was Exposed',
  html: alertTemplate
});
```

### Create GitHub Issue:
```bash
gh issue create --title "🔑 SECURITY: Key Exposed" --body "Found on Pastebin..."
```

---

## 📈 REPORTING

### Daily Alert Summary:
```
PASTEBIN ALERTS - Daily Report
Date: 2025-11-08

🔴 CRITICAL Alerts: 2
  - Private Key found in "wallet backup"
  - Mnemonic phrase found in "recovery help"

🟠 HIGH Alerts: 3
  - API Key (Alchemy)
  - API Key (Infura)
  - Database password

🟡 MEDIUM Alerts: 1
  - Ethereum address in portfolio

ACTION ITEMS:
1. Contact owner of critical private key
2. Rotate Alchemy API key
3. Monitor address for 24h

METRICS:
- Total alerts: 6
- Owner contacted: 0/2
- Resolved: 0/6
- Pending: 6/6
```

---

**Remember:** Speed matters for CRITICAL findings!  
**Target:** Alert owner within 1 hour of detection.

```bash
npm run scan:pastebin-v2  # Keep scanning!
```
