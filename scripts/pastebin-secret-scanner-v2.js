#!/usr/bin/env node

/**
 * 🛡️ PASTEBIN SECRET SCANNER v2 (WITH RETRY & FALLBACK)
 * ========================================================
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Fallback to cached data if API fails
 * - Better error handling
 * - Verbose logging for debugging
 * 
 * Usage: node scripts/pastebin-secret-scanner-v2.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// ====================================
// CONFIGURATION
// ====================================

const CONFIG = {
  pastebin: {
    apiUrl: "https://pastebin.com/api/v1/api_scraping.php",
    limit: 250,
    resultsToAnalyze: 100,
    timeout: 5000,
  },
  retry: {
    attempts: 3,
    initialDelay: 2000,
    maxDelay: 10000,
  },
  patterns: {
    ethereumPrivateKey: /0x[a-fA-F0-9]{64}\b/g,
    ethereumAddress: /0x[a-fA-F0-9]{40}\b/g,
    mnemonicPhrase: /\b(?:[a-z]+\s+){11}[a-z]+\b|\b(?:[a-z]+\s+){23}[a-z]+\b/gi,
    apiKey: /[A-Z_]+_(?:KEY|TOKEN|SECRET|PASS)=["']?[a-zA-Z0-9_\-\.]{15,}["']?/g,
    seedPhrase: /seed\s*(?:phrase|words|is)[:=\s]*/i,
    privateKeyIndicator: /private\s*key[:=\s]*/i,
    mnemonicIndicator: /mnemonic[:=\s]*/i,
  },
};

// ====================================
// SCANNER CLASS WITH RETRY LOGIC
// ====================================

class PastebinScannerV2 {
  constructor() {
    this.findings = [];
    this.processedPastes = 0;
    this.startTime = Date.now();
    this.retryCount = 0;
  }

  async scan() {
    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║  🛡️ PASTEBIN SECRET SCANNER v2 (WITH RETRY)        ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    try {
      console.log("🔍 Fetching latest pastes from Pastebin...");
      const pastes = await this.fetchLatestPastesWithRetry();

      if (!pastes || pastes.length === 0) {
        console.log("⚠️ No pastes found");
        this.printReport();
        return;
      }

      console.log(`✅ Successfully fetched ${pastes.length} pastes`);
      console.log(`📊 Analyzing ${Math.min(pastes.length, CONFIG.pastebin.resultsToAnalyze)} pastes...\n`);

      for (let i = 0; i < Math.min(pastes.length, CONFIG.pastebin.resultsToAnalyze); i++) {
        const paste = pastes[i];
        await this.analyzePaste(paste);

        if (i % 10 === 0 && i > 0) {
          process.stdout.write(`   Processed: ${i}/${Math.min(pastes.length, CONFIG.pastebin.resultsToAnalyze)}\n`);
          await this.delay(500);
        }
      }

      this.printReport();
      this.saveFindings();
    } catch (error) {
      console.error("❌ Critical error:", error.message);
      console.log("\n💡 Troubleshooting:");
      console.log("   1. Pastebin API might be rate limited");
      console.log("   2. Try again in 5-10 minutes");
      console.log("   3. Or use cached findings from previous scans");
      this.listCachedFindings();
    }
  }

  // ====================================
  // FETCH WITH RETRY LOGIC
  // ====================================

  async fetchLatestPastesWithRetry() {
    let lastError;

    for (let attempt = 1; attempt <= CONFIG.retry.attempts; attempt++) {
      try {
        console.log(`   Attempt ${attempt}/${CONFIG.retry.attempts}...`);
        const result = await this.fetchLatestPastes();
        console.log(`   ✅ Success on attempt ${attempt}`);
        this.retryCount = attempt - 1; // Store successful attempt
        return result;
      } catch (error) {
        lastError = error;
        console.log(`   ❌ Attempt ${attempt} failed: ${error.message}`);

        if (attempt < CONFIG.retry.attempts) {
          const delay = this.getBackoffDelay(attempt);
          console.log(`   ⏳ Waiting ${delay / 1000}s before retry...\n`);
          await this.delay(delay);
        }
      }
    }

    // All retries failed, try fallback
    console.log("\n⚠️ All retry attempts failed. Trying fallback options...");
    return await this.tryFallback(lastError);
  }

  // ====================================
  // FALLBACK OPTIONS
  // ====================================

  async tryFallback(lastError) {
    console.log("\n📦 Fallback Options:\n");

    // Option 1: Use cached findings
    console.log("1️⃣ Try cached findings from previous scans...");
    const cached = this.getCachedFindings();
    if (cached && cached.length > 0) {
      console.log(`   ✅ Found ${cached.length} cached pastes from previous scans`);
      return cached;
    }

    // Option 2: Use dummy test data
    console.log("\n2️⃣ Using test data to verify scanner functionality...");
    const testData = this.getTestData();
    if (testData) {
      console.log(`   ✅ Using ${testData.length} test pastes`);
      return testData;
    }

    throw lastError;
  }

  // ====================================
  // FETCH FROM API
  // ====================================

  async fetchLatestPastes() {
    return new Promise((resolve, reject) => {
      const options = {
        method: "GET",
        timeout: CONFIG.pastebin.timeout,
      };

      const req = https.get(
        `${CONFIG.pastebin.apiUrl}?limit=${CONFIG.pastebin.limit}`,
        options,
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              // Check for error responses
              if (data.includes("invalid")) {
                throw new Error("Invalid API response (rate limited?)");
              }

              if (data.includes("connection")) {
                throw new Error("API connection error");
              }

              // Try to parse XML
              const pastes = this.parseXmlPastes(data);
              resolve(pastes);
            } catch (error) {
              reject(error);
            }
          });
        }
      );

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("API request timeout"));
      });

      req.on("error", reject);
    });
  }

  parseXmlPastes(xmlData) {
    const pastes = [];

    // Try to extract paste blocks
    const pasteRegex = /<paste>([\s\S]*?)<\/paste>/gi;
    let match;

    while ((match = pasteRegex.exec(xmlData)) !== null) {
      const pasteXml = match[1];

      // Extract individual fields
      const getField = (fieldName) => {
        const fieldRegex = new RegExp(`<${fieldName}>([^<]+)</${fieldName}>`);
        const fieldMatch = fieldRegex.exec(pasteXml);
        return fieldMatch ? fieldMatch[1] : "";
      };

      pastes.push({
        key: getField("paste_key"),
        title: this.decodeHtml(getField("paste_title")) || "Untitled",
        user: getField("paste_user") || "anonymous",
        date: new Date(parseInt(getField("paste_date")) * 1000).toISOString(),
        url: `https://pastebin.com/${getField("paste_key")}`,
      });
    }

    if (pastes.length === 0) {
      throw new Error("No pastes found in XML response");
    }

    return pastes;
  }

  // ====================================
  // ANALYZE PASTE
  // ====================================

  async analyzePaste(paste) {
    try {
      const content = await this.fetchPasteContent(paste.key);
      if (!content) return;

      const secrets = this.detectSecrets(content, paste.url, paste.title);

      if (secrets.length > 0) {
        this.findings.push({
          ...paste,
          secrets,
          foundAt: new Date().toISOString(),
        });

        // Print alert immediately
        this.printAlert(paste, secrets);
      }

      this.processedPastes++;
    } catch (error) {
      // Silently skip failed pastes
    }
  }

  // ====================================
  // FETCH PASTE CONTENT
  // ====================================

  async fetchPasteContent(pasteKey) {
    return new Promise((resolve) => {
      const options = {
        timeout: 3000,
      };

      https.get(
        `https://pastebin.com/raw/${pasteKey}`,
        options,
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            if (data.length > CONFIG.pastebin.timeout) {
              res.destroy();
              resolve(null);
              return;
            }
            data += chunk;
          });

          res.on("end", () => {
            resolve(data.substring(0, 10240)); // Limit size
          });
        }
      ).on("error", () => {
        resolve(null);
      });
    });
  }

  // ====================================
  // DETECT SECRETS
  // ====================================

  detectSecrets(content, url, title) {
    const secrets = [];
    const contentLower = content.toLowerCase();

    // 1. Ethereum Private Keys
    const privateKeys = content.match(CONFIG.patterns.ethereumPrivateKey);
    if (privateKeys) {
      secrets.push(
        ...privateKeys.map((key) => ({
          type: "Ethereum Private Key",
          severity: "CRITICAL",
          value: key.substring(0, 20) + "..." + key.substring(key.length - 6),
          description: "Full 256-bit Ethereum private key found!",
        }))
      );
    }

    // 2. Mnemonic Phrases
    if (CONFIG.patterns.mnemonicPhrase.test(content)) {
      secrets.push({
        type: "Mnemonic Phrase",
        severity: "CRITICAL",
        value: "[BIP39 phrase detected]",
        description: "12 or 24-word mnemonic seed phrase found!",
      });
    }

    // 3. API Keys
    const apiKeys = content.match(CONFIG.patterns.apiKey);
    if (apiKeys) {
      secrets.push(
        ...apiKeys.map((key) => ({
          type: "API Key",
          severity: "HIGH",
          value: key.substring(0, 30) + "...",
          description: "API key or secret token found!",
        }))
      );
    }

    // 4. Seed Phrase Indicators
    if (
      CONFIG.patterns.seedPhrase.test(contentLower) ||
      CONFIG.patterns.mnemonicIndicator.test(contentLower)
    ) {
      secrets.push({
        type: "Seed Phrase Reference",
        severity: "HIGH",
        value: "[Reference found]",
        description: "Content mentions seed or mnemonic phrase",
      });
    }

    // 5. Ethereum Addresses (only if other secrets found)
    if (secrets.length > 0) {
      const addresses = content.match(CONFIG.patterns.ethereumAddress);
      if (addresses) {
        secrets.push({
          type: "Associated Wallet Address",
          severity: "MEDIUM",
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

  getBackoffDelay(attempt) {
    const delay = Math.min(
      CONFIG.retry.initialDelay * Math.pow(2, attempt - 1),
      CONFIG.retry.maxDelay
    );
    // Add random jitter
    return delay + Math.random() * 1000;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  decodeHtml(html) {
    const entities = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#039;": "'",
    };
    return html ? html.replace(/&[\w#]+;/g, (entity) => entities[entity] || entity) : "";
  }

  // ====================================
  // CACHED DATA FUNCTIONS
  // ====================================

  getCachedFindings() {
    const logsDir = path.join(__dirname, "../logs/pastebin-findings");
    if (!fs.existsSync(logsDir)) return [];

    const files = fs.readdirSync(logsDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length === 0) return [];

    try {
      const latestFile = path.join(logsDir, files[0]);
      const cached = JSON.parse(fs.readFileSync(latestFile, "utf8"));
      console.log(`   Found: logs/pastebin-findings/${files[0]}`);
      return cached.pastes || [];
    } catch {
      return [];
    }
  }

  getTestData() {
    return [
      {
        key: "test1",
        title: "[TEST] Ethereum wallet backup",
        user: "testuser",
        date: new Date().toISOString(),
        url: "https://pastebin.com/test1",
      },
      {
        key: "test2",
        title: "[TEST] Seed recovery help",
        user: "testuser",
        date: new Date().toISOString(),
        url: "https://pastebin.com/test2",
      },
    ];
  }

  listCachedFindings() {
    const logsDir = path.join(__dirname, "../logs/pastebin-findings");
    if (!fs.existsSync(logsDir)) {
      console.log("\n📁 No cached findings yet. Run successful scan first.");
      return;
    }

    const files = fs.readdirSync(logsDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log("\n📁 No cached findings yet.");
      return;
    }

    console.log("\n📁 Available cached findings:");
    files.slice(0, 5).forEach((f) => {
      console.log(`   - ${f}`);
    });
  }

  // ====================================
  // REPORT GENERATION
  // ====================================

  printAlert(paste, secrets) {
    console.log(`\n🚨 ALERT: Found ${secrets.length} secret(s) in paste!`);
    console.log(`   Title: ${paste.title}`);
    console.log(`   URL: ${paste.url}`);
    console.log(`   Secrets: ${secrets.map((s) => s.type).join(", ")}`);
  }

  printReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const criticalCount = this.findings.filter((f) =>
      f.secrets.some((s) => s.severity === "CRITICAL")
    ).length;
    const highCount = this.findings.filter((f) =>
      f.secrets.some((s) => s.severity === "HIGH")
    ).length;

    console.log("\n════════════════════════════════════════════════════════════════════════");
    console.log("📊 SCAN REPORT");
    console.log("════════════════════════════════════════════════════════════════════════\n");

    console.log(`✅ Pastes Processed: ${this.processedPastes}`);
    console.log(`🚨 Findings: ${this.findings.length}`);
    console.log(`   🔴 CRITICAL: ${criticalCount}`);
    console.log(`   🟠 HIGH: ${highCount}`);
    console.log(`⏱️ Duration: ${duration}s`);
    console.log(`🔄 Retries: ${this.retryCount}`);

    if (this.findings.length > 0) {
      console.log("\n🔍 Detailed Findings:\n");
      this.findings.forEach((finding, idx) => {
        console.log(`${idx + 1}. ${finding.title}`);
        console.log(`   URL: ${finding.url}`);
        console.log(`   Author: ${finding.user}`);
        finding.secrets.forEach((secret) => {
          const icon =
            secret.severity === "CRITICAL" ? "🔴" : secret.severity === "HIGH" ? "🟠" : "🟡";
          console.log(`   ${icon} ${secret.type}`);
          console.log(`      Value: ${secret.value}`);
          console.log(`      Description: ${secret.description}`);
        });
        console.log();
      });
    }
  }

  saveFindings() {
    const logsDir = path.join(__dirname, "../logs/pastebin-findings");

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const today = new Date().toISOString().split("T")[0];
    const filename = `pastebin-findings-${today}.json`;
    const filepath = path.join(logsDir, filename);

    const report = {
      scanDate: new Date().toISOString(),
      duration: (Date.now() - this.startTime) / 1000,
      pastesProcessed: this.processedPastes,
      findingsCount: this.findings.length,
      pastes: this.findings,
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Findings saved to: logs/pastebin-findings/${filename}`);
  }
}

// ====================================
// MAIN EXECUTION
// ====================================

if (require.main === module) {
  const scanner = new PastebinScannerV2();
  scanner.scan().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = PastebinScannerV2;
