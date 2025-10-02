#!/bin/bash

# Voltaxe Sentinel Agent - Linux Installation Script

set -e

INSTALL_DIR="/opt/voltaxe"
SERVICE_NAME="voltaxe-sentinel"
LOG_DIR="/var/log/voltaxe"

echo "🚀 Installing Voltaxe Sentinel Agent..."

# Create directories
sudo mkdir -p "$INSTALL_DIR" "$LOG_DIR"

# Determine architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64) BINARY_PATH="linux/amd64/voltaxe_sentinel" ;;
    aarch64|arm64) BINARY_PATH="linux/arm64/voltaxe_sentinel" ;;
    *) echo "❌ Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Copy binary and config
sudo cp "$BINARY_PATH" "$INSTALL_DIR/"
sudo cp "../config/agent.conf" "$INSTALL_DIR/"
sudo chmod +x "$INSTALL_DIR/voltaxe_sentinel"

# Create systemd service
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << 'SERVICE_EOF'
[Unit]
Description=Voltaxe Sentinel Security Agent
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=5
User=voltaxe
Group=voltaxe
ExecStart=/opt/voltaxe/voltaxe_sentinel
WorkingDirectory=/opt/voltaxe
StandardOutput=append:/var/log/voltaxe/agent.log
StandardError=append:/var/log/voltaxe/agent.log

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# Create user
sudo useradd -r -s /bin/false voltaxe 2>/dev/null || true
sudo chown -R voltaxe:voltaxe "$INSTALL_DIR" "$LOG_DIR"

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

echo "✅ Voltaxe Sentinel Agent installed and started!"
echo "📊 Status: sudo systemctl status $SERVICE_NAME"
echo "📋 Logs: sudo journalctl -u $SERVICE_NAME -f"
