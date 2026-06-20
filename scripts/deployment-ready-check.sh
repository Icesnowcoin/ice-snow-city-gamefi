#!/bin/bash

# Deployment Ready Check Script
# Quick verification that system is ready for production deployment

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

FAILED=0

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; ((FAILED++)); }

echo "Deployment Ready Check"
echo "===================="
echo ""

# File Structure
echo "File Structure:"
[ -f "package.json" ] && pass "package.json" || fail "package.json missing"
[ -f "pnpm-lock.yaml" ] && pass "pnpm-lock.yaml" || fail "pnpm-lock.yaml missing"
[ -d "drizzle" ] && pass "drizzle schema" || fail "drizzle schema missing"
[ -d "server" ] && pass "server code" || fail "server code missing"
echo ""

# Configuration
echo "Configuration:"
[ -f "tsconfig.json" ] && pass "TypeScript config" || fail "TypeScript config missing"
[ -f "vite.config.ts" ] && pass "Vite config" || fail "Vite config missing"
echo ""

# Security
echo "Security:"
[ -f "server/_core/rateLimiter.ts" ] && pass "Rate limiter" || fail "Rate limiter missing"
[ -f "server/_core/encryption.ts" ] && pass "Encryption" || fail "Encryption missing"
echo ""

# Summary
echo "===================="
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}✓ Ready for deployment!${NC}"
  exit 0
else
  echo -e "${RED}✗ Fix $FAILED issues${NC}"
  exit 1
fi
