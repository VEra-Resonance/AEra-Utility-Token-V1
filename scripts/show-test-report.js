#!/usr/bin/env node

/**
 * 📊 AERA Transaction Test Report Generator
 * =========================================
 * Liest die letzten Test-Logs und erstellt einen schönen Report
 */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs', 'tx-tests');

// Finde neuesten Test
const tests = fs.readdirSync(logsDir).sort().reverse();
const latestTest = tests[0];

if (!latestTest) {
  console.log('❌ Keine Test-Logs gefunden!');
  process.exit(1);
}

const testDir = path.join(logsDir, latestTest);
const logFile = path.join(testDir, 'transaction-log.json');
const csvFile = path.join(testDir, 'transactions.csv');

console.log(`\n📊 TEST REPORT: ${latestTest}\n`);

if (fs.existsSync(logFile)) {
  const data = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
  
  console.log('═'.repeat(50));
  console.log('📈 STATISTIK');
  console.log('═'.repeat(50));
  console.log(`Start Time: ${data.startTime}`);
  console.log(`Total Transactions: ${data.results.total}`);
  console.log(`✅ Success: ${data.results.success} (${((data.results.success / data.results.total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${data.results.failed}`);
  console.log(`Total Gas: ${data.results.totalGas}`);
  console.log(`Total Cost: $${data.results.totalCost.toFixed(4)}`);
  console.log(`Avg Cost per TX: $${(data.results.totalCost / data.results.total).toFixed(6)}`);
  console.log('═'.repeat(50));
  
  if (data.transactions && data.transactions.length > 0) {
    console.log('\n📋 TRANSAKTIONEN:\n');
    data.transactions.forEach((tx, idx) => {
      const status = tx.status === 'success' ? '✅' : '❌';
      const cost = tx.costUsd ? `$${tx.costUsd}` : 'N/A';
      console.log(`${idx + 1}. ${status} ${tx.type} | Hash: ${tx.hash ? tx.hash.slice(0, 10) + '...' : 'PENDING'} | ${cost}`);
    });
  }
} else {
  console.log('⏳ Test läuft noch oder Log fehlt...');
}

if (fs.existsSync(csvFile)) {
  console.log(`\n📊 CSV Export: ${csvFile}`);
}

console.log('\n');
