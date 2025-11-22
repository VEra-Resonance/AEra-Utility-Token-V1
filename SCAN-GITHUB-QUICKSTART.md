# 🚀 GitHub Secret Scanner - Quick Start

**In 5 Minuten einsatzbereit!**

---

## ⚡ TL;DR - Das Wichtigste

```bash
# 1. GitHub Token holen
# https://github.com/settings/tokens → "Generate new token (classic)"

# 2. Token in .env.local eintragen
echo "GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxx" >> .env.local

# 3. Scanner starten
npm run scan:github-secrets

# 4. Alerts anschauen!
```

---

## 🔑 GITHUB TOKEN ERSTELLEN

### Schritt-für-Schritt:

1. **Gehe zu GitHub Settings:**
   ```
   https://github.com/settings/tokens
   ```

2. **Klick "Generate new token (classic)"**
   - (Nicht "Generate new token (fine-grained)", das ist zu restriktiv)

3. **Konfiguriere:**
   - Name: `Secret Scanner Token`
   - Expiration: `30 days`
   - Scope: Wähle nur `public_repo`

4. **Copy Token:**
   ```
   ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

5. **⚠️ WICHTIG: Token nicht verlieren!**
   - Nur einmal sichtbar nach Creation
   - Speichere in sicherer Stelle

---

## 📝 .env.local SETUP

### Öffne/erstelle `./aera-token/.env.local`:

```bash
# GitHub Secret Scanner
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Bestehende Configs:
# ... deine anderen Secrets ...
```

**Verifikation:**
```bash
grep GITHUB_TOKEN .env.local
# Output: GITHUB_TOKEN=ghp_XXXXXXXXXXXX...
```

---

## 🏃‍♂️ PROGRAMM STARTEN

### Option 1: NPM Script (Empfohlen)

```bash
npm run scan:github-secrets
```

### Option 2: Direkt mit Node

```bash
node scripts/github-secret-scanner.js
```

---

## 📊 ERWARTETE AUSGABE

```
🛡️  GitHub Secret Scanner Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Searching GitHub for secrets...

Query 1/17: filename:.env private_key
  ✓ Searched 25 repos
  ⚠️  Found 0 secrets

Query 2/17: PRIVATE_KEY="0x" language:javascript
  ✓ Searched 30 repos
  ⚠️  Found 0 secrets

... (15 more queries) ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ SCAN COMPLETE!

📊 Summary:
  Total Repos Scanned: 450
  Secrets Found: 0
  Alerts Generated: 0
  Duration: 8 minutes 42 seconds

Status: ✅ NO CRITICAL ISSUES FOUND!
```

---

## 🔴 WENN ALERTS GEFUNDEN WERDEN

### Alert-Beispiel:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ALERT-1762627293403
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Severity: 🔴 CRITICAL
Title: Ethereum Private Key exposed in my-web3-app

Repository: john-dev/my-web3-app
Owner: john-dev
File: .env.local
Line: 42

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ACTION REQUIRED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. IMMEDIATELY revoke this private key
2. Remove from git history:
   git filter-branch --force --index-filter \
   'git rm --cached --force .env.local' \
   --prune-empty --tag-name-filter cat -- --all
3. Check blockchain for unauthorized transactions
4. Transfer all funds from exposed wallet
5. Document the incident for your security audit
6. Notify your team members

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Dann:

1. **GitHub Issue** für john-dev/my-web3-app erstellen
2. **Email** an Repository Owner senden
3. **Discord/Telegram** Message versenden
4. **Incident Log** aktualisieren

---

## ⚙️ CONFIGURATION

### Suche erweitern (Optional):

Öffne `scripts/github-secret-scanner.js` und add pattern:

```javascript
searchQueries: [
  "filename:.env private_key",
  'PRIVATE_KEY="0x"',
  "YOUR_NEW_PATTERN_HERE",  // ← HIER HINZUFÜGEN
],
```

### Severity anpassen (Optional):

```javascript
const detectionPatterns = {
  privateKey: {
    pattern: /0x[a-fA-F0-9]{64}/g,
    severity: "CRITICAL",  // ← ANPASSBAR
  },
  // ...
};
```

---

## 🐛 TROUBLESHOOTING

### Problem: "GITHUB_TOKEN not found"

**Lösung:**
```bash
# 1. Check if .env.local exists
ls -la .env.local

# 2. Check token is set
grep GITHUB_TOKEN .env.local

# 3. Reinstall if needed
npm install dotenv
```

### Problem: "API rate limit exceeded"

**Lösung:**
```
GitHub erlaubt 30 requests/minute mit Token
Scanner macht ~20 requests pro Scan
→ Warte 5 Minuten zwischen Scans
```

### Problem: "No results found"

**Das ist NORMAL!**
- Bedeutet: Keine neuen exposed keys auf GitHub gefunden
- Das ist die beste Neuigkeit überhaupt!

---

## 📈 NÄCHSTE SCHRITTE

### Für Continuous Scanning:

```bash
# Installiere cron (falls nicht vorhanden)
which crontab

# Öffne crontab editor
crontab -e

# Füge hinzu (6x täglich):
0 */4 * * * cd /home/karlheinz/krypto/aera-token && \
  npm run scan:github-secrets >> logs/github-secrets.log 2>&1
```

### Für Notifications:

```bash
# Email-Integration hinzufügen
# → Sieh GITHUB-SECRET-SCANNER.md für Details
```

---

## ✅ VERIFIKATION

```bash
# Test, dass alles funktioniert:
npm run scan:github-secrets

# Sollte zeigen:
# ✓ Searching GitHub for secrets...
# ✓ Scan complete
```

---

## 🛡️ ZUSAMMENFASSUNG

**Du hast gerade einen Security-Scanner aktiviert, der:**

- ✅ GitHub täglich durchsucht
- ✅ Exposed Keys findet
- ✅ Project Owner alertet
- ✅ Die Community schützt

**Danke dafür, dass du andere Entwickler vor deinem Fehler bewahren möchtest! 🙏**

---

**Zeit zum Starten: 5 Minuten**  
**Aufwand pro Scan: 10-15 Minuten**  
**Impact: Unbezahlbar! 🛡️**
