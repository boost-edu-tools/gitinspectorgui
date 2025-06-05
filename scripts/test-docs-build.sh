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

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed or not in PATH"
    echo "   Please install uv: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
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

# Build the documentation (same as GitLab Pages)
echo ""
echo "🔨 Building documentation..."
mkdocs build --site-dir public

if [ $? -eq 0 ]; then
    echo "✅ Documentation built successfully!"
    echo ""
    echo "📁 Generated files in 'public/' directory:"
    ls -la public/ | head -10
    echo ""
    echo "📊 Build statistics:"
    echo "   - Total files: $(find public -type f | wc -l)"
    echo "   - HTML files: $(find public -name "*.html" | wc -l)"
    echo "   - CSS files: $(find public -name "*.css" | wc -l)"
    echo "   - JS files: $(find public -name "*.js" | wc -l)"
    echo ""
    echo "🌐 To test locally, you can:"
    echo "   1. Run: python3 -m http.server 8080 --directory public"
    echo "   2. Open: http://localhost:8080"
    echo ""
    echo "🚀 This build would be ready for GitLab Pages deployment!"
else
    echo "❌ Documentation build failed!"
    exit 1
fi

# Deactivate virtual environment
deactivate
echo "✅ Test completed successfully"

echo ""
echo "🔧 Next steps:"
echo "   - Review the generated 'public/' directory"
echo "   - Test the site locally with the HTTP server command above"
echo "   - If everything looks good, you can enable GitLab Pages CI/CD"
echo ""
echo "💡 To clean up: rm -rf public"
echo "💡 The .venv environment is preserved for your project"
