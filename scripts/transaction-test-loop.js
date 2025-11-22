/**
 * 🔄 AERA Token Transaction Test Loop
 * 
 * Führt sequenzielle Transaktionen aus und dokumentiert diese.
 * SICHERHEIT: Private Keys MÜSSEN in .env.local gespeichert sein (NICHT in Code!)
 * 
 * Verwendung:
 *   npm run test-tx-loop
 * 
 * .env.local muss enthalten:
 *   TX_TEST_WALLET_1=<private-key-1>  (wird zu erster Wallet-Adresse)
 *   TX_TEST_WALLET_2=<private-key-2>  (wird zu zweiter Wallet-Adresse)
 *   SEPOLIA_RPC_URL=<rpc-url>
 */

const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// ============================================================================
// KONFIGURATION
// ============================================================================

const CONFIG = {
  // Token Contract (Sepolia)
  TOKEN_ADDRESS: '0x5032206396A6001eEaD2e0178C763350C794F69e',
  TOKEN_ABI: [
    'function transfer(address to, uint256 amount) public returns (bool)',
    'function balanceOf(address account) public view returns (uint256)',
    'function decimals() public view returns (uint8)',
    'function symbol() public view returns (string)',
  ],

  // Test Konfiguration
  TEST_CONFIG: {
    transactionCount: 10,           // Wie viele Transaktionen?
    delayBetweenTx: 5000,           // Pause zwischen Txs (ms)
    amountPerTx: '0.1',             // AERA pro Transaktion
    walletSwitch: true,             // Zwischen Wallets wechseln?
  },

  // Logging
  LOG_DIR: './transaction-logs',
  LOG_FORMAT: 'csv',  // 'csv', 'json', or 'markdown'
};

// ============================================================================
// KLASSE: TransactionTester
// ============================================================================

class TransactionTester {
  constructor(config) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    this.token = new ethers.Contract(
      config.TOKEN_ADDRESS,
      config.TOKEN_ABI,
      this.provider
    );
    this.transactions = [];
    this.wallet1 = null;
    this.wallet2 = null;
    this.currentWallet = null;
  }

  /**
   * Initialisiere die Test-Wallets
   */
  async initialize() {
    console.log('\n🔐 Initialisiere Test-Wallets...\n');

    if (!process.env.TX_TEST_WALLET_1 || !process.env.TX_TEST_WALLET_2) {
      throw new Error(
        'ERROR: TX_TEST_WALLET_1 und TX_TEST_WALLET_2 müssen in .env.local definiert sein!'
      );
    }

    // Erstelle Wallet-Objekte
    this.wallet1 = new ethers.Wallet(process.env.TX_TEST_WALLET_1, this.provider);
    this.wallet2 = new ethers.Wallet(process.env.TX_TEST_WALLET_2, this.provider);

    console.log(`✅ Wallet 1: ${this.wallet1.address}`);
    console.log(`✅ Wallet 2: ${this.wallet2.address}`);

    // Verifiziere Balances
    const balance1 = await this.token.balanceOf(this.wallet1.address);
    const balance2 = await this.token.balanceOf(this.wallet2.address);
    const decimals = await this.token.decimals();

    console.log(`   Balance W1: ${ethers.formatUnits(balance1, decimals)} AERA`);
    console.log(`   Balance W2: ${ethers.formatUnits(balance2, decimals)} AERA`);

    if (balance1 === 0n && balance2 === 0n) {
      console.warn('⚠️  WARNING: Beide Wallets haben 0 AERA! Test kann nicht laufen.');
    }
  }

  /**
   * Führe eine einzelne Transaktion aus
   */
  async executeTransaction(fromWallet, toWallet, index) {
    try {
      const tokenWithSigner = this.token.connect(fromWallet);
      const amount = ethers.parseEther(this.config.TEST_CONFIG.amountPerTx);

      console.log(
        `\n📤 TX #${index}: ${fromWallet.address.slice(0, 6)}... → ${toWallet.address.slice(0, 6)}...`
      );

      // Verifiziere Balance vor TX
      const balanceBefore = await this.token.balanceOf(fromWallet.address);
      if (balanceBefore < amount) {
        throw new Error(
          `Insufficient balance: ${ethers.formatEther(balanceBefore)} < ${ethers.formatEther(amount)}`
        );
      }

      // Sende Transaktion
      const startTime = Date.now();
      const tx = await tokenWithSigner.transfer(toWallet.address, amount);
      const pendingTime = Date.now();

      console.log(`   TX Hash: ${tx.hash}`);
      console.log(`   ⏳ Warte auf Bestätigung...`);

      // Warte auf Bestätigung
      const receipt = await tx.wait();
      const endTime = Date.now();

      // Verifiziere Balance nach TX
      const balanceAfter = await this.token.balanceOf(fromWallet.address);

      const txData = {
        index,
        timestamp: new Date().toISOString(),
        fromAddress: fromWallet.address,
        toAddress: toWallet.address,
        amount: this.config.TEST_CONFIG.amountPerTx,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice.toString(),
        transactionFee: ethers.formatEther(receipt.gasUsed * receipt.gasPrice),
        status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
        balanceBefore: ethers.formatUnits(balanceBefore, 18),
        balanceAfter: ethers.formatUnits(balanceAfter, 18),
        executionTime: pendingTime - startTime,
        confirmationTime: endTime - pendingTime,
        totalTime: endTime - startTime,
      };

      this.transactions.push(txData);

      console.log(`   ✅ Status: ${txData.status}`);
      console.log(`   Gas: ${txData.gasUsed} (Fee: ${txData.transactionFee} ETH)`);
      console.log(`   Time: ${txData.confirmationTime}ms`);

      return txData;
    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}`);
      return null;
    }
  }

  /**
   * Führe Test-Schleife aus
   */
  async runTestLoop() {
    console.log('\n🔄 Starte Test-Transaktions-Schleife...\n');
    console.log(
      `📊 Config: ${this.config.TEST_CONFIG.transactionCount} Txs, ` +
      `${this.config.TEST_CONFIG.amountPerTx} AERA pro Tx`
    );

    for (let i = 1; i <= this.config.TEST_CONFIG.transactionCount; i++) {
      // Wähle Wallets
      let from, to;
      if (this.config.TEST_CONFIG.walletSwitch) {
        from = i % 2 === 1 ? this.wallet1 : this.wallet2;
        to = i % 2 === 1 ? this.wallet2 : this.wallet1;
      } else {
        from = this.wallet1;
        to = this.wallet2;
      }

      // Führe Transaktion aus
      const txData = await this.executeTransaction(from, to, i);

      if (txData) {
        // Warte vor nächster TX (außer bei letzter)
        if (i < this.config.TEST_CONFIG.transactionCount) {
          const delayMs = this.config.TEST_CONFIG.delayBetweenTx;
          console.log(`   ⏸️  Warte ${delayMs}ms vor nächster TX...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    console.log('\n✅ Test-Schleife abgeschlossen!\n');
  }

  /**
   * Speichere Transaktions-Log
   */
  saveLogs() {
    // Stelle sicher, dass Log-Verzeichnis existiert
    if (!fs.existsSync(this.config.LOG_DIR)) {
      fs.mkdirSync(this.config.LOG_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `transaction-test-${timestamp}`;

    if (this.config.LOG_FORMAT === 'json') {
      this.saveJSON(filename);
    } else if (this.config.LOG_FORMAT === 'csv') {
      this.saveCSV(filename);
    } else if (this.config.LOG_FORMAT === 'markdown') {
      this.saveMarkdown(filename);
    }
  }

  /**
   * Speichere als JSON
   */
  saveJSON(filename) {
    const filepath = path.join(this.config.LOG_DIR, `${filename}.json`);
    const data = {
      timestamp: new Date().toISOString(),
      config: this.config.TEST_CONFIG,
      transactions: this.transactions,
      summary: this.generateSummary(),
    };
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`📄 JSON Log: ${filepath}`);
  }

  /**
   * Speichere als CSV
   */
  saveCSV(filename) {
    const filepath = path.join(this.config.LOG_DIR, `${filename}.csv`);
    const headers = [
      'Index',
      'Timestamp',
      'From',
      'To',
      'Amount (AERA)',
      'TX Hash',
      'Block',
      'Gas Used',
      'Gas Price (Gwei)',
      'Fee (ETH)',
      'Status',
      'Balance Before',
      'Balance After',
      'Execution Time (ms)',
      'Confirmation Time (ms)',
      'Total Time (ms)',
    ];

    const rows = this.transactions.map((tx) => [
      tx.index,
      tx.timestamp,
      tx.fromAddress,
      tx.toAddress,
      tx.amount,
      tx.txHash,
      tx.blockNumber,
      tx.gasUsed,
      ethers.formatUnits(tx.gasPrice, 'gwei'),
      tx.transactionFee,
      tx.status,
      tx.balanceBefore,
      tx.balanceAfter,
      tx.executionTime,
      tx.confirmationTime,
      tx.totalTime,
    ]);

    const csv =
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n') + '\n';

    fs.writeFileSync(filepath, csv);
    console.log(`📊 CSV Log: ${filepath}`);
  }

  /**
   * Speichere als Markdown
   */
  saveMarkdown(filename) {
    const filepath = path.join(this.config.LOG_DIR, `${filename}.md`);
    const summary = this.generateSummary();

    let markdown = `# 📊 AERA Transaction Test Report\n\n`;
    markdown += `**Timestamp:** ${new Date().toISOString()}\n\n`;

    markdown += `## 📈 Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Transactions | ${summary.totalTransactions} |\n`;
    markdown += `| Successful | ${summary.successCount} |\n`;
    markdown += `| Failed | ${summary.failedCount} |\n`;
    markdown += `| Success Rate | ${summary.successRate.toFixed(2)}% |\n`;
    markdown += `| Total AERA Transferred | ${summary.totalAERA} |\n`;
    markdown += `| Total Gas Cost (ETH) | ${summary.totalGasCost} |\n`;
    markdown += `| Avg Execution Time | ${summary.avgExecutionTime.toFixed(0)}ms |\n`;
    markdown += `| Avg Confirmation Time | ${summary.avgConfirmationTime.toFixed(0)}ms |\n\n`;

    markdown += `## 📝 Transaction Details\n\n`;
    markdown += `| # | Time | From | To | Amount | TX Hash | Status | Gas Fee |\n`;
    markdown += `|---|------|------|----|---------|---------|---------|---------|\n`;

    this.transactions.forEach((tx) => {
      const from = tx.fromAddress.slice(0, 6) + '...';
      const to = tx.toAddress.slice(0, 6) + '...';
      const txHash = tx.txHash.slice(0, 10) + '...';
      markdown += `| ${tx.index} | ${tx.timestamp} | ${from} | ${to} | ${tx.amount} | [${txHash}](https://sepolia.etherscan.io/tx/${tx.txHash}) | ${tx.status} | ${tx.transactionFee} |\n`;
    });

    fs.writeFileSync(filepath, markdown);
    console.log(`📄 Markdown Log: ${filepath}`);
  }

  /**
   * Generiere Zusammenfassung
   */
  generateSummary() {
    const successCount = this.transactions.filter((tx) => tx.status === 'SUCCESS').length;
    const failedCount = this.transactions.length - successCount;
    const totalAERA = this.transactions
      .filter((tx) => tx.status === 'SUCCESS')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalGasCost = this.transactions
      .filter((tx) => tx.status === 'SUCCESS')
      .reduce((sum, tx) => sum + parseFloat(tx.transactionFee), 0);
    const avgExecutionTime =
      this.transactions.reduce((sum, tx) => sum + tx.executionTime, 0) / this.transactions.length;
    const avgConfirmationTime =
      this.transactions.reduce((sum, tx) => sum + tx.confirmationTime, 0) /
      this.transactions.length;

    return {
      totalTransactions: this.transactions.length,
      successCount,
      failedCount,
      successRate: (successCount / this.transactions.length) * 100,
      totalAERA: totalAERA.toFixed(4),
      totalGasCost: totalGasCost.toFixed(6),
      avgExecutionTime,
      avgConfirmationTime,
    };
  }

  /**
   * Zeige Zusammenfassung
   */
  printSummary() {
    const summary = this.generateSummary();

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST ZUSAMMENFASSUNG');
    console.log('='.repeat(60));
    console.log(`✅ Erfolgreich:        ${summary.successCount}`);
    console.log(`❌ Fehlgeschlagen:     ${summary.failedCount}`);
    console.log(`📊 Erfolgsquote:       ${summary.successRate.toFixed(2)}%`);
    console.log(`💰 Gesamt AERA:        ${summary.totalAERA}`);
    console.log(`⛽ Gesamt Gas (ETH):   ${summary.totalGasCost}`);
    console.log(`⏱️  Ø Exec Time:        ${summary.avgExecutionTime.toFixed(0)}ms`);
    console.log(`⏱️  Ø Confirm Time:     ${summary.avgConfirmationTime.toFixed(0)}ms`);
    console.log('='.repeat(60) + '\n');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    const tester = new TransactionTester(CONFIG);

    // Initialisiere
    await tester.initialize();

    // Führe Test-Schleife aus
    await tester.runTestLoop();

    // Zeige Zusammenfassung
    tester.printSummary();

    // Speichere Logs
    tester.saveLogs();

    console.log('✅ Test erfolgreich abgeschlossen!');
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
