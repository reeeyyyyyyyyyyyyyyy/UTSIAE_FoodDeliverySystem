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
    local extra_args=$3

    echo "📦 Starting $service_name..."
    cd "$service_dir"

    if [ ! -d "node_modules" ]; then
        echo "⚠️  Dependencies not found. Installing..."
        npm install
    fi

    mkdir -p "$SCRIPT_DIR/logs"

    # Pass extra args to npm script (npm forwards them after --)
    if [ -n "$extra_args" ]; then
        npm run dev -- $extra_args > "$SCRIPT_DIR/logs/$service_name.log" 2>&1 &
    else
        npm run dev > "$SCRIPT_DIR/logs/$service_name.log" 2>&1 &
    fi

    echo "✅ $service_name started (PID: $!)"
    cd "$SCRIPT_DIR"
    sleep 5
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
# Start Driver Service (ignore swagger file changes to avoid restarts)
start_service "2-services/05-driver-service" "driver-service" "--ignore-watch src/config/swagger.ts --ignore-watch src/config"

# Start Frontend
start_service "3-frontend" "frontend"

echo ""
echo "✅ All services started!"
echo "📝 Logs are in the 'logs' directory"
echo "🌐 Frontend: http://localhost:5173"
echo "🔗 API Gateway: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "Or run './stop-all.sh' to stop all services"

# Wait for user interrupt
trap 'echo ""; echo "🛑 Stopping all services..."; pkill -f "npm run dev"; pkill -f "ts-node-dev"; echo "✅ All services stopped"; exit' INT

# Keep script running
wait

