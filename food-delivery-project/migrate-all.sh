#!/bin/bash

# Script to migrate all services in correct order (SOA Integration)
# This ensures all databases are properly integrated

echo "🚀 Starting migration for all services (SOA Integration)..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: User Service (Base service, no dependencies)
echo -e "${YELLOW}Step 1/5: User Service${NC}"
echo "   (User Service auto-initializes on first run, no migration needed)"
echo ""

# Step 2: Restaurant Service
echo -e "${YELLOW}Step 2/5: Restaurant Service${NC}"
cd 2-services/02-restaurant-service
if [ -f "package.json" ] && grep -q "\"migrate\"" package.json; then
    echo "   Running: npm run migrate"
    npm run migrate
else
    echo "   (Restaurant Service auto-initializes on first run)"
fi
cd ../..
echo ""

# Step 3: Order Service (Clean & Reinitialize)
echo -e "${YELLOW}Step 3/5: Order Service (migrate:fresh)${NC}"
cd 2-services/03-order-service
if [ -f "package.json" ] && grep -q "\"migrate:fresh\"" package.json; then
    echo "   Running: npm run migrate:fresh"
    npm run migrate:fresh
else
    echo -e "   ${RED}Error: migrate:fresh script not found${NC}"
fi
cd ../..
echo ""

# Step 4: Payment Service
echo -e "${YELLOW}Step 4/5: Payment Service${NC}"
echo "   (Payment Service auto-initializes on first run, no migration needed)"
echo ""

# Step 5: Driver Service (Clean & Reinitialize with SOA Integration)
echo -e "${YELLOW}Step 5/5: Driver Service (migrate:fresh)${NC}"
cd 2-services/05-driver-service
if [ -f "package.json" ] && grep -q "\"migrate:fresh\"" package.json; then
    echo "   Running: npm run migrate:fresh"
    npm run migrate:fresh
else
    echo -e "   ${RED}Error: migrate:fresh script not found${NC}"
fi
cd ../..
echo ""

echo -e "${GREEN}✅ All migrations completed!${NC}"
echo ""
echo "📋 Next Steps:"
echo "   1. Restart all services"
echo "   2. Test the flow: Customer → Driver → Admin"
echo "   3. See MIGRATE_ALL.md for detailed testing guide"
echo ""

