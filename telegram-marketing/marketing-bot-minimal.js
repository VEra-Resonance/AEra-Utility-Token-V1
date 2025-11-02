const TelegramBot = require('node-telegram-bot-api');
const { Web3 } = require('web3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.minimal') });

console.log('🚀 Starting AERA Token Bot - MINIMAL VERSION (White Paper Conform)...\n');

// Environment Variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
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

// AERA Token ABI (simplified)
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

// Statistics
const botStats = {
    startTime: new Date(),
    botCommands: 0
};

// ===================================
// BOT EVENT HANDLERS
// ===================================

// /start Command
bot.onText(/\/start(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Friend';
    
    botStats.botCommands++;
    
    console.log(`🚀 /start from ${firstName}`);
    
    const welcomeMessage = `🎉 *Welcome to AEra Token, ${firstName}!* 🎉

*"The Resonant Standard"*

✅ *Contract Verified & Live on Sepolia Testnet*
🔍 View: https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}#code

🎯 *Mission:*
AEra is a decentralized experiment in *resonance* – alignment between human intent and transparent digital systems.

✨ *Core Principles:*
• *Transparency* – Code first, all verifiable
• *Resonance* – Value from clarity, not hype
• *Accountability* – Every function auditable
• *Autonomy* – No backdoors, fully open
• *Community Safety* – Multi-sig ownership

📊 *Learn More:*
/info - Technical overview
/whitepaper - Full White Paper
/roadmap - Development phases
/help - All commands

*Network:* Sepolia Testnet
*Symbol:* AERA
*License:* MIT Open Source`;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// /status Command
bot.onText(/\/status(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('📊 /status requested');
    
    const statusMessage = `📊 *AEra Token Status*

*Network:* Sepolia Testnet (ChainID: 11155111)
*Contract:* ${AERA_TOKEN_ADDRESS}

*Verification Status:* ✅ VERIFIED
• Etherscan: https://sepolia.etherscan.io/verify-contract
• Sourcify: Match ID 9753387 (Exact Match)

*Ownership:* ✅ MULTI-SIG SAFE
• Safe Address: 0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93
• Type: 2-of-3 Multi-Signature
• Status: Active & Confirmed

*Contract State:* ✅ OPERATIONAL
• Transfers: Enabled
• Minting: Multi-sig controlled
• Pausing: Available for emergency

Use /info for technical details.`;

    bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
});

// /info Command
bot.onText(/\/info(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('ℹ️ /info requested');
    
    const infoMessage = `ℹ️ *AEra Technical Overview*

*Contract Specifications:*
• Name: AeraToken
• Symbol: AERA
• Decimals: 18
• Initial Supply: 100,000,000 AERA
• Maximum Supply: 1,000,000,000 AERA

*Features:*
✅ ERC-20 Standard
✅ Burnable (community can burn tokens)
✅ Pausable (emergency stop)
✅ Permit (EIP-2612 gas-less approvals)
✅ Multi-Sig Ownership

*Compiler:* Solidity 0.8.20 (Paris EVM)
*License:* MIT Open Source

*Verification:*
Sourcify Match ID: 9753387
Status: Exact Match (Runtime & Creation)

/contract - View contract link
/whitepaper - Full documentation`;

    bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
});

// /supply Command
bot.onText(/\/supply(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('📈 /supply requested');
    
    if (!contractAvailable) {
        const message = `⚠️ *Supply Information (Testnet)*

*From Contract ABI:*
• Initial Supply: 100,000,000 AERA
• Max Supply: 1,000,000,000 AERA
• Current: Deployed on Sepolia

Real-time supply requires blockchain connection.
Try /contract for explorer link.`;
        
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        return;
    }
    
    try {
        const contract = new web3.eth.Contract(AERA_ABI, AERA_TOKEN_ADDRESS);
        
        Promise.all([
            contract.methods.totalSupply().call(),
            contract.methods.MAX_SUPPLY().call()
        ]).then(([currentSupply, maxSupply]) => {
            const current = web3.utils.fromWei(currentSupply, 'ether');
            const max = web3.utils.fromWei(maxSupply, 'ether');
            const percentage = ((parseFloat(current) / parseFloat(max)) * 100).toFixed(2);
            
            const supplyMessage = `📈 *AEra Token Supply*

*Current Supply:* ${parseFloat(current).toLocaleString('de-DE')} AERA
*Maximum Supply:* ${parseFloat(max).toLocaleString('de-DE')} AERA
*Utilization:* ${percentage}%

*Status:* Testnet Phase
Additional minting only via multi-sig authorization.`;
            
            bot.sendMessage(chatId, supplyMessage, { parse_mode: 'Markdown' });
        }).catch(err => {
            bot.sendMessage(chatId, '❌ Could not fetch real-time supply. Try again later.');
        });
    } catch (error) {
        console.error('Supply Error:', error.message);
        bot.sendMessage(chatId, '❌ Error fetching supply information.');
    }
});

// /contract Command
bot.onText(/\/contract(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('📄 /contract requested');
    
    const contractMessage = `📄 *AEra Smart Contract*

*Address (Sepolia):*
\`${AERA_TOKEN_ADDRESS}\`

*View on Etherscan:*
https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}

*Features:*
✅ Verified Source Code
✅ Full ABI Available
✅ Multi-Sig Ownership
✅ OpenZeppelin Standard

*Interact:*
• Read: totalSupply, balanceOf, decimals
• Write: transfer, approve, burn (multi-sig only)`;

    bot.sendMessage(chatId, contractMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

// /verification Command
bot.onText(/\/verification(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('✅ /verification requested');
    
    const verificationMessage = `✅ *Verification Status*

*Sourcify.dev:*
📌 Status: ✅ VERIFIED
📌 Match ID: 9753387
📌 Type: Exact Match (Runtime & Creation bytecode)
📌 Timestamp: 2025-11-02T12:25:59Z

*Etherscan (Sepolia):*
📌 Status: ✅ VERIFIED
📌 Source: Synced from Sourcify
📌 Code: Publicly viewable
📌 Compiler: Solidity 0.8.20

*Security:*
All code is open-source and auditable.
Multi-sig controls prevent unauthorized changes.

View Full Code:
https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}#code`;

    bot.sendMessage(chatId, verificationMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

// /roadmap Command
bot.onText(/\/roadmap(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('🗺️ /roadmap requested');
    
    const roadmapMessage = `🗺️ *AEra Development Roadmap*

*Phase 0 (2025 Q4):* ✅ COMPLETE
✅ Smart contract deployed to Sepolia
✅ Contract verified on Etherscan & Sourcify
✅ Ownership transferred to Multi-Sig Safe

*Phase 1 (2026 Q1):* 🔄 IN PROGRESS
🔲 Public test airdrop (EIP-4361 Sign-in)
🔲 Community feedback collection
🔲 Bot integration (governance testing)

*Phase 2 (2026 Q2):*
🔲 Security audit & final review
🔲 Governance module integration
🔲 Snapshot DAO testing

*Phase 3 (2026 Q3):*
🔲 Mainnet preparation & security finalization
🔲 Liquidity framework
🔲 Final audits & testing

*Phase 4 (2026 Q4 - Earliest):* 🚀
🔲 **Mainnet Deployment**
🔲 Liquidity lock (community vote)
🔲 Public availability

*Phase 5 (2026 Q4 → 2027):*
🔲 VERA / PAXIS ecosystem integration
🔲 AI-resonance metrics API
🔲 Long-term governance evolution`;

    bot.sendMessage(chatId, roadmapMessage, { parse_mode: 'Markdown' });
});

// /community Command
bot.onText(/\/community(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('👥 /community requested');
    
    const communityMessage = `👥 *AEra Community & Resources*

*Official Links:*
📌 GitHub: https://github.com/koal0308/AEra
📌 Telegram: @AEra_Official_Bot
📌 Contract: https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}

*Documentation:*
📚 White Paper: /whitepaper
📚 Architecture: Check /docs folder on GitHub
📚 Roadmap: /roadmap

*Network:*
🌐 Sepolia Testnet (Phase 1)
🌐 Ethereum Mainnet (Phase 3 – post audit)

*Core Principles:*
🎯 Transparency – Code first
🎯 Resonance – Alignment & clarity
🎯 Accountability – Every function auditable
🎯 Autonomy – No backdoors
🎯 Safety – Multi-sig governance

Join us in building transparent infrastructure!`;

    bot.sendMessage(chatId, communityMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

// /marketing Command
bot.onText(/\/marketing(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('📢 /marketing requested');
    
    const marketingMessage = `📢 *AEra Marketing & Positioning*

*Vision Statement:*
"AEra is not a promise of value – it is an invitation to verify value yourself."

*Key Message:*
In a world flooded with hype, AEra builds clarity through:
✅ Open-source code
✅ Transparent governance
✅ Multi-sig safety
✅ Community-driven development
✅ Ethical accountability

*Target Audience:*
🎯 Developers building open infrastructure
🎯 Researchers in AI ethics & transparency
🎯 Community members valuing accountability
🎯 Contributors to decentralized systems

*Positioning:*
"The Resonant Standard" – where trust is earned through verification, not promises.

*Call to Action:*
• Review the code: GitHub
• Understand the mission: /whitepaper
• Join the community: GitHub Discussions
• Participate in testing: /disclaimer for details`;

    bot.sendMessage(chatId, marketingMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

// /disclaimer Command
bot.onText(/\/disclaimer(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('⚖️ /disclaimer requested');
    
    const disclaimerMessage = `⚖️ *LEGAL NOTICE & DISCLAIMER*

*Important:* Read carefully before participating.

*What AEra IS:*
✅ Open-source software project
✅ Decentralized token contract
✅ Community-driven experiment
✅ Technical research tool

*What AEra IS NOT:*
❌ Financial product or investment
❌ Security offering
❌ Regulated financial instrument
❌ Promise of future value

*Test Token Disclaimer:*
🔔 AERA tokens on Sepolia testnet have NO monetary value
🔔 These are test allocations only
🔔 Used exclusively for technical & social integrity verification
🔔 Not redeemable for any assets or services

*Legal Status:*
• No ICO, IDO, or sale conducted
• Not a security under US law (SCRA Guidance)
• All contributors assume legal compliance responsibility
• Open-source MIT license applies

*User Responsibility:*
• Verify all code yourself
• No guarantees of profitability or stability
• Full responsibility for wallet security
• Compliance with local jurisdiction laws

By interacting with AEra, you acknowledge these terms.`;

    bot.sendMessage(chatId, disclaimerMessage, { parse_mode: 'Markdown' });
});

// /consent Command
bot.onText(/\/consent(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('✋ /consent requested');
    
    const consentMessage = `✋ *Consent & Acknowledgment*

Do you understand and accept the following?

*I understand that:*
✅ AERA is a test token on Sepolia testnet
✅ It has NO monetary or financial value
✅ It is used for technical verification only
✅ The code is open-source and MIT licensed
✅ Multi-sig governance controls all actions

*I acknowledge:*
✅ I have read the /disclaimer
✅ I will comply with local laws
✅ I assume responsibility for my security
✅ I will report security issues responsibly

*By clicking below, you confirm your understanding.*`;

    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ I Understand & Accept', callback_data: 'consent_accept' },
                    { text: '❌ I Decline', callback_data: 'consent_decline' }
                ]
            ]
        }
    };
    
    bot.sendMessage(chatId, consentMessage, options);
});

// Callback for consent buttons
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    
    if (data === 'consent_accept') {
        console.log(`✅ Consent accepted from ${query.from.id}`);
        bot.answerCallbackQuery(query.id, 'Thank you! You can now participate in AEra ecosystem.', false);
        bot.sendMessage(chatId, '✅ Your consent has been recorded. Welcome to the AEra community!', { parse_mode: 'Markdown' });
    } else if (data === 'consent_decline') {
        console.log(`❌ Consent declined from ${query.from.id}`);
        bot.answerCallbackQuery(query.id, 'You have declined participation.', false);
        bot.sendMessage(chatId, 'You can review /whitepaper or /info anytime if you change your mind.', { parse_mode: 'Markdown' });
    }
});

// /docs Command - ALL DOCUMENTATION LINKS
bot.onText(/\/docs(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('📚 /docs requested');
    
    const docsMessage = `📚 *AEra Complete Documentation*

*🔗 Central Hub:*
https://github.com/koal0308/AEra/blob/master/DOCUMENTATION-INDEX.md

*📄 Main Documents:*
• White Paper: https://github.com/koal0308/AEra/blob/master/WHITEPAPER.md
• Security Guarantee: https://github.com/koal0308/AEra/blob/master/SECURITY-GUARANTEE.md
• Transparency Log: https://github.com/koal0308/AEra/blob/master/TRANSPARENCY-LOG.md
• Deployment Checklist: https://github.com/koal0308/AEra/blob/master/DEPLOYMENT-CHECKLIST.md

*🏗️ Architecture (Airdrop):*
• Architecture Design: https://github.com/koal0308/AEra/blob/master/docs/AIRDROP-ARCHITECTURE.md
• Roadmap (6 phases): https://github.com/koal0308/AEra/blob/master/docs/AIRDROP-ROADMAP.md
• Quick Reference: https://github.com/koal0308/AEra/blob/master/docs/AIRDROP-QUICK-REFERENCE.md

*🤖 Bot Documentation:*
• Minimal Bot Setup: https://github.com/koal0308/AEra/blob/master/BOT-MINIMAL-SETUP.md
• Bot Compliance: https://github.com/koal0308/AEra/blob/master/BOT-COMPLIANCE-GUIDE.md
• Bot Principles: https://github.com/koal0308/AEra/blob/master/BOT-PRINCIPLES.md

*🌐 GitHub Repository:*
https://github.com/koal0308/AEra

*📊 Statistics:*
• 15+ Documentation Files
• 4000+ Lines of Documentation
• 2000+ Lines of Bot Code
• 500+ Lines of Smart Contract
• All Publicly Available`;

    bot.sendMessage(chatId, docsMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

// /verify Command - VERIFICATION LINKS
bot.onText(/\/verify(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('✅ /verify requested');
    
    const verifyMessage = `✅ *Verification & On-Chain Links*

*🔍 Smart Contract (Etherscan):*
https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}

*📋 Smart Contract Code:*
https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}#code

*👑 Ownership Transfer Transaction:*
TX Hash: 0xa0a1a525bc96a3b4c813fa363f7b7d20694ef6e28a1958e1d1c0264cf59c6c30
Block: 9545535
Link: https://sepolia.etherscan.io/tx/0xa0a1a525bc96a3b4c813fa363f7b7d20694ef6e28a1958e1d1c0264cf59c6c30

*🏛️ Multi-Sig Safe (2-of-3 Governance):*
Address: 0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93
Link: https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

*✅ Sourcify Verification (Exact Match):*
Match ID: 9753387
Status: ✅ VERIFIED
Link: https://sourcify.dev/#/verify/${AERA_TOKEN_ADDRESS}?network=11155111

*📊 Complete Verification Log:*
https://github.com/koal0308/AEra/blob/master/TRANSPARENCY-LOG.md

*🎯 Deployment Checklist (All 18 Tasks ✅):*
https://github.com/koal0308/AEra/blob/master/DEPLOYMENT-CHECKLIST.md`;

    bot.sendMessage(chatId, verifyMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

// /whitepaper Command
bot.onText(/\/whitepaper(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('📄 /whitepaper requested');
    
    const whitepaperMessage = `📄 *AEra White Paper v1.0*

*"The Resonant Standard"*

🎯 *Vision:*
AEra is built around resonance – alignment between human intent and transparent digital systems.

📋 *Core Principles:*
• Transparency – Code first, all verifiable
• Resonance – Value from clarity, not hype
• Accountability – Every function auditable
• Autonomy – No backdoors, fully open
• Community Safety – Multi-sig + audit logs

🏗️ *Architecture:*
• Network: Sepolia → Mainnet
• Type: ERC-20 + Burnable + Pausable + Permit
• Supply: 100M initial, 1B max
• Ownership: 2-of-3 Multi-Sig Safe

📊 *Airdrop Policy:*
• Zero-KYC (signature-based only)
• ≤50 AERA per wallet
• Testnet-first approach
• Community-driven validation

🎯 *Use Cases:*
• Verification layer for VERA/PAXIS ecosystem
• Reputation marker for contribution
• Resonance metrics for alignment tracking
• Access token for research & audits

⚖️ *Legal:*
AERA is NOT a financial instrument, security, or investment contract. All testnet tokens are test allocations only.

📚 *Full White Paper:*
https://github.com/koal0308/AEra/blob/master/WHITEPAPER.md

🔐 *Security:*
Multi-sig controls, pausable transfers, emergency mechanisms, open audit logs.`;

    bot.sendMessage(chatId, whitepaperMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

// /help Command
bot.onText(/\/help(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    botStats.botCommands++;
    
    console.log('❓ /help requested');
    
    const helpMessage = `❓ *AEra Bot - All Commands*

🎯 *Quick Start:*
/start - Welcome message
/status - Current system status
/info - Technical specifications
/supply - Token supply info
/contract - Smart contract details
/verification - Verification status

📚 *Information:*
/roadmap - Development roadmap
/community - Community links
/marketing - Project positioning
/whitepaper - Full white paper

⚖️ *Legal & Compliance:*
/disclaimer - Legal notice
/consent - Confirm understanding

📚 *Full Documentation:*
/docs - All documentation links

🔐 *Verify Everything:*
/verify - Verification links

/help - This message

*GitHub Repository:*
https://github.com/koal0308/AEra`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

// Bot started message
bot.getMe().then(me => {
    console.log(`✅ Bot connected: @${me.username}`);
    console.log(`✅ Bot ID: ${me.id}`);
}).catch(err => {
    console.log(`❌ Bot connection error: ${err.message}`);
});

console.log('🚀 AERA Token Bot - MINIMAL VERSION - READY!');
console.log('Commands: /start, /status, /info, /supply, /contract, /verification, /roadmap, /community, /marketing, /disclaimer, /consent, /whitepaper, /docs, /verify, /help\n');

// Error Handling
bot.on('polling_error', (error) => {
    console.log('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
    console.log('❌ Bot error:', error.message);
});

process.on('SIGINT', () => {
    console.log('\n📝 Bot shutting down...');
    process.exit(0);
});

module.exports = bot;
