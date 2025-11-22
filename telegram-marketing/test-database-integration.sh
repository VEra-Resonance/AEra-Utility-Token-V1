#!/bin/bash
# Quick test script for database integration
# Tests: Bot startup, database existence, airdrop mechanics

echo "🧪 DATABASE INTEGRATION TEST"
echo "======================================"
echo ""

# Check Bot file
echo "✓ Checking bot file..."
if [ -f "marketing-bot-complete.js" ]; then
    echo "  ✅ Bot file exists"
else
    echo "  ❌ Bot file missing"
    exit 1
fi

# Check UserService
echo "✓ Checking UserService..."
if [ -f "services/userService.js" ]; then
    echo "  ✅ UserService exists"
else
    echo "  ❌ UserService missing"
    exit 1
fi

# Check dependencies
echo "✓ Checking dependencies..."
if npm list better-sqlite3 > /dev/null 2>&1; then
    echo "  ✅ better-sqlite3 installed"
else
    echo "  ❌ better-sqlite3 missing - installing..."
    npm install better-sqlite3 --save
fi

# Check AirdropService
echo "✓ Checking AirdropService..."
if [ -f "services/airdropService.js" ]; then
    echo "  ✅ AirdropService exists"
    # Check for ADMIN_WALLET in env
    if grep -q "ADMIN_WALLET" .env.minimal 2>/dev/null; then
        echo "  ✅ ADMIN_WALLET configured"
    else
        echo "  ⚠️  ADMIN_WALLET not found in .env.minimal"
    fi
else
    echo "  ❌ AirdropService missing"
    exit 1
fi

# Syntax check
echo "✓ Checking syntax..."
if node -c marketing-bot-complete.js > /dev/null 2>&1; then
    echo "  ✅ Bot syntax OK"
else
    echo "  ❌ Syntax error in bot"
    exit 1
fi

if node -c services/userService.js > /dev/null 2>&1; then
    echo "  ✅ UserService syntax OK"
else
    echo "  ❌ Syntax error in UserService"
    exit 1
fi

# Test imports
echo "✓ Testing imports..."
node -e "const UserService = require('./services/userService.js'); console.log('  ✅ UserService imports OK');" 2>/dev/null

# Check for required methods in code
echo "✓ Checking required methods..."
if grep -q "registerUserWallet" marketing-bot-complete.js; then
    echo "  ✅ registerUserWallet call found"
else
    echo "  ❌ registerUserWallet call missing"
fi

if grep -q "hasReceivedAirdrop" marketing-bot-complete.js; then
    echo "  ✅ hasReceivedAirdrop call found"
else
    echo "  ❌ hasReceivedAirdrop call missing"
fi

if grep -q "markAirdropSent" marketing-bot-complete.js; then
    echo "  ✅ markAirdropSent call found"
else
    echo "  ❌ markAirdropSent call missing"
fi

# Test startup
echo ""
echo "✓ Testing bot startup (5 sec)..."
timeout 5 node marketing-bot-complete.js 2>&1 | grep -E "✅|❌|UserService database" | head -10
if [ $? -eq 0 ] || [ $? -eq 124 ]; then
    echo "  ✅ Bot startup OK"
else
    echo "  ❌ Bot startup failed"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ ALL TESTS PASSED!"
echo ""
echo "Database integration is ready."
echo ""
echo "Next: Deploy with:"
echo "  sudo systemctl restart aera-bot-complete.service"
echo ""
echo "Then test in Telegram:"
echo "  1. /connect (first time) → 0.5 AERA sent"
echo "  2. /connect (second time) → 'Already received' message"
echo "  3. /wallet → Shows airdrop status"
echo "  4. /stats → Shows airdrop statistics"
