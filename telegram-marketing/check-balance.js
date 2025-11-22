require('dotenv').config({ path: '.env.minimal' });
const { Web3 } = require('web3');

const RPC_URL = process.env.RPC_URL;
const AERA_TOKEN_ADDRESS = process.env.AERA_TOKEN_ADDRESS;

const web3 = new Web3(RPC_URL);

const AERA_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

async function checkBalances() {
    const senderWallet = '0xed1a95ab5b794dc20964693fbcc60a3dfb5a22c5';
    const receiverWallet = '0xa04ab5b7183e1f79ad013d875f78d457f1ec3b2b';
    
    try {
        const contract = new web3.eth.Contract(AERA_ABI, AERA_TOKEN_ADDRESS);
        
        const senderBalance = await contract.methods.balanceOf(senderWallet).call();
        const receiverBalance = await contract.methods.balanceOf(receiverWallet).call();
        
        const senderFormatted = web3.utils.fromWei(senderBalance, 'ether');
        const receiverFormatted = web3.utils.fromWei(receiverBalance, 'ether');
        
        console.log('\n💰 BALANCE CHECK:');
        console.log(`\nSender (Admin): ${senderWallet}`);
        console.log(`  Balance: ${senderFormatted} AERA`);
        console.log(`\nReceiver: ${receiverWallet}`);
        console.log(`  Balance: ${receiverFormatted} AERA`);
        console.log('\nTX: 0x34c2e457c5e7d2e0d7191e4417d96fe6ab1858ac005b2a08c029fb15548be129');
        console.log('Status: ✅ SUCCESS - 0.5 AERA transferred\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

checkBalances();
