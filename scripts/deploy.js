const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying ÆRA Token...\n");
    
    // Deployment-Parameter
    const INITIAL_SUPPLY = 100_000_000; // 100 Million Token initial
    
    // Signers abrufen
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");
    
    // Token Contract deployen
    console.log("📄 Deploying AeraToken contract...");
    const AeraToken = await ethers.getContractFactory("AeraToken");
    
    const aeraToken = await AeraToken.deploy(
        INITIAL_SUPPLY,      // Initial Supply (100M Token)
        deployer.address     // Initial Owner
    );
    
    await aeraToken.waitForDeployment();
    
    console.log("✅ ÆRA Token deployed successfully!");
    console.log("📍 Contract address:", await aeraToken.getAddress());
    console.log("👤 Owner address:", deployer.address);
    console.log("🪙 Initial supply:", INITIAL_SUPPLY.toLocaleString(), "AERA");
    console.log("🔗 Transaction hash:", aeraToken.deploymentTransaction().hash);
    
    // Contract-Informationen anzeigen
    console.log("\n📊 Token Information:");
    console.log("Name:", await aeraToken.name());
    console.log("Symbol:", await aeraToken.symbol());
    console.log("Decimals:", await aeraToken.decimals());
    console.log("Total Supply:", ethers.formatEther(await aeraToken.totalSupply()), "AERA");
    console.log("Max Supply:", ethers.formatEther(await aeraToken.MAX_SUPPLY()), "AERA");
    
    // Owner Balance anzeigen
    const ownerBalance = await aeraToken.balanceOf(deployer.address);
    console.log("Owner Balance:", ethers.formatEther(ownerBalance), "AERA");
    
    // Verification Info für Etherscan (falls auf Mainnet/Testnet deployed)
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("\n🔍 For Etherscan verification, use:");
        console.log(`npx hardhat verify --network ${network.name} ${await aeraToken.getAddress()} ${INITIAL_SUPPLY} ${deployer.address}`);
    }
    
    console.log("\n🎉 Deployment completed successfully!");
    
    return {
        aeraToken: aeraToken,
        deployer: deployer,
        initialSupply: INITIAL_SUPPLY
    };
}

// Error handling
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });