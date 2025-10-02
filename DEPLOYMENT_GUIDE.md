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

