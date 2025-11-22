#!/usr/bin/env node

/**
 * 📈 AERA Transaction Test - Performance Analyzer
 * =============================================
 * Analysiert die Test-Ergebnisse und erstellt Statistiken
 */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs', 'tx-tests');

function analyze() {
  // Get latest test
  const tests = fs.readdirSync(logsDir).sort().reverse();
  const latestTest = tests[0];
  
  if (!latestTest) {
    console.log('❌ Keine Test-Logs gefunden!');
    process.exit(1);
  }
  
  const logFile = path.join(logsDir, latestTest, 'transaction-log.json');
  
  if (!fs.existsSync(logFile)) {
    console.log('⏳ Test läuft noch oder Log nicht gespeichert');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
  
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   📈 PERFORMANCE ANALYSIS - DETAILED REPORT       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
  
  // Basic stats
  console.log('📊 GRUNDSTATISTIKEN:');
  console.log(`   Test ID: ${latestTest}`);
  console.log(`   Total TX: ${data.results.total}`);
  console.log(`   Success: ${data.results.success} (${((data.results.success / data.results.total) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${data.results.failed}`);
  console.log(`   Total Gas: ${data.results.totalGas} wei`);
  console.log(`   Total Cost: $${data.results.totalCost.toFixed(4)}`);
  console.log(`   Avg Cost/TX: $${(data.results.totalCost / data.results.total).toFixed(6)}\n`);
  
  // Transaction analysis
  if (data.transactions && data.transactions.length > 0) {
    const txs = data.transactions;
    const successTxs = txs.filter(tx => tx.status === 'success');
    const failedTxs = txs.filter(tx => tx.status === 'failed');
    
    if (successTxs.length > 0) {
      const durations = successTxs.map(tx => tx.duration);
      const gasValues = successTxs.map(tx => parseInt(tx.gasUsed));
      const costs = successTxs.map(tx => parseFloat(tx.costUsd));
      
      console.log('⏱️  TIMING ANALYSIS:');
      console.log(`   Min: ${Math.min(...durations)}ms`);
      console.log(`   Max: ${Math.max(...durations)}ms`);
      console.log(`   Avg: ${(durations.reduce((a, b) => a + b) / durations.length).toFixed(0)}ms`);
      console.log(`   Median: ${durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]}ms\n`);
      
      console.log('⛽ GAS ANALYSIS:');
      console.log(`   Min: ${Math.min(...gasValues)}`);
      console.log(`   Max: ${Math.max(...gasValues)}`);
      console.log(`   Avg: ${(gasValues.reduce((a, b) => a + b) / gasValues.length).toFixed(0)}`);
      console.log(`   Consistency: ${gasValues.every(g => g === gasValues[0]) ? '✅ Perfect' : '⚠️ Variable'}\n`);
      
      console.log('💰 COST ANALYSIS:');
      console.log(`   Min: $${Math.min(...costs).toFixed(6)}`);
      console.log(`   Max: $${Math.max(...costs).toFixed(6)}`);
      console.log(`   Avg: $${(costs.reduce((a, b) => a + b) / costs.length).toFixed(6)}\n`);
    }
    
    if (failedTxs.length > 0) {
      console.log('❌ FAILED TRANSACTIONS:');
      failedTxs.forEach((tx, idx) => {
        console.log(`   ${idx + 1}. ${tx.hash ? tx.hash.slice(0, 10) + '...' : 'PENDING'} - ${tx.error}`);
      });
      console.log('');
    }
  }
  
  console.log('═'.repeat(51));
  console.log('✨ Report complete!\n');
}

analyze();
