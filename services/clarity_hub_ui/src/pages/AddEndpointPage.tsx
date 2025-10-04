import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { 
  Download, 
  Shield, 
  Server, 
  CheckCircle, 
  Copy, 
  Terminal,
  AlertCircle,
  Loader,
  ChevronRight,
  Apple,
  Monitor,
  HardDrive
} from 'lucide-react';

interface DeploymentConfig {
  agentId: string;
  apiKey: string;
  serverUrl: string;
  organizationId: string;
  timestamp: string;
}

type OS = 'linux' | 'macos' | 'windows';
type Step = 1 | 2 | 3 | 4;

export const AddEndpointPage = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedOS, setSelectedOS] = useState<OS>('linux');
  const [endpointName, setEndpointName] = useState('');
  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const serverUrl = window.location.origin.replace(/:\d+/, ':8000');

  // Generate unique deployment configuration
  const generateConfig = async () => {
    setIsGenerating(true);
    
    // Simulate API call to generate config
    setTimeout(() => {
      const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const apiKey = `vltx_${Math.random().toString(36).substr(2, 32)}`;
      
      const newConfig: DeploymentConfig = {
        agentId,
        apiKey,
        serverUrl,
        organizationId: 'voltaxe-org-' + Date.now(),
        timestamp: new Date().toISOString()
      };
      
      setConfig(newConfig);
      setIsGenerating(false);
      setCurrentStep(3);
    }, 1500);
  };

  const handleGenerateAgent = () => {
    if (endpointName.trim()) {
      generateConfig();
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadInstaller = () => {
    // Generate installer script with embedded config
    const installerScript = generateInstallerScript();
    const blob = new Blob([installerScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voltaxe-sentinel-installer-${selectedOS}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setCurrentStep(4);
  };

  const generateInstallerScript = () => {
    if (!config) return '';

    const commonConfig = `
# Voltaxe Sentinel Agent Configuration
AGENT_ID="${config.agentId}"
API_KEY="${config.apiKey}"
SERVER_URL="${config.serverUrl}"
ORG_ID="${config.organizationId}"
ENDPOINT_NAME="${endpointName}"
`;

    if (selectedOS === 'linux') {
      return `#!/bin/bash
# Voltaxe Sentinel Agent Installer for Linux
# Generated: ${new Date().toLocaleString()}

set -e

${commonConfig}

echo "🛡️  Voltaxe Sentinel Agent Installer"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

echo "📦 Installing dependencies..."
apt-get update -qq
apt-get install -y python3 python3-pip curl jq

echo "📥 Downloading Voltaxe Sentinel Agent..."
mkdir -p /opt/voltaxe
cd /opt/voltaxe

# Download agent (replace with actual download URL)
curl -sSL ${config.serverUrl}/download/sentinel-agent.tar.gz -o sentinel-agent.tar.gz
tar -xzf sentinel-agent.tar.gz
rm sentinel-agent.tar.gz

echo "⚙️  Configuring agent..."
cat > /opt/voltaxe/config.json <<EOF
{
  "agent_id": "$AGENT_ID",
  "api_key": "$API_KEY",
  "server_url": "$SERVER_URL",
  "organization_id": "$ORG_ID",
  "endpoint_name": "$ENDPOINT_NAME",
  "collection_interval": 300,
  "features": {
    "process_monitoring": true,
    "software_inventory": true,
    "vulnerability_scanning": true,
    "malware_scanning": true,
    "behavioral_analysis": true
  }
}
EOF

echo "🔧 Installing Python dependencies..."
pip3 install -r requirements.txt

echo "🔐 Setting permissions..."
chmod 600 /opt/voltaxe/config.json
chmod +x /opt/voltaxe/sentinel.py

echo "📋 Creating systemd service..."
cat > /etc/systemd/system/voltaxe-sentinel.service <<EOF
[Unit]
Description=Voltaxe Sentinel Security Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/voltaxe
ExecStart=/usr/bin/python3 /opt/voltaxe/sentinel.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "🚀 Starting Voltaxe Sentinel service..."
systemctl daemon-reload
systemctl enable voltaxe-sentinel
systemctl start voltaxe-sentinel

echo ""
echo "✅ Installation complete!"
echo ""
echo "📊 Agent Status:"
systemctl status voltaxe-sentinel --no-pager

echo ""
echo "📝 Useful commands:"
echo "  Check status:  sudo systemctl status voltaxe-sentinel"
echo "  View logs:     sudo journalctl -u voltaxe-sentinel -f"
echo "  Restart:       sudo systemctl restart voltaxe-sentinel"
echo "  Stop:          sudo systemctl stop voltaxe-sentinel"
echo ""
echo "🎉 Your endpoint will appear in the Voltaxe dashboard within 5 minutes!"
`;
    } else if (selectedOS === 'macos') {
      return `#!/bin/bash
# Voltaxe Sentinel Agent Installer for macOS
# Generated: ${new Date().toLocaleString()}

set -e

${commonConfig}

echo "🛡️  Voltaxe Sentinel Agent Installer (macOS)"
echo "=============================================="
echo ""

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "📦 Installing dependencies..."
brew install python3 curl jq

echo "📥 Downloading Voltaxe Sentinel Agent..."
sudo mkdir -p /opt/voltaxe
cd /opt/voltaxe

# Download agent
curl -sSL ${config.serverUrl}/download/sentinel-agent.tar.gz -o sentinel-agent.tar.gz
tar -xzf sentinel-agent.tar.gz
rm sentinel-agent.tar.gz

echo "⚙️  Configuring agent..."
sudo cat > /opt/voltaxe/config.json <<EOF
{
  "agent_id": "$AGENT_ID",
  "api_key": "$API_KEY",
  "server_url": "$SERVER_URL",
  "organization_id": "$ORG_ID",
  "endpoint_name": "$ENDPOINT_NAME",
  "collection_interval": 300,
  "features": {
    "process_monitoring": true,
    "software_inventory": true,
    "vulnerability_scanning": true,
    "malware_scanning": true,
    "behavioral_analysis": true
  }
}
EOF

echo "🔧 Installing Python dependencies..."
pip3 install -r requirements.txt

echo "🔐 Setting permissions..."
sudo chmod 600 /opt/voltaxe/config.json
sudo chmod +x /opt/voltaxe/sentinel.py

echo "📋 Creating LaunchDaemon..."
sudo cat > /Library/LaunchDaemons/com.voltaxe.sentinel.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.voltaxe.sentinel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/opt/voltaxe/sentinel.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/voltaxe-sentinel.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/voltaxe-sentinel-error.log</string>
</dict>
</plist>
EOF

echo "🚀 Starting Voltaxe Sentinel service..."
sudo launchctl load /Library/LaunchDaemons/com.voltaxe.sentinel.plist

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Useful commands:"
echo "  View logs:     sudo tail -f /var/log/voltaxe-sentinel.log"
echo "  Restart:       sudo launchctl unload /Library/LaunchDaemons/com.voltaxe.sentinel.plist && sudo launchctl load /Library/LaunchDaemons/com.voltaxe.sentinel.plist"
echo "  Stop:          sudo launchctl unload /Library/LaunchDaemons/com.voltaxe.sentinel.plist"
echo ""
echo "🎉 Your endpoint will appear in the Voltaxe dashboard within 5 minutes!"
`;
    } else {
      return `# Voltaxe Sentinel Agent Installer for Windows
# Generated: ${new Date().toLocaleString()}
# Run this script in PowerShell as Administrator

${commonConfig}

Write-Host "🛡️  Voltaxe Sentinel Agent Installer (Windows)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check for admin privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Please run as Administrator" -ForegroundColor Red
    Exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
# Install Python if not present
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Python..."
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe" -OutFile "$env:TEMP\\python-installer.exe"
    Start-Process -Wait -FilePath "$env:TEMP\\python-installer.exe" -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1"
}

Write-Host "📥 Downloading Voltaxe Sentinel Agent..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "C:\\Program Files\\Voltaxe"
Set-Location "C:\\Program Files\\Voltaxe"

# Download agent
Invoke-WebRequest -Uri "${config.serverUrl}/download/sentinel-agent.zip" -OutFile "sentinel-agent.zip"
Expand-Archive -Path "sentinel-agent.zip" -DestinationPath "." -Force
Remove-Item "sentinel-agent.zip"

Write-Host "⚙️  Configuring agent..." -ForegroundColor Yellow
@"
{
  "agent_id": "$AGENT_ID",
  "api_key": "$API_KEY",
  "server_url": "$SERVER_URL",
  "organization_id": "$ORG_ID",
  "endpoint_name": "$ENDPOINT_NAME",
  "collection_interval": 300,
  "features": {
    "process_monitoring": true,
    "software_inventory": true,
    "vulnerability_scanning": true,
    "malware_scanning": true,
    "behavioral_analysis": true
  }
}
"@ | Out-File -FilePath "C:\\Program Files\\Voltaxe\\config.json" -Encoding UTF8

Write-Host "🔧 Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install -r requirements.txt

Write-Host "📋 Creating Windows Service..." -ForegroundColor Yellow
# Create service using NSSM or sc.exe
python "C:\\Program Files\\Voltaxe\\sentinel.py" install

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Cyan
Write-Host "  Check status:  Get-Service VoltaxeSentinel"
Write-Host "  View logs:     Get-Content 'C:\\Program Files\\Voltaxe\\logs\\sentinel.log' -Tail 50 -Wait"
Write-Host "  Restart:       Restart-Service VoltaxeSentinel"
Write-Host "  Stop:          Stop-Service VoltaxeSentinel"
Write-Host ""
Write-Host "🎉 Your endpoint will appear in the Voltaxe dashboard within 5 minutes!" -ForegroundColor Green
`;
    }
  };

  const getOSIcon = (os: OS) => {
    switch (os) {
      case 'linux': return <HardDrive size={24} />;
      case 'macos': return <Apple size={24} />;
      case 'windows': return <Monitor size={24} />;
    }
  };

  const getInstallCommand = () => {
    if (!config) return '';
    
    switch (selectedOS) {
      case 'linux':
      case 'macos':
        return `sudo bash voltaxe-sentinel-installer-${selectedOS}.sh`;
      case 'windows':
        return `powershell -ExecutionPolicy Bypass -File voltaxe-sentinel-installer-windows.ps1`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 gradient-gold rounded-lg flex items-center justify-center">
              <Shield size={24} style={{ color: 'hsl(var(--background))' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-gold">Add Endpoint</h1>
              <p className="text-muted-foreground">Deploy Voltaxe Sentinel Agent to protect your endpoints</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-4xl">
            {[
              { num: 1, label: 'Select OS', icon: Server },
              { num: 2, label: 'Configure', icon: Shield },
              { num: 3, label: 'Download', icon: Download },
              { num: 4, label: 'Deploy', icon: Terminal }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep >= step.num
                      ? 'bg-primary-gold/20 border-primary-gold text-primary-gold'
                      : 'bg-card border-border text-muted-foreground'
                  }`}>
                    <step.icon size={20} />
                  </div>
                  <span className={`text-sm mt-2 font-medium ${
                    currentStep >= step.num ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.num ? 'bg-primary-gold' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl">
          {/* Step 1: Select OS */}
          {currentStep === 1 && (
            <div className="card-glass p-8">
              <h2 className="text-2xl font-bold mb-2">Select Operating System</h2>
              <p className="text-muted-foreground mb-6">Choose the operating system of your endpoint</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { os: 'linux' as OS, name: 'Linux', desc: 'Ubuntu, Debian, CentOS, RHEL' },
                  { os: 'macos' as OS, name: 'macOS', desc: 'macOS 10.15+' },
                  { os: 'windows' as OS, name: 'Windows', desc: 'Windows 10, 11, Server' }
                ].map((item) => (
                  <button
                    key={item.os}
                    onClick={() => setSelectedOS(item.os)}
                    className={`p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                      selectedOS === item.os
                        ? 'border-primary-gold bg-primary-gold/10'
                        : 'border-border bg-card hover:border-primary-gold/50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`mb-3 ${selectedOS === item.os ? 'text-primary-gold' : 'text-foreground'}`}>
                        {getOSIcon(item.os)}
                      </div>
                      <h3 className="font-bold mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Step 2: Configure */}
          {currentStep === 2 && (
            <div className="card-glass p-8">
              <h2 className="text-2xl font-bold mb-2">Configure Endpoint</h2>
              <p className="text-muted-foreground mb-6">Provide basic information about your endpoint</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Endpoint Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={endpointName}
                    onChange={(e) => setEndpointName(e.target.value)}
                    placeholder="e.g., web-server-01, dev-workstation, prod-db"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary-gold focus:border-transparent"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    A friendly name to identify this endpoint in the dashboard
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-400 mb-1">Agent Features</h4>
                      <p className="text-sm text-muted-foreground">
                        The Sentinel agent will automatically collect:
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• System inventory (processes, software, hardware)</li>
                        <li>• Vulnerability scanning (CVE matching)</li>
                        <li>• Behavioral analysis (anomaly detection)</li>
                        <li>• Malware scanning (YARA rules)</li>
                        <li>• Real-time event monitoring</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="btn-ghost flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleGenerateAgent}
                    disabled={!endpointName.trim() || isGenerating}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Installer
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Download */}
          {currentStep === 3 && config && (
            <div className="card-glass p-8">
              <h2 className="text-2xl font-bold mb-2">Download Agent Installer</h2>
              <p className="text-muted-foreground mb-6">Your custom installer is ready with pre-configured credentials</p>

              <div className="space-y-6">
                {/* Configuration Details */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                  <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Configuration</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Agent ID</div>
                        <div className="font-mono text-sm">{config.agentId}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(config.agentId, 'agentId')}
                        className="btn-ghost p-2"
                        title="Copy Agent ID"
                      >
                        {copiedField === 'agentId' ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">API Key</div>
                        <div className="font-mono text-sm">
                          {config.apiKey.substring(0, 20)}...
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(config.apiKey, 'apiKey')}
                        className="btn-ghost p-2"
                        title="Copy API Key"
                      >
                        {copiedField === 'apiKey' ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Server URL</div>
                        <div className="font-mono text-sm">{config.serverUrl}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(config.serverUrl, 'serverUrl')}
                        className="btn-ghost p-2"
                        title="Copy Server URL"
                      >
                        {copiedField === 'serverUrl' ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Warning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-400 mb-1">Security Notice</h4>
                      <p className="text-sm text-muted-foreground">
                        Keep your API key secure! The installer script contains sensitive credentials.
                        Do not share it publicly or commit it to version control.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="btn-ghost flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={downloadInstaller}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Download Installer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Deploy */}
          {currentStep === 4 && config && (
            <div className="card-glass p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready to Deploy!</h2>
                <p className="text-muted-foreground">Follow the instructions below to install the agent on your endpoint</p>
              </div>

              <div className="space-y-6">
                {/* Installation Instructions */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Terminal size={20} className="text-primary-gold" />
                    Installation Steps
                  </h3>
                  
                  <ol className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-gold/20 text-primary-gold flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-1">Transfer the installer to your endpoint</div>
                        <div className="text-sm text-muted-foreground">
                          Copy <code className="bg-background px-2 py-1 rounded">voltaxe-sentinel-installer-{selectedOS}.{selectedOS === 'windows' ? 'ps1' : 'sh'}</code> to your target machine
                        </div>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-gold/20 text-primary-gold flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-2">Run the installer with elevated privileges</div>
                        <div className="bg-background rounded-lg p-4 font-mono text-sm flex items-center justify-between">
                          <code>{getInstallCommand()}</code>
                          <button
                            onClick={() => copyToClipboard(getInstallCommand(), 'command')}
                            className="btn-ghost p-2 ml-2"
                          >
                            {copiedField === 'command' ? (
                              <CheckCircle size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </li>

                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-gold/20 text-primary-gold flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-1">Wait for agent registration</div>
                        <div className="text-sm text-muted-foreground">
                          The endpoint will appear in your dashboard within 5 minutes after successful installation
                        </div>
                      </div>
                    </li>
                  </ol>
                </div>

                {/* What Happens Next */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-blue-400 mb-3">What Happens Next?</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Agent automatically registers with Clarity Hub</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Initial system snapshot collected and analyzed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Vulnerability scanning begins (CVE database matching)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Real-time monitoring starts for processes and events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Resilience score calculated based on security posture</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setConfig(null);
                      setEndpointName('');
                    }}
                    className="btn-ghost flex-1"
                  >
                    Add Another Endpoint
                  </button>
                  <button
                    onClick={() => window.location.href = '/snapshots'}
                    className="btn-primary flex-1"
                  >
                    View Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
