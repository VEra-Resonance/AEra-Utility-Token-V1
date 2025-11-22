#!/usr/bin/env node

/**
 * 🧪 AERA Token - Transaktions-Loop-Tester
 * ========================================
 * Testet Burn & Transfer Transaktionen in einer Schleife
 * mit 2 Test-Wallets auf Sepolia Testnet
 * 
 * Dokumentiert alle TXs mit:
 * - TX Hash
 * - Status (Success/Failed)
 * - Gas Used
 * - Kosten (USD)
 * - Dauer
 * - Nonce
 */

const ethers = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// ====================================
// KONFIGURATION
// ====================================

const CONFIG = {
  network: "sepolia",
  rpcUrl: process.env.SEPOLIA_RPC_URL,
  contractAddress: process.env.AERA_TOKEN_ADDRESS,
  safeAddress: process.env.AERA_SAFE_ADDRESS,
  
  // Test Wallets
  wallet1: {
    address: process.env.TEST_WALLET_1_ADDRESS,
    privateKey: process.env.TEST_WALLET_1_PRIVATE_KEY,
  },
  wallet2: {
    address: process.env.TEST_WALLET_2_ADDRESS,
    privateKey: process.env.TEST_WALLET_2_PRIVATE_KEY,
  },
  
  // Test Parameter
  loopCount: parseInt(process.env.TX_LOOP_COUNT || "10"),
  delayMs: parseInt(process.env.TX_DELAY_MS || "30000"),
  testType: process.env.TX_TEST_TYPE || "all", // "burn", "transfer", "all"
  saveLog: process.env.SAVE_TX_LOG === "true",
  exportCsv: process.env.EXPORT_CSV === "true",
};

// ====================================
// ABI (ERC-20 Minimal)
// ====================================

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function burn(uint256 amount) returns (bool)",
  "function burnFrom(address account, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// ====================================
// LOGGER
// ====================================

class TransactionLogger {
  constructor(testId) {
    this.testId = testId;
    this.logDir = path.join(__dirname, "..", "logs", "tx-tests", testId);
    this.transactions = [];
    this.summary = {
      startTime: new Date(),
      testId: testId,
      config: CONFIG,
      results: {
        total: 0,
        success: 0,
        failed: 0,
        totalGas: 0n,
        totalCost: 0,
      },
    };

    // Erstelle Log-Verzeichnis
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(type, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      message,
      ...data,
    };

    console.log(`[${timestamp}] [${type}] ${message}`);

    if (data.detail) {
      console.log(`  └─ ${JSON.stringify(data.detail)}`);
    }
  }

  recordTransaction(tx) {
    this.transactions.push(tx);
    this.summary.results.total++;

    if (tx.status === "success") {
      this.summary.results.success++;
      this.summary.results.totalGas += BigInt(tx.gasUsed);
      this.summary.results.totalCost += parseFloat(tx.costUsd);
    } else {
      this.summary.results.failed++;
    }
  }

  saveLog() {
    const logFile = path.join(this.logDir, "transaction-log.json");
    // Convert BigInt to string for JSON serialization
    const summary = {
      ...this.summary,
      results: {
        ...this.summary.results,
        totalGas: this.summary.results.totalGas.toString(),
      },
    };
    fs.writeFileSync(logFile, JSON.stringify(summary, null, 2));
    this.log("INFO", `✅ Log gespeichert: ${logFile}`);
  }

  saveCsv() {
    const csvFile = path.join(this.logDir, "transactions.csv");
    
    // CSV Header
    const header = [
      "Index",
      "Timestamp",
      "Hash",
      "Type",
      "From",
      "To",
      "Amount",
      "Status",
      "Gas Used",
      "Gas Price (Gwei)",
      "Cost (USD)",
      "Nonce",
      "Duration (ms)",
      "Error",
    ].join(",");

    // CSV Rows
    const rows = this.transactions.map((tx, idx) => [
      idx + 1,
      tx.timestamp,
      tx.hash || "PENDING",
      tx.type,
      tx.from,
      tx.to,
      tx.amount,
      tx.status,
      tx.gasUsed || "N/A",
      tx.gasPrice || "N/A",
      tx.costUsd || 0,
      tx.nonce,
      tx.duration,
      tx.error || "",
    ].join(","));

    const csv = [header, ...rows].join("\n");
    fs.writeFileSync(csvFile, csv);
    this.log("INFO", `✅ CSV gespeichert: ${csvFile}`);
  }

  printSummary() {
    console.log("\n");
    console.log("═════════════════════════════════════════");
    console.log("📊 TEST SUMMARY");
    console.log("═════════════════════════════════════════");
    console.log(`Test ID: ${this.testId}`);
    console.log(`Start Time: ${this.summary.startTime}`);
    console.log(`End Time: ${new Date().toISOString()}`);
    console.log(`Duration: ${((Date.now() - this.summary.startTime) / 1000).toFixed(2)}s`);
    console.log("");
    console.log(`Total Transactions: ${this.summary.results.total}`);
    console.log(`Success: ${this.summary.results.success} (${((this.summary.results.success / this.summary.results.total) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${this.summary.results.failed}`);
    console.log("");
    console.log(`Total Gas: ${this.summary.results.totalGas.toString()}`);
    console.log(`Total Cost: $${this.summary.results.totalCost.toFixed(2)}`);
    console.log(`Avg Cost per TX: $${(this.summary.results.totalCost / this.summary.results.total).toFixed(4)}`);
    console.log("═════════════════════════════════════════\n");
  }
}

// ====================================
// TRANSACTION TESTER
// ====================================

class TransactionTester {
  constructor(logger) {
    this.logger = logger;
    this.provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
    this.wallet1 = new ethers.Wallet(CONFIG.wallet1.privateKey, this.provider);
    this.wallet2 = new ethers.Wallet(CONFIG.wallet2.privateKey, this.provider);
    this.contract = new ethers.Contract(
      CONFIG.contractAddress,
      ERC20_ABI,
      this.provider
    );
  }

  async validateSetup() {
    this.logger.log("INFO", "🔍 Setup validiere...");

    try {
      // Prüfe Wallet Adressen
      if (!ethers.isAddress(CONFIG.wallet1.address)) {
        throw new Error("Ungültige Wallet 1 Adresse");
      }
      if (!ethers.isAddress(CONFIG.wallet2.address)) {
        throw new Error("Ungültige Wallet 2 Adresse");
      }

      // Prüfe Balances
      const balance1 = await this.contract.balanceOf(CONFIG.wallet1.address);
      const balance2 = await this.contract.balanceOf(CONFIG.wallet2.address);
      const ethBalance1 = await this.provider.getBalance(CONFIG.wallet1.address);
      const ethBalance2 = await this.provider.getBalance(CONFIG.wallet2.address);

      this.logger.log("INFO", "✅ Setup validiert", {
        detail: {
          wallet1: {
            address: CONFIG.wallet1.address,
            aeraBalance: ethers.formatUnits(balance1, 18),
            ethBalance: ethers.formatEther(ethBalance1),
          },
          wallet2: {
            address: CONFIG.wallet2.address,
            aeraBalance: ethers.formatUnits(balance2, 18),
            ethBalance: ethers.formatEther(ethBalance2),
          },
        },
      });

      // Warnung wenn zu wenig Balance
      if (balance1 < ethers.parseUnits("0.5", 18)) {
        this.logger.log("WARN", "⚠️  Wallet 1 hat weniger als 0.5 AERA");
      }
      if (balance2 < ethers.parseUnits("0.5", 18)) {
        this.logger.log("WARN", "⚠️  Wallet 2 hat weniger als 0.5 AERA");
      }
      if (ethBalance1 < ethers.parseEther("0.01")) {
        this.logger.log("WARN", "⚠️  Wallet 1 hat weniger als 0.01 ETH");
      }
      if (ethBalance2 < ethers.parseEther("0.01")) {
        this.logger.log("WARN", "⚠️  Wallet 2 hat weniger als 0.01 ETH");
      }

      return true;
    } catch (error) {
      this.logger.log("ERROR", `❌ Setup Validierung fehlgeschlagen: ${error.message}`);
      return false;
    }
  }

  async burnToken(wallet, amount = ethers.parseUnits("0.1", 18)) {
    const startTime = Date.now();
    const txData = {
      timestamp: new Date().toISOString(),
      type: "BURN",
      from: wallet.address,
      to: CONFIG.contractAddress,
      amount: ethers.formatUnits(amount, 18),
      status: "pending",
      nonce: await this.provider.getTransactionCount(wallet.address),
    };

    try {
      this.logger.log("INFO", `🔥 Burn TX von ${wallet.address.slice(0, 6)}...`);

      const contract = this.contract.connect(wallet);
      const tx = await contract.burn(amount);
      txData.hash = tx.hash;

      this.logger.log("INFO", `⏳ Warte auf Bestätigung... ${tx.hash}`);
      const receipt = await tx.wait();

      txData.status = receipt.status === 1 ? "success" : "failed";
      txData.gasUsed = receipt.gasUsed.toString();
      txData.gasPrice = ethers.formatUnits(receipt.gasPrice, "gwei");
      txData.costUsd = (
        parseFloat(ethers.formatUnits(receipt.gasUsed * receipt.gasPrice, "ether")) * 1500
      ).toFixed(4); // Angenommen ETH = $1500
      txData.duration = Date.now() - startTime;

      if (txData.status === "success") {
        this.logger.log("SUCCESS", `✅ Burn erfolgreich! Gas: ${txData.gasUsed}, Kosten: $${txData.costUsd}`);
      } else {
        this.logger.log("ERROR", `❌ Burn fehlgeschlagen!`);
        txData.error = "Transaction reverted";
      }

      return txData;
    } catch (error) {
      txData.status = "failed";
      txData.error = error.message;
      txData.duration = Date.now() - startTime;
      this.logger.log("ERROR", `❌ Burn Fehler: ${error.message}`);
      return txData;
    }
  }

  async transferToken(fromWallet, toAddress, amount = ethers.parseUnits("0.1", 18)) {
    const startTime = Date.now();
    const txData = {
      timestamp: new Date().toISOString(),
      type: "TRANSFER",
      from: fromWallet.address,
      to: toAddress,
      amount: ethers.formatUnits(amount, 18),
      status: "pending",
      nonce: await this.provider.getTransactionCount(fromWallet.address),
    };

    try {
      this.logger.log("INFO", `💸 Transfer TX von ${fromWallet.address.slice(0, 6)}... zu ${toAddress.slice(0, 6)}...`);

      const contract = this.contract.connect(fromWallet);
      const tx = await contract.transfer(toAddress, amount);
      txData.hash = tx.hash;

      this.logger.log("INFO", `⏳ Warte auf Bestätigung... ${tx.hash}`);
      const receipt = await tx.wait();

      txData.status = receipt.status === 1 ? "success" : "failed";
      txData.gasUsed = receipt.gasUsed.toString();
      txData.gasPrice = ethers.formatUnits(receipt.gasPrice, "gwei");
      txData.costUsd = (
        parseFloat(ethers.formatUnits(receipt.gasUsed * receipt.gasPrice, "ether")) * 1500
      ).toFixed(4);
      txData.duration = Date.now() - startTime;

      if (txData.status === "success") {
        this.logger.log("SUCCESS", `✅ Transfer erfolgreich! Gas: ${txData.gasUsed}, Kosten: $${txData.costUsd}`);
      } else {
        this.logger.log("ERROR", `❌ Transfer fehlgeschlagen!`);
        txData.error = "Transaction reverted";
      }

      return txData;
    } catch (error) {
      txData.status = "failed";
      txData.error = error.message;
      txData.duration = Date.now() - startTime;
      this.logger.log("ERROR", `❌ Transfer Fehler: ${error.message}`);
      return txData;
    }
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async runTestLoop() {
    this.logger.log("INFO", `🚀 Starte Loop mit ${CONFIG.loopCount} Transaktionen...`);
    this.logger.log("INFO", `⏱️  Verzögerung zwischen TXs: ${CONFIG.delayMs}ms`);

    for (let i = 0; i < CONFIG.loopCount; i++) {
      this.logger.log("INFO", `\n📍 Iteration ${i + 1}/${CONFIG.loopCount}`);

      try {
        if (CONFIG.testType === "burn" || CONFIG.testType === "all") {
          // Burn von Wallet 1
          const burnTx = await this.burnToken(this.wallet1);
          this.logger.recordTransaction(burnTx);

          await this.sleep(CONFIG.delayMs / 2);
        }

        if (CONFIG.testType === "transfer" || CONFIG.testType === "all") {
          // Transfer von Wallet 1 zu Wallet 2
          const transferTx = await this.transferToken(
            this.wallet1,
            CONFIG.wallet2.address,
            ethers.parseUnits("0.05", 18)
          );
          this.logger.recordTransaction(transferTx);

          await this.sleep(CONFIG.delayMs / 2);
        }

        // Warte zwischen Iterationen
        if (i < CONFIG.loopCount - 1) {
          this.logger.log("INFO", `⏸️  Warte ${CONFIG.delayMs}ms vor nächster Iteration...`);
          await this.sleep(CONFIG.delayMs);
        }
      } catch (error) {
        this.logger.log("ERROR", `❌ Fehler in Iteration ${i + 1}: ${error.message}`);
      }
    }

    this.logger.log("INFO", "✅ Loop abgeschlossen!");
  }
}

// ====================================
// MAIN EXECUTION
// ====================================

async function main() {
  const testId = `test-${Date.now()}`;
  const logger = new TransactionLogger(testId);

  console.log("╔════════════════════════════════════════╗");
  console.log("║   🧪 AERA Transaktions-Loop-Tester    ║");
  console.log("╚════════════════════════════════════════╝\n");

  logger.log("INFO", "🔧 Initialisiere Test...", {
    detail: {
      testId,
      loopCount: CONFIG.loopCount,
      delayMs: CONFIG.delayMs,
      testType: CONFIG.testType,
    },
  });

  const tester = new TransactionTester(logger);

  // Validiere Setup
  const valid = await tester.validateSetup();
  if (!valid) {
    console.error("❌ Setup-Validierung fehlgeschlagen. Beende Programm.");
    process.exit(1);
  }

  // Starte Test-Loop
  await tester.runTestLoop();

  // Speichere Logs
  logger.printSummary();
  
  if (CONFIG.saveLog) {
    logger.saveLog();
  }
  
  if (CONFIG.exportCsv) {
    logger.saveCsv();
  }

  console.log("✅ Test abgeschlossen!\n");
}

// Error Handling
main().catch((error) => {
  console.error("❌ Fehler:", error);
  process.exit(1);
});
