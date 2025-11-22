/**
 * User Service - Manages user-wallet relationships and airdrop tracking
 * Persistent storage with SQLite
 */

const Database = require('better-sqlite3');
const path = require('path');

class UserService {
    constructor(dbPath = './data/users.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.initialize();
    }

    /**
     * Initialize SQLite database and create tables
     */
    initialize() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            const fs = require('fs');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Connect to database
            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL');

            // Create users table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS users (
                    userId INTEGER PRIMARY KEY,
                    walletAddress TEXT UNIQUE,
                    sessionTopic TEXT,
                    airdropStatus TEXT DEFAULT 'pending',
                    airdropTxHash TEXT,
                    airdropAmount TEXT DEFAULT '0.5',
                    airdropTimestamp DATETIME,
                    connectedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    lastActive DATETIME DEFAULT CURRENT_TIMESTAMP,
                    isActive INTEGER DEFAULT 1
                )
            `);

            // Create sessions table for WalletConnect
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS sessions (
                    userId INTEGER PRIMARY KEY,
                    sessionTopic TEXT UNIQUE,
                    sessionData TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(userId) REFERENCES users(userId)
                )
            `);

            // Create airdrop log table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS airdrop_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER,
                    walletAddress TEXT,
                    amount TEXT,
                    txHash TEXT,
                    status TEXT,
                    errorMessage TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(userId) REFERENCES users(userId)
                )
            `);

            console.log('✅ UserService database initialized');
            return true;
        } catch (error) {
            console.error('❌ UserService initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Register or get user with wallet
     * Returns: { userId, walletAddress, isNew, airdropPending }
     */
    registerUserWallet(userId, walletAddress, sessionTopic) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM users WHERE userId = ?
            `);
            const existingUser = stmt.get(userId);

            if (existingUser) {
                // User exists - check if wallet is the same
                const existingWallet = existingUser.walletAddress ? existingUser.walletAddress.toLowerCase() : null;
                const newWallet = walletAddress ? walletAddress.toLowerCase() : null;
                
                if (existingWallet && newWallet && existingWallet !== newWallet) {
                    return {
                        success: false,
                        error: 'User already connected to different wallet',
                        userId,
                        currentWallet: existingUser.walletAddress
                    };
                }

                // Update session and last active
                const updateStmt = this.db.prepare(`
                    UPDATE users 
                    SET sessionTopic = ?, lastActive = CURRENT_TIMESTAMP
                    WHERE userId = ?
                `);
                updateStmt.run(sessionTopic, userId);

                return {
                    success: true,
                    userId,
                    walletAddress: existingUser.walletAddress,
                    isNew: false,
                    airdropStatus: existingUser.airdropStatus,
                    airdropTxHash: existingUser.airdropTxHash
                };
            } else {
                // New user - create entry
                const insertStmt = this.db.prepare(`
                    INSERT INTO users (userId, walletAddress, sessionTopic, airdropStatus)
                    VALUES (?, ?, ?, ?)
                `);
                insertStmt.run(userId, walletAddress.toLowerCase(), sessionTopic, 'pending');

                return {
                    success: true,
                    userId,
                    walletAddress,
                    isNew: true,
                    airdropStatus: 'pending',
                    airdropTxHash: null
                };
            }
        } catch (error) {
            console.error('❌ registerUserWallet error:', error.message);
            return { success: false, error: error.message, currentWallet: null };
        }
    }

    /**
     * Check if user already received airdrop
     */
    hasReceivedAirdrop(userId) {
        try {
            const stmt = this.db.prepare(`
                SELECT airdropStatus, airdropTxHash FROM users WHERE userId = ?
            `);
            const result = stmt.get(userId);

            if (!result) return false;
            return result.airdropStatus === 'completed';
        } catch (error) {
            console.error('❌ hasReceivedAirdrop error:', error.message);
            return false;
        }
    }

    /**
     * Mark airdrop as sent
     */
    markAirdropSent(userId, txHash, amount = '0.5') {
        try {
            const updateStmt = this.db.prepare(`
                UPDATE users 
                SET airdropStatus = 'completed', airdropTxHash = ?, airdropAmount = ?, airdropTimestamp = CURRENT_TIMESTAMP
                WHERE userId = ?
            `);
            updateStmt.run(txHash, amount, userId);

            // Log to airdrop log
            const logStmt = this.db.prepare(`
                INSERT INTO airdrop_log (userId, walletAddress, amount, txHash, status)
                SELECT userId, walletAddress, ?, ?, 'completed'
                FROM users WHERE userId = ?
            `);
            logStmt.run(amount, txHash, userId);

            console.log(`✅ Airdrop marked as sent for user ${userId}: ${txHash}`);
            return true;
        } catch (error) {
            console.error('❌ markAirdropSent error:', error.message);
            return false;
        }
    }

    /**
     * Mark airdrop as failed
     */
    markAirdropFailed(userId, errorMessage) {
        try {
            const updateStmt = this.db.prepare(`
                UPDATE users 
                SET airdropStatus = 'failed'
                WHERE userId = ?
            `);
            updateStmt.run(userId);

            // Get wallet for logging
            const userStmt = this.db.prepare(`SELECT walletAddress FROM users WHERE userId = ?`);
            const user = userStmt.get(userId);

            // Log to airdrop log
            const logStmt = this.db.prepare(`
                INSERT INTO airdrop_log (userId, walletAddress, amount, status, errorMessage)
                VALUES (?, ?, '0.5', 'failed', ?)
            `);
            logStmt.run(userId, user?.walletAddress || 'unknown', errorMessage);

            console.log(`⚠️ Airdrop failed for user ${userId}: ${errorMessage}`);
            return true;
        } catch (error) {
            console.error('❌ markAirdropFailed error:', error.message);
            return false;
        }
    }

    /**
     * Get user wallet
     */
    getUserWallet(userId) {
        try {
            const stmt = this.db.prepare(`
                SELECT walletAddress, airdropStatus FROM users WHERE userId = ?
            `);
            return stmt.get(userId);
        } catch (error) {
            console.error('❌ getUserWallet error:', error.message);
            return null;
        }
    }

    /**
     * Get all users
     */
    getAllUsers() {
        try {
            const stmt = this.db.prepare(`
                SELECT userId, walletAddress, airdropStatus, connectedAt FROM users WHERE isActive = 1
            `);
            return stmt.all();
        } catch (error) {
            console.error('❌ getAllUsers error:', error.message);
            return [];
        }
    }

    /**
     * Get airdrop statistics
     */
    getAirdropStats() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    COUNT(*) as totalUsers,
                    SUM(CASE WHEN airdropStatus = 'completed' THEN 1 ELSE 0 END) as completedAirdrops,
                    SUM(CASE WHEN airdropStatus = 'pending' THEN 1 ELSE 0 END) as pendingAirdrops,
                    SUM(CASE WHEN airdropStatus = 'failed' THEN 1 ELSE 0 END) as failedAirdrops
                FROM users
                WHERE isActive = 1
            `);
            const result = stmt.get();
            
            // Map SQL column names to expected format
            return {
                total: result.totalUsers || 0,
                completed: result.completedAirdrops || 0,
                pending: result.pendingAirdrops || 0,
                failed: result.failedAirdrops || 0
            };
        } catch (error) {
            console.error('❌ getAirdropStats error:', error.message);
            // Return default stats on error
            return {
                total: 0,
                completed: 0,
                pending: 0,
                failed: 0
            };
        }
    }

    /**
     * Save session data
     */
    saveSession(userId, sessionTopic, sessionData) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO sessions (userId, sessionTopic, sessionData)
                VALUES (?, ?, ?)
            `);
            stmt.run(userId, sessionTopic, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('❌ saveSession error:', error.message);
            return false;
        }
    }

    /**
     * Get session data
     */
    getSession(userId) {
        try {
            const stmt = this.db.prepare(`
                SELECT sessionData FROM sessions WHERE userId = ?
            `);
            const result = stmt.get(userId);
            return result ? JSON.parse(result.sessionData) : null;
        } catch (error) {
            console.error('❌ getSession error:', error.message);
            return null;
        }
    }

    /**
     * Get user by Telegram ID with full record
     */
    getUserByTelegramId(userId) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM users WHERE userId = ?
            `);
            return stmt.get(userId);
        } catch (error) {
            console.error('❌ getUserByTelegramId error:', error.message);
            return null;
        }
    }

    /**
     * Remove session data
     */
    removeSession(userId) {
        try {
            const stmt = this.db.prepare(`
                DELETE FROM sessions WHERE userId = ?
            `);
            stmt.run(userId);
            return true;
        } catch (error) {
            console.error('❌ removeSession error:', error.message);
            return false;
        }
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ UserService database closed');
        }
    }
}

module.exports = UserService;
