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
