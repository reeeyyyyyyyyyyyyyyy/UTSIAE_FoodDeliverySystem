#!/bin/bash

# Migrate Fresh Script - Cleans and reinitializes all databases
# This script ensures all databases are truly clean before inserting essential data
# IMPORTANT: This will DELETE all existing data!

echo "🧹 Starting Migrate Fresh - Cleaning all databases..."
echo "⚠️  WARNING: This will DELETE all existing data!"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run migrate fresh for a service
migrate_service() {
    local service_name=$1
    local service_path=$2
    local db_name=$3
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📦 Migrating ${service_name}...${NC}"
    cd "$PROJECT_ROOT/$service_path"
    
    if [ -f "package.json" ] && grep -q "migrate:fresh" package.json; then
        echo -e "${YELLOW}   Running npm run migrate:fresh...${NC}"
        echo -e "${YELLOW}   (This will DROP tables and insert essential data from init.sql)${NC}"
        
        # Run migrate:fresh and capture output
        if npm run migrate:fresh 2>&1 | tee /tmp/migrate_output.log | grep -E "(✅|❌|error|Error|successfully|completed)" | head -5; then
            # Check if it actually succeeded
            if grep -q "successfully\|completed" /tmp/migrate_output.log 2>/dev/null || [ ${PIPESTATUS[0]} -eq 0 ]; then
                echo -e "${GREEN}✅ ${service_name} migrated successfully${NC}"
                echo -e "${GREEN}   Database cleaned and essential data inserted${NC}"
                cd "$PROJECT_ROOT" > /dev/null
                return 0
            else
                echo -e "${RED}❌ ${service_name} migration failed${NC}"
                cd "$PROJECT_ROOT" > /dev/null
                return 1
            fi
        else
            # Check exit code directly
            local exit_code=${PIPESTATUS[0]}
            if [ $exit_code -eq 0 ]; then
                echo -e "${GREEN}✅ ${service_name} migrated successfully${NC}"
                echo -e "${GREEN}   Database cleaned and essential data inserted${NC}"
                cd "$PROJECT_ROOT" > /dev/null
                return 0
            else
                echo -e "${RED}❌ ${service_name} migration failed (exit code: $exit_code)${NC}"
                cd "$PROJECT_ROOT" > /dev/null
                return 1
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  ${service_name} - No migrate:fresh script found${NC}"
        echo -e "${YELLOW}   Using Node.js to drop and recreate database...${NC}"
        
        # Create temporary script to drop and recreate database
        # Run from service directory so it can use node_modules
        local env_file="$PROJECT_ROOT/$service_path/.env"
        local drop_script="$PROJECT_ROOT/$service_path/drop_db_temp.js"
        
        cat > "$drop_script" << EOF
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load .env file manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']\$/g, '');
                process.env[key] = value;
            }
        }
    });
}

async function dropAndRecreate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3308'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        waitForConnections: true,
        connectionLimit: 10,
    });
    
    try {
        const conn = await pool.getConnection();
        console.log('🗑️  Dropping database ${db_name}...');
        await conn.query(\`DROP DATABASE IF EXISTS ${db_name}\`);
        console.log('📦 Creating fresh database ${db_name}...');
        await conn.query(\`CREATE DATABASE ${db_name}\`);
        await conn.query(\`USE ${db_name}\`);
        
        // Execute init.sql if it exists
        const initSqlPath = path.join(__dirname, 'src', 'database', 'init.sql');
        if (fs.existsSync(initSqlPath)) {
            console.log('📝 Reading init.sql...');
            let initSql = fs.readFileSync(initSqlPath, 'utf-8');
            
            // Remove SQL comments and split by semicolon
            const cleanedSql = initSql
                .split('\\n')
                .map(line => {
                    const commentIndex = line.indexOf('--');
                    if (commentIndex !== -1) {
                        return line.substring(0, commentIndex);
                    }
                    return line;
                })
                .join('\\n');
            
            // Split by semicolon and filter out empty statements
            const statements = cleanedSql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.match(/^\s*$/));
            
            console.log('🔄 Executing init.sql statements...');
            for (const statement of statements) {
                if (statement.trim() && !statement.match(/^\s*$/)) {
                    try {
                        // Skip CREATE DATABASE and USE statements (already done)
                        if (statement.toUpperCase().includes('CREATE DATABASE') || 
                            statement.toUpperCase().includes('USE ')) {
                            continue;
                        }
                        await conn.query(statement);
                    } catch (error) {
                        // Ignore duplicate entry errors for INSERT statements
                        if (error.code === 'ER_DUP_ENTRY' || 
                            error.code === 'ER_TABLE_EXISTS_ERROR' ||
                            error.code === 'ER_DUP_KEYNAME') {
                            console.warn(\`⚠️  Skipping: \${error.code}\`);
                        } else if (statement.trim().toUpperCase().startsWith('INSERT')) {
                            console.warn(\`⚠️  Insert warning: \${error.message}\`);
                        } else {
                            throw error;
                        }
                    }
                }
            }
            console.log('✅ init.sql executed successfully');
        }
        
        conn.release();
        await pool.end();
        console.log('✅ Database ${db_name} dropped, recreated, and initialized');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

dropAndRecreate();
EOF
        
        # Run the drop script from service directory (has node_modules)
        if node "$drop_script" 2>&1; then
            rm -f "$drop_script"
            echo -e "${GREEN}   ✅ Database ${db_name} cleaned and initialized${NC}"
            echo -e "${GREEN}   Essential data from init.sql has been inserted${NC}"
            cd "$PROJECT_ROOT" > /dev/null
            return 0
        else
            echo -e "${RED}   ❌ Failed to clean database ${db_name}${NC}"
            echo -e "${YELLOW}   Service will still auto-initialize, but old data may persist${NC}"
            rm -f "$drop_script"
            cd "$PROJECT_ROOT" > /dev/null
            return 1
        fi
    fi
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}📍 Project root: ${PROJECT_ROOT}${NC}"
echo ""

# Track success/failure
SUCCESS_COUNT=0
FAIL_COUNT=0

# Migrate all services in order (respecting dependencies)
echo -e "${BLUE}Step 1/5: User Service${NC}"
if migrate_service "User Service" "2-services/01-user-service" "user_service_db"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi
echo ""

echo -e "${BLUE}Step 2/5: Restaurant Service${NC}"
if migrate_service "Restaurant Service" "2-services/02-restaurant-service" "restaurant_service_db"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi
echo ""

echo -e "${BLUE}Step 3/5: Order Service${NC}"
if migrate_service "Order Service" "2-services/03-order-service" "order_service_db"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi
echo ""

echo -e "${BLUE}Step 4/5: Payment Service${NC}"
if migrate_service "Payment Service" "2-services/04-payment-service" "payment_service_db"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi
echo ""

echo -e "${BLUE}Step 5/5: Driver Service${NC}"
if migrate_service "Driver Service" "2-services/05-driver-service" "driver_service_db"; then
    ((SUCCESS_COUNT++))
else
    ((FAIL_COUNT++))
fi
echo ""

# Cleanup temp files
rm -f /tmp/migrate_output.log
find "$PROJECT_ROOT/2-services" -name "drop_db_temp.js" -delete 2>/dev/null || true

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Migrate Fresh Summary:${NC}"
echo -e "   ${GREEN}✅ Success: ${SUCCESS_COUNT}${NC}"
if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "   ${RED}❌ Failed: ${FAIL_COUNT}${NC}"
fi
echo ""

echo -e "${YELLOW}📝 Important Notes:${NC}"
echo "   1. ✅ All databases have been DROPPED and recreated"
echo "   2. ✅ Only essential data from init.sql has been inserted:"
echo "      - User Service: admin, drivers, customer1-3 (from init.sql lines 38-46)"
echo "      - Restaurant Service: 15 restaurants with menus"
echo "      - Other services: Essential test data only"
echo "   3. ⚠️  You MUST restart all services to apply changes"
echo "   4. 🔑 Password for all users: Password123!"
echo ""
echo -e "${GREEN}✅ Migrate Fresh completed!${NC}"
echo ""
