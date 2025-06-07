#!/bin/bash

# Local test script for GitLab Pages documentation build
# This uses the existing .venv environment with all dependencies from pyproject.toml

set -e  # Exit on any error

echo "🧪 Testing MkDocs build locally (GitLab Pages simulation)"
echo "========================================================"

# Check if we're in the right directory
if [ ! -f "mkdocs.yml" ]; then
    echo "❌ Error: mkdocs.yml not found. Please run this script from the project root."
    exit 1
fi

if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: pyproject.toml not found. Please run this script from the project root."
    exit 1
fi

# Check if uv is available, try to install it if not
if ! command -v uv &> /dev/null; then
    echo "🟡 uv not found. Attempting to install with standalone installer..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # The installer places uv in ~/.local/bin, which may not be in the PATH.
    # Source the environment file to update the PATH for the current session.
    source "$HOME/.local/bin/env"
    if ! command -v uv &> /dev/null; then
        echo "❌ Error: Failed to install uv."
        echo "   Please install uv manually: https://docs.astral.sh/uv/getting-started/installation/"
        exit 1
    fi
    echo "✅ uv installed successfully."
fi

# Check if .venv exists, create if not
if [ ! -d ".venv" ]; then
    echo "🟡 .venv directory not found. Creating it now with 'uv venv'..."
    uv venv
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to create virtual environment with 'uv venv'."
        exit 1
    fi
    echo "✅ Virtual environment created successfully."
else
    echo "✅ Found existing .venv directory."
fi

echo "✅ Found mkdocs.yml"
echo "✅ Found pyproject.toml"

echo "✅ uv is available: $(uv --version)"

# Activate the existing virtual environment
echo ""
echo "📦 Using existing project environment..."
source .venv/bin/activate
echo "✅ Activated project virtual environment"

# Ensure dependencies are up to date
echo ""
echo "📥 Ensuring MkDocs dependencies are available..."
uv sync --group dev

echo "✅ Dependencies synchronized from pyproject.toml"
echo "   - mkdocs: $(mkdocs --version)"
echo "   - All MkDocs plugins included in pyproject.toml"

# Build the documentation for group pages structure
echo ""
echo "🔨 Building documentation for group pages..."

# First build to a temporary directory
mkdocs build --site-dir public_temp_build

if [ $? -eq 0 ]; then
    echo "✅ Documentation built successfully!"

    # Create the group pages structure
    echo "📁 Creating group pages structure..."
    mkdir -p public_temp/gitinspectorgui
    cp -r public_temp_build/* public_temp/gitinspectorgui/

    echo ""
    echo "📁 Generated files in 'public_temp/gitinspectorgui/' directory:"
    ls -la public_temp/gitinspectorgui/ | head -10
    echo ""
    echo "📊 Build statistics:"
    echo "   - Total files: $(find public_temp/gitinspectorgui -type f | wc -l)"
    echo "   - HTML files: $(find public_temp/gitinspectorgui -name "*.html" | wc -l)"
    echo "   - CSS files: $(find public_temp/gitinspectorgui -name "*.css" | wc -l)"
    echo "   - JS files: $(find public_temp/gitinspectorgui -name "*.js" | wc -l)"
    echo ""
    echo "🌐 To test locally, you can:"
    echo "   1. Run: python3 -m http.server 8080 --directory public_temp"
    echo "   2. Open: http://localhost:8080/gitinspectorgui/"
    echo ""
    echo "🚀 This build is ready for GitLab Group Pages deployment!"
    echo "   - Will be available at: https://edu-boost.gitlab.io/gitinspectorgui/"

    # Clean up temporary build directory
    rm -rf public_temp_build
else
    echo "❌ Documentation build failed!"
    exit 1
fi

# Deactivate virtual environment
deactivate
echo "✅ Test completed successfully"

echo ""
echo "🔧 Next steps:"
echo "   - Review the generated 'public_temp/gitinspectorgui/' directory"
echo "   - Test the site locally with the HTTP server command above"
echo "   - If everything looks good, commit and push to trigger GitLab Pages CI/CD"
echo ""
echo "💡 To clean up: rm -rf public_temp"
echo "💡 The .venv environment is preserved for your project"
