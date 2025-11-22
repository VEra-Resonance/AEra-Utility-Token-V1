#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const ethers = require('ethers');

// Alle verfügbaren Wallets (OHNE Ledger)
const walletsToTry = [
  {
    name: 'Ursprüngliche Wallet (665 ETH auf Mainnet)',
    address: '0xf70da97812cb96acdf810712aa562db8dfa3dbef',
    pk: null // Wir haben keinen PK für diese
  },
  {
    name: 'Wallet mit 2.15 ETH (Sepolia)',
    address: '0x468e7c54479988b3894541c0e1d37e8812cd68ce',
    pk: null // Wir haben keinen PK für diese
  },
  {
    name: 'TEST_WALLET_1 (aktuell aus .env)',
    address: process.env.TEST_WALLET_1_ADDRESS,
    pk: process.env.TEST_WALLET_1_PRIVATE_KEY
  },
  {
    name: 'TEST_WALLET_2 (aktuell aus .env)',
    address: process.env.TEST_WALLET_2_ADDRESS,
    pk: process.env.TEST_WALLET_2_PRIVATE_KEY
  }
];

const recipient = '0xdfc9d36ed121ce630ce46a5e8f42d09835c43489';
const transferAmount = ethers.parseEther('0.00001'); // 0.00001 ETH

async function tryTransfer(wallet, index) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.MAINNET_RPC_URL);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 VERSUCH ${index + 1}: ${wallet.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📍 Von: ${wallet.address}`);
    console.log(`📍 Zu: ${recipient}`);
    console.log(`💰 Betrag: 0.00001 ETH`);
    console.log(`🌐 Netzwerk: MAINNET`);
    
    // Prüfe Balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`\n💰 Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (!wallet.pk) {
      console.log(`❌ Kein Private Key verfügbar für diese Wallet!`);
      return false;
    }
    
    // Prüfe ob Balance ausreicht
    if (balance < transferAmount + ethers.parseEther('0.001')) { // 0.001 für Gas
      console.log(`❌ Balance zu niedrig! Benötigt mindestens 0.00101 ETH (Transfer + Gas)`);
      return false;
    }
    
    // Verifiziere Private Key
    const signer = new ethers.Wallet(wallet.pk, provider);
    console.log(`\n🔐 Private Key Check:`);
    console.log(`   Gehört zu: ${signer.address}`);
    console.log(`   Erwartet: ${wallet.address}`);
    
    if (signer.address.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log(`   ❌ MISMATCH! Private Key passt nicht zu dieser Wallet!`);
      return false;
    }
    console.log(`   ✅ MATCH!`);
    
    // Erstelle Transaction
    console.log(`\n📝 Erstelle Transaction...`);
    const tx = {
      to: recipient,
      value: transferAmount,
      gasLimit: ethers.toBigInt(21000),
      gasPrice: await provider.getGasPrice()
    };
    
    console.log(`   Gas Price: ${ethers.formatUnits(tx.gasPrice, 'gwei')} Gwei`);
    
    const txResponse = await signer.sendTransaction(tx);
    console.log(`\n✅ TRANSFER ERFOLG!`);
    console.log(`📤 TX Hash: ${txResponse.hash}`);
    console.log(`🔗 Etherscan: https://etherscan.io/tx/${txResponse.hash}`);
    
    // Warte auf Bestätigung
    console.log(`\n⏳ Warte auf Bestätigung (max 60s)...`);
    const receipt = await txResponse.wait(1);
    
    if (receipt.status === 1) {
      console.log(`✅ Transaction bestätigt!`);
      console.log(`   Block: ${receipt.blockNumber}`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      return true;
    } else {
      console.log(`❌ Transaction fehlgeschlagen!`);
      return false;
    }
    
  } catch(error) {
    console.log(`❌ FEHLER: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`╔${'═'.repeat(58)}╗`);
  console.log(`║  🔴 MAINNET TRANSFER - Alle Wallets Versuchen (Mainnet)    ║`);
  console.log(`╚${'═'.repeat(58)}╝`);
  console.log(`\n⚠️  ACHTUNG: Dies sind MAINNET Transfers mit echtem Geld!`);
  
  let successCount = 0;
  
  for (let i = 0; i < walletsToTry.length; i++) {
    const success = await tryTransfer(walletsToTry[i], i);
    if (success) {
      successCount++;
      console.log(`\n✅ Wallet ${i + 1} erfolgreich! Breche ab...`);
      break;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ZUSAMMENFASSUNG:`);
  console.log(`   Erfolgreiche Transfers: ${successCount} von ${walletsToTry.length}`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(err => {
  console.error(`❌ Fatal Error: ${err.message}`);
  process.exit(1);
});
