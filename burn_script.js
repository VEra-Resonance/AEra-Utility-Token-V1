const hre = require("hardhat");

async function main() {
    console.log("🔥 AERA Token Burn Test Started\n");
    
    // Contract Address
    const contractAddr = "0x5032206396A6001eEaD2e0178C763350C794F69e";
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Signer:", signer.address);
    
    // Load contract
    const AeraToken = await ethers.getContractAt("AeraToken", contractAddr);
    
    // Check balance before
    const balBefore = await AeraToken.balanceOf(signer.address);
    console.log("Balance before:", ethers.utils.formatEther(balBefore), "AERA");
    
    // Check total supply before
    const supplyBefore = await AeraToken.totalSupply();
    console.log("Total Supply before:", ethers.utils.formatEther(supplyBefore), "AERA\n");
    
    // Burn 1 AERA
    console.log("🔥 Burning 1 AERA...");
    const burnAmount = ethers.utils.parseEther("1");
    const tx = await AeraToken.burn(burnAmount);
    console.log("TX Hash:", tx.hash);
    
    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Confirmed in block:", receipt.blockNumber, "\n");
    
    // Check balance after
    const balAfter = await AeraToken.balanceOf(signer.address);
    console.log("Balance after:", ethers.utils.formatEther(balAfter), "AERA");
    
    // Check total supply after
    const supplyAfter = await AeraToken.totalSupply();
    console.log("Total Supply after:", ethers.utils.formatEther(supplyAfter), "AERA\n");
    
    // Summary
    console.log("🎉 BURN SUMMARY:");
    console.log("- Balance reduced by:", ethers.utils.formatEther(balBefore.sub(balAfter)), "AERA");
    console.log("- Total Supply reduced by:", ethers.utils.formatEther(supplyBefore.sub(supplyAfter)), "AERA");
    console.log("- Status: 🔥 1 AERA BURNED FOREVER!\n");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
