# Release & Distribution Guide

## Overview

GitInspectorGUI is a Tauri-based desktop application that gets distributed as platform-specific installers and packages. This guide covers building releases, distribution strategies, and update mechanisms for desktop applications.

## Table of Contents

1. [Build Process](#build-process)
2. [Release Artifacts](#release-artifacts)
3. [Distribution Platforms](#distribution-platforms)
4. [Auto-Updates](#auto-updates)
5. [Release Workflow](#release-workflow)
6. [Version Management](#version-management)
7. [Testing & Quality Assurance](#testing-quality-assurance)

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

Use the automated build script:

```bash
# Build for current platform
./scripts/build-all-platforms.sh

# Artifacts will be in dist/releases/
ls dist/releases/
```

### Manual Build Commands

```bash
# Install dependencies
pnpm install
uv sync

# Build frontend
pnpm run build

# Build Tauri app
pnpm run tauri build

# Build Python CLI (optional)
cd python && uv build
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

### Python CLI

| Format | Description                                 |
| ------ | ------------------------------------------- |
| `.whl` | Python wheel for package installation       |
| Source | Available via `pip install gitinspectorgui` |

### Checksums

All release artifacts include SHA256 checksums in `checksums.sha256`.

---

## Distribution Platforms

### 1. GitHub Releases (Primary)

**Advantages:**

-   Free hosting
-   Automatic update detection
-   Version history
-   Release notes

**Setup:**

```bash
# Create release with GitHub CLI
gh release create v1.0.0 \
  --title "GitInspectorGUI v1.0.0" \
  --notes "Release notes here" \
  dist/releases/*
```

### 2. Platform-Specific Stores

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

### 3. Direct Download

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
                "https://releases.example.com/updates/{{target}}/{{current_version}}"
            ],
            "dialog": true,
            "pubkey": "YOUR_PUBLIC_KEY_HERE"
        }
    }
}
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

-   [ ] Update version in `package.json`
-   [ ] Update version in `src-tauri/tauri.conf.json`
-   [ ] Update version in `python/pyproject.toml`
-   [ ] Update `CHANGELOG.md`
-   [ ] Run full test suite
-   [ ] Test on all target platforms

### 2. Automated Release Pipeline

Example GitHub Actions workflow (`.github/workflows/release.yml`):

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

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: 18

            - name: Setup Rust
              uses: dtolnay/rust-toolchain@stable

            - name: Install dependencies
              run: pnpm install

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
# 1. Tag the release
git tag v1.0.0
git push origin v1.0.0

# 2. Build all platforms
./scripts/build-all-platforms.sh

# 3. Create GitHub release
gh release create v1.0.0 \
  --title "GitInspectorGUI v1.0.0" \
  --notes-file CHANGELOG.md \
  dist/releases/*

# 4. Update auto-updater endpoints
# Upload signed artifacts to your update server
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

This distribution model aligns with GitInspectorGUI's desktop application architecture and provides users with familiar installation experiences on each platform.
