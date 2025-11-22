/**
 * Airdrop Service - Handles automated token transfers
 */

class AirdropService {
    constructor(web3, contractAddress, contractABI, senderAddress, privateKey) {
        this.web3 = web3;
        this.contractAddress = contractAddress;
        this.contractABI = contractABI;
        this.senderAddress = senderAddress;
        this.privateKey = privateKey;
        this.contract = null;
        this.airdropAmount = '0.5'; // 0.5 AERA
        this.transactionLog = [];
    }

    /**
     * Initialize the contract instance
     */
    initialize() {
        if (!this.contractAddress || !this.contractABI) {
            console.log('❌ Airdrop Service: Invalid contract configuration');
            return false;
        }
        
        try {
            this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
            console.log('✅ Airdrop Service initialized');
            return true;
        } catch (error) {
            console.error('❌ Airdrop initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Send airdrop to recipient address
     */
    async sendAirdrop(recipientAddress) {
        if (!this.contract) {
            console.log('⚠️ Airdrop Service not initialized');
            return { success: false, message: 'Service not initialized' };
        }

        if (!this.senderAddress || !this.privateKey) {
            console.log('⚠️ No sender configuration');
            return { success: false, message: 'No sender configured' };
        }

        try {
            // Validate recipient address
            if (!this.web3.utils.isAddress(recipientAddress)) {
                return { success: false, message: 'Invalid recipient address' };
            }

            // Convert amount to Wei
            const amountWei = this.web3.utils.toWei(this.airdropAmount, 'ether');

            // Build transfer data
            const transferData = this.contract.methods.transfer(recipientAddress, amountWei).encodeABI();

            // Get nonce
            const nonce = await this.web3.eth.getTransactionCount(this.senderAddress);

            // Get gas price
            const gasPrice = await this.web3.eth.getGasPrice();

            // Estimate gas
            let gasLimit = 100000; // Default
            try {
                gasLimit = await this.web3.eth.estimateGas({
                    from: this.senderAddress,
                    to: this.contractAddress,
                    data: transferData
                });
                gasLimit = Math.ceil(gasLimit * 1.1); // Add 10% buffer
            } catch (e) {
                console.log('⚠️ Gas estimate failed, using default');
            }

            // Build transaction
            const tx = {
                from: this.senderAddress,
                to: this.contractAddress,
                data: transferData,
                gas: gasLimit,
                gasPrice: gasPrice,
                nonce: nonce
            };

            // Sign transaction
            const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.privateKey);

            // Send signed transaction
            const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

            const logEntry = {
                timestamp: new Date().toISOString(),
                recipient: recipientAddress,
                amount: this.airdropAmount,
                txHash: receipt.transactionHash,
                status: 'success'
            };

            this.transactionLog.push(logEntry);

            console.log(`✅ Airdrop sent: ${this.airdropAmount} AERA to ${recipientAddress}`);
            console.log(`   TX: ${receipt.transactionHash}`);

            return {
                success: true,
                message: `Airdrop successful`,
                txHash: receipt.transactionHash,
                recipient: recipientAddress,
                amount: this.airdropAmount
            };

        } catch (error) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                recipient: recipientAddress,
                amount: this.airdropAmount,
                error: error.message,
                status: 'failed'
            };

            this.transactionLog.push(logEntry);

            console.error(`❌ Airdrop failed: ${error.message}`);
            
            return {
                success: false,
                message: `Airdrop failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Get transaction log
     */
    getTransactionLog() {
        return this.transactionLog;
    }

    /**
     * Get balance of sender
     */
    async getSenderBalance() {
        if (!this.contract) {
            return null;
        }

        try {
            const balance = await this.contract.methods.balanceOf(this.senderAddress).call();
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('❌ Failed to get balance:', error.message);
            return null;
        }
    }
}

module.exports = AirdropService;
