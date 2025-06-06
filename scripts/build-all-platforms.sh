#!/bin/bash

# GitInspectorGUI Cross-Platform Build Script
# Builds the application for Windows, macOS, and Linux

set -e

echo "🚀 GitInspectorGUI Cross-Platform Build Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "src-tauri/tauri.conf.json" ]; then
    print_error "Please run this script from the gitinspectorgui root directory"
    exit 1
fi

# Check dependencies
print_status "Checking dependencies..."

if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    print_error "Rust/Cargo is not installed"
    exit 1
fi

if ! command -v uv &> /dev/null; then
    print_warning "uv is not installed, Python backend may not work properly"
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
pnpm install

# Install Tauri CLI if not present
if ! command -v tauri &> /dev/null; then
    print_status "Installing Tauri CLI..."
    pnpm add -g @tauri-apps/cli
fi

# Build frontend
print_status "Building frontend..."
pnpm run build

# Create output directory
mkdir -p dist/releases

# Function to build for a specific target
build_target() {
    local target=$1
    local platform=$2
    
    print_status "Building for $platform ($target)..."
    
    if cargo tauri build --target $target; then
        print_success "Successfully built for $platform"
        
        # Copy artifacts to dist directory
        case $platform in
            "Windows")
                cp src-tauri/target/$target/release/bundle/msi/*.msi dist/releases/ 2>/dev/null || true
                cp src-tauri/target/$target/release/bundle/nsis/*.exe dist/releases/ 2>/dev/null || true
                ;;
            "macOS")
                cp -r src-tauri/target/$target/release/bundle/dmg/*.dmg dist/releases/ 2>/dev/null || true
                cp -r src-tauri/target/$target/release/bundle/macos/*.app dist/releases/ 2>/dev/null || true
                ;;
            "Linux")
                cp src-tauri/target/$target/release/bundle/deb/*.deb dist/releases/ 2>/dev/null || true
                cp src-tauri/target/$target/release/bundle/appimage/*.AppImage dist/releases/ 2>/dev/null || true
                ;;
        esac
    else
        print_error "Failed to build for $platform"
        return 1
    fi
}

# Detect current platform and build accordingly
CURRENT_OS=$(uname -s)
case $CURRENT_OS in
    "Darwin")
        print_status "Detected macOS - Building for macOS targets"
        build_target "x86_64-apple-darwin" "macOS-Intel"
        build_target "aarch64-apple-darwin" "macOS-Apple-Silicon"
        ;;
    "Linux")
        print_status "Detected Linux - Building for Linux targets"
        build_target "x86_64-unknown-linux-gnu" "Linux-x64"
        ;;
    "MINGW"*|"MSYS"*|"CYGWIN"*)
        print_status "Detected Windows - Building for Windows targets"
        build_target "x86_64-pc-windows-msvc" "Windows-x64"
        ;;
    *)
        print_warning "Unknown OS: $CURRENT_OS - Building for current target only"
        cargo tauri build
        ;;
esac

# Build Python CLI distribution
print_status "Building Python CLI distribution..."
if command -v uv &> /dev/null; then
    cd python
    
    # Create wheel
    if uv build; then
        print_success "Python wheel built successfully"
        cp dist/*.whl ../dist/releases/ 2>/dev/null || true
    else
        print_warning "Failed to build Python wheel"
    fi
    
    cd ..
else
    print_warning "Skipping Python CLI build - uv not available"
fi

# Generate checksums
print_status "Generating checksums..."
cd dist/releases
if ls *.* 1> /dev/null 2>&1; then
    sha256sum * > checksums.sha256 2>/dev/null || shasum -a 256 * > checksums.sha256
    print_success "Checksums generated"
else
    print_warning "No release files found for checksum generation"
fi
cd ../..

# Summary
print_success "Build process completed!"
echo ""
echo "📦 Release artifacts:"
ls -la dist/releases/ 2>/dev/null || echo "No release files found"

echo ""
echo "🎉 GitInspectorGUI build complete!"
echo "   Desktop apps: dist/releases/"
echo "   Python CLI: Available via pip install (if wheel was built)"
echo ""
echo "📋 Next steps:"
echo "   1. Test the built applications"
echo "   2. Upload to release distribution platform"
echo "   3. Update auto-updater endpoints"
echo "   4. Publish Python package to PyPI"