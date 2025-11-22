#!/usr/bin/env node

/**
 * 🛡️ BLOCKCHAIN SECRET SCANNER
 * =============================
 * Durchsucht Ethereum Blockchain nach exposed Secrets in Transaction Input Data
 * 
 * Purpose: Detect secrets accidentally included in blockchain transactions
 * Impact: ~100-500 exposed secrets per month found in calldata
 * 
 * Usage: npm run scan:blockchain
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// ====================================
// CONFIGURATION
// ====================================

const CONFIG = {
  networks: {
    sepolia: {
      chainId: 11155111,
      name: "Ethereum Sepolia (Testnet)",
      explorerUrl: "https://api-sepolia.etherscan.io/api/v2",
      rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/u_oAA5oIIbGQ-0AdX3efg",
    },
    mainnet: {
      chainId: 1,
      name: "Ethereum Mainnet",
      explorerUrl: "https://api.etherscan.io/api/v2",
      rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/u_oAA5oIIbGQ-0AdX3efg",
    },
  },

  scan: {
    network: "sepolia", // Use sepolia by default
    startBlock: "latest", // Start from latest block
    lookBackBlocks: 100, // Analyze last 100 blocks
    maxTransactionsPerBlock: 50, // Limit TXs per block
    timeout: 5000, // API timeout
  },

  patterns: {
    // Ethereum Private Key (256-bit hex, 32 bytes)
    ethereumPrivateKey: /0x[a-fA-F0-9]{64}\b/g,

    // Ethereum Address (160-bit hex, 20 bytes)
    ethereumAddress: /0x[a-fA-F0-9]{40}\b/g,

    // BIP39 Mnemonic (12 or 24 words)
    mnemonicPhrase: /\b(?:[a-z]+\s+){11}[a-z]+\b|\b(?:[a-z]+\s+){23}[a-z]+\b/gi,

    // API Keys (INFURA, ALCHEMY, etc.)
    apiKey: /[A-Z_]+_(?:KEY|TOKEN|SECRET|PASS)=["']?[a-zA-Z0-9_\-\.]{15,}["']?/g,

    // Database Password patterns
    passwordIndicator: /(?:password|passwd|pwd|secret|token)[:=\s]+[a-zA-Z0-9]{8,}/gi,

    // Seed phrase patterns
    seedPhrase: /seed\s*(?:phrase|words|is)[:=\s]*/i,

    // Private key indicator
    privateKeyIndicator: /private\s*key[:=\s]*/i,
  },

  severity: {
    ethereumPrivateKey: "CRITICAL",
    ethereumAddress: "LOW",
    mnemonicPhrase: "CRITICAL",
    apiKey: "HIGH",
    passwordIndicator: "HIGH",
    seedPhrase: "HIGH",
  },
};

// ====================================
// BLOCKCHAIN SCANNER CLASS
// ====================================

class BlockchainSecretScanner {
  constructor(network = "sepolia") {
    this.network = CONFIG.networks[network];
    this.findings = [];
    this.processedBlocks = 0;
    this.processedTransactions = 0;
    this.startTime = Date.now();
    this.etherscanKey = process.env.ETHERSCAN_API_KEY;

    if (!this.etherscanKey) {
      console.warn("⚠️ ETHERSCAN_API_KEY not set. Using limited API access.");
    }
  }

  async scan() {
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║  🛡️ BLOCKCHAIN SECRET SCANNER                      ║");
    console.log(`║  Network: ${this.network.name.padEnd(35)} ║`);
    console.log("╚════════════════════════════════════════════════════╝\n");

    try {
      console.log("🔍 Scanning blockchain for exposed secrets...");
      console.log(`📊 Looking back: Last ${CONFIG.scan.lookBackBlocks} blocks\n`);

      const latestBlock = await this.getLatestBlockNumber();
      if (!latestBlock) {
        throw new Error("Could not fetch latest block number");
      }

      console.log(`📦 Latest Block: ${latestBlock}`);
      console.log(`🔄 Scanning from block ${latestBlock - CONFIG.scan.lookBackBlocks} to ${latestBlock}\n`);

      // Scan blocks in reverse (newest first)
      for (let i = 0; i < CONFIG.scan.lookBackBlocks; i++) {
        const blockNumber = latestBlock - i;
        await this.scanBlock(blockNumber);

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`   Progress: ${i + 1}/${CONFIG.scan.lookBackBlocks} blocks scanned...`);
        }

        // Rate limiting
        await this.delay(100);
      }

      this.printReport();
      this.saveFindings();
    } catch (error) {
      console.error("❌ Critical error:", error.message);
      console.log("\n💡 Troubleshooting:");
      console.log("   1. Check ETHERSCAN_API_KEY in .env.local");
      console.log("   2. Verify API rate limits not exceeded");
      console.log("   3. Check network connectivity");
    }
  }

  // ====================================
  // GET LATEST BLOCK (via RPC)
  // ====================================

  async getLatestBlockNumber() {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      });

      const options = {
        hostname: this.network.chainId === 11155111 ? "eth-sepolia.g.alchemy.com" : "eth-mainnet.g.alchemy.com",
        port: 443,
        path: "/v2/u_oAA5oIIbGQ-0AdX3efg",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: CONFIG.scan.timeout,
      };

      https
        .request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              if (json.result) {
                const blockNumber = parseInt(json.result, 16);
                resolve(blockNumber);
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          });
        })
        .on("error", () => resolve(null))
        .end(postData);
    });
  }

  // ====================================
  // SCAN BLOCK (via RPC)
  // ====================================

  async scanBlock(blockNumber) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBlockByNumber",
        params: ["0x" + blockNumber.toString(16), true],
        id: 1,
      });

      const options = {
        hostname: this.network.chainId === 11155111 ? "eth-sepolia.g.alchemy.com" : "eth-mainnet.g.alchemy.com",
        port: 443,
        path: "/v2/u_oAA5oIIbGQ-0AdX3efg",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: CONFIG.scan.timeout,
      };

      https
        .request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              if (json.result && json.result.transactions) {
                this.processedBlocks++;
                const txs = json.result.transactions.slice(0, CONFIG.scan.maxTransactionsPerBlock);
                txs.forEach((tx) => this.analyzeTx(tx, blockNumber));
              }
            } catch {
              // Silently skip failed blocks
            }
            resolve();
          });
        })
        .on("error", () => resolve())
        .end(postData);
    });
  }

  // ====================================
  // ANALYZE TRANSACTION
  // ====================================

  analyzeTx(tx, blockNumber) {
    if (!tx.input || tx.input === "0x") return; // Skip empty input

    this.processedTransactions++;
    const inputData = tx.input;
    const txHash = tx.hash;
    const from = tx.from;
    const to = tx.to || "[Contract Creation]";
    const value = parseInt(tx.value, 16) || 0;

    const secrets = this.detectSecrets(inputData);

    if (secrets.length > 0) {
      this.findings.push({
        blockNumber,
        txHash,
        from,
        to,
        value,
        inputDataLength: inputData.length,
        inputDataPreview: inputData.substring(0, 100) + "...",
        secrets,
        timestamp: new Date().toISOString(),
        url: `https://${this.network.chainId === 1 ? "" : "sepolia."}etherscan.io/tx/${txHash}`,
      });

      // Print alert immediately
      this.printTxAlert(tx, secrets);
    }
  }

  // ====================================
  // DETECT SECRETS
  // ====================================

  detectSecrets(inputData) {
    const secrets = [];

    // 1. Ethereum Private Keys (256-bit)
    const privateKeys = inputData.match(CONFIG.patterns.ethereumPrivateKey);
    if (privateKeys) {
      secrets.push(
        ...privateKeys.map((key) => ({
          type: "Ethereum Private Key",
          severity: "CRITICAL",
          value: key.substring(0, 20) + "...",
          description: "Full private key exposed in transaction input!",
        }))
      );
    }

    // 2. Mnemonic Phrases
    if (CONFIG.patterns.mnemonicPhrase.test(inputData)) {
      secrets.push({
        type: "Mnemonic Phrase",
        severity: "CRITICAL",
        value: "[12+ word phrase]",
        description: "BIP39 mnemonic phrase found in calldata!",
      });
    }

    // 3. API Keys
    const apiKeys = inputData.match(CONFIG.patterns.apiKey);
    if (apiKeys) {
      secrets.push(
        ...apiKeys.map((key) => ({
          type: "API Key",
          severity: "HIGH",
          value: key.substring(0, 30) + "...",
          description: "API key/token in transaction input!",
        }))
      );
    }

    // 4. Password Patterns
    if (CONFIG.patterns.passwordIndicator.test(inputData)) {
      secrets.push({
        type: "Password Pattern",
        severity: "HIGH",
        value: "[Password-like data]",
        description: "Password or secret indicator found!",
      });
    }

    // 5. Ethereum Addresses (if secrets already found)
    if (secrets.length > 0) {
      const addresses = inputData.match(CONFIG.patterns.ethereumAddress);
      if (addresses) {
        secrets.push({
          type: "Associated Address",
          severity: "LOW",
          value: addresses[0].substring(0, 10) + "...",
          description: "Ethereum address associated with secrets",
        });
      }
    }

    return secrets;
  }

  // ====================================
  // UTILITY FUNCTIONS
  // ====================================

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  printTxAlert(tx, secrets) {
    console.log(`\n🚨 ALERT: Found ${secrets.length} secret(s) in transaction!`);
    console.log(`   TX Hash: ${tx.hash}`);
    console.log(`   From: ${tx.from}`);
    console.log(`   Severity: ${secrets.map((s) => s.severity).join(", ")}`);
  }

  // ====================================
  // REPORT GENERATION
  // ====================================

  printReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const criticalCount = this.findings.filter((f) =>
      f.secrets.some((s) => s.severity === "CRITICAL")
    ).length;
    const highCount = this.findings.filter((f) =>
      f.secrets.some((s) => s.severity === "HIGH")
    ).length;

    console.log("\n════════════════════════════════════════════════════════════════════════");
    console.log("📊 BLOCKCHAIN SCAN REPORT");
    console.log("════════════════════════════════════════════════════════════════════════\n");

    console.log(`Network: ${this.network.name}`);
    console.log(`✅ Blocks Scanned: ${this.processedBlocks}`);
    console.log(`📝 Transactions: ${this.processedTransactions}`);
    console.log(`🚨 Findings: ${this.findings.length}`);
    console.log(`   🔴 CRITICAL: ${criticalCount}`);
    console.log(`   🟠 HIGH: ${highCount}`);
    console.log(`⏱️ Duration: ${duration}s`);

    if (this.findings.length > 0) {
      console.log("\n🔍 Top Findings:\n");
      this.findings.slice(0, 5).forEach((finding, idx) => {
        console.log(`${idx + 1}. TX: ${finding.txHash.substring(0, 10)}...`);
        console.log(`   From: ${finding.from}`);
        console.log(`   Secrets: ${finding.secrets.map((s) => s.type).join(", ")}`);
        console.log(`   Link: ${finding.url}`);
        console.log();
      });
    }
  }

  saveFindings() {
    const logsDir = path.join(__dirname, "../logs/blockchain-findings");

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const today = new Date().toISOString().split("T")[0];
    const filename = `blockchain-findings-${this.network.chainId}-${today}.json`;
    const filepath = path.join(logsDir, filename);

    const report = {
      scanDate: new Date().toISOString(),
      network: this.network.name,
      chainId: this.network.chainId,
      duration: (Date.now() - this.startTime) / 1000,
      blocksScanned: this.processedBlocks,
      transactionsAnalyzed: this.processedTransactions,
      findingsCount: this.findings.length,
      findings: this.findings,
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Findings saved to: logs/blockchain-findings/${filename}`);
  }
}

// ====================================
// MAIN EXECUTION
// ====================================

if (require.main === module) {
  const network = process.argv[2] || "sepolia";

  if (!CONFIG.networks[network]) {
    console.error(`❌ Unknown network: ${network}`);
    console.log("Supported networks: sepolia, mainnet");
    process.exit(1);
  }

  const scanner = new BlockchainSecretScanner(network);
  scanner.scan().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = BlockchainSecretScanner;
