# 🚀 Voltaxe Sentinel Build Script - Quick Reference

## One-Line Commands

### Build All Platforms
```bash
./build_agents.sh --all
```

### Build Specific Platform
```bash
./build_agents.sh --linux      # Linux .deb
./build_agents.sh --windows    # Windows .exe
./build_agents.sh --macos      # macOS .pkg
```

### Clean Build
```bash
./build_agents.sh --clean --all
```

### Custom Version
```bash
./build_agents.sh --version 2.0.0 --all
```

---

## 📦 Output Files

After successful build, find packages in `dist/`:

```
dist/
├── voltaxe-sentinel_1.0.0-20251005_amd64.deb       # Linux
├── voltaxe-sentinel_1.0.0-20251005_setup.exe       # Windows
├── voltaxe-sentinel_1.0.0-20251005.pkg             # macOS
├── checksums.txt                                    # SHA256
└── BUILD_MANIFEST.txt                              # Build info
```

---

## ✅ Pre-Build Checklist

```bash
# 1. Check Go version
go version  # Should be 1.24+

# 2. Install build dependencies
sudo apt-get install -y dpkg-dev fakeroot nsis

# 3. Verify source code
cd services/voltaxe_sentinel
go mod tidy
go test ./...

# 4. Clean previous builds (optional)
./build_agents.sh --clean
```

---

## 🔧 Build Requirements by Platform

### Linux (.deb)
```bash
sudo apt-get install dpkg-dev fakeroot
```

### Windows (.exe)
```bash
sudo apt-get install nsis
```

### macOS (.pkg)
```bash
# Only on macOS - uses native pkgbuild
# No installation needed
```

---

## 🎯 Quick Install Commands

### Linux
```bash
sudo dpkg -i dist/voltaxe-sentinel_*.deb
sudo systemctl start voltaxe-sentinel
```

### Windows (PowerShell as Admin)
```powershell
.\dist\voltaxe-sentinel_*_setup.exe /S
Start-Service VoltaxeSentinel
```

### macOS
```bash
sudo installer -pkg dist/voltaxe-sentinel_*.pkg -target /
sudo launchctl load /Library/LaunchDaemons/com.voltaxe.sentinel.plist
```

---

## 🔐 Verify Checksums

```bash
cd dist/
sha256sum -c checksums.txt
```

---

## 📋 Build Script Options

| Option | Description |
|--------|-------------|
| `--linux` | Build Linux .deb package only |
| `--windows` | Build Windows .exe installer only |
| `--macos` | Build macOS .pkg package only |
| `--all` | Build all platforms (default) |
| `--clean` | Clean build artifacts before building |
| `--version X.Y.Z` | Specify custom version number |
| `--help` | Show help message |

---

## 🐛 Troubleshooting

### Build Fails - Missing Go
```bash
# Install Go 1.24+
wget https://go.dev/dl/go1.24.7.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.24.7.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

### Build Fails - Missing dpkg-deb
```bash
sudo apt-get update
sudo apt-get install -y dpkg-dev
```

### Build Fails - Missing NSIS
```bash
sudo apt-get install -y nsis
```

### Permission Denied
```bash
chmod +x build_agents.sh
```

---

## 📊 Build Time Estimates

| Platform | Compilation | Packaging | Total |
|----------|-------------|-----------|-------|
| Linux | 30s | 5s | ~35s |
| Windows | 30s | 10s | ~40s |
| macOS | 30s | 5s | ~35s |
| **All** | **90s** | **20s** | **~2min** |

*Times on typical developer machine (4 cores, 16GB RAM)*

---

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Build Agents

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.24'
      
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y dpkg-dev fakeroot nsis
      
      - name: Build packages
        run: |
          chmod +x build_agents.sh
          ./build_agents.sh --version ${GITHUB_REF#refs/tags/v} --all
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: packages
          path: dist/*
```

---

## 📝 Version Numbering

**Format:** `MAJOR.MINOR.PATCH-BUILDDATE`

Examples:
- `1.0.0-20251005` - Production release
- `2.1.3-20251015` - Bug fix release
- `3.0.0-20251101` - Major version

Set custom version:
```bash
./build_agents.sh --version 2.1.0 --all
```

---

## 🎯 Common Workflows

### Release Workflow
```bash
# 1. Update version
export VERSION=2.0.0

# 2. Clean build
./build_agents.sh --clean --version $VERSION --all

# 3. Verify checksums
cd dist/ && sha256sum -c checksums.txt

# 4. Test packages
sudo dpkg -i voltaxe-sentinel_${VERSION}_amd64.deb  # Linux
# ... test on Windows, macOS

# 5. Tag release
git tag -a v${VERSION} -m "Release v${VERSION}"
git push origin v${VERSION}

# 6. Upload to release server
scp dist/* releases@server:/releases/sentinel/
```

### Development Build
```bash
# Quick build for testing
./build_agents.sh --linux
sudo dpkg -i dist/voltaxe-sentinel_*.deb
sudo systemctl restart voltaxe-sentinel
```

---

## 🔍 What Gets Built

### Linux .deb Package Contains:
- ✅ Binary: `/usr/local/bin/voltaxe-sentinel`
- ✅ Config: `/etc/voltaxe/sentinel.conf`
- ✅ Service: `/lib/systemd/system/voltaxe-sentinel.service`
- ✅ Logs: `/var/log/voltaxe/`
- ✅ Post-install script (creates user, starts service)

### Windows .exe Installer Contains:
- ✅ Binary: `C:\Program Files\Voltaxe\Sentinel\voltaxe-sentinel.exe`
- ✅ Config: `C:\ProgramData\Voltaxe\Sentinel\sentinel.conf`
- ✅ Service registration script
- ✅ Uninstaller
- ✅ Start Menu shortcuts

### macOS .pkg Package Contains:
- ✅ Universal binary: `/usr/local/bin/voltaxe-sentinel`
- ✅ Config: `/etc/voltaxe/sentinel.conf`
- ✅ LaunchDaemon: `/Library/LaunchDaemons/com.voltaxe.sentinel.plist`
- ✅ Logs: `/var/log/voltaxe/`
- ✅ Post-install script (loads daemon)

---

## 📞 Need Help?

- **Documentation**: See `AGENT_DEPLOYMENT_GUIDE.md`
- **Issues**: https://github.com/voltaxe/sentinel/issues
- **Support**: support@voltaxe.com

---

**Last Updated:** October 5, 2025
