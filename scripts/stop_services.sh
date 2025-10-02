#!/bin/bash

# Voltaxe Clarity Hub - Service Stop Script
# This script stops the backend and frontend services

set -e

echo "🛑 Stopping Voltaxe Clarity Hub Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to stop process on port
stop_port() {
    local port=$1
    local service_name=$2
    
    echo "🔍 Checking for processes on port $port..."
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⏳ Stopping $service_name on port $port...${NC}"
        pkill -f ".*$port" 2>/dev/null || true
        sleep 2
        
        # Double check if process is still running
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${RED}⚠️  Force killing processes on port $port${NC}"
            fuser -k $port/tcp 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ $service_name stopped${NC}"
    else
        echo -e "${GREEN}✅ No process running on port $port${NC}"
    fi
}

# Stop backend (port 8000)
echo "1️⃣ Stopping Backend API..."
stop_port 8000 "Backend API"
pkill -f "uvicorn" 2>/dev/null || true
echo ""

# Stop frontend (port 5173)
echo "2️⃣ Stopping Frontend UI..."
stop_port 5173 "Frontend UI"
pkill -f "vite" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
echo ""

echo "🎉 All services stopped successfully!"
echo ""
echo "📄 Log files preserved at:"
echo "   📁 Backend:     /home/rahul/Voltaxe/Voltaxe/services/logs/backend.log"
echo "   📁 Frontend:    /home/rahul/Voltaxe/Voltaxe/services/logs/frontend.log"