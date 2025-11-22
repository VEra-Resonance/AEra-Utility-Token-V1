#!/usr/bin/env node

/**
 * 💸 MICRO ETH TRANSFER
 * Transfer 0.00001 ETH from Test Wallet 1 to Test Wallet 2 on Sepolia
 */

const ethers = require("ethers");
require("dotenv").config({ path: ".env.local" });

async function transfer() {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║  💸 MICRO ETH TRANSFER - Sepolia Testnet          ║");
  console.log("╚════════════════════════════════════════════════════╝\n");

  // ====================================
  // CONFIG
  // ====================================

  const RPC_URL = process.env.SEPOLIA_RPC_URL;
  const PRIVATE_KEY_1 = process.env.TEST_WALLET_1_PRIVATE_KEY;
  const ADDRESS_2 = process.env.TEST_WALLET_2_ADDRESS;

  const TRANSFER_AMOUNT = "0.00001"; // ETH (micro!)

  // ====================================
  // VALIDATION
  // ====================================

  if (!RPC_URL || !PRIVATE_KEY_1 || !ADDRESS_2) {
    console.error("❌ Fehle .env.local Variablen!");
    process.exit(1);
  }

  console.log(`📍 Test Wallet 1 (Private Key): ${PRIVATE_KEY_1.substring(0, 20)}...`);
  console.log(`📍 Test Wallet 2 (Empfänger):   ${ADDRESS_2}`);
  console.log(`💰 Transfer Betrag: ${TRANSFER_AMOUNT} ETH (Micro!)\n`);

  try {
    // ====================================
    // CONNECT
    // ====================================

    console.log("🔌 Verbinde zu Sepolia Testnet...");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY_1, provider);
    const wallet1Address = signer.address;

    console.log(`✅ Verbunden!`);
    console.log(`   From: ${wallet1Address}`);
    console.log(`   To:   ${ADDRESS_2}\n`);

    // ====================================
    // CHECK BALANCE
    // ====================================

    console.log("💰 Prüfe Balance von Wallet 1...");
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

    console.log("⛽ Berechne Gas-Gebühren...");
    const gasEstimate = await provider.estimateGas(tx);
    const gasPrice = await provider.getGasPrice();
    const gasCost = gasEstimate * gasPrice;

    console.log(`   Gas Estimate: ${gasEstimate.toString()}`);
    console.log(`   Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(`   Total Gas Cost: ${ethers.formatEther(gasCost)} ETH\n`);

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
    console.log(`   TX Hash: ${receipt.hash}`);
    console.log(`   Link: https://sepolia.etherscan.io/tx/${receipt.hash}\n`);

    // ====================================
    // VERIFY
    // ====================================

    console.log("🔍 Verifiziere neue Balances...");

    const balance1New = await provider.getBalance(wallet1Address);
    const balance2New = await provider.getBalance(ADDRESS_2);

    console.log(`   Wallet 1 (neu): ${ethers.formatEther(balance1New)} ETH`);
    console.log(`   Wallet 2 (neu): ${ethers.formatEther(balance2New)} ETH\n`);

    console.log("╔════════════════════════════════════════════════════╗");
    console.log("║  ✅ TRANSFER ERFOLGREICH!                          ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    console.log(`📊 ZUSAMMENFASSUNG:`);
    console.log(`   Von:    ${wallet1Address}`);
    console.log(`   An:     ${ADDRESS_2}`);
    console.log(`   Betrag: ${TRANSFER_AMOUNT} ETH`);
    console.log(`   Link:   https://sepolia.etherscan.io/tx/${receipt.hash}\n`);

  } catch (error) {
    console.error("\n❌ FEHLER:");
    console.error(error.message);
    process.exit(1);
  }
}

transfer();
