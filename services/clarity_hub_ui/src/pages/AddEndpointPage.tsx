import React, { useState } from 'react';
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
  HardDrive,
  Check,
  PlusCircle
} from 'lucide-react';

type OSType = 'linux' | 'macos' | 'windows';
type StepType = 1 | 2 | 3 | 4;

interface DeploymentConfig {
  agentId: string;
  apiKey: string;
  serverUrl: string;
  organizationId: string;
  timestamp: string;
}

interface ProgressStepProps {
  step: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  isLast?: boolean;
}

const ProgressStep: React.FC<ProgressStepProps> = ({ step, title, isActive, isCompleted, isLast = false }) => {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
            isCompleted
              ? 'text-gray-900 shadow-lg'
              : isActive
              ? 'border-2'
              : 'bg-gray-800 text-gray-500 border-2 border-gray-700'
          }`}
          style={{
            backgroundColor: isCompleted 
              ? 'hsl(var(--primary-gold))' 
              : isActive 
              ? 'hsl(var(--primary-gold) / 0.2)' 
              : undefined,
            borderColor: isActive ? 'hsl(var(--primary-gold))' : undefined,
            color: isActive ? 'hsl(var(--primary-gold))' : undefined,
            boxShadow: isCompleted ? '0 0 20px hsl(var(--primary-gold) / 0.5)' : undefined
          }}
        >
          {isCompleted ? <Check size={24} /> : step}
        </div>
        <p
          className={`mt-2 text-sm font-medium transition-colors duration-300 ${
            isCompleted ? 'text-gray-300' : 'text-gray-500'
          }`}
          style={{
            color: isActive ? 'hsl(var(--primary-gold))' : undefined
          }}
        >
          {title}
        </p>
      </div>
      {!isLast && (
        <div
          className="w-24 h-0.5 mx-4 transition-colors duration-300 bg-gray-700"
          style={{
            backgroundColor: isCompleted ? 'hsl(var(--primary-gold))' : undefined
          }}
        />
      )}
    </div>
  );
};

const AddEndpointPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const [selectedOS, setSelectedOS] = useState<OSType | null>(null);
  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const steps = [
    { number: 1, title: 'Select OS', isCompleted: currentStep > 1 },
    { number: 2, title: 'Download', isCompleted: currentStep > 2 },
    { number: 3, title: 'Deploy', isCompleted: currentStep > 3 },
    { number: 4, title: 'Verify', isCompleted: currentStep > 4 }
  ];

  const osOptions = [
    {
      id: 'linux' as OSType,
      name: 'Linux',
      icon: <Server size={48} style={{ color: 'hsl(var(--primary-gold))' }} />,
      compatibility: 'Ubuntu 18.04+, Debian 10+, CentOS 7+, RHEL 7+',
      recommended: true
    },
    {
      id: 'macos' as OSType,
      name: 'macOS',
      icon: <Apple size={48} style={{ color: 'hsl(var(--primary-gold))' }} />,
      compatibility: 'macOS 10.15 (Catalina) and later',
      recommended: false
    },
    {
      id: 'windows' as OSType,
      name: 'Windows',
      icon: <Monitor size={48} style={{ color: 'hsl(var(--primary-gold))' }} />,
      compatibility: 'Windows 10, Windows 11, Windows Server 2016+',
      recommended: false
    }
  ];

  const generateConfig = async () => {
    try {
      // Simulate API call to generate deployment config
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newConfig: DeploymentConfig = {
        agentId: `agent-${Math.random().toString(36).substring(2, 11)}`,
        apiKey: `vltx_${Math.random().toString(36).substring(2, 18)}_${Math.random().toString(36).substring(2, 18)}`,
        serverUrl: window.location.origin,
        organizationId: `org-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: new Date().toISOString()
      };
      
      setConfig(newConfig);
      setCurrentStep(3);
    } catch (error) {
      console.error('Failed to generate config:', error);
    }
  };

  const handleDownload = async () => {
    if (!selectedOS) return;
    
    setIsDownloading(true);
    try {
      // Download agent binary from backend
      const response = await fetch(`/api/download/sentinel/${selectedOS}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voltaxe-sentinel-${selectedOS}${selectedOS === 'windows' ? '.exe' : ''}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Generate config after successful download
      await generateConfig();
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: still generate config for manual installation
      await generateConfig();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generateInstallerScript = (): string => {
    if (!config || !selectedOS) return '';

    if (selectedOS === 'linux') {
      return `#!/bin/bash
# Voltaxe Sentinel Installation Script
# Generated: ${config.timestamp}

set -e

echo "🛡️  Installing Voltaxe Sentinel..."

# Create installation directory
sudo mkdir -p /opt/voltaxe
cd /opt/voltaxe

# Download and install agent (if not already downloaded)
if [ ! -f "./voltaxe-sentinel-linux" ]; then
    echo "⬇️  Downloading agent..."
    curl -sL "${config.serverUrl}/api/download/sentinel/linux" -o voltaxe-sentinel-linux
    chmod +x voltaxe-sentinel-linux
fi

# Create configuration
cat > config.json <<EOF
{
  "agentId": "${config.agentId}",
  "apiKey": "${config.apiKey}",
  "serverUrl": "${config.serverUrl}",
  "organizationId": "${config.organizationId}"
}
EOF

# Create systemd service
sudo tee /etc/systemd/system/voltaxe-sentinel.service > /dev/null <<EOF
[Unit]
Description=Voltaxe Sentinel Security Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/voltaxe
ExecStart=/opt/voltaxe/voltaxe-sentinel-linux
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable voltaxe-sentinel
sudo systemctl start voltaxe-sentinel

echo "✅ Voltaxe Sentinel installed successfully!"
echo "📊 Check status: sudo systemctl status voltaxe-sentinel"
echo "📋 View logs: sudo journalctl -u voltaxe-sentinel -f"`;
    } else if (selectedOS === 'macos') {
      return `#!/bin/bash
# Voltaxe Sentinel Installation Script (macOS)
# Generated: ${config.timestamp}

set -e

echo "🛡️  Installing Voltaxe Sentinel..."

# Create installation directory
sudo mkdir -p /usr/local/voltaxe
cd /usr/local/voltaxe

# Download and install agent (if not already downloaded)
if [ ! -f "./voltaxe-sentinel-macos" ]; then
    echo "⬇️  Downloading agent..."
    curl -sL "${config.serverUrl}/api/download/sentinel/macos" -o voltaxe-sentinel-macos
    chmod +x voltaxe-sentinel-macos
fi

# Create configuration
cat > config.json <<EOF
{
  "agentId": "${config.agentId}",
  "apiKey": "${config.apiKey}",
  "serverUrl": "${config.serverUrl}",
  "organizationId": "${config.organizationId}"
}
EOF

# Create LaunchDaemon
sudo tee /Library/LaunchDaemons/com.voltaxe.sentinel.plist > /dev/null <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.voltaxe.sentinel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/voltaxe/voltaxe-sentinel-macos</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/usr/local/voltaxe</string>
</dict>
</plist>
EOF

# Load and start service
sudo launchctl load /Library/LaunchDaemons/com.voltaxe.sentinel.plist

echo "✅ Voltaxe Sentinel installed successfully!"
echo "📊 Check status: sudo launchctl list | grep voltaxe"`;
    } else {
      return `# Voltaxe Sentinel Installation Script (Windows)
# Generated: ${config.timestamp}
# Run this in PowerShell as Administrator

Write-Host "🛡️  Installing Voltaxe Sentinel..." -ForegroundColor Cyan

# Create installation directory
$installDir = "C:\\Program Files\\Voltaxe"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Set-Location $installDir

# Download and install agent (if not already downloaded)
if (!(Test-Path ".\\voltaxe-sentinel-windows.exe")) {
    Write-Host "⬇️  Downloading agent..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "${config.serverUrl}/api/download/sentinel/windows" -OutFile "voltaxe-sentinel-windows.exe"
}

# Create configuration
@"
{
  "agentId": "${config.agentId}",
  "apiKey": "${config.apiKey}",
  "serverUrl": "${config.serverUrl}",
  "organizationId": "${config.organizationId}"
}
"@ | Out-File -FilePath "config.json" -Encoding UTF8

# Install as Windows Service
New-Service -Name "VoltaxeSentinel" -BinaryPathName "$installDir\\voltaxe-sentinel-windows.exe" -DisplayName "Voltaxe Sentinel" -StartupType Automatic -Description "Voltaxe Security Monitoring Agent"
Start-Service -Name "VoltaxeSentinel"

Write-Host "✅ Voltaxe Sentinel installed successfully!" -ForegroundColor Green
Write-Host "📊 Check status: Get-Service VoltaxeSentinel" -ForegroundColor Cyan`;
    }
  };

  const verifyConnection = async () => {
    if (!config) return;
    
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      // Poll backend to check if agent has connected
      const maxAttempts = 30; // 30 seconds
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`/api/agents/check-connection/${config.agentId}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.connected) {
              setIsConnected(true);
              setCurrentStep(4);
              setIsVerifying(false);
              return;
            }
          }
        } catch (error) {
          // Continue polling
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      setVerificationError('Connection timeout. Please ensure the agent is running and try again.');
    } catch (error) {
      setVerificationError('Verification failed. Please check your installation and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectOS = (os: OSType) => {
    setSelectedOS(os);
    setCurrentStep(2);
  };

  const installerScript = generateInstallerScript();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="border-b pb-6 mb-6" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>
              <PlusCircle className="h-10 w-10" style={{ color: 'hsl(var(--primary-gold))' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                Installation Wizard
              </h1>
              <p className="text-lg mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Deploy Voltaxe Sentinel in minutes
              </p>
            </div>
          </div>

          {/* Progress Stepper */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center">
                {steps.map((step, index) => (
                  <ProgressStep
                    key={step.number}
                    step={step.number}
                    title={step.title}
                    isActive={currentStep === step.number}
                    isCompleted={step.isCompleted}
                    isLast={index === steps.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>

        {/* Step Content */}
        <div>
            {/* Step 1: OS Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-bold text-white mb-2">Choose Your Operating System</h2>
                  <p className="text-gray-400">Select the platform where you want to deploy the agent</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {osOptions.map((os) => (
                    <button
                      key={os.id}
                      onClick={() => handleSelectOS(os.id)}
                      className="group relative p-8 rounded-2xl transition-all duration-300 text-left cursor-pointer shadow-lg border-2"
                      style={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'hsl(var(--primary-gold) / 0.5)';
                        e.currentTarget.style.boxShadow = '0 0 30px hsl(var(--primary-gold) / 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'hsl(var(--border))';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
                      }}
                    >
                      {os.recommended && (
                        <div className="absolute top-4 right-4 px-3 py-1 text-gray-900 text-xs font-semibold rounded-full shadow-lg" style={{ backgroundColor: 'hsl(var(--primary-gold))' }}>
                          Recommended
                        </div>
                      )}

                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 rounded-2xl transition-all duration-300" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)' }}>
                          {os.icon}
                        </div>

                        <h3 className="text-2xl font-bold transition-colors" style={{ color: 'hsl(var(--foreground))' }}>
                          {os.name}
                        </h3>

                        <p className="text-sm min-h-[40px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{os.compatibility}</p>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--primary-gold))' }}>
                          <span className="text-sm font-medium">Select</span>
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Download */}
            {currentStep === 2 && selectedOS && (
              <div className="space-y-6">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Download Voltaxe Sentinel</h2>
                  <p style={{ color: 'hsl(var(--muted-foreground))' }}>One-click download for {osOptions.find(o => o.id === selectedOS)?.name}</p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className="rounded-2xl p-8 shadow-xl border-2" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.2)' }}>
                          <HardDrive size={32} style={{ color: 'hsl(var(--primary-gold))' }} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>voltaxe-sentinel-{selectedOS}</h3>
                          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Security monitoring agent</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Size</p>
                        <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>~25 MB</p>
                      </div>
                    </div>

                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="w-full py-4 text-gray-900 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'hsl(var(--primary-gold))',
                        boxShadow: '0 0 30px hsl(var(--primary-gold) / 0.3)'
                      }}
                    >
                      {isDownloading ? (
                        <>
                          <Loader size={20} className="animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <Download size={20} />
                          <span>Download Agent</span>
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      By downloading, you agree to the Voltaxe Security Agent license terms
                    </p>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedOS(null);
                      }}
                      className="px-6 py-3 rounded-xl transition-colors border-2"
                      style={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Deploy */}
            {currentStep === 3 && config && (
              <div className="space-y-6">
                <div className="text-center mb-12">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Deploy Your Agent</h2>
                  <p style={{ color: 'hsl(var(--muted-foreground))' }}>Run this magic command on your server</p>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Installation Command */}
                  <div className="rounded-2xl p-6 shadow-xl border-2" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <Terminal size={24} style={{ color: 'hsl(var(--primary-gold))' }} />
                      <h3 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Installation Command</h3>
                    </div>

                    <div className="relative">
                      <pre className="p-4 rounded-xl overflow-x-auto text-sm font-mono border" style={{ backgroundColor: 'hsl(var(--input))', color: '#22c55e', borderColor: 'hsl(var(--border))' }}>
                        {selectedOS === 'windows' 
                          ? `# Run in PowerShell as Administrator\nirm ${config.serverUrl}/api/install/sentinel/windows | iex`
                          : `curl -sSL ${config.serverUrl}/api/install/sentinel/${selectedOS} | sudo bash`
                        }
                      </pre>
                      <button
                        onClick={() => handleCopy(
                          selectedOS === 'windows' 
                            ? `irm ${config.serverUrl}/api/install/sentinel/windows | iex`
                            : `curl -sSL ${config.serverUrl}/api/install/sentinel/${selectedOS} | sudo bash`,
                          'install-cmd'
                        )}
                        className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'hsl(var(--input))', color: 'hsl(var(--primary-gold))' }}
                      >
                        {copiedField === 'install-cmd' ? <CheckCircle size={18} /> : <Copy size={18} />}
                      </button>
                    </div>

                    <div className="mt-4 flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: 'hsl(var(--primary-gold) / 0.1)', borderWidth: '1px', borderColor: 'hsl(var(--primary-gold) / 0.3)' }}>
                      <Shield size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--primary-gold))' }} />
                      <div className="text-sm">
                        <p className="font-medium mb-1" style={{ color: 'hsl(var(--primary-gold))' }}>Auto-Configuration Included</p>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                          This command includes your unique API key and will automatically link the agent to your account.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Full Installation Script */}
                  <div className="rounded-2xl p-6 shadow-xl border-2" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Server size={24} style={{ color: 'hsl(var(--primary-gold))' }} />
                        <h3 className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>Full Installation Script</h3>
                      </div>
                      <button
                        onClick={() => handleCopy(installerScript, 'full-script')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        style={{ backgroundColor: 'hsl(var(--input))', color: 'hsl(var(--primary-gold))' }}
                      >
                        {copiedField === 'full-script' ? <CheckCircle size={16} /> : <Copy size={16} />}
                        <span>{copiedField === 'full-script' ? 'Copied!' : 'Copy Script'}</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl overflow-x-auto text-xs font-mono max-h-96 border" style={{ backgroundColor: 'hsl(var(--input))', color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }}>
                      {installerScript}
                    </pre>
                  </div>

                  {/* Verify Connection Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={verifyConnection}
                      disabled={isVerifying}
                      className="px-8 py-4 text-gray-900 font-semibold rounded-xl transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'hsl(var(--primary-gold))',
                        boxShadow: '0 0 30px hsl(var(--primary-gold) / 0.3)'
                      }}
                    >
                      {isVerifying ? (
                        <>
                          <Loader size={20} className="animate-spin" />
                          <span>Checking Connection...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          <span>Verify Connection</span>
                        </>
                      )}
                    </button>
                  </div>

                  {verificationError && (
                    <div className="flex items-start gap-3 p-4 bg-red-400/10 border border-red-400/30 rounded-xl">
                      <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-red-400 font-medium mb-1">Connection Failed</p>
                        <p className="text-gray-300">{verificationError}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        setCurrentStep(2);
                        setConfig(null);
                      }}
                      className="px-6 py-3 rounded-xl transition-colors border-2"
                      style={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {currentStep === 4 && isConnected && (
              <div className="space-y-6">
                <div className="max-w-2xl mx-auto text-center">
                  <div className="inline-flex p-6 bg-gradient-to-r from-green-400/20 to-green-500/20 rounded-full mb-6">
                    <CheckCircle size={64} className="text-green-400" />
                  </div>

                  <h2 className="text-3xl font-bold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Agent Connected Successfully!</h2>
                  <p className="text-xl mb-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Your Voltaxe Sentinel agent is now protecting your infrastructure
                  </p>

                  <div className="rounded-2xl p-8 mb-8 border-2" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
                    <div className="grid grid-cols-2 gap-6 text-left">
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Agent ID</p>
                        <p className="font-mono text-sm" style={{ color: 'hsl(var(--foreground))' }}>{config?.agentId}</p>
                      </div>
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Platform</p>
                        <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{osOptions.find(o => o.id === selectedOS)?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Status</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-green-400 font-medium">Online</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Connected</p>
                        <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>Just now</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => window.location.href = '/fleet'}
                      className="px-8 py-4 text-gray-900 font-semibold rounded-xl transition-all duration-300 flex items-center gap-3"
                      style={{
                        backgroundColor: 'hsl(var(--primary-gold))',
                        boxShadow: '0 0 30px hsl(var(--primary-gold) / 0.3)'
                      }}
                    >
                      <span>View Fleet Dashboard</span>
                      <ChevronRight size={20} />
                    </button>

                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedOS(null);
                        setConfig(null);
                        setIsConnected(false);
                      }}
                      className="px-8 py-4 rounded-xl transition-colors border-2"
                      style={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                    >
                      Add Another Agent
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
  
  export default AddEndpointPage;
  export { AddEndpointPage };
