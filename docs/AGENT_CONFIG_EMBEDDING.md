# Agent Configuration Embedding

## Overview
The Voltaxe Sentinel agent now includes **embedded default configuration** using Go's `embed` package. This enables true **single-file deployment** without requiring external configuration files.

## Benefits

### 1. **Simplified Deployment** 
- ✅ Single binary file - no external config dependencies
- ✅ Copy `voltaxe_sentinel` to any system and run immediately
- ✅ No "config file not found" errors for first-time deployments

### 2. **Flexible Configuration**
- ✅ Works out-of-the-box with sensible defaults
- ✅ External config files override embedded defaults
- ✅ Command-line flags override everything

### 3. **Production Ready**
- ✅ Embedded config includes secure defaults (HTTPS, TLS verification enabled)
- ✅ Configuration precedence clearly defined
- ✅ Development mode auto-detected (localhost/TLS skip)

---

## Configuration Precedence

The agent loads configuration in the following order (highest to lowest priority):

```
1. Command-Line Flags  (highest priority)
   ↓
2. External Config File (agent.conf)
   ↓
3. Embedded Default Config
   ↓
4. Hardcoded Go Defaults (lowest priority)
```

### Example Precedence
```bash
# Scenario 1: No external config, uses embedded defaults
./voltaxe_sentinel
# Output: [CONFIG] ✓ Using embedded default configuration

# Scenario 2: External config overrides embedded defaults
./voltaxe_sentinel
# Output: [CONFIG] ✓ Loading external configuration from: agent.conf

# Scenario 3: CLI flag overrides both
./voltaxe_sentinel -server https://prod.voltaxe.com
# Output: [CONFIG] Using API server from command line: https://prod.voltaxe.com
```

---

## Embedded Configuration Content

The embedded `default_agent.conf` contains:

```properties
# API Server Configuration (HTTPS by default)
API_SERVER=https://localhost

# Timing Configuration
HEARTBEAT_INTERVAL=30s
SCAN_INTERVAL=60s

# TLS Configuration (secure by default, auto-enabled for localhost)
TLS_SKIP_VERIFY=false

# Feature Flags (all enabled by default)
PROCESS_MONITORING=true
VULNERABILITY_SCANNING=true
BEHAVIORAL_ANALYSIS=true
```

---

## Usage Scenarios

### Scenario 1: Development (Embedded Config)
```bash
# No config file needed - uses embedded defaults
./voltaxe_sentinel

# Output:
# [CONFIG] ✓ Using embedded default configuration (no external config found)
# [CONFIG] ℹ️  For custom configuration, create agent.conf in the same directory
# [CONFIG] ✓ API Server: https://localhost (from embedded defaults)
# [CONFIG] ✓ Auto-enabled TLS skip verification for development URL
```

**Best For:**
- Local development
- Quick testing
- First-time agent deployment

---

### Scenario 2: Production (External Config File)
```bash
# Create custom configuration
cat > agent.conf <<EOF
API_SERVER=https://voltaxe.production.com
TLS_SKIP_VERIFY=false
HEARTBEAT_INTERVAL=60s
SCAN_INTERVAL=300s
EOF

# Run agent - external config overrides embedded defaults
./voltaxe_sentinel

# Output:
# [CONFIG] ✓ Loading external configuration from: agent.conf
# [CONFIG] ✓ API Server: https://voltaxe.production.com (from agent.conf)
# [CONFIG] ✓ TLS Skip Verify: DISABLED (secure - verifying certificates)
```

**Best For:**
- Production deployments
- Multi-environment setups
- Custom monitoring intervals

---

### Scenario 3: Ad-Hoc Testing (CLI Flags)
```bash
# Override everything with command-line flags
./voltaxe_sentinel \
  -server https://staging.voltaxe.com \
  -tls-skip-verify

# Output:
# [CONFIG] Using API server from command line: https://staging.voltaxe.com
# [CONFIG] ⚠️  TLS certificate verification DISABLED
```

**Best For:**
- Quick testing against different environments
- Debugging connection issues
- Temporary configuration changes

---

## Configuration Locations

The agent searches for external configuration in this order:

1. **Command-line specified:** `-config /path/to/agent.conf`
2. **Current directory:** `./agent.conf`
3. **Config subdirectory:** `./config/agent.conf`
4. **System directory:** `/etc/voltaxe/agent.conf`
5. **Binary directory:** `<binary_path>/agent.conf`

If none are found, uses **embedded default configuration**.

---

## Building the Agent

### Standard Build
```bash
cd services/voltaxe_sentinel
go build -o voltaxe_sentinel
```

The `default_agent.conf` file is automatically embedded at compile time via the `//go:embed` directive.

### Cross-Platform Builds
```bash
# Linux AMD64
GOOS=linux GOARCH=amd64 go build -o voltaxe_sentinel_linux_amd64

# Windows AMD64
GOOS=windows GOARCH=amd64 go build -o voltaxe_sentinel_windows_amd64.exe

# macOS ARM64 (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o voltaxe_sentinel_darwin_arm64
```

All builds include embedded configuration.

---

## Deployment Best Practices

### Development Deployment
```bash
# Single binary - no config needed
scp voltaxe_sentinel dev-server:/usr/local/bin/
ssh dev-server "voltaxe_sentinel &"
```

### Production Deployment
```bash
# Copy binary
scp voltaxe_sentinel prod-server:/usr/local/bin/

# Create production config
ssh prod-server 'cat > /etc/voltaxe/agent.conf <<EOF
API_SERVER=https://voltaxe.production.com
TLS_SKIP_VERIFY=false
HEARTBEAT_INTERVAL=120s
SCAN_INTERVAL=600s
EOF'

# Run agent (uses /etc/voltaxe/agent.conf)
ssh prod-server "voltaxe_sentinel &"
```

### Containerized Deployment
```dockerfile
FROM alpine:latest

# Copy single binary (includes embedded config)
COPY voltaxe_sentinel /usr/local/bin/

# Optional: Add custom config
COPY agent.conf /etc/voltaxe/agent.conf

# Run agent
CMD ["/usr/local/bin/voltaxe_sentinel"]
```

---

## Migration Guide

### Before (Old Agent - Required External Config)
```bash
# Deployment required 2 files
scp voltaxe_sentinel remote-host:/usr/local/bin/
scp agent.conf remote-host:/etc/voltaxe/

# Would crash if config missing
ssh remote-host "voltaxe_sentinel"
# ERROR: config file not found
```

### After (New Agent - Embedded Config)
```bash
# Deployment requires only 1 file
scp voltaxe_sentinel remote-host:/usr/local/bin/

# Works immediately with embedded defaults
ssh remote-host "voltaxe_sentinel"
# [CONFIG] ✓ Using embedded default configuration
```

**Migration Steps:**
1. Rebuild agent with new code: `go build -o voltaxe_sentinel`
2. Existing external `agent.conf` files continue to work (override embedded config)
3. No changes needed to existing deployments
4. New deployments can omit config file for development/testing

---

## Verification

### Check Embedded Config is Present
```bash
# Extract embedded config from binary
strings voltaxe_sentinel | grep -A 10 "API_SERVER=https://localhost"

# Output should show:
# API_SERVER=https://localhost
# HEARTBEAT_INTERVAL=30s
# TLS_SKIP_VERIFY=false
# ...
```

### Test Fallback Behavior
```bash
# Test 1: No config file (uses embedded)
rm -f agent.conf
./voltaxe_sentinel
# Expect: [CONFIG] ✓ Using embedded default configuration

# Test 2: External config (overrides embedded)
echo "API_SERVER=https://custom.com" > agent.conf
./voltaxe_sentinel
# Expect: [CONFIG] ✓ Loading external configuration from: agent.conf

# Test 3: CLI flag (overrides everything)
./voltaxe_sentinel -server https://override.com
# Expect: [CONFIG] Using API server from command line: https://override.com
```

---

## Troubleshooting

### Issue: Agent uses embedded config despite external file present
**Cause:** External config file has incorrect permissions or syntax errors

**Solution:**
```bash
# Check file permissions
ls -l agent.conf
# Should be readable: -rw-r--r--

# Check file syntax
cat agent.conf
# Each line should be: KEY=VALUE (no spaces around =)

# Verify agent finds the file
./voltaxe_sentinel 2>&1 | grep CONFIG
```

---

### Issue: Want to force embedded config (ignore external file)
**Cause:** External config exists but you want to test embedded defaults

**Solution:**
```bash
# Option 1: Temporarily rename external config
mv agent.conf agent.conf.disabled
./voltaxe_sentinel

# Option 2: Use non-existent config path
./voltaxe_sentinel -config /dev/null
```

---

### Issue: Embedded config not showing in binary
**Cause:** `default_agent.conf` missing during build

**Solution:**
```bash
# Ensure file exists before building
ls -l services/voltaxe_sentinel/default_agent.conf

# If missing, recreate:
cat > services/voltaxe_sentinel/default_agent.conf <<EOF
API_SERVER=https://localhost
HEARTBEAT_INTERVAL=30s
TLS_SKIP_VERIFY=false
SCAN_INTERVAL=60s
PROCESS_MONITORING=true
VULNERABILITY_SCANNING=true
BEHAVIORAL_ANALYSIS=true
EOF

# Rebuild
cd services/voltaxe_sentinel && go build -o voltaxe_sentinel
```

---

## Technical Implementation

### Code Structure
```go
package main

import (
    _ "embed"  // Enable file embedding
    // ... other imports
)

// Embed configuration at compile time
//go:embed default_agent.conf
var defaultConfigContent string

func loadConfig() Config {
    // 1. Parse CLI flags
    // 2. Try external config files
    // 3. Fall back to embedded config
    if configReader == nil {
        configReader = bufio.NewScanner(strings.NewReader(defaultConfigContent))
    }
    // 4. Parse configuration
    // 5. Apply CLI flag overrides
}
```

### Embedded File Size
- `default_agent.conf`: ~500 bytes
- Negligible impact on binary size (9.8MB → 9.8MB)

### Build Requirements
- Go 1.16+ (for `embed` package support)
- `default_agent.conf` must exist at build time
- File is embedded at **compile time** (not runtime)

---

## Security Considerations

### ✅ Secure Defaults
- Embedded config uses **HTTPS** by default
- TLS verification **enabled** by default (secure)
- Auto-detects development environments (localhost) for convenience

### ✅ No Hardcoded Secrets
- Embedded config contains **no sensitive credentials**
- API keys/tokens must be provided via external config or environment variables

### ⚠️ Development vs Production
```bash
# Development (embedded defaults)
API_SERVER=https://localhost  # Auto-enables TLS skip
TLS_SKIP_VERIFY=false         # Overridden to true for localhost

# Production (external config)
API_SERVER=https://voltaxe.production.com
TLS_SKIP_VERIFY=false         # Strictly enforced
```

---

## Related Documentation
- [Agent Deployment Guide](../AGENT_DEPLOYMENT_GUIDE.md) - Full deployment instructions
- [Production Checklist](../PRODUCTION_CHECKLIST.md) - Pre-deployment verification
- [Troubleshooting Guide](../TROUBLESHOOTING.md) - Common issues and solutions

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| **Files Required** | 2 (binary + config) | 1 (binary with embedded config) |
| **First-Run Experience** | Crashes if no config | Works immediately |
| **External Config Support** | ✅ Yes | ✅ Yes (overrides embedded) |
| **CLI Flag Support** | ✅ Yes | ✅ Yes (overrides everything) |
| **Binary Size Impact** | N/A | +500 bytes (negligible) |
| **Build Complexity** | Simple | Simple (auto-embedded) |

**Key Takeaway:** The agent now provides **maximum flexibility** with **zero deployment friction**. Works out-of-the-box for development, fully customizable for production.
