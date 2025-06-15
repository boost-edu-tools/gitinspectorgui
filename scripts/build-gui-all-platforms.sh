#!/bin/bash

# GitInspectorGUI Cross-Platform Build Script
# Builds the GUI application for Windows, macOS, and Linux

set -e

# Load shared utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/build-utils.sh"

# GUI-specific configuration
CONFIG="production"

# Function to show help
show_help() {
    echo "GitInspectorGUI Cross-Platform Build Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --all              Build for all supported platforms"
    echo "  --current          Build for current platform only (default)"
    echo "  --config CONFIG    Use specific configuration (production|development)"
    echo "  --clean            Clean build cache before building"
    echo "  --verbose, -v      Enable verbose output"
    echo "  --help, -h         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Build for current platform"
    echo "  $0 --all                     # Build for all platforms"
    echo "  $0 --config development      # Build with development config"
    echo "  $0 --clean --verbose         # Clean build with verbose output"
}

# Parse GUI-specific arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --config)
            CONFIG="$2"
            shift 2
            ;;
        *)
            # Let shared parser handle common arguments
            break
            ;;
    esac
done

# Parse common arguments
parse_common_args "$@"

echo "🚀 GitInspectorGUI Cross-Platform Build Script"
echo "=============================================="
echo "Configuration: $CONFIG"
echo "Build mode: $([ "$BUILD_ALL" = true ] && echo "All platforms" || echo "Current platform")"
echo "Clean build: $([ "$CLEAN_BUILD" = true ] && echo "Yes" || echo "No")"
echo ""

# Validate project directory
validate_project_directory "src-tauri/tauri.conf.json" "Please run this script from the gitinspectorgui root directory"

# Set Tauri config file based on configuration
TAURI_CONFIG="src-tauri/tauri.conf.json"
if [ "$CONFIG" = "development" ] && [ -f "src-tauri/tauri.conf.dev.json" ]; then
    TAURI_CONFIG="src-tauri/tauri.conf.dev.json"
    print_status "Using development configuration: $TAURI_CONFIG"
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

# Clean build if requested
if [ "$CLEAN_BUILD" = true ]; then
    print_status "Cleaning build cache..."

    # Clean Rust build cache
    if [ -d "src-tauri/target" ]; then
        rm -rf src-tauri/target
        print_status "Cleaned Rust build cache"
    fi

    # Clean Node.js build cache
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        print_status "Cleaned Node.js cache"
    fi

    # Clean Python build cache
    if [ -d "dist" ]; then
        rm -rf dist
        print_status "Cleaned Python build cache"
    fi

    # Clean previous releases
    if [ -d "dist/releases" ]; then
        rm -rf dist/releases
        print_status "Cleaned previous releases"
    fi
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
if [ "$VERBOSE" = true ]; then
    pnpm install
else
    pnpm install --silent
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

# Install Tauri CLI if not present
if ! command -v tauri &> /dev/null; then
    print_status "Installing Tauri CLI..."
    pnpm add -g @tauri-apps/cli
fi

# Build Python FastAPI server package
print_status "Building Python FastAPI server package..."
if command -v uv &> /dev/null; then
    if [ "$VERBOSE" = true ]; then
        uv build
    else
        uv build --quiet 2>/dev/null || uv build
    fi
else
    print_warning "uv not available, skipping Python package build"
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

    # Build command with appropriate config
    local build_cmd="cargo tauri build --target $target --config $TAURI_CONFIG"

    if [ "$VERBOSE" = true ]; then
        build_cmd="$build_cmd --verbose"
    fi

    if eval $build_cmd; then
        print_success "Successfully built for $platform"

        # Copy artifacts to dist directory
        case $platform in
            "Windows"*)
                cp src-tauri/target/$target/release/bundle/msi/*.msi dist/releases/ 2>/dev/null || true
                cp src-tauri/target/$target/release/bundle/nsis/*.exe dist/releases/ 2>/dev/null || true
                ;;
            "macOS"*)
                cp -r src-tauri/target/$target/release/bundle/dmg/*.dmg dist/releases/ 2>/dev/null || true
                # Create tarball of .app for easier distribution
                if ls src-tauri/target/$target/release/bundle/macos/*.app 1> /dev/null 2>&1; then
                    cd src-tauri/target/$target/release/bundle/macos/
                    for app in *.app; do
                        tar -czf "../../../../../dist/releases/${app%.app}-$target.app.tar.gz" "$app"
                    done
                    cd - > /dev/null
                fi
                ;;
            "Linux"*)
                cp src-tauri/target/$target/release/bundle/deb/*.deb dist/releases/ 2>/dev/null || true
                cp src-tauri/target/$target/release/bundle/appimage/*.AppImage dist/releases/ 2>/dev/null || true
                cp src-tauri/target/$target/release/bundle/rpm/*.rpm dist/releases/ 2>/dev/null || true
                ;;
        esac

        # Make AppImages executable
        chmod +x dist/releases/*.AppImage 2>/dev/null || true

    else
        print_error "Failed to build for $platform"
        return 1
    fi
}

# Build targets based on options
CURRENT_OS=$(uname -s)
CURRENT_ARCH=$(uname -m)

if [ "$BUILD_ALL" = true ]; then
    print_status "Building for all supported platforms..."

    # Note: Cross-compilation requires platform-specific setup
    case $CURRENT_OS in
        "Darwin")
            print_status "Building macOS targets..."
            build_target "x86_64-apple-darwin" "macOS-Intel"
            build_target "aarch64-apple-darwin" "macOS-Apple-Silicon"

            print_warning "Cross-compilation to Windows/Linux from macOS requires additional setup"
            print_warning "Consider using CI/CD or platform-specific machines for complete builds"
            ;;
        "Linux")
            print_status "Building Linux targets..."
            build_target "x86_64-unknown-linux-gnu" "Linux-x64"

            # Try to build for other architectures if cross-compilation is set up
            if rustup target list --installed | grep -q "aarch64-unknown-linux-gnu"; then
                build_target "aarch64-unknown-linux-gnu" "Linux-ARM64"
            fi

            print_warning "Cross-compilation to Windows/macOS from Linux requires additional setup"
            ;;
        "MINGW"*|"MSYS"*|"CYGWIN"*)
            print_status "Building Windows targets..."
            build_target "x86_64-pc-windows-msvc" "Windows-x64"

            print_warning "Cross-compilation to macOS/Linux from Windows requires additional setup"
            ;;
        *)
            print_warning "Unknown OS: $CURRENT_OS - Building for current target only"
            cargo tauri build --config $TAURI_CONFIG
            ;;
    esac

elif [ "$BUILD_CURRENT" = true ]; then
    print_status "Building for current platform: $CURRENT_OS ($CURRENT_ARCH)"

    case $CURRENT_OS in
        "Darwin")
            if [ "$CURRENT_ARCH" = "arm64" ]; then
                build_target "aarch64-apple-darwin" "macOS-Apple-Silicon"
            else
                build_target "x86_64-apple-darwin" "macOS-Intel"
            fi
            ;;
        "Linux")
            if [ "$CURRENT_ARCH" = "aarch64" ]; then
                build_target "aarch64-unknown-linux-gnu" "Linux-ARM64"
            else
                build_target "x86_64-unknown-linux-gnu" "Linux-x64"
            fi
            ;;
        "MINGW"*|"MSYS"*|"CYGWIN"*)
            build_target "x86_64-pc-windows-msvc" "Windows-x64"
            ;;
        *)
            print_warning "Unknown OS: $CURRENT_OS - Using default build"
            cargo tauri build --config $TAURI_CONFIG
            ;;
    esac
fi

# Copy Python package to releases if built
copy_python_wheel "dist/releases"

# Generate checksums
generate_checksums "dist/releases"

# Summary
show_build_summary "dist/releases" "GitInspectorGUI"
echo "   Desktop apps: dist/releases/"
echo "   Python FastAPI server: Available via pip install (if wheel was built)"

# Show next steps
show_next_steps "gui"
