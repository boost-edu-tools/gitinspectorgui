#!/bin/bash

# Setup script for GitInspectorGUI API Sidecar Python environment
# This script uses the main project's uv environment instead of creating a separate one

set -e  # Exit on any error

echo "🐍 Setting up Python environment for API Sidecar..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed. Please install uv first:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Navigate to the project root directory
cd "$(dirname "$0")/.."
echo "📁 Working directory: $(pwd)"

# Use main project's uv environment
echo "🔌 Using main project's uv environment..."
echo "📦 Installing dependencies with uv..."
uv sync

# Verify installation
echo "✅ Verifying installation..."
uv run python -c "
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
cd python
uv run python -c "
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
echo "   1. Build the sidecar: ./python/build-api-sidecar.sh"
echo "   2. Test the executable: ./python/dist/gitinspector-api-sidecar get_settings"
echo ""
echo "💡 The project uses uv for dependency management"
echo "💡 The PyInstaller spec file is: python/api-sidecar.spec"