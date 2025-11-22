#!/usr/bin/env node

/**
 * 💸 SIMPLE ETH TRANSFER
 * Transfer 0.0001 ETH from Test Wallet 1 to Test Wallet 2
 */

const ethers = require("ethers");
require("dotenv").config({ path: ".env.local" });

async function transfer() {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║  💸 ETH TRANSFER - Test Wallet 1 → Test Wallet 2  ║");
  console.log("╚════════════════════════════════════════════════════╝\n");

  // ====================================
  // CONFIG
  // ====================================

  const RPC_URL = process.env.SEPOLIA_RPC_URL;
  const PRIVATE_KEY_1 = process.env.TEST_WALLET_1_PRIVATE_KEY;
  const ADDRESS_2 = process.env.TEST_WALLET_2_ADDRESS;

  const TRANSFER_AMOUNT = "0.0001"; // ETH

  // ====================================
  // VALIDATION
  // ====================================

  if (!RPC_URL || !PRIVATE_KEY_1 || !ADDRESS_2) {
    console.error("❌ Fehle .env.local Variablen!");
    process.exit(1);
  }

  console.log(`📍 Test Wallet 1: ${PRIVATE_KEY_1.substring(0, 20)}...`);
  console.log(`📍 Test Wallet 2: ${ADDRESS_2}`);
  console.log(`💰 Transfer: ${TRANSFER_AMOUNT} ETH\n`);

  try {
    // ====================================
    // CONNECT
    // ====================================

    console.log("🔌 Verbinde zu Sepolia...");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY_1, provider);
    const wallet1Address = signer.address;

    console.log(`✅ Verbunden!`);
    console.log(`   From: ${wallet1Address}`);
    console.log(`   To:   ${ADDRESS_2}\n`);

    // ====================================
    // CHECK BALANCE
    // ====================================

    console.log("💰 Prüfe Balance...");
    const balance = await provider.getBalance(wallet1Address);
    const balanceETH = ethers.formatEther(balance);

    console.log(`✅ Balance: ${balanceETH} ETH\n`);

    if (balance === 0n) {
      console.error("❌ Keine ETH in Wallet 1!");
      process.exit(1);
    }

    // ====================================
    // CREATE TRANSACTION
    // ====================================

    console.log("📝 Erstelle Transaktion...");

    const tx = {
      to: ADDRESS_2,
      value: ethers.parseEther(TRANSFER_AMOUNT),
    };

    console.log(`   To: ${tx.to}`);
    console.log(`   Amount: ${TRANSFER_AMOUNT} ETH`);
    console.log(`   Value (Wei): ${tx.value.toString()}\n`);

    // ====================================
    // ESTIMATE GAS
    // ====================================

    console.log("⛽ Berechne Gas...");
    const gasEstimate = await provider.estimateGas(tx);
    const gasPrice = await provider.getGasPrice();

    console.log(`   Gas Estimate: ${gasEstimate.toString()}`);
    console.log(`   Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(`   Total Gas Cost: ${ethers.formatEther(gasEstimate * gasPrice)} ETH\n`);

    // ====================================
    // SEND TRANSACTION
    // ====================================

    console.log("📤 Sende Transaktion...");
    const response = await signer.sendTransaction(tx);

    console.log(`✅ Transaktion versendet!`);
    console.log(`   TX Hash: ${response.hash}`);
    console.log(`   Warte auf Bestätigung...\n`);

    // ====================================
    // WAIT FOR CONFIRMATION
    // ====================================

    const receipt = await response.wait(1);

    console.log(`✅ TRANSAKTION BESTÄTIGT!\n`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
    console.log(`   Link: https://sepolia.etherscan.io/tx/${receipt.hash}\n`);

    // ====================================
    // VERIFY
    // ====================================

    console.log("🔍 Verifiziere...");

    const balance1New = await provider.getBalance(wallet1Address);
    const balance2New = await provider.getBalance(ADDRESS_2);

    console.log(`   Wallet 1 (neu): ${ethers.formatEther(balance1New)} ETH`);
    console.log(`   Wallet 2 (neu): ${ethers.formatEther(balance2New)} ETH\n`);

    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║  ✅ TRANSFER ERFOLGREICH!                          ║");
    console.log("╚════════════════════════════════════════════════════╝\n");
  } catch (error) {
    console.error("\n❌ FEHLER:");
    console.error(error.message);
    process.exit(1);
  }
}

transfer();
