#!/bin/bash

# Script untuk menghentikan semua services
# Usage: ./stop-all.sh

echo "🛑 Stopping all services..."

# Kill all Node processes related to this project
pkill -f "npm run dev"
pkill -f "ts-node-dev"
pkill -f "node.*1-api-gateway"
pkill -f "node.*2-services"
pkill -f "node.*3-frontend"

echo "✅ All services stopped!"

