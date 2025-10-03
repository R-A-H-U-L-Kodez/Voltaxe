#!/bin/bash

# Voltaxe Platform - One Command Launcher
# Usage: ./run.sh [start|stop|restart|logs|status|build]

cd "$(dirname "$0")"

case "$1" in
    start)
        echo "🚀 Starting Voltaxe Platform..."
        sudo docker-compose up -d
        echo ""
        echo "✅ Platform is starting!"
        echo "📊 Checking status in 5 seconds..."
        sleep 5
        sudo docker-compose ps
        echo ""
        echo "🌐 Access your platform at:"
        echo "   Frontend: http://localhost:3000"
        echo "   API Docs: http://localhost:8000/docs"
        echo ""
        echo "💡 View logs with: ./run.sh logs"
        ;;
    
    stop)
        echo "🛑 Stopping Voltaxe Platform..."
        sudo docker-compose down
        echo "✅ Platform stopped!"
        ;;
    
    restart)
        echo "🔄 Restarting Voltaxe Platform..."
        sudo docker-compose restart
        echo "✅ Platform restarted!"
        sudo docker-compose ps
        ;;
    
    logs)
        echo "📋 Showing live logs (Ctrl+C to exit)..."
        sudo docker-compose logs -f
        ;;
    
    status)
        echo "📊 Voltaxe Platform Status:"
        sudo docker-compose ps
        ;;
    
    build)
        echo "🔨 Rebuilding and starting Voltaxe Platform..."
        sudo docker-compose up -d --build
        echo ""
        echo "✅ Platform rebuilt and started!"
        sudo docker-compose ps
        ;;
    
    *)
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║           Voltaxe Platform - Quick Launcher               ║"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Usage: ./run.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services (⭐ USE THIS!)"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  logs    - View live logs"
        echo "  status  - Check services status"
        echo "  build   - Rebuild and start (after code changes)"
        echo ""
        echo "Examples:"
        echo "  ./run.sh start    # Start everything"
        echo "  ./run.sh logs     # Watch logs"
        echo "  ./run.sh stop     # Stop everything"
        echo ""
        echo "🌐 After starting, access at: http://localhost:3000"
        ;;
esac
