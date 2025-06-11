#!/bin/bash

# GitInspectorGUI Release Testing Script
# Tests release artifacts for integrity and basic functionality

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RELEASES_DIR="$PROJECT_ROOT/dist/releases"

echo "🧪 Testing GitInspectorGUI release artifacts..."

# Check if releases directory exists
if [ ! -d "$RELEASES_DIR" ]; then
    echo "❌ Error: Releases directory not found at $RELEASES_DIR"
    echo "   Run ./scripts/build-all-platforms.sh first"
    exit 1
fi

cd "$RELEASES_DIR"

# Function to check if file exists and is not empty
check_file() {
    local file="$1"
    local description="$2"

    if [ -f "$file" ]; then
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
        if [ "$size" -gt 0 ]; then
            echo "✅ $description: $file ($(numfmt --to=iec $size 2>/dev/null || echo "${size} bytes"))"
            return 0
        else
            echo "❌ $description: $file (empty file)"
            return 1
        fi
    else
        echo "❌ $description: $file (not found)"
        return 1
    fi
}

# Function to verify checksums
verify_checksums() {
    if [ -f "checksums.sha256" ]; then
        echo "🔍 Verifying checksums..."
        if sha256sum -c checksums.sha256 --quiet 2>/dev/null; then
            echo "✅ All checksums verified"
            return 0
        elif shasum -a 256 -c checksums.sha256 --quiet 2>/dev/null; then
            echo "✅ All checksums verified (using shasum)"
            return 0
        else
            echo "❌ Checksum verification failed"
            return 1
        fi
    else
        echo "⚠️  No checksums.sha256 file found"
        return 1
    fi
}

# Function to test platform-specific artifacts
test_platform_artifacts() {
    local platform=$(uname -s)
    local arch=$(uname -m)

    echo "🖥️  Testing artifacts for current platform: $platform ($arch)"

    case "$platform" in
        Darwin)
            # macOS artifacts
            check_file "*.dmg" "macOS DMG installer" || true
            check_file "*.app.tar.gz" "macOS App bundle" || true

            # Test DMG mounting (if available)
            local dmg_file=$(ls *.dmg 2>/dev/null | head -1)
            if [ -n "$dmg_file" ] && command -v hdiutil >/dev/null 2>&1; then
                echo "🔍 Testing DMG mounting..."
                if hdiutil attach "$dmg_file" -readonly -nobrowse -quiet; then
                    echo "✅ DMG mounts successfully"
                    # Find the mount point and unmount
                    local mount_point=$(hdiutil info | grep "$dmg_file" | awk '{print $1}')
                    if [ -n "$mount_point" ]; then
                        hdiutil detach "$mount_point" -quiet
                    fi
                else
                    echo "❌ DMG mounting failed"
                fi
            fi
            ;;

        Linux)
            # Linux artifacts
            check_file "*.deb" "Debian package" || true
            check_file "*.AppImage" "AppImage" || true
            check_file "*.rpm" "RPM package" || true

            # Test AppImage permissions
            local appimage_file=$(ls *.AppImage 2>/dev/null | head -1)
            if [ -n "$appimage_file" ]; then
                if [ -x "$appimage_file" ]; then
                    echo "✅ AppImage is executable"
                else
                    echo "⚠️  AppImage is not executable, fixing..."
                    chmod +x "$appimage_file"
                fi
            fi

            # Test DEB package (if dpkg available)
            local deb_file=$(ls *.deb 2>/dev/null | head -1)
            if [ -n "$deb_file" ] && command -v dpkg >/dev/null 2>&1; then
                echo "🔍 Testing DEB package structure..."
                if dpkg --info "$deb_file" >/dev/null 2>&1; then
                    echo "✅ DEB package structure is valid"
                else
                    echo "❌ DEB package structure is invalid"
                fi
            fi
            ;;

        MINGW*|CYGWIN*|MSYS*)
            # Windows artifacts
            check_file "*.msi" "Windows MSI installer" || true
            check_file "*.exe" "Windows NSIS installer" || true
            ;;

        *)
            echo "⚠️  Unknown platform: $platform"
            ;;
    esac
}

# Function to check artifact sizes
check_artifact_sizes() {
    echo "📏 Checking artifact sizes..."

    local total_size=0
    local file_count=0

    for file in *; do
        if [ -f "$file" ] && [ "$file" != "checksums.sha256" ]; then
            local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
            local human_size=$(numfmt --to=iec $size 2>/dev/null || echo "${size} bytes")
            echo "  $file: $human_size"
            total_size=$((total_size + size))
            file_count=$((file_count + 1))
        fi
    done

    if [ $file_count -gt 0 ]; then
        local total_human=$(numfmt --to=iec $total_size 2>/dev/null || echo "${total_size} bytes")
        echo "📊 Total: $file_count files, $total_human"

        # Warn if total size is unusually large (>500MB) or small (<10MB)
        if [ $total_size -gt 524288000 ]; then
            echo "⚠️  Warning: Total size is quite large (>500MB)"
        elif [ $total_size -lt 10485760 ]; then
            echo "⚠️  Warning: Total size seems small (<10MB)"
        fi
    fi
}

# Function to test basic functionality (if possible)
test_basic_functionality() {
    echo "🔧 Testing basic functionality..."

    # Try to extract version information from artifacts
    local platform=$(uname -s)

    case "$platform" in
        Linux)
            local appimage_file=$(ls *.AppImage 2>/dev/null | head -1)
            if [ -n "$appimage_file" ] && [ -x "$appimage_file" ]; then
                echo "🔍 Testing AppImage version..."
                if timeout 10s "./$appimage_file" --version 2>/dev/null; then
                    echo "✅ AppImage responds to --version"
                else
                    echo "⚠️  AppImage doesn't respond to --version (may be normal for GUI apps)"
                fi
            fi
            ;;
        Darwin)
            # For macOS, we could test the app bundle structure
            local app_bundle=$(ls *.app.tar.gz 2>/dev/null | head -1)
            if [ -n "$app_bundle" ]; then
                echo "🔍 Testing app bundle structure..."
                if tar -tzf "$app_bundle" | grep -q "Contents/MacOS/" 2>/dev/null; then
                    echo "✅ App bundle structure looks correct"
                else
                    echo "❌ App bundle structure seems incorrect"
                fi
            fi
            ;;
    esac
}

# Main testing sequence
echo "📁 Release directory: $RELEASES_DIR"
echo "📋 Available files:"
ls -la

echo ""
echo "🔍 Starting release artifact tests..."
echo ""

# Test 1: Verify checksums
verify_checksums
echo ""

# Test 2: Check platform-specific artifacts
test_platform_artifacts
echo ""

# Test 3: Check artifact sizes
check_artifact_sizes
echo ""

# Test 4: Test basic functionality
test_basic_functionality
echo ""

# Summary
echo "📊 Test Summary:"
echo "✅ Release artifacts tested"
echo "📁 Location: $RELEASES_DIR"

# Check if all expected files are present
expected_files=0
found_files=0

# Count expected files based on platform
case "$(uname -s)" in
    Darwin)
        if ls *.dmg >/dev/null 2>&1; then found_files=$((found_files + 1)); fi
        expected_files=$((expected_files + 1))
        ;;
    Linux)
        if ls *.AppImage >/dev/null 2>&1; then found_files=$((found_files + 1)); fi
        if ls *.deb >/dev/null 2>&1; then found_files=$((found_files + 1)); fi
        expected_files=$((expected_files + 2))
        ;;
    MINGW*|CYGWIN*|MSYS*)
        if ls *.msi >/dev/null 2>&1; then found_files=$((found_files + 1)); fi
        if ls *.exe >/dev/null 2>&1; then found_files=$((found_files + 1)); fi
        expected_files=$((expected_files + 2))
        ;;
esac

if [ $found_files -eq $expected_files ] && [ $expected_files -gt 0 ]; then
    echo "✅ All expected artifacts found for current platform"
elif [ $expected_files -gt 0 ]; then
    echo "⚠️  Found $found_files of $expected_files expected artifacts"
else
    echo "ℹ️  Platform-specific validation not available"
fi

echo ""
echo "🎉 Release testing complete!"
echo ""
echo "Next steps:"
echo "  1. Test installation on clean systems"
echo "  2. Verify application launches and basic functionality"
echo "  3. Create release: glab release create vX.Y.Z --name 'GitInspectorGUI vX.Y.Z' dist/releases/*"
