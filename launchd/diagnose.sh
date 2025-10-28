#!/bin/bash
# Quick diagnostic script for spec-this service

echo "=== Spec-This Service Diagnostics ==="
echo ""

# Check if service is in launchctl
echo "1. Checking launchctl list..."
if launchctl list | grep -q "com.specthis.mcp"; then
    echo "   ✓ Service is registered with launchctl"
    launchctl list | grep "com.specthis.mcp"
else
    echo "   ✗ Service NOT found in launchctl"
fi
echo ""

# Check if plist exists
echo "2. Checking plist file..."
if [ -f ~/Library/LaunchAgents/com.specthis.mcp.plist ]; then
    echo "   ✓ Plist file exists"
    echo "   Location: ~/Library/LaunchAgents/com.specthis.mcp.plist"
else
    echo "   ✗ Plist file NOT found"
fi
echo ""

# Check if Next.js is built
echo "3. Checking Next.js build..."
if [ -d ~/spec-this/.next ]; then
    echo "   ✓ Next.js is built"
else
    echo "   ✗ Next.js NOT built - run: npm run build"
fi
echo ""

# Check if process is listening on port 3080
echo "4. Checking port 3080..."
if lsof -i :3080 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "   ✓ Something is listening on port 3080"
    lsof -i :3080 -sTCP:LISTEN | grep -v "^COMMAND"
else
    echo "   ✗ Nothing listening on port 3080"
fi
echo ""

# Check recent logs
echo "5. Recent logs (last 20 lines)..."
LOG_DIR=~/Library/Logs/mcp-servers/spec-this
if [ -d "$LOG_DIR" ]; then
    echo ""
    echo "   === STDERR (last 20 lines) ==="
    tail -20 "$LOG_DIR/stderr.log" 2>/dev/null || echo "   (no stderr logs)"
    echo ""
    echo "   === STDOUT (last 20 lines) ==="
    tail -20 "$LOG_DIR/stdout.log" 2>/dev/null || echo "   (no stdout logs)"
else
    echo "   ✗ Log directory not found: $LOG_DIR"
fi
echo ""

# Check database connection
echo "6. Checking .env.local..."
if [ -f ~/spec-this/.env.local ]; then
    echo "   ✓ .env.local exists"
    if grep -q "DATABASE_URL" ~/spec-this/.env.local; then
        echo "   ✓ DATABASE_URL is set"
    else
        echo "   ✗ DATABASE_URL not found in .env.local"
    fi
else
    echo "   ✗ .env.local NOT found - service needs DATABASE_URL"
fi
echo ""

echo "=== Quick Fixes ==="
echo ""
echo "If service isn't running:"
echo "  ./launchd/mcp-service.sh uninstall spec-this"
echo "  npm run build"
echo "  ./launchd/mcp-service.sh -v install spec-this"
echo ""
echo "To view full logs:"
echo "  ./launchd/mcp-service.sh logs spec-this"
echo ""
echo "To follow logs in real-time:"
echo "  ./launchd/mcp-service.sh logs spec-this -f"
