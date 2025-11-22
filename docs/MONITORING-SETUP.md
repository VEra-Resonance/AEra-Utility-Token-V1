# 📊 REAL-TIME MONITORING SETUP

## 🎯 GOAL: Keep Scanner Running 24/7

---

## 🔔 OPTION 1: Simple Cron Job (Easiest)

### Setup (5 minutes):
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM):
0 9 * * * cd /home/karlheinz/krypto/aera-token && npm run scan:pastebin-v2 >> logs/cron.log 2>&1
```

### View Results:
```bash
# Check if job ran
tail logs/cron.log

# See today's findings
cat logs/pastebin-findings/pastebin-findings-$(date +%Y-%m-%d).json | jq .
```

---

## 🔔 OPTION 2: Systemd Service (Recommended)

### Create Service File:
```bash
sudo cat > /etc/systemd/system/pastebin-scanner.service << 'SYSTEMD'
[Unit]
Description=Pastebin Secret Scanner
After=network.target

[Service]
Type=simple
User=karlheinz
WorkingDirectory=/home/karlheinz/krypto/aera-token
ExecStart=/usr/bin/npm run scan:pastebin-v2
Restart=always
RestartSec=3600

[Install]
WantedBy=multi-user.target
SYSTEMD
```

### Enable Service:
```bash
sudo systemctl enable pastebin-scanner.service
sudo systemctl start pastebin-scanner.service
```

### Check Status:
```bash
sudo systemctl status pastebin-scanner.service
```

---

## 🔔 OPTION 3: Watch Mode (Development)

### Terminal 1: Keep Scanner Running
```bash
watch -n 3600 'cd /home/karlheinz/krypto/aera-token && npm run scan:pastebin-v2'
```

### Terminal 2: Watch Files
```bash
watch -n 10 'ls -lh logs/pastebin-findings/'
```

### Terminal 3: View Live Results
```bash
watch -n 5 'tail logs/cron.log'
```

---

## 📈 MONITORING DASHBOARD

### Create Monitor Script:
```bash
cat > scripts/monitor-dashboard.sh << 'DASH'
#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "📊 PASTEBIN SCANNER MONITORING DASHBOARD"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Last scan
LATEST_SCAN=$(ls -t logs/pastebin-findings/pastebin-findings-*.json 2>/dev/null | head -1)
if [ -n "$LATEST_SCAN" ]; then
  echo "📁 Latest Scan: $(basename $LATEST_SCAN)"
  echo "📊 Statistics:"
  jq '{
    pastesProcessed: .pastesProcessed,
    findingsTotal: .findingsCount,
    duration: .duration
  }' "$LATEST_SCAN"
  echo ""
  echo "🔴 CRITICAL Findings:"
  jq '.pastes[].secrets[] | select(.severity=="CRITICAL") | {type, value: .value[0:20]}' "$LATEST_SCAN" || echo "   None"
else
  echo "⚠️ No scan data yet"
fi

echo ""
echo "📅 Scan History:"
ls -lh logs/pastebin-findings/pastebin-findings-*.json 2>/dev/null | tail -5 | awk '{print $9, "("$5")"}'

echo ""
echo "⏱️ Last Updated: $(date)"
DASH

chmod +x scripts/monitor-dashboard.sh
```

### Run Dashboard:
```bash
# Once
./scripts/monitor-dashboard.sh

# Every 30 seconds
watch -n 30 './scripts/monitor-dashboard.sh'
```

---

## 🚨 ALERT CONFIGURATION

### Email Alerts (on CRITICAL findings):
```bash
cat > scripts/email-alert.js << 'MAIL'
const nodemailer = require('nodemailer');
const fs = require('fs');

async function sendAlert(findings) {
  const criticalCount = findings.filter(f => 
    f.secrets.some(s => s.severity === 'CRITICAL')
  ).length;

  if (criticalCount > 0) {
    // Configure your email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: `🚨 CRITICAL: ${criticalCount} Secrets Found on Pastebin!`,
      html: generateAlertHTML(findings)
    });

    console.log('✅ Alert email sent!');
  }
}

function generateAlertHTML(findings) {
  return `
    <h2>🚨 CRITICAL PASTEBIN FINDINGS</h2>
    <p>Found ${findings.length} secret(s) on Pastebin</p>
    ${findings.map(f => `
      <h3>${f.title}</h3>
      <p>URL: <a href="${f.url}">${f.url}</a></p>
      <p>Secrets: ${f.secrets.map(s => s.type).join(', ')}</p>
    `).join('')}
  `;
}

// Usage in scanner:
// if (findings.length > 0) await sendAlert(findings);
MAIL
```

---

## 📱 Discord Webhook Alert

### Setup:
1. Create Discord webhook
2. Add to `.env.local`:
```
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
```

### Add to Scanner:
```javascript
async function sendDiscordAlert(findings) {
  const webhook = process.env.DISCORD_WEBHOOK;
  
  const critical = findings.filter(f => 
    f.secrets.some(s => s.severity === 'CRITICAL')
  ).length;

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🚨 PASTEBIN ALERT`,
      embeds: [{
        color: 0xff0000,
        title: `Found ${critical} CRITICAL Findings!`,
        description: findings.map(f => 
          `• **${f.title}** - ${f.secrets.length} secrets`
        ).join('\n'),
        url: findings[0].url
      }]
    })
  });
}
```

---

## 📊 GRAFANA DASHBOARD (Advanced)

### Data Source:
```bash
# Export findings to JSON (already done)
logs/pastebin-findings/pastebin-findings-*.json
```

### Dashboard Panels:
```
1. Total Findings (gauge)
2. Findings by Severity (pie chart)
3. Findings Over Time (time series)
4. Top Paste Titles (table)
5. Recent Alerts (log view)
```

### Setup:
1. Install Grafana
2. Add JSON datasource
3. Import dashboard JSON
4. Set refresh to 1 hour

---

## 🔍 ANALYSIS QUERIES

### Count all findings:
```bash
jq '.pastes[].secrets' logs/pastebin-findings/pastebin-findings-*.json | jq -s 'length'
```

### By severity:
```bash
jq '[.pastes[].secrets[] | .severity] | group_by(.) | map({severity: .[0], count: length})' logs/pastebin-findings/pastebin-findings-2025-11-08.json
```

### By type:
```bash
jq '[.pastes[].secrets[] | .type] | group_by(.) | map({type: .[0], count: length})' logs/pastebin-findings/pastebin-findings-2025-11-08.json
```

### Most common pastes:
```bash
jq '.pastes | sort_by(.secrets | length) | reverse | .[0:5] | .[] | {title, secretCount: (.secrets | length)}' logs/pastebin-findings/pastebin-findings-2025-11-08.json
```

---

## 📈 PERFORMANCE TRACKING

### Track Scan Performance:
```bash
# Scan duration over time
jq '.duration' logs/pastebin-findings/pastebin-findings-*.json | jq -s 'add/length' 

# Average findings per day
jq '.findingsCount' logs/pastebin-findings/pastebin-findings-*.json | jq -s 'add/length'

# Growth trend
for file in logs/pastebin-findings/pastebin-findings-*.json; do
  echo "$(basename $file | cut -d- -f3): $(jq '.findingsCount' $file)"
done | sort
```

---

## 🎯 PRODUCTION DEPLOYMENT

### 1. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone Project:
```bash
cd /home/karlheinz/krypto/aera-token
npm install
```

### 3. Configure Environment:
```bash
# Copy env template
cp .env.example .env.local

# Add tokens
echo "PASTEBIN_TOKEN=..." >> .env.local
echo "GITHUB_TOKEN=..." >> .env.local
echo "ALERT_EMAIL=..." >> .env.local
```

### 4. Enable Service:
```bash
sudo systemctl enable pastebin-scanner.service
sudo systemctl start pastebin-scanner.service
```

### 5. Monitor:
```bash
# Watch logs
sudo journalctl -u pastebin-scanner.service -f

# Check status
sudo systemctl status pastebin-scanner.service
```

---

## 🔄 MAINTENANCE

### Weekly Check:
```bash
# View last 7 days of findings
ls -lt logs/pastebin-findings/pastebin-findings-*.json | head -7

# Check service status
sudo systemctl status pastebin-scanner.service

# Review alerts
grep "🚨" logs/cron.log | tail -10
```

### Monthly Cleanup:
```bash
# Archive old findings
tar -czf logs/archive/pastebin-findings-oct.tar.gz logs/pastebin-findings/pastebin-findings-2025-10-*.json

# Keep only last 3 months
find logs/pastebin-findings -mtime +90 -delete
```

### Update Scanner:
```bash
cd /home/karlheinz/krypto/aera-token
git pull
npm install
sudo systemctl restart pastebin-scanner.service
```

---

## ✅ HEALTH CHECK

### Service Health:
```bash
cat > scripts/health-check.sh << 'HEALTH'
#!/bin/bash

echo "🏥 HEALTH CHECK"

# Check if service is running
if sudo systemctl is-active --quiet pastebin-scanner.service; then
  echo "✅ Service: RUNNING"
else
  echo "❌ Service: STOPPED"
fi

# Check last scan
LATEST=$(ls -t logs/pastebin-findings/pastebin-findings-*.json 2>/dev/null | head -1)
if [ -n "$LATEST" ]; then
  AGE=$(($(date +%s) - $(stat -f%m "$LATEST" 2>/dev/null || stat -c%Y "$LATEST")))
  HOURS=$((AGE / 3600))
  if [ $HOURS -lt 2 ]; then
    echo "✅ Recent Scan: $HOURS hours ago"
  else
    echo "⚠️  Old Scan: $HOURS hours ago"
  fi
else
  echo "❌ No scan data"
fi

# Check disk space
DISK=$(df -h logs/pastebin-findings | awk 'NR==2 {print $5}')
echo "💾 Disk Usage: $DISK"

# Check API status
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://pastebin.com/api/v1/api_scraping.php?limit=1")
if [ "$RESPONSE" = "200" ]; then
  echo "✅ API: RESPONDING"
else
  echo "⚠️  API: STATUS $RESPONSE"
fi

echo ""
echo "Checked: $(date)"
HEALTH

chmod +x scripts/health-check.sh
```

### Run Health Check:
```bash
./scripts/health-check.sh
```

---

## 🚀 START MONITORING NOW

```bash
# Option 1: Cron (Simple)
echo "0 * * * * cd /home/karlheinz/krypto/aera-token && npm run scan:pastebin-v2" | crontab -

# Option 2: Service (Recommended)
sudo systemctl enable pastebin-scanner.service
sudo systemctl start pastebin-scanner.service

# Option 3: Watch (Development)
watch -n 3600 'cd /home/karlheinz/krypto/aera-token && npm run scan:pastebin-v2'

# Check Status
./scripts/health-check.sh
```

---

**Status:** 🟢 MONITORING SETUP READY  
**Deployment:** Choose your option above  
**Next:** Start scanner running 24/7!
