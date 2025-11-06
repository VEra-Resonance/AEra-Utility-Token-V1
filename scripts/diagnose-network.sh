#!/bin/bash

# 🔍 SEPOLIA NETZWERK-DIAGNOSE SCRIPT
# Diagnostiziert Verbindungsprobleme zwischen Local, MetaMask und Safe

echo "═══════════════════════════════════════════════════════════"
echo "🔍 SEPOLIA NETZWERK-KONNEKTIVITÄTS-DIAGNOSE"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: DNS Resolution
echo -e "${BLUE}1️⃣  DNS Resolution Test${NC}"
echo "────────────────────────────────────────────────────────"

hosts=("rpc.sepolia.org" "www.google.com" "github.com")

for host in "${hosts[@]}"; do
    if host $host &>/dev/null; then
        echo -e "${GREEN}✅ $host${NC} - DNS OK"
    else
        echo -e "${RED}❌ $host${NC} - DNS FAILED"
    fi
done

echo ""

# Test 2: Network Connectivity (ping)
echo -e "${BLUE}2️⃣  Network Connectivity Test (Ping)${NC}"
echo "────────────────────────────────────────────────────────"

if ping -c 1 -W 2 8.8.8.8 &>/dev/null; then
    echo -e "${GREEN}✅ Internet Connection: OK${NC}"
else
    echo -e "${RED}❌ Internet Connection: FAILED${NC}"
fi

echo ""

# Test 3: Firewall/Port Test mit nc (netcat)
echo -e "${BLUE}3️⃣  Firewall/Port Test${NC}"
echo "────────────────────────────────────────────────────────"

echo "Testing HTTPS (443) to rpc.sepolia.org..."
if nc -zv -w 2 rpc.sepolia.org 443 2>&1 | grep -q "succeeded"; then
    echo -e "${GREEN}✅ Port 443 (HTTPS): OPEN${NC}"
else
    echo -e "${RED}❌ Port 443 (HTTPS): BLOCKED${NC}"
fi

echo ""

# Test 4: RPC Endpoint Availability (mit curl)
echo -e "${BLUE}4️⃣  RPC Endpoint Test (with curl)${NC}"
echo "────────────────────────────────────────────────────────"

RPC_URLS=(
    "https://rpc.sepolia.org"
    "https://eth-sepolia.public.blastapi.io"
    "https://sepolia.infura.io/v3/YOUR-PROJECT-ID"
    "https://sepolia.g.alchemy.com/v2/YOUR-API-KEY"
)

for rpc in "${RPC_URLS[@]}"; do
    echo ""
    echo "Testing: $rpc"
    
    response=$(curl -s -X POST "$rpc" \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
        -w "\n%{http_code}" \
        --connect-timeout 5 \
        --max-time 10)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q "11155111\|result"; then
            echo -e "${GREEN}✅ RPC is responding${NC}"
            echo "   Response: $body" | head -c 100
            echo ""
        else
            echo -e "${YELLOW}⚠️  RPC responds but unexpected format${NC}"
            echo "   Response: $body" | head -c 100
            echo ""
        fi
    else
        echo -e "${RED}❌ HTTP $http_code${NC}"
    fi
done

echo ""

# Test 5: Local Network Interface
echo -e "${BLUE}5️⃣  Local Network Interface${NC}"
echo "────────────────────────────────────────────────────────"

echo "Active Network Interfaces:"
ip -br addr 2>/dev/null || ifconfig -a | grep "inet " | awk '{print $2}'

echo ""

# Test 6: Check Environment Variables
echo -e "${BLUE}6️⃣  Environment Variables${NC}"
echo "────────────────────────────────────────────────────────"

if [ -f ".env" ]; then
    echo "✅ .env file found"
    grep -i "rpc\|network" .env 2>/dev/null || echo "   (No RPC URLs in .env)"
else
    echo -e "${YELLOW}⚠️  .env file NOT found${NC}"
    echo "   Current directory: $(pwd)"
fi

echo ""

# Test 7: MetaMask Network Check
echo -e "${BLUE}7️⃣  MetaMask Network Config${NC}"
echo "────────────────────────────────────────────────────────"

echo "Expected Sepolia Configuration:"
echo "  Name: Sepolia"
echo "  Chain ID: 11155111"
echo "  RPC URL: https://rpc.sepolia.org (or alternative)"
echo "  Currency Symbol: ETH"
echo "  Block Explorer: https://sepolia.etherscan.io"

echo ""
echo "⚙️  To fix in MetaMask:"
echo "  1. Open MetaMask"
echo "  2. Settings → Networks → Sepolia"
echo "  3. Verify the above details"
echo "  4. Save and Refresh"

echo ""

# Test 8: Gnosis Safe Network Config
echo -e "${BLUE}8️⃣  Gnosis Safe Network Config${NC}"
echo "────────────────────────────────────────────────────────"

echo "Safe Sepolia Configuration:"
echo "  Safe Address: 0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93"
echo "  URL: https://app.safe.global/home?safe=sep:0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93"
echo ""
echo "⚙️  If Safe connection fails:"
echo "  1. Try alternative RPC in Safe settings"
echo "  2. Clear browser cache/cookies"
echo "  3. Switch networks and back"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DIAGNOSE COMPLETE"
echo "═══════════════════════════════════════════════════════════"
