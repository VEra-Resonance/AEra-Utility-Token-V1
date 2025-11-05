const TelegramBot = require('node-telegram-bot-api');
const { Web3 } = require('web3');
require('dotenv').config();

console.log('🚀 Starting AERA Token Telegram Bot (MINIMAL VERSION)...\n');

// Environment Variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const AERA_TOKEN_ADDRESS = process.env.AERA_TOKEN_ADDRESS;
const RPC_URL = process.env.RPC_URL;

if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token_here') {
    console.log('❌ Bot Token missing! Please configure .env');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Web3 Setup
let web3;
let contractAvailable = false;

try {
    web3 = new Web3(RPC_URL);
    console.log('✅ Web3 connection initialized');
    
    web3.eth.getBlockNumber()
        .then(blockNumber => {
            console.log(`✅ Blockchain connected - Block: ${blockNumber}`);
            contractAvailable = true;
        })
        .catch(() => {
            console.log('⚠️  Blockchain in fallback mode');
            contractAvailable = false;
        });
} catch (error) {
    console.log('⚠️  Web3 setup in fallback mode');
    contractAvailable = false;
}

// AERA Token ABI
const AERA_ABI = [
    {
        "inputs": [],
        "name": "name",
        "outputs": [{"type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MAX_SUPPLY",
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// ===================================
// BOT HANDLERS
// ===================================

// START Command with Image
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'there';

    // Image URL (from URL or local path)
    const imageUrl = 'https://raw.githubusercontent.com/koal0308/AEra/master/assets/images/aera-logo.png';

    const startMessage = `🌀 *Welcome to AEra Token* 🌀

*The Resonant Standard for Transparent Technology*

Welcome, ${userName}! 

AEra is an open-source ERC-20 token project exploring blockchain as a tool for clarity, integrity, and collaboration.

📊 *Quick Links:*
• 🔗 *Contract:* https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
• 📖 *White Paper:* https://github.com/koal0308/AEra/blob/master/WHITEPAPER.md
• ✅ *Verification:* https://sourcify.dev/#/verify/0x5032206396A6001eEaD2e0178C763350C794F69e?network=11155111
• 🔐 *Security:* https://github.com/koal0308/AEra/blob/master/SLITHER-REPORT.md

📋 *Available Commands:*
/help - Show all commands
/info - Contract information
/supply - Current token supply
/verify - Verification details
/roadmap - Project roadmap
/contact - Get help

*"In a world obsessed with price, we built something that measures alignment."*

Stay curious. Stay resonant. 🌀`;

    bot.sendPhoto(chatId, imageUrl, {
        caption: startMessage,
        parse_mode: 'Markdown'
    }).catch((err) => {
        // Fallback if image fails
        bot.sendMessage(chatId, startMessage, { parse_mode: 'Markdown' });
    });
});

// HELP Command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `🤖 *AEra Bot - Available Commands*

/start - Welcome message with information
/info - Smart contract details
/supply - Current & max token supply
/verify - Contract verification status
/roadmap - Project roadmap & timeline
/security - Security analysis & audit info
/contact - Contact & support information

*Need more info?*
Visit our GitHub: https://github.com/koal0308/AEra`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// INFO Command
bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id;
    
    const infoMessage = `📊 *AEra Token - Contract Information*

*Network:* Ethereum Sepolia Testnet
*Contract:* \`0x5032206396A6001eEaD2e0178C763350C794F69e\`
*Symbol:* AERA
*Decimals:* 18
*Owner:* Gnosis Safe 2-of-3 Multi-Sig
*Status:* ✅ Verified on Etherscan & Sourcify

*Standards:*
✅ ERC-20 (Full compliance)
✅ ERC-2612 (Permit mechanism)
✅ Burnable (Supply adjustment)
✅ Pausable (Emergency control)

*Links:*
🔗 Etherscan: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
🔗 Sourcify: https://sourcify.dev/#/verify/0x5032206396A6001eEaD2e0178C763350C794F69e?network=11155111
🔗 GitHub: https://github.com/koal0308/AEra`;

    bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
});

// SUPPLY Command
bot.onText(/\/supply/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (!contractAvailable) {
        bot.sendMessage(chatId, '⚠️ Blockchain data temporarily unavailable. Please try again later.');
        return;
    }

    try {
        const contract = new web3.eth.Contract(AERA_ABI, AERA_TOKEN_ADDRESS);
        const totalSupply = await contract.methods.totalSupply().call();
        const maxSupply = await contract.methods.MAX_SUPPLY().call();
        
        const totalSupplyFormatted = (BigInt(totalSupply) / BigInt(10**18)).toString();
        const maxSupplyFormatted = (BigInt(maxSupply) / BigInt(10**18)).toString();

        const supplyMessage = `📈 *AEra Token Supply*

*Current Supply:* ${totalSupplyFormatted} AERA
*Max Supply:* ${maxSupplyFormatted} AERA
*Supply %:* ${((BigInt(totalSupply) / BigInt(maxSupply)) * 100n).toString()}%

*Tokenomics:*
• Initial Supply: 100,000,000 AERA
• Maximum Supply: 1,000,000,000 AERA
• Governance: 2-of-3 Multi-Sig Safe
• Burnable: Yes
• Pausable: Yes`;

        bot.sendMessage(chatId, supplyMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, '❌ Error fetching supply data. Please try again.');
    }
});

// VERIFY Command
bot.onText(/\/verify/, (msg) => {
    const chatId = msg.chat.id;
    
    const verifyMessage = `✅ *AEra Token - Verification Status*

*On-Chain Verification:*
✅ Etherscan Verified: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
✅ Sourcify Match ID 9753387: https://sourcify.dev/#/verify/0x5032206396A6001eEaD2e0178C763350C794F69e?network=11155111

*Security Analysis:*
✅ Slither Analysis (25 contracts, 100 detectors): https://github.com/koal0308/AEra/blob/master/SLITHER-REPORT.md
✅ OpenZeppelin v5.0.0 (Audited libraries)
✅ Zero Critical Issues

*Transparency:*
✅ Full source code on GitHub
✅ Multi-Sig governance active
✅ All deployments documented
✅ Public verification trail

*Safe Address:*
\`0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93\`
https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93`;

    bot.sendMessage(chatId, verifyMessage, { parse_mode: 'Markdown' });
});

// ROADMAP Command
bot.onText(/\/roadmap/, (msg) => {
    const chatId = msg.chat.id;
    
    const roadmapMessage = `🚀 *AEra Token - Roadmap*

*Phase 0 - Foundation* ✅ COMPLETE
Q4 2025
✅ Smart contract deployed & verified
✅ Multi-Sig governance active
✅ Slither security analysis (0 critical issues)
✅ Telegram bot operational

*Phase 1 - Community Test & Airdrop* 🔄 Q1 2026
🔲 Public test airdrop (Sign-in with Ethereum)
🔲 Community feedback collection
🔲 Backend API development

*Phase 2 - Security & Governance* 📅 Q2 2026
🔲 Professional security audit
🔲 Governance module integration
🔲 Snapshot DAO setup

*Phase 3 - Mainnet Preparation* 📅 Q3 2026
🔲 Mainnet infrastructure setup
🔲 Liquidity framework design
🔲 Final security testing

*Phase 4 - Mainnet Deployment* 🚀 Q4 2026 (Earliest)
🔲 Mainnet Launch
🔲 DEX/CEX listings
🔲 1:1 token swap

*Phase 5 - Ecosystem Integration* 📅 2027
🔲 VERA/PAXIS network bridge
🔲 Long-term governance evolution`;

    bot.sendMessage(chatId, roadmapMessage, { parse_mode: 'Markdown' });
});

// SECURITY Command
bot.onText(/\/security/, (msg) => {
    const chatId = msg.chat.id;
    
    const securityMessage = `🔒 *AEra Token - Security Guarantee*

*Code Security:*
✅ OpenZeppelin v5.0.0 (Industry standard)
✅ Solidity 0.8.20 (Latest security features)
✅ 100% public, auditable source code
✅ Slither static analysis (0 critical issues)

*Governance Security:*
✅ 2-of-3 Gnosis Safe Multi-Sig
✅ All transactions on-chain & public
✅ No private keys in repository
✅ Transparent ownership transfer logs

*Features:*
✅ Burnable: Reduce supply if needed
✅ Pausable: Emergency transfer control
✅ Permit (EIP-2612): Gasless approvals
✅ MAX_SUPPLY hard-coded: 1B AERA

*Audit Status:*
✅ Static Analysis: Slither ✅
🔲 Professional Audit: Trail of Bits (Q2 2026)

*Learn More:*
📖 SECURITY-GUARANTEE.md
📊 SLITHER-REPORT.md
📋 TRANSPARENCY-LOG.md

All available on GitHub:
https://github.com/koal0308/AEra`;

    bot.sendMessage(chatId, securityMessage, { parse_mode: 'Markdown' });
});

// CONTACT Command
bot.onText(/\/contact/, (msg) => {
    const chatId = msg.chat.id;
    
    const contactMessage = `📞 *AEra Token - Contact & Support*

*Community:*
💬 Telegram: https://t.me/AEra_Go_Live_bot
🐙 GitHub: https://github.com/koal0308/AEra
🔗 Safe: https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

*Contract Links:*
🔗 Etherscan: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
📋 Sourcify: https://sourcify.dev/#/verify/0x5032206396A6001eEaD2e0178C763350C794F69e?network=11155111

*Documentation:*
📖 White Paper: https://github.com/koal0308/AEra/blob/master/WHITEPAPER.md
🔐 Security: https://github.com/koal0308/AEra/blob/master/SLITHER-REPORT.md
✅ Verification: https://github.com/koal0308/AEra/blob/master/TRANSPARENCY-LOG.md

*Questions?*
Visit our documentation or check the GitHub repository for complete information.`;

    bot.sendMessage(chatId, contactMessage, { parse_mode: 'Markdown' });
});

// Error Handler
bot.on('polling_error', (error) => {
    console.log('❌ Polling error:', error.code);
});

// Startup Message
console.log('✅ AEra Token Bot is running (MINIMAL VERSION)');
console.log('✅ Listening for commands...');
console.log(`📊 Contract: ${AERA_TOKEN_ADDRESS}`);
console.log(`🤖 Bot token configured: ${BOT_TOKEN ? '✅' : '❌'}`);
console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);
