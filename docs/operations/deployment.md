# Release & Distribution Guide

## Overview

GitInspectorGUI is a Tauri-based desktop application with embedded Python analysis engine via PyO3 that gets distributed as platform-specific installers and packages. This guide covers the complete release process from development to distribution, including build automation, testing, and deployment strategies.

## Table of Contents

1. [Quick Release Guide](#quick-release-guide)
2. [Build Process](#build-process)
3. [Release Artifacts](#release-artifacts)
4. [Distribution Platforms](#distribution-platforms)
5. [Auto-Updates](#auto-updates)
6. [Release Workflow](#release-workflow)
7. [Version Management](#version-management)
8. [Testing & Quality Assurance](#testing-quality-assurance)
9. [CI/CD Integration](#cicd-integration)
10. [Development to Production](#development-to-production)

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

-   **Python** 3.13+ with uv for package management
-   **Node.js** 22+ with pnpm
-   **Rust** 1.85+ with Cargo
-   **Platform-specific tools**:
    -   Windows: Visual Studio Build Tools
    -   macOS: Xcode Command Line Tools
    -   Linux: Standard build tools (gcc, pkg-config)

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

-   **Windows**: Requires Windows machine or Windows VM
-   **macOS**: Requires macOS machine (code signing requires Apple Developer account)
-   **Linux**: Can be built on any Linux distribution

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

### 1. GitLab Releases (Primary)

**Advantages:**

-   Integrated with GitLab CI/CD
-   Free hosting for open source projects
-   Automatic update detection
-   Version history and release notes
-   Package registry integration

**Setup:**

```bash
# Create release with GitLab CLI
glab release create v1.0.0 \
  --name "GitInspectorGUI v1.0.0" \
  --notes "Release notes here" \
  dist/releases/*

# Or using GitLab API
curl --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
     --data name="v1.0.0" \
     --data tag_name="v1.0.0" \
     --data description="Release notes" \
     "https://gitlab.com/api/v4/projects/$PROJECT_ID/releases"
```

### 2. GitHub Releases (Alternative)

**Advantages:**

-   Free hosting
-   Automatic update detection
-   Version history
-   Release notes

**Setup:**

```bash
# Create release with GitHub CLI (if mirroring to GitHub)
gh release create v1.0.0 \
  --title "GitInspectorGUI v1.0.0" \
  --notes "Release notes here" \
  dist/releases/*
```

### 3. Platform-Specific Stores

#### Windows

-   **Microsoft Store**: Requires MSIX packaging
-   **Chocolatey**: Community package manager
-   **Winget**: Windows Package Manager

#### macOS

-   **Mac App Store**: Requires Apple Developer account
-   **Homebrew**: Community package manager
    ```bash
    # Example Homebrew formula
    brew install --cask gitinspectorgui
    ```

#### Linux

-   **Snap Store**: Universal Linux packages
-   **Flathub**: Flatpak distribution
-   **Distribution repositories**: Debian, Ubuntu, Fedora, etc.

### 4. Direct Download

Host installers on your own website with download links:

```html
<a href="https://releases.example.com/gitinspectorgui-1.0.0-x64.msi">
    Download for Windows
</a>
```

---

## Auto-Updates

### Tauri Updater Configuration

Configure in `src-tauri/tauri.conf.json`:

```json
{
    "tauri": {
        "updater": {
            "active": true,
            "endpoints": [
                "https://gitlab.com/your-username/gitinspectorgui/-/releases/{{current_version}}/downloads/{{target}}"
            ],
            "dialog": true,
            "pubkey": "YOUR_PUBLIC_KEY_HERE"
        }
    }
}
```

**Development vs Production Configuration:**

```bash
# Use different configs for different environments
pnpm run tauri build --config src-tauri/tauri.conf.json          # Production
pnpm run tauri build --config src-tauri/tauri.conf.dev.json     # Development
```

### Update Server Response

Your update endpoint should return:

```json
{
    "version": "1.0.1",
    "notes": "Bug fixes and improvements",
    "pub_date": "2024-01-15T12:00:00Z",
    "platforms": {
        "windows-x86_64": {
            "signature": "signature_here",
            "url": "https://releases.example.com/gitinspectorgui-1.0.1-x64.msi"
        },
        "darwin-x86_64": {
            "signature": "signature_here",
            "url": "https://releases.example.com/gitinspectorgui-1.0.1-x64.dmg"
        }
    }
}
```

### Update Signing

Generate signing keys:

```bash
# Generate private key (keep secure!)
tauri signer generate -w ~/.tauri/myapp.key

# Get public key for tauri.conf.json
tauri signer sign -k ~/.tauri/myapp.key --password mypassword
```

---

## Release Workflow

### 1. Pre-Release Checklist

**Version Updates:**

-   [ ] Update version in `package.json`
-   [ ] Update version in `src-tauri/tauri.conf.json`
-   [ ] Update version in `python/pyproject.toml`
-   [ ] Update `CHANGELOG.md` with new features and fixes

**Quality Assurance:**

-   [ ] Run full test suite: `python -m pytest && pnpm test`
-   [ ] Test with [Development Commands](../development/development-commands.md)
-   [ ] Test on all target platforms
-   [ ] Verify Python API sidecar builds correctly
-   [ ] Test auto-updater functionality (if enabled)

**Documentation:**

-   [ ] Update API documentation if endpoints changed
-   [ ] Update user guides if UI changed
-   [ ] Verify [Installation Guide](../getting-started/02-installation.md) is current

### 2. Automated Release Pipeline

Example GitLab CI workflow (`.gitlab-ci.yml`):

```yaml
stages:
    - test
    - build
    - release

variables:
    PYTHON_VERSION: "3.13"
    NODE_VERSION: "22"
    RUST_VERSION: "1.85"

# Test stage
test:
    stage: test
    image: python:$PYTHON_VERSION
    before_script:
        - curl -fsSL https://get.pnpm.io/install.sh | sh -
        - source ~/.bashrc
        - curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        - source ~/.cargo/env
    script:
        - uv sync
        - pnpm install
        - python -m pytest
        - pnpm test
    only:
        - tags

# Build stage
build:
    stage: build
    parallel:
        matrix:
            - PLATFORM: [ubuntu-latest, windows-latest, macos-latest]
    script:
        - ./scripts/build-all-platforms.sh --current
        - ./scripts/test-release.sh
    artifacts:
        paths:
            - dist/releases/
        expire_in: 1 week
    only:
        - tags

# Release stage
release:
    stage: release
    image: registry.gitlab.com/gitlab-org/release-cli:latest
    script:
        - glab release create $CI_COMMIT_TAG --name "GitInspectorGUI $CI_COMMIT_TAG" --notes-file CHANGELOG.md dist/releases/*
    only:
        - tags
```

**Alternative GitHub Actions** (if mirroring to GitHub):

```yaml
name: Release
on:
    push:
        tags: ["v*"]

jobs:
    build:
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

# 5. Create GitLab release
glab release create v1.0.0 \
  --name "GitInspectorGUI v1.0.0" \
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

### Semantic Versioning

Follow [SemVer](https://semver.org/):

-   **MAJOR**: Breaking changes
-   **MINOR**: New features (backward compatible)
-   **PATCH**: Bug fixes

### Version Synchronization

Keep versions synchronized across:

-   `package.json` - Frontend version
-   `src-tauri/tauri.conf.json` - App version
-   `python/pyproject.toml` - Python CLI version

### Pre-Release Versions

Use pre-release tags for testing:

-   `1.0.0-alpha.1` - Alpha releases
-   `1.0.0-beta.1` - Beta releases
-   `1.0.0-rc.1` - Release candidates

---

## Testing & Quality Assurance

### Pre-Release Testing

1. **Functional Testing**

    - Test core git analysis features
    - Verify UI responsiveness
    - Test file operations

2. **Platform Testing**

    - Install and run on each target platform
    - Test platform-specific features
    - Verify installer behavior

3. **Performance Testing**
    - Large repository analysis
    - Memory usage monitoring
    - Startup time measurement

### Beta Testing Program

1. **Internal Testing**

    - Development team validation
    - Automated test suite
    - Performance benchmarks

2. **External Beta**
    - Limited user group
    - Feedback collection
    - Issue tracking

### Release Validation

```bash
# Verify signatures
tauri signer verify -k public.key -s signature.sig app.exe

# Test installation
# Windows: Run .msi installer
# macOS: Mount .dmg and test .app
# Linux: Install .deb or run .AppImage

# Verify auto-updater
# Check update detection and download
```

---

## CI/CD Integration

### GitLab CI/CD Setup

The project uses GitLab CI/CD for automated testing and deployment. Key features:

**Pipeline Stages:**

1. **Test**: Run Python and frontend tests
2. **Build**: Create platform-specific builds
3. **Release**: Publish to GitLab releases
4. **Deploy**: Update documentation

**Configuration Files:**

-   `.gitlab-ci.yml` - Main CI/CD pipeline
-   `scripts/switch-ci.sh` - Switch between CI providers

**Environment Variables:**

```bash
# Required in GitLab CI/CD settings
GITLAB_TOKEN=your_gitlab_token
TAURI_PRIVATE_KEY=your_signing_key
TAURI_KEY_PASSWORD=your_key_password
```

### Documentation Deployment

Automated documentation deployment to GitLab Pages:

```yaml
# In .gitlab-ci.yml
pages:
    stage: deploy
    script:
        - mkdocs build
        - mv site public
    artifacts:
        paths:
            - public
    only:
        - main
```

See [Documentation Deployment Guide](documentation-deployment.md) for details.

---

## Development to Production

### From Development Mode to Release

1. **Development Phase**:

    - Use [Development Commands](../development/development-commands.md) for rapid iteration
    - Follow [Environment Setup](../development/environment-setup.md)

2. **Pre-Release Testing**:

    ```bash
    # Test production build locally
    pnpm run tauri build
    ./src-tauri/target/release/gitinspectorgui

    # Test Python API sidecar
    cd python && ./test-api-sidecar.sh
    ```

3. **Release Preparation**:

    - Update versions across all files
    - Update documentation
    - Create comprehensive changelog

4. **Release Execution**:

    - Use automated CI/CD pipeline
    - Monitor build status
    - Test release artifacts

5. **Post-Release**:
    - Monitor user feedback
    - Track download statistics
    - Plan next iteration

## Distribution Best Practices

### Security

-   **Code Signing**: Sign all executables with valid certificates
-   **Checksums**: Provide SHA256 hashes for verification
-   **HTTPS**: Use secure download links
-   **Vulnerability Scanning**: Regular security audits

### User Experience

-   **Clear Installation Instructions**: Platform-specific guides
-   **Uninstall Support**: Proper cleanup procedures
-   **Error Handling**: Graceful failure modes
-   **Documentation**: User guides and troubleshooting

### Monitoring

-   **Download Analytics**: Track adoption rates
-   **Crash Reporting**: Automated error collection
-   **User Feedback**: Support channels and issue tracking
-   **Update Success Rates**: Monitor auto-update effectiveness

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

### Release Validation

**Before Publishing:**

1. Test installation on clean systems
2. Verify auto-updater functionality
3. Check all download links work
4. Validate checksums match
5. Test uninstallation process

**After Publishing:**

1. Monitor download statistics
2. Check for user-reported issues
3. Verify auto-updater detects new version
4. Update documentation if needed

---

## Next Steps

After successful deployment:

1. **Monitor Release**: Track downloads and user feedback
2. **Plan Updates**: Use [Version Management](#version-management) for future releases
3. **Improve Process**: Refine CI/CD pipeline based on experience
4. **Documentation**: Keep [Installation Guide](../getting-started/02-installation.md) updated

This distribution model aligns with GitInspectorGUI's desktop application architecture, modern CI/CD practices, and provides users with familiar installation experiences on each platform while supporting the project's AI-assisted development workflow.
