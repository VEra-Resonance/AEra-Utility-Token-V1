#!/usr/bin/env node

/**
 * 🔑 PRIVATE KEY EXTRACTOR
 * =========================
 * Extrahiert alle gefundenen Private Keys aus Blockchain Scanner Findings
 * und speichert sie in verschiedenen Formaten
 */

const fs = require("fs");
const path = require("path");

// ====================================
// CONFIGURATION
// ====================================

const FINDINGS_DIR = path.join(__dirname, "../logs/blockchain-findings");
const OUTPUT_DIR = path.join(__dirname, "../logs/extracted-keys");

// ====================================
// EXTRACT PRIVATE KEYS
// ====================================

class PrivateKeyExtractor {
  constructor() {
    this.keys = [];
    this.keysByTx = {};
    this.keysByFrom = {};
  }

  // Extract all findings files
  extractFromFiles() {
    if (!fs.existsSync(FINDINGS_DIR)) {
      console.error(`❌ Findings directory not found: ${FINDINGS_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(FINDINGS_DIR).filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
      console.log("⚠️  No findings files found. Run scanner first:");
      console.log("   npm run scan:blockchain");
      console.log("   npm run scan:blockchain-mainnet");
      process.exit(0);
    }

    console.log(`📂 Found ${files.length} findings file(s)\n`);

    files.forEach((file) => {
      const filepath = path.join(FINDINGS_DIR, file);
      const data = JSON.parse(fs.readFileSync(filepath, "utf8"));

      console.log(`📄 Processing: ${file}`);
      console.log(`   Network: ${data.network}`);
      console.log(`   Findings: ${data.findingsCount}`);

      this.extractFromData(data, file);
    });

    return this.keys;
  }

  // Extract keys from data
  extractFromData(data, filename) {
    data.findings.forEach((finding) => {
      finding.secrets.forEach((secret) => {
        if (secret.type === "Ethereum Private Key") {
          const keyData = {
            privateKey: secret.value,
            txHash: finding.txHash,
            from: finding.from,
            to: finding.to,
            value: finding.value,
            block: finding.blockNumber,
            network: data.network,
            chainId: data.chainId,
            url: finding.url,
            timestamp: finding.timestamp,
            filename: filename,
          };

          this.keys.push(keyData);

          // Index by TX
          if (!this.keysByTx[finding.txHash]) {
            this.keysByTx[finding.txHash] = [];
          }
          this.keysByTx[finding.txHash].push(keyData);

          // Index by From Address
          if (!this.keysByFrom[finding.from]) {
            this.keysByFrom[finding.from] = [];
          }
          this.keysByFrom[finding.from].push(keyData);
        }
      });
    });
  }

  // Save in multiple formats
  saveResults() {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().split("T")[0];

    // 1. Full JSON with all details
    const jsonFile = path.join(
      OUTPUT_DIR,
      `private-keys-full-${timestamp}.json`
    );
    fs.writeFileSync(jsonFile, JSON.stringify(this.keys, null, 2));
    console.log(`\n✅ Full JSON: ${jsonFile} (${this.keys.length} keys)`);

    // 2. Simple key list (one per line)
    const keyListFile = path.join(OUTPUT_DIR, `private-keys-list-${timestamp}.txt`);
    const keyList = this.keys
      .map((k) => k.privateKey)
      .join("\n");
    fs.writeFileSync(keyListFile, keyList);
    console.log(`✅ Key List: ${keyListFile}`);

    // 3. CSV with metadata
    const csvFile = path.join(OUTPUT_DIR, `private-keys-csv-${timestamp}.csv`);
    const csvHeader =
      "Private Key,TX Hash,From Address,To Address,Value (Wei),Block,Network,Chain ID,URL,Timestamp\n";
    const csvRows = this.keys
      .map(
        (k) =>
          `"${k.privateKey}","${k.txHash}","${k.from}","${k.to}",${k.value},"${k.block}","${k.network}",${k.chainId},"${k.url}","${k.timestamp}"`
      )
      .join("\n");
    fs.writeFileSync(csvFile, csvHeader + csvRows);
    console.log(`✅ CSV Export: ${csvFile}`);

    // 4. Grouped by source address
    const groupedFile = path.join(
      OUTPUT_DIR,
      `private-keys-grouped-${timestamp}.json`
    );
    fs.writeFileSync(groupedFile, JSON.stringify(this.keysByFrom, null, 2));
    console.log(`✅ Grouped by Address: ${groupedFile}`);

    // 5. Summary report
    const summaryFile = path.join(OUTPUT_DIR, `extraction-summary-${timestamp}.txt`);
    this.saveSummary(summaryFile);
    console.log(`✅ Summary Report: ${summaryFile}`);

    return {
      jsonFile,
      keyListFile,
      csvFile,
      groupedFile,
      summaryFile,
    };
  }

  // Save summary report
  saveSummary(filepath) {
    let summary = `════════════════════════════════════════════════════════════════════════════
🔑 PRIVATE KEY EXTRACTION REPORT
════════════════════════════════════════════════════════════════════════════

Extraction Date: ${new Date().toISOString()}

STATISTICS
──────────────────────────────────────────────────────────────────────────

Total Keys Extracted:  ${this.keys.length}
Unique Transactions:   ${Object.keys(this.keysByTx).length}
Unique Source Addresses: ${Object.keys(this.keysByFrom).length}

KEYS BY NETWORK
──────────────────────────────────────────────────────────────────────────

`;

    // Group by network
    const byNetwork = {};
    this.keys.forEach((k) => {
      if (!byNetwork[k.network]) {
        byNetwork[k.network] = [];
      }
      byNetwork[k.network].push(k);
    });

    Object.entries(byNetwork).forEach(([network, keys]) => {
      summary += `${network} (Chain ${keys[0].chainId}): ${keys.length} keys\n`;
    });

    summary += `\nKEYS BY SOURCE ADDRESS
──────────────────────────────────────────────────────────────────────────

`;

    // Group by from address
    Object.entries(this.keysByFrom).forEach(([addr, keys]) => {
      const totalValue = keys.reduce((sum, k) => sum + BigInt(k.value), 0n);
      const totalValueEth = (Number(totalValue) / 1e18).toFixed(2);
      summary += `\n${addr}\n`;
      summary += `  Keys: ${keys.length}\n`;
      summary += `  Transactions: ${keys.length}\n`;
      summary += `  Total Value: ${totalValueEth} ETH (~$${(
        Number(totalValueEth) * 3500
      ).toFixed(0)} USD)\n`;
      summary += `  Networks: ${[...new Set(keys.map((k) => k.network))].join(", ")}\n`;
    });

    summary += `\nOUTPUT FILES
──────────────────────────────────────────────────────────────────────────

private-keys-full-${new Date().toISOString().split("T")[0]}.json
  → Complete data with all metadata

private-keys-list-${new Date().toISOString().split("T")[0]}.txt
  → Simple list, one key per line

private-keys-csv-${new Date().toISOString().split("T")[0]}.csv
  → Spreadsheet format with metadata

private-keys-grouped-${new Date().toISOString().split("T")[0]}.json
  → Organized by source address

extraction-summary-${new Date().toISOString().split("T")[0]}.txt
  → This summary report

⚠️ SECURITY WARNING
──────────────────────────────────────────────────────────────────────────

These private keys are now extracted to disk!

IMPORTANT:
• These files contain HIGHLY SENSITIVE DATA
• Store them securely (encrypted, air-gapped)
• Delete after analysis if not needed
• Never commit to version control
• Add to .gitignore

════════════════════════════════════════════════════════════════════════════
`;

    fs.writeFileSync(filepath, summary);
  }

  // Print report to console
  printReport() {
    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║           🔑 PRIVATE KEY EXTRACTION SUMMARY            ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    console.log(`📊 Total Keys Extracted: ${this.keys.length}`);
    console.log(`🔗 Unique Transactions: ${Object.keys(this.keysByTx).length}`);
    console.log(
      `👤 Unique Source Addresses: ${Object.keys(this.keysByFrom).length}`
    );

    // By network
    const byNetwork = {};
    this.keys.forEach((k) => {
      if (!byNetwork[k.network]) {
        byNetwork[k.network] = 0;
      }
      byNetwork[k.network]++;
    });

    console.log("\n🌐 By Network:");
    Object.entries(byNetwork).forEach(([network, count]) => {
      console.log(`   ${network}: ${count} keys`);
    });

    // By source
    console.log("\n💼 By Source Address (Top 5):");
    Object.entries(this.keysByFrom)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .forEach(([addr, keys]) => {
        const totalValue = keys.reduce((sum, k) => sum + BigInt(k.value), 0n);
        const totalValueEth = (Number(totalValue) / 1e18).toFixed(2);
        console.log(
          `   ${addr.substring(0, 10)}... : ${keys.length} keys (${totalValueEth} ETH)`
        );
      });

    console.log("\n📁 Output Files:");
    console.log("   • logs/extracted-keys/private-keys-full-YYYY-MM-DD.json");
    console.log("   • logs/extracted-keys/private-keys-list-YYYY-MM-DD.txt");
    console.log("   • logs/extracted-keys/private-keys-csv-YYYY-MM-DD.csv");
    console.log("   • logs/extracted-keys/private-keys-grouped-YYYY-MM-DD.json");
    console.log("   • logs/extracted-keys/extraction-summary-YYYY-MM-DD.txt");

    console.log(
      "\n⚠️  WARNING: These files contain sensitive private keys! Keep them secure.\n"
    );
  }
}

// ====================================
// MAIN EXECUTION
// ====================================

if (require.main === module) {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║         🔑 PRIVATE KEY EXTRACTOR                        ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const extractor = new PrivateKeyExtractor();
  const keys = extractor.extractFromFiles();

  if (keys.length === 0) {
    console.log("ℹ️  No private keys found in findings. Run scanner first:");
    console.log("   npm run scan:blockchain");
    console.log("   npm run scan:blockchain-mainnet");
    process.exit(0);
  }

  extractor.saveResults();
  extractor.printReport();

  console.log("✅ Extraction complete!");
}

module.exports = PrivateKeyExtractor;
