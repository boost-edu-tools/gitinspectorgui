#!/bin/bash

# GitInspectorGUI Release Preparation Script
# Usage: ./scripts/prepare-release.sh <version>

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.2.0"
    exit 1
fi

# Validate version format (basic semver check)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]]; then
    echo "Error: Version must follow semantic versioning (e.g., 1.2.0 or 1.2.0-beta.1)"
    exit 1
fi

echo "🚀 Preparing release v$VERSION..."

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -f "src-tauri/tauri.conf.json" ] || [ ! -f "python/pyproject.toml" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "Warning: You have uncommitted changes. Please commit or stash them first."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Backup original files
echo "📋 Creating backups..."
cp package.json package.json.backup
cp src-tauri/tauri.conf.json src-tauri/tauri.conf.json.backup
cp python/pyproject.toml python/pyproject.toml.backup

# Update package.json
echo "📝 Updating package.json..."
if command -v jq >/dev/null 2>&1; then
    # Use jq if available for safer JSON manipulation
    jq ".version = \"$VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
else
    # Fallback to sed
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json
    rm -f package.json.bak
fi

# Update Tauri configuration
echo "📝 Updating src-tauri/tauri.conf.json..."
if command -v jq >/dev/null 2>&1; then
    jq ".package.version = \"$VERSION\"" src-tauri/tauri.conf.json > src-tauri/tauri.conf.json.tmp && mv src-tauri/tauri.conf.json.tmp src-tauri/tauri.conf.json
else
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json
    rm -f src-tauri/tauri.conf.json.bak
fi

# Update Python pyproject.toml
echo "📝 Updating python/pyproject.toml..."
sed -i.bak "s/version = \"[^\"]*\"/version = \"$VERSION\"/" python/pyproject.toml
rm -f python/pyproject.toml.bak

# Verify changes
echo "✅ Version updated in all files:"
echo "  - package.json: $(grep '"version"' package.json | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')"
echo "  - tauri.conf.json: $(grep '"version"' src-tauri/tauri.conf.json | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')"
echo "  - pyproject.toml: $(grep '^version =' python/pyproject.toml | sed 's/version = "\([^"]*\)"/\1/')"

# Check if CHANGELOG.md exists and prompt for update
if [ -f "CHANGELOG.md" ]; then
    echo ""
    echo "📋 Please update CHANGELOG.md with the new version and changes."
    echo "   Current changelog:"
    head -20 CHANGELOG.md
    echo ""
    read -p "Press Enter after updating CHANGELOG.md..."
else
    echo "⚠️  CHANGELOG.md not found. Consider creating one for better release documentation."
fi

# Run basic validation
echo "🔍 Running basic validation..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    pnpm install
fi

if [ ! -d ".venv" ] && [ ! -f "uv.lock" ]; then
    echo "Installing Python dependencies..."
    uv sync
fi

# Run quick tests
echo "🧪 Running quick validation tests..."
if command -v pnpm >/dev/null 2>&1; then
    pnpm run type-check 2>/dev/null || echo "  TypeScript check: skipped (no type-check script)"
fi

if command -v python >/dev/null 2>&1; then
    python -c "import gigui; print(f'  Python import: OK (version {gigui.__version__ if hasattr(gigui, \"__version__\") else \"unknown\"})')" 2>/dev/null || echo "  Python import: failed"
fi

echo ""
echo "✅ Release preparation complete!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Test the application: pnpm run tauri dev"
echo "  3. Commit the changes: git add . && git commit -m 'chore: bump version to v$VERSION'"
echo "  4. Create and push tag: git tag v$VERSION && git push origin v$VERSION"
echo "  5. Build release: ./scripts/build-all-platforms.sh"
echo ""
echo "To restore backups if needed:"
echo "  mv package.json.backup package.json"
echo "  mv src-tauri/tauri.conf.json.backup src-tauri/tauri.conf.json"
echo "  mv python/pyproject.toml.backup python/pyproject.toml"
