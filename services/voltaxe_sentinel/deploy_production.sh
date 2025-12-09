#!/bin/bash
set -euo pipefail

# Voltaxe Sentinel Production Deployment Script
# ==============================================

VERSION="3.0.0"
BINARY_NAME="voltaxe_sentinel"
SERVICE_NAME="voltaxe-sentinel"
INSTALL_DIR="/usr/local/bin"
SERVICE_DIR="/etc/systemd/system"
LOG_DIR="/var/log/voltaxe"
CONFIG_DIR="/etc/voltaxe"

echo "🔒 Voltaxe Sentinel v${VERSION} Production Deployment"
echo "=================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ Error: This script must be run as root for production deployment"
   echo "   Use: sudo $0"
   exit 1
fi

# Check if binary exists and is executable
if [[ ! -f "./${BINARY_NAME}" ]]; then
    echo "❌ Error: Binary './${BINARY_NAME}' not found"
    echo "   Please run 'go build -o ${BINARY_NAME} main.go' first"
    exit 1
fi

echo "✅ Found binary: ./${BINARY_NAME}"

# Test binary functionality
echo "🔍 Testing binary functionality..."
if ! ./${BINARY_NAME} --version >/dev/null 2>&1; then
    echo "❌ Error: Binary test failed"
    exit 1
fi
echo "✅ Binary test passed"

# Create directories
echo "📁 Creating directories..."
mkdir -p "${LOG_DIR}"
mkdir -p "${CONFIG_DIR}"
chown root:root "${LOG_DIR}" "${CONFIG_DIR}"
chmod 755 "${LOG_DIR}" "${CONFIG_DIR}"
echo "✅ Directories created"

# Install binary
echo "📦 Installing binary..."
cp "./${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
chown root:root "${INSTALL_DIR}/${BINARY_NAME}"
chmod 755 "${INSTALL_DIR}/${BINARY_NAME}"
echo "✅ Binary installed to ${INSTALL_DIR}/${BINARY_NAME}"

# Install systemd service
if [[ -f "./${SERVICE_NAME}.service" ]]; then
    echo "⚙️  Installing systemd service..."
    cp "./${SERVICE_NAME}.service" "${SERVICE_DIR}/${SERVICE_NAME}.service"
    chown root:root "${SERVICE_DIR}/${SERVICE_NAME}.service"
    chmod 644 "${SERVICE_DIR}/${SERVICE_NAME}.service"
    echo "✅ Service file installed"
    
    # Reload systemd and enable service
    echo "🔄 Reloading systemd configuration..."
    systemctl daemon-reload
    systemctl enable "${SERVICE_NAME}"
    echo "✅ Service enabled for auto-start"
else
    echo "⚠️  Warning: Service file './${SERVICE_NAME}.service' not found"
    echo "   Manual service management required"
fi

# Test installation
echo "🧪 Testing installation..."
if "${INSTALL_DIR}/${BINARY_NAME}" --version >/dev/null 2>&1; then
    echo "✅ Installation test passed"
else
    echo "❌ Installation test failed"
    exit 1
fi

echo ""
echo "🎉 Voltaxe Sentinel deployment completed successfully!"
echo ""
echo "📋 Management Commands:"
echo "   Start service:    systemctl start ${SERVICE_NAME}"
echo "   Stop service:     systemctl stop ${SERVICE_NAME}"
echo "   Service status:   systemctl status ${SERVICE_NAME}"
echo "   View logs:        journalctl -u ${SERVICE_NAME} -f"
echo "   Manual run:       ${INSTALL_DIR}/${BINARY_NAME} --help"
echo ""
echo "📊 Default Configuration:"
echo "   Mode:             Daemon (continuous monitoring)"
echo "   Scan Interval:    6 hours"
echo "   Log Location:     /var/log/voltaxe/"
echo "   Service Status:   Enabled (auto-start)"
echo ""
echo "🚀 To start monitoring immediately:"
echo "   systemctl start ${SERVICE_NAME}"
echo ""