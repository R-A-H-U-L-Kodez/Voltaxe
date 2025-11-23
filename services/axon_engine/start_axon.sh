#!/bin/bash

# Voltaxe Axon Engine - ML-Enhanced Production Startup Script

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SERVICE_NAME="Voltaxe Axon Engine (ML-Enhanced)"

echo "🔥 Starting $SERVICE_NAME..."
echo "=================================="
echo "📁 Service Directory: $SCRIPT_DIR"
echo "⏰ Timestamp: $(date)"
echo "🧠 Mode: Deep Learning + Resilience Scoring"
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

# Check for trained models
echo ""
echo "🔍 Checking for ML models..."
if [ -f "$SCRIPT_DIR/deep_classifier.pth" ]; then
    echo "   ✅ Deep Learning model found"
else
    echo "   ⚠️  Deep Learning model missing"
fi
if [ -f "$SCRIPT_DIR/anomaly_model.joblib" ]; then
    echo "   ✅ Anomaly detection model found"
else
    echo "   ⚠️  Anomaly detection model missing"
fi
echo ""

echo "📊 Configuration:"
echo "   - Scoring Interval: $AXON_SCORING_INTERVAL seconds"
echo "   - Active Threshold: $ACTIVE_THRESHOLD_HOURS hours"
echo "   - ML Engine: ENABLED"
echo ""

# Start the ML-enhanced service
echo "🚀 Launching $SERVICE_NAME..."
echo "   (Press Ctrl+C to stop)"
echo "=================================="

cd "$SCRIPT_DIR"
python main_ml_enhanced.py
