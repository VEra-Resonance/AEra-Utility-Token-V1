#!/usr/bin/env node
const hre = require("hardhat");
require("dotenv").config();

/**
 * Etherscan Contract Verification Script für AERA Token
 * 
 * Verwendet: npx hardhat verify
 * 
 * Beispiel-Aufruf:
 * node scripts/verify-etherscan.js
 */

async function main() {
    console.log("🔍 AERA Token - Etherscan Verification Script\n");
    
    // Konfiguration
    const CONTRACT_ADDRESS = process.env.AERA_TOKEN_ADDRESS || "0x5032206396A6001eEaD2e0178C763350C794F69e";
    const INITIAL_SUPPLY = 100_000_000; // 100 Million Token
    const NETWORK = hre.network.name;
    
    // Deployer-Adresse abrufen
    const [deployer] = await hre.ethers.getSigners();
    const DEPLOYER_ADDRESS = deployer.address;
    
    console.log("📊 Verification Configuration:");
    console.log("================================");
    console.log(`Network: ${NETWORK}`);
    console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`Initial Supply: ${INITIAL_SUPPLY.toLocaleString()} AERA`);
    console.log(`Owner Address: ${DEPLOYER_ADDRESS}`);
    console.log(`Etherscan API Key: ${process.env.ETHERSCAN_API_KEY ? "✅ Set" : "❌ Not set"}`);
    console.log("");
    
    // Validierungen
    if (!process.env.ETHERSCAN_API_KEY) {
        console.error("❌ ERROR: ETHERSCAN_API_KEY nicht in .env gesetzt!");
        console.error("Bitte füge folgende Zeile zu .env hinzu:");
        console.error("ETHERSCAN_API_KEY=your_api_key_here");
        process.exit(1);
    }
    
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.includes("your_deployed")) {
        console.error("❌ ERROR: AERA_TOKEN_ADDRESS nicht in .env gesetzt!");
        console.error("Bitte deploye den Contract zuerst:");
        console.error("npx hardhat run scripts/deploy.js --network sepolia");
        process.exit(1);
    }
    
    if (NETWORK === "hardhat" || NETWORK === "localhost") {
        console.error("❌ ERROR: Kann nur auf Testnet/Mainnet verifizieren!");
        console.error("Verwende: --network sepolia");
        process.exit(1);
    }
    
    console.log("🚀 Starte Verifizierung...\n");
    
    try {
        console.log(`📝 Verifiziere Contract auf ${NETWORK}...`);
        console.log(`Address: ${CONTRACT_ADDRESS}`);
        console.log(`Constructor Args: ${INITIAL_SUPPLY}, ${DEPLOYER_ADDRESS}\n`);
        
        // Verifizierung starten
        await hre.run("verify:verify", {
            address: CONTRACT_ADDRESS,
            constructorArguments: [INITIAL_SUPPLY, DEPLOYER_ADDRESS],
            network: NETWORK
        });
        
        console.log("\n✅ Contract erfolgreich verifiziert!");
        console.log(`\n🔗 Ansicht auf Etherscan:`);
        
        if (NETWORK === "sepolia") {
            console.log(`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#code`);
        } else if (NETWORK === "mainnet") {
            console.log(`https://etherscan.io/address/${CONTRACT_ADDRESS}#code`);
        }
        
        console.log("\n✨ Verifizierung abgeschlossen!");
        
    } catch (error) {
        console.error("\n❌ Verifizierung fehlgeschlagen!");
        console.error("Error:", error.message);
        
        if (error.message.includes("Already Verified")) {
            console.log("\n💡 Hinweis: Contract ist bereits verifiziert!");
            if (NETWORK === "sepolia") {
                console.log(`Ansicht: https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}#code`);
            }
        } else if (error.message.includes("Constructor arguments")) {
            console.error("\n💡 Hinweis: Überprüfe die Constructor-Argumente!");
            console.error("Initial Supply muss in ganzen Token sein (100_000_000, nicht Wei)");
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
