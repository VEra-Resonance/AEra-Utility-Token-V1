const { Web3 } = require('web3');

const web3 = new Web3('https://eth-sepolia.g.alchemy.com/v2/VtWDPzShyIiLXlQCmk1BK-aJvfDt77Fj');

(async () => {
    try {
        // TX aus der DB
        const txHash = '0x7ac12f0b92e6cb999eccba6603ba4740b4c6554fd85e17a837c18c5f97bb5129';
        const wallet = '0xfba43a53754886010e23549364fdb54a2c06cbfa';
        
        console.log('📋 WALLET HISTORY CHECK');
        console.log('========================\n');
        
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        if (receipt) {
            console.log('✅ AIRDROP TRANSACTION FOUND:');
            console.log(`   TX Hash: ${txHash}`);
            console.log(`   Status: ${receipt.status ? 'SUCCESS ✅' : 'FAILED ❌'}`);
            console.log(`   From: ${receipt.from}`);
            console.log(`   To: ${receipt.to}`);
            console.log(`   Gas Used: ${receipt.gasUsed}`);
            console.log(`   Block: ${receipt.blockNumber}`);
            console.log(`   Logs: ${receipt.logs.length}\n`);
        } else {
            console.log('⚠️  TX nicht bestätigt\n');
        }
        
        // Wallet-Balance prüfen
        console.log(`📊 WALLET BALANCE CHECK:`);
        console.log(`   Wallet: ${wallet}`);
        const balance = await web3.eth.getBalance(wallet);
        console.log(`   ETH Balance: ${web3.utils.fromWei(balance, 'ether')} ETH\n`);
        
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
    process.exit(0);
})();
