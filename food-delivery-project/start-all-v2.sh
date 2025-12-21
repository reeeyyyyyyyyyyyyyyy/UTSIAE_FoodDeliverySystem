#!/bin/bash

# Script untuk menjalankan semua services secara manual
# Usage: ./start-all.sh

echo "🚀 Starting all services..."

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to start a service
start_service() {
    local service_dir=$1
    local service_name=$2
    
    echo "📦 Starting $service_name..."
    cd "$service_dir"
    
    if [ ! -d "node_modules" ]; then
        echo "⚠️  Dependencies not found. Installing..."
        npm install
    fi
    
    # Create logs directory in project root if it doesn't exist
    mkdir -p "$SCRIPT_DIR/logs"
    
    # Run service and log to project root logs directory
    npm run dev > "$SCRIPT_DIR/logs/$service_name.log" 2>&1 &
    echo "✅ $service_name started (PID: $!)"
    cd "$SCRIPT_DIR"
    sleep 5  # Increased from 2 to 5 seconds
}

# Create logs directory
mkdir -p logs

# Start API Gateway
start_service "1-api-gateway" "api-gateway"

# Start User Service
start_service "2-services/01-user-service" "user-service"

# Start Restaurant Service
start_service "2-services/02-restaurant-service" "restaurant-service"

# Start Order Service
start_service "2-services/03-order-service" "order-service"

# Start Payment Service
start_service "2-services/04-payment-service" "payment-service"

# Start Driver Service
start_service "2-services/05-driver-service" "driver-service"

# Start Frontend
start_service "3-frontend" "frontend"

echo ""
echo "⏳ Waiting for services to fully start... (allow 30-45 seconds for first startup)"
sleep 30

echo ""
echo "🎉 All services started!"
echo ""
echo "📋 Service URLs:"
echo "  - API Gateway:        http://localhost:3000"
echo "  - User Service:       http://localhost:3001"
echo "  - Restaurant Service: http://localhost:3002"
echo "  - Order Service:      http://localhost:3003"
echo "  - Payment Service:    http://localhost:3004"
echo "  - Driver Service:     http://localhost:3005"
echo "  - Frontend:           http://localhost:5173"
echo ""
echo "📝 View logs:"
echo "  - tail -f logs/api-gateway.log"
echo "  - tail -f logs/user-service.log"
echo "  - tail -f logs/restaurant-service.log"
echo "  - tail -f logs/order-service.log"
echo "  - tail -f logs/payment-service.log"
echo "  - tail -f logs/driver-service.log"
echo "  - tail -f logs/frontend.log"
echo ""
echo "✋ Press Ctrl+C to stop monitoring. Services will continue running in background."

# Wait for user to press Ctrl+C
wait