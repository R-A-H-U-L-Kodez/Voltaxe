#!/bin/bash

# Voltaxe Clarity Hub - Service Startup Script
# This script starts the backend and frontend services for development

set -e

echo "🚀 Starting Voltaxe Clarity Hub Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend API..."
    
    # Check if port 8000 is available
    if ! check_port 8000; then
        echo -e "${YELLOW}⚠️  Attempting to kill process on port 8000...${NC}"
        pkill -f "uvicorn.*8000" 2>/dev/null || true
        sleep 2
    fi
    
    cd /home/rahul/Voltaxe/Voltaxe/services/clarity_hub_api
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "📦 Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    echo "📚 Installing/updating Python dependencies..."
    pip install -r requirements.txt
    
    # Start the backend server in background
    echo "🌐 Starting FastAPI server on port 8000..."
    nohup python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
    
    echo -e "${GREEN}✅ Backend API started${NC}"
    cd - > /dev/null
}

# Function to start frontend
start_frontend() {
    echo "🔧 Starting Frontend UI..."
    
    # Check if port 5173 is available
    if ! check_port 5173; then
        echo -e "${YELLOW}⚠️  Attempting to kill process on port 5173...${NC}"
        pkill -f "vite.*5173" 2>/dev/null || true
        sleep 2
    fi
    
    cd /home/rahul/Voltaxe/Voltaxe/services/clarity_hub_ui
    
    # Install npm dependencies
    echo "📚 Installing/updating npm dependencies..."
    npm install
    
    # Start the frontend server in background
    echo "🌐 Starting React development server on port 5173..."
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    
    echo -e "${GREEN}✅ Frontend UI started${NC}"
    cd - > /dev/null
}

# Create logs directory if it doesn't exist
mkdir -p /home/rahul/Voltaxe/Voltaxe/services/logs

# Start services
echo "1️⃣ Starting Backend Services..."
start_backend
echo ""

echo "2️⃣ Starting Frontend Services..."
start_frontend
echo ""

# Wait a moment for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check service health
echo "🔍 Checking service health..."
echo ""

# Check backend health
if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API: Running (http://localhost:8000)${NC}"
else
    echo -e "${RED}❌ Backend API: Not responding${NC}"
fi

# Check frontend health
if curl -s -f http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend UI: Running (http://localhost:5173)${NC}"
else
    echo -e "${RED}❌ Frontend UI: Not responding${NC}"
fi

echo ""
echo "🎉 Service startup complete!"
echo ""
echo "📋 Access Points:"
echo "   🌐 Web UI:      http://localhost:5173"
echo "   📡 API Docs:    http://localhost:8000/docs"
echo "   ❤️  Health:     http://localhost:8000/health"
echo ""
echo "📄 Logs:"
echo "   📁 Backend:     /home/rahul/Voltaxe/Voltaxe/services/logs/backend.log"
echo "   📁 Frontend:    /home/rahul/Voltaxe/Voltaxe/services/logs/frontend.log"
echo ""
echo "🛑 To stop services: ./scripts/stop_services.sh"