#!/bin/bash

# 🧪 Transaction Loop Tester - Start Script
# ==========================================

set -e

echo "╔════════════════════════════════════════╗"
echo "║   🧪 AERA Transaktions-Loop-Tester    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Prüfe .env.local
if [ ! -f .env.local ]; then
    echo "❌ Fehler: .env.local nicht gefunden!"
    echo "   Bitte .env.local mit Test-Wallets konfigurieren."
    exit 1
fi

# Prüfe erforderliche Umgebungsvariablen
missing_vars=()

check_env_var() {
    if ! grep -q "^$1=" .env.local || grep "^$1=.*_here$" .env.local > /dev/null; then
        missing_vars+=("$1")
    fi
}

check_env_var "TEST_WALLET_1_ADDRESS"
check_env_var "TEST_WALLET_1_PRIVATE_KEY"
check_env_var "TEST_WALLET_2_ADDRESS"
check_env_var "TEST_WALLET_2_PRIVATE_KEY"

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Folgende Umgebungsvariablen fehlen oder sind nicht konfiguriert:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "📝 Bitte bearbeite .env.local und trage die Werte ein:"
    echo "   1. TEST_WALLET_1_ADDRESS - Private Key der ersten Test-Wallet"
    echo "   2. TEST_WALLET_1_PRIVATE_KEY - Private Key der ersten Test-Wallet"
    echo "   3. TEST_WALLET_2_ADDRESS - Adresse der zweiten Test-Wallet"
    echo "   4. TEST_WALLET_2_PRIVATE_KEY - Private Key der zweiten Test-Wallet"
    exit 1
fi

echo "✅ Umgebungsvariablen validiert"
echo ""

# Prüfe Node.js und Dependencies
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nicht gefunden!"
    exit 1
fi

if ! npm list ethers > /dev/null 2>&1; then
    echo "⚠️  ethers.js nicht installiert, installiere..."
    npm install ethers
fi

echo "📊 Test-Konfiguration:"
echo "   Schleife: $(grep -oP '^TX_LOOP_COUNT=\K.*' .env.local || echo '10')"
echo "   Verzögerung: $(grep -oP '^TX_DELAY_MS=\K.*' .env.local || echo '30000')ms"
echo "   Test-Typ: $(grep -oP '^TX_TEST_TYPE=\K.*' .env.local || echo 'all')"
echo "   Netzwerk: Sepolia"
echo ""

read -p "🚀 Starte Test? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    node scripts/transaction-loop-tester.js
else
    echo "❌ Test abgebrochen."
    exit 1
fi
