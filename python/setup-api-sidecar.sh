#!/bin/bash

# Setup script for GitInspectorGUI API Sidecar Python environment
# This script creates a virtual environment using uv and installs dependencies

set -e  # Exit on any error

echo "🐍 Setting up Python environment for API Sidecar..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed. Please install uv first:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Navigate to the python directory
cd "$(dirname "$0")"
echo "📁 Working directory: $(pwd)"

# Create virtual environment using uv
echo "🔧 Creating virtual environment with uv..."
uv venv .venv --python 3.12

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

# Install minimal dependencies for API sidecar
echo "📦 Installing minimal dependencies for API sidecar..."
uv pip install \
    beautifulsoup4>=4.12.3 \
    colorlog>=6.9 \
    gitpython>=3.1.43 \
    jinja2>=3.1.4 \
    jsonschema>=4.23 \
    platformdirs>=4.3.6

# Install PyInstaller for building the executable
echo "🔨 Installing PyInstaller..."
uv pip install pyinstaller>=6.11.1

# Verify installation
echo "✅ Verifying installation..."
python -c "
import sys
print(f'Python version: {sys.version}')

# Test minimal imports for API sidecar
try:
    import git
    import colorlog
    import jsonschema
    import platformdirs
    import bs4
    import jinja2
    print('✅ All required dependencies imported successfully')
except ImportError as e:
    print(f'❌ Import error: {e}')
    sys.exit(1)
"

# Test the API module
echo "🧪 Testing API module..."
python -c "
import sys
sys.path.insert(0, '.')
try:
    from gigui.api import GitInspectorAPI
    api = GitInspectorAPI()
    settings = api.get_settings()
    print('✅ API module loaded and tested successfully')
except Exception as e:
    print(f'❌ API test failed: {e}')
    sys.exit(1)
"

echo ""
echo "🎉 Python environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Activate the environment: source python/.venv/bin/activate"
echo "   2. Build the sidecar: pyinstaller python/api-sidecar.spec"
echo "   3. Test the executable: ./dist/gitinspector-api-sidecar get_settings"
echo ""
echo "💡 The virtual environment is located at: python/.venv"
echo "💡 The PyInstaller spec file is: python/api-sidecar.spec"