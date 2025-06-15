#!/bin/bash

# GitInspectorGUI Build Utilities
# Shared functions and utilities for build scripts

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

# Function to parse common command line arguments
parse_common_args() {
    BUILD_ALL=false
    BUILD_CURRENT=true
    CLEAN_BUILD=false
    VERBOSE=false

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
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Function to detect current platform
detect_platform() {
    CURRENT_OS=$(uname -s)
    CURRENT_ARCH=$(uname -m)

    case $CURRENT_OS in
        "Darwin")
            if [ "$CURRENT_ARCH" = "arm64" ]; then
                PLATFORM_NAME="macOS-Apple-Silicon"
                PLATFORM_TARGET="aarch64-apple-darwin"
            else
                PLATFORM_NAME="macOS-Intel"
                PLATFORM_TARGET="x86_64-apple-darwin"
            fi
            ;;
        "Linux")
            if [ "$CURRENT_ARCH" = "aarch64" ]; then
                PLATFORM_NAME="Linux-ARM64"
                PLATFORM_TARGET="aarch64-unknown-linux-gnu"
            else
                PLATFORM_NAME="Linux-x64"
                PLATFORM_TARGET="x86_64-unknown-linux-gnu"
            fi
            ;;
        "MINGW"*|"MSYS"*|"CYGWIN"*)
            PLATFORM_NAME="Windows-x64"
            PLATFORM_TARGET="x86_64-pc-windows-msvc"
            ;;
        *)
            PLATFORM_NAME="Unknown-$CURRENT_OS"
            PLATFORM_TARGET="unknown"
            ;;
    esac
}

# Function to check common dependencies
check_common_dependencies() {
    local missing_deps=()

    if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
        missing_deps+=("Python")
    fi

    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi

    # Set Python command
    PYTHON_CMD="python3"
    if ! command -v python3 &> /dev/null; then
        PYTHON_CMD="python"
    fi

    return 0
}

# Function to install Python dependencies
install_python_dependencies() {
    if command -v uv &> /dev/null; then
        print_status "Installing Python dependencies with uv..."
        if [ "$VERBOSE" = true ]; then
            uv sync
        else
            uv sync --quiet
        fi
    else
        print_warning "uv not available, skipping Python dependency installation"
    fi
}

# Function to clean build cache
clean_build_cache() {
    if [ "$CLEAN_BUILD" = true ]; then
        print_status "Cleaning build cache..."

        # Clean Python build cache
        if [ -d "python/build" ]; then
            rm -rf python/build
            print_status "Cleaned Python build cache"
        fi

        if [ -d "python/dist" ]; then
            rm -rf python/dist
            print_status "Cleaned Python dist cache"
        fi

        # Clean previous releases
        if [ -d "dist" ]; then
            rm -rf dist
            print_status "Cleaned previous releases"
        fi
    fi
}

# Function to create output directory
create_output_directory() {
    local output_dir=$1
    mkdir -p "$output_dir"
    print_status "Created output directory: $output_dir"
}

# Function to generate checksums
generate_checksums() {
    local release_dir=$1

    print_status "Generating checksums..."
    cd "$release_dir"

    if ls * 1> /dev/null 2>&1; then
        sha256sum * > checksums.sha256 2>/dev/null || shasum -a 256 * > checksums.sha256
        print_success "Checksums generated"
    else
        print_warning "No release files found for checksum generation"
    fi

    cd - > /dev/null
}

# Function to show build summary
show_build_summary() {
    local release_dir=$1
    local app_name=$2

    print_success "Build process completed!"
    echo ""
    echo "📦 Release artifacts:"
    ls -la "$release_dir/" 2>/dev/null || echo "No release files found"
    echo ""
    echo "🎉 $app_name build complete!"
}

# Function to validate project directory
validate_project_directory() {
    local required_file=$1
    local error_message=$2

    if [ ! -f "$required_file" ]; then
        print_error "$error_message"
        exit 1
    fi
}

# Function to show cross-compilation warnings
show_cross_compilation_warning() {
    local current_os=$1

    case $current_os in
        "Darwin")
            print_warning "Cross-compilation to Windows/Linux from macOS requires additional setup"
            ;;
        "Linux")
            print_warning "Cross-compilation to Windows/macOS from Linux requires additional setup"
            ;;
        "MINGW"*|"MSYS"*|"CYGWIN"*)
            print_warning "Cross-compilation to macOS/Linux from Windows requires additional setup"
            ;;
    esac

    print_warning "Consider using CI/CD or platform-specific machines for complete builds"
}

# Function to copy Python wheel to releases
copy_python_wheel() {
    local release_dir=$1

    print_status "Copying Python package to releases..."
    if [ -d "dist" ] && ls dist/*.whl 1> /dev/null 2>&1; then
        cp dist/*.whl "$release_dir/" 2>/dev/null || true
        print_success "Python wheel copied to releases"
    else
        print_warning "No Python wheel found to copy"
    fi
}

# Function to show next steps
show_next_steps() {
    local app_type=$1

    echo ""
    echo "📋 Next steps:"
    echo "   1. Test the built applications: ./scripts/test-release.sh"
    echo "   2. Create release tag: git tag vX.Y.Z && git push origin vX.Y.Z"
    echo "   3. Upload to GitLab releases: glab release create vX.Y.Z dist/*releases/*"

    if [ "$app_type" = "gui" ]; then
        echo "   4. Update auto-updater endpoints (if configured)"
        echo "   5. Publish Python package to PyPI: cd python && uv publish"
    fi

    echo ""
    echo "💡 Tip: Use './scripts/prepare-release.sh X.Y.Z' to prepare version updates"
}
