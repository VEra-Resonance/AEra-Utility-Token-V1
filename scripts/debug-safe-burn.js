const { ethers } = require("hardhat");

/**
 * DEBUG: Warum schlägt Safe Burn fehl?
 * Prüft Token-Balance, Pause-Status, Burn-Permissions
 */

async function main() {
    const safeAddress = '0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93';
    const tokenAddress = '0x5032206396A6001eEaD2e0178C763350C794F69e';
    
    console.log('🔥 SAFE BURN DEBUGGING\n');
    console.log('Safe Address:', safeAddress);
    console.log('Token Address:', tokenAddress);
    console.log('');
    
    try {
        const AeraToken = await ethers.getContractAt('AeraToken', tokenAddress);
        
        // 1. Check Safe Token Balance
        console.log('1️⃣  Safe Token Balance:');
        const balance = await AeraToken.balanceOf(safeAddress);
        console.log('   Balance:', ethers.formatEther(balance), 'AERA');
        
        if (balance == 0n) {
            console.log('   ❌ PROBLEM: Safe hat KEINE Tokens zum Burnen!');
            console.log('   Lösung: Erst Tokens zur Safe transferieren');
        } else {
            console.log('   ✅ Safe hat Tokens');
        }
        
        // 2. Check Contract Pause Status
        console.log('\n2️⃣  Contract Pause Status:');
        const paused = await AeraToken.paused();
        console.log('   Paused?', paused ? '🔴 JA' : '🟢 NEIN');
        
        if (paused) {
            console.log('   ❌ PROBLEM: Contract ist pausiert!');
            console.log('   Burn wird blockiert durch @whenNotPaused');
        }
        
        // 3. Check Total Supply & Max Supply
        console.log('\n3️⃣  Supply Status:');
        const totalSupply = await AeraToken.totalSupply();
        const maxSupply = await AeraToken.MAX_SUPPLY();
        console.log('   Total Supply:', ethers.formatEther(totalSupply), 'AERA');
        console.log('   Max Supply:', ethers.formatEther(maxSupply), 'AERA');
        
        // 4. Safe Owner Check
        console.log('\n4️⃣  Safe Owner Status:');
        const owner = await AeraToken.owner();
        console.log('   Contract Owner:', owner);
        console.log('   Is Safe?', owner.toLowerCase() === safeAddress.toLowerCase() ? '✅ JA' : '❌ NEIN');
        
        // 5. Test Burn Simulation
        console.log('\n5️⃣  Burn Simulation:');
        const burnAmount = ethers.parseEther("1");
        
        if (balance >= burnAmount) {
            console.log('   ✅ Safe hat genug Tokens zum Burnen (1 AERA)');
            console.log('   Burn sollte funktionieren');
        } else {
            console.log('   ❌ Safe hat nicht genug Tokens');
            console.log('   Available:', ethers.formatEther(balance), 'AERA');
            console.log('   Required:', ethers.formatEther(burnAmount), 'AERA');
        }
        
        // SUMMARY
        console.log('\n' + '='.repeat(50));
        console.log('📋 ZUSAMMENFASSUNG:\n');
        
        const issues = [];
        
        if (balance == 0n) {
            issues.push('❌ Safe hat keine Tokens');
        }
        if (paused) {
            issues.push('❌ Contract ist pausiert');
        }
        if (balance < burnAmount) {
            issues.push('❌ Insufficient balance for 1 AERA burn');
        }
        
        if (issues.length === 0) {
            console.log('✅ Alles sieht gut aus!');
            console.log('Burn SOLLTE funktionieren.');
            console.log('\nMögliche andere Probleme:');
            console.log('1. Nur 1 Signatur statt 2-of-3');
            console.log('2. safeTxGas = 0 (sollte > 0 sein)');
            console.log('3. Signatur-Format ungültig');
        } else {
            console.log('🔴 Probleme gefunden:\n');
            issues.forEach(issue => console.log(issue));
            console.log('\nLösung: Behebe die Probleme oben');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
