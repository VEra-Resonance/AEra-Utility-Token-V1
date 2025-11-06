const { ethers } = require("hardhat");

/**
 * Debugging-Skript: Warum schlägt Safe.mint() fehl?
 * Testen Sie die Mint-Funktion direkt (nicht über Safe)
 */

async function main() {
    const contractAddress = '0x5032206396A6001eEaD2e0178C763350C794F69e';
    const safeAddress = '0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93';
    const testRecipient = '0xc9e1e237b24b892141551b45cdabc224932630c4';
    
    console.log('🔍 SAFE MINT DEBUGGING\n');
    console.log('Contract:', contractAddress);
    console.log('Safe Address:', safeAddress);
    console.log('Test Recipient:', testRecipient);
    console.log('');
    
    try {
        const AeraToken = await ethers.getContractAt('AeraToken', contractAddress);
        
        // 1. Owner überprüfen
        const owner = await AeraToken.owner();
        console.log('1️⃣  Owner des Contracts:', owner);
        console.log('   Expected:', safeAddress);
        console.log('   Match?', owner.toLowerCase() === safeAddress.toLowerCase() ? '✅ JA' : '❌ NEIN');
        
        // 2. Pause-Status
        const paused = await AeraToken.paused();
        console.log('\n2️⃣  Contract pausiert?', paused ? '🔴 JA' : '🟢 NEIN');
        
        if (paused) {
            console.log('   ⚠️  PROBLEM: Contract ist pausiert! Mint wird blockiert.');
            console.log('   Lösung: Safe muss unpause() aufrufen');
        }
        
        // 3. Supply-Check
        const totalSupply = await AeraToken.totalSupply();
        const maxSupply = await AeraToken.MAX_SUPPLY();
        const mintAmount = ethers.parseEther("1");
        
        console.log('\n3️⃣  Supply-Status:');
        console.log('   Total Supply:', ethers.formatEther(totalSupply), 'AERA');
        console.log('   Max Supply:', ethers.formatEther(maxSupply), 'AERA');
        console.log('   Mint Amount:', ethers.formatEther(mintAmount), 'AERA');
        
        const wouldExceed = totalSupply + mintAmount > maxSupply;
        console.log('   Würde Mint MAX_SUPPLY überschreiten?', wouldExceed ? '❌ JA' : '✅ NEIN');
        
        if (wouldExceed) {
            console.log('   ⚠️  PROBLEM: Minting würde MAX_SUPPLY überschreiten!');
            console.log('   Available:', ethers.formatEther(maxSupply - totalSupply), 'AERA');
        }
        
        // 4. Recipient-Validierung
        console.log('\n4️⃣  Recipient-Validierung:');
        const isZeroAddress = testRecipient === '0x0000000000000000000000000000000000000000';
        console.log('   Address:', testRecipient);
        console.log('   Ist Zero Address?', isZeroAddress ? '❌ JA' : '✅ NEIN');
        
        if (isZeroAddress) {
            console.log('   ⚠️  PROBLEM: Recipient ist zero address!');
        }
        
        // 5. Current Balance des Recipients
        const balance = await AeraToken.balanceOf(testRecipient);
        console.log('\n5️⃣  Current Balance des Recipients:', ethers.formatEther(balance), 'AERA');
        
        // 6. Summary & Empfehlung
        console.log('\n' + '='.repeat(50));
        console.log('📋 ZUSAMMENFASSUNG:\n');
        
        let canMint = true;
        const issues = [];
        
        if (owner.toLowerCase() !== safeAddress.toLowerCase()) {
            issues.push('❌ Owner ist nicht der Safe');
            canMint = false;
        }
        if (paused) {
            issues.push('❌ Contract ist pausiert');
            canMint = false;
        }
        if (wouldExceed) {
            issues.push('❌ Minting würde MAX_SUPPLY überschreiten');
            canMint = false;
        }
        if (isZeroAddress) {
            issues.push('❌ Recipient ist zero address');
            canMint = false;
        }
        
        if (canMint) {
            console.log('✅ Alles sieht gut aus!');
            console.log('Das Minting SOLLTE funktionieren.');
            console.log('\nProblem könnte sein:');
            console.log('1. Safe-Signatur-Format ist falsch');
            console.log('2. safeTxGas / baseGas sollte > 0 sein');
            console.log('3. Nonce-Mismatch');
        } else {
            console.log('🔴 Folgende Probleme gefunden:\n');
            issues.forEach(issue => console.log(issue));
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
