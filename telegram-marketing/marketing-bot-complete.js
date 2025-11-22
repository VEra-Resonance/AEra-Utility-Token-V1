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

const bot = new TelegramBot(BOT_TOKEN, { 
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10,
            allowed_updates: ['message', 'callback_query']
        }
    }
});

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

// Track active connection attempts to prevent duplicates
const activeConnections = new Map();

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
            `/poll &lt;id&gt; - Poll details\n` +
            `/vote &lt;id&gt; &lt;option&gt; - Abstimmen (min. 0.5 AERA)\n` +
            `/closepoll &lt;id&gt; - Poll stoppen (Admin)\n` +
            `/results &lt;id&gt; - Results anzeigen`;
        keyboard.inline_keyboard = [
            [{ text: '🔄 Back', callback_data: 'menu_back' }]
        ];
    } else if (data === 'menu_weighted') {
        responseText = `⚖️ WEIGHTED POLLS\n\n` +
            `/wpolls - View all weighted polls\n` +
            `/wpoll &lt;id&gt; - Poll details\n` +
            `/wvote &lt;id&gt; &lt;option&gt; - Vote with token weight`;
        keyboard.inline_keyboard = [
            [{ text: '🔄 Back', callback_data: 'menu_back' }]
        ];
    } else if (data === 'menu_archive') {
        responseText = `📦 ARCHIVE & STATISTICS\n\n` +
            `/archive - Archivede Pollen\n` +
            `/archived &lt;id&gt; - Details of archived Poll\n` +
            `/stats - Statistics &amp; Auswertungen`;
        keyboard.inline_keyboard = [
            [{ text: '🔄 Back', callback_data: 'menu_back' }]
        ];
    } else if (data === 'menu_info') {
        responseText = `ℹ️ PROJECT INFORMATION\n\n` +
            `/info - Contract-Informationen\n` +
            `/supply - Aktuelle Token-Supply\n` +
            `/verify - Verifikations-Details\n` +
            `/roadmap - Projekt-Roadmap\n` +
            `/security - Security &amp; Audit Status\n` +
            `/contact - Help &amp; Support`;
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
            `/poll &lt;id&gt; - Details\n` +
            `/vote &lt;id&gt; &lt;opt&gt; - Abstimmen\n` +
            `/closepoll &lt;id&gt; - Stoppen (Admin)\n` +
            `/results &lt;id&gt; - Results\n\n` +
            `⚖️ Weighted Polls:\n` +
            `/wpolls - Alle sehen\n` +
            `/wpoll &lt;id&gt; - Details\n` +
            `/wvote &lt;id&gt; &lt;opt&gt; - Abstimmen\n\n` +
            `📦 Archive &amp; Reports:\n` +
            `/archive - Archivede\n` +
            `/archived &lt;id&gt; - Details\n` +
            `/stats - Statistics\n\n` +
            `ℹ️ Info:\n` +
            `/info - Contract info\n` +
            `/supply - Token supply\n` +
            `/verify - Verifikation\n` +
            `/roadmap - Roadmap\n` +
            `/security - Security\n` +
            `/contact - Support`, { 
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [[{ text: '🔄 Back', callback_data: 'menu_back' }]] }
            });
        bot.answerCallbackQuery(query.id);
        return;
    } else if (data === 'menu_back') {
        // Return to main start screen
        const mainMessage = `🌀 <b>WELCOME TO AERA TOKEN</b> 🌀\n\n` +
            `<b>The Resonant Standard for Transparent Technology</b>\n\n` +
            `AEra is an open-source ERC-20 token project exploring blockchain as a tool for clarity, integrity, and collaboration.\n\n` +
            `📊 <b>QUICK LINKS</b>\n` +
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
            parse_mode: 'HTML',
            reply_markup: mainKeyboard 
        });
        bot.answerCallbackQuery(query.id);
        return;
    }

    if (responseText) {
        bot.sendMessage(chatId, responseText, { 
            parse_mode: 'HTML',
            reply_markup: keyboard 
        });
    }

    bot.answerCallbackQuery(query.id);
});

// HELP Command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    const helpMessage = `🤖 <b>AEra Bot - Alle Commands</b>

<b>Wallet:</b>
/connect - Wallet verbinden
/wallet - Status checken
/disconnect - Trennen

<b>Standard Polls:</b>
/polls - Alle sehen
/poll &lt;id&gt; - Details
/vote &lt;id&gt; &lt;opt&gt; - Abstimmen
/closepoll &lt;id&gt; - Stoppen (Admin)
/results &lt;id&gt; - Results

<b>Weighted Polls:</b>
/wpolls - Alle sehen
/wpoll &lt;id&gt; - Details
/wvote &lt;id&gt; &lt;opt&gt; - Abstimmen

<b>Archive &amp; Reports:</b>
/archive - Archivede
/archived &lt;id&gt; - Details
/stats - Statistics

<b>Info:</b>
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
        parse_mode: 'HTML'
    }).catch(() => {
        bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
    });
});

// INFO Command
bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id;
    console.log(`📨 /info command received from user ${msg.from.id}`);
    
    const infoMessage = `📊 <b>AEra Token - Contract Information</b>

<b>Network:</b> Ethereum Sepolia Testnet (Chain ID: 11155111)
<b>Contract:</b> <code>0x5032206396A6001eEaD2e0178C763350C794F69e</code>
<b>Symbol:</b> AERA
<b>Decimals:</b> 18
<b>Owner:</b> Gnosis Safe 2-of-3 Multi-Sig
<b>Status:</b> ✅ Verified on Etherscan &amp; Sourcify

<b>Standards:</b>
✅ ERC-20 (Full compliance)
✅ ERC-2612 (Permit mechanism)
✅ Burnable (Supply adjustment)
✅ Pausable (Emergency control)

<b>Links:</b>
🔗 <a href="https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e">Etherscan</a>
🔗 <a href="https://github.com/koal0308/AEra">GitHub</a>
🔗 <a href="https://repo.sourcify.dev/contracts/full_match/11155111/0x5032206396A6001eEaD2e0178C763350C794F69e">Sourcify</a>`;

    try {
        console.log(`🖼️ Sending info with photo...`);
        const logoPath = getRandomLogo();
        bot.sendPhoto(chatId, logoPath, {
            caption: infoMessage,
            parse_mode: 'HTML'
        }).then(() => {
            console.log(`✅ /info photo sent successfully`);
        }).catch((err) => {
            console.warn(`⚠️ Photo send failed: ${err.message}, falling back to text`);
            bot.sendMessage(chatId, infoMessage, { parse_mode: 'HTML' })
                .then(() => console.log(`✅ /info text sent as fallback`))
                .catch(e => console.error(`❌ /info text also failed: ${e.message}`));
        });
    } catch (error) {
        console.error(`❌ /info error: ${error.message}`);
        bot.sendMessage(chatId, infoMessage, { parse_mode: 'HTML' })
            .catch(e => console.error(`❌ /info fallback failed: ${e.message}`));
    }
});

// SUPPLY Command
bot.onText(/\/supply/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (!contractAvailable) {
        const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: '⚠️ Blockchain data temporarily unavailable. Please try again later.',
            parse_mode: 'HTML'
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

        const supplyMessage = `📈 <b>AEra Token supply</b>

<b>Current Supply:</b> ${totalSupplyFormatted} AERA
<b>Max Supply:</b> ${maxSupplyFormatted} AERA
<b>Supply %:</b> ${((BigInt(totalSupply) / BigInt(maxSupply)) * 100n).toString()}%

<b>Tokenomics:</b>
• Initial Supply: 100,000,000 AERA
• Maximum Supply: 1,000,000,000 AERA
• Governance: 2-of-3 Multi-Sig Safe
• Burnable: Yes
• Pausable: Yes`;

        const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: supplyMessage,
            parse_mode: 'HTML'
        }).catch((err) => {
            bot.sendMessage(chatId, supplyMessage, { parse_mode: 'HTML' });
        });
    } catch (error) {
        const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: '❌ Error fetching supply data. Please try again.',
            parse_mode: 'HTML'
        }).catch(() => {
            bot.sendMessage(chatId, '❌ Error fetching supply data. Please try again.');
        });
    }
});

// VERIFY Command
bot.onText(/\/verify/, (msg) => {
    const chatId = msg.chat.id;
    
    const verifyMessage = `✅ <b>AEra Token - Verification Status</b>

<b>On-Chain Verification:</b>
✅ Etherscan: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#code
✅ Sourcify: https://repo.sourcify.dev/contracts/full_match/11155111/0x5032206396A6001eEaD2e0178C763350C794F69e/

<b>Security Analysis:</b>
✅ Slither Analysis: Local analysis (0 critical issues)
✅ OpenZeppelin v5.0.0 (Audited libraries)
✅ Zero Critical Issues

<b>Transparency:</b>
✅ Full source code on GitHub
✅ Multi-Sig governance active
✅ All deployments documented
✅ Public verification trail

<b>Safe Address:</b>
<code>0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93</code>
🔗 Gnosis Safe: https://app.safe.global/sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

<b>GitHub Repository:</b>
https://github.com/koal0308/AEra`;

    const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
    bot.sendPhoto(chatId, logoPath, {
        caption: verifyMessage,
        parse_mode: 'HTML'
    }).catch((err) => {
        bot.sendMessage(chatId, verifyMessage, { parse_mode: 'HTML' });
    });
});

// ROADMAP Command
bot.onText(/\/roadmap/, (msg) => {
    const chatId = msg.chat.id;
    
    const roadmapMessage = `🚀 <b>AEra Token - Roadmap</b>

<b>Phase 0 - Foundation</b> ✅ COMPLETE
Q4 2025
✅ Smart contract deployed &amp; verified
✅ Multi-Sig governance active
✅ Slither security analysis (0 critical issues)
✅ Telegram bot operational

<b>Phase 1 - Community Test &amp; Airdrop</b> 🔄 Q1 2026
🔲 Public test airdrop (Sign-in with Ethereum)
🔲 Community feedback collection
🔲 Backend API development

<b>Phase 2 - Security &amp; Governance</b> 📅 Q2 2026
🔲 Professional security audit
🔲 Governance module integration
🔲 Snapshot DAO setup

<b>Phase 3 - Mainnet Preparation</b> 📅 Q3 2026
🔲 Mainnet infrastructure setup
🔲 Liquidity framework design
🔲 Final security testing

<b>Phase 4 - Mainnet Deployment</b> 🚀 Q4 2026 (Earliest)
🔲 Mainnet Launch
🔲 DEX/CEX listings
🔲 1:1 token swap

<b>Phase 5 - Ecosystem Integration</b> 📅 2027
🔲 VERA/PAXIS network bridge
🔲 Long-term governance evolution`;

    const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
    bot.sendPhoto(chatId, logoPath, {
        caption: roadmapMessage,
        parse_mode: 'HTML'
    }).catch((err) => {
        bot.sendMessage(chatId, roadmapMessage, { parse_mode: 'HTML' });
    });
});

// SECURITY Command
bot.onText(/\/security/, (msg) => {
    const chatId = msg.chat.id;
    
    const securityMessage = `🔒 <b>AEra Token - Security Guarantee</b>

<b>Code Security:</b>
✅ OpenZeppelin v5.0.0 (Industry standard)
✅ Solidity 0.8.20 (Latest security features)
✅ 100% public, auditable source code
✅ Slither static analysis (0 critical issues)

<b>Governance Security:</b>
✅ 2-of-3 Gnosis Safe Multi-Sig
✅ All transactions on-chain &amp; public
✅ No private keys in repository
✅ Transparent ownership transfer logs

<b>Features:</b>
✅ Burnable: Reduce supply if needed
✅ Pausable: Emergency transfer control
✅ Permit (EIP-2612): Gasless approvals
✅ MAX_SUPPLY hard-coded: 1B AERA

<b>Documentation:</b>
📖 <a href="https://github.com/koal0308/AEra">GitHub</a>
📊 <a href="https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e">Etherscan</a>

<b>Professional Audit:</b>
🔲 Planned for Phase 2 (Q2 2026)`;

    const logoPath = getRandomLogo();
    bot.sendPhoto(chatId, logoPath, {
        caption: securityMessage,
        parse_mode: 'HTML'
    }).catch((err) => {
        bot.sendMessage(chatId, securityMessage, { parse_mode: 'HTML' });
    });
});

// CONTACT Command
bot.onText(/\/contact/, (msg) => {
    const chatId = msg.chat.id;
    
    const contactMessage = `📞 <b>AEra Token - Contact &amp; Support</b>

<b>Community:</b>
💬 Telegram: https://t.me/AEra_Go_Live_bot
🐙 GitHub: https://github.com/koal0308/AEra
🔗 Safe: https://app.safe.global/sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

<b>Contract Links:</b>
🔗 Etherscan: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
📋 Sourcify: https://repo.sourcify.dev/contracts/full_match/11155111/0x5032206396A6001eEaD2e0178C763350C794F69e/

<b>Quick Reference:</b>
• Network: Ethereum Sepolia (Chain ID 11155111)
• Contract: 0x5032206396A6001eEaD2e0178C763350C794F69e
• Symbol: AERA
• Max Supply: 1,000,000,000 AERA

<b>Questions?</b>
Visit our GitHub repository for complete documentation:
https://github.com/koal0308/AEra`;

    const logoPath = getRandomLogo();  // ✅ HINZUGEFÜGT
    bot.sendPhoto(chatId, logoPath, {
        caption: contactMessage,
        parse_mode: 'HTML'
    }).catch((err) => {
        bot.sendMessage(chatId, contactMessage, { parse_mode: 'HTML' });
    });
});

// ===================================
// WALLET CONNECT HANDLERS
// ===================================

bot.onText(/\/connect/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Prevent duplicate connection attempts
    if (activeConnections.has(userId)) {
        await bot.sendMessage(chatId, '⏳ Connection already in progress. Please wait or scan the QR code from your wallet app.');
        return;
    }

    try {
        // Mark connection as active
        activeConnections.set(userId, true);

        await walletConnectService.initialize();
        
        const { uri, qrCode } = await walletConnectService.generateConnectionUri(userId);
        const qrImagePath = path.join(__dirname, `qr-${userId}.png`);
        await QRCode.toFile(qrImagePath, uri);

        const connectMessage = `🔐 <b>Connect Wallet</b>

Scan the QR-Code with your Wallet App:

[MetaMask] [Trust Wallet] [Rainbow] [Phantom] [BlackFort]

Or use this link:
${uri}

After scanning you'll get access to community voting!`;

        // Versuche Photo zu senden
        let photoSent = false;
        try {
            await bot.sendPhoto(chatId, qrImagePath, {
                caption: connectMessage,
                parse_mode: 'HTML'
            });
            photoSent = true;
        } catch (photoErr) {
            console.log('⚠️ QR-Photo could not be sent, sending text only:', photoErr.message);
            // Falls Photo fehlgeschlagen, sende Text mit Link
            await bot.sendMessage(chatId, connectMessage, { parse_mode: 'HTML' });
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
                `⚠️ <b>You are trying to connect a different wallet!</b>\n\n` +
                `❌ This won't work because you are already connected with this wallet:\n\n` +
                `💳 <code>${userReg.currentWallet}</code>\n\n` +
                `<b>Options:</b>\n` +
                `1️⃣ /disconnect - Disconnect current wallet\n` +
                `2️⃣ /connect - Connect a new wallet\n\n` +
                `Questions? Contact @AEra_Support`,
                { parse_mode: 'HTML' }
            );
            return;
        }

        // Check if airdrop was already sent
        let aeraSentMessage = '';
        const alreadyReceivedAirdrop = userService.hasReceivedAirdrop(userId);

        if (!alreadyReceivedAirdrop && airdropService) {
            // First time connecting - send airdrop
            try {
                console.log(`💰 Sending 0.5 AERA to ${result.address}...`);
                const airdropResult = await airdropService.sendAirdrop(result.address);
                
                if (airdropResult.success) {
                    // Mark airdrop as sent in database
                    userService.markAirdropSent(userId, airdropResult.txHash, '0.5');
                    aeraSentMessage = `\n\n💰 <b>0.5 AERA Welcome Bonus</b> transferred!\n📝 TX: <code>${airdropResult.txHash.substring(0, 10)}...</code>`;
                    console.log(`✅ Airdrop successful: ${airdropResult.txHash}`);
                } else {
                    // Mark as failed
                    userService.markAirdropFailed(userId, airdropResult.message);
                    aeraSentMessage = `\n\n⚠️ Airdrop failed: ${airdropResult.message}`;
                    console.error(`❌ Airdrop Failed: ${airdropResult.message}`);
                }
            } catch (err) {
                userService.markAirdropFailed(userId, err.message);
                console.error('❌ AERA transfer error:', err.message);
                aeraSentMessage = `\n\n⚠️ Automatic AERA bonus failed.`;
            }
        } else if (alreadyReceivedAirdrop) {
            // Already received airdrop before
            aeraSentMessage = `\n\n✅ You already received your welcome bonus!`;
            if (userReg.airdropTxHash) {
                aeraSentMessage += `\n📝 Previous TX: <code>${userReg.airdropTxHash.substring(0, 10)}...</code>`;
            }
        }

        await bot.sendMessage(chatId, `✅ <b>Wallet successfully connected!</b>\n\n💳 <b>Address:</b> <code>${result.address}</code>\n\nYou can now participate in polls! Use /polls to vote.${aeraSentMessage}`, { parse_mode: 'HTML' });
        console.log(`✅ Wallet for User ${userId} connected: ${result.address}`);

    } catch (error) {
        // Error handling für ALLES - Photo, WalletConnect, Airdrop
        console.error(`❌ Error in /connect handler:`, error.message);
        console.error(`   Stack: ${error.stack}`);
        
        // Check if user is already connected to a wallet
        try {
            const existingUser = userService.getUserByTelegramId(userId);
            if (existingUser && existingUser.walletAddress) {
                const logoPath = getRandomLogo();  // ✅ Zufälliges Logo laden
                
                const errorMessage = `⚠️ <b>Your Telegram account is already connected with a wallet!</b>\n\n💳 <b>Registered Wallet:</b> <code>${existingUser.walletAddress}</code>\n\n` +
                    `<b>Please connect with your registered wallet:</b>\n\n` +
                    `1️⃣ /wallet - Show current wallet\n\n` +
                    `2️⃣ /connect - Connect with registered wallet\n\n` +
                    `3️⃣ /disconnect - Disconnect current wallet`;
                
                // ✅ Sende Photo mit Failedmeldung
                await bot.sendPhoto(chatId, logoPath, {
                    caption: errorMessage,
                    parse_mode: 'HTML'
                }).catch((err) => {
                    // Fallback: Nur Text wenn Photo fehlschlägt
                    console.log('⚠️ Photo konnte nicht gesendet werden');
                    bot.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' });
                });
                
                return;
            }
        } catch (e) {
            console.error('   Error checking existing wallets:', e.message);
        }

        // Generic error message
        await bot.sendMessage(
            chatId, 
            `❌ <b>Wallet connection failed.</b>\n\n` +
            `<b>Possible reasons:</b>\n` +
            `• Du hast die Verbindung in deiner Wallet-App rejected\n` +
            `• Die Verbindung wurde interrupted\n` +
            `• Waited too long (Timeout)\n\n` +
            `Please try again mit /connect`,
            { parse_mode: 'HTML' }
        );
    } finally {
        // Always remove from active connections
        activeConnections.delete(userId);
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

    // Check database first (most reliable source)
    const userRecord = userService.getUserByTelegramId(userId);

    if (userRecord && userRecord.walletAddress) {
        // Wallet exists in database
        let airdropStatus = '❓ Unknown';
        let airdropTx = '';
        
        if (userRecord.airdropStatus === 'completed') {
            airdropStatus = '✅ Received';
            if (userRecord.airdropTxHash) {
                airdropTx = `\n<b>TX:</b> <code>${userRecord.airdropTxHash.substring(0, 12)}...</code>`;
            }
        } else if (userRecord.airdropStatus === 'failed') {
            airdropStatus = '❌ Failed';
        } else {
            airdropStatus = '⏳ Pending';
        }

        const walletMessage = `✅ <b>Wallet Connected</b>

<b>Address:</b> <code>${userRecord.walletAddress}</code>
<b>Status:</b> Active
<b>Chain:</b> Ethereum Sepolia

💰 <b>Airdrop Status:</b> ${airdropStatus}${airdropTx}

Start voting with /polls`;

        bot.sendMessage(chatId, walletMessage, { parse_mode: 'HTML' });
    } else {
        bot.sendMessage(chatId, '⚠️ No wallet connected. Use /connect to link your wallet.');
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
            86400  // 24 hours
        );

        let pollMessage = `🗳️ <b>Standard poll created</b>\n\n<b>${poll.title}</b>\n\n`;
        poll.options.forEach(opt => {
            pollMessage += `${opt.id + 1}. ${opt.text}\n`;
        });
        pollMessage += `\n<b>Vote with:</b>\n`;
        poll.options.forEach(opt => {
            pollMessage += `/vote ${poll.id} ${opt.id + 1} - ${opt.text}\n`;
        });
        pollMessage += `\n⏰ <b>Duration:</b> 24 hours`;

        bot.sendMessage(chatId, pollMessage, { parse_mode: 'HTML' });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// EXTENDED POLL - 72 HOURS
bot.onText(/\/createpoll72h\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId.toString() !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ Only admin can create polls');
        return;
    }

    try {
        const parts = match[1].split('|');
        if (parts.length < 3) {
            bot.sendMessage(chatId, '❌ Format: /createpoll72h Titel|Option1|Option2|Option3');
            return;
        }

        const [title, ...options] = parts;
        const poll = pollService.createPoll(
            title.trim(),
            'Extended Community Poll',
            options.map(o => o.trim()),
            259200  // 72 hours (3 * 24 * 60 * 60)
        );

        let pollMessage = `🗳️ <b>Extended Poll Created (72 hours)</b>\n\n<b>${poll.title}</b>\n\n`;
        poll.options.forEach(opt => {
            pollMessage += `${opt.id + 1}. ${opt.text}\n`;
        });
        pollMessage += `\n<b>Vote with:</b>\n`;
        poll.options.forEach(opt => {
            pollMessage += `/vote ${poll.id} ${opt.id + 1} - ${opt.text}\n`;
        });
        pollMessage += `\n⏰ <b>Duration:</b> 72 hours (3 days)`;

        bot.sendMessage(chatId, pollMessage, { parse_mode: 'HTML' });
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

        let pollMessage = `🗳️ <b>${poll.title}</b>\n${status}\n\n`;
        
        poll.options.forEach(opt => {
            const percentage = Math.round((opt.votes / totalVotes) * 100);
            const barLength = Math.floor(percentage / 5);
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            pollMessage += `${opt.id + 1}. ${opt.text}\n`;
            pollMessage += `${bar} ${percentage}% (${opt.votes})\n\n`;
        });

        pollMessage += `⏱️ ${timeLeft} Min | 📊 Total: ${poll.totalVotes}\n`;
        
        if (poll.active) {
            pollMessage += `Vote: /vote ${poll.id} &lt;option&gt;`;
        }

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: pollMessage,
            parse_mode: 'HTML'
        }).catch((err) => {
            bot.sendMessage(chatId, pollMessage, { parse_mode: 'HTML' });
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

        let pollMessage = `🎯 <b>${poll.title}</b>\n${status}\n\n`;
        
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
            parse_mode: 'HTML'
        }).catch((err) => {
            bot.sendMessage(chatId, pollMessage, { parse_mode: 'HTML' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// WVOTE - Weighted Poll abstimmen (Token-gewichtet)
bot.onText(/\/wvote\s+(\d+)\s+(\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const pollId = parseInt(match[1]);
    const optionId = parseInt(match[2]) - 1; // Convert to 0-indexed
    
    try {
        const poll = weightedPollService.weightedPolls.get(pollId);
        
        if (!poll) {
            bot.sendMessage(chatId, `❌ Weighted Poll #${pollId} not found`);
            return;
        }
        
        if (!poll.active) {
            bot.sendMessage(chatId, `❌ Weighted Poll #${pollId} has ended`);
            return;
        }
        
        if (optionId < 0 || optionId >= poll.options.length) {
            bot.sendMessage(chatId, `❌ Invalid option. Use /wvote ${pollId} <1-${poll.options.length}>`);
            return;
        }
        
        // Check if user already voted (voters is a Map in weightedPolls)
        const hasVoted = poll.voters ? poll.voters.has(userId.toString()) : 
                         poll.options.some(opt => opt.voters && opt.voters.has(userId.toString()));
        if (hasVoted) {
            bot.sendMessage(chatId, `❌ You already voted on this weighted poll`);
            return;
        }
        
        // Get user's token balance
        let userBalance;
        try {
            userBalance = await getTokenBalance(userId);
        } catch (balanceError) {
            console.warn(`⚠️ Could not check balance for user ${userId}:`, balanceError.message);
            bot.sendMessage(chatId, `❌ Could not verify token balance. Please ensure your wallet is connected.`);
            return;
        }
        
        if (userBalance <= 0) {
            bot.sendMessage(chatId, `❌ You need AERA tokens to vote in weighted polls\n💰 Your balance: ${userBalance} AERA`);
            return;
        }
        
        // Record weighted vote
        const userBalanceBigInt = BigInt(Math.floor(userBalance * 1e18)); // Convert to Wei
        const userIdStr = userId.toString();
        
        // Initialize voters as Map if it's not already
        if (!poll.options[optionId].voters) {
            poll.options[optionId].voters = new Map();
        }
        if (!poll.voters) {
            poll.voters = new Map();
        }
        
        poll.options[optionId].votes = (poll.options[optionId].votes || 0) + 1;
        poll.options[optionId].voters.set(userIdStr, userBalance);
        poll.options[optionId].weightedVotes = (poll.options[optionId].weightedVotes || 0n) + userBalanceBigInt;
        poll.options[optionId].voteCount = poll.options[optionId].voters.size;
        
        poll.totalWeightedVotes = (poll.totalWeightedVotes || 0n) + userBalanceBigInt;
        poll.voteCount = (poll.voteCount || 0) + 1;
        poll.voters.set(userIdStr, userBalance);
        
        weightedPollService.saveWeightedPolls();
        
        const option = poll.options[optionId];
        bot.sendMessage(chatId, `✅ Weighted vote recorded!\n\n📊 You voted for: <b>${option.text}</b>\n💰 Vote weight: ${userBalance} AERA\n\n⚖️ #${pollId} - ${poll.title}`, { parse_mode: 'HTML' });
        
    } catch (error) {
        console.error('Weighted vote error:', error);
        bot.sendMessage(chatId, `❌ Voting failed: ${error.message}`);
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
            let resultMessage = `📊 <b>${weightedResults.title}</b>\n\n`;
            resultMessage += `🏆 <b>Gewinner:</b> ${weightedResults.results[0].option}\n`;
            resultMessage += `💰 ${weightedResults.results[0].weightedVotes} AERA\n\n`;

            resultMessage += `<b>Rangliste:</b>\n`;
            weightedResults.results.forEach(res => {
                resultMessage += `${res.rank}. ${res.option}\n`;
                resultMessage += `   ${res.percentage}% | ${res.weightedVotes} | ${res.voteCount} Votes\n`;
            });

            resultMessage += `\n<b>Total:</b>\n${weightedResults.totalWeightedVotes} AERA | ${weightedResults.totalVoters} Voters`;

            const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
            bot.sendPhoto(chatId, logoPath, {
                caption: resultMessage,
                parse_mode: 'HTML'
            }).catch((err) => {
                bot.sendMessage(chatId, resultMessage, { parse_mode: 'HTML' });
            });
            return;
        }

        // Fallback: Standard-Poll
        const poll = pollService.getPoll(pollId);
        if (!poll) {
            bot.sendMessage(chatId, '❌ Poll not found');
            return;
        }

        let resultMessage = `📊 <b>${poll.title}</b>\n\n`;
        resultMessage += `<b>Options:</b>\n`;
        
        let maxVotes = Math.max(...poll.options.map(o => o.votes || 0));
        poll.options.forEach((opt, index) => {
            const percentage = maxVotes > 0 ? Math.round((opt.votes / maxVotes) * 100) : 0;
            const bar = '█'.repeat(Math.round(percentage / 10)) + '░'.repeat(10 - Math.round(percentage / 10));
            resultMessage += `${index + 1}. ${opt.text}\n`;
            resultMessage += `   ${bar} ${opt.votes || 0} Votes\n`;
        });

        resultMessage += `\n<b>Total:</b> ${poll.totalVotes} Votes`;
        
        if (!poll.active) {
            resultMessage += `\n✅ Poll beendet`;
        }

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: resultMessage,
            parse_mode: 'HTML'
        }).catch((err) => {
            bot.sendMessage(chatId, resultMessage, { parse_mode: 'HTML' });
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
        
        let reportMessage = `📊 <b>${report.title}</b>\n\n`;
        reportMessage += `<b>Time period:</b>\n${report.duration.start.split('T')[0]}\n\n`;
        reportMessage += `<b>Summary:</b>\n`;
        reportMessage += `👥 ${report.summary.totalVoters} Voters\n`;
        reportMessage += `💰 ${report.summary.totalWeightedVotes} AERA\n\n`;

        reportMessage += `<b>Results:</b>\n`;
        report.results.slice(0, 5).forEach(res => {
            reportMessage += `${res.rank}. ${res.option} - ${res.percentage}%\n`;
        });

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: reportMessage,
            parse_mode: 'HTML'
        }).catch((err) => {
            bot.sendMessage(chatId, reportMessage, { parse_mode: 'HTML' });
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

        let statsMessage = `📈 <b>Statistics</b>\n\n`;
        
        // Airdrop Stats
        statsMessage += `<b>💰 Airdrop Status:</b>\n`;
        statsMessage += `✅ Received: ${airdropStats.completed}\n`;
        statsMessage += `⏳ Pending: ${airdropStats.pending}\n`;
        statsMessage += `❌ Failed: ${airdropStats.failed}\n`;
        statsMessage += `👥 Total: ${airdropStats.total}\n\n`;
        
        // Poll Stats
        statsMessage += `<b>📊 Polls:</b>\n`;
        statsMessage += `Archived: ${pollStats.archivedPolls}\n`;
        statsMessage += `Reports: ${pollStats.generatedReports}\n`;
        statsMessage += `Storage: ${pollStats.storageUsed} MB`;

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: statsMessage,
            parse_mode: 'HTML'
        }).catch((err) => {
            bot.sendMessage(chatId, statsMessage, { parse_mode: 'HTML' });
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
        const polls = pollService.getActivePolls();  // Only active polls

        if (polls.length === 0) {
            bot.sendMessage(chatId, '📭 No active standard polls');
            return;
        }

        let pollsMessage = '🗳️ <b>Active Standard Polls</b>\n\n';

        polls.forEach(poll => {
            const timeLeft = Math.floor(poll.timeRemaining / 1000 / 60);
            
            pollsMessage += `<b>#${poll.id} - ${poll.title}</b> 🟢\n`;
            pollsMessage += `⏱️ ${timeLeft} Min | Votes: ${poll.totalVotes}\n\n`;
        });

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: pollsMessage,
            parse_mode: 'HTML'
        }).catch((err) => {
            bot.sendMessage(chatId, pollsMessage, { parse_mode: 'HTML' });
        });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// VOTE - Standard Poll abstimmen
bot.onText(/\/vote\s+(\d+)\s+(\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const pollId = parseInt(match[1]);
    const optionId = parseInt(match[2]) - 1; // Convert to 0-indexed
    
    try {
        const poll = pollService.polls.get(pollId);
        
        if (!poll) {
            bot.sendMessage(chatId, `❌ Poll #${pollId} not found`);
            return;
        }
        
        if (!poll.active) {
            bot.sendMessage(chatId, `❌ Poll #${pollId} has ended`);
            return;
        }
        
        if (optionId < 0 || optionId >= poll.options.length) {
            bot.sendMessage(chatId, `❌ Invalid option. Use /vote ${pollId} <1-${poll.options.length}>`);
            return;
        }
        
        // Check if user already voted (voters is a Set)
        const userIdStr = userId.toString();
        if (poll.voters.has(userIdStr)) {
            bot.sendMessage(chatId, `❌ You already voted on this poll`);
            return;
        }
        
        // Check minimum balance (0.5 AERA)
        try {
            const balance = await getTokenBalance(userId);
            const minRequired = 0.5;
            
            if (balance < minRequired) {
                bot.sendMessage(chatId, `❌ Insufficient AERA balance\n💰 You need ${minRequired} AERA to vote\n📊 Your balance: ${balance} AERA`);
                return;
            }
        } catch (balanceError) {
            console.warn(`⚠️ Could not check balance for user ${userId}:`, balanceError.message);
            // Continue anyway - user might not have wallet connected yet
        }
        
        // Record vote
        poll.options[optionId].votes++;
        poll.options[optionId].voters.push(userId);
        poll.totalVotes++;
        poll.voters.add(userIdStr); // voters is a Set, use .add()
        
        pollService.savePolls();
        
        const option = poll.options[optionId];
        bot.sendMessage(chatId, `✅ Vote recorded!\n\n📊 You voted for: <b>${option.text}</b>\n\n#${pollId} - ${poll.title}`, { parse_mode: 'HTML' });
        
    } catch (error) {
        console.error('Vote error:', error);
        bot.sendMessage(chatId, `❌ Voting failed: ${error.message}`);
    }
});

// WPOLLS List - MIT BILD
bot.onText(/\/wpolls/, (msg) => {
    const chatId = msg.chat.id;

    try {
        weightedPollService.closeExpiredPolls();
        const polls = weightedPollService.getActiveWeightedPolls();  // Only active polls

        if (polls.length === 0) {
            bot.sendMessage(chatId, '📭 No active weighted polls');
            return;
        }

        let pollsMessage = '⚖️ <b>Active Weighted Polls</b>\n\n';

        polls.forEach(poll => {
            const timeLeft = Math.floor(poll.timeRemaining / 1000 / 60);
            
            pollsMessage += `<b>#${poll.id} - ${poll.title}</b> 🟢\n`;
            pollsMessage += `⏱️ ${timeLeft} Min | 💰 ${poll.totalWeightedVotes} AERA\n\n`;
        });

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: pollsMessage,
            parse_mode: 'HTML'
        }).catch((err) => {
            bot.sendMessage(chatId, pollsMessage, { parse_mode: 'HTML' });
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
            bot.sendMessage(chatId, '📚 No archived polls yet. Polls are archived when they expire.');
            return;
        }

        let archiveMessage = `📚 <b>Archived Polls (${archived.length})</b>\n\n`;

        archived.slice(-10).forEach(poll => {
            const date = new Date(poll.archivedAt).toLocaleDateString('en-US');
            archiveMessage += `#${poll.id} - ${poll.title}\n${date}\n\n`;
        });

        archiveMessage += `Use /archived &lt;id&gt; for details`;

        const logoPath = getRandomLogo();  // ✅ BILD HINZUGEFÜGT
        bot.sendPhoto(chatId, logoPath, {
            caption: archiveMessage,
            parse_mode: 'HTML'
        }).catch((err) => {
            bot.sendMessage(chatId, archiveMessage, { parse_mode: 'HTML' });
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
        pollMessage += `\nVote with: /wvote ${poll.id} &lt;option&gt;`;

        bot.sendMessage(chatId, pollMessage, { parse_mode: 'HTML' });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Failed: ${error.message}`);
    }
});

// Error Handler
bot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM') {
        // Suppressing ETELEGRAM errors - normal retry behavior
        // Logging disabled to reduce noise
        return;
    } else {
        console.error('❌ Polling error:', error.message);
    }
});

// Handle bot errors
bot.on('error', (error) => {
    console.error('❌ Bot error:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
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

// ============================================
// AUTOMATIC POLL CLEANUP & ARCHIVING
// ============================================
// Every 30 seconds, check and archive expired polls
setInterval(() => {
    try {
        pollService.closeExpiredPolls();
        weightedPollService.closeExpiredPolls();
    } catch (error) {
        console.error('⚠️  Error during automatic poll cleanup:', error.message);
    }
}, 30000); // Run every 30 seconds

console.log('✅ Automatic poll cleanup scheduler started (30s interval)');