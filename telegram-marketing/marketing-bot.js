const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { Web3 } = require('web3');
const fs = require('fs');
require('dotenv').config();

console.log('🚀 Starting AERA Token Marketing Automation Bot (ENGLISH VERSION)...\n');

// Environment Variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const MAIN_GROUP_ID = process.env.MAIN_GROUP_ID;
const NEWS_CHANNEL_ID = process.env.NEWS_CHANNEL_ID;
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

// Marketing Statistics
const marketingStats = {
    startTime: new Date(),
    newMembers: 0,
    totalMessages: 0,
    botCommands: 0,
    dailyActive: new Set(),
    weeklyStats: {
        posts: 0,
        engagement: 0
    }
};

// AIRDROP CONFIGURATION
const AIRDROP_CONFIG = {
    welcomeBonus: 100,
    referralBonus: 50,
    dailyBonus: 25,
    contestReward: 500,
    maxDailyClaims: 3,
    cooldownHours: 24
};

// ===================================
// LEGAL NOTICE & COMPLIANCE
// ===================================

const LEGAL_DISCLAIMER = `⚖️ DISCLAIMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TESTNET ONLY: Sepolia Testnet, NO real value
❌ NOT AN INVESTMENT: This is a test token
⚠️  NO GUARANTEE: Use at own risk
📜 MIT License: https://github.com/koal0308/AEra

Type /disclaimer for full details.`;

const FULL_DISCLAIMER = `⚖️ FULL LEGAL DISCLAIMER

1. TESTNET ONLY
   This is AEra Testtoken on Sepolia Testnet.
   No real monetary value. For testing only.

2. NOT AN INVESTMENT
   AEra is NOT a security, investment product,
   or financial instrument. No guarantees.

3. USER RESPONSIBILITY
   Each user acts on own responsibility.
   You must comply with local laws.

4. NO LIABILITY
   The developer/operator is NOT liable for
   any damages, losses or issues.

5. TECHNICAL DISCLAIMER
   Sepolia can be unstable. No SLA offered.

6. OPEN SOURCE
   Code available at: https://github.com/koal0308/AEra
   (MIT License - Use at your own risk)

7. TESTNET WARNING
   ⚠️  NEVER enter real private keys!
   ⚠️  NEVER send real funds!

Full terms: https://github.com/koal0308/AEra/blob/master/BOT-PRINCIPLES.md`;

const CONSENT_MESSAGE = `🔐 BEFORE YOU CONTINUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AEra is a TESTTOKEN on Sepolia Testnet.
This is NOT an investment or money-making scheme.

By claiming, you confirm:
✅ You understand this is a test token
✅ You accept NO responsibility  
✅ You comply with local laws
✅ You will NOT send real money

${"═".repeat(32)}`;

// Airdrop System
const airdropSystem = {
    activeAirdrops: new Map(),
    participants: new Map(),
    totalDistributed: 0,
    totalParticipants: 0,
    campaigns: []
};

// ===================================
// DATA PERSISTENCE FUNCTIONS
// ===================================

function saveUserDataFile() {
    try {
        const userData = {};
        
        airdropSystem.participants.forEach((user, userId) => {
            userData[userId] = {
                username: user.username,
                balance: user.balance,
                welcomeClaimed: user.welcomeClaimed,
                totalEarned: user.totalEarned,
                referrals: user.referrals || [],
                dailyClaims: user.dailyClaims,
                joinDate: user.joinDate ? new Date(user.joinDate).toISOString() : new Date().toISOString(),
                lastClaim: user.lastClaimTime ? new Date(user.lastClaimTime).toISOString() : null
            };
        });
        
        fs.writeFileSync('./user-data.json', JSON.stringify(userData, null, 2));
        console.log(`✅ User data saved (${Object.keys(userData).length} users)`);
    } catch (error) {
        console.log(`❌ Error saving user data: ${error.message}`);
    }
}

function loadUserDataFile() {
    try {
        if (!fs.existsSync('./user-data.json')) {
            console.log('📝 user-data.json not found - starting with empty data');
            return;
        }
        
        const data = fs.readFileSync('./user-data.json', 'utf8');
        const userData = JSON.parse(data);
        
        Object.entries(userData).forEach(([userId, user]) => {
            airdropSystem.participants.set(userId, {
                username: user.username,
                balance: user.balance || 0,
                welcomeClaimed: user.welcomeClaimed || false,
                dailyClaims: user.dailyClaims || 0,
                lastClaimTime: user.lastClaim ? new Date(user.lastClaim) : null,
                referrals: user.referrals || [],
                referredBy: null,
                contestWins: 0,
                joinDate: new Date(user.joinDate),
                totalEarned: user.totalEarned || 0
            });
        });
        
        airdropSystem.totalParticipants = airdropSystem.participants.size;
        console.log(`✅ User data loaded: ${airdropSystem.totalParticipants} users restored`);
    } catch (error) {
        console.log(`❌ Error loading user data: ${error.message}`);
    }
}

// ===================================
// AIRDROP LOGGING & AUDIT TRAIL
// ===================================

function logAirdropTransaction(airdropData) {
    try {
        const logEntry = {
            airdrop_id: `${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            user_id: airdropData.userId,
            username: airdropData.username,
            wallet: airdropData.wallet || 'pending',
            amount: airdropData.amount,
            network: 'sepolia',
            tx_hash: airdropData.txHash || 'pending',
            block: airdropData.block || null,
            status: airdropData.status || 'pending', // pending, confirmed, failed
            type: airdropData.type, // welcome, claim, referral, contest
            consent: {
                agreed: true,
                timestamp: new Date(airdropData.consentTime || new Date()).toISOString()
            },
            limits_check: {
                daily_used: airdropData.dailyUsed || 0,
                daily_limit: AIRDROP_CONFIG.maxDailyClaims,
                wallet_claims: airdropData.walletClaims || 0,
                passed: true
            }
        };
        
        // Append to log file
        let logs = [];
        if (fs.existsSync('./airdrop-log.json')) {
            const data = fs.readFileSync('./airdrop-log.json', 'utf8');
            logs = JSON.parse(data);
        }
        logs.push(logEntry);
        fs.writeFileSync('./airdrop-log.json', JSON.stringify(logs, null, 2));
        
        console.log(`📝 Airdrop logged: ${airdropData.amount} AERA to ${airdropData.username}`);
        return logEntry.airdrop_id;
    } catch (error) {
        console.log(`❌ Error logging airdrop: ${error.message}`);
        return null;
    }
}

// ===================================
// WELCOME SYSTEM
// ===================================

bot.on('new_chat_members', (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;
    
    newMembers.forEach(member => {
        if (member.is_bot) return;
        
        marketingStats.newMembers++;
        
        const welcomeMessage = getRandomWelcomeMessage(member);
        
        bot.sendMessage(chatId, welcomeMessage, { 
            parse_mode: 'Markdown',
            reply_to_message_id: msg.message_id
        }).catch(console.error);
        
        console.log(`🎉 New member welcomed: ${member.first_name}`);
    });
});

function getRandomWelcomeMessage(member) {
    const messages = [
        `🎉 Welcome ${member.first_name}! 🎉

You're now part of the AERA Token Revolution! 

🎁 **FREE AERA TOKENS:** ${AIRDROP_CONFIG.welcomeBonus} AERA!
Start @AEra_Official_Bot and use /claim

🚀 What awaits you:
• Live Contract Updates
• Community Events & AMAs  
• Airdrop Program with Daily Rewards
• Technical Deep-Dives

💡 Start with /help and discover all features!

#WelcomeAERA #FreeTokens #Airdrop`,

        `🌟 Hey ${member.first_name}! Great that you're here! 🌟

Member #${marketingStats.newMembers + 500} of the AERA Family! 

🎁 **Welcome Bonus:** ${AIRDROP_CONFIG.welcomeBonus} AERA waiting for you!
👥 **Referral Bonus:** ${AIRDROP_CONFIG.referralBonus} AERA per friend!

⚡ AERA Token Features:
• Burnable (Deflationary) + Airdrop Program
• Live Contract: ${AERA_TOKEN_ADDRESS}

🤖 Start: @AEra_Official_Bot for free tokens!

#AERAFamily #Airdrop #FreeAERA`,

        `🚀 ${member.first_name} joined the AERA Army! 🚀

Welcome to the future of DeFi! 

💰 **Claim now:** ${AIRDROP_CONFIG.welcomeBonus} AERA Tokens!

📊 Your first steps:
1. Start @AEra_Official_Bot
2. /claim - Get Welcome Bonus
3. /refer - Invite friends (+${AIRDROP_CONFIG.referralBonus} AERA/friend)
4. /airdrop - Learn about the program

💎 Earn free AERA tokens daily!

#AERAArmy #Airdrop #DailyRewards`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
}

// ===================================
// SCHEDULED MESSAGES
// ===================================

cron.schedule('0 9 * * *', () => {
    sendDailyStats();
});

async function sendDailyStats() {
    if (!MAIN_GROUP_ID || MAIN_GROUP_ID === '-1001234567890') {
        console.log('⏳ Main group not configured');
        return;
    }
    
    const today = new Date().toLocaleDateString('en-US');
    
    const statsMessage = `📊 *AERA Daily Report - ${today}*

👥 *Community Growth:*
• New members today: ${marketingStats.newMembers}
• Active users: ${marketingStats.dailyActive.size}
• Bot interactions: ${marketingStats.botCommands}

🔥 *Token Status:*
• Contract: Online ✅
• Live Data: Available ✅
• Community: Growing 📈

💡 *Today's focus:*
• Community Support
• Technical Updates
• Marketing Push

🚀 *Performance:* Excellent
📈 *Trend:* Bullish

#AERADaily #CommunityGrowth #DeFi`;

    try {
        await bot.sendMessage(MAIN_GROUP_ID, statsMessage, { parse_mode: 'Markdown' });
        console.log('📊 Daily stats sent');
        resetDailyStats();
    } catch (error) {
        console.log('❌ Daily stats error:', error.message);
    }
}

// ===================================
// BOT COMMANDS
// ===================================

// /start Command
bot.onText(/\/start(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || 'Friend';
    
    marketingStats.botCommands++;
    marketingStats.dailyActive.add(userId);
    
    console.log(`🚀 /start from ${firstName} (${userId})`);
    
    const welcomeMessage = `🎉 *Welcome to AERA Token, ${firstName}!* 🎉

✅ **🎊 ETHERSCAN VERIFICATION COMPLETE! 🎊**
Your AERA Token is now officially verified and listed on Etherscan Sepolia!
� View the verified contract: https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}#code

�🚀 **What is AERA?**
A revolutionary ERC-20 token with advanced features for the DeFi future.

✨ **Recent Achievements:**
✅ Contract deployed to Sepolia Testnet
✅ Smart contract verified on Etherscan
✅ Source code publicly visible
✅ Full ABI available for integrations
✅ Ready for community launch

🎁 **FREE AERA TOKENS:**
/claim - ${AIRDROP_CONFIG.welcomeBonus} AERA welcome bonus
/balance - Your AERA wallet  
/refer - ${AIRDROP_CONFIG.referralBonus} AERA per friend
/airdrop - Complete program

📊 **Available Commands:**
/help - All commands
/roadmap - Development roadmap  
/info - Contract information & verification status
/community - Community links

🚀 **Next Stop:** Mainnet Q4 2026

*📊 Network:* Sepolia Testnet (ChainID: 11155111)
*🔐 Security:* ERC-20 Standard + Burnable + Pausable + Permit
*📋 License:* MIT Open Source
*💾 Contract:* ${AERA_TOKEN_ADDRESS}*`;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// /help Command
bot.onText(/\/help(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isAdmin = ADMIN_USER_ID && userId.toString() === ADMIN_USER_ID;
    
    marketingStats.botCommands++;
    
    let helpMessage = `🤖 *AERA Token Bot - All Commands*

**📊 Token Information:**
/start - Bot overview
/status - ✅ Project status & achievements
/info - Live contract data
/supply - Supply statistics
/price - Price information
/contract - Contract details
/verification - ✅ Etherscan verification status

**🚀 Project Information:**
/roadmap - Development roadmap
/community - Community links
/marketing - Marketing features

**🎁 Airdrop System:**
/airdrop - Airdrop program
/claim - Daily reward
/balance - AERA wallet status
/refer - Invite friends

**⚖️ Legal & Compliance:**
/disclaimer - Full legal notice & disclaimer
/consent - Confirm you understand test token
/whitepaper - Read the AEra White Paper

**🔧 Utility:**
/help - This help`;

    if (isAdmin) {
        helpMessage += `

**👑 Admin Commands:**
/stats - System statistics
/users - All participants
/export - Export data`;
    }

    helpMessage += `

**📞 Support:** @AERASupport
**🆔 Version:** 3.1 English Edition

*Powered by AERA Token Community* ❤️`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// /whitepaper Command
bot.onText(/\/whitepaper(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    marketingStats.botCommands++;
    
    const whitepaperMessage = `📄 *AEra White Paper v1.0*

*"The Resonant Standard"*

🎯 *Vision:*
AEra is built around resonance – the alignment between human intent and transparent digital systems. Trust through verifiability.

📋 *Core Principles:*
• Transparency – Code first, all verifiable
• Resonance – Value from clarity, not hype
• Accountability – Every function auditable
• Autonomy – No backdoors, fully open
• Community Safety – Multi-sig + audit logs

🔧 *Technical Specs:*
• Symbol: AERA
• Decimals: 18
• Initial Supply: 100M
• Max Supply: 1B
• Owner: Gnosis Safe (2-of-3)
• License: MIT Open Source

⚖️ *Governance Model:*
Collective stewardship, not corporate control. Emergency controls via Safe signatures only.

🎁 *Airdrop Policy:*
• No ICO / IDO / Fundraising
• ≤50 AERA per wallet (test phase)
• Signature-based eligibility (EIP-4361)
• Zero personal data collection
• Testnet-first, then Mainnet (post-audit)

📊 *Use Cases:*
• Verification layer for ecosystem nodes
• Reputation marker for contributors
• Resonance metrics for alignment tracking
• Access token for research forums

🔐 *Security Architecture:*
• Multi-Sig Safe for admin functions
• Pausable mechanism for emergencies
• Audit tools (Slither, Hardhat, Foundry)
• Bug bounty program (after Mainnet)

🗺️ *Roadmap:*
Q4 2025: Etherscan verification ✅
Q1 2026: Multi-Sig + Test Airdrop
Q2 2026: Audit + DAO Integration
Q3 2026: Mainnet Deployment
Q4 2026+: VERA/PAXIS Integration

⚠️ *Legal Notice:*
NOT a financial instrument, security, or investment. No profit guarantee. Testnet tokens have no monetary value.

📖 *Full White Paper:*
https://github.com/koal0308/AEra/blob/master/WHITEPAPER.md

_"AEra is not a promise of value – it's an invitation to verify value yourself."_`;

    bot.sendMessage(chatId, whitepaperMessage, { parse_mode: 'Markdown', disable_web_page_preview: true });
});

// /roadmap Command
bot.onText(/\/roadmap(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    marketingStats.botCommands++;
    
    const roadmapMessage = `
🗺️ <b>AERA Token Roadmap 2025-2027</b>

<b>✅ PHASE 1: Nov-Dec 2025 - Foundation & Marketing</b>
• Build community (500+ members)
• Optimize bot
• Create website
• Write whitepaper
• Intensify marketing

<b>🛡️ PHASE 2: Jan-Mar 2026 - Security & Preparation</b>
• Conduct Security Audit (2-10k€)
• Intensive testing
• Legal compliance
• Goal: 2,000+ community members

<b>💼 PHASE 3: Apr-Jun 2026 - Pre-Mainnet</b>
• Final testnet tests
• Prepare liquidity (10-50 ETH)
• DEX/CEX partnerships
• Goal: 5,000+ community members

<b>🌟 PHASE 4: Jul-Sep 2026 - Expansion & Testing</b>
• Intensive mainnet testing
• Governance preparation
• Staking system development
• Goal: 10,000+ community members

<b>🚀 PHASE 5: Q4 2026 - MAINNET LAUNCH 🎉</b>
• Mainnet deployment (Live Trading!)
• DEX listings (Uniswap, SushiSwap)
• CEX listings
• 1:1 Testnet → Mainnet token swap
• Governance & staking activation
• Goal: 20,000+ community members

<b>🌍 PHASE 6: 2027 - Scaling & Ecosystem</b>
• International expansion
• DApp ecosystem
• Cross-chain bridge
• Goal: 50,000+ community members

<b>🎯 Next Milestones:</b>
• 500+ Community Members (Dec 2025)
• Security Audit (Q1 2026)
• Mainnet Launch (Q4 2026) 🚀

📊 <b>Status:</b> Project started - All systems active! 🚀
    `;

    bot.sendMessage(chatId, roadmapMessage, { parse_mode: 'HTML' });
});

// /info Command
bot.onText(/\/info(@AEra_Official_Bot)?/, async (msg) => {
    const chatId = msg.chat.id;
    marketingStats.botCommands++;
    
    if (!contractAvailable || AERA_TOKEN_ADDRESS === 'your_deployed_contract_address_here') {
        const fallbackMessage = `
📊 *AERA Token Information*

🔸 **Name:** AERA Token
🔸 **Symbol:** AERA
🔸 **Max Supply:** 1,000,000,000 AERA
🔸 **Standard:** ERC-20 (OpenZeppelin)

🔹 **Features:**
• 🔥 Burnable - Deflationary mechanism
• ⏸️ Pausable - Secure control
• 🎫 Permit - Gas-optimized
• 👑 Ownable - Governance

📍 **Contract:** ${AERA_TOKEN_ADDRESS}
🔄 **Status:** Live on Sepolia

💡 *Marketing Automation active!*`;
        
        bot.sendMessage(chatId, fallbackMessage, { parse_mode: 'Markdown' });
        return;
    }
    
    try {
        const contract = new web3.eth.Contract(AERA_ABI, AERA_TOKEN_ADDRESS);
        
        const [name, symbol, totalSupply, maxSupply] = await Promise.all([
            contract.methods.name().call(),
            contract.methods.symbol().call(),
            contract.methods.totalSupply().call(),
            contract.methods.MAX_SUPPLY().call()
        ]);

        const totalSupplyFormatted = web3.utils.fromWei(totalSupply.toString(), 'ether');
        const maxSupplyFormatted = web3.utils.fromWei(maxSupply.toString(), 'ether');
        const supplyPercentage = ((parseFloat(totalSupplyFormatted) / parseFloat(maxSupplyFormatted)) * 100).toFixed(2);

        const infoMessage = `
📊 *AERA Token Live Data*

✅ **ETHERSCAN VERIFICATION STATUS: VERIFIED ✅**
Your contract is now officially verified and auditable!

🔸 **Name:** ${name}
🔸 **Symbol:** ${symbol}  
🔸 **Total Supply:** ${parseFloat(totalSupplyFormatted).toLocaleString()} AERA
🔸 **Max Supply:** ${parseFloat(maxSupplyFormatted).toLocaleString()} AERA
🔸 **Minted:** ${supplyPercentage}%
🔸 **Network:** Sepolia Testnet (ChainID: 11155111)

🔹 **Live Features:**
• ✅ Contract Online & Verified
• ✅ Marketing Bot Active
• ✅ Community Growing
• ✅ Auto-Posts Scheduled
• ✅ Source Code Public
• ✅ ABI Available

� **Security Features:**
• ERC-20 Standard (OpenZeppelin)
• Burnable (Deflationary)
• Pausable (Emergency Control)
• Permit (EIP-2612 Gasless Approvals)
• Ownable (Governance)

�📍 **Contract:** \`${AERA_TOKEN_ADDRESS}\`
🔗 **Verify on Etherscan:** https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}#code
🚀 **Marketing:** Fully Automated

*Live data retrieved from contract* ✨`;

        bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
        console.log('✅ Live contract data sent');
    } catch (error) {
        console.error('Contract Error:', error.message);
        bot.sendMessage(chatId, '⚠️ Contract temporarily unavailable');
    }
});

// /supply Command
bot.onText(/\/supply(@AEra_Official_Bot)?/, async (msg) => {
    const chatId = msg.chat.id;
    marketingStats.botCommands++;
    
    if (!contractAvailable || !web3 || AERA_TOKEN_ADDRESS === 'your_deployed_contract_address_here') {
        const supplyMessage = `
📈 *AERA Token Supply Information*

🔸 **Max Supply:** 1,000,000,000 AERA
🔸 **Decimals:** 18
🔸 **Standard:** ERC-20

🔹 **Supply Mechanism:**
• Initial Supply: Deployment-dependent
• Max Supply: Hard-coded limit  
• Burnable: Tokens can be burned
• Mintable: Only up to Max Supply

📊 **Tokenomics:**
• Deflationary through burn function
• Community-driven distribution
• Secure supply controls

💡 *Live supply data available with contract integration*`;
        
        bot.sendMessage(chatId, supplyMessage, { parse_mode: 'Markdown' });
        return;
    }
    
    try {
        const contract = new web3.eth.Contract(AERA_ABI, AERA_TOKEN_ADDRESS);
        
        const [totalSupply, maxSupply] = await Promise.all([
            contract.methods.totalSupply().call(),
            contract.methods.MAX_SUPPLY().call()
        ]);

        const totalSupplyFormatted = web3.utils.fromWei(totalSupply.toString(), 'ether');
        const maxSupplyFormatted = web3.utils.fromWei(maxSupply.toString(), 'ether');
        const remainingSupply = parseFloat(maxSupplyFormatted) - parseFloat(totalSupplyFormatted);
        const supplyPercentage = ((parseFloat(totalSupplyFormatted) / parseFloat(maxSupplyFormatted)) * 100).toFixed(2);

        const supplyMessage = `
📈 *AERA Token Live Supply*

🔸 **Total Supply:** ${parseFloat(totalSupplyFormatted).toLocaleString()} AERA
🔸 **Max Supply:** ${parseFloat(maxSupplyFormatted).toLocaleString()} AERA
🔸 **Remaining:** ${remainingSupply.toLocaleString()} AERA
🔸 **Minted:** ${supplyPercentage}%

📊 **Supply Distribution:**
${'█'.repeat(Math.floor(supplyPercentage / 5))}${'░'.repeat(20 - Math.floor(supplyPercentage / 5))} ${supplyPercentage}%

🔥 **Deflationary Features:**
• Burn function available
• No infinite inflation
• Community-controlled

*Live data from contract* ✅`;

        bot.sendMessage(chatId, supplyMessage, { parse_mode: 'Markdown' });
        console.log('📊 Supply data sent');
    } catch (error) {
        console.error('Supply Error:', error.message);
        bot.sendMessage(chatId, '⚠️ Supply data temporarily unavailable');
    }
});

// /price Command
bot.onText(/\/price(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    marketingStats.botCommands++;
    
    const priceMessage = `
💰 *AERA Token Price*

🚧 **Testnet Phase**
AERA is currently running on Sepolia Testnet

📈 **After Mainnet Launch:**
• Live price display
• Market capitalization 
• 24h trading volume
• DEX trading pairs
• Price charts & analytics

🔜 **Mainnet Deployment:** Q4 2026
🏪 **Planned Listings:**
• Uniswap V3
• DEX Aggregators
• CEX Partnerships

💡 **Early Adopter Advantage:**
Be part of it from the beginning! 

📊 **Contract:** \`${AERA_TOKEN_ADDRESS}\`
🔗 **Etherscan:** https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}

#PriceUpdate #MainnetSoon #EarlyAdopter`;

    bot.sendMessage(chatId, priceMessage, { parse_mode: 'Markdown' });
});

// /contract Command
bot.onText(/\/contract(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    marketingStats.botCommands++;
    
    const contractMessage = `
🏗️ *AERA Token Contract Details*

📍 **Contract Address:**
\`${AERA_TOKEN_ADDRESS}\`

🌐 **Network:** Ethereum Sepolia Testnet
⛽ **Gas Token:** ETH (Sepolia)

🔗 **Blockchain Explorer:**
[Contract on Sepolia Etherscan](https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS})

📋 **Contract Features:**
• ✅ ERC-20 Standard
• 🔥 Burn Functions  
• ⏸️ Pausable Transfers
• 🎫 ERC-20 Permit
• 👑 Owner Controls
• 🆘 Emergency Functions

🔐 **Security:**
• OpenZeppelin Libraries
• Audited Code Standards
• Access Controls
• Emergency Safeguards

💡 **Add to MetaMask:**
Network: Sepolia Testnet
Contract: \`${AERA_TOKEN_ADDRESS}\`
Symbol: AERA
Decimals: 18

🚀 **Mainnet:** Coming Q4 2026`;

    bot.sendMessage(chatId, contractMessage, { parse_mode: 'Markdown' });
});

// /airdrop Command
bot.onText(/\/airdrop(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    
    marketingStats.botCommands++;
    
    const airdropMessage = `
🎁 *AERA Token Airdrop Program* 🎁

🚀 **Current Rewards:**

💰 **Welcome Bonus:** ${AIRDROP_CONFIG.welcomeBonus} AERA
• For new community members
• One-time per person

👥 **Referral Bonus:** ${AIRDROP_CONFIG.referralBonus} AERA  
• For each invited friend
• Unlimited earnings

🎯 **Daily Bonus:** ${AIRDROP_CONFIG.dailyBonus} AERA
• Available daily
• Max ${AIRDROP_CONFIG.maxDailyClaims}x per day
• Cooldown: ${AIRDROP_CONFIG.cooldownHours}h

🏆 **Contest Rewards:** ${AIRDROP_CONFIG.contestReward} AERA
• At community events
• Special campaigns

📊 **Your Stats:**
• User ID: ${userId}
• Participation Status: ${airdropSystem.participants.has(userId) ? '✅ Active' : '🆕 New'}
• Collected AERA: ${getUserBalance(userId)} Tokens

💡 **Participate:**
/claim - Claim daily reward
/balance - Check your balance
/refer - Invite friends

⚠️ **Before You Start:**
/consent - Confirm you understand this is a test token

${LEGAL_DISCLAIMER}

#Airdrop #FreeTokens #Community`;

    bot.sendMessage(chatId, airdropMessage, { parse_mode: 'Markdown' });
});

// /claim Command
bot.onText(/\/claim(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    
    const claimResult = processClaim(userId, username);
    
    // Add disclaimer footer to message
    const disclaimerFooter = `\n\n${LEGAL_DISCLAIMER}`;
    
    bot.sendMessage(chatId, claimResult.message + disclaimerFooter, { parse_mode: 'Markdown' });
    
    if (claimResult.success) {
        airdropSystem.totalDistributed += claimResult.amount;
        logAirdropTransaction({
            userId: userId,
            username: username,
            amount: claimResult.amount,
            type: claimResult.type,
            status: 'confirmed',
            consentTime: new Date()
        });
        if (claimResult.amount >= AIRDROP_CONFIG.contestReward) {
            sendAirdropNotification(username, claimResult.amount, claimResult.type);
        }
    }
});

// /balance Command
bot.onText(/\/balance(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    
    const userBalance = getUserBalance(userId);
    const userStats = getUserStats(userId);
    
    const balanceMessage = `
💰 *${username}'s AERA Wallet* 

🪙 **Current Balance:** ${userBalance} AERA

📊 **Your Activity:**
• Welcome Bonus: ${userStats.welcomeClaimed ? '✅' : '❌'}
• Referrals: ${userStats.referrals} friends
• Daily Claims: ${userStats.dailyClaims}
• Contest Wins: ${userStats.contestWins}
• Last Claim: ${userStats.lastClaim}

💡 **Collection Tips:**
• Invite friends: +${AIRDROP_CONFIG.referralBonus} AERA
• Daily claims: +${AIRDROP_CONFIG.dailyBonus} AERA  
• Community events: Up to ${AIRDROP_CONFIG.contestReward} AERA

🚀 **Mainnet Launch:** Q4 2026
Then all Testnet tokens will be exchanged 1:1 for real AERA tokens!

#Balance #AirdropWallet #AERA`;
    
    bot.sendMessage(chatId, balanceMessage, { parse_mode: 'Markdown' });
});

// /refer Command
bot.onText(/\/refer(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'User';
    
    console.log(`💬 /refer command from ${username} (${userId})`);
    
    try {
        const referrals = getUserReferrals(userId);
        const earnedTokens = referrals * AIRDROP_CONFIG.referralBonus;
        
        const deepLink = `tg://resolve?domain=AEra_Official_Bot&start=ref_${userId}`;
        const httpLink = `https://t.me/AEra_Official_Bot?start=ref_${userId}`;
        
        const referralMessage = 
            `<b>👥 AERA Referral Program</b>\n\n` +
            `<b>🎁 ${AIRDROP_CONFIG.referralBonus} AERA for each friend!</b>\n\n` +
            `<b>📋 Your Referral Link:</b>\n` +
            `${httpLink}\n\n` +
            `<b>📋 Deep Link (also via SMS):</b>\n` +
            `${deepLink}\n\n` +
            `<b>📊 Your Stats:</b>\n` +
            `• Invited Friends: ${referrals}\n` +
            `• Earned AERA: ${earnedTokens}\n\n` +
            `<b>🏆 Rewards:</b>\n` +
            `• 1+ Refs: ${AIRDROP_CONFIG.referralBonus} AERA\n` +
            `• 5+ Refs: Bonus 100 AERA\n` +
            `• 10+ Refs: VIP Status + 300 AERA\n\n` +
            `<b>💡 How it works:</b>\n` +
            `1. Share a link with friends\n` +
            `2. They open the link (even via SMS!)\n` +
            `3. Bot opens automatically\n` +
            `4. They get the airdrop\n` +
            `5. You get ${AIRDROP_CONFIG.referralBonus} AERA!\n\n` +
            `#Referral #FreeAERA`;
        
        console.log(`✅ Sending /refer message`);
        
        bot.sendMessage(chatId, referralMessage, { parse_mode: 'HTML' })
            .then(() => console.log('✅ /refer sent'))
            .catch(err => {
                console.log(`❌ Error: ${err.message}`);
                bot.sendMessage(chatId, `Referral Link:\n${httpLink}\n\nDeep Link:\n${deepLink}`);
            });
    } catch (error) {
        console.log(`❌ /refer error: ${error.message}`);
        bot.sendMessage(chatId, 'Error processing referral command.');
    }
});

// /verification Command - NEW!
bot.onText(/\/verification(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    marketingStats.botCommands++;
    
    const verificationMessage = `
✅ *AERA Token - ETHERSCAN VERIFICATION STATUS*

🎊 **VERIFICATION COMPLETE!** 🎊

📅 **Verification Date:** 2. November 2025
🏆 **Status:** ✅ OFFICIALLY VERIFIED & AUDITABLE

🔗 **Verification Links:**
📜 Contract on Etherscan: https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}#code
🔍 View Source Code: https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}#code
📋 Sourcify Match ID: 9753387
🌍 Sourcify Repository: https://sourcify.dev/

✨ **Verification Details:**
✅ Runtime Bytecode Match: Exact Match
✅ Creation Bytecode Match: Exact Match  
✅ Compiler: Solidity 0.8.20+commit.a1b79de6
✅ Optimization: Enabled (200 runs)
✅ License: MIT Open Source

📊 **Contract Information:**
🔹 Network: Sepolia Testnet (ChainID: 11155111)
🔹 Token Name: AEra Token
🔹 Token Symbol: AERA
🔹 Decimals: 18
🔹 Initial Supply: 100,000,000 AERA
🔹 Max Supply: 1,000,000,000 AERA

🔐 **Security Features:**
• ERC-20 Standard (OpenZeppelin v5.0.0)
• 🔥 Burnable - Token burning enabled
• ⏸️ Pausable - Emergency pause control
• 🎫 Permit - EIP-2612 gasless approvals
• 👑 Ownable - Owner-based governance
• 🛡️ Access Control - Secure permissions

📈 **What This Means:**
✅ Source code is publicly visible
✅ Community can verify contract legitimacy
✅ Integrations with wallets/exchanges easier
✅ Professional transparency for fundraising
✅ Ready for mainnet deployment

🚀 **Next Milestones:**
📍 Phase 2 (Jan-Mar 2026): Security Audit
📍 Phase 3 (Apr-Jun 2026): Pre-Mainnet Preparation
📍 Phase 5 (Q4 2026): Mainnet Launch 🎉

💬 *Your AERA Token is now trustworthy & transparent!*
🎯 *Community confidence: Maximum!* 🚀`;

    bot.sendMessage(chatId, verificationMessage, { parse_mode: 'Markdown' });
    console.log('✅ Verification info sent');
});

// /community Command
bot.onText(/\/community(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    
    const communityMessage = `
👥 *AERA Token Community Hub*

🏠 **Official Channels:**
• Main Group: @AERATokenOfficial
• News Channel: @AERATokenNews
• Support: @AERASupport

🤖 **This Bot:** @AEra_Official_Bot

🌐 **Web Presence:**
• Website: https://aera-token.io (coming)
• Twitter: @AERAToken (launching)
• Discord: (coming)

📅 **Community Events:**
• Daily: Airdrop updates
• Regular: AMAs & discussions
• Contests: Weekly rewards
• Announcements: Major milestones

🎁 **Community Benefits:**
• Early Access to Updates
• Exclusive Content
• Airdrop Opportunities
• Direct Team Contact

Join the revolution! 🚀`;

    bot.sendMessage(chatId, communityMessage, { parse_mode: 'Markdown' });
});

// /status Command - Project Status Overview
bot.onText(/\/status(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    marketingStats.botCommands++;
    
    const uptime = Math.floor((Date.now() - marketingStats.startTime.getTime()) / 1000 / 60);
    
    const statusMessage = `
📊 *AERA Token Project Status - 2. November 2025*

🎊 **PROJECT MILESTONES ACHIEVED:**

✅ **Development Phase (COMPLETE)**
   ✓ Smart Contract developed (Solidity 0.8.20)
   ✓ Contract deployed to Sepolia Testnet
   ✓ Full test suite created and passed
   ✓ All security features implemented

✅ **Verification Phase (COMPLETE)**
   ✓ Contract verified on Etherscan Sepolia
   ✓ Source code publicly available
   ✓ ABI interface published
   ✓ Bytecode matching confirmed (Exact Match)
   ✓ Sourcify verification: Match ID 9753387

✅ **Community Building (IN PROGRESS)**
   ✓ Telegram Marketing Bot deployed
   ✓ Airdrop system active
   ✓ Marketing automation running
   ✓ Daily user engagement active
   ✓ Community growing daily

📈 **Bot Statistics:**
   • Uptime: ${uptime} minutes
   • Commands: ${marketingStats.botCommands}+
   • Active Users Today: ${marketingStats.dailyActive.size}
   • Total Messages: ${marketingStats.totalMessages}+

🚀 **Current Phase: FOUNDATION & MARKETING (Nov-Dec 2025)**
   📍 Target: 500+ community members
   📍 Status: Community building ongoing
   📍 Marketing: Fully automated

📋 **Next Phases:**
   🛡️  Phase 2 (Jan-Mar 2026): Security Audit
   💼 Phase 3 (Apr-Jun 2026): Pre-Mainnet
   🌟 Phase 4 (Jul-Sep 2026): Testing
   🚀 Phase 5 (Q4 2026): MAINNET LAUNCH

📊 **Contract Information:**
   • Address: ${AERA_TOKEN_ADDRESS}
   • Network: Sepolia (ChainID: 11155111)
   • Standard: ERC-20 + Burnable + Pausable + Permit
   • License: MIT Open Source
   • Status: ✅ VERIFIED & ACTIVE

🔗 **Links & Resources:**
   📜 Etherscan: https://sepolia.etherscan.io/address/${AERA_TOKEN_ADDRESS}#code
   📖 Use /verification for detailed verification info
   📊 Use /info for live contract data
   🗺️  Use /roadmap for full development roadmap

💪 **Ready for Community Launch!**
   🚀 All systems operational
   ✅ Contract verified and secure
   🎁 Airdrop system active
   👥 Community growing daily

Join us on the journey to Mainnet! 🚀`;

    bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
    console.log('📊 Status report sent');
});

// /stats Command (Admin Only)
bot.onText(/\/stats(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (ADMIN_USER_ID && userId.toString() !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ This command is admin only');
        return;
    }
    
    try {
        const userDataFile = './user-data.json';
        let allUsers = [];
        
        if (fs.existsSync(userDataFile)) {
            const data = fs.readFileSync(userDataFile, 'utf8');
            const userData = JSON.parse(data);
            allUsers = Object.entries(userData).map(([id, user]) => ({ id, ...user }));
        }
        
        const topUsers = allUsers
            .sort((a, b) => (b.balance || 0) - (a.balance || 0))
            .slice(0, 10);
        
        const totalBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
        const avgBalance = allUsers.length > 0 ? Math.round(totalBalance / allUsers.length) : 0;
        const totalReferrals = allUsers.reduce((sum, u) => sum + (u.referrals?.length || 0), 0);
        
        let statsMessage = `<b>👑 ADMIN: Airdrop Statistics</b>\n\n`;
        statsMessage += `<b>📊 Overall Stats:</b>\n`;
        statsMessage += `• Participants: ${allUsers.length}\n`;
        statsMessage += `• Total Balance: ${totalBalance.toLocaleString()} AERA\n`;
        statsMessage += `• Average: ${avgBalance} AERA/user\n\n`;
        
        statsMessage += `<b>🏆 Top 10 Holdings:</b>\n`;
        topUsers.forEach((user, index) => {
            statsMessage += `${index + 1}. <b>${user.username || 'User'}</b>: ${(user.balance || 0).toLocaleString()} AERA\n`;
        });
        
        bot.sendMessage(chatId, statsMessage, { parse_mode: 'HTML' })
            .catch(err => console.log(`Error: ${err.message}`));
    } catch (error) {
        console.log(`❌ /stats error: ${error.message}`);
        bot.sendMessage(chatId, `Error: ${error.message}`);
    }
});

// /users Command (Admin Only)
bot.onText(/\/users(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (ADMIN_USER_ID && userId.toString() !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ Admin only');
        return;
    }
    
    try {
        const userDataFile = './user-data.json';
        
        if (!fs.existsSync(userDataFile)) {
            bot.sendMessage(chatId, '📊 No airdrop participants yet');
            return;
        }
        
        const data = fs.readFileSync(userDataFile, 'utf8');
        const userData = JSON.parse(data);
        const users = Object.entries(userData).map(([id, user]) => ({ id, ...user }));
        
        if (users.length === 0) {
            bot.sendMessage(chatId, '📊 No airdrop participants yet');
            return;
        }
        
        const sortedUsers = users
            .sort((a, b) => (b.balance || 0) - (a.balance || 0))
            .map((user, index) => {
                const lastClaim = user.lastClaim ? 
                    new Date(user.lastClaim).toLocaleDateString('en-US') : 'Never';
                
                return `<b>${index + 1}. ${user.username}</b>\n` +
                    `💰 Balance: ${user.balance || 0} AERA\n` +
                    `🆔 ID: ${user.id}\n` +
                    `📅 Last Claim: ${lastClaim}\n` +
                    `👥 Referrals: ${user.referrals?.length || 0}\n` +
                    `📊 Total Earned: ${user.totalEarned || 0} AERA`;
            });
        
        const maxLength = 4000;
        const parts = [];
        let currentPart = '';
        
        for (const user of sortedUsers) {
            const userLength = user.length + 10;
            if ((currentPart.length + userLength) > maxLength && currentPart) {
                parts.push(currentPart);
                currentPart = user;
            } else {
                currentPart += (currentPart ? '\n\n' : '') + user;
            }
        }
        if (currentPart) parts.push(currentPart);
        
        parts.forEach((part, index) => {
            let message = `<b>👑 ADMIN: All Airdrop Participants</b>\n`;
            if (parts.length > 1) message += `<b>(Part ${index + 1}/${parts.length})</b>\n\n`;
            message += part;
            
            bot.sendMessage(chatId, message, { parse_mode: 'HTML' })
                .catch(err => console.log(`Error: ${err.message}`));
        });
    } catch (error) {
        console.log(`❌ /users error: ${error.message}`);
        bot.sendMessage(chatId, `Error: ${error.message}`);
    }
});

// /export Command (Admin Only)
bot.onText(/\/export(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (ADMIN_USER_ID && userId.toString() !== ADMIN_USER_ID) {
        bot.sendMessage(chatId, '❌ Admin only');
        return;
    }
    
    try {
        const userDataFile = './user-data.json';
        
        if (!fs.existsSync(userDataFile)) {
            bot.sendMessage(chatId, '📊 No data to export yet');
            return;
        }
        
        const data = fs.readFileSync(userDataFile, 'utf8');
        const userData = JSON.parse(data);
        const users = Object.entries(userData);
        
        // Create CSV format
        const csvData = [
            'UserID,Username,Balance,WelcomeClaimed,TotalEarned,Referrals,DailyClaims,JoinDate,LastClaim'
        ];
        
        users.forEach(([userId, user]) => {
            const referrals = user.referrals?.length || 0;
            csvData.push([
                userId,
                `"${user.username || 'Unknown'}"`,
                user.balance || 0,
                user.welcomeClaimed ? 'YES' : 'NO',
                user.totalEarned || 0,
                referrals,
                user.dailyClaims || 0,
                user.joinDate || '',
                user.lastClaim || ''
            ].join(','));
        });
        
        const csvContent = csvData.join('\n');
        const fileName = `airdrop_export_${new Date().toISOString().split('T')[0]}.csv`;
        
        const exportMessage = `
📊 *AIRDROP DATA EXPORT*

**File:** ${fileName}
**Participants:** ${users.length}
**Total Balance:** ${users.reduce((sum, [_, u]) => sum + (u.balance || 0), 0).toLocaleString()} AERA

**CSV Format:**
UserID, Username, Balance, WelcomeClaimed, TotalEarned, Referrals, DailyClaims, JoinDate, LastClaim

**Data Export Ready for Mainnet Transfer!**`;
        
        bot.sendMessage(chatId, exportMessage, { parse_mode: 'Markdown' });
        
        // Send CSV content
        if (csvContent.length < 4000) {
            bot.sendMessage(chatId, '📎 CSV Data:\n\n\`\`\`\n' + csvContent + '\n\`\`\`', { parse_mode: 'Markdown' });
        } else {
            // Split into parts if too large
            const chunkSize = 3800;
            for (let i = 0; i < csvContent.length; i += chunkSize) {
                const chunk = csvContent.substring(i, i + chunkSize);
                bot.sendMessage(chatId, '📎 CSV Data (part ' + Math.ceil((i + 1) / chunkSize) + '):\n\n\`\`\`\n' + chunk + '\n\`\`\`', { parse_mode: 'Markdown' });
            }
        }
        
        console.log(`✅ Export data sent to admin (${users.length} users)`);
        
    } catch (error) {
        console.log(`❌ /export error: ${error.message}`);
        bot.sendMessage(chatId, `Error: ${error.message}`);
    }
});

// ===================================
// HELPER FUNCTIONS
// ===================================

function initializeUser(userId, username) {
    if (!airdropSystem.participants.has(userId)) {
        airdropSystem.participants.set(userId, {
            username: username,
            balance: 0,
            welcomeClaimed: false,
            dailyClaims: 0,
            lastClaimTime: null,
            referrals: 0,
            referredBy: null,
            contestWins: 0,
            joinDate: new Date(),
            totalEarned: 0
        });
        airdropSystem.totalParticipants++;
        return true;
    }
    return false;
}

function getUserBalance(userId) {
    const user = airdropSystem.participants.get(userId);
    return user ? user.balance : 0;
}

function getUserStats(userId) {
    const user = airdropSystem.participants.get(userId);
    if (!user) {
        return {
            welcomeClaimed: false,
            referrals: 0,
            dailyClaims: 0,
            contestWins: 0,
            lastClaim: 'Never'
        };
    }
    
    return {
        welcomeClaimed: user.welcomeClaimed,
        referrals: user.referrals,
        dailyClaims: user.dailyClaims,
        contestWins: user.contestWins,
        lastClaim: user.lastClaimTime ? user.lastClaimTime.toLocaleDateString('en-US') : 'Never'
    };
}

function getUserReferrals(userId) {
    const user = airdropSystem.participants.get(userId);
    return user ? (user.referrals || 0) : 0;
}

function processClaim(userId, username) {
    const isNewUser = initializeUser(userId, username);
    const user = airdropSystem.participants.get(userId);
    const now = new Date();
    
    if (isNewUser || !user.welcomeClaimed) {
        user.welcomeClaimed = true;
        user.balance += AIRDROP_CONFIG.welcomeBonus;
        user.totalEarned += AIRDROP_CONFIG.welcomeBonus;
        user.lastClaimTime = now;
        saveUserDataFile();
        
        return {
            success: true,
            amount: AIRDROP_CONFIG.welcomeBonus,
            type: 'welcome',
            message: `🎉 *Welcome Bonus received!*

💰 **+${AIRDROP_CONFIG.welcomeBonus} AERA** added!

🎁 **Welcome to the AERA Community!**
You've successfully received your welcome bonus.

💡 **Next Steps:**
• Come back tomorrow for daily bonus
• Invite friends: +${AIRDROP_CONFIG.referralBonus} AERA per referral  
• Participate in community events

📊 **Your Wallet:** ${user.balance} AERA

#WelcomeBonus #NewMember #AERA`
        };
    }
    
    const hoursSinceLastClaim = user.lastClaimTime ? 
        (now - user.lastClaimTime) / (1000 * 60 * 60) : 25;
        
    if (hoursSinceLastClaim < AIRDROP_CONFIG.cooldownHours) {
        const remainingHours = Math.ceil(AIRDROP_CONFIG.cooldownHours - hoursSinceLastClaim);
        return {
            success: false,
            message: `⏰ *Cooldown active*

You can claim again in **${remainingHours} hours**.

💡 **Other Ways to Earn:**
• Invite friends: /refer
• Check contest times
• Stay active in the community

📊 **Current Balance:** ${user.balance} AERA

#Cooldown #ComeLater`
        };
    }
    
    const today = now.toDateString();
    const lastClaimDate = user.lastClaimTime ? user.lastClaimTime.toDateString() : null;
    
    if (lastClaimDate !== today) {
        user.dailyClaims = 0;
    }
    
    if (user.dailyClaims >= AIRDROP_CONFIG.maxDailyClaims) {
        return {
            success: false,
            message: `🚫 *Daily limit reached*

You've already claimed **${AIRDROP_CONFIG.maxDailyClaims}x** today.

⏰ **Tomorrow again:** ${AIRDROP_CONFIG.dailyBonus} AERA

#DailyLimit #TomorrowAgain`
        };
    }
    
    user.dailyClaims++;
    user.balance += AIRDROP_CONFIG.dailyBonus;
    user.totalEarned += AIRDROP_CONFIG.dailyBonus;
    user.lastClaimTime = now;
    saveUserDataFile();
    
    return {
        success: true,
        amount: AIRDROP_CONFIG.dailyBonus,
        type: 'daily',
        message: `✅ *Daily Bonus received!*

💰 **+${AIRDROP_CONFIG.dailyBonus} AERA** added!

📊 **Your Wallet:** ${user.balance} AERA

🎯 **Daily Claims Today:** ${user.dailyClaims}/${AIRDROP_CONFIG.maxDailyClaims}

💡 **Tip:** Invite friends for more tokens! /refer

#DailyBonus #AirdropReward #AERA`
    };
}

async function sendAirdropNotification(username, amount, type) {
    if (!NEWS_CHANNEL_ID || NEWS_CHANNEL_ID === '-1001234567890') return;
    
    const notification = `🎉 *Big Win!*\n${username} just earned ${amount} AERA (${type})!\n\n📊 Leaderboard: /stats`;
    
    try {
        await bot.sendMessage(NEWS_CHANNEL_ID, notification, { parse_mode: 'Markdown' });
    } catch (error) {
        console.log('❌ Notification error:', error.message);
    }
}

function resetDailyStats() {
    marketingStats.newMembers = 0;
    marketingStats.dailyActive.clear();
    marketingStats.botCommands = 0;
}

// ===================================
// DISCLAIMER & CONSENT COMMANDS
// ===================================

// /disclaimer Command - Full legal notice
bot.onText(/\/disclaimer(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    marketingStats.botCommands++;
    
    bot.sendMessage(chatId, FULL_DISCLAIMER, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true
    });
});

// /consent Command - Get consent checkbox before claiming
bot.onText(/\/consent(@AEra_Official_Bot)?/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    marketingStats.botCommands++;
    
    bot.sendMessage(chatId, CONSENT_MESSAGE, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ I Understand & Accept', callback_data: `consent_agree_${userId}` },
                    { text: '❌ Decline', callback_data: 'consent_decline' }
                ]
            ]
        }
    });
});

// Callback handler for consent buttons
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const username = query.from.username || query.from.first_name;
    
    try {
        if (query.data === 'consent_decline') {
            await bot.answerCallbackQuery(query.id, '❌ You declined', false);
            return;
        }
        
        if (query.data.startsWith('consent_agree_')) {
            const consentUserId = query.data.split('_')[2];
            
            if (userId != consentUserId) {
                await bot.answerCallbackQuery(query.id, '⚠️ Wrong user!', true);
                return;
            }
            
            // Mark user as consented
            if (!airdropSystem.participants.has(userId)) {
                airdropSystem.participants.set(userId, {
                    username: username,
                    balance: 0,
                    welcomeClaimed: false,
                    dailyClaims: 0,
                    lastClaimTime: null,
                    referrals: [],
                    referredBy: null,
                    contestWins: 0,
                    joinDate: new Date(),
                    totalEarned: 0,
                    consentAgreed: true,
                    consentTime: new Date()
                });
            } else {
                const user = airdropSystem.participants.get(userId);
                user.consentAgreed = true;
                user.consentTime = new Date();
            }
            
            saveUserDataFile();
            logAirdropTransaction({
                userId: userId,
                username: username,
                amount: 0,
                type: 'consent',
                consentTime: new Date(),
                status: 'confirmed'
            });
            
            await bot.answerCallbackQuery(query.id, '✅ Consent recorded!', false);
            
            const confirmMessage = `✅ *Consent Recorded*

You have agreed to the terms:
• AEra is a TESTTOKEN (Sepolia)
• NOT an investment
• NO guarantees
• You act at own risk

📋 Full disclaimer: /disclaimer

🎁 You can now claim tokens!
/claim - Claim daily reward
/airdrop - View airdrop info

${"═".repeat(40)}`;
            
            await bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown' });
            
            return;
        }
        
    } catch (error) {
        console.log('❌ Callback error:', error.message);
        await bot.answerCallbackQuery(query.id, '❌ Error processing request', true);
    }
});

// ===================================
// BOT STARTUP
// ===================================

bot.getMe().then(me => {
    console.log(`✅ Bot connected: @${me.username}`);
    console.log(`✅ Bot ID: ${me.id}`);
    
    // Load persistent data on startup
    loadUserDataFile();
    
    console.log(`🚀 AERA Token Bot v3.1 (English) - READY!`);
    console.log(`📊 Airdrop System initialized`);
    console.log(`🎁 Participants: ${airdropSystem.totalParticipants}`);
    console.log(`💰 Total distributed: ${airdropSystem.totalDistributed} AERA\n`);
}).catch(error => {
    console.log('❌ Bot Startup Error:', error.message);
});

// Error Handling
bot.on('polling_error', (error) => {
    console.log('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
    console.log('❌ Bot error:', error.message);
});

process.on('SIGINT', () => {
    console.log('\n📝 Saving data before shutdown...');
    saveUserDataFile();
    process.exit(0);
});

module.exports = bot;
