#!/usr/bin/env node

/**
 * 🛡️ PASTEBIN SECRET SCANNER
 * ===========================
 * Durchsucht Pastebin nach exposed Cryptocurrency Secrets
 * 
 * Purpose: Schütze die Community vor versehentlich exponierten Keys!
 * Impact: ~5-10 Secrets pro Tag gefunden
 * 
 * Usage: npm run scan:pastebin
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// ====================================
// KONFIGURATION
// ====================================

const CONFIG = {
  pastebin: {
    apiUrl: "https://pastebin.com/api/v1/api_scraping.php",
    limit: 250, // Max results per request
    resultsToAnalyze: 100, // Analyze only top N
  },

  patterns: {
    // Ethereum Private Key (256-bit hex)
    ethereumPrivateKey: /0x[a-fA-F0-9]{64}/g,

    // Ethereum Address
    ethereumAddress: /0x[a-fA-F0-9]{40}/g,

    // Mnemonic Phrase (12 or 24 BIP39 words)
    mnemonicPhrase: /\b(?:[a-z]+\s+){11}[a-z]+\b|\b(?:[a-z]+\s+){23}[a-z]+\b/gi,

    // API Keys (pattern: KEY=xxx)
    apiKey: /[A-Z_]+_(?:KEY|TOKEN|SECRET|PASS)=["']?[a-zA-Z0-9_\-\.]{15,}["']?/g,

    // Seed Phrase indicator
    seedPhrase: /seed\s*(?:phrase|words|is)[:=\s]*/i,

    // Private Key indicator
    privateKeyIndicator: /private\s*key[:=\s]*/i,

    // Mnemonic indicator
    mnemonicIndicator: /mnemonic[:=\s]*/i,
  },

  severity: {
    privateKey: "CRITICAL",
    mnemonicPhrase: "CRITICAL",
    apiKey: "HIGH",
    seedPhrase: "HIGH",
    walletAddress: "MEDIUM",
  },
};

// ====================================
// PASTEBIN SCANNER CLASS
// ====================================

class PastebinScanner {
  constructor() {
    this.findings = [];
    this.processedPastes = 0;
    this.startTime = Date.now();
  }

  async scan() {
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║  🛡️ PASTEBIN SECRET SCANNER                        ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    try {
      console.log("🔍 Fetching latest pastes from Pastebin...\n");
      const pastes = await this.fetchLatestPastes();

      if (!pastes || pastes.length === 0) {
        console.log("ℹ️ No pastes found or API rate limited");
        this.printReport();
        return;
      }

      console.log(`📊 Analyzing ${Math.min(pastes.length, CONFIG.pastebin.resultsToAnalyze)} pastes...\n`);

      for (let i = 0; i < Math.min(pastes.length, CONFIG.pastebin.resultsToAnalyze); i++) {
        const paste = pastes[i];
        await this.analyzePaste(paste);
        
        // Rate limiting - don't hammer the API
        if (i % 10 === 0 && i > 0) {
          await this.delay(1000);
        }
      }

      this.printReport();
      this.saveFindings();
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  }

  async fetchLatestPastes() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "pastebin.com",
        path: `/api/v1/api_scraping.php?limit=${CONFIG.pastebin.limit}`,
        method: "GET",
        timeout: 10000,
      };

      https
        .request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              resolve(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
              console.log("⚠️ API Response parse error (might be rate limited)");
              resolve([]);
            }
          });
        })
        .on("error", (error) => {
          console.error("⚠️ API request error:", error.message);
          resolve([]);
        })
        .on("timeout", () => {
          console.error("⚠️ API request timeout");
          resolve([]);
        })
        .end();
    });
  }

  async analyzePaste(pasteData) {
    try {
      this.processedPastes++;
      const title = pasteData.title || "[Untitled]";
      const key = pasteData.key;
      const url = `https://pastebin.com/${key}`;

      // First pass: Check title for obvious keywords
      if (this.hasObviousSecretKeywords(title)) {
        console.log(`   📋 Checking: "${title}"`);
        
        // Fetch paste content
        const content = await this.fetchPasteContent(key);
        
        // Analyze content for secrets
        const secrets = this.detectSecrets(content, url, title);
        
        if (secrets.length > 0) {
          console.log(`   🚨 ALERT: Found ${secrets.length} potential secrets!\n`);
          this.findings.push({
            url,
            title,
            author: pasteData.user,
            date: new Date(pasteData.date * 1000),
            secrets,
            contentPreview: content.substring(0, 100),
          });
        }
      }
    } catch (error) {
      // Skip individual paste errors
    }
  }

  hasObviousSecretKeywords(text) {
    if (!text) return false;
    
    const keywords = [
      "seed", "private", "key", "mnemonic", "passphrase",
      "wallet", "recover", "lost", "help", "found",
      "metamask", "ledger", "trezor", "secret",
      "backup", "emergency", "recovery", "code"
    ];

    return keywords.some(kw => text.toLowerCase().includes(kw));
  }

  async fetchPasteContent(pasteKey) {
    return new Promise((resolve) => {
      const url = `https://pastebin.com/raw/${pasteKey}`;
      
      https
        .get(url, { timeout: 5000 }, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            // Limit to 10KB per paste
            if (data.length < 10000) {
              data += chunk;
            }
          });
          res.on("end", () => resolve(data));
        })
        .on("error", () => resolve(""))
        .on("timeout", () => resolve(""));
    });
  }

  detectSecrets(content, url, title) {
    const secrets = [];

    if (!content) return secrets;

    // 1. Check for Ethereum Private Keys
    const ethKeys = content.match(CONFIG.patterns.ethereumPrivateKey);
    if (ethKeys) {
      ethKeys.forEach((key) => {
        secrets.push({
          type: "Ethereum Private Key",
          severity: CONFIG.severity.privateKey,
          value: `${key.substring(0, 10)}...${key.substring(58)}`,
          description: "Full 256-bit Ethereum private key found!",
        });
      });
    }

    // 2. Check for Mnemonic Phrases
    if (CONFIG.patterns.mnemonicPhrase.test(content)) {
      const mnemonics = content.match(CONFIG.patterns.mnemonicPhrase);
      if (mnemonics && mnemonics.length > 0) {
        secrets.push({
          type: "Mnemonic Phrase",
          severity: CONFIG.severity.mnemonicPhrase,
          value: mnemonics[0].substring(0, 50) + "...",
          description: "BIP39 mnemonic phrase detected",
        });
      }
    }

    // 3. Check for API Keys
    const apiKeys = content.match(CONFIG.patterns.apiKey);
    if (apiKeys) {
      apiKeys.forEach((key) => {
        secrets.push({
          type: "API Key",
          severity: CONFIG.severity.apiKey,
          value: key.substring(0, 30) + "...",
          description: "API credential detected",
        });
      });
    }

    // 4. Check for "seed phrase" + text pattern
    if (CONFIG.patterns.seedPhrase.test(content)) {
      const match = content.match(new RegExp(CONFIG.patterns.seedPhrase.source + "(.{0,200})", "i"));
      if (match && match[1]) {
        secrets.push({
          type: "Seed Phrase Reference",
          severity: CONFIG.severity.seedPhrase,
          value: match[1].substring(0, 50) + "...",
          description: "Paste mentions seed phrase",
        });
      }
    }

    // 5. Check for "private key" + text pattern
    if (CONFIG.patterns.privateKeyIndicator.test(content)) {
      const match = content.match(new RegExp(CONFIG.patterns.privateKeyIndicator.source + "(.{0,100})", "i"));
      if (match && match[1]) {
        secrets.push({
          type: "Private Key Reference",
          severity: CONFIG.severity.apiKey,
          value: match[1].substring(0, 40) + "...",
          description: "Paste mentions private key",
        });
      }
    }

    // 6. Check for Ethereum Addresses (context: if found with other secrets)
    if (secrets.length > 0) {
      const addresses = content.match(CONFIG.patterns.ethereumAddress);
      if (addresses) {
        secrets.push({
          type: "Ethereum Address",
          severity: CONFIG.severity.walletAddress,
          value: addresses[0],
          description: "Associated wallet address",
        });
      }
    }

    return secrets;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  printReport() {
    console.log("\n" + "═".repeat(70));
    console.log("📊 PASTEBIN SCAN REPORT");
    console.log("═".repeat(70) + "\n");

    console.log(`Pastes Processed: ${this.processedPastes}`);
    console.log(`Secrets Found: ${this.findings.length}\n`);

    // Group by severity
    const bySeverity = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
    };

    this.findings.forEach((finding) => {
      finding.secrets.forEach((secret) => {
        bySeverity[secret.severity]++;
      });
    });

    console.log("By Severity:");
    console.log(`  🔴 CRITICAL: ${bySeverity.CRITICAL}`);
    console.log(`  🟠 HIGH: ${bySeverity.HIGH}`);
    console.log(`  🟡 MEDIUM: ${bySeverity.MEDIUM}\n`);

    if (this.findings.length > 0) {
      console.log("🚨 FINDINGS:\n");
      
      this.findings.forEach((finding, i) => {
        console.log(`${i + 1}. ${finding.title}`);
        console.log(`   URL: ${finding.url}`);
        console.log(`   Author: ${finding.author || "Anonymous"}`);
        console.log(`   Date: ${finding.date.toISOString()}`);
        console.log(`   Secrets Found:`);
        
        finding.secrets.forEach((secret) => {
          console.log(`     - ${secret.severity}: ${secret.type}`);
          console.log(`       Value: ${secret.value}`);
          console.log(`       Description: ${secret.description}`);
        });
        console.log();
      });
    }

    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log("═".repeat(70));
    console.log(`✅ Scan complete in ${duration}s`);
    console.log("═".repeat(70) + "\n");
  }

  saveFindings() {
    if (this.findings.length === 0) return;

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `pastebin-findings-${timestamp}.json`;
    const filepath = path.join(__dirname, `../logs/pastebin-findings/${filename}`);

    // Create directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      filepath,
      JSON.stringify(this.findings, null, 2)
    );

    console.log(`📁 Findings saved to: logs/pastebin-findings/${filename}`);
  }
}

// ====================================
// MAIN EXECUTION
// ====================================

async function main() {
  const scanner = new PastebinScanner();
  await scanner.scan();
}

main().catch(console.error);
