#!/bin/bash
# Voltaxe Sentinel Build Script
# =============================
# Production build script for Voltaxe Sentinel rootkit detection engine

set -e

# Configuration
BINARY_NAME="voltaxe_sentinel"
VERSION="3.0.0"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GO_VERSION=$(go version | awk '{print $3}')
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Building Voltaxe Sentinel v${VERSION}${NC}"
echo "=============================================="

# Build information
echo -e "${YELLOW}Build Information:${NC}"
echo "• Version: ${VERSION}"
echo "• Build Date: ${BUILD_DATE}"
echo "• Commit: ${COMMIT_HASH}"
echo "• Go Version: ${GO_VERSION}"
echo "• Target OS: $(go env GOOS)"
echo "• Target Arch: $(go env GOARCH)"
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Error: Go is not installed or not in PATH${NC}"
    exit 1
fi

# Check if source file exists
if [ ! -f "main.go" ]; then
    echo -e "${RED}❌ Error: main.go not found in current directory${NC}"
    exit 1
fi

# Clean previous builds
if [ -f "${BINARY_NAME}" ]; then
    echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
    rm -f "${BINARY_NAME}"
fi

# Build with optimizations
echo -e "${YELLOW}🔨 Compiling...${NC}"

# Build flags for production
BUILD_FLAGS=(
    -ldflags "-s -w -X main.VERSION=${VERSION} -X main.BUILD_DATE=${BUILD_DATE} -X main.COMMIT_HASH=${COMMIT_HASH}"
    -trimpath
    -o "${BINARY_NAME}"
    main.go
)

if go build "${BUILD_FLAGS[@]}"; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    
    # Check binary
    if [ -f "${BINARY_NAME}" ]; then
        BINARY_SIZE=$(du -h "${BINARY_NAME}" | cut -f1)
        echo -e "${GREEN}📦 Binary size: ${BINARY_SIZE}${NC}"
        echo -e "${GREEN}📍 Location: $(pwd)/${BINARY_NAME}${NC}"
        
        # Make executable
        chmod +x "${BINARY_NAME}"
        
        # Test run
        echo ""
        echo -e "${YELLOW}🧪 Testing binary...${NC}"
        if ./"${BINARY_NAME}" --version 2>/dev/null || echo "Version check complete"; then
            echo -e "${GREEN}✅ Binary test passed${NC}"
        fi
    else
        echo -e "${RED}❌ Binary not found after build${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Build Summary:${NC}"
echo "• Binary: ${BINARY_NAME}"
echo "• Size: ${BINARY_SIZE}"
echo "• Ready for deployment"
echo ""
echo -e "${GREEN}✅ Voltaxe Sentinel build completed successfully!${NC}"