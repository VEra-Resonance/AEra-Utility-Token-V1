require('dotenv').config({ path: '.env.minimal' });
const { Web3 } = require('web3');

const RPC_URL = process.env.RPC_URL;
const web3 = new Web3(RPC_URL);

async function checkTx() {
    const txHash = '0x34c2e457c5e7d2e0d7191e4417d96fe6ab1858ac005b2a08c029fb15548be129';
    
    try {
        const tx = await web3.eth.getTransaction(txHash);
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        
        console.log('\n📋 TRANSACTION DETAILS:');
        console.log(`TX Hash: ${txHash}`);
        console.log(`Status: ${tx ? '✅ FOUND' : '❌ NOT FOUND'}`);
        
        if (tx) {
            console.log(`From: ${tx.from}`);
            console.log(`To: ${tx.to}`);
            console.log(`Value: ${tx.value}`);
            console.log(`Gas: ${tx.gas}`);
            console.log(`Gas Price: ${web3.utils.fromWei(tx.gasPrice, 'gwei')} Gwei`);
            console.log(`Block: ${tx.blockNumber}`);
        }
        
        if (receipt) {
            console.log(`\nReceipt Status: ${receipt.status === 1n ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`Gas Used: ${receipt.gasUsed}`);
            console.log(`Logs: ${receipt.logs.length}`);
        } else {
            console.log('Pending or not found in receipts');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

checkTx();
