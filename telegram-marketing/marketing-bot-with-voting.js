const TelegramBot = require('node-telegram-bot-api');
const { Web3 } = require('web3');
const QRCode = require('qrcode');
const path = require('path');
require('dotenv').config({ path: '.env.minimal' });

// Import Services
const walletConnectService = require('./services/walletConnectService');
const pollService = require('./services/pollService');

console.log('🚀 Starting AERA Token Telegram Bot (WITH VOTING)...\n');

// Environment Variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const AERA_TOKEN_ADDRESS = process.env.AERA_TOKEN_ADDRESS;
const RPC_URL = process.env.RPC_URL;

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

// START Command with Image
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'there';

    const startMessage = `🌀 *Welcome to AEra Token* 🌀

*The Resonant Standard for Transparent Technology*

Welcome, ${userName}! 

AEra is an open-source ERC-20 token project exploring blockchain as a tool for clarity, integrity, and collaboration.

📊 *Quick Links:*
• 🔗 *Contract:* https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
• 📖 *GitHub:* https://github.com/AEra-Resonance/AEra-Token
• ✅ *Verification:* https://sourcify.dev/
• 🔐 *Security:* Local repository

📋 *Available Commands:*
/help - Show all commands
/info - Contract information
/supply - Current token supply
/verify - Verification details
/roadmap - Project roadmap
/security - Security & audit status
/contact - Get help

*"In a world obsessed with price, we built something that measures alignment."*

Stay curious. Stay resonant. 🌀`;

    const logoPath = getRandomLogo();
    bot.sendPhoto(chatId, logoPath, {
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
Visit our GitHub: https://github.com/AEra-Resonance/AEra-Token`;

    const logoPath = getRandomLogo();
    bot.sendPhoto(chatId, logoPath, {
        caption: helpMessage,
        parse_mode: 'Markdown'
    }).catch((err) => {
        bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });
});

// INFO Command
bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id;
    
    const infoMessage = `📊 *AEra Token - Contract Information*

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
🔗 GitHub: https://github.com/AEra-Resonance/AEra-Token
🔗 Sourcify: https://sourcify.dev/`;

    const logoPath = getRandomLogo();
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
        const logoPath = getRandomLogo();
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

        const logoPath = getRandomLogo();
        bot.sendPhoto(chatId, logoPath, {
            caption: supplyMessage,
            parse_mode: 'Markdown'
        }).catch((err) => {
            bot.sendMessage(chatId, supplyMessage, { parse_mode: 'Markdown' });
        });
    } catch (error) {
        const logoPath = getRandomLogo();
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
✅ Sourcify: https://sourcify.dev/

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
https://github.com/AEra-Resonance/AEra-Token`;

    const logoPath = getRandomLogo();
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

    const logoPath = getRandomLogo();
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
📖 GitHub: https://github.com/AEra-Resonance/AEra-Token
📊 Etherscan: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e

*Professional Audit:*
🔲 Planned for Phase 2 (Q2 2026)`;

    const logoPath = getRandomLogo();
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
🐙 GitHub: https://github.com/AEra-Resonance/AEra-Token
🔗 Safe: https://app.safe.global/sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

*Contract Links:*
🔗 Etherscan: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
📋 Sourcify: https://sourcify.dev/

*Quick Reference:*
• Network: Ethereum Sepolia (Chain ID 11155111)
• Contract: 0x5032206396A6001eEaD2e0178C763350C794F69e
• Symbol: AERA
• Max Supply: 1,000,000,000 AERA

*Questions?*
Visit our GitHub repository for complete documentation:
https://github.com/AEra-Resonance/AEra-Token`;

    const logoPath = getRandomLogo();
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

// CONNECT Wallet Command
bot.onText(/\/connect/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        await walletConnectService.initialize();
        
        const { uri, qrCode } = await walletConnectService.generateConnectionUri(userId);

        // Generate QR Code
        const qrImagePath = path.join(__dirname, `qr-${userId}.png`);
        await QRCode.toFile(qrImagePath, uri);

        const connectMessage = `🔐 *Wallet Verbinden*

Scan QR-Code mit deiner Wallet-App oder nutze folgenden Link:

\`${uri}\`

Nach dem Scan erhältst du Zugang zu Community-Abstimmungen!`;

        bot.sendPhoto(chatId, qrImagePath, {
            caption: connectMessage,
            parse_mode: 'Markdown'
        }).then(() => {
            // Cleanup
            require('fs').unlinkSync(qrImagePath);
        }).catch(err => {
            bot.sendMessage(chatId, connectMessage, { parse_mode: 'Markdown' });
        });

    } catch (error) {
        bot.sendMessage(chatId, `❌ Fehler: ${error.message}`);
    }
});

// DISCONNECT Wallet
bot.onText(/\/disconnect/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (walletConnectService.disconnectSession(userId)) {
        bot.sendMessage(chatId, '✅ Wallet erfolgreich disconnected');
    } else {
        bot.sendMessage(chatId, '⚠️ Keine aktive Wallet-Verbindung');
    }
});

// CHECK Wallet Status
bot.onText(/\/wallet/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const session = walletConnectService.getUserSession(userId);
    const activeSession = walletConnectService.getActiveSession(userId);

    if (activeSession && session && session.address) {
        const walletMessage = `✅ *Wallet Verbunden*

*Adresse:* \`${session.address}\`
*Status:* Aktiv
*Chain:* Ethereum Sepolia

Starte Abstimmung mit /poll`;

        bot.sendMessage(chatId, walletMessage, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, '⚠️ Keine Wallet verbunden. Nutze /connect');
    }
});

// ===================================
// POLL HANDLERS
// ===================================

// CREATE Poll (Admin only)
bot.onText(/\/createpoll (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId.toString() !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ Nur Admin darf Abstimmungen erstellen');
        return;
    }

    // Simplified: expect format "/createpoll title|option1|option2|option3"
    const parts = match[1].split('|');
    if (parts.length < 3) {
        bot.sendMessage(chatId, '❌ Format: /createpoll Titel|Option1|Option2|Option3');
        return;
    }

    try {
        const [title, ...options] = parts;
        const poll = pollService.createPoll(
            title.trim(),
            'Community Abstimmung',
            options.map(o => o.trim()),
            86400 // 24 hours
        );

        let pollMessage = `🗳️ *Neue Abstimmung erstellt*\n\n*${poll.title}*\n\n`;
        poll.options.forEach(opt => {
            pollMessage += `${opt.id + 1}. ${opt.text}\n`;
        });
        pollMessage += `\nAbstimmen mit: /vote ${poll.id} <option>`;

        bot.sendMessage(chatId, pollMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Fehler: ${error.message}`);
    }
});

// LIST All Polls
bot.onText(/\/polls/, (msg) => {
    const chatId = msg.chat.id;

    try {
        pollService.closeExpiredPolls();
        const polls = pollService.getAllPolls();

        if (polls.length === 0) {
            bot.sendMessage(chatId, '📭 Keine Abstimmungen aktiv');
            return;
        }

        let pollsMessage = '🗳️ *Aktive Abstimmungen*\n\n';

        polls.forEach(poll => {
            const status = poll.active ? '🟢 Aktiv' : '⭕ Beendet';
            const timeLeft = Math.floor(poll.timeRemaining / 1000 / 60);
            
            pollsMessage += `*#${poll.id} - ${poll.title}* ${status}\n`;
            pollsMessage += `⏱️ ${timeLeft} Minuten verbleibend\n`;
            pollsMessage += `Stimmen: ${poll.totalVotes}\n\n`;
        });

        bot.sendMessage(chatId, pollsMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Fehler: ${error.message}`);
    }
});

// VIEW Poll Details
bot.onText(/\/poll (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const pollId = parseInt(match[1]);

    try {
        const poll = pollService.getPoll(pollId);
        if (!poll) {
            bot.sendMessage(chatId, '❌ Abstimmung nicht gefunden');
            return;
        }

        const status = poll.active ? '🟢 Aktiv' : '⭕ Beendet';
        const timeLeft = Math.floor(poll.timeRemaining / 1000 / 60);
        const totalVotes = poll.totalVotes || 1; // Avoid division by zero

        let pollMessage = `🗳️ *${poll.title}*\n${status}\n\n`;
        
        poll.options.forEach(opt => {
            const percentage = Math.round((opt.votes / totalVotes) * 100);
            const barLength = Math.floor(percentage / 5);
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            pollMessage += `${opt.id + 1}. ${opt.text}\n`;
            pollMessage += `${bar} ${percentage}% (${opt.votes})\n\n`;
        });

        pollMessage += `⏱️ ${timeLeft} Minuten verbleibend\n`;
        pollMessage += `📊 Gesamt Stimmen: ${poll.totalVotes}\n\n`;
        
        if (poll.active) {
            pollMessage += `Abstimmen: /vote ${poll.id} <option>`;
        }

        bot.sendMessage(chatId, pollMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, `❌ Fehler: ${error.message}`);
    }
});

// VOTE on Poll
bot.onText(/\/vote (\d+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const pollId = parseInt(match[1]);
    const optionId = parseInt(match[2]) - 1; // Convert to 0-based

    try {
        const session = walletConnectService.getActiveSession(userId);
        if (!session || !session.namespaces) {
            bot.sendMessage(chatId, '❌ Wallet nicht verbunden. Nutze /connect');
            return;
        }

        const walletAddress = session.namespaces.eip155.accounts[0].split(':')[2];
        const poll = pollService.vote(pollId, walletAddress, optionId);

        const voteMessage = `✅ *Deine Stimme gezählt*

*Abstimmung:* ${poll.title}
*Gewählte Option:* ${poll.options[optionId].text}
*Gesamt Stimmen:* ${poll.totalVotes}

Danke für deine Teilnahme! 🙏`;

        bot.sendMessage(chatId, voteMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(chatId, `❌ ${error.message}`);
    }
});

// Startup
console.log('✅ AEra Token Bot mit WalletConnect & Voting läuft');
console.log('📋 Commands: /connect, /disconnect, /wallet, /polls, /poll, /vote');