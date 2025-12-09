#!/bin/bash

# Voltaxe Platform - Comprehensive Service Management
# Manage all Voltaxe services including the new Axon Engine

set -e

VOLTAXE_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}=================================="
    echo -e "🔥 VOLTAXE PLATFORM MANAGER"
    echo -e "=================================="
    echo -e "⏰ Time: $TIMESTAMP"
    echo -e "📁 Root: $VOLTAXE_ROOT"
    echo -e "==================================${NC}"
}

print_service_status() {
    local service_name="$1"
    local service_path="$2"
    local port="$3"
    
    echo -e "\n${BLUE}📊 $service_name Status:${NC}"
    
    if [ -d "$service_path" ]; then
        echo -e "  ✅ Service directory exists"
        if [ -f "$service_path/main.py" ] || [ -f "$service_path/main.go" ]; then
            echo -e "  ✅ Main executable found"
        else
            echo -e "  ❌ Main executable missing"
        fi
        
        if [ -n "$port" ]; then
            if lsof -i:$port > /dev/null 2>&1; then
                echo -e "  🟢 Running on port $port"
            else
                echo -e "  🔴 Not running on port $port"
            fi
        fi
    else
        echo -e "  ❌ Service directory not found"
    fi
}

start_clarity_hub() {
    echo -e "\n${GREEN}🚀 Starting Clarity Hub API...${NC}"
    cd "$VOLTAXE_ROOT/services/clarity_hub_api"
    
    if [ ! -d "venv" ]; then
        echo -e "  ${YELLOW}📦 Creating virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    echo -e "  ${BLUE}📚 Installing dependencies...${NC}"
    source venv/bin/activate && pip install -r requirements.txt > /dev/null 2>&1
    
    echo -e "  ${PURPLE}🌐 Starting FastAPI server on port 8000...${NC}"
    nohup bash -c "source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000" > clarity_hub.log 2>&1 &
    echo $! > clarity_hub.pid
    
    sleep 3
    if lsof -i:8000 > /dev/null 2>&1; then
        echo -e "  ✅ Clarity Hub API started successfully"
    else
        echo -e "  ❌ Failed to start Clarity Hub API"
    fi
}

start_frontend() {
    echo -e "\n${GREEN}🚀 Starting Frontend Dashboard...${NC}"
    cd "$VOLTAXE_ROOT/frontend"
    
    if [ ! -d "node_modules" ]; then
        echo -e "  ${YELLOW}📦 Installing Node.js dependencies...${NC}"
        npm install > /dev/null 2>&1
    fi
    
    echo -e "  ${PURPLE}🌐 Starting React development server on port 3000...${NC}"
    nohup npm start > frontend.log 2>&1 &
    echo $! > frontend.pid
    
    sleep 5
    if lsof -i:3000 > /dev/null 2>&1; then
        echo -e "  ✅ Frontend Dashboard started successfully"
    else
        echo -e "  ❌ Failed to start Frontend Dashboard"
    fi
}

start_cve_sync() {
    echo -e "\n${GREEN}🚀 Starting CVE Sync Service...${NC}"
    cd "$VOLTAXE_ROOT/services/cve_sync_service"
    
    if [ ! -d "venv" ]; then
        echo -e "  ${YELLOW}📦 Creating virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    echo -e "  ${BLUE}📚 Installing dependencies...${NC}"
    source venv/bin/activate && pip install -r requirements.txt > /dev/null 2>&1
    
    echo -e "  ${PURPLE}🔄 Starting CVE synchronization service...${NC}"
    nohup bash -c "source venv/bin/activate && python main.py" > cve_sync.log 2>&1 &
    echo $! > cve_sync.pid
    
    sleep 2
    if ps -p $(cat cve_sync.pid) > /dev/null 2>&1; then
        echo -e "  ✅ CVE Sync Service started successfully"
    else
        echo -e "  ❌ Failed to start CVE Sync Service"
    fi
}

start_voltaxe_sentinel() {
    echo -e "\n${GREEN}🚀 Starting Voltaxe Sentinel Agent...${NC}"
    cd "$VOLTAXE_ROOT/services/voltaxe_sentinel"
    
    # Build if needed
    if [ ! -f "voltaxe-sentinel-linux-amd64" ]; then
        echo -e "  ${YELLOW}🔨 Building Voltaxe Sentinel...${NC}"
        go build -o voltaxe-sentinel-linux-amd64 main.go
    fi
    
    echo -e "  ${PURPLE}👁️ Starting monitoring agent...${NC}"
    nohup ./voltaxe-sentinel-linux-amd64 > sentinel.log 2>&1 &
    echo $! > sentinel.pid
    
    sleep 2
    if ps -p $(cat sentinel.pid) > /dev/null 2>&1; then
        echo -e "  ✅ Voltaxe Sentinel Agent started successfully"
    else
        echo -e "  ❌ Failed to start Voltaxe Sentinel Agent"
    fi
}

start_axon_engine() {
    echo -e "\n${GREEN}🚀 Starting Axon Engine (Resilience Scoring)...${NC}"
    cd "$VOLTAXE_ROOT/services/axon_engine"
    
    if [ ! -d "venv" ]; then
        echo -e "  ${YELLOW}📦 Creating virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    echo -e "  ${BLUE}📚 Installing dependencies...${NC}"
    source venv/bin/activate && pip install -r requirements.txt > /dev/null 2>&1
    
    echo -e "  ${PURPLE}🧠 Starting resilience scoring engine...${NC}"
    nohup bash -c "source venv/bin/activate && python main.py" > axon_engine.log 2>&1 &
    echo $! > axon_engine.pid
    
    sleep 3
    if ps -p $(cat axon_engine.pid) > /dev/null 2>&1; then
        echo -e "  ✅ Axon Engine started successfully"
    else
        echo -e "  ❌ Failed to start Axon Engine"
    fi
}

stop_service() {
    local service_name="$1"
    local pid_file="$2"
    local service_path="$3"
    
    echo -e "\n${RED}🛑 Stopping $service_name...${NC}"
    
    if [ -f "$service_path/$pid_file" ]; then
        local pid=$(cat "$service_path/$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid
            sleep 2
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid
            fi
            echo -e "  ✅ $service_name stopped"
        else
            echo -e "  ⚠️  $service_name was not running"
        fi
        rm -f "$service_path/$pid_file"
    else
        echo -e "  ⚠️  No PID file found for $service_name"
    fi
}

show_status() {
    print_header
    
    print_service_status "Clarity Hub API" "$VOLTAXE_ROOT/services/clarity_hub_api" "8000"
    print_service_status "Frontend Dashboard" "$VOLTAXE_ROOT/frontend" "3000"  
    print_service_status "CVE Sync Service" "$VOLTAXE_ROOT/services/cve_sync_service" ""
    print_service_status "Voltaxe Sentinel Agent" "$VOLTAXE_ROOT/services/voltaxe_sentinel" ""
    print_service_status "Axon Engine" "$VOLTAXE_ROOT/services/axon_engine" ""
    
    echo -e "\n${CYAN}🌐 Quick Access URLs:${NC}"
    echo -e "  📊 Dashboard: http://localhost:3000"
    echo -e "  🔌 API: http://localhost:8000"
    echo -e "  📖 API Docs: http://localhost:8000/docs"
    echo ""
}

start_all() {
    print_header
    echo -e "\n${GREEN}🚀 Starting All Voltaxe Services...${NC}"
    
    start_clarity_hub
    start_cve_sync
    start_voltaxe_sentinel  
    start_axon_engine
    start_frontend
    
    echo -e "\n${GREEN}✅ All services startup initiated!${NC}"
    echo -e "\n${CYAN}🌐 Access your dashboard at: http://localhost:3000${NC}"
    echo -e "Wait 30 seconds for all services to fully initialize..."
}

stop_all() {
    print_header
    echo -e "\n${RED}🛑 Stopping All Voltaxe Services...${NC}"
    
    stop_service "Frontend Dashboard" "frontend.pid" "$VOLTAXE_ROOT/frontend"
    stop_service "Clarity Hub API" "clarity_hub.pid" "$VOLTAXE_ROOT/services/clarity_hub_api"
    stop_service "CVE Sync Service" "cve_sync.pid" "$VOLTAXE_ROOT/services/cve_sync_service"  
    stop_service "Voltaxe Sentinel Agent" "sentinel.pid" "$VOLTAXE_ROOT/services/voltaxe_sentinel"
    stop_service "Axon Engine" "axon_engine.pid" "$VOLTAXE_ROOT/services/axon_engine"
    
    echo -e "\n${RED}✅ All services stopped!${NC}"
}

show_logs() {
    echo -e "\n${BLUE}📋 Recent Service Logs:${NC}"
    
    echo -e "\n${CYAN}🔌 Clarity Hub API (last 10 lines):${NC}"
    if [ -f "$VOLTAXE_ROOT/services/clarity_hub_api/clarity_hub.log" ]; then
        tail -10 "$VOLTAXE_ROOT/services/clarity_hub_api/clarity_hub.log"
    else
        echo "  No log file found"
    fi
    
    echo -e "\n${CYAN}🔄 CVE Sync Service (last 10 lines):${NC}"
    if [ -f "$VOLTAXE_ROOT/services/cve_sync_service/cve_sync.log" ]; then
        tail -10 "$VOLTAXE_ROOT/services/cve_sync_service/cve_sync.log"
    else
        echo "  No log file found"
    fi
    
    echo -e "\n${CYAN}👁️ Voltaxe Sentinel Agent (last 10 lines):${NC}"
    if [ -f "$VOLTAXE_ROOT/services/voltaxe_sentinel/sentinel.log" ]; then
        tail -10 "$VOLTAXE_ROOT/services/voltaxe_sentinel/sentinel.log"
    else
        echo "  No log file found"
    fi
    
    echo -e "\n${CYAN}🧠 Axon Engine (last 10 lines):${NC}"
    if [ -f "$VOLTAXE_ROOT/services/axon_engine/axon_engine.log" ]; then
        tail -10 "$VOLTAXE_ROOT/services/axon_engine/axon_engine.log"
    else
        echo "  No log file found"
    fi
    
    echo -e "\n${CYAN}🌐 Frontend Dashboard (last 10 lines):${NC}"
    if [ -f "$VOLTAXE_ROOT/frontend/frontend.log" ]; then
        tail -10 "$VOLTAXE_ROOT/frontend/frontend.log"
    else
        echo "  No log file found"
    fi
}

# Main command handling
case "${1:-status}" in
    "start")
        start_all
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        stop_all
        sleep 3
        start_all
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "clarity")
        start_clarity_hub
        ;;
    "frontend")
        start_frontend
        ;;
    "cve")
        start_cve_sync
        ;;
    "sentinel")
        start_voltaxe_sentinel
        ;;
    "axon")
        start_axon_engine
        ;;
    *)
        echo -e "${YELLOW}Voltaxe Platform Manager${NC}"
        echo -e "Usage: $0 {start|stop|restart|status|logs|clarity|frontend|cve|sentinel|axon}"
        echo -e ""
        echo -e "Commands:"
        echo -e "  start     - Start all services"
        echo -e "  stop      - Stop all services" 
        echo -e "  restart   - Restart all services"
        echo -e "  status    - Show service status"
        echo -e "  logs      - Show recent logs"
        echo -e "  clarity   - Start only Clarity Hub API"
        echo -e "  frontend  - Start only Frontend Dashboard"
        echo -e "  cve       - Start only CVE Sync Service"
        echo -e "  sentinel  - Start only Voltaxe Sentinel Agent"
        echo -e "  axon      - Start only Axon Engine"
        ;;
esac