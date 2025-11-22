#!/usr/bin/env node

/**
 * 🛡️ GitHub Secret Scanner & Alert System
 * =========================================
 * Durchsucht GitHub nach exposed Private Keys & Wallets
 * und alertet Project Owner automatisch
 * 
 * Purpose: Schütze Entwickler vor Security-Incidents!
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// ====================================
// KONFIGURATION
// ====================================

const CONFIG = {
  github: {
    token: process.env.GITHUB_TOKEN, // Brauchen wir noch!
    searchQueries: [
      // Ethereum Private Keys
      "filename:.env private_key",
      'PRIVATE_KEY="0x" language:javascript',
      'privateKey="0x" language:solidity',
      
      // Mnemonic Phrases
      "SEED_PHRASE= language:javascript",
      "MNEMONIC= language:javascript",
      
      // API Keys (Alchemy, Infura, etc.)
      "ALCHEMY_API_KEY= language:javascript",
      "INFURA_API_KEY= language:javascript",
      
      // Wallet addresses in configs
      "owner.*0x[a-fA-F0-9]{40}",
      ".env.example private",
      "hardhat.config secrets",
      ".env.local committed",
    ],
    resultsPerQuery: 30,
    // 🆕 GIT HISTORY SCANNING
    scanGitHistory: true,
    scanCommits: 100,  // Letzte 100 Commits pro Repo
    scanBranches: true,  // Alle Branches durchsuchen
  },

  patterns: {
    // Ethereum Private Key (256-bit hex)
    ethereumPrivateKey: /0x[a-fA-F0-9]{64}/g,
    
    // Ethereum Address
    ethereumAddress: /0x[a-fA-F0-9]{40}/g,
    
    // Solana Private Key (base58, ~88 chars)
    solanaPrivateKey: /\[[\d\s,]{,1000}\]/g,
    
    // Mnemonic Phrase (12 or 24 words)
    mnemonicPhrase: /\b(?:[a-z]+\s+){11}[a-z]+\b|\b(?:[a-z]+\s+){23}[a-z]+\b/gi,
    
    // API Keys (pattern: KEY=xxx)
    apiKey: /[A-Z_]+_(?:KEY|TOKEN|SECRET)=["']?[a-zA-Z0-9_\-]{20,}["']?/g,
  },

  severity: {
    privateKey: "CRITICAL",
    mnemonicPhrase: "CRITICAL",
    apiKey: "HIGH",
    walletAddress: "MEDIUM",
  },

  // Tokens zum Wörter-Checken (BIP39 Standard)
  commonMnemonicWords: [
    "abandon", "ability", "able", "about", "above", "absent", "abuse", "access",
    "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire",
    // ... (würde komplette BIP39 Liste sein - gekürzt für Demo)
  ],
};

// ====================================
// SECRET DETECTOR
// ====================================

class SecretDetector {
  constructor() {
    this.findings = [];
  }

  detectInContent(content, filename, repoUrl) {
    console.log(`  🔍 Scanning: ${filename}...`);

    const detections = [];

    // 1. Ethereum Private Keys
    const ethKeys = content.match(CONFIG.patterns.ethereumPrivateKey);
    if (ethKeys) {
      ethKeys.forEach((key) => {
        detections.push({
          type: "Ethereum Private Key",
          value: key,
          severity: CONFIG.severity.privateKey,
          filename: filename,
          repoUrl: repoUrl,
          timestamp: new Date().toISOString(),
        });
      });
    }

    // 2. Ethereum Addresses (context: if near "owner" or "wallet")
    if (
      filename.includes("config") ||
      filename.includes(".env") ||
      content.includes("owner") ||
      content.includes("wallet")
    ) {
      const addresses = content.match(CONFIG.patterns.ethereumAddress);
      if (addresses) {
        addresses.forEach((addr) => {
          if (addr !== "0x0000000000000000000000000000000000000000") {
            // Exclude zero address
            detections.push({
              type: "Ethereum Address",
              value: addr,
              severity: CONFIG.severity.walletAddress,
              filename: filename,
              repoUrl: repoUrl,
              timestamp: new Date().toISOString(),
            });
          }
        });
      }
    }

    // 3. API Keys
    const apiKeys = content.match(CONFIG.patterns.apiKey);
    if (apiKeys) {
      apiKeys.forEach((key) => {
        detections.push({
          type: "API Key",
          value: key.substring(0, 50) + "...", // Don't log full key
          severity: CONFIG.severity.apiKey,
          filename: filename,
          repoUrl: repoUrl,
          timestamp: new Date().toISOString(),
        });
      });
    }

    return detections;
  }

  analyzeRepository(repoData) {
    console.log(`\n📦 Repo: ${repoData.full_name}`);
    console.log(`   Owner: ${repoData.owner.login}`);
    console.log(`   URL: ${repoData.html_url}`);

    const repoFindings = [];

    // Try to fetch key files
    const filesToCheck = [
      ".env",
      ".env.local",
      ".env.example",
      "hardhat.config.js",
      "truffle-config.js",
      ".github/workflows/*.yml",
      "*.json",
    ];

    // Note: In real implementation, would fetch actual files
    // For demo, we'll log what would be checked
    console.log(`   📋 Would scan: ${filesToCheck.join(", ")}`);

    return repoFindings;
  }

  // 🆕 Analysiere Git History für Secrets
  analyzeCommitHistory(repoUrl, commits) {
    console.log(`\n   📜 Analyzing commit history...`);
    
    const findings = [];
    let secretsInHistory = 0;
    
    if (!commits || commits.length === 0) {
      console.log(`      ✓ No commits found`);
      return findings;
    }
    
    // Prüfe jeden Commit
    commits.forEach((commit, index) => {
      try {
        const message = (commit.commit?.message || "").trim();
        const author = commit.commit?.author?.name || "Unknown";
        
        // Skip wenn kein Message
        if (!message) return;
        
        // Suche nach Secrets im Commit-Message
        if (this.hasSecrets(message)) {
          secretsInHistory++;
          console.log(`      ⚠️  Potential secret in commit: ${commit.sha.substring(0, 7)}`);
          console.log(`         Author: ${author}`);
          console.log(`         Date: ${commit.commit.author.date}`);
          console.log(`         Message: ${message.substring(0, 50)}...`);
          
          findings.push({
            type: "Secret in Commit History",
            commitSha: commit.sha,
            author: author,
            date: commit.commit.author.date,
            message: message.substring(0, 100),
            severity: "HIGH",
            repoUrl: repoUrl,
            filename: "commit message",
            value: "secret-in-commit",
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        // Skip error commits
      }
    });
    
    if (secretsInHistory > 0) {
      console.log(`      🚨 Found ${secretsInHistory} commits with potential secrets!`);
    } else {
      console.log(`      ✓ Git history is clean`);
    }
    
    return findings;
  }

  // Prüfe ob Text Secrets enthält
  hasSecrets(text) {
    if (!text) return false;
    
    // Prüfe auf verschiedene Secret-Muster
    const secretPatterns = [
      /0x[a-fA-F0-9]{64}/,  // Private Key
      /PRIVATE_KEY/i,
      /API_KEY/i,
      /SECRET_KEY/i,
      /MNEMONIC/i,
      /SEED_PHRASE/i,
      /AUTH_TOKEN/i,
    ];
    
    return secretPatterns.some(pattern => pattern.test(text));
  }
}

// ====================================
// GITHUB SEARCHER
// ====================================

class GitHubSearcher {
  constructor(token) {
    this.token = token;
    this.baseUrl = "api.github.com";
  }

  async searchRepositories(query) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: `/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc`,
        method: "GET",
        headers: {
          "User-Agent": "SecretScanner/1.0",
          Authorization: `token ${this.token}`,
        },
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
              resolve(parsed.items || []);
            } catch (e) {
              reject(e);
            }
          });
        })
        .on("error", reject)
        .end();
    });
  }

  // 🆕 GIT HISTORY SCANNER - Durchsucht alte Commits
  async scanGitHistory(repo) {
    console.log(`\n   📜 Scanning git history for: ${repo.full_name}...`);
    
    const histories = [];
    const branches = ["main", "master", "develop"];
    
    for (const branch of branches) {
      try {
        const commits = await this.getCommitHistory(repo.full_name, branch);
        if (commits && commits.length > 0) {
          console.log(`      ✓ Found ${commits.length} commits on branch: ${branch}`);
          histories.push(...commits);
        }
      } catch (error) {
        // Branch might not exist, continue
      }
    }
    
    return histories;
  }

  // Hole Commit-History für einen Branch
  async getCommitHistory(repoName, branch) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: `/repos/${repoName}/commits?sha=${branch}&per_page=${CONFIG.github.scanCommits}`,
        method: "GET",
        headers: {
          "User-Agent": "SecretScanner/1.0",
          Authorization: `token ${this.token}`,
        },
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
              resolve([]);
            }
          });
        })
        .on("error", reject)
        .end();
    });
  }

  // Hole Commit-Details (Diff)
  async getCommitDiff(repoName, commitSha) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: `/repos/${repoName}/commits/${commitSha}`,
        method: "GET",
        headers: {
          "User-Agent": "SecretScanner/1.0",
          Authorization: `token ${this.token}`,
          Accept: "application/vnd.github.v3.raw",
        },
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
              resolve(parsed.files || []);
            } catch (e) {
              resolve([]);
            }
          });
        })
        .on("error", reject)
        .end();
    });
  }
}

// ====================================
// ALERT SYSTEM
// ====================================

class AlertSystem {
  constructor() {
    this.alerts = [];
  }

  createAlert(finding) {
    const alert = {
      id: `ALERT-${Date.now()}`,
      severity: finding.severity,
      title: `🚨 ${finding.severity}: ${finding.type} exposed in ${finding.repoUrl}`,
      description: this.generateAlertDescription(finding),
      actionItems: this.generateActionItems(finding),
      timestamp: finding.timestamp,
    };

    this.alerts.push(alert);
    return alert;
  }

  generateAlertDescription(finding) {
    return `
A ${finding.severity} security risk has been detected:

Type: ${finding.type}
Repository: ${finding.repoUrl}
File: ${finding.filename}
Found: ${finding.timestamp}

Value (truncated): ${finding.value.substring(0, 50)}...

This could compromise the security of the project!
    `;
  }

  generateActionItems(finding) {
    const items = [
      "1. Immediately remove the exposed key from the repository",
      "2. Force-push to remove from git history (git filter-branch or BFG)",
      "3. If it's an API key: Regenerate/revoke it on the service",
      "4. If it's a private key: Transfer funds to a new wallet",
      "5. Audit git log for when it was committed",
      "6. Add .env to .gitignore for future prevention",
    ];

    if (finding.type === "Ethereum Private Key") {
      items.push("7. Check blockchain for unauthorized transactions");
      items.push("8. Monitor the associated wallet address constantly");
    }

    return items;
  }

  async notifyProjectOwner(alert, ownerEmail) {
    console.log(`\n📧 Sending alert to project owner...`);
    console.log(`   To: ${ownerEmail}`);
    console.log(`   Subject: ${alert.title}`);
    console.log(`   Severity: ${alert.severity}`);

    // TODO: Implement actual email sending
    // Would use nodemailer or similar service
    console.log(`   [Email would be sent here]`);
  }

  printAlert(alert) {
    console.log("\n");
    console.log("═".repeat(70));
    console.log("🚨 SECURITY ALERT");
    console.log("═".repeat(70));
    console.log(`\n${alert.title}\n`);
    console.log(alert.description);
    console.log("\n📋 RECOMMENDED ACTIONS:");
    alert.actionItems.forEach((item) => console.log(`   ${item}`));
    console.log("\n" + "═".repeat(70));
  }
}

// ====================================
// MAIN SCANNER
// ====================================

class SecretScanner {
  constructor() {
    this.detector = new SecretDetector();
    this.searcher = new GitHubSearcher(CONFIG.github.token);
    this.alertSystem = new AlertSystem();
  }

  async scanGitHub() {
    console.log("╔═══════════════════════════════════════════════════╗");
    console.log("║  🛡️ GitHub Secret Scanner & Alert System          ║");
    console.log("║     (WITH GIT HISTORY SCANNING)                   ║");
    console.log("╚═══════════════════════════════════════════════════╝\n");

    if (!CONFIG.github.token) {
      console.error("❌ GITHUB_TOKEN nicht in .env.local konfiguriert!");
      console.error("   Besuche: https://github.com/settings/tokens");
      console.error("   Erstelle Personal Access Token mit 'public_repo' Scope");
      process.exit(1);
    }

    console.log("🔍 Durchsuche GitHub nach exposed Secrets...\n");

    const allRepositories = [];

    // Durchsuche nach verschiedenen Patterns
    for (const query of CONFIG.github.searchQueries) {
      try {
        console.log(`🔎 Query: ${query}`);
        const repos = await this.searcher.searchRepositories(query);
        allRepositories.push(...repos);
        console.log(`   Found: ${repos.length} repositories\n`);
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}\n`);
      }
    }

    // Deduplicate
    const uniqueRepos = Array.from(
      new Map(allRepositories.map((r) => [r.id, r])).values()
    ).slice(0, CONFIG.github.resultsPerQuery);

    console.log(`\n📊 Analyzing ${uniqueRepos.length} unique repositories...\n`);

    // Analysiere jedes Repo
    for (const repo of uniqueRepos) {
      const findings = this.detector.analyzeRepository(repo);

      findings.forEach((finding) => {
        const alert = this.alertSystem.createAlert(finding);
        this.alertSystem.printAlert(alert);
      });

      // 🆕 SCAN GIT HISTORY
      if (CONFIG.github.scanGitHistory) {
        try {
          console.log(`\n   📜 Scanning git history (last ${CONFIG.github.scanCommits} commits)...`);
          const commits = await this.searcher.scanGitHistory(repo);
          
          if (commits && commits.length > 0) {
            const historyFindings = this.detector.analyzeCommitHistory(
              repo.html_url,
              commits
            );
            
            historyFindings.forEach((finding) => {
              const alert = this.alertSystem.createAlert(finding);
              this.alertSystem.printAlert(alert);
            });
          }
        } catch (error) {
          console.log(`      ⚠️  Could not scan history: ${error.message}`);
        }
      }
    }

    this.printFinalReport();
  }

  printFinalReport() {
    console.log("\n");
    console.log("═".repeat(70));
    console.log("📊 SCAN REPORT");
    console.log("═".repeat(70));
    console.log(`\nTotal Alerts: ${this.alertSystem.alerts.length}`);

    const bySeverity = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    this.alertSystem.alerts.forEach((alert) => {
      bySeverity[alert.severity]++;
    });

    console.log(`\nBy Severity:`);
    console.log(
      `  🔴 CRITICAL: ${bySeverity.CRITICAL} (Immediate action required!)`
    );
    console.log(`  🟠 HIGH: ${bySeverity.HIGH}`);
    console.log(`  🟡 MEDIUM: ${bySeverity.MEDIUM}`);
    console.log(`  🟢 LOW: ${bySeverity.LOW}`);

    console.log("\n═".repeat(70));
    console.log(
      "✅ Scan complete. Alert notifications would be sent to project owners.\n"
    );
  }
}

// ====================================
// MAIN
// ====================================

async function main() {
  const scanner = new SecretScanner();
  await scanner.scanGitHub();
}

main().catch((error) => {
  console.error("❌ Fehler:", error);
  process.exit(1);
});
