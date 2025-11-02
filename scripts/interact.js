const { ethers } = require("hardhat");

async function main() {
    // Contract-Adresse (nach Deployment einsetzen)
    const CONTRACT_ADDRESS = process.env.AERA_TOKEN_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";
    
    if (CONTRACT_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
        console.log("❌ Bitte setze die Contract-Adresse in der Umgebungsvariable AERA_TOKEN_ADDRESS");
        console.log("Beispiel: AERA_TOKEN_ADDRESS=0x... npx hardhat run scripts/interact.js --network localhost");
        process.exit(1);
    }
    
    console.log("🔗 Interacting with ÆRA Token at:", CONTRACT_ADDRESS);
    
    // Contract-Instanz erstellen
    const [owner, user1, user2] = await ethers.getSigners();
    const AeraToken = await ethers.getContractFactory("AeraToken");
    const aeraToken = AeraToken.attach(CONTRACT_ADDRESS);
    
    console.log("\n📊 Current Token Status:");
    console.log("Name:", await aeraToken.name());
    console.log("Symbol:", await aeraToken.symbol());
    console.log("Total Supply:", ethers.utils.formatEther(await aeraToken.totalSupply()), "AERA");
    console.log("Owner:", await aeraToken.owner());
    console.log("Is Paused:", await aeraToken.paused());
    
    // Owner Balance
    const ownerBalance = await aeraToken.balanceOf(owner.address);
    console.log("Owner Balance:", ethers.utils.formatEther(ownerBalance), "AERA");
    
    console.log("\n🔄 Example Operations:");
    
    try {
        // 1. Transfer Token von Owner zu User1
        const transferAmount = ethers.utils.parseEther("1000"); // 1000 Token
        console.log(`\n1️⃣ Transferring 1000 AERA from owner to ${user1.address}...`);
        
        const transferTx = await aeraToken.connect(owner).transfer(user1.address, transferAmount);
        await transferTx.wait();
        console.log("✅ Transfer successful!");
        
        const user1Balance = await aeraToken.balanceOf(user1.address);
        console.log("User1 Balance:", ethers.utils.formatEther(user1Balance), "AERA");
        
        // 2. Approve und TransferFrom
        console.log(`\n2️⃣ User1 approves 500 AERA for User2...`);
        const approveAmount = ethers.utils.parseEther("500");
        
        const approveTx = await aeraToken.connect(user1).approve(user2.address, approveAmount);
        await approveTx.wait();
        console.log("✅ Approval successful!");
        
        const allowance = await aeraToken.allowance(user1.address, user2.address);
        console.log("Allowance:", ethers.utils.formatEther(allowance), "AERA");
        
        // 3. TransferFrom
        console.log(`\n3️⃣ User2 transfers 200 AERA from User1 to themselves...`);
        const transferFromAmount = ethers.utils.parseEther("200");
        
        const transferFromTx = await aeraToken.connect(user2).transferFrom(
            user1.address, 
            user2.address, 
            transferFromAmount
        );
        await transferFromTx.wait();
        console.log("✅ TransferFrom successful!");
        
        const user2Balance = await aeraToken.balanceOf(user2.address);
        console.log("User2 Balance:", ethers.utils.formatEther(user2Balance), "AERA");
        
        // 4. Mint neue Token (nur Owner)
        console.log(`\n4️⃣ Minting 10000 new AERA tokens to User1...`);
        const mintAmount = ethers.utils.parseEther("10000");
        
        const mintTx = await aeraToken.connect(owner).mint(user1.address, mintAmount);
        await mintTx.wait();
        console.log("✅ Minting successful!");
        
        const newTotalSupply = await aeraToken.totalSupply();
        console.log("New Total Supply:", ethers.utils.formatEther(newTotalSupply), "AERA");
        
        // 5. Burn Token
        console.log(`\n5️⃣ User1 burns 100 AERA tokens...`);
        const burnAmount = ethers.utils.parseEther("100");
        
        const burnTx = await aeraToken.connect(user1).burn(burnAmount);
        await burnTx.wait();
        console.log("✅ Burning successful!");
        
        const finalTotalSupply = await aeraToken.totalSupply();
        console.log("Final Total Supply:", ethers.utils.formatEther(finalTotalSupply), "AERA");
        
        console.log("\n🎉 All operations completed successfully!");
        
        // Final Balances
        console.log("\n💰 Final Balances:");
        console.log("Owner:", ethers.utils.formatEther(await aeraToken.balanceOf(owner.address)), "AERA");
        console.log("User1:", ethers.utils.formatEther(await aeraToken.balanceOf(user1.address)), "AERA");
        console.log("User2:", ethers.utils.formatEther(await aeraToken.balanceOf(user2.address)), "AERA");
        
    } catch (error) {
        console.error("❌ Operation failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });