const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Sepolia Testnet Connection Test\n");
    
    try {
        // Netzwerk-Info abrufen
        const network = await ethers.provider.getNetwork();
        console.log("📡 Connected to network:");
        console.log(`   Name: ${network.name || 'Unknown'}`);
        console.log(`   Chain ID: ${network.chainId}`);
        console.log("");
        
        // Block-Info abrufen
        const blockNumber = await ethers.provider.getBlockNumber();
        console.log("📦 Latest block:", blockNumber);
        
        // Gas Price abrufen
        const gasPrice = await ethers.provider.getFeeData();
        console.log("⛽ Current gas price:", ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"), "gwei");
        console.log("");
        
        // Test-Account generieren (nur für Demo)
        const testWallet = ethers.Wallet.createRandom();
        console.log("🔑 Generated test wallet:");
        console.log(`   Address: ${testWallet.address}`);
        console.log(`   Private Key: ${testWallet.privateKey}`);
        console.log("");
        
        // Balance des Test-Wallets prüfen (sollte 0 sein)
        const balance = await ethers.provider.getBalance(testWallet.address);
        console.log("💰 Test wallet balance:", ethers.formatEther(balance), "ETH");
        console.log("");
        
        if (network.chainId === 11155111n) {
            console.log("✅ Successfully connected to Sepolia Testnet!");
            console.log("");
            console.log("🎯 Next steps:");
            console.log("1. Get testnet ETH from: https://sepoliafaucet.com/");
            console.log("2. Add your private key to .env file");
            console.log("3. Run: npm run deploy:sepolia");
        } else if (network.chainId === 31337n) {
            console.log("ℹ️  Connected to local Hardhat network");
            console.log("To test Sepolia, make sure to use --network sepolia flag");
        } else {
            console.log("⚠️  Connected to unexpected network");
            console.log("Expected Sepolia (Chain ID: 11155111)");
        }
        
    } catch (error) {
        console.error("❌ Connection failed:");
        console.error(error.message);
        console.log("\n🔧 Troubleshooting:");
        console.log("1. Check your SEPOLIA_RPC_URL in .env");
        console.log("2. Make sure you have internet connection");
        console.log("3. Try a different RPC provider");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });