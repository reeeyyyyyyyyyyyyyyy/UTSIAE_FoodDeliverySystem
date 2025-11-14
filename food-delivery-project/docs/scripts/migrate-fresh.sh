#!/bin/bash

# Migrate Fresh Script - Cleans and reinitializes all databases
# This script follows SOA principles by ensuring all services communicate correctly

echo "🧹 Starting Migrate Fresh - Cleaning all databases..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run migrate fresh for a service
migrate_service() {
    local service_name=$1
    local service_path=$2
    
    echo -e "${YELLOW}📦 Migrating ${service_name}...${NC}"
    cd "$PROJECT_ROOT/$service_path"
    
    if [ -f "package.json" ] && grep -q "migrate:fresh" package.json; then
        echo -e "${YELLOW}   Running npm run migrate:fresh...${NC}"
        npm run migrate:fresh
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ ${service_name} migrated successfully${NC}"
        else
            echo -e "${RED}❌ ${service_name} migration failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  ${service_name} - No migrate:fresh script found${NC}"
        echo -e "${YELLOW}   Service will auto-initialize on startup via init-db.ts${NC}"
    fi
    
    cd "$PROJECT_ROOT" > /dev/null
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}📍 Project root: ${PROJECT_ROOT}${NC}"
echo ""

# Migrate all services
migrate_service "User Service" "2-services/01-user-service"
migrate_service "Restaurant Service" "2-services/02-restaurant-service"
migrate_service "Order Service" "2-services/03-order-service"
migrate_service "Payment Service" "2-services/04-payment-service"
migrate_service "Driver Service" "2-services/05-driver-service"

echo ""
echo -e "${GREEN}🎉 Migrate Fresh completed!${NC}"
echo ""
echo "📝 Note: All services will automatically initialize their databases on startup."
echo "   Make sure to restart all services to apply the fresh migrations."
echo ""

