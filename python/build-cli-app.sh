#!/bin/bash

# Build script for GitInspectorCLI standalone application
# This script builds the PyInstaller executable for the CLI application

set -e

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

echo "🔨 Building GitInspectorCLI standalone application..."

# Check if we're in the right directory
if [ ! -f "python/gigui/cli.py" ]; then
    print_error "Please run this script from the gitinspectorgui root directory"
    exit 1
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

# Clean previous builds
print_status "Cleaning previous builds..."
cd python
rm -rf build/ dist/ *.spec.bak

print_status "Building CLI application with PyInstaller..."

# Build using the spec file
if command -v uv &> /dev/null; then
    uv run pyinstaller cli-app.spec --clean --noconfirm
else
    pyinstaller cli-app.spec --clean --noconfirm
fi

# Verify the build
if [ -f "dist/gitinspectorcli" ]; then
    print_success "Build successful!"
    print_status "Executable created: python/dist/gitinspectorcli"

    print_status "Testing the executable..."
    if ./dist/gitinspectorcli --help > /dev/null 2>&1; then
        print_success "Executable test passed!"
    else
        print_warning "Executable test failed, but build completed"
    fi

    # Show file size
    print_status "Executable size: $(du -h dist/gitinspectorcli | cut -f1)"

    # Make executable (for Unix systems)
    chmod +x dist/gitinspectorcli

else
    print_error "Build failed - executable not found"
    exit 1
fi

echo ""
print_success "GitInspectorCLI build complete!"
echo ""
echo "📋 Usage examples:"
echo "   ./python/dist/gitinspectorcli --help"
echo "   ./python/dist/gitinspectorcli /path/to/repository"
echo "   ./python/dist/gitinspectorcli /path/to/repo1 /path/to/repo2 --output-format json"
echo "   ./python/dist/gitinspectorcli /path/to/repo --exclude-authors 'bot*' --n-files 50"
echo ""
echo "💡 The executable can be distributed as a standalone binary!"
echo "   Users don't need Python installed to run it."
