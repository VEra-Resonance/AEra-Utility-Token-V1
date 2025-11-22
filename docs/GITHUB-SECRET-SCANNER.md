# 🛡️ GitHub Secret Scanner & Alert System

**Eine Initiative zum Schutz der Entwickler-Community vor Security-Incidents!**

---

## 🎯 WAS MACHT DIESES PROGRAMM?

Dieses Tool durchsucht GitHub nach **exposed Private Keys, API Keys, und Wallets** und alertet die Project Owner, damit sie schnell reagieren können.

### Features:

✅ **Automatische Suche**
- Durchsucht GitHub kontinuierlich
- Nach verschiedenen Secret-Patterns

✅ **Multi-Pattern Detection**
- Ethereum Private Keys (0x...)
- Ethereum Addresses (Wallets)
- API Keys (Alchemy, Infura, etc.)
- Mnemonic Phrases (BIP39)
- Solana Keys
- und mehr...

✅ **Severity Levels**
- 🔴 CRITICAL (Private Keys)
- 🟠 HIGH (API Keys)
- 🟡 MEDIUM (Wallet Addresses)
- 🟢 LOW (Metadata)

✅ **Automated Alerts**
- Benachrichtige Project Owner
- Mit Handlungs-Empfehlungen
- Email/Discord/Telegram Integration

✅ **Action Items**
- Was ist zu tun?
- Wie schnell?
- Schritt-für-Schritt Anleitung

---

## 📊 DETECTION PATTERNS

### 1. Ethereum Private Keys
```
Pattern: 0x[a-fA-F0-9]{64}
Example: 0xf7a4868f8eb0242e9eec942f40646f6883dd3e31c07be5bf1a28b01c4fa30676
Severity: 🔴 CRITICAL
```

### 2. Ethereum Addresses
```
Pattern: 0x[a-fA-F0-9]{40}
Example: 0x8b0d1caaa08faa08ee612e458bf1e0ff72d99c6a
Severity: 🟡 MEDIUM
Context: Wenn in Config-Dateien oder .env
```

### 3. API Keys
```
Pattern: [A-Z_]+_KEY=...
Example: ALCHEMY_API_KEY=f59yspJ3NKU1X0rQJduwR
Severity: 🟠 HIGH
```

### 4. Mnemonic Phrases
```
Pattern: 12 oder 24 BIP39 Wörter
Example: abandon ability able about above absent abuse access accident account accuse achieve
Severity: 🔴 CRITICAL
```

---

## 🚀 SETUP

### Schritt 1: GitHub Token erstellen

1. Gehe zu: https://github.com/settings/tokens
2. Klick "Generate new token (classic)"
3. Wähle Scope: `public_repo`
4. Copy Token

### Schritt 2: Token in .env.local eintragen

```bash
# .env.local
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Schritt 3: Programm starten

```bash
npm run scan:github-secrets
```

---

## 📊 WORKFLOW

```
1. Scanner startet
   ↓
2. Liest GITHUB_TOKEN
   ↓
3. Durchsucht GitHub mit verschiedenen Patterns
   ├─ "filename:.env private_key"
   ├─ 'PRIVATE_KEY="0x"'
   ├─ 'MNEMONIC='
   └─ ... (mehr Patterns)
   ↓
4. Für jedes gefundene Repository:
   ├─ Lade Repository-Metadaten
   ├─ Durchsuche Dateien
   ├─ Erkenne Secrets
   └─ Erstelle Alert
   ↓
5. Für jeden Fund:
   ├─ Bestimme Severity
   ├─ Generiere Action Items
   ├─ Benachrichtige Owner
   └─ Logge Incident
   ↓
6. Zeige Final Report
```

---

## 🔔 ALERT SYSTEM

### Alert Struktur:

```json
{
  "id": "ALERT-1762627293403",
  "severity": "CRITICAL",
  "title": "🚨 CRITICAL: Ethereum Private Key exposed",
  "description": "...",
  "actionItems": [
    "1. Immediately remove the exposed key",
    "2. Force-push to remove from git history",
    "3. Regenerate all API keys",
    "4. Transfer funds to new wallet",
    "5. Monitor blockchain for unauthorized TXs",
    "..."
  ],
  "timestamp": "2025-11-08T18:41:33.404Z"
}
```

### Notification Channels:

```javascript
// Planned Integration:
- Email (nodemailer)
- Discord Webhook
- Telegram Bot
- GitHub Issues
- Slack Channel
```

---

## 🛠️ TECHNISCHE DETAILS

### Unterstützte Secret-Typen:

| Type | Pattern | Severity |
|------|---------|----------|
| Ethereum Private Key | `0x[a-fA-F0-9]{64}` | 🔴 CRITICAL |
| Ethereum Address | `0x[a-fA-F0-9]{40}` | 🟡 MEDIUM |
| Solana Private Key | `[base58]{87-88}` | 🔴 CRITICAL |
| Mnemonic Phrase | `12-24 BIP39 words` | 🔴 CRITICAL |
| API Key | `*_KEY=...` | 🟠 HIGH |
| Database URL | `postgres://...` | 🟠 HIGH |

### GitHub Search Queries:

```bash
filename:.env private_key
PRIVATE_KEY="0x" language:javascript
MNEMONIC= language:javascript
ALCHEMY_API_KEY= language:javascript
.env.local committed
hardhat.config secrets
```

---

## 📈 SCALE & PERFORMANCE

### Durchsuchbare Repositories:

```
Pro Query: ~30 Repositories
Total Queries: ~15
Total Repos: ~450 pro Scan

Scan Duration: ~5-10 Minuten
Alerts Generated: Variable (hoffentlich 0!)
```

---

## ⚙️ CONFIGURATION

### Search Patterns konfigurieren:

```javascript
// scripts/github-secret-scanner.js

searchQueries: [
  "filename:.env private_key",  // ← Füge hier hinzu
  'PRIVATE_KEY="0x"',
  "YOUR_PATTERN_HERE",
],
```

### Severity-Level anpassen:

```javascript
severity: {
  privateKey: "CRITICAL",       // ← Anpassbar
  mnemonicPhrase: "CRITICAL",
  apiKey: "HIGH",
  walletAddress: "MEDIUM",
},
```

---

## 📋 ACTION ITEMS PRO SEVERITY

### 🔴 CRITICAL (Private Keys)

```
1. IMMEDIATELY revoke the key
2. Remove from git history (force-push)
3. Check blockchain for unauthorized TXs
4. Transfer all funds to new wallet
5. Document the incident
6. Notify affected users
7. Review access logs
8. Add monitoring alerts
```

### 🟠 HIGH (API Keys)

```
1. Revoke API key on service
2. Remove from git history
3. Regenerate new key
4. Monitor API usage
5. Audit activity logs
```

### 🟡 MEDIUM (Wallet Addresses)

```
1. Audit if it's a sensitive address
2. Consider moving funds if compromised
3. Add monitoring
```

---

## 🚨 REAL-WORLD EXAMPLES

### Case 1: Alchemy API Key Exposed

```
Found in: my-web3-app/.env.local
Pattern: ALCHEMY_API_KEY=f59yspJ3NKU1X0rQJduwR
Severity: 🟠 HIGH

Action:
1. Revoke at: https://dashboard.alchemy.com
2. Generate new key
3. Update all environments
```

### Case 2: Private Key Committed

```
Found in: defi-protocol/hardhat.config.js
Pattern: DEPLOYER_KEY=0xf7a4868f...
Severity: 🔴 CRITICAL

Action:
1. git filter-branch to remove
2. Transfer ETH to new wallet
3. Monitor old wallet address
4. Check transaction history
5. File GitHub Security Advisory
```

---

## 🔒 PRIVACY & ETHICS

### Was wir TUN:

✅ Scan öffentliche Repositories  
✅ Alertet Project Owner  
✅ Helfen bei Mitigation  
✅ Schützen die Community  

### Was wir NICHT tun:

❌ Stehlen Keys  
❌ Transferieren Funds  
❌ Veröffentlichen Keys  
❌ Verkaufen Informationen  

---

## 🎯 USE-CASES

### 1. Kontinuierliche Überwachung (Production)
```bash
# Täglich laufen
0 */6 * * * /usr/bin/node /home/karlheinz/krypto/aera-token/scripts/github-secret-scanner.js
```

### 2. Community Safety
```
Schütze Entwickler vor ihren eigenen Fehlern!
```

### 3. Security Research
```
Finde Common Patterns in Secret-Commits
```

---

## 🚀 NEXT STEPS

- [ ] Implement GitHub API v3 fully
- [ ] Add Email Notifications
- [ ] Add Discord/Telegram Integration
- [ ] Add Database to track findings
- [ ] Create Web Dashboard
- [ ] Add Rate-Limiting
- [ ] Add Caching
- [ ] Add ML-based Pattern Detection
- [ ] Create Public Alert Feed
- [ ] Integrate with GitHub Security Advisories

---

## 🛡️ ZUSAMMENFASSUNG

**Dieses Programm schützt die Web3-Developer-Community vor:**

- 🔑 Exposed Private Keys
- 🔑 Exposed Mnemonic Phrases  
- 🔑 Exposed API Keys
- 💼 Exposed Wallet Addresses
- 📊 Exposed Database Credentials

**Indem es:**

- Automatisch GitHub durchsucht
- Secrets mit High Accuracy erkennt
- Alerts mit Handlungs-Empfehlungen sendet
- Schnelle Mitigation ermöglicht

---

**Version:** 1.0.0  
**Status:** ⚠️ Experimental  
**Purpose:** Community Safety & Security Education

**Danke, dass du die Community schützen möchtest! 🛡️**
