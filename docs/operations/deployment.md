# Release & Distribution Guide

## Overview

GitInspectorGUI is a Tauri-based desktop application with embedded Python analysis engine via PyO3 that gets distributed as platform-specific installers and packages. This guide covers the complete release process from development to distribution, including build automation, testing, and deployment strategies.

## Table of Contents

1. [Quick Release Guide](#quick-release-guide)
2. [Build Process](#build-process)
3. [Release Artifacts](#release-artifacts)
4. [Distribution Platforms](#distribution-platforms)
5. [Release Workflow](#release-workflow)
6. [Version Management](#version-management)
7. [Testing & Quality Assurance](#testing-quality-assurance)
8. [CI/CD Integration](#cicd-integration)
9. [Development to Production](#development-to-production)

---

## Quick Release Guide

For experienced developers who need a fast release:

```bash
# 1. Update versions and changelog
./scripts/update-version.sh 1.2.0

# 2. Build all platforms
./scripts/build-all-platforms.sh

# 3. Test release artifacts
./scripts/test-release.sh

# 4. Create and publish release
gh release create v1.2.0 \
  --title "GitInspectorGUI v1.2.0" \
  --notes-file CHANGELOG.md \
  --verify-tag \
  dist/releases/*
```

**⚠️ Prerequisites**: Ensure you have completed the [Environment Setup](../development/environment-setup.md) and tested with [Development Commands](../development/development-commands.md).

---

## Build Process

### Prerequisites

- **Python** 3.13+ with uv for package management
- **Node.js** 22+ with pnpm
- **Rust** 1.85+ with Cargo
- **Platform-specific tools**:
  - Windows: Visual Studio Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: Standard build tools (gcc, pkg-config)

### Cross-Platform Build

Use the automated build script for cross-platform builds:

```bash
# Build for current platform only
./scripts/build-all-platforms.sh --current

# Build for all supported platforms (requires platform-specific setup)
./scripts/build-all-platforms.sh --all

# Build with specific configuration
./scripts/build-all-platforms.sh --config production

# Artifacts will be in dist/releases/
ls dist/releases/
```

**Platform Requirements:**

- **Windows**: Requires Windows machine or Windows VM
- **macOS**: Requires macOS machine (code signing requires Apple Developer account)
- **Linux**: Can be built on any Linux distribution

### Manual Build Commands

For development and testing builds:

```bash
# 1. Install dependencies
pnpm install
uv sync

# 2. Build frontend assets
pnpm run build

# 3. Build Python analysis engine
cd python && uv build

# 4. Build Tauri application
pnpm run tauri build

# 5. Verify build artifacts
ls src-tauri/target/release/bundle/
ls python/dist/  # Python wheel
```

### Development Build

For faster iteration during development:

```bash
# Development build (faster, includes debug symbols)
pnpm run tauri build --debug

# Test the development build
./src-tauri/target/debug/gitinspectorgui
```

---

## Release Artifacts

### Desktop Applications

| Platform    | Format      | Description                 |
| ----------- | ----------- | --------------------------- |
| **Windows** | `.msi`      | Windows Installer package   |
| **Windows** | `.exe`      | NSIS installer executable   |
| **macOS**   | `.dmg`      | Disk image for distribution |
| **macOS**   | `.app`      | Application bundle          |
| **Linux**   | `.deb`      | Debian package              |
| **Linux**   | `.AppImage` | Portable application        |

### Checksums

All release artifacts include SHA256 checksums in `checksums.sha256`.

---

## Distribution Platforms

### 1. GitHub Releases (Primary)

**Setup:**

```bash
# Create release with GitHub CLI
gh release create v1.0.0 \
  --title "GitInspectorGUI v1.0.0" \
  --notes "Release notes here" \
  dist/releases/*

# Or using GitHub API
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/owner/repo/releases \
  -d '{
    "tag_name": "v1.0.0",
    "name": "GitInspectorGUI v1.0.0",
    "body": "Release notes here"
  }'
```

### 2. Platform-Specific Stores

#### Windows

- **Microsoft Store**: Requires MSIX packaging
- **Chocolatey**: Community package manager
- **Winget**: Windows Package Manager

#### macOS

- **Mac App Store**: Requires Apple Developer account
- **Homebrew**: Community package manager
  ```bash
  # Example Homebrew formula
  brew install --cask gitinspectorgui
  ```

#### Linux

- **Snap Store**: Universal Linux packages
- **Flathub**: Flatpak distribution
- **Distribution repositories**: Debian, Ubuntu, Fedora, etc.

### 4. Direct Download

Host installers on your own website with download links:

```html
<a href="https://releases.example.com/gitinspectorgui-1.0.0-x64.msi">
  Download for Windows
</a>
```

---

---

## Release Workflow

### 1. Pre-Release Checklist

**Version Updates:**

- [ ] Update version in `package.json`
- [ ] Update version in `src-tauri/tauri.conf.json`
- [ ] Update version in `python/pyproject.toml`
- [ ] Update `CHANGELOG.md` with new features and fixes

**Quality Assurance:**

- [ ] Run full test suite: `python -m pytest && pnpm test`
- [ ] Test with [Development Commands](../development/development-commands.md)
- [ ] Test on all target platforms
- [ ] Verify Python API sidecar builds correctly
- [ ] Test auto-updater functionality (if enabled)

**Documentation:**

- [ ] Update API documentation if endpoints changed
- [ ] Update user guides if UI changed
- [ ] Verify [Installation Guide](../getting-started/02-installation.md) is current

### 2. Automated Release Pipeline

GitHub Actions workflow (`.github/workflows/release.yml`):

```yaml
name: Release
on:
  push:
    tags: ["v*"]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.13"

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Install dependencies
        run: |
          uv sync
          pnpm install

      - name: Run tests
        run: |
          python -m pytest
          pnpm test

  build:
    needs: test
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.13"

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Install dependencies
        run: |
          uv sync
          pnpm install

      - name: Build app
        run: pnpm run tauri build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.platform }}-build
          path: src-tauri/target/release/bundle/

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v4

      - name: Create release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            *-build/**/*
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Manual Release Steps

```bash
# 1. Prepare the release
./scripts/prepare-release.sh v1.0.0

# 2. Tag the release
git tag v1.0.0
git push origin v1.0.0

# 3. Build all platforms
./scripts/build-all-platforms.sh --all

# 4. Test release artifacts
./scripts/test-release.sh

# 5. Create GitHub release
gh release create v1.0.0 \
  --title "GitInspectorGUI v1.0.0" \
  --notes-file CHANGELOG.md \
  dist/releases/*

# 6. Update documentation deployment
mkdocs gh-deploy  # If using GitHub Pages for docs

# 7. Announce release
# - Update project README
# - Post to relevant communities
# - Update package managers (if applicable)
```

### 4. Release Scripts

Create these helper scripts in `scripts/`:

**`scripts/prepare-release.sh`**:

```bash
#!/bin/bash
VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Update version in all files
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" src-tauri/tauri.conf.json
sed -i "s/version = \".*\"/version = \"$VERSION\"/" python/pyproject.toml

echo "Updated version to $VERSION in all files"
echo "Please update CHANGELOG.md manually"
```

**`scripts/test-release.sh`**:

```bash
#!/bin/bash
# Test release artifacts
echo "Testing release artifacts..."

# Verify checksums
cd dist/releases
sha256sum -c checksums.sha256

# Test installation (platform-specific)
case "$(uname -s)" in
    Darwin)
        echo "Testing macOS .dmg..."
        # Add macOS-specific tests
        ;;
    Linux)
        echo "Testing Linux packages..."
        # Add Linux-specific tests
        ;;
    MINGW*|CYGWIN*)
        echo "Testing Windows installer..."
        # Add Windows-specific tests
        ;;
esac

echo "Release artifacts tested successfully"
```

---

## Version Management

Keep versions synchronized across:

- `package.json` - Frontend version
- `src-tauri/tauri.conf.json` - App version
- `python/pyproject.toml` - Python CLI version

---

## CI/CD Integration

### GitHub Actions Setup

The project uses GitHub Actions for automated testing and deployment. Key features:

**Workflow Jobs:**

1. **Test**: Run Python and frontend tests
2. **Build**: Create platform-specific builds
3. **Release**: Publish to GitHub releases
4. **Deploy**: Update documentation

**Configuration Files:**

- `.github/workflows/release.yml` - Main release workflow
- `.github/workflows/test.yml` - Continuous integration testing
- `scripts/switch-ci.sh` - Switch between CI providers

**Environment Variables:**

```bash
# Required in GitHub repository secrets
GITHUB_TOKEN=automatically_provided_by_github
```

### Documentation Deployment

See [Documentation Deployment Guide](documentation-deployment.md) for complete setup and configuration details.

---

## Troubleshooting Releases

### Common Build Issues

**Python API Sidecar Build Fails:**

```bash
# Check Python environment
python --version
uv --version

# Rebuild sidecar
cd python
./build-api-sidecar.sh --clean
```

**Tauri Build Fails:**

```bash
# Update Rust toolchain
rustup update

# Clean build cache
cargo clean
rm -rf src-tauri/target

# Rebuild
pnpm run tauri build
```

**Code Signing Issues:**

```bash
# Verify signing certificate
security find-identity -v -p codesigning  # macOS
signtool.exe /list /s My                  # Windows

# Test signing
tauri signer sign --help
```
