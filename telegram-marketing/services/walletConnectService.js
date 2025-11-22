// Add crypto polyfill for WalletConnect
if (!global.crypto) {
    global.crypto = require('crypto').webcrypto;
}
if (!global.crypto.getRandomValues) {
    const crypto = require('crypto');
    global.crypto.getRandomValues = (array) => {
        const randomBytes = crypto.randomBytes(array.length);
        for (let i = 0; i < array.length; i++) {
            array[i] = randomBytes[i];
        }
        return array;
    };
}

const SignClient = require('@walletconnect/sign-client').default;
const { v4: uuid } = require('uuid');

class WalletConnectService {
    constructor() {
        this.client = null;
        this.sessions = new Map(); // userId -> session
        this.activeSessions = new Map(); // sessionId -> session details
        this.projectId = process.env.WALLETCONNECT_PROJECT_ID;
        this.initialized = false;
    }

    async initialize() {
        // Prevent double initialization
        if (this.initialized) {
            console.log('✅ WalletConnect already initialized');
            return;
        }

        try {
            this.client = await SignClient.init({
                projectId: this.projectId,
                metadata: {
                    name: 'AEra Token Community',
                    description: 'Community Voting & Governance',
                    url: 'https://github.com/AEra-Resonance/AEra-Token',
                    icons: ['https://avatars.githubusercontent.com/u/AEra-Resonance']
                }
            });

            // Restore existing sessions
            if (this.client.session.getAll().length > 0) {
                console.log(`✅ Restored ${this.client.session.getAll().length} WalletConnect sessions`);
                this.client.session.getAll().forEach(session => {
                    this.activeSessions.set(session.topic, session);
                });
            }

            // Setup event listeners
            this.client.on('session_update', this.handleSessionUpdate.bind(this));
            this.client.on('session_delete', this.handleSessionDelete.bind(this));

            this.initialized = true;
            console.log('✅ WalletConnect initialized');
        } catch (error) {
            console.error('❌ WalletConnect init failed:', error.message);
        }
    }

    async generateConnectionUri(userId) {
        if (!this.initialized) await this.initialize();

        try {
            const { uri, approval } = await this.client.connect({
                requiredNamespaces: {
                    eip155: {
                        methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign'],
                        chains: ['eip155:11155111'], // Sepolia
                        events: ['chainChanged', 'accountsChanged']
                    }
                }
            });

            // Store approval promise for user
            const sessionData = {
                userId,
                uri,
                approval,
                createdAt: Date.now(),
                status: 'pending'
            };

            this.sessions.set(userId, sessionData);

            return {
                uri,
                sessionId: userId,
                qrCode: uri // Can be converted to QR later
            };
        } catch (error) {
            console.error('❌ Connection URI generation failed:', error.message);
            throw error;
        }
    }

    async approveSession(userId) {
        const sessionData = this.sessions.get(userId);
        if (!sessionData) {
            throw new Error('Session nicht gefunden');
        }

        try {
            console.log(`⏳ Warte auf Wallet-Bestätigung für User ${userId}...`);
            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Wallet connection timeout - please try again')), 60000)
            );
            
            const session = await Promise.race([
                sessionData.approval(),
                timeoutPromise
            ]);
            
            console.log(`✅ Session genehmigt für User ${userId}`);
            console.log(`📋 Session Topic: ${session.topic}`);
            
            this.activeSessions.set(session.topic, session);
            sessionData.status = 'active';
            sessionData.topic = session.topic;
            
            // Extract address safely
            if (session.namespaces && session.namespaces.eip155 && session.namespaces.eip155.accounts) {
                sessionData.address = session.namespaces.eip155.accounts[0].split(':')[2];
                console.log(`💳 Adresse: ${sessionData.address}`);
            }

            return {
                success: true,
                address: sessionData.address,
                sessionTopic: session.topic,
                chainId: session.namespaces.eip155.chains[0]
            };
        } catch (error) {
            console.error('❌ Session-Genehmigung fehlgeschlagen:', error.message);
            throw error;
        }
    }

    getUserSession(userId) {
        return this.sessions.get(userId);
    }

    getActiveSession(userId) {
        const sessionData = this.sessions.get(userId);
        if (!sessionData || !sessionData.topic) {
            return null;
        }
        return this.activeSessions.get(sessionData.topic);
    }

    disconnectSession(userId) {
        const sessionData = this.sessions.get(userId);
        if (!sessionData || !sessionData.topic) {
            return false;
        }

        try {
            this.client.disconnect({
                topic: sessionData.topic,
                reason: { code: 6000, message: 'User disconnected' }
            });

            this.activeSessions.delete(sessionData.topic);
            this.sessions.delete(userId);
            return true;
        } catch (error) {
            console.error('❌ Disconnect failed:', error.message);
            return false;
        }
    }

    handleSessionUpdate(event) {
        console.log('📝 Session updated:', event);
    }

    handleSessionDelete(event) {
        console.log('🔌 Session deleted:', event);
        // Clean up
        this.activeSessions.delete(event.topic);
    }
}

module.exports = new WalletConnectService();
