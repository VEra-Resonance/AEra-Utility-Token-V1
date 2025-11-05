const { ethers } = require("hardhat");

async function main() {
    const contractAddress = '0x5032206396A6001eEaD2e0178C763350C794F69e';
    const toAddress = '0x4dD63dABcc384F2a7B14cC4DB3a59A408fe69F73';

    console.log('🔍 ANALYTISCHE ÜBERPRÜFUNG DES TOKENS:\n');

    const AeraToken = await ethers.getContractAt('AeraToken', contractAddress);

    try {
        // 1. Total Supply checken
        const totalSupply = await AeraToken.totalSupply();
        console.log('1️⃣  Total Supply:', ethers.utils.formatEther(totalSupply), 'AERA');

        // 2. Balance des Recipients checken
        const balance = await AeraToken.balanceOf(toAddress);
        console.log('2️⃣  Balance of', toAddress + ':', ethers.utils.formatEther(balance), 'AERA');

        // 3. Owner checken
        const owner = await AeraToken.owner();
        console.log('3️⃣  Owner:', owner);

        // 4. Is Paused?
        const paused = await AeraToken.paused();
        console.log('4️⃣  Paused?', paused ? '🔴 JA' : '🟢 NEIN');

        // 5. Max Supply
        const maxSupply = await AeraToken.MAX_SUPPLY();
        console.log('5️⃣  Max Supply:', ethers.utils.formatEther(maxSupply), 'AERA');

        // 6. Decimals
        const decimals = await AeraToken.decimals();
        console.log('6️⃣  Decimals:', decimals);

        // 7. Name & Symbol
        const name = await AeraToken.name();
        const symbol = await AeraToken.symbol();
        console.log('7️⃣  Name:', name, '| Symbol:', symbol);

        console.log('\n=== ERGEBNIS ===');
        if (ethers.utils.formatEther(balance) === '0.0') {
            console.log('❌ PROBLEM: Balance ist 0 - Token wurden NICHT erhalten!');
            console.log('📊 Total Supply ist aber:', ethers.utils.formatEther(totalSupply), 'AERA');
            console.log('⚠️  Das deutet darauf hin, dass Tokens geminted aber zu anderer Adresse gesendet wurden!');
        } else {
            console.log('✅ SUCCESS: Token sind in der Wallet!', ethers.utils.formatEther(balance), 'AERA');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
