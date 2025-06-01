#!/bin/bash

# Build script for GitInspectorGUI API Sidecar
# This script builds the PyInstaller executable for the API sidecar

set -e  # Exit on any error

echo "🔨 Building GitInspectorGUI API Sidecar..."

# Navigate to the python directory
cd "$(dirname "$0")"
echo "📁 Working directory: $(pwd)"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "❌ Virtual environment not found. Please run setup-api-sidecar.sh first."
    exit 1
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

# Verify PyInstaller is installed
if ! command -v pyinstaller &> /dev/null; then
    echo "❌ PyInstaller not found. Installing..."
    uv pip install pyinstaller>=6.11.1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build/ dist/ *.spec.bak

# Build the API sidecar executable
echo "🏗️  Building API sidecar with PyInstaller..."
pyinstaller api-sidecar.spec --clean --noconfirm

# Verify the build
if [ -f "dist/gitinspector-api-sidecar" ]; then
    echo "✅ Build successful!"
    echo "📦 Executable created: dist/gitinspector-api-sidecar"
    
    # Test the executable
    echo "🧪 Testing the executable..."
    if ./dist/gitinspector-api-sidecar get_settings > /dev/null 2>&1; then
        echo "✅ Executable test passed!"
    else
        echo "⚠️  Executable test failed, but build completed"
    fi
    
    # Show file size
    echo "📊 Executable size: $(du -h dist/gitinspector-api-sidecar | cut -f1)"
    
else
    echo "❌ Build failed - executable not found"
    exit 1
fi

echo ""
echo "🎉 API Sidecar build complete!"
echo ""
echo "📋 Usage:"
echo "   ./dist/gitinspector-api-sidecar get_settings"
echo "   ./dist/gitinspector-api-sidecar save_settings '{\"input_fstrs\": [\"/path/to/repo\"]}'"
echo "   ./dist/gitinspector-api-sidecar execute_analysis '{\"input_fstrs\": [\"/path/to/repo\"]}'"
echo ""
echo "💡 The executable can be used as a Tauri sidecar process"