#!/bin/bash

################################################################################
# Voltaxe Sentinel - Production Build & Packaging Script
################################################################################
# This script compiles Voltaxe Sentinel into distributable installers for:
#   - Linux: .deb package (Debian/Ubuntu)
#   - Windows: .exe installer with NSIS
#   - macOS: .pkg installer
#
# Usage: ./build_agents.sh [options]
# Options:
#   --linux     Build Linux packages only
#   --windows   Build Windows installer only
#   --macos     Build macOS package only
#   --all       Build all platforms (default)
#   --clean     Clean build artifacts before building
#   --version   Specify version (default: auto-generated)
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="voltaxe-sentinel"
APP_DISPLAY_NAME="Voltaxe Sentinel"
COMPANY="Voltaxe Security"
VERSION="${VERSION:-1.0.0}"
BUILD_DATE=$(date +"%Y%m%d")
BUILD_NUMBER="${BUILD_NUMBER:-${BUILD_DATE}}"
FULL_VERSION="${VERSION}-${BUILD_NUMBER}"

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SENTINEL_DIR="${SCRIPT_DIR}/services/voltaxe_sentinel"
BUILD_DIR="${SCRIPT_DIR}/build"
DIST_DIR="${SCRIPT_DIR}/dist"
PACKAGE_DIR="${BUILD_DIR}/packages"

# Build targets
BUILD_LINUX=false
BUILD_WINDOWS=false
BUILD_MACOS=false

# Parse command line arguments
parse_args() {
    if [ $# -eq 0 ]; then
        BUILD_LINUX=true
        BUILD_WINDOWS=true
        BUILD_MACOS=true
    fi
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --linux)
                BUILD_LINUX=true
                shift
                ;;
            --windows)
                BUILD_WINDOWS=true
                shift
                ;;
            --macos)
                BUILD_MACOS=true
                shift
                ;;
            --all)
                BUILD_LINUX=true
                BUILD_WINDOWS=true
                BUILD_MACOS=true
                shift
                ;;
            --clean)
                echo -e "${YELLOW}🧹 Cleaning build artifacts...${NC}"
                rm -rf "$BUILD_DIR" "$DIST_DIR"
                shift
                ;;
            --version)
                VERSION="$2"
                FULL_VERSION="${VERSION}-${BUILD_NUMBER}"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
${CYAN}╔════════════════════════════════════════════════════════════════╗
║         Voltaxe Sentinel - Production Build Script            ║
╚════════════════════════════════════════════════════════════════╝${NC}

${GREEN}Usage:${NC}
  ./build_agents.sh [options]

${GREEN}Options:${NC}
  --linux       Build Linux .deb package only
  --windows     Build Windows .exe installer only
  --macos       Build macOS .pkg installer only
  --all         Build all platforms (default)
  --clean       Clean build artifacts before building
  --version     Specify version (default: ${VERSION})
  --help        Show this help message

${GREEN}Examples:${NC}
  ./build_agents.sh                    # Build all platforms
  ./build_agents.sh --linux            # Build Linux package only
  ./build_agents.sh --clean --all      # Clean then build all
  ./build_agents.sh --version 2.0.0    # Build with custom version

${GREEN}Output:${NC}
  Linux:   ${DIST_DIR}/${APP_NAME}_${FULL_VERSION}_amd64.deb
  Windows: ${DIST_DIR}/${APP_NAME}_${FULL_VERSION}_setup.exe
  macOS:   ${DIST_DIR}/${APP_NAME}_${FULL_VERSION}.pkg

EOF
}

# Print banner
print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ██╗   ██╗ ██████╗ ██╗  ████████╗ █████╗ ██╗  ██╗███████╗   ║
║   ██║   ██║██╔═══██╗██║  ╚══██╔══╝██╔══██╗╚██╗██╔╝██╔════╝   ║
║   ██║   ██║██║   ██║██║     ██║   ███████║ ╚███╔╝ █████╗     ║
║   ██║   ██║██║   ██║██║     ██║   ██╔══██║ ██╔██╗ ██╔══╝     ║
║   ╚██████╔╝╚██████╔╝███████╗██║   ██║  ██║██╔╝ ██╗███████╗   ║
║    ╚═════╝  ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ║
║                                                                ║
║              SENTINEL PRODUCTION BUILD SYSTEM                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo -e "${GREEN}Version:${NC} ${FULL_VERSION}"
    echo -e "${GREEN}Build Date:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
}

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}🔍 Checking build dependencies...${NC}"
    
    local missing_deps=()
    
    # Check Go
    if ! command -v go &> /dev/null; then
        missing_deps+=("go")
    else
        echo -e "  ${GREEN}✓${NC} Go $(go version | awk '{print $3}')"
    fi
    
    # Check for Linux build tools
    if [ "$BUILD_LINUX" = true ]; then
        if ! command -v dpkg-deb &> /dev/null; then
            echo -e "  ${YELLOW}⚠${NC}  dpkg-deb not found (needed for .deb packages)"
            echo -e "     Install with: sudo apt-get install dpkg-dev"
        else
            echo -e "  ${GREEN}✓${NC} dpkg-deb available"
        fi
        
        if ! command -v fakeroot &> /dev/null; then
            echo -e "  ${YELLOW}⚠${NC}  fakeroot not found (recommended for .deb building)"
            echo -e "     Install with: sudo apt-get install fakeroot"
        else
            echo -e "  ${GREEN}✓${NC} fakeroot available"
        fi
    fi
    
    # Check for Windows build tools
    if [ "$BUILD_WINDOWS" = true ]; then
        if command -v makensis &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} NSIS available"
        else
            echo -e "  ${YELLOW}⚠${NC}  NSIS not found (needed for Windows installer)"
            echo -e "     Install with: sudo apt-get install nsis"
        fi
    fi
    
    # Check for macOS build tools
    if [ "$BUILD_MACOS" = true ]; then
        if command -v pkgbuild &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} pkgbuild available (macOS only)"
        else
            echo -e "  ${YELLOW}⚠${NC}  pkgbuild not found (only available on macOS)"
            echo -e "     Note: macOS .pkg can only be built on macOS"
        fi
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required dependencies: ${missing_deps[*]}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All core dependencies satisfied${NC}"
    echo ""
}

# Setup build directories
setup_directories() {
    echo -e "${BLUE}📁 Setting up build directories...${NC}"
    
    mkdir -p "$BUILD_DIR"/{linux,windows,darwin}/{amd64,arm64}
    mkdir -p "$DIST_DIR"
    mkdir -p "$PACKAGE_DIR"/{linux,windows,darwin}
    
    echo -e "${GREEN}✅ Build directories created${NC}"
    echo ""
}

# Compile binaries
compile_binaries() {
    echo -e "${BLUE}🔨 Compiling Voltaxe Sentinel binaries...${NC}"
    
    cd "$SENTINEL_DIR"
    
    local platforms=()
    [ "$BUILD_LINUX" = true ] && platforms+=("linux/amd64" "linux/arm64")
    [ "$BUILD_WINDOWS" = true ] && platforms+=("windows/amd64")
    [ "$BUILD_MACOS" = true ] && platforms+=("darwin/amd64" "darwin/arm64")
    
    for platform in "${platforms[@]}"; do
        local os="${platform%/*}"
        local arch="${platform#*/}"
        local output="${BUILD_DIR}/${os}/${arch}/${APP_NAME}"
        
        [ "$os" = "windows" ] && output="${output}.exe"
        
        echo -e "  ${CYAN}→${NC} Building ${os}/${arch}..."
        
        CGO_ENABLED=0 GOOS="$os" GOARCH="$arch" go build \
            -ldflags="-s -w -X main.Version=${FULL_VERSION} -X main.BuildDate=${BUILD_DATE}" \
            -o "$output" \
            main.go
        
        echo -e "  ${GREEN}✓${NC} ${os}/${arch} compiled ($(du -h "$output" | cut -f1))"
    done
    
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✅ All binaries compiled successfully${NC}"
    echo ""
}

# Build Linux .deb package
build_linux_deb() {
    echo -e "${PURPLE}📦 Building Linux .deb package...${NC}"
    
    local arch="amd64"
    local pkg_name="${APP_NAME}_${FULL_VERSION}_${arch}"
    local pkg_dir="${PACKAGE_DIR}/linux/${pkg_name}"
    
    # Create package structure
    mkdir -p "${pkg_dir}"/{DEBIAN,usr/local/bin,etc/voltaxe,var/log/voltaxe,lib/systemd/system}
    
    # Copy binary
    cp "${BUILD_DIR}/linux/${arch}/${APP_NAME}" "${pkg_dir}/usr/local/bin/"
    chmod 755 "${pkg_dir}/usr/local/bin/${APP_NAME}"
    
    # Create DEBIAN/control file
    cat > "${pkg_dir}/DEBIAN/control" << EOF
Package: ${APP_NAME}
Version: ${FULL_VERSION}
Section: security
Priority: optional
Architecture: ${arch}
Maintainer: ${COMPANY} <security@voltaxe.com>
Description: Voltaxe Sentinel Agent
 Advanced endpoint security monitoring agent that provides:
  - Real-time process monitoring
  - Vulnerability scanning
  - Behavioral anomaly detection
  - Integration with Voltaxe Clarity Hub
Homepage: https://voltaxe.com
EOF
    
    # Create DEBIAN/postinst (post-installation script)
    cat > "${pkg_dir}/DEBIAN/postinst" << 'EOF'
#!/bin/bash
set -e

# Create voltaxe user if it doesn't exist
if ! id -u voltaxe > /dev/null 2>&1; then
    useradd -r -s /bin/false voltaxe
fi

# Set permissions
chown -R voltaxe:voltaxe /var/log/voltaxe
chmod 755 /usr/local/bin/voltaxe-sentinel

# Enable and start service
if command -v systemctl &> /dev/null; then
    systemctl daemon-reload
    systemctl enable voltaxe-sentinel
    echo "✅ Voltaxe Sentinel installed successfully!"
    echo "📋 To start the service: sudo systemctl start voltaxe-sentinel"
    echo "📊 To check status: sudo systemctl status voltaxe-sentinel"
    echo "📝 Configuration: /etc/voltaxe/sentinel.conf"
fi

exit 0
EOF
    chmod 755 "${pkg_dir}/DEBIAN/postinst"
    
    # Create DEBIAN/prerm (pre-removal script)
    cat > "${pkg_dir}/DEBIAN/prerm" << 'EOF'
#!/bin/bash
set -e

if command -v systemctl &> /dev/null; then
    systemctl stop voltaxe-sentinel || true
    systemctl disable voltaxe-sentinel || true
fi

exit 0
EOF
    chmod 755 "${pkg_dir}/DEBIAN/prerm"
    
    # Create systemd service file
    cat > "${pkg_dir}/lib/systemd/system/voltaxe-sentinel.service" << EOF
[Unit]
Description=Voltaxe Sentinel Security Agent
After=network.target
Documentation=https://docs.voltaxe.com

[Service]
Type=simple
User=voltaxe
Group=voltaxe
ExecStart=/usr/local/bin/${APP_NAME}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=voltaxe-sentinel

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/log/voltaxe

[Install]
WantedBy=multi-user.target
EOF
    
    # Create default configuration
    cat > "${pkg_dir}/etc/voltaxe/sentinel.conf" << 'EOF'
# Voltaxe Sentinel Configuration

# API Server
API_SERVER=http://localhost:8000
API_KEY=

# Monitoring Intervals (seconds)
HEARTBEAT_INTERVAL=30
SCAN_INTERVAL=60

# Features
PROCESS_MONITORING=true
VULNERABILITY_SCANNING=true
BEHAVIORAL_ANALYSIS=true

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/voltaxe/sentinel.log
EOF
    
    # Create documentation directory
    mkdir -p "${pkg_dir}/usr/local/share/doc/${APP_NAME}"
    
    # Create README
    cat > "${pkg_dir}/usr/local/share/doc/${APP_NAME}/README" << EOF
Voltaxe Sentinel Agent v${FULL_VERSION}
=====================================

Installation successful!

QUICK START
-----------
1. Configure the agent:
   sudo nano /etc/voltaxe/sentinel.conf

2. Start the service:
   sudo systemctl start voltaxe-sentinel

3. Check status:
   sudo systemctl status voltaxe-sentinel

4. View logs:
   sudo journalctl -u voltaxe-sentinel -f

CONFIGURATION
-------------
Configuration file: /etc/voltaxe/sentinel.conf
Log directory: /var/log/voltaxe/
Binary location: /usr/local/bin/${APP_NAME}

SUPPORT
-------
Documentation: https://docs.voltaxe.com
Support: support@voltaxe.com

EOF
    
    # Build the .deb package
    echo -e "  ${CYAN}→${NC} Building .deb package..."
    fakeroot dpkg-deb --build "${pkg_dir}" "${DIST_DIR}/${pkg_name}.deb" 2>&1 | grep -v "empty directory"
    
    local deb_size=$(du -h "${DIST_DIR}/${pkg_name}.deb" | cut -f1)
    echo -e "${GREEN}✅ Linux .deb package created: ${pkg_name}.deb (${deb_size})${NC}"
    echo ""
}

# Build Windows installer with NSIS
build_windows_installer() {
    echo -e "${PURPLE}📦 Building Windows installer...${NC}"
    
    local arch="amd64"
    local installer_name="${APP_NAME}_${FULL_VERSION}_setup.exe"
    local nsi_file="${PACKAGE_DIR}/windows/installer.nsi"
    
    # Create NSIS installer script
    cat > "$nsi_file" << EOF
; Voltaxe Sentinel Windows Installer Script
; Generated by build_agents.sh

!define APP_NAME "${APP_DISPLAY_NAME}"
!define APP_VERSION "${FULL_VERSION}"
!define APP_PUBLISHER "${COMPANY}"
!define APP_WEBSITE "https://voltaxe.com"
!define APP_EXECUTABLE "${APP_NAME}.exe"

; Modern UI
!include "MUI2.nsh"

; General
Name "\${APP_NAME}"
OutFile "${DIST_DIR}/${installer_name}"
InstallDir "\$PROGRAMFILES64\\Voltaxe\\Sentinel"
InstallDirRegKey HKLM "Software\\Voltaxe\\Sentinel" "InstallDir"
RequestExecutionLevel admin

; Interface Settings
!define MUI_ABORTWARNING
!define MUI_ICON "\${NSISDIR}\\Contrib\\Graphics\\Icons\\modern-install.ico"
!define MUI_UNICON "\${NSISDIR}\\Contrib\\Graphics\\Icons\\modern-uninstall.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "${SCRIPT_DIR}/LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"

; Version Information
VIProductVersion "${VERSION}.0.0"
VIAddVersionKey "ProductName" "\${APP_NAME}"
VIAddVersionKey "CompanyName" "\${APP_PUBLISHER}"
VIAddVersionKey "FileVersion" "\${APP_VERSION}"
VIAddVersionKey "ProductVersion" "\${APP_VERSION}"
VIAddVersionKey "FileDescription" "Voltaxe Sentinel Security Agent"
VIAddVersionKey "LegalCopyright" "© 2025 \${APP_PUBLISHER}"

; Installer Sections
Section "Voltaxe Sentinel" SecMain
    SetOutPath "\$INSTDIR"
    
    ; Copy binary
    File "${BUILD_DIR}/windows/${arch}/${APP_NAME}.exe"
    
    ; Create configuration directory
    CreateDirectory "\$APPDATA\\Voltaxe\\Sentinel"
    
    ; Create default config if it doesn't exist
    IfFileExists "\$APPDATA\\Voltaxe\\Sentinel\\sentinel.conf" SkipConfig
    FileOpen \$0 "\$APPDATA\\Voltaxe\\Sentinel\\sentinel.conf" w
    FileWrite \$0 "# Voltaxe Sentinel Configuration\$\\r\$\\n"
    FileWrite \$0 "API_SERVER=http://localhost:8000\$\\r\$\\n"
    FileWrite \$0 "HEARTBEAT_INTERVAL=30\$\\r\$\\n"
    FileWrite \$0 "SCAN_INTERVAL=60\$\\r\$\\n"
    FileClose \$0
    SkipConfig:
    
    ; Create uninstaller
    WriteUninstaller "\$INSTDIR\\uninstall.exe"
    
    ; Registry entries
    WriteRegStr HKLM "Software\\Voltaxe\\Sentinel" "InstallDir" "\$INSTDIR"
    WriteRegStr HKLM "Software\\Voltaxe\\Sentinel" "Version" "\${APP_VERSION}"
    
    ; Add to Add/Remove Programs
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VoltaxeSentinel" \
                     "DisplayName" "\${APP_NAME}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VoltaxeSentinel" \
                     "UninstallString" "\$INSTDIR\\uninstall.exe"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VoltaxeSentinel" \
                     "Publisher" "\${APP_PUBLISHER}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VoltaxeSentinel" \
                     "DisplayVersion" "\${APP_VERSION}"
    WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VoltaxeSentinel" \
                     "URLInfoAbout" "\${APP_WEBSITE}"
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VoltaxeSentinel" \
                     "NoModify" 1
    WriteRegDWORD HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VoltaxeSentinel" \
                     "NoRepair" 1
    
    ; Create Start Menu shortcuts
    CreateDirectory "\$SMPROGRAMS\\Voltaxe"
    CreateShortcut "\$SMPROGRAMS\\Voltaxe\\Voltaxe Sentinel.lnk" "\$INSTDIR\\\${APP_EXECUTABLE}"
    CreateShortcut "\$SMPROGRAMS\\Voltaxe\\Uninstall Sentinel.lnk" "\$INSTDIR\\uninstall.exe"
    
    ; Install as Windows Service
    ExecWait '"\$INSTDIR\\\${APP_EXECUTABLE}" install'
    
    MessageBox MB_OK "Installation complete!$\\n$\\nConfiguration: \$APPDATA\\Voltaxe\\Sentinel\\sentinel.conf$\\n$\\nStart the service with: sc start VoltaxeSentinel"
SectionEnd

; Uninstaller
Section "Uninstall"
    ; Stop and remove service
    ExecWait '"\$INSTDIR\\\${APP_EXECUTABLE}" stop'
    ExecWait '"\$INSTDIR\\\${APP_EXECUTABLE}" uninstall'
    
    ; Remove files
    Delete "\$INSTDIR\\\${APP_EXECUTABLE}"
    Delete "\$INSTDIR\\uninstall.exe"
    RMDir "\$INSTDIR"
    
    ; Remove shortcuts
    Delete "\$SMPROGRAMS\\Voltaxe\\Voltaxe Sentinel.lnk"
    Delete "\$SMPROGRAMS\\Voltaxe\\Uninstall Sentinel.lnk"
    RMDir "\$SMPROGRAMS\\Voltaxe"
    
    ; Remove registry entries
    DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VoltaxeSentinel"
    DeleteRegKey HKLM "Software\\Voltaxe\\Sentinel"
SectionEnd
EOF
    
    # Create a placeholder LICENSE file if it doesn't exist
    if [ ! -f "${SCRIPT_DIR}/LICENSE" ]; then
        cat > "${SCRIPT_DIR}/LICENSE" << 'EOF'
Voltaxe Sentinel License Agreement

Copyright (c) 2025 Voltaxe Security. All rights reserved.

This software is licensed to you under the Voltaxe End User License Agreement.
For full license terms, visit: https://voltaxe.com/license
EOF
    fi
    
    # Build installer with NSIS
    if command -v makensis &> /dev/null; then
        echo -e "  ${CYAN}→${NC} Compiling Windows installer with NSIS..."
        makensis -V2 "$nsi_file" 2>&1 | grep -E "(Output|Size)" || true
        
        if [ -f "${DIST_DIR}/${installer_name}" ]; then
            local exe_size=$(du -h "${DIST_DIR}/${installer_name}" | cut -f1)
            echo -e "${GREEN}✅ Windows installer created: ${installer_name} (${exe_size})${NC}"
        else
            echo -e "${RED}❌ Failed to create Windows installer${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ NSIS not available, creating standalone .exe instead${NC}"
        cp "${BUILD_DIR}/windows/${arch}/${APP_NAME}.exe" "${DIST_DIR}/${APP_NAME}_${FULL_VERSION}_windows_amd64.exe"
        local exe_size=$(du -h "${DIST_DIR}/${APP_NAME}_${FULL_VERSION}_windows_amd64.exe" | cut -f1)
        echo -e "${GREEN}✅ Windows executable created: ${APP_NAME}_${FULL_VERSION}_windows_amd64.exe (${exe_size})${NC}"
    fi
    
    echo ""
}

# Build macOS .pkg installer
build_macos_pkg() {
    echo -e "${PURPLE}📦 Building macOS .pkg installer...${NC}"
    
    local pkg_name="${APP_NAME}_${FULL_VERSION}.pkg"
    local payload_dir="${PACKAGE_DIR}/darwin/payload"
    local scripts_dir="${PACKAGE_DIR}/darwin/scripts"
    
    # Create payload structure
    mkdir -p "${payload_dir}/usr/local/bin"
    mkdir -p "${payload_dir}/Library/LaunchDaemons"
    mkdir -p "${payload_dir}/etc/voltaxe"
    mkdir -p "${scripts_dir}"
    
    # Copy binaries (universal binary if both architectures available)
    if [ -f "${BUILD_DIR}/darwin/amd64/${APP_NAME}" ] && [ -f "${BUILD_DIR}/darwin/arm64/${APP_NAME}" ]; then
        echo -e "  ${CYAN}→${NC} Creating universal macOS binary..."
        if command -v lipo &> /dev/null; then
            lipo -create \
                "${BUILD_DIR}/darwin/amd64/${APP_NAME}" \
                "${BUILD_DIR}/darwin/arm64/${APP_NAME}" \
                -output "${payload_dir}/usr/local/bin/${APP_NAME}"
        else
            echo -e "  ${YELLOW}⚠${NC}  lipo not available, using amd64 binary only"
            cp "${BUILD_DIR}/darwin/amd64/${APP_NAME}" "${payload_dir}/usr/local/bin/"
        fi
    elif [ -f "${BUILD_DIR}/darwin/arm64/${APP_NAME}" ]; then
        cp "${BUILD_DIR}/darwin/arm64/${APP_NAME}" "${payload_dir}/usr/local/bin/"
    else
        cp "${BUILD_DIR}/darwin/amd64/${APP_NAME}" "${payload_dir}/usr/local/bin/"
    fi
    
    chmod 755 "${payload_dir}/usr/local/bin/${APP_NAME}"
    
    # Create LaunchDaemon plist
    cat > "${payload_dir}/Library/LaunchDaemons/com.voltaxe.sentinel.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.voltaxe.sentinel</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/${APP_NAME}</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/var/log/voltaxe/sentinel.log</string>
    
    <key>StandardErrorPath</key>
    <string>/var/log/voltaxe/sentinel.error.log</string>
    
    <key>WorkingDirectory</key>
    <string>/usr/local/bin</string>
</dict>
</plist>
EOF
    
    # Create default configuration
    cat > "${payload_dir}/etc/voltaxe/sentinel.conf" << 'EOF'
# Voltaxe Sentinel Configuration for macOS

API_SERVER=http://localhost:8000
API_KEY=

HEARTBEAT_INTERVAL=30
SCAN_INTERVAL=60

PROCESS_MONITORING=true
VULNERABILITY_SCANNING=true
BEHAVIORAL_ANALYSIS=true

LOG_LEVEL=info
LOG_FILE=/var/log/voltaxe/sentinel.log
EOF
    
    # Create postinstall script
    cat > "${scripts_dir}/postinstall" << 'EOF'
#!/bin/bash

# Create log directory
mkdir -p /var/log/voltaxe
chmod 755 /var/log/voltaxe

# Set permissions
chmod 755 /usr/local/bin/voltaxe-sentinel
chmod 644 /Library/LaunchDaemons/com.voltaxe.sentinel.plist

# Load the LaunchDaemon
launchctl load /Library/LaunchDaemons/com.voltaxe.sentinel.plist

echo "✅ Voltaxe Sentinel installed successfully!"
echo "📋 To start: sudo launchctl start com.voltaxe.sentinel"
echo "📊 To check status: sudo launchctl list | grep voltaxe"
echo "📝 Configuration: /etc/voltaxe/sentinel.conf"

exit 0
EOF
    chmod 755 "${scripts_dir}/postinstall"
    
    # Create preinstall script (stop existing service)
    cat > "${scripts_dir}/preinstall" << 'EOF'
#!/bin/bash

# Stop existing service if running
if launchctl list | grep -q "com.voltaxe.sentinel"; then
    launchctl unload /Library/LaunchDaemons/com.voltaxe.sentinel.plist 2>/dev/null || true
fi

exit 0
EOF
    chmod 755 "${scripts_dir}/preinstall"
    
    # Build package with pkgbuild (macOS only)
    if command -v pkgbuild &> /dev/null; then
        echo -e "  ${CYAN}→${NC} Building macOS .pkg with pkgbuild..."
        
        pkgbuild \
            --root "${payload_dir}" \
            --scripts "${scripts_dir}" \
            --identifier "com.voltaxe.sentinel" \
            --version "${FULL_VERSION}" \
            --install-location "/" \
            "${DIST_DIR}/${pkg_name}"
        
        local pkg_size=$(du -h "${DIST_DIR}/${pkg_name}" | cut -f1)
        echo -e "${GREEN}✅ macOS .pkg created: ${pkg_name} (${pkg_size})${NC}"
    else
        echo -e "${YELLOW}⚠ pkgbuild not available (requires macOS)${NC}"
        echo -e "  Creating standalone macOS binary archive instead..."
        
        # Create tar.gz archive as fallback
        local archive_name="${APP_NAME}_${FULL_VERSION}_macos.tar.gz"
        tar -czf "${DIST_DIR}/${archive_name}" \
            -C "${payload_dir}/usr/local/bin" \
            "${APP_NAME}"
        
        local archive_size=$(du -h "${DIST_DIR}/${archive_name}" | cut -f1)
        echo -e "${GREEN}✅ macOS archive created: ${archive_name} (${archive_size})${NC}"
    fi
    
    echo ""
}

# Generate checksums
generate_checksums() {
    echo -e "${BLUE}🔐 Generating checksums...${NC}"
    
    cd "$DIST_DIR"
    
    # Create checksums file
    {
        echo "# Voltaxe Sentinel ${FULL_VERSION} - Checksums"
        echo "# Generated: $(date)"
        echo ""
    } > checksums.txt
    
    for file in *; do
        if [ -f "$file" ] && [ "$file" != "checksums.txt" ]; then
            sha256sum "$file" >> checksums.txt
            echo -e "  ${GREEN}✓${NC} ${file}"
        fi
    done
    
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✅ Checksums generated: checksums.txt${NC}"
    echo ""
}

# Create build manifest
create_manifest() {
    echo -e "${BLUE}📋 Creating build manifest...${NC}"
    
    cat > "${DIST_DIR}/BUILD_MANIFEST.txt" << EOF
╔════════════════════════════════════════════════════════════════╗
║         Voltaxe Sentinel - Build Manifest                     ║
╚════════════════════════════════════════════════════════════════╝

Build Information:
------------------
Version:        ${FULL_VERSION}
Build Date:     $(date '+%Y-%m-%d %H:%M:%S %Z')
Go Version:     $(go version)
Build Host:     $(hostname)
Build User:     $(whoami)

Package Contents:
-----------------
EOF
    
    cd "$DIST_DIR"
    for file in *; do
        if [ -f "$file" ] && [ "$file" != "BUILD_MANIFEST.txt" ]; then
            local size=$(du -h "$file" | cut -f1)
            printf "%-50s %10s\n" "$file" "$size" >> BUILD_MANIFEST.txt
        fi
    done
    
    cat >> BUILD_MANIFEST.txt << EOF

Installation Instructions:
--------------------------

Linux (.deb):
  sudo dpkg -i ${APP_NAME}_${FULL_VERSION}_amd64.deb
  sudo systemctl start voltaxe-sentinel

Windows (.exe):
  Run the installer as Administrator
  Follow the installation wizard
  Service will start automatically

macOS (.pkg):
  sudo installer -pkg ${APP_NAME}_${FULL_VERSION}.pkg -target /
  sudo launchctl start com.voltaxe.sentinel

Verification:
-------------
Verify checksums with:
  sha256sum -c checksums.txt

Support:
--------
Documentation: https://docs.voltaxe.com
Support: support@voltaxe.com
Issues: https://github.com/voltaxe/sentinel/issues

EOF
    
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✅ Build manifest created${NC}"
    echo ""
}

# Print build summary
print_summary() {
    echo -e "${CYAN}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║                    BUILD COMPLETE ✅                           ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${GREEN}📦 Distribution packages created in:${NC} ${DIST_DIR}"
    echo ""
    echo -e "${BLUE}Available packages:${NC}"
    
    cd "$DIST_DIR"
    shopt -s nullglob
    for file in *.deb *.exe *.pkg *.tar.gz; do
        if [ -f "$file" ]; then
            local size=$(du -h "$file" | cut -f1)
            echo -e "  ${GREEN}•${NC} ${file} (${size})"
        fi
    done
    shopt -u nullglob
    
    echo ""
    echo -e "${BLUE}Files:${NC}"
    echo -e "  ${GREEN}•${NC} checksums.txt (SHA256 checksums)"
    echo -e "  ${GREEN}•${NC} BUILD_MANIFEST.txt (build information)"
    echo ""
    
    cd "$SCRIPT_DIR"
    
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Test packages on target platforms"
    echo -e "  2. Verify checksums: ${CYAN}cd ${DIST_DIR} && sha256sum -c checksums.txt${NC}"
    echo -e "  3. Review manifest: ${CYAN}cat ${DIST_DIR}/BUILD_MANIFEST.txt${NC}"
    echo -e "  4. Deploy to distribution server"
    echo ""
    
    echo -e "${GREEN}🚀 Ready for production deployment!${NC}"
    echo ""
}

# Main build process
main() {
    parse_args "$@"
    
    print_banner
    check_dependencies
    setup_directories
    compile_binaries
    
    [ "$BUILD_LINUX" = true ] && build_linux_deb
    [ "$BUILD_WINDOWS" = true ] && build_windows_installer
    [ "$BUILD_MACOS" = true ] && build_macos_pkg
    
    generate_checksums
    create_manifest
    print_summary
}

# Run main
main "$@"
