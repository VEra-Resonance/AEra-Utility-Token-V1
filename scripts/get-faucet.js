#!/usr/bin/env node

/**
 * 🚰 SEPOLIA FAUCET - ETH abrufen
 */

const https = require("https");

async function requestFromFaucet(address) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ address });

    const options = {
      hostname: "sepolia-faucet.pk910.de",
      path: "/api/claim",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": payload.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch {
          resolve({ error: data });
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log("\n🚰 Sepolia Faucet - ETH anfordern\n");

  const address = process.argv[2];
  if (!address || !address.startsWith("0x")) {
    console.log("❌ Bitte Wallet-Adresse angeben!");
    console.log("Usage: node get-faucet.js 0x...\n");
    process.exit(1);
  }

  console.log(`📍 Adresse: ${address}`);
  console.log(`⏳ Fordere ETH an...\n`);

  try {
    const result = await requestFromFaucet(address);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("❌ Fehler:", err.message);
  }
}

main();
