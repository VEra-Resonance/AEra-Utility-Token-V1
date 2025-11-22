#!/usr/bin/env node

/**
 * 💰 AERA Portfolio Analyzer & Consolidator
 * ==========================================
 * Analysiert mehrere Wallets auf verschiedenen Chains
 * und konsolidiert alle Assets zu einer Ledger Wallet
 */

const ethers = require("ethers");
require("dotenv").config({ path: ".env.local" });

// ====================================
// KONFIGURATION
// ====================================

const CONFIG = {
  // Test Wallets zu analysieren
  sourceWallets: [
    {
      address: process.env.TEST_WALLET_1_ADDRESS,
      name: "Test Wallet 1",
      privateKey: process.env.TEST_WALLET_1_PRIVATE_KEY,
    },
    {
      address: process.env.TEST_WALLET_2_ADDRESS,
      name: "Test Wallet 2",
      privateKey: process.env.TEST_WALLET_2_PRIVATE_KEY,
    },
  ],

  // Ziel Ledger Wallet (nur Adresse, KEIN Private Key!)
  targetWallet: process.env.LEDGER_WALLET_1,

  // Unterstützte Netzwerke
  networks: {
    sepolia: {
      rpcUrl: process.env.SEPOLIA_RPC_URL,
      chainId: 11155111,
      name: "Sepolia Testnet",
      explorer: "https://sepolia.etherscan.io",
    },
    ethereum: {
      rpcUrl: process.env.MAINNET_RPC_URL,
      chainId: 1,
      name: "Ethereum Mainnet",
      explorer: "https://etherscan.io",
    },
  },

  // Token Adressen auf Sepolia
  tokens: {
    aera: {
      address: process.env.AERA_TOKEN_ADDRESS,
      symbol: "AERA",
      decimals: 18,
    },
  },
};

// ====================================
// ERC-20 ABI (Minimal)
// ====================================

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// ====================================
// PORTFOLIO ANALYZER
// ====================================

class PortfolioAnalyzer {
  constructor() {
    this.portfolio = [];
  }

  async analyzeWallet(wallet, network) {
    console.log(`\n📊 Analysiere ${wallet.name} auf ${network.name}...`);

    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const ethBalance = await provider.getBalance(wallet.address);

    const walletData = {
      address: wallet.address,
      name: wallet.name,
      network: network.name,
      chainId: network.chainId,
      assets: [
        {
          symbol: "ETH",
          balance: ethers.formatEther(ethBalance),
          rawBalance: ethBalance.toString(),
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
        },
      ],
    };

    // Prüfe AERA Token auf Sepolia
    if (network.chainId === 11155111) {
      const contract = new ethers.Contract(
        CONFIG.tokens.aera.address,
        ERC20_ABI,
        provider
      );

      try {
        const aeraBalance = await contract.balanceOf(wallet.address);
        if (aeraBalance > 0n) {
          walletData.assets.push({
            symbol: "AERA",
            balance: ethers.formatUnits(aeraBalance, 18),
            rawBalance: aeraBalance.toString(),
            address: CONFIG.tokens.aera.address,
            decimals: 18,
          });
        }
      } catch (e) {
        console.log(`  ⚠️  Konnte AERA Balance nicht lesen`);
      }
    }

    this.portfolio.push(walletData);
    return walletData;
  }

  printPortfolioSummary() {
    console.log("\n");
    console.log("═".repeat(70));
    console.log("💰 PORTFOLIO SUMMARY");
    console.log("═".repeat(70));

    let totalEthValue = 0;
    let totalAeraValue = 0;

    this.portfolio.forEach((wallet) => {
      console.log(`\n📍 ${wallet.name} (${wallet.network})`);
      console.log(`   Address: ${wallet.address}`);

      wallet.assets.forEach((asset) => {
        const value = parseFloat(asset.balance);

        if (asset.symbol === "ETH") {
          totalEthValue += value;
          console.log(`   ${asset.symbol}: ${value.toFixed(6)} ETH`);
        } else if (asset.symbol === "AERA") {
          totalAeraValue += value;
          console.log(`   ${asset.symbol}: ${value.toFixed(2)} AERA`);
        }
      });
    });

    console.log("\n" + "─".repeat(70));
    console.log("📊 GESAMT-VERMÖGEN:");
    console.log(`   Total ETH:  ${totalEthValue.toFixed(6)} ETH`);
    console.log(`   Total AERA: ${totalAeraValue.toFixed(2)} AERA`);
    console.log("─".repeat(70));
  }

  getConsolidationPlan() {
    console.log("\n");
    console.log("═".repeat(70));
    console.log("🚀 KONSOLIDIERUNGS-PLAN");
    console.log("═".repeat(70));

    const transfers = [];

    this.portfolio.forEach((wallet) => {
      wallet.assets.forEach((asset) => {
        const balance = parseFloat(asset.balance);
        if (balance > 0) {
          transfers.push({
            from: wallet.address,
            fromName: wallet.name,
            to: CONFIG.targetWallet,
            asset: asset.symbol,
            amount: balance,
            rawAmount: asset.rawBalance,
            tokenAddress: asset.address,
            chainId: wallet.chainId,
          });
        }
      });
    });

    console.log(`\n📋 ${transfers.length} Transaktionen geplant:\n`);

    transfers.forEach((tx, idx) => {
      console.log(`${idx + 1}. ${tx.fromName}`);
      console.log(`   Send: ${tx.amount.toFixed(tx.asset === "AERA" ? 2 : 6)} ${tx.asset}`);
      console.log(`   To: ${tx.to.slice(0, 10)}...${tx.to.slice(-8)}`);
      console.log(`   Chain: ${tx.chainId === 11155111 ? "Sepolia" : "Mainnet"}`);
      console.log("");
    });

    console.log("═".repeat(70));
    console.log(
      `⚠️  Warnung: Nur mit ${CONFIG.targetWallet} durchführen!`
    );
    console.log("═".repeat(70));

    return transfers;
  }
}

// ====================================
// CONSOLIDATOR
// ====================================

class PortfolioConsolidator {
  constructor(transfers) {
    this.transfers = transfers;
    this.executedTransfers = [];
  }

  async executeConsolidation(sourceWallets) {
    console.log("\n");
    console.log("═".repeat(70));
    console.log("💸 STARTE KONSOLIDIERUNG...");
    console.log("═".repeat(70) + "\n");

    for (let i = 0; i < this.transfers.length; i++) {
      const transfer = this.transfers[i];
      const sourceWallet = sourceWallets.find(
        (w) => w.address.toLowerCase() === transfer.from.toLowerCase()
      );

      if (!sourceWallet) {
        console.log(
          `❌ Fehler: Wallet nicht gefunden für ${transfer.from}`
        );
        continue;
      }

      console.log(`\n📍 Transfer ${i + 1}/${this.transfers.length}`);
      console.log(`   From: ${transfer.fromName}`);
      console.log(`   Asset: ${transfer.asset}`);
      console.log(`   Amount: ${transfer.amount}`);

      try {
        if (transfer.asset === "ETH") {
          await this.transferETH(sourceWallet, transfer);
        } else if (transfer.asset === "AERA") {
          await this.transferToken(sourceWallet, transfer);
        }

        this.executedTransfers.push({
          ...transfer,
          status: "success",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.log(`   ❌ Fehler: ${error.message}`);
        this.executedTransfers.push({
          ...transfer,
          status: "failed",
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.printConsolidationReport();
  }

  async transferETH(sourceWallet, transfer) {
    const provider = new ethers.JsonRpcProvider(
      CONFIG.networks.sepolia.rpcUrl
    );
    const wallet = new ethers.Wallet(sourceWallet.privateKey, provider);

    const balance = await provider.getBalance(wallet.address);
    
    // Schätze Gas-Kosten (einfache ETH Transfer: ca. 21000 gas)
    const gasPrice = await provider.getFeeData();
    const estimatedGasCost = ethers.parseEther("0.0001"); // Konservative Schätzung
    
    // Behalte Extra-Reserve für Safety (0.0001 ETH)
    const safetyReserve = ethers.parseEther("0.0001");
    const totalReserve = estimatedGasCost + safetyReserve;
    
    const amountToSend = balance - totalReserve;

    if (amountToSend <= 0) {
      throw new Error(`Nicht genug ETH nach Gebührenreserve (Balance: ${ethers.formatEther(balance)}, Reserve: ${ethers.formatEther(totalReserve)})`);
    }

    console.log(`   ⏳ Sende ${ethers.formatEther(amountToSend)} ETH...`);
    console.log(`   💰 Balance: ${ethers.formatEther(balance)} | Reserve: ${ethers.formatEther(totalReserve)}`);

    try {
      const tx = await wallet.sendTransaction({
        to: transfer.to,
        value: amountToSend,
      });

      console.log(`   ✅ TX Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Bestätigt! Gas: ${receipt.gasUsed.toString()}`);
    } catch (error) {
      console.error(`   ❌ TX Fehler: ${error.message}`);
      throw error;
    }
  }

  async transferToken(sourceWallet, transfer) {
    const provider = new ethers.JsonRpcProvider(
      CONFIG.networks.sepolia.rpcUrl
    );
    const wallet = new ethers.Wallet(sourceWallet.privateKey, provider);
    const contract = new ethers.Contract(
      transfer.tokenAddress,
      ERC20_ABI,
      wallet
    );

    console.log(
      `   ⏳ Sende ${transfer.amount} ${transfer.asset}...`
    );

    const tx = await contract.transfer(
      transfer.to,
      ethers.parseUnits(transfer.amount.toString(), 18)
    );

    console.log(`   ✅ TX Hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`   ✅ Bestätigt! Gas: ${receipt.gasUsed.toString()}`);
  }

  printConsolidationReport() {
    const successful = this.executedTransfers.filter(
      (t) => t.status === "success"
    ).length;
    const failed = this.executedTransfers.filter(
      (t) => t.status === "failed"
    ).length;

    console.log("\n");
    console.log("═".repeat(70));
    console.log("📊 KONSOLIDIERUNGS-REPORT");
    console.log("═".repeat(70));
    console.log(`✅ Erfolgreich: ${successful}`);
    console.log(`❌ Fehler: ${failed}`);
    console.log(`Total: ${this.executedTransfers.length}`);
    console.log("═".repeat(70));
  }
}

// ====================================
// MAIN
// ====================================

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  💰 Portfolio Analyzer & Consolidator             ║");
  console.log("╚═══════════════════════════════════════════════════╝\n");

  // Validiere Config
  if (!CONFIG.targetWallet) {
    console.error("❌ LEDGER_WALLET_1 nicht konfiguriert in .env.local");
    process.exit(1);
  }

  if (CONFIG.sourceWallets.some((w) => !w.privateKey)) {
    console.error("❌ Test-Wallet Private Keys nicht konfiguriert");
    process.exit(1);
  }

  // 1. Analysiere Wallets
  const analyzer = new PortfolioAnalyzer();

  for (const wallet of CONFIG.sourceWallets) {
    for (const [networkName, networkConfig] of Object.entries(
      CONFIG.networks
    )) {
      await analyzer.analyzeWallet(wallet, networkConfig);
    }
  }

  // 2. Zeige Portfolio Summary
  analyzer.printPortfolioSummary();

  // 3. Erstelle Konsolidierungs-Plan
  const transfers = analyzer.getConsolidationPlan();

  // 4. Führe Konsolidierung aus
  if (transfers.length > 0) {
    const consolidator = new PortfolioConsolidator(transfers);

    console.log("\n⚠️  WICHTIG:");
    console.log("   - Alle Transfers gehen zu: " + CONFIG.targetWallet);
    console.log("   - Sicherstelle: Das ist DEINE Ledger Wallet!");
    console.log("   - Private Keys werden NICHT hochgeladen!");

    // TODO: User Confirmation hinzufügen?
    // Für jetzt: Auto-Execute

    await consolidator.executeConsolidation(CONFIG.sourceWallets);
  } else {
    console.log("\n✅ Alle Wallets sind leer - Keine Transfers nötig!");
  }
}

// Error Handling
main().catch((error) => {
  console.error("❌ Fehler:", error);
  process.exit(1);
});
