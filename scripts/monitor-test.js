#!/usr/bin/env node

/**
 * 📊 AERA Transaction Test - LIVE Monitor
 * =======================================
 * Zeigt den aktuellen Status des laufenden Tests
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const logsDir = path.join(__dirname, 'logs', 'tx-tests');

function getLatestTest() {
  try {
    const tests = fs.readdirSync(logsDir).sort().reverse();
    return tests[0];
  } catch (e) {
    return null;
  }
}

function getTestStatus() {
  const latestTest = getLatestTest();
  if (!latestTest) {
    console.log('❌ Kein Test gefunden');
    return;
  }

  const logFile = path.join(logsDir, latestTest, 'transaction-log.json');
  
  console.clear();
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║     📊 AERA TRANSACTION TEST - LIVE MONITOR       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  console.log(`📍 Test ID: ${latestTest}\n`);
  
  if (fs.existsSync(logFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
      console.log(`✅ Transaktionen: ${data.results.total}`);
      console.log(`✅ Erfolgreich: ${data.results.success}`);
      console.log(`❌ Fehler: ${data.results.failed}`);
      console.log(`💰 Gesamtkosten: $${data.results.totalCost.toFixed(4)}`);
      console.log('\n✨ Test complete!');
    } catch (e) {
      console.log('⏳ Test läuft noch...');
      
      // Try to get real-time info from tail
      exec(`tail -20 ${path.join(logsDir, latestTest, 'transaction-log.json')} 2>/dev/null || echo "Nicht verfügbar"`, (err, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          const lastLines = lines.filter(l => l.includes('[SUCCESS]') || l.includes('[ERROR]')).slice(-5);
          if (lastLines.length > 0) {
            console.log('\n📋 Letzte Transaktionen:');
            lastLines.forEach(line => console.log(`   ${line.substring(0, 80)}`));
          }
        }
      });
    }
  } else {
    console.log('⏳ Test läuft noch...');
    console.log(`📁 Verzeichnis: ${path.join(logsDir, latestTest)}`);
  }
  
  console.log('\n💡 Tipp: "npm run show:report" zeigt finalen Report\n');
}

// Initial check
getTestStatus();

// Auto-refresh every 10 seconds
setInterval(() => {
  process.stdout.write('\u001B[2J\u001B[0f'); // Clear screen
  getTestStatus();
}, 10000);
