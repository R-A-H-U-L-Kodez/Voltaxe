#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════"
echo "🚀 VOLTAXE PLATFORM - COMPLETE STATUS CHECK"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check Backend API
echo "📊 BACKEND API (Clarity Hub)"
echo "─────────────────────────────────────────────────────────────────"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Status: RUNNING"
    echo "🔗 URL: http://localhost:8000"
    echo "📖 API Docs: http://localhost:8000/docs"
    health=$(curl -s http://localhost:8000/health)
    echo "📋 Health: $health"
else
    echo "❌ Status: NOT RUNNING"
fi
echo ""

# Check Frontend
echo "🌐 FRONTEND DASHBOARD (React)"
echo "─────────────────────────────────────────────────────────────────"
if lsof -i :5174 > /dev/null 2>&1; then
    echo "✅ Status: RUNNING"
    echo "🔗 URL: http://localhost:5174"
    echo "🎨 Framework: React + TypeScript + Vite"
elif lsof -i :5173 > /dev/null 2>&1; then
    echo "✅ Status: RUNNING"
    echo "🔗 URL: http://localhost:5173"
    echo "🎨 Framework: React + TypeScript + Vite"
else
    echo "❌ Status: NOT RUNNING"
fi
echo ""

# Check Axon Engine
echo "🧠 AXON ENGINE (Resilience Scoring)"
echo "─────────────────────────────────────────────────────────────────"
if [ -f /home/rahul/Voltaxe/Voltaxe/services/axon_engine/axon_engine.pid ]; then
    PID=$(cat /home/rahul/Voltaxe/Voltaxe/services/axon_engine/axon_engine.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Status: RUNNING (PID: $PID)"
        echo "📊 Scoring: Every 60 seconds"
        echo "📁 Logs: services/axon_engine/axon_engine.log"
        # Get latest scoring info
        LAST_SCORE=$(tail -5 /home/rahul/Voltaxe/Voltaxe/services/axon_engine/axon_engine.log | grep "Scoring cycle completed" | tail -1)
        if [ ! -z "$LAST_SCORE" ]; then
            echo "🎯 $LAST_SCORE"
        fi
    else
        echo "❌ Status: NOT RUNNING (stale PID file)"
    fi
else
    echo "❌ Status: NOT RUNNING (no PID file)"
fi
echo ""

# Check Resilience Data
echo "📈 RESILIENCE DATA"
echo "─────────────────────────────────────────────────────────────────"
if curl -s http://localhost:8000/resilience/dashboard > /dev/null 2>&1; then
    DASHBOARD=$(curl -s http://localhost:8000/resilience/dashboard)
    TOTAL=$(echo $DASHBOARD | grep -o '"total_endpoints":[0-9]*' | grep -o '[0-9]*')
    AVG=$(echo $DASHBOARD | grep -o '"average_score":[0-9.]*' | grep -o '[0-9.]*')
    echo "✅ Endpoints Monitored: $TOTAL"
    echo "📊 Average Score: $AVG/100"
    echo "🔗 Dashboard API: http://localhost:8000/resilience/dashboard"
else
    echo "❌ Unable to fetch resilience data"
fi
echo ""

# Check Sentinel
echo "👁️  VOLTAXE SENTINEL (Monitoring Agent)"
echo "─────────────────────────────────────────────────────────────────"
if pgrep -f voltaxe_sentinel > /dev/null 2>&1; then
    SENTINEL_PID=$(pgrep -f voltaxe_sentinel)
    echo "✅ Status: RUNNING (PID: $SENTINEL_PID)"
    echo "🔍 Monitoring: System snapshots & events"
else
    echo "⚠️  Status: NOT RUNNING"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "🎯 QUICK ACCESS"
echo "═══════════════════════════════════════════════════════════════════"
echo "🌐 Frontend Dashboard:  http://localhost:5174"
echo "🔌 Backend API:         http://localhost:8000"
echo "📖 API Documentation:   http://localhost:8000/docs"
echo "📊 Resilience Data:     http://localhost:8000/resilience/dashboard"
echo "═══════════════════════════════════════════════════════════════════"
