async function checkBalance() {
    const CONTRACT = "0x5032206396A6001eEaD2e0178C763350C794F69e";
    const WALLET = "0x4dD63dABcc384F2a7B14cC4DB3a59A408fe69F73";
    
    const AeraToken = await ethers.getContractAt('AeraToken', CONTRACT);
    
    const balance = await AeraToken.balanceOf(WALLET);
    const totalSupply = await AeraToken.totalSupply();
    
    const balanceFormatted = ethers.formatEther(balance);
    const supplyFormatted = ethers.formatEther(totalSupply);
    
    console.log("Token Status:");
    console.log("Wallet Balance: " + balanceFormatted + " AERA");
    console.log("Total Supply: " + supplyFormatted + " AERA");
}

checkBalance().catch(console.error);
