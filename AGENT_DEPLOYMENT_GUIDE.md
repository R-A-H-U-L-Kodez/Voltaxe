# 🚀 Voltaxe Sentinel - Production Deployment Guide

## Overview

This guide covers building, packaging, and deploying Voltaxe Sentinel agents to production endpoints across multiple platforms.

---

## 📦 Building Production Installers

### Quick Start

Build all platform installers:
```bash
./build_agents.sh --all
```

Build specific platforms:
```bash
./build_agents.sh --linux          # Linux .deb package
./build_agents.sh --windows        # Windows .exe installer
./build_agents.sh --macos          # macOS .pkg package
```

Custom version:
```bash
./build_agents.sh --version 2.0.0 --all
```

Clean build:
```bash
./build_agents.sh --clean --all
```

### Build Requirements

#### All Platforms
- **Go 1.24+** - Required for compilation
- **Git** - Version control
- **Make** - Build automation

#### Linux Package Building
```bash
sudo apt-get update
sudo apt-get install -y \
    dpkg-dev \
    fakeroot \
    build-essential
```

#### Windows Installer Building
```bash
# On Linux (cross-compilation)
sudo apt-get install -y nsis

# On Windows
# Download and install NSIS from: https://nsis.sourceforge.io/
```

#### macOS Package Building
```bash
# Only available on macOS - uses native pkgbuild
# No additional installation required
```

---

## 🏗️ Build Architecture

### Build Output Structure

```
dist/
├── voltaxe-sentinel_1.0.0-20251005_amd64.deb       # Linux Debian/Ubuntu
├── voltaxe-sentinel_1.0.0-20251005_setup.exe       # Windows Installer
├── voltaxe-sentinel_1.0.0-20251005.pkg             # macOS Installer
├── checksums.txt                                    # SHA256 checksums
└── BUILD_MANIFEST.txt                              # Build information
```

### Binary Compilation Details

| Platform | Architecture | Output Format | Size |
|----------|-------------|---------------|------|
| Linux    | amd64       | ELF binary    | ~8 MB |
| Linux    | arm64       | ELF binary    | ~8 MB |
| Windows  | amd64       | PE executable | ~8 MB |
| macOS    | amd64       | Mach-O binary | ~8 MB |
| macOS    | arm64       | Mach-O binary | ~8 MB |

**Build Flags:**
```bash
CGO_ENABLED=0                                    # Static linking
-ldflags="-s -w"                                # Strip symbols
-ldflags="-X main.Version=${VERSION}"           # Embed version
-ldflags="-X main.BuildDate=${BUILD_DATE}"      # Embed build date
```

---

## 📋 Platform-Specific Installation

### Linux (Debian/Ubuntu) - .deb Package

#### Installation
```bash
# Download package
wget https://releases.voltaxe.com/sentinel/voltaxe-sentinel_1.0.0_amd64.deb

# Verify checksum
sha256sum voltaxe-sentinel_1.0.0_amd64.deb

# Install
sudo dpkg -i voltaxe-sentinel_1.0.0_amd64.deb

# Fix dependencies if needed
sudo apt-get install -f
```

#### Post-Installation Setup
```bash
# Configure the agent
sudo nano /etc/voltaxe/sentinel.conf

# Edit these settings:
API_SERVER=https://your-clarity-hub.com
API_KEY=your-api-key-here

# Start the service
sudo systemctl start voltaxe-sentinel

# Enable auto-start on boot
sudo systemctl enable voltaxe-sentinel

# Check status
sudo systemctl status voltaxe-sentinel

# View logs
sudo journalctl -u voltaxe-sentinel -f
```

#### Package Contents
```
/usr/local/bin/voltaxe-sentinel              # Binary
/etc/voltaxe/sentinel.conf                   # Configuration
/lib/systemd/system/voltaxe-sentinel.service # Systemd service
/var/log/voltaxe/                            # Log directory
```

#### Uninstallation
```bash
sudo systemctl stop voltaxe-sentinel
sudo systemctl disable voltaxe-sentinel
sudo dpkg -r voltaxe-sentinel
```

---

### Windows - .exe Installer

#### Installation
1. **Download** installer:
   - Visit: https://releases.voltaxe.com/sentinel/
   - Download: `voltaxe-sentinel_1.0.0_setup.exe`

2. **Verify Checksum**:
   ```powershell
   Get-FileHash voltaxe-sentinel_1.0.0_setup.exe -Algorithm SHA256
   ```

3. **Run Installer**:
   - Right-click installer → "Run as Administrator"
   - Follow installation wizard
   - Choose installation directory (default: `C:\Program Files\Voltaxe\Sentinel`)

4. **Configuration**:
   ```
   Location: C:\ProgramData\Voltaxe\Sentinel\sentinel.conf
   
   Edit with Notepad (as Administrator):
   API_SERVER=https://your-clarity-hub.com
   API_KEY=your-api-key-here
   ```

5. **Start Service**:
   ```powershell
   # Start service
   sc start VoltaxeSentinel
   
   # Set to auto-start
   sc config VoltaxeSentinel start= auto
   
   # Check status
   sc query VoltaxeSentinel
   ```

#### Service Management (PowerShell)
```powershell
# Start service
Start-Service VoltaxeSentinel

# Stop service
Stop-Service VoltaxeSentinel

# Restart service
Restart-Service VoltaxeSentinel

# Check status
Get-Service VoltaxeSentinel

# View event logs
Get-EventLog -LogName Application -Source "Voltaxe Sentinel" -Newest 50
```

#### Uninstallation
```
Control Panel → Programs → Uninstall a Program → Voltaxe Sentinel
```

---

### macOS - .pkg Installer

#### Installation
```bash
# Download package
curl -O https://releases.voltaxe.com/sentinel/voltaxe-sentinel_1.0.0.pkg

# Verify checksum
shasum -a 256 voltaxe-sentinel_1.0.0.pkg

# Install (requires admin password)
sudo installer -pkg voltaxe-sentinel_1.0.0.pkg -target /
```

#### Configuration
```bash
# Edit configuration
sudo nano /etc/voltaxe/sentinel.conf

# Set your API server and key
API_SERVER=https://your-clarity-hub.com
API_KEY=your-api-key-here
```

#### Service Management
```bash
# Start service
sudo launchctl load /Library/LaunchDaemons/com.voltaxe.sentinel.plist

# Stop service
sudo launchctl unload /Library/LaunchDaemons/com.voltaxe.sentinel.plist

# Check if running
sudo launchctl list | grep voltaxe

# View logs
tail -f /var/log/voltaxe/sentinel.log
```

#### Package Contents
```
/usr/local/bin/voltaxe-sentinel              # Universal binary
/etc/voltaxe/sentinel.conf                   # Configuration
/Library/LaunchDaemons/com.voltaxe.sentinel.plist  # Launch daemon
/var/log/voltaxe/                            # Logs
```

#### Uninstallation
```bash
# Stop service
sudo launchctl unload /Library/LaunchDaemons/com.voltaxe.sentinel.plist

# Remove files
sudo rm /usr/local/bin/voltaxe-sentinel
sudo rm /Library/LaunchDaemons/com.voltaxe.sentinel.plist
sudo rm -rf /etc/voltaxe
sudo rm -rf /var/log/voltaxe
```

---

## 🔐 Security Configuration

### API Authentication

#### Generate API Key
```bash
# On Clarity Hub server
curl -X POST http://localhost:8000/api/v1/agent/generate-key \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Endpoint - Server01",
    "description": "Windows Server 2022",
    "permissions": ["monitor", "report", "scan"]
  }'
```

#### Configure Agent
```bash
# Linux/macOS
sudo nano /etc/voltaxe/sentinel.conf

# Windows
notepad C:\ProgramData\Voltaxe\Sentinel\sentinel.conf

# Add API key
API_KEY=vltx_prod_abc123xyz789...
```

### TLS/SSL Configuration

For production deployments with HTTPS:

```conf
API_SERVER=https://clarity-hub.voltaxe.com
TLS_VERIFY=true
TLS_CERT_PATH=/etc/voltaxe/certs/ca.crt  # Optional custom CA
```

---

## 📊 Monitoring & Verification

### Health Check Endpoints

Once installed, agents expose health endpoints:

```bash
# Check agent health
curl http://localhost:9090/health

# Expected response:
{
  "status": "healthy",
  "version": "1.0.0-20251005",
  "uptime": 3600,
  "last_heartbeat": "2025-10-05T10:30:00Z"
}
```

### Verify Agent Registration

On Clarity Hub dashboard:
```
http://your-clarity-hub/endpoints
```

Should show:
- ✅ **Hostname**: server01.example.com
- ✅ **Status**: Active (Green)
- ✅ **Last Seen**: < 1 minute ago
- ✅ **Agent Version**: 1.0.0

### Log Verification

#### Linux
```bash
sudo journalctl -u voltaxe-sentinel -n 50

# Should see:
# ✅ Agent started successfully
# ✅ Connected to API server
# ✅ Heartbeat sent
# ✅ System scan completed
```

#### Windows
```powershell
Get-EventLog -LogName Application -Source "Voltaxe Sentinel" -Newest 20

# Should see:
# ✅ Service started
# ✅ API connection established
# ✅ Monitoring active
```

#### macOS
```bash
tail -n 50 /var/log/voltaxe/sentinel.log

# Should see:
# ✅ Sentinel initialized
# ✅ API connection: OK
# ✅ Monitoring enabled
```

---

## 🚀 Mass Deployment Strategies

### Ansible Playbook (Linux Fleet)

```yaml
---
- name: Deploy Voltaxe Sentinel to Linux fleet
  hosts: monitored_servers
  become: yes
  
  vars:
    sentinel_version: "1.0.0-20251005"
    api_server: "https://clarity-hub.voltaxe.com"
    api_key: "{{ vault_sentinel_api_key }}"
  
  tasks:
    - name: Download Sentinel package
      get_url:
        url: "https://releases.voltaxe.com/sentinel/voltaxe-sentinel_{{ sentinel_version }}_amd64.deb"
        dest: "/tmp/voltaxe-sentinel.deb"
        checksum: "sha256:{{ sentinel_checksum }}"
    
    - name: Install Sentinel
      apt:
        deb: "/tmp/voltaxe-sentinel.deb"
        state: present
    
    - name: Configure Sentinel
      template:
        src: sentinel.conf.j2
        dest: /etc/voltaxe/sentinel.conf
        owner: root
        group: root
        mode: '0600'
    
    - name: Start and enable Sentinel
      systemd:
        name: voltaxe-sentinel
        state: started
        enabled: yes
    
    - name: Verify Sentinel is running
      systemd:
        name: voltaxe-sentinel
        state: started
      register: sentinel_status
      failed_when: sentinel_status.status.ActiveState != "active"
```

### PowerShell Mass Deployment (Windows)

```powershell
# deploy_sentinel.ps1
param(
    [string[]]$Computers = (Get-Content computers.txt),
    [string]$ApiServer = "https://clarity-hub.voltaxe.com",
    [string]$ApiKey = $env:SENTINEL_API_KEY
)

foreach ($computer in $Computers) {
    Write-Host "Deploying to $computer..." -ForegroundColor Cyan
    
    Invoke-Command -ComputerName $computer -ScriptBlock {
        param($apiServer, $apiKey)
        
        # Download installer
        $installerUrl = "https://releases.voltaxe.com/sentinel/voltaxe-sentinel_setup.exe"
        $installerPath = "$env:TEMP\voltaxe-sentinel_setup.exe"
        
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
        
        # Silent install
        Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait
        
        # Configure
        $configPath = "C:\ProgramData\Voltaxe\Sentinel\sentinel.conf"
        @"
API_SERVER=$apiServer
API_KEY=$apiKey
HEARTBEAT_INTERVAL=30
SCAN_INTERVAL=60
"@ | Set-Content -Path $configPath
        
        # Start service
        Start-Service VoltaxeSentinel
        
    } -ArgumentList $ApiServer, $ApiKey
    
    Write-Host "✅ Deployed to $computer" -ForegroundColor Green
}
```

### Docker Container Deployment

For containerized environments:

```dockerfile
# Dockerfile
FROM debian:bullseye-slim

# Install Sentinel
COPY dist/voltaxe-sentinel_1.0.0_amd64.deb /tmp/
RUN dpkg -i /tmp/voltaxe-sentinel_1.0.0_amd64.deb && \
    rm /tmp/voltaxe-sentinel_1.0.0_amd64.deb

# Configuration
ENV API_SERVER=http://clarity-hub:8000
ENV API_KEY=
ENV HEARTBEAT_INTERVAL=30

CMD ["/usr/local/bin/voltaxe-sentinel"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  sentinel:
    build: .
    environment:
      - API_SERVER=${API_SERVER}
      - API_KEY=${API_KEY}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Agent Not Connecting

**Symptoms:**
- Dashboard shows "Offline"
- No heartbeats received

**Solutions:**
```bash
# Check API server connectivity
curl -v https://your-clarity-hub.com/health

# Verify configuration
cat /etc/voltaxe/sentinel.conf

# Check firewall
sudo ufw status
sudo iptables -L

# Test DNS resolution
nslookup your-clarity-hub.com
```

#### 2. Service Won't Start

**Linux:**
```bash
# Check service status
sudo systemctl status voltaxe-sentinel

# View full logs
sudo journalctl -u voltaxe-sentinel --no-pager

# Check binary permissions
ls -la /usr/local/bin/voltaxe-sentinel

# Test manual start
sudo /usr/local/bin/voltaxe-sentinel --test
```

**Windows:**
```powershell
# Check service
Get-Service VoltaxeSentinel | Format-List *

# View event logs
Get-EventLog -LogName Application -Source "Voltaxe Sentinel" -Newest 50

# Check permissions
icacls "C:\Program Files\Voltaxe\Sentinel\voltaxe-sentinel.exe"
```

#### 3. High CPU/Memory Usage

**Check Resource Usage:**
```bash
# Linux
ps aux | grep voltaxe-sentinel
top -p $(pgrep voltaxe-sentinel)

# Windows
Get-Process voltaxe-sentinel | Select-Object CPU,WS
```

**Adjust Configuration:**
```conf
# Reduce scan frequency
SCAN_INTERVAL=300  # 5 minutes instead of 60 seconds

# Limit resource usage
MAX_CPU_USAGE=5%
MAX_MEMORY_USAGE=128MB
```

#### 4. Certificate Errors

**Disable TLS Verification (Testing Only):**
```conf
TLS_VERIFY=false
```

**Add Custom CA Certificate:**
```bash
# Linux
sudo cp your-ca.crt /etc/voltaxe/certs/
sudo update-ca-certificates

# Update config
TLS_CERT_PATH=/etc/voltaxe/certs/your-ca.crt
```

---

## 📈 Performance Metrics

### Resource Requirements

| Deployment Size | CPU | RAM | Network |
|----------------|-----|-----|---------|
| Small (<10 servers) | 1-2% | 64 MB | 10 KB/s |
| Medium (10-100) | 2-5% | 128 MB | 50 KB/s |
| Large (100-1000) | 5-10% | 256 MB | 200 KB/s |
| Enterprise (1000+) | Custom | Custom | Custom |

### Monitoring Intervals

| Metric | Default | Minimum | Maximum |
|--------|---------|---------|---------|
| Heartbeat | 30s | 10s | 300s |
| Process Scan | 60s | 30s | 600s |
| Vulnerability Scan | 3600s | 1800s | 86400s |

---

## 🛡️ Security Best Practices

### 1. Network Security
```bash
# Allow only necessary ports
sudo ufw allow from CLARITY_HUB_IP to any port 9090
sudo ufw enable
```

### 2. API Key Rotation
```bash
# Rotate keys every 90 days
# Generate new key on hub
# Update all agents
# Revoke old key
```

### 3. Log Security
```bash
# Encrypt logs at rest
sudo chmod 600 /var/log/voltaxe/sentinel.log

# Ship logs to SIEM
rsyslog.conf:
*.* @@siem-server:514
```

### 4. Binary Verification
```bash
# Always verify checksums before installation
sha256sum -c checksums.txt

# Verify digital signatures (if available)
gpg --verify voltaxe-sentinel.deb.sig voltaxe-sentinel.deb
```

---

## 📞 Support & Resources

### Documentation
- **Main Docs**: https://docs.voltaxe.com
- **API Reference**: https://docs.voltaxe.com/api
- **GitHub**: https://github.com/voltaxe/sentinel

### Support Channels
- **Email**: support@voltaxe.com
- **Slack**: https://voltaxe-community.slack.com
- **Issues**: https://github.com/voltaxe/sentinel/issues

### Updates
- **Release Notes**: https://github.com/voltaxe/sentinel/releases
- **Changelog**: https://github.com/voltaxe/sentinel/blob/main/CHANGELOG.md
- **Security Advisories**: https://github.com/voltaxe/sentinel/security/advisories

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-05 | Initial production release |
| | | - Multi-platform installers |
| | | - Systemd/LaunchDaemon integration |
| | | - Enhanced monitoring capabilities |

---

**Built with ❤️ by Voltaxe Security Team**

*Last Updated: October 5, 2025*
