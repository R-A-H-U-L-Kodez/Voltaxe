#!/bin/bash

# Voltaxe Axon Engine - Resilience Scoring Service Startup Script

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SERVICE_NAME="Voltaxe Axon Engine"

echo "🔥 Starting $SERVICE_NAME..."
echo "=================================="
echo "📁 Service Directory: $SCRIPT_DIR"
echo "⏰ Timestamp: $(date)"
echo ""

# Activate virtual environment
echo "🐍 Activating Python virtual environment..."
source "$SCRIPT_DIR/venv/bin/activate"

# Check if .env file exists in parent directories
if [ -f "$SCRIPT_DIR/../.env" ]; then
    echo "📄 Found .env in parent directory"
elif [ -f "$SCRIPT_DIR/../../.env" ]; then
    echo "📄 Found .env in grandparent directory"  
elif [ -f "$SCRIPT_DIR/.env" ]; then
    echo "📄 Found .env in current directory"
else
    echo "⚠️  Warning: No .env file found for database configuration"
fi

# Set default environment variables if not set
export AXON_SCORING_INTERVAL=${AXON_SCORING_INTERVAL:-60}
export ACTIVE_THRESHOLD_HOURS=${ACTIVE_THRESHOLD_HOURS:-24}

echo "📊 Configuration:"
echo "   - Scoring Interval: $AXON_SCORING_INTERVAL seconds"
echo "   - Active Threshold: $ACTIVE_THRESHOLD_HOURS hours"
echo ""

# Start the service
echo "🚀 Launching $SERVICE_NAME..."
echo "   (Press Ctrl+C to stop)"
echo "=================================="

python main.py