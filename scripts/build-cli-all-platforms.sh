#!/bin/bash

# GitInspectorCLI Cross-Platform Build Script
# Builds the CLI application for Windows, macOS, and Linux

set -e

# Default options
BUILD_ALL=false
BUILD_CURRENT=true
CLEAN_BUILD=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            BUILD_ALL=true
            BUILD_CURRENT=false
            shift
            ;;
        --current)
            BUILD_CURRENT=true
            BUILD_ALL=false
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "GitInspectorCLI Cross-Platform Build Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --all              Build for all supported platforms"
            echo "  --current          Build for current platform only (default)"
            echo "  --clean            Clean build cache before building"
            echo "  --verbose, -v      Enable verbose output"
            echo "  --help, -h         Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Build for current platform"
            echo "  $0 --all                     # Build for all platforms"
            echo "  $0 --clean --verbose         # Clean build with verbose output"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 GitInspectorCLI Cross-Platform Build Script"
echo "=============================================="
echo "Build mode: $([ "$BUILD_ALL" = true ] && echo "All platforms" || echo "Current platform")"
echo "Clean build: $([ "$CLEAN_BUILD" = true ] && echo "Yes" || echo "No")"
echo ""

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
if [ ! -f "python/gigui/cli.py" ]; then
    print_error "Please run this script from the gitinspectorgui root directory"
    exit 1
fi

# Check dependencies
print_status "Checking dependencies..."

if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    print_error "Python is not installed"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

# Check if PyInstaller is available
if ! command -v pyinstaller &> /dev/null; then
    print_warning "PyInstaller not found. Installing..."
    if command -v uv &> /dev/null; then
        uv add --dev pyinstaller>=6.11.1
    elif command -v pip &> /dev/null; then
        pip install pyinstaller>=6.11.1
    else
        print_error "Neither uv nor pip found. Please install PyInstaller manually."
        exit 1
    fi
fi

# Clean build if requested
if [ "$CLEAN_BUILD" = true ]; then
    print_status "Cleaning build cache..."
    cd python
    rm -rf build/ dist/ *.spec.bak
    cd ..
    print_status "Cleaned build cache"
fi

# Install Python dependencies
if command -v uv &> /dev/null; then
    print_status "Installing Python dependencies..."
    if [ "$VERBOSE" = true ]; then
        uv sync
    else
        uv sync --quiet
    fi
fi

# Create output directory
mkdir -p dist/cli-releases

# Function to build for a specific platform
build_cli_platform() {
    local platform=$1
    local output_name=$2

    print_status "Building CLI for $platform..."

    cd python

    # Create platform-specific spec file
    local spec_content="# Platform-specific spec for $platform
block_cipher = None

a = Analysis(
    ['gigui/cli.py'],
    pathex=['python'],
    binaries=[],
    datas=[],
    hiddenimports=[
        'git',
        'gitpython',
        'gigui.legacy_engine',
        'gigui.typedefs',
        'gigui.person_data',
        'gigui.data',
        'gigui.repo_base',
        'gigui.repo_blame',
        'gigui.repo_data',
        'gigui.utils',
        'gigui.api_types',
        'gigui.api',
        'gigui.performance_monitor',
        'argparse',
        'json',
        'sys',
        'pathlib',
        'dataclasses',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='$output_name',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)"

    echo "$spec_content" > "cli-$platform.spec"

    # Build command
    local build_cmd="pyinstaller cli-$platform.spec --clean --noconfirm"

    if command -v uv &> /dev/null; then
        build_cmd="uv run $build_cmd"
    fi

    if [ "$VERBOSE" = true ]; then
        build_cmd="$build_cmd --log-level DEBUG"
    fi

    if eval $build_cmd; then
        print_success "Successfully built CLI for $platform"

        # Copy artifacts to dist directory
        if [ -f "dist/$output_name" ]; then
            cp "dist/$output_name" "../dist/cli-releases/"
            chmod +x "../dist/cli-releases/$output_name"
        elif [ -f "dist/$output_name.exe" ]; then
            cp "dist/$output_name.exe" "../dist/cli-releases/"
        fi

        # Clean up platform-specific spec file
        rm -f "cli-$platform.spec"

    else
        print_error "Failed to build CLI for $platform"
        cd ..
        return 1
    fi

    cd ..
}

# Build targets based on options
CURRENT_OS=$(uname -s)
CURRENT_ARCH=$(uname -m)

if [ "$BUILD_ALL" = true ]; then
    print_status "Building CLI for all supported platforms..."
    print_warning "Note: Cross-compilation may require platform-specific setup"

    case $CURRENT_OS in
        "Darwin")
            print_status "Building macOS targets..."
            if [ "$CURRENT_ARCH" = "arm64" ]; then
                build_cli_platform "macos-arm64" "gitinspectorcli-macos-arm64"
                build_cli_platform "macos-x64" "gitinspectorcli-macos-x64"
            else
                build_cli_platform "macos-x64" "gitinspectorcli-macos-x64"
                build_cli_platform "macos-arm64" "gitinspectorcli-macos-arm64"
            fi
            ;;
        "Linux")
            print_status "Building Linux targets..."
            build_cli_platform "linux-x64" "gitinspectorcli-linux-x64"
            if [ "$CURRENT_ARCH" = "aarch64" ]; then
                build_cli_platform "linux-arm64" "gitinspectorcli-linux-arm64"
            fi
            ;;
        "MINGW"*|"MSYS"*|"CYGWIN"*)
            print_status "Building Windows targets..."
            build_cli_platform "windows-x64" "gitinspectorcli-windows-x64"
            ;;
        *)
            print_warning "Unknown OS: $CURRENT_OS - Building for current target only"
            build_cli_platform "unknown" "gitinspectorcli"
            ;;
    esac

elif [ "$BUILD_CURRENT" = true ]; then
    print_status "Building CLI for current platform: $CURRENT_OS ($CURRENT_ARCH)"

    case $CURRENT_OS in
        "Darwin")
            if [ "$CURRENT_ARCH" = "arm64" ]; then
                build_cli_platform "macos-arm64" "gitinspectorcli-macos-arm64"
            else
                build_cli_platform "macos-x64" "gitinspectorcli-macos-x64"
            fi
            ;;
        "Linux")
            if [ "$CURRENT_ARCH" = "aarch64" ]; then
                build_cli_platform "linux-arm64" "gitinspectorcli-linux-arm64"
            else
                build_cli_platform "linux-x64" "gitinspectorcli-linux-x64"
            fi
            ;;
        "MINGW"*|"MSYS"*|"CYGWIN"*)
            build_cli_platform "windows-x64" "gitinspectorcli-windows-x64"
            ;;
        *)
            print_warning "Unknown OS: $CURRENT_OS - Using default build"
            build_cli_platform "current" "gitinspectorcli"
            ;;
    esac
fi

# Generate checksums
print_status "Generating checksums..."
cd dist/cli-releases
if ls gitinspectorcli* 1> /dev/null 2>&1; then
    sha256sum gitinspectorcli* > checksums.sha256 2>/dev/null || shasum -a 256 gitinspectorcli* > checksums.sha256
    print_success "Checksums generated"
else
    print_warning "No CLI release files found for checksum generation"
fi
cd ../..

# Summary
print_success "CLI build process completed!"
echo ""
echo "📦 CLI release artifacts:"
ls -la dist/cli-releases/ 2>/dev/null || echo "No CLI release files found"

echo ""
echo "🎉 GitInspectorCLI build complete!"
echo "   CLI executables: dist/cli-releases/"
echo ""
echo "📋 Usage examples:"
echo "   ./dist/cli-releases/gitinspectorcli-* --help"
echo "   ./dist/cli-releases/gitinspectorcli-* /path/to/repository"
echo "   ./dist/cli-releases/gitinspectorcli-* /path/to/repo --output-format json"
echo ""
echo "💡 These executables can be distributed as standalone binaries!"
echo "   Users don't need Python installed to run them."
