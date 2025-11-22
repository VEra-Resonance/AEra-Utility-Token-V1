require('dotenv').config({ path: '.env.minimal' });
const { Web3 } = require('web3');

const RPC_URL = process.env.RPC_URL;
const ADMIN_WALLET = process.env.ADMIN_WALLET;
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

async function checkBalance() {
    try {
        const contract = new web3.eth.Contract(AERA_ABI, AERA_TOKEN_ADDRESS);
        const balance = await contract.methods.balanceOf(ADMIN_WALLET).call();
        const formattedBalance = web3.utils.fromWei(balance, 'ether');
        console.log(`\n💰 Balance von ${ADMIN_WALLET}:`);
        console.log(`   ${formattedBalance} AERA`);
        console.log(`   (${balance} Wei)\n`);
    } catch (error) {
        console.error('❌ Fehler:', error.message);
    }
    process.exit(0);
}

checkBalance();
