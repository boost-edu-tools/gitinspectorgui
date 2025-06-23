#!/bin/bash

# GitHub Pages documentation build test script
# Adapted from GitLab Pages version to work with GitHub Pages deployment
# This preserves all the sophistication of the original while adapting for GitHub

set -e  # Exit on any error

echo "🧪 Testing MkDocs build locally (GitHub Pages simulation)"
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

# Build the documentation for GitHub Pages (root-level structure)
echo ""
echo "🔨 Building documentation for GitHub Pages..."

# First build to a temporary directory
mkdocs build --site-dir public_temp_build

if [ $? -eq 0 ]; then
    echo "✅ Documentation built successfully!"

    # Check if we have a React demo app to build
    if [ -f "package.json" ]; then
        echo ""
        echo "🔨 Building React demo app..."
        
        # Check if npm/pnpm is available and install dependencies
        if command -v pnpm &> /dev/null; then
            echo "📥 Installing Node.js dependencies with pnpm..."
            # Try normal install first
            pnpm install
            # If we get build script warnings, approve necessary builds and retry
            if pnpm list esbuild &>/dev/null; then
                echo "🔧 Approving necessary build scripts..."
                pnpm approve-builds esbuild || true
            fi
            if [ $? -eq 0 ]; then
                echo "✅ Node.js dependencies installed successfully"
                pnpm run build
            else
                echo "❌ Failed to install Node.js dependencies with pnpm"
                exit 1
            fi
        elif command -v npm &> /dev/null; then
            echo "📥 Installing Node.js dependencies with npm..."
            npm install
            if [ $? -eq 0 ]; then
                echo "✅ Node.js dependencies installed successfully"
                npm run build
            else
                echo "❌ Failed to install Node.js dependencies with npm"
                exit 1
            fi
        else
            echo "⚠️  Neither pnpm nor npm found. Skipping demo app build."
        fi

        if [ $? -eq 0 ]; then
            echo "✅ Demo app built successfully!"
        else
            echo "❌ Demo app build failed!"
            exit 1
        fi
    else
        echo "ℹ️  No package.json found. Skipping demo app build."
    fi

    # Create the GitHub Pages structure (root-level deployment)
    echo "📁 Creating GitHub Pages structure..."
    mkdir -p public

    # Copy docs to root level (GitHub Pages standard)
    cp -r public_temp_build/* public/

    # If we have a demo app, create a demo subdirectory
    if [ -d "dist" ] && [ "$(ls -A dist 2>/dev/null)" ]; then
        echo "📁 Adding demo app to /demo/ subdirectory..."
        mkdir -p public/demo
        cp -r dist/* public/demo/
    fi

    echo ""
    echo "📁 Generated files in 'public/' directory:"
    ls -la public/ | head -10
    echo ""
    
    # Check if demo directory exists and show its contents
    if [ -d "public/demo" ]; then
        echo "📁 Demo app files in 'public/demo/' directory:"
        ls -la public/demo/ | head -5
        echo ""
    fi
    
    echo "📊 Build statistics:"
    echo "   - Total files: $(find public -type f | wc -l)"
    echo "   - HTML files: $(find public -name "*.html" | wc -l)"
    echo "   - CSS files: $(find public -name "*.css" | wc -l)"
    echo "   - JS files: $(find public -name "*.js" | wc -l)"
    
    if [ -d "public/demo" ]; then
        echo "   - Demo files: $(find public/demo -type f | wc -l)"
    fi
    
    echo ""
    echo "🌐 To test locally, you can:"
    echo "   1. Run: python3 -m http.server 8080 --directory public"
    echo "   2. Open: http://localhost:8080/"
    if [ -d "public/demo" ]; then
        echo "   3. Demo: http://localhost:8080/demo/"
    fi
    echo ""
    echo "🚀 This build is ready for GitHub Pages deployment!"
    
    # Determine the GitHub Pages URL format
    if git remote get-url origin &>/dev/null; then
        ORIGIN_URL=$(git remote get-url origin)
        if [[ $ORIGIN_URL == *"github.com"* ]]; then
            # Extract username and repo name from GitHub URL
            if [[ $ORIGIN_URL =~ github\.com[:/]([^/]+)/([^/]+)(\.git)?$ ]]; then
                USERNAME="${BASH_REMATCH[1]}"
                REPO="${BASH_REMATCH[2]}"
                REPO="${REPO%.git}"  # Remove .git suffix if present
                echo "   - Will be available at: https://${USERNAME}.github.io/${REPO}/"
                if [ -d "public/demo" ]; then
                    echo "   - Demo will be at: https://${USERNAME}.github.io/${REPO}/demo/"
                fi
            fi
        fi
    fi

    # Clean up temporary build directory
    rm -rf public_temp_build
    echo ""
    echo "🧹 Cleaned up temporary build files"
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
echo "   - Commit and push to trigger GitHub Pages deployment via GitHub Actions"
echo ""
echo "💡 To clean up: rm -rf public"
echo "💡 The .venv environment is preserved for your project"
echo ""
echo "🚀 For automated deployment, ensure you have GitHub Actions workflow configured:"
echo "   - .github/workflows/docs.yml should reference this script or use similar steps"
echo "   - GitHub Pages should be configured to deploy from GitHub Actions"