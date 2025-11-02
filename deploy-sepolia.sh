#!/bin/bash
# Sepolia Deployment Script

echo "🚀 ÆRA Token Sepolia Deployment Guide"
echo "====================================="
echo ""

# Check if we have a real private key
if grep -q "your_private_key_here" .env; then
    echo "⚠️  WARNUNG: Noch kein privater Schlüssel konfiguriert!"
    echo ""
    echo "📋 Schritte:"
    echo "1. Öffne MetaMask"
    echo "2. Klicke auf die 3 Punkte -> Account-Details -> Private Key exportieren"
    echo "3. Kopiere den Private Key (ohne 0x)"
    echo "4. Bearbeite die .env Datei:"
    echo "   PRIVATE_KEY=dein_privater_schluessel_hier"
    echo ""
    echo "🎁 Testnet ETH besorgen:"
    echo "   https://sepoliafaucet.com/"
    echo ""
    echo "⚠️  WICHTIG: Nur Test-Accounts verwenden! Niemals echtes Geld!"
    exit 1
fi

echo "✅ Private Key konfiguriert"
echo "🚀 Starte Deployment..."
echo ""

# Run the deployment
npx hardhat run scripts/deploy.js --network sepolia