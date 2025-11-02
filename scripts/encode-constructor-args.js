#!/usr/bin/env node
const hre = require("hardhat");
require("dotenv").config();

/**
 * Script um Constructor Arguments im ABI-encoded Format zu generieren
 * Benötigt für manuelle Etherscan Verifizierung
 */

async function main() {
    console.log("🔐 Constructor Arguments Encoder\n");
    
    // Parameter
    const INITIAL_SUPPLY = 100_000_000; // 100 Million Token
    
    // Deployer-Adresse abrufen (von Wallet)
    const [deployer] = await hre.ethers.getSigners();
    const DEPLOYER_ADDRESS = deployer.address;
    
    console.log("Input Parameters:");
    console.log("================");
    console.log(`Initial Supply: ${INITIAL_SUPPLY.toLocaleString()} AERA`);
    console.log(`Owner Address: ${DEPLOYER_ADDRESS}\n`);
    
    // ABI-encode die Parameter
    const abiCoder = hre.ethers.AbiCoder.defaultAbiCoder();
    
    const encoded = abiCoder.encode(
        ['uint256', 'address'],
        [INITIAL_SUPPLY, DEPLOYER_ADDRESS]
    );
    
    // Entferne '0x' prefix für Etherscan
    const encodedWithoutPrefix = encoded.slice(2);
    
    console.log("ABI-Encoded Output:");
    console.log("==================");
    console.log("Mit 0x prefix (für Copy-Paste):");
    console.log(encoded);
    console.log("\nOhne 0x prefix (für Etherscan-Formular):");
    console.log(encodedWithoutPrefix);
    
    console.log("\n📋 Anleitung:");
    console.log("1. Kopiere den 'Ohne 0x prefix' Wert");
    console.log("2. Gehe zu: https://sepolia.etherscan.io/address/{CONTRACT_ADDRESS}#code");
    console.log("3. Klicke 'Verify and Publish'");
    console.log("4. Im Feld 'Constructor Arguments' paste den Wert");
    console.log("5. Klicke 'Verify and Publish'");
    
    // Auch in Datei speichern
    const fs = require('fs');
    const output = {
        timestamp: new Date().toISOString(),
        network: hre.network.name,
        initialSupply: INITIAL_SUPPLY,
        ownerAddress: DEPLOYER_ADDRESS,
        encoded: encoded,
        encodedWithoutPrefix: encodedWithoutPrefix
    };
    
    fs.writeFileSync(
        './constructor-args.json',
        JSON.stringify(output, null, 2)
    );
    
    console.log("\n✅ Ausgabe auch gespeichert in: constructor-args.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
