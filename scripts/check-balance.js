const { ethers } = require("hardhat");

async function main() {
    console.log("💰 Balance Check für deine Wallet\n");
    
    try {
        // Wallet aus Private Key laden
        const [signer] = await ethers.getSigners();
        const address = await signer.getAddress();
        
        console.log("🔑 Wallet Address:", address);
        
        // Balance abfragen
        const balance = await ethers.provider.getBalance(address);
        const balanceETH = ethers.formatEther(balance);
        
        console.log("💎 Aktuelle Balance:", balanceETH, "ETH");
        console.log("💎 Balance in Wei:", balance.toString());
        
        // Gas-Kosten für Deployment anzeigen
        const requiredGas = ethers.parseEther("0.03"); // Ungefähr 0.03 ETH
        console.log("⛽ Benötigt für Deployment:", ethers.formatEther(requiredGas), "ETH");
        
        if (balance >= requiredGas) {
            console.log("✅ Genug ETH für Deployment vorhanden!");
            console.log("🚀 Du kannst jetzt deployen: npm run deploy:sepolia");
        } else {
            const needed = requiredGas - balance;
            console.log("❌ Nicht genug ETH für Deployment");
            console.log("🎁 Du brauchst noch:", ethers.formatEther(needed), "ETH");
            console.log("💡 Gehe zu einem Faucet:");
            console.log("   - https://sepoliafaucet.com/");
            console.log("   - https://sepolia-faucet.pk910.de/");
        }
        
    } catch (error) {
        console.error("❌ Fehler beim Balance-Check:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script-Fehler:", error);
        process.exit(1);
    });