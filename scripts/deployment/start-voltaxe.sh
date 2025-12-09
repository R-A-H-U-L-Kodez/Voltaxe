#!/bin/bash

# Voltaxe Platform - Ultimate One-Click Launcher
# Just run: ./start-voltaxe.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║              🚀 Starting Voltaxe Platform                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Start all services
echo "⚡ Launching all services..."
sudo docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 8

# Show status
echo ""
echo "📊 Service Status:"
sudo docker-compose ps

# Display access information
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                ✅ Platform is Ready!                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Access Points:"
echo "   • Main UI:    http://localhost:3000"
echo "   • API Docs:   http://localhost:8000/docs"
echo "   • API Health: http://localhost:8000/health"
echo ""
echo "📋 Quick Commands:"
echo "   • View logs:  ./run.sh logs"
echo "   • Stop all:   ./run.sh stop"
echo "   • Check status: ./run.sh status"
echo ""
echo "💡 Opening browser in 3 seconds..."
sleep 3

# Try to open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 2>/dev/null &
elif command -v open &> /dev/null; then
    open http://localhost:3000 2>/dev/null &
fi

echo ""
echo "🎉 Voltaxe Platform is running!"
echo "   Press Ctrl+C to exit (services will keep running)"
echo ""
