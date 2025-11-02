const { ethers } = require("hardhat");

async function main() {
    console.log("🪙 ÆRA Token Minting Script\n");
    
    // Contract-Adresse (dein deployed Token)
    const CONTRACT_ADDRESS = "0x5032206396A6001eEaD2e0178C763350C794F69e";
    
    // Minting-Parameter (kannst du anpassen)
    const MINT_AMOUNT = 50_000_000; // 50 Millionen neue Token
    const RECIPIENT = "0xa27D21500EB324Ca3e5dF606f2ab548BE8D2FD58"; // Deine Adresse (oder andere)
    
    try {
        // Contract laden
        const [signer] = await ethers.getSigners();
        const AeraToken = await ethers.getContractFactory("AeraToken");
        const aeraToken = AeraToken.attach(CONTRACT_ADDRESS);
        
        console.log("🔗 Contract Address:", CONTRACT_ADDRESS);
        console.log("👤 Minting to:", RECIPIENT);
        console.log("🪙 Amount:", MINT_AMOUNT.toLocaleString(), "AERA");
        console.log("");
        
        // Aktuelle Supply anzeigen
        const currentSupply = await aeraToken.totalSupply();
        const maxSupply = await aeraToken.MAX_SUPPLY();
        console.log("📊 Current Supply:", ethers.formatEther(currentSupply), "AERA");
        console.log("📊 Max Supply:", ethers.formatEther(maxSupply), "AERA");
        
        // Prüfen ob genug Platz
        const mintAmountWei = ethers.parseEther(MINT_AMOUNT.toString());
        const newSupply = currentSupply + mintAmountWei;
        
        if (newSupply > maxSupply) {
            console.log("❌ Fehler: Würde Max Supply überschreiten!");
            console.log("💡 Maximum mintbar:", ethers.formatEther(maxSupply - currentSupply), "AERA");
            return;
        }
        
        console.log("✅ Mint möglich! Neue Supply wäre:", ethers.formatEther(newSupply), "AERA");
        console.log("");
        
        // Balance vor Minting
        const balanceBefore = await aeraToken.balanceOf(RECIPIENT);
        console.log("💰 Balance vorher:", ethers.formatEther(balanceBefore), "AERA");
        
        // Minting ausführen
        console.log("🚀 Starte Minting...");
        const mintTx = await aeraToken.mint(RECIPIENT, mintAmountWei);
        console.log("⏳ Transaction sent:", mintTx.hash);
        
        // Auf Bestätigung warten
        await mintTx.wait();
        console.log("✅ Minting erfolgreich!");
        
        // Balance nach Minting
        const balanceAfter = await aeraToken.balanceOf(RECIPIENT);
        const newTotalSupply = await aeraToken.totalSupply();
        
        console.log("");
        console.log("🎉 MINTING RESULTS:");
        console.log("==================");
        console.log("💰 Neue Balance:", ethers.formatEther(balanceAfter), "AERA");
        console.log("📈 Unterschied:", ethers.formatEther(balanceAfter - balanceBefore), "AERA");
        console.log("📊 Neue Total Supply:", ethers.formatEther(newTotalSupply), "AERA");
        console.log("🔗 Transaction:", `https://sepolia.etherscan.io/tx/${mintTx.hash}`);
        
    } catch (error) {
        console.error("❌ Minting failed:", error.message);
        
        if (error.message.includes("OwnableUnauthorizedAccount")) {
            console.log("💡 Du bist nicht der Owner des Contracts!");
        } else if (error.message.includes("exceed")) {
            console.log("💡 Max Supply würde überschritten werden!");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script error:", error);
        process.exit(1);
    });