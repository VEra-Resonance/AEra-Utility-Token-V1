const TelegramBot = require('node-telegram-bot-api');
const { Web3 } = require('web3');
const QRCode = require('qrcode');
const path = require('path');

// Add crypto polyfill for WalletConnect
if (!global.crypto) {
    global.crypto = require('crypto').webcrypto;
}

require('dotenv').config({ path: '.env.minimal' });

// Import Services
const walletConnectService = require('./services/walletConnectService');
const pollService = require('./services/pollService');
const WeightedPollService = require('./services/weightedPollService');
const pollArchiveService = require('./services/pollArchiveService');
const AirdropService = require('./services/airdropService');
const UserService = require('./services/userService');

console.log('🚀 Starting AERA Token Telegram Bot (COMPLETE VERSION)...\n');

// Environment Variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const AERA_TOKEN_ADDRESS = process.env.AERA_TOKEN_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const ADMIN_WALLET = process.env.ADMIN_WALLET;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

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
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MAX_SUPPLY",
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Initialize User Service (Database)
const userService = new UserService();

// Initialize Airdrop Service
let airdropService = null;
if (ADMIN_WALLET && ADMIN_PRIVATE_KEY && web3) {
    airdropService = new AirdropService(web3, AERA_TOKEN_ADDRESS, AERA_ABI, ADMIN_WALLET, ADMIN_PRIVATE_KEY);
    if (airdropService.initialize()) {
        console.log('✅ Airdrop Service ready');
    } else {
        console.log('⚠️  Airdrop Service initialization failed');
        airdropService = null;
    }
} else {
    console.log('⚠️  Airdrop Service skipped (missing config)');
}

// Initialize Weighted Poll Service
const weightedPollService = new WeightedPollService(
    web3,
    AERA_TOKEN_ADDRESS,
    AERA_ABI
);

// Logo Images Array
const LOGO_IMAGES = [
    'AEra-logo.png',
    'AEra-logo-dark-backround.png',
    'AEra-logo-human.png',
    'AEra-logo-human-color.png',
    'AEra-logo-sand.png',
    'AEra-logo-sand-dark.png'
];

// Get random logo
const getRandomLogo = () => {
    const randomIndex = Math.floor(Math.random() * LOGO_IMAGES.length);
    return path.join(__dirname, 'images', LOGO_IMAGES[randomIndex]);
};

if (!BOT_TOKEN || BOT_TOKEN === 'your_telegram_bot_token_here') {
    console.log('❌ Bot Token missing! Please configure .env');
    process.exit(1);
}

// ===================================
// BOT HANDLERS
// ===================================

// Debug Handler - Log all messages
bot.on('message', (msg) => {
    console.log(`📨 Message received - User: ${msg.from.id}, Text: "${msg.text}"`);
});

// START Command with Image and Keyboard Menu
// START Command with Image and Keyboard Menu
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'there';

    const startMessage = `🌀 WELCOME TO AERA TOKEN 🌀

The Resonant Standard for Transparent Technology

Hello ${userName}! 

AEra is an open-source ERC-20 token project exploring blockchain as a tool for clarity, integrity, and collaboration.

QUICK LINKS
Contract: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
GitHub: https://github.com/koal0308/AEra
Verification: https://repo.sourcify.dev/contracts/full_match/11155111/0x5032206396A6001eEaD2e0178C763350C794F69e/

"In a world obsessed with price, we built something that measures alignment."

Stay curious. Stay resonant. 🌀`;

    // Inline keyboard menu like BotFather
    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: '🔌 Wallet', callback_data: 'menu_wallet' },
                { text: '📊 Polls', callback_data: 'menu_polls' },
                { text: '⚖️ Weighted', callback_data: 'menu_weighted' }
            ],
            [
                { text: '📦 Archive', callback_data: 'menu_archive' },
                { text: 'ℹ️ Info', callback_data: 'menu_info' }
            ],
            [
                { text: '📋 All Commands (/help)', callback_data: 'menu_help' }
            ]
        ]
    };

    const logoPath = getRandomLogo();
    bot.sendPhoto(chatId, logoPath, {
        caption: startMessage,
        reply_markup: inlineKeyboard
    }).catch((err) => {
        console.log('⚠️  Photo error, sending fallback:', err.message.substring(0, 50));
        // Fallback if image fails - still show keyboard
        bot.sendMessage(chatId, startMessage, { 
            reply_markup: inlineKeyboard 
        });
    });
});

// Handle inline keyboard callbacks
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    let responseText = '';
    let keyboard = { inline_keyboard: [] };

    if (data === 'menu_wallet') {
        responseText = `🔌 WALLET INTEGRATION\n\n` +
            `/connect - MetaMask verbinden (QR-Code)\n` +
            `/wallet - Wallet Status checken\n` +
            `/disconnect - Wallet trennen`;
        keyboard.inline_keyboard = [
            [{ text: '🔄 Back', callback_data: 'menu_back' }]
        ];
    } else if (data === 'menu_polls') {
        responseText = `📊 STANDARD POLLS\n\n` +
            `/polls - Alle aktiven Pollen\n` +
            `/poll <id> - Poll details\n` +
            `/vote <id> <option> - Abstimmen (min. 0.5 AERA)\n` +
            `/closepoll <id> - Poll stoppen (Admin)\n` +
            `/results <id> - Results anzeigen`;
        keyboard.inline_keyboard = [
            [{ text: '🔄 Back', callback_data: 'menu_back' }]
        ];
    } else if (data === 'menu_weighted') {
        responseText = `⚖️ WEIGHTED POLLS\n\n` +
            `/wpolls - View all weighted polls\n` +
            `/wpoll <id> - Poll details\n` +
            `/wvote <id> <option> - Vote with token weight`;
        keyboard.inline_keyboard = [
            [{ text: '🔄 Back', callback_data: 'menu_back' }]
        ];
    } else if (data === 'menu_archive') {
        responseText = `📦 ARCHIVE & STATISTICS\n\n` +
            `/archive - Archivede Pollen\n` +
            `/archived <id> - Details of archived Poll\n` +
            `/stats - Statistics & Auswertungen`;
        keyboard.inline_keyboard = [
            [{ text: '🔄 Back', callback_data: 'menu_back' }]
        ];
    } else if (data === 'menu_info') {
        responseText = `ℹ️ PROJECT INFORMATION\n\n` +
            `/info - Contract-Informationen\n` +
            `/supply - Aktuelle Token-Supply\n` +
            `/verify - Verifikations-Details\n` +
            `/roadmap - Projekt-Roadmap\n` +
            `/security - Security & Audit Status\n` +
            `/contact - Help & Support`;
        keyboard.inline_keyboard = [
            [{ text: '🔄 Back', callback_data: 'menu_back' }]
        ];
    } else if (data === 'menu_help') {
        bot.sendMessage(chatId, `🤖 AEra Bot - ALL COMMANDS\n\n` +
            `🔌 Wallet:\n` +
            `/connect - Wallet verbinden\n` +
            `/wallet - Status checken\n` +
            `/disconnect - Trennen\n\n` +
            `📊 Standard Polls:\n` +
            `/polls - Alle sehen\n` +
            `/poll <id> - Details\n` +
            `/vote <id> <opt> - Abstimmen\n` +
            `/closepoll <id> - Stoppen (Admin)\n` +
            `/results <id> - Results\n\n` +
            `⚖️ Weighted Polls:\n` +
            `/wpolls - Alle sehen\n` +
            `/wpoll <id> - Details\n` +
            `/wvote <id> <opt> - Abstimmen\n\n` +
            `📦 Archive & Reports:\n` +
            `/archive - Archivede\n` +
            `/archived <id> - Details\n` +
            `/stats - Statistics\n\n` +
            `ℹ️ Info:\n` +
            `/info - Contract info\n` +
            `/supply - Token supply\n` +
            `/verify - Verifikation\n` +
            `/roadmap - Roadmap\n` +
            `/security - Security\n` +
            `/contact - Support`, { 
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[{ text: '🔄 Back', callback_data: 'menu_back' }]] }
            });
        bot.answerCallbackQuery(query.id);
        return;
    } else if (data === 'menu_back') {
        // Return to main start screen
        const mainMessage = `🌀 *WELCOME TO AERA TOKEN* 🌀\n\n` +
            `*The Resonant Standard for Transparent Technology*\n\n` +
            `AEra is an open-source ERC-20 token project exploring blockchain as a tool for clarity, integrity, and collaboration.\n\n` +
            `📊 *QUICK LINKS*\n` +
            `🔗 Contract: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e\n` +
            `📖 GitHub: https://github.com/koal0308/AEra\n` +
            `✅ Verification: https://sourcify.dev/\n\n` +
            `"In a world obsessed with price, we built something that measures alignment."`;
        
        const mainKeyboard = {
            inline_keyboard: [
                [
                    { text: '🔌 Wallet', callback_data: 'menu_wallet' },
                    { text: '📊 Polls', callback_data: 'menu_polls' },
                    { text: '⚖️ Weighted', callback_data: 'menu_weighted' }
                ],
                [
                    { text: '📦 Archive', callback_data: 'menu_archive' },
                    { text: 'ℹ️ Info', callback_data: 'menu_info' }
                ],
                [
                    { text: '📋 All Commands (/help)', callback_data: 'menu_help' }
                ]
            ]
        };

        bot.sendMessage(chatId, mainMessage, { 
            parse_mode: 'Markdown',
            reply_markup: mainKeyboard 
        });
        bot.answerCallbackQuery(query.id);
        return;
    }

    if (responseText) {
        bot.sendMessage(chatId, responseText, { 
            parse_mode: 'Markdown',
            reply_markup: keyboard 
        });
    }

    bot.answerCallbackQuery(query.id);
});

// HELP Command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    const helpMessage = `🤖 *AEra Bot - Alle Commands*

**Wallet:**
/connect - Wallet verbinden
/wallet - Status checken
/disconnect - Trennen

**Standard Polls:**
/polls - Alle sehen
/poll <id> - Details
/vote <id> <opt> - Abstimmen
/closepoll <id> - Stoppen (Admin)
/results <id> - Results

**Weighted Polls:**
/wpolls - Alle sehen
/wpoll <id> - Details
/wvote <id> <opt> - Abstimmen

**Archive & Reports:**
/archive - Archivede
/archived <id> - Details
/stats - Statistics

**Info:**
/start - Welcome
/info - Contract info
/supply - Token supply
/verify - Verifikation
/roadmap - Roadmap
/security - Security
/contact - Support`;

    const logoPath = getRandomLogo();
    bot.sendPhoto(chatId, logoPath, {
        caption: helpMessage,
        parse_mode: 'Markdown'
    }).catch(() => {
        bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });
});

// INFO Command
bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id;
    
    const infoMessage = `📊 *AEra Token - Contract information*

*Network:* Ethereum Sepolia Testnet (Chain ID: 11155111)
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
🔗 GitHub: https://github.com/koal0308/AEra
🔗 Sourcify: https://repo.sourcify.dev/contracts/full_match/11155111/0x5032206396A6001eEaD2e0178C763350C794F69e`;

    const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
    bot.sendPhoto(chatId, logoPath, {
        caption: infoMessage,
        parse_mode: 'Markdown'
    }).catch((err) => {
        bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
    });
});

// SUPPLY Command
bot.onText(/\/supply/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (!contractAvailable) {
        const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: '⚠️ Blockchain data temporarily unavailable. Please try again later.',
            parse_mode: 'Markdown'
        }).catch(() => {
            bot.sendMessage(chatId, '⚠️ Blockchain data temporarily unavailable. Please try again later.');
        });
        return;
    }

    try {
        const contract = new web3.eth.Contract(AERA_ABI, AERA_TOKEN_ADDRESS);
        const totalSupply = await contract.methods.totalSupply().call();
        const maxSupply = await contract.methods.MAX_SUPPLY().call();
        
        const totalSupplyFormatted = (BigInt(totalSupply) / BigInt(10**18)).toString();
        const maxSupplyFormatted = (BigInt(maxSupply) / BigInt(10**18)).toString();

        const supplyMessage = `📈 *AEra Token supply*

*Current Supply:* ${totalSupplyFormatted} AERA
*Max Supply:* ${maxSupplyFormatted} AERA
*Supply %:* ${((BigInt(totalSupply) / BigInt(maxSupply)) * 100n).toString()}%

*Tokenomics:*
• Initial Supply: 100,000,000 AERA
• Maximum Supply: 1,000,000,000 AERA
• Governance: 2-of-3 Multi-Sig Safe
• Burnable: Yes
• Pausable: Yes`;

        const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: supplyMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, supplyMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: '❌ Error fetching supply data. Please try again.',
            parse_mode: 'Markdown'
        }).catch(() => {
            bot.sendMessage(chatId, '❌ Error fetching supply data. Please try again.');
        });
    }
});

// VERIFY Command
bot.onText(/\/verify/, (msg) => {
    const chatId = msg.chat.id;
    
    const verifyMessage = `✅ *AEra Token - Verification Status*

*On-Chain Verification:*
✅ Etherscan: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#code
✅ Sourcify: https://repo.sourcify.dev/contracts/full_match/11155111/0x5032206396A6001eEaD2e0178C763350C794F69e/

*Security Analysis:*
✅ Slither Analysis: Local analysis (0 critical issues)
✅ OpenZeppelin v5.0.0 (Audited libraries)
✅ Zero Critical Issues

*Transparency:*
✅ Full source code on GitHub
✅ Multi-Sig governance active
✅ All deployments documented
✅ Public verification trail

*Safe Address:*
\`0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93\`
🔗 Gnosis Safe: https://app.safe.global/sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

*GitHub Repository:*
https://github.com/koal0308/AEra`;

    const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
    bot.sendPhoto(chatId, logoPath, {
        caption: verifyMessage,
        parse_mode: 'Markdown'
    }).catch((err) => {
        bot.sendMessage(chatId, verifyMessage, { parse_mode: 'Markdown' });
    });
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

    const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
    bot.sendPhoto(chatId, logoPath, {
        caption: roadmapMessage,
        parse_mode: 'Markdown'
    }).catch((err) => {
        bot.sendMessage(chatId, roadmapMessage, { parse_mode: 'Markdown' });
    });
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

*Documentation:*
📖 GitHub: https://github.com/koal0308/AEra
📊 Etherscan: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e

*Professional Audit:*
🔲 Planned for Phase 2 (Q2 2026)`;

    const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
    bot.sendPhoto(chatId, logoPath, {
        caption: securityMessage,
        parse_mode: 'Markdown'
    }).catch((err) => {
        bot.sendMessage(chatId, securityMessage, { parse_mode: 'Markdown' });
    });
});

// CONTACT Command
bot.onText(/\/contact/, (msg) => {
    const chatId = msg.chat.id;
    
    const contactMessage = `📞 *AEra Token - Contact & Support*

*Community:*
💬 Telegram: https://t.me/AEra_Go_Live_bot
🐙 GitHub: https://github.com/koal0308/AEra
🔗 Safe: https://app.safe.global/sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

*Contract Links:*
🔗 Etherscan: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
📋 Sourcify: https://repo.sourcify.dev/contracts/full_match/11155111/0x5032206396A6001eEaD2e0178C763350C794F69e/

*Quick Reference:*
• Network: Ethereum Sepolia (Chain ID 11155111)
• Contract: 0x5032206396A6001eEaD2e0178C763350C794F69e
• Symbol: AERA
• Max Supply: 1,000,000,000 AERA

*Questions?*
Visit our GitHub repository for complete documentation:
https://github.com/koal0308/AEra`;

    const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
    bot.sendPhoto(chatId, logoPath, {
        caption: contactMessage,
        parse_mode: 'Markdown'
    }).catch((err) => {
        bot.sendMessage(chatId, contactMessage, { parse_mode: 'Markdown' });
    });
});

// ===================================
// WALLET CONNECT HANDLERS
// ===================================

bot.onText(/\/connect/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        await walletConnectService.initialize();
        
        const { uri, qrCode } = await walletConnectService.generateConnectionUri(userId);
        const qrImagePath = path.join(__dirname, `qr-${userId}.png`);
        await QRCode.toFile(qrImagePath, uri);

        const connectMessage = `🔐 *Connect Wallet*

Scan QR-Code with your Wallet-App oder nutze den Link.

After scanning erhältst du access to community voting!`;

        // Versuche Photo zu senden
        let photoSent = false;
        try {
            await bot.sendPhoto(chatId, qrImagePath, {
                caption: connectMessage,
                parse_mode: 'Markdown'
            });
            photoSent = true;
        } catch (photoErr) {
            console.log('� QR-Photo could not be gesendet werden, sending text only:', photoErr.message);
            await bot.sendMessage(chatId, connectMessage, { parse_mode: 'Markdown' });
        } finally {
            try {
                require('fs').unlinkSync(qrImagePath);
            } catch (e) {}
        }

        // ============================================
        // WICHTIG: approveSession() WARTET auf Genehmigung!
        // ============================================
        console.log(`⏳ Waiting for wallet approval für User ${userId}...`);
        const result = await walletConnectService.approveSession(userId);
        console.log(`✅ approveSession() returned result zurückgegeben:`, result);
        
        // Register user-wallet mapping in database
        const userReg = userService.registerUserWallet(userId, result.address, result.sessionTopic);
        console.log(`✅ registerUserWallet() returned result zurückgegeben:`, userReg);
        
        if (!userReg.success) {
            // User tried to connect with different wallet - show error
            console.log(`⚠️ User trying to connect different Wallet zu verbinden. Aktuelle Wallet: ${userReg.currentWallet}`);
            await bot.sendMessage(
                chatId, 
                `⚠️ *Du trying to connect a different Wallet zu verbinden!*\n\n` +
                `❌ Das does not work, da du bereits mit dieser wallet connected bist:\n\n` +
                `💳 \`${userReg.currentWallet}\`\n\n` +
                `*Options:*\n` +
                `1️⃣ /disconnect - Disconnect current wallet\n` +
                `2️⃣ /connect - Neue Wallet verbinden\n\n` +
                `Questions? Contact @AEra_Support`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Check if airdrop was already sent
        let aeraSentMessage = '';
        const alreadyReceivedAirdrop = userService.hasReceivedAirdrop(userId);

        if (!alreadyReceivedAirdrop && airdropService) {
            // First time connecting - send airdrop
            try {
                console.log(`💰 Sending 0.5 AERA an ${result.address}...`);
                const airdropResult = await airdropService.sendAirdrop(result.address);
                
                if (airdropResult.success) {
                    // Mark airdrop as sent in database
                    userService.markAirdropSent(userId, airdropResult.txHash, '0.5');
                    aeraSentMessage = `\n\n💰 *0.5 AERA Willkommensbonus* wurde gebucht!\n📝 TX: \`${airdropResult.txHash.substring(0, 10)}...\``;
                    console.log(`✅ Airdrop successful: ${airdropResult.txHash}`);
                } else {
                    // Mark as failed
                    userService.markAirdropFailed(userId, airdropResult.message);
                    aeraSentMessage = `\n\n⚠️ Airdrop fehlgeschlagen: ${airdropResult.message}`;
                    console.error(`❌ Airdrop Failed: ${airdropResult.message}`);
                }
            } catch (err) {
                userService.markAirdropFailed(userId, err.message);
                console.error('❌ AERA transfer error:', err.message);
                aeraSentMessage = `\n\n⚠️ Automatic AERA bonus fehlgeschlagen.`;
            }
        } else if (alreadyReceivedAirdrop) {
            // Already received airdrop before
            aeraSentMessage = `\n\n✅ Du hast bereits deinen welcome bonus received!`;
            if (userReg.airdropTxHash) {
                aeraSentMessage += `\n📝 Previous TX: \`${userReg.airdropTxHash.substring(0, 10)}...\``;
            }
        }

        await bot.sendMessage(chatId, `✅ *Wallet successfully connected!*\n\n💳 *Address:* \`${result.address}\`\n\nDu can now participate in polls teilnehmen! Use /polls to vote.${aeraSentMessage}`, { parse_mode: 'Markdown' });
        console.log(`✅ Wallet für User ${userId} verbunden: ${result.address}`);

    } catch (error) {
        // Error handling für ALLES - Photo, WalletConnect, Airdrop
        console.error(`❌ Error in /connect handler:`, error.message);
        console.error(`   Stack: ${error.stack}`);
        
        // Check if user is already connected to a wallet
        try {
            const existingUser = userService.getUserByTelegramId(userId);
            if (existingUser && existingUser.walletAddress) {
                const logoPath = getRandomLogo();  // ✅ Zufälliges Logo laden
                
                const errorMessage = `⚠️ *Dein Telegram account is already mit einer wallet connected!*\n\n💳 *Registered Wallet:* \`${existingUser.walletAddress}\`\n\n` +
                    `*Please connect mit deiner registrierten Wallet:*\n\n` +
                    `1️⃣ /wallet - Show current wallet\n\n` +
                    `2️⃣ /connect - Connect with registered wallet\n\n` +
                    `3️⃣ /disconnect - Disconnect current wallet`;
                
                // ✅ Sende Photo mit Failedmeldung
                await bot.sendPhoto(chatId, logoPath, {
                    caption: errorMessage,
                    parse_mode: 'Markdown'
                }).catch((err) => {
                    // Fallback: Nur Text wenn Photo fehlschlägt
                    console.log('⚠️ Photo konnte nicht gesendet werden');
                    bot.sendMessage(chatId, errorMessage, { parse_mode: 'Markdown' });
                });
                
                return;
            }
        } catch (e) {
            console.error('   Error checking existing wallets:', e.message);
        }

        // Generic error message
        await bot.sendMessage(
            chatId, 
            `❌ *Wallet connection failed.*\n\n` +
            `*Possible reasons:*\n` +
            `• Du hast die Verbindung in deiner Wallet-App rejected\n` +
            `• Die Verbindung wurde interrupted\n` +
            `• Waited too long (Timeout)\n\n` +
            `Please try again mit /connect`,
            { parse_mode: 'Markdown' }
        );
    }
});

bot.onText(/\/disconnect/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (walletConnectService.disconnectSession(userId)) {
        // Also clean up database session
        try {
            userService.removeSession(userId);
        } catch (err) {
            console.error('❌ Error during DB cleanup:', err.message);
        }
        bot.sendMessage(chatId, '✅ Wallet successfully disconnected');
    } else {
        bot.sendMessage(chatId, '⚠️ No active wallet-Verbindung');
    }
});

bot.onText(/\/wallet/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const session = walletConnectService.getUserSession(userId);
    const activeSession = walletConnectService.getActiveSession(userId);

    if (activeSession && session && session.address) {
        // Get database info
        const userRecord = userService.getUserByTelegramId(userId);
        let airdropStatus = '❓ Unbekannt';
        let airdropTx = '';
        
        if (userRecord) {
            if (userRecord.airdropStatus === 'completed') {
                airdropStatus = '✅ Received';
                if (userRecord.airdropTxHash) {
                    airdropTx = `\n*TX:* \`${userRecord.airdropTxHash.substring(0, 12)}...\``;
                }
            } else if (userRecord.airdropStatus === 'failed') {
                airdropStatus = '❌ Failed';
            } else {
                airdropStatus = '⏳ Pending';
            }
        }

        const walletMessage = `✅ *Wallet Connected*

*Address:* \`${session.address}\`
*Status:* Active
*Chain:* Ethereum Sepolia

💰 *Airdrop Status:* ${airdropStatus}${airdropTx}

Start voting mit /polls`;

        bot.sendMessage(chatId, walletMessage, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, '⚠️ Keine wallet connected. Nutze /connect');
    }
});

// ===================================
// STANDARD POLL COMMANDS
// ===================================

bot.onText(/\/createpoll\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId.toString() !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ Only admin can create polls');
        return;
    }

    try {
        const parts = match[1].split('|');
        if (parts.length < 3) {
            bot.sendMessage(chatId, '❌ Format: /createpoll Titel|Option1|Option2|Option3');
            return;
        }

        const [title, ...options] = parts;
        const poll = pollService.createPoll(
            title.trim(),
            'Community Poll',
            options.map(o => o.trim()),
            86400
        );

        let pollMessage = `🗳️ *Standard poll created*\n\n*${poll.title}*\n\n`;
        poll.options.forEach(opt => {
            pollMessage += `${opt.id + 1}. ${opt.text}\n`;
        });
        pollMessage += `\n*Vote with:*\n`;
        poll.options.forEach(opt => {
            pollMessage += `/vote ${poll.id} ${opt.id + 1} - ${opt.text}\n`;
        });

        bot.sendMessage(chatId, pollMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// POLL Details Command - MIT BILD
bot.onText(/\/poll (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const pollId = parseInt(match[1]);

    try {
        const poll = pollService.getPoll(pollId);
        if (!poll) {
            bot.sendMessage(chatId, '❌ Poll not found');
            return;
        }

        const status = poll.active ? '🟢 Active' : '⭕ Closed';
        const timeLeft = Math.floor(poll.timeRemaining / 1000 / 60);
        const totalVotes = poll.totalVotes || 1;

        let pollMessage = `🗳️ *${poll.title}*\n${status}\n\n`;
        
        poll.options.forEach(opt => {
            const percentage = Math.round((opt.votes / totalVotes) * 100);
            const barLength = Math.floor(percentage / 5);
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            pollMessage += `${opt.id + 1}. ${opt.text}\n`;
            pollMessage += `${bar} ${percentage}% (${opt.votes})\n\n`;
        });

        pollMessage += `⏱️ ${timeLeft} Min | 📊 Total: ${poll.totalVotes}\n`;
        
        if (poll.active) {
            pollMessage += `Vote: /vote ${poll.id} <option>`;
        }

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: pollMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, pollMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// WEIGHTED POLL Details - MIT BILD
bot.onText(/\/wpoll (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const pollId = parseInt(match[1]);

    try {
        const poll = weightedPollService.getWeightedPoll(pollId);
        if (!poll) {
            bot.sendMessage(chatId, '❌ Gewichtete Poll not found');
            return;
        }

        const status = poll.active ? '🟢 Active' : '⭕ Closed';
        const timeLeft = Math.floor(poll.timeRemaining / 1000 / 60);

        let pollMessage = `🎯 *${poll.title}*\n${status}\n\n`;
        
        poll.options.forEach(opt => {
            const percentage = parseInt(opt.percentage);
            const barLength = Math.floor(percentage / 5);
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            pollMessage += `${opt.id + 1}. ${opt.text}\n`;
            pollMessage += `${bar} ${percentage}%\n`;
            pollMessage += `   💰 ${opt.weightedVotes} | 👥 ${opt.voteCount}\n\n`;
        });

        pollMessage += `⏱️ ${timeLeft} Min\n`;
        pollMessage += `💰 Total: ${poll.totalWeightedVotes} AERA\n`;
        pollMessage += `👥 Voters: ${poll.voteCount}`;

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: pollMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, pollMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// RESULTS Command - MIT BILD
bot.onText(/\/results (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const pollId = parseInt(match[1]);

    try {
        // Versuche zuerst gewichtete Poll
        const weightedResults = weightedPollService.getPollResults(pollId);
        if (weightedResults) {
            let resultMessage = `📊 *${weightedResults.title}*\n\n`;
            resultMessage += `🏆 *Gewinner:* ${weightedResults.results[0].option}\n`;
            resultMessage += `💰 ${weightedResults.results[0].weightedVotes} AERA\n\n`;

            resultMessage += `*Rangliste:*\n`;
            weightedResults.results.forEach(res => {
                resultMessage += `${res.rank}. ${res.option}\n`;
                resultMessage += `   ${res.percentage}% | ${res.weightedVotes} | ${res.voteCount} Votes\n`;
            });

            resultMessage += `\n*Total:*\n${weightedResults.totalWeightedVotes} AERA | ${weightedResults.totalVoters} Voters`;

            const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
            bot.sendPhoto(chatId, logoPath, {
                caption: resultMessage,
                parse_mode: 'Markdown'
            }).catch((err) => {
                bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown' });
            });
            return;
        }

        // Fallback: Standard-Poll
        const poll = pollService.getPoll(pollId);
        if (!poll) {
            bot.sendMessage(chatId, '❌ Poll not found');
            return;
        }

        let resultMessage = `📊 *${poll.title}*\n\n`;
        resultMessage += `*Options:*\n`;
        
        let maxVotes = Math.max(...poll.options.map(o => o.votes || 0));
        poll.options.forEach((opt, index) => {
            const percentage = maxVotes > 0 ? Math.round((opt.votes / maxVotes) * 100) : 0;
            const bar = '█'.repeat(Math.round(percentage / 10)) + '░'.repeat(10 - Math.round(percentage / 10));
            resultMessage += `${index + 1}. ${opt.text}\n`;
            resultMessage += `   ${bar} ${opt.votes || 0} Votes\n`;
        });

        resultMessage += `\n*Total:* ${poll.totalVotes} Votes`;
        
        if (!poll.active) {
            resultMessage += `\n✅ Poll beendet`;
        }

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: resultMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// ARCHIVED Poll Details - MIT BILD
bot.onText(/\/archived (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const pollId = parseInt(match[1]);

    try {
        const poll = pollArchiveService.getArchivedPoll(pollId);
        if (!poll) {
            bot.sendMessage(chatId, '❌ Nicht gefunden');
            return;
        }

        const report = pollArchiveService.generatePollReport(poll);
        
        let reportMessage = `📊 *${report.title}*\n\n`;
        reportMessage += `*Time period:*\n${report.duration.start.split('T')[0]}\n\n`;
        reportMessage += `*Summary:*\n`;
        reportMessage += `👥 ${report.summary.totalVoters} Voters\n`;
        reportMessage += `💰 ${report.summary.totalWeightedVotes} AERA\n\n`;

        reportMessage += `*Results:*\n`;
        report.results.slice(0, 5).forEach(res => {
            reportMessage += `${res.rank}. ${res.option} - ${res.percentage}%\n`;
        });

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: reportMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, reportMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// STATS Command - MIT BILD
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;

    try {
        // Get poll statistics
        const pollStats = pollArchiveService.getStatistics();

        // Get airdrop statistics
        const airdropStats = userService.getAirdropStats();

        let statsMessage = `📈 *Statistics*\n\n`;
        
        // Airdrop Stats
        statsMessage += `*💰 Airdrop Status:*\n`;
        statsMessage += `✅ Received: ${airdropStats.completed}\n`;
        statsMessage += `⏳ Pending: ${airdropStats.pending}\n`;
        statsMessage += `❌ Failed: ${airdropStats.failed}\n`;
        statsMessage += `👥 Total: ${airdropStats.total}\n\n`;
        
        // Poll Stats
        statsMessage += `*📊 Polls:*\n`;
        statsMessage += `Archived: ${pollStats.archivedPolls}\n`;
        statsMessage += `Reports: ${pollStats.generatedReports}\n`;
        statsMessage += `Storage: ${pollStats.storageUsed} MB`;

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: statsMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// POLLS List - MIT BILD
bot.onText(/\/polls/, (msg) => {
    const chatId = msg.chat.id;

    try {
        pollService.closeExpiredPolls();
        const polls = pollService.getAllPolls();

        if (polls.length === 0) {
            bot.sendMessage(chatId, '📭 No active standard polls');
            return;
        }

        let pollsMessage = '🗳️ *Activee Standard-Pollen*\n\n';

        polls.forEach(poll => {
            const status = poll.active ? '🟢 Active' : '⭕ Closed';
            const timeLeft = Math.floor(poll.timeRemaining / 1000 / 60);
            
            pollsMessage += `*#${poll.id} - ${poll.title}* ${status}\n`;
            pollsMessage += `⏱️ ${timeLeft} Min | Votes: ${poll.totalVotes}\n\n`;
        });

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: pollsMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, pollsMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// WPOLLS List - MIT BILD
bot.onText(/\/wpolls/, (msg) => {
    const chatId = msg.chat.id;

    try {
        weightedPollService.closeExpiredPolls();
        const polls = weightedPollService.getAllWeightedPolls();

        if (polls.length === 0) {
            bot.sendMessage(chatId, '📭 No active weighted polls aktiv');
            return;
        }

        let pollsMessage = '🎯 *Weighted Polls*\n\n';

        polls.forEach(poll => {
            const status = poll.active ? '🟢 Active' : '⭕ Closed';
            const timeLeft = Math.floor(poll.timeRemaining / 1000 / 60);
            
            pollsMessage += `*#${poll.id} - ${poll.title}* ${status}\n`;
            pollsMessage += `⏱️ ${timeLeft} Min | 💰 ${poll.totalWeightedVotes} AERA\n\n`;
        });

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: pollsMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, pollsMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// ARCHIVE List - MIT BILD
bot.onText(/\/archive/, (msg) => {
    const chatId = msg.chat.id;

    try {
        const archived = pollArchiveService.getAllArchivedPolls();
        
        if (archived.length === 0) {
            bot.sendMessage(chatId, '📚 No archived Pollen');
            return;
        }

        let archiveMessage = `📚 *Archiv (${archived.length})*\n\n`;

        archived.slice(-10).forEach(poll => {
            const date = new Date(poll.archivedAt).toLocaleDateString('de-DE');
            archiveMessage += `#${poll.id} - ${poll.title}\n${date}\n\n`;
        });

        archiveMessage += `Nutze /archived <id> für Details`;

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: archiveMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, archiveMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// ===================================
// WEIGHTED POLL COMMANDS
// ===================================

bot.onText(/\/createweightedpoll\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId.toString() !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ Only admin can gewichtete create polls');
        return;
    }

    try {
        const parts = match[1].split('|');
        if (parts.length < 3) {
            bot.sendMessage(chatId, '❌ Format: /createweightedpoll Titel|Opt1|Opt2|minTokens');
            return;
        }

        const [title, ...rest] = parts;
        const minTokens = parseInt(rest[rest.length - 1]) || 0;
        const options = rest.slice(0, -1);

        const poll = weightedPollService.createWeightedPoll(
            title.trim(),
            'token-weighted Poll',
            options.map(o => o.trim()),
            minTokens,
            86400
        );

        let pollMessage = `🎯 *Gewichtete Poll erstellt*\n\n*${poll.title}*\n\n`;
        poll.options.forEach(opt => {
            pollMessage += `${opt.id + 1}. ${opt.text}\n`;
        });
        pollMessage += `\n💰 At least ${poll.minTokensRequired} AERA required`;
        pollMessage += `\nVote with: /wvote ${poll.id} <option>`;

        bot.sendMessage(chatId, pollMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// Error Handler
bot.on('polling_error', (error) => {
    console.log('❌ Polling error:', error.code);
});

// Startup Message
console.log('✅ AEra Token Bot COMPLETE running');
console.log('📋 Features: Wallet, Standard Polls, Weighted Polls, Archive, Reports');
console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

// ===================================
// BOT COMMANDS MENU SETUP
// ===================================

const setupBotCommands = async () => {
    const commands = [
        // Wallet Commands
        { command: 'start', description: '🌀 Bot starten & Willkommen' },
        { command: 'connect', description: '🔌 Wallet verbinden (MetaMask)' },
        { command: 'wallet', description: '💳 Wallet Status checken' },
        { command: 'disconnect', description: '🔗 Wallet trennen' },
        
        // Standard Polls
        { command: 'polls', description: '📊 Alle aktiven Pollen' },
        { command: 'poll', description: '🗳️ Poll details' },
        { command: 'vote', description: '✅ Abstimmen (min. 0.5 AERA)' },
        { command: 'results', description: '📈 Pollsergebnisse' },
        { command: 'closepoll', description: '⛔ Poll beenden (Admin)' },
        
        // Weighted Polls
        { command: 'wpolls', description: '⚖️ Weighted Polls' },
        { command: 'wpoll', description: '🎯 Details gew. Poll' },
        { command: 'wvote', description: '⚖️ Mit Token-Gewicht voteen' },
        
        // Archive & Stats
        { command: 'archive', description: '📦 Archivede Pollen' },
        { command: 'archived', description: '📚 Details of archived Poll' },
        { command: 'stats', description: '📈 Statistics & Reports' },
        
        // Info Commands
        { command: 'help', description: '📋 Alle Befehle anzeigen' },
        { command: 'info', description: 'ℹ️ Contract-Informationen' },
        { command: 'supply', description: '📊 Token-Supply anzeigen' },
        { command: 'verify', description: '✅ Verification Status' },
        { command: 'roadmap', description: '🚀 Projekt-Roadmap' },
        { command: 'security', description: '🔒 Securitys-Garantie' },
        { command: 'contact', description: '📞 Support & Links' }
    ];

    try {
        await bot.setMyCommands(commands, {
            scope: { type: 'default' },
            language_code: 'de'
        });
        console.log('✅ Bot Commands Menu activated (EN)');
    } catch (error) {
        console.error('❌ Error setting der Commands:', error.message);
    }

    // Optional: English version
    try {
        const commandsEn = [
            { command: 'start', description: '🌀 Start bot & welcome' },
            { command: 'connect', description: '🔌 Connect wallet (MetaMask)' },
            { command: 'wallet', description: '💳 Check wallet status' },
            { command: 'disconnect', description: '🔗 Disconnect wallet' },
            { command: 'polls', description: '📊 View active polls' },
            { command: 'poll', description: '🗳️ Poll details' },
            { command: 'vote', description: '✅ Cast vote (min. 0.5 AERA)' },
            { command: 'results', description: '📈 Poll results' },
            { command: 'closepoll', description: '⛔ Close poll (Admin)' },
            { command: 'wpolls', description: '⚖️ Weighted polls' },
            { command: 'wpoll', description: '🎯 Weighted poll details' },
            { command: 'wvote', description: '⚖️ Vote with token weight' },
            { command: 'archive', description: '📦 Archived polls' },
            { command: 'archived', description: '📚 Archived poll details' },
            { command: 'stats', description: '📈 Statistics' },
            { command: 'help', description: '📋 All commands' },
            { command: 'info', description: 'ℹ️ Contract info' },
            { command: 'supply', description: '📊 Token supply' },
            { command: 'verify', description: '✅ Verification status' },
            { command: 'roadmap', description: '🚀 Project roadmap' },
            { command: 'security', description: '🔒 Security guarantee' },
            { command: 'contact', description: '📞 Support & links' }
        ];

        await bot.setMyCommands(commandsEn, {
            scope: { type: 'default' },
            language_code: 'en'
        });
        console.log('✅ Bot Commands Menu aktiviert (EN)');
    } catch (error) {
        console.error('⚠️  English commands not available');
    }
};

// Rufe die Funktion beim Start auf:
setupBotCommands();