const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 ÆRA Token Explorer\n");
    
    // Contract aus dem letzten Deployment laden
    // Du musst die Contract-Adresse aus dem Deployment kopieren
    
    console.log("📋 Verfügbare Accounts:");
    const accounts = await ethers.getSigners();
    
    for (let i = 0; i < Math.min(5, accounts.length); i++) {
        const balance = await ethers.provider.getBalance(accounts[i].address);
        console.log(`Account ${i}: ${accounts[i].address}`);
        console.log(`          ETH Balance: ${ethers.formatEther(balance)} ETH\n`);
    }
    
    // Versuche den Contract zu finden (deployed auf der lokalen Blockchain)
    console.log("🔗 Versuche ÆRA Token Contract zu finden...\n");
    
    try {
        // Contract Factory laden
        const AeraToken = await ethers.getContractFactory("AeraToken");
        
        // Für Demo: Neues Deployment (da lokales Netz neu gestartet wurde)
        console.log("🚀 Deploye neuen ÆRA Token für Demo...");
        const aeraToken = await AeraToken.deploy(100_000_000, accounts[0].address);
        await aeraToken.waitForDeployment();
        
        const contractAddress = await aeraToken.getAddress();
        console.log("✅ Contract deployed at:", contractAddress);
        console.log("");
        
        // Token-Informationen anzeigen
        console.log("📊 TOKEN INFORMATIONEN:");
        console.log("======================");
        console.log("Name:", await aeraToken.name());
        console.log("Symbol:", await aeraToken.symbol());
        console.log("Decimals:", await aeraToken.decimals());
        console.log("Total Supply:", ethers.formatEther(await aeraToken.totalSupply()), "AERA");
        console.log("Max Supply:", ethers.formatEther(await aeraToken.MAX_SUPPLY()), "AERA");
        console.log("Owner:", await aeraToken.owner());
        console.log("Is Paused:", await aeraToken.paused());
        console.log("");
        
        // Balances anzeigen
        console.log("💰 TOKEN BALANCES:");
        console.log("==================");
        for (let i = 0; i < Math.min(3, accounts.length); i++) {
            const balance = await aeraToken.balanceOf(accounts[i].address);
            console.log(`Account ${i}: ${ethers.formatEther(balance)} AERA`);
        }
        console.log("");
        
        // Demo-Transaktionen
        console.log("🔄 DEMO-TRANSAKTIONEN:");
        console.log("======================");
        
        // 1. Transfer
        console.log("1️⃣ Transfer 1000 AERA von Owner zu Account 1...");
        const transferTx = await aeraToken.transfer(accounts[1].address, ethers.parseEther("1000"));
        await transferTx.wait();
        console.log("✅ Transfer erfolgreich!");
        
        const newBalance = await aeraToken.balanceOf(accounts[1].address);
        console.log("   Neue Balance Account 1:", ethers.formatEther(newBalance), "AERA");
        console.log("");
        
        // 2. Approve & TransferFrom
        console.log("2️⃣ Account 1 genehmigt 500 AERA für Account 2...");
        const approveTx = await aeraToken.connect(accounts[1]).approve(accounts[2].address, ethers.parseEther("500"));
        await approveTx.wait();
        console.log("✅ Genehmigung erfolgreich!");
        
        const allowance = await aeraToken.allowance(accounts[1].address, accounts[2].address);
        console.log("   Genehmigter Betrag:", ethers.formatEther(allowance), "AERA");
        console.log("");
        
        console.log("3️⃣ Account 2 transferiert 200 AERA von Account 1 zu sich...");
        const transferFromTx = await aeraToken.connect(accounts[2]).transferFrom(
            accounts[1].address, 
            accounts[2].address, 
            ethers.parseEther("200")
        );
        await transferFromTx.wait();
        console.log("✅ TransferFrom erfolgreich!");
        
        // Finale Balances
        console.log("");
        console.log("💎 FINALE TOKEN BALANCES:");
        console.log("=========================");
        for (let i = 0; i < 3; i++) {
            const balance = await aeraToken.balanceOf(accounts[i].address);
            console.log(`Account ${i}: ${ethers.formatEther(balance)} AERA`);
        }
        
        console.log("");
        console.log("🎉 Demo abgeschlossen!");
        console.log(`📍 Contract-Adresse: ${contractAddress}`);
        console.log("💡 Du kannst diese Adresse verwenden, um den Token in Wallets hinzuzufügen!");
        
    } catch (error) {
        console.error("❌ Fehler beim Laden des Contracts:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Skript-Fehler:", error);
        process.exit(1);
    });