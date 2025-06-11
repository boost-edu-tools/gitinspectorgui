#!/bin/bash

# GitInspectorGUI Version Update Script
# Updates version across all project files

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.2.0"
    exit 1
fi

# Validate version format (basic semver check)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$ ]]; then
    echo "Error: Version must follow semantic versioning (e.g., 1.2.0 or 1.2.0-beta.1)"
    exit 1
fi

echo "🔄 Updating GitInspectorGUI to version $VERSION..."

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -f "src-tauri/tauri.conf.json" ] || [ ! -f "python/pyproject.toml" ]; then
    echo "Error: This script must be run from the project root directory"
    exit 1
fi

# Function to update JSON files safely
update_json_version() {
    local file="$1"
    local key_path="$2"

    if command -v jq >/dev/null 2>&1; then
        # Use jq for safe JSON manipulation
        local temp_file=$(mktemp)
        jq "$key_path = \"$VERSION\"" "$file" > "$temp_file" && mv "$temp_file" "$file"
        echo "✅ Updated $file"
    else
        echo "❌ jq not found - cannot safely update $file"
        return 1
    fi
}

# Function to update TOML files
update_toml_version() {
    local file="$1"

    if command -v toml >/dev/null 2>&1; then
        # Use toml CLI if available
        toml set --toml-path "$file" project.version "$VERSION"
        echo "✅ Updated $file"
    else
        # Fallback to sed (less safe but usually works)
        sed -i.bak "s/^version = \"[^\"]*\"/version = \"$VERSION\"/" "$file"
        rm -f "$file.bak"
        echo "✅ Updated $file (using sed)"
    fi
}

# Update package.json
echo "📝 Updating package.json..."
update_json_version "package.json" ".version"

# Update Tauri configuration
echo "📝 Updating src-tauri/tauri.conf.json..."
update_json_version "src-tauri/tauri.conf.json" ".package.version"

# Update development Tauri configuration if it exists
if [ -f "src-tauri/tauri.conf.dev.json" ]; then
    echo "📝 Updating src-tauri/tauri.conf.dev.json..."
    update_json_version "src-tauri/tauri.conf.dev.json" ".package.version"
fi

# Update Python pyproject.toml
echo "📝 Updating python/pyproject.toml..."
update_toml_version "python/pyproject.toml"

# Update Cargo.toml if it exists
if [ -f "src-tauri/Cargo.toml" ]; then
    echo "📝 Updating src-tauri/Cargo.toml..."
    sed -i.bak "s/^version = \"[^\"]*\"/version = \"$VERSION\"/" "src-tauri/Cargo.toml"
    rm -f "src-tauri/Cargo.toml.bak"
    echo "✅ Updated src-tauri/Cargo.toml"
fi

# Update README.md version badges if they exist
if [ -f "README.md" ] && grep -q "version-.*-blue" "README.md"; then
    echo "📝 Updating version badges in README.md..."
    sed -i.bak "s/version-[^-]*-blue/version-$VERSION-blue/g" "README.md"
    rm -f "README.md.bak"
    echo "✅ Updated README.md version badges"
fi

# Verify all updates
echo ""
echo "🔍 Verification:"
echo "  package.json: $(grep '"version"' package.json | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')"
echo "  tauri.conf.json: $(grep '"version"' src-tauri/tauri.conf.json | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')"
echo "  pyproject.toml: $(grep '^version =' python/pyproject.toml | sed 's/version = "\([^"]*\)"/\1/')"

if [ -f "src-tauri/Cargo.toml" ]; then
    echo "  Cargo.toml: $(grep '^version =' src-tauri/Cargo.toml | sed 's/version = "\([^"]*\)"/\1/')"
fi

echo ""
echo "✅ Version update complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Update CHANGELOG.md with new version and changes"
echo "  3. Test the application: pnpm run tauri dev"
echo "  4. Commit changes: git add . && git commit -m 'chore: bump version to v$VERSION'"
echo "  5. Create tag: git tag v$VERSION"
echo "  6. Build release: ./scripts/build-all-platforms.sh"
