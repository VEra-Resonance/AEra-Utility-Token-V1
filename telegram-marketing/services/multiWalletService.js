const fs = require('fs');
const path = require('path');

class MultiWalletService {
    constructor() {
        this.userWallets = new Map(); // userId -> [{ topic, address, isPrimary, addedAt }]
        this.dataDir = path.join(__dirname, '../data');
        this.ensureDataDir();
        this.loadWallets();
    }

    ensureDataDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    addWallet(userId, walletAddress, topic, isPrimary = false) {
        if (!this.userWallets.has(userId)) {
            this.userWallets.set(userId, []);
        }

        const wallets = this.userWallets.get(userId);
        
        // Check if wallet already exists
        const existingIndex = wallets.findIndex(w => w.address.toLowerCase() === walletAddress.toLowerCase());
        if (existingIndex !== -1) {
            throw new Error('Wallet bereits hinzugefügt');
        }

        // Max 5 wallets per user
        if (wallets.length >= 5) {
            throw new Error('Max. 5 Wallets pro User');
        }

        // If this is the first wallet or should be primary, set others to secondary
        if (isPrimary || wallets.length === 0) {
            wallets.forEach(w => w.isPrimary = false);
        }

        wallets.push({
            address: walletAddress.toLowerCase(),
            topic,
            isPrimary: isPrimary || wallets.length === 0,
            addedAt: Date.now(),
            verified: true
        });

        this.saveWallets();
        return wallets;
    }

    removeWallet(userId, walletAddress) {
        const wallets = this.userWallets.get(userId);
        if (!wallets) {
            throw new Error('User hat keine Wallets');
        }

        const index = wallets.findIndex(w => w.address.toLowerCase() === walletAddress.toLowerCase());
        if (index === -1) {
            throw new Error('Wallet nicht gefunden');
        }

        const removed = wallets[index];
        wallets.splice(index, 1);

        // If removed wallet was primary and others exist, set first as primary
        if (removed.isPrimary && wallets.length > 0) {
            wallets[0].isPrimary = true;
        }

        this.saveWallets();
        return wallets;
    }

    getUserWallets(userId) {
        return this.userWallets.get(userId) || [];
    }

    getPrimaryWallet(userId) {
        const wallets = this.userWallets.get(userId) || [];
        return wallets.find(w => w.isPrimary) || wallets[0] || null;
    }

    getAllWalletAddresses(userId) {
        const wallets = this.userWallets.get(userId) || [];
        return wallets.map(w => w.address);
    }

    setPrimaryWallet(userId, walletAddress) {
        const wallets = this.userWallets.get(userId);
        if (!wallets) {
            throw new Error('User hat keine Wallets');
        }

        const wallet = wallets.find(w => w.address.toLowerCase() === walletAddress.toLowerCase());
        if (!wallet) {
            throw new Error('Wallet nicht gefunden');
        }

        wallets.forEach(w => w.isPrimary = false);
        wallet.isPrimary = true;

        this.saveWallets();
        return wallets;
    }

    saveWallets() {
        const data = Array.from(this.userWallets.entries()).map(([userId, wallets]) => [
            userId,
            wallets
        ]);

        fs.writeFileSync(
            path.join(this.dataDir, 'wallets.json'),
            JSON.stringify(data, null, 2)
        );
    }

    loadWallets() {
        const walletsFile = path.join(this.dataDir, 'wallets.json');
        if (fs.existsSync(walletsFile)) {
            const data = JSON.parse(fs.readFileSync(walletsFile, 'utf8'));
            data.forEach(([userId, wallets]) => {
                this.userWallets.set(userId, wallets);
            });
        }
    }
}

module.exports = new MultiWalletService();
