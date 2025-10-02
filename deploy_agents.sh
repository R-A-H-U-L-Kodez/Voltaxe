#!/bin/bash

# Voltaxe Agent Deployment Script
# Deploys Voltaxe Sentinel agents to monitored endpoints

set -e

echo "🚀 Voltaxe Agent Deployment System"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SENTINEL_BINARY="voltaxe_sentinel"
CONFIG_DIR="config"
DEPLOYMENT_DIR="deployment"

# Create deployment directory structure
setup_deployment_structure() {
    echo -e "${BLUE}📁 Setting up deployment structure...${NC}"
    
    mkdir -p "$DEPLOYMENT_DIR"/{linux,windows,darwin}/{amd64,arm64}
    mkdir -p "$CONFIG_DIR"
    
    echo "✅ Deployment directories created"
}

# Build cross-platform binaries
build_cross_platform() {
    echo -e "${BLUE}🔨 Building cross-platform Voltaxe Sentinel binaries...${NC}"
    
    cd /home/rahul/Voltaxe/Voltaxe/services/voltaxe_sentinel
    
    # Linux builds
    echo "Building Linux binaries..."
    GOOS=linux GOARCH=amd64 go build -o ../../$DEPLOYMENT_DIR/linux/amd64/voltaxe_sentinel main.go
    GOOS=linux GOARCH=arm64 go build -o ../../$DEPLOYMENT_DIR/linux/arm64/voltaxe_sentinel main.go
    
    # Windows builds
    echo "Building Windows binaries..."
    GOOS=windows GOARCH=amd64 go build -o ../../$DEPLOYMENT_DIR/windows/amd64/voltaxe_sentinel.exe main.go
    GOOS=windows GOARCH=arm64 go build -o ../../$DEPLOYMENT_DIR/windows/arm64/voltaxe_sentinel.exe main.go
    
    # macOS builds  
    echo "Building macOS binaries..."
    GOOS=darwin GOARCH=amd64 go build -o ../../$DEPLOYMENT_DIR/darwin/amd64/voltaxe_sentinel main.go
    GOOS=darwin GOARCH=arm64 go build -o ../../$DEPLOYMENT_DIR/darwin/arm64/voltaxe_sentinel main.go
    
    cd ../..
    echo "✅ Cross-platform binaries built successfully"
}

# Generate configuration files
generate_configs() {
    echo -e "${BLUE}📄 Generating configuration files...${NC}"
    
    # Agent configuration
    cat > "$CONFIG_DIR/agent.conf" << 'EOF'
# Voltaxe Sentinel Agent Configuration

# API Server Configuration
API_SERVER=http://localhost:8000
HEARTBEAT_INTERVAL=30s
RETRY_ATTEMPTS=3
RETRY_DELAY=5s

# Monitoring Configuration  
SCAN_INTERVAL=60s
PROCESS_MONITORING=true
VULNERABILITY_SCANNING=true
BEHAVIORAL_ANALYSIS=true

# Security Settings
AGENT_ID=auto-generate
ENCRYPTION_ENABLED=true
TLS_VERIFY=true

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/voltaxe/agent.log
MAX_LOG_SIZE=100MB
LOG_RETENTION_DAYS=30

# Resource Limits
MAX_CPU_USAGE=10%
MAX_MEMORY_USAGE=256MB
EOF

    # Installation script for Linux
    cat > "$DEPLOYMENT_DIR/install_linux.sh" << 'EOF'
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
EOF

    # Installation script for Windows
    cat > "$DEPLOYMENT_DIR/install_windows.ps1" << 'EOF'
# Voltaxe Sentinel Agent - Windows Installation Script

Write-Host "🚀 Installing Voltaxe Sentinel Agent..." -ForegroundColor Green

$InstallDir = "C:\Program Files\Voltaxe"
$ServiceName = "VoltaxeSentinel"
$LogDir = "C:\ProgramData\Voltaxe\Logs"

# Create directories
New-Item -Path $InstallDir -ItemType Directory -Force
New-Item -Path $LogDir -ItemType Directory -Force

# Determine architecture and copy binary
$Arch = (Get-WmiObject -Class Win32_Processor).Architecture
switch ($Arch) {
    9 { $BinaryPath = "windows\amd64\voltaxe_sentinel.exe" }
    12 { $BinaryPath = "windows\arm64\voltaxe_sentinel.exe" }
    default { 
        Write-Error "❌ Unsupported architecture: $Arch"
        exit 1
    }
}

Copy-Item $BinaryPath "$InstallDir\voltaxe_sentinel.exe"
Copy-Item "..\config\agent.conf" "$InstallDir\"

# Create Windows service
$servicePath = "`"$InstallDir\voltaxe_sentinel.exe`""
New-Service -Name $ServiceName -BinaryPathName $servicePath -DisplayName "Voltaxe Sentinel Security Agent" -StartupType Automatic

# Start service
Start-Service -Name $ServiceName

Write-Host "✅ Voltaxe Sentinel Agent installed and started!" -ForegroundColor Green
Write-Host "📊 Status: Get-Service $ServiceName" -ForegroundColor Cyan
Write-Host "📋 Logs: Get-EventLog -LogName Application -Source VoltaxeSentinel" -ForegroundColor Cyan
EOF

    # Make scripts executable
    chmod +x "$DEPLOYMENT_DIR/install_linux.sh"
    
    echo "✅ Configuration files generated"
}

# Generate deployment package
create_deployment_package() {
    echo -e "${BLUE}📦 Creating deployment package...${NC}"
    
    # Create deployment archive
    tar -czf voltaxe_agent_deployment.tar.gz $DEPLOYMENT_DIR $CONFIG_DIR
    
    echo "✅ Deployment package created: voltaxe_agent_deployment.tar.gz"
}

# Generate documentation
generate_documentation() {
    echo -e "${BLUE}📚 Generating deployment documentation...${NC}"
    
    cat > "DEPLOYMENT_GUIDE.md" << 'EOF'
# Voltaxe Agent Deployment Guide

## Overview

This guide covers deploying Voltaxe Sentinel agents to monitored endpoints for comprehensive security monitoring.

## Supported Platforms

- **Linux**: Ubuntu, CentOS, RHEL, Debian (AMD64, ARM64)
- **Windows**: Windows 10/11, Windows Server (AMD64, ARM64)  
- **macOS**: macOS 10.15+ (Intel, Apple Silicon)

## Quick Deployment

### Linux Systems

```bash
# Extract deployment package
tar -xzf voltaxe_agent_deployment.tar.gz

# Install agent
cd deployment
sudo ./install_linux.sh

# Verify installation
sudo systemctl status voltaxe-sentinel
```

### Windows Systems

```powershell
# Extract deployment package
Expand-Archive voltaxe_agent_deployment.zip

# Install agent (Run as Administrator)
cd deployment
.\install_windows.ps1

# Verify installation
Get-Service VoltaxeSentinel
```

### Manual Installation

1. **Choose the correct binary** for your platform:
   - `deployment/linux/amd64/voltaxe_sentinel` - Linux x64
   - `deployment/windows/amd64/voltaxe_sentinel.exe` - Windows x64
   - `deployment/darwin/amd64/voltaxe_sentinel` - macOS Intel
   - etc.

2. **Copy binary and config** to target system
3. **Configure agent.conf** with your API server URL
4. **Run agent** as a service or daemon

## Configuration

Edit `config/agent.conf` to customize:

```conf
# API Server (point to your Voltaxe API)
API_SERVER=https://your-voltaxe-server.com:8000

# Monitoring intervals
SCAN_INTERVAL=60s
HEARTBEAT_INTERVAL=30s

# Security settings
ENCRYPTION_ENABLED=true
TLS_VERIFY=true
```

## Monitoring Deployment

Once agents are deployed:

1. **Check agent status** in Voltaxe dashboard
2. **View real-time data** from monitored endpoints  
3. **Receive security alerts** for detected threats
4. **Generate reports** across all monitored systems

## Troubleshooting

### Agent Not Connecting
- Check firewall rules (port 8000)
- Verify API_SERVER URL in agent.conf
- Check agent logs for connection errors

### High Resource Usage
- Adjust SCAN_INTERVAL in config
- Set appropriate resource limits
- Monitor system performance

### Missing Data
- Verify agent permissions
- Check log files for errors
- Ensure network connectivity

## Security Considerations

- Use HTTPS/TLS for agent communications
- Implement certificate pinning in production
- Regular agent updates for security patches
- Monitor agent integrity and authenticity

EOF

    echo "✅ Documentation generated: DEPLOYMENT_GUIDE.md"
}

# Main deployment function
main() {
    echo -e "${GREEN}Setting up Voltaxe Agent deployment system...${NC}"
    echo ""
    
    setup_deployment_structure
    build_cross_platform
    generate_configs
    create_deployment_package
    generate_documentation
    
    echo ""
    echo -e "${GREEN}🎉 Voltaxe Agent Deployment System Ready!${NC}"
    echo ""
    echo -e "${YELLOW}📦 Deployment Package:${NC} voltaxe_agent_deployment.tar.gz"
    echo -e "${YELLOW}📚 Documentation:${NC} DEPLOYMENT_GUIDE.md"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Extract deployment package on target systems"
    echo "2. Run appropriate installation script"
    echo "3. Configure agent.conf with your API server"
    echo "4. Monitor agents in Voltaxe dashboard"
    echo ""
    echo -e "${GREEN}🚀 Ready for enterprise deployment!${NC}"
}

# Run main function
main "$@"