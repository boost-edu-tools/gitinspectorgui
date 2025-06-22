# GitInspectorGUI Build & Release Scripts

This directory contains automation scripts for building, testing, and releasing GitInspectorGUI (a Tauri desktop app with FastAPI backend) across multiple platforms.

## Scripts Overview

| Script                                             | Purpose                                 | Usage                                        |
| -------------------------------------------------- | --------------------------------------- | -------------------------------------------- |
| [`build-all-platforms.sh`](build-all-platforms.sh) | Cross-platform build automation         | `./scripts/build-all-platforms.sh [options]` |
| [`prepare-release.sh`](prepare-release.sh)         | Version update and release preparation  | `./scripts/prepare-release.sh <version>`     |
| [`test-release.sh`](test-release.sh)               | Release artifact testing and validation | `./scripts/test-release.sh`                  |
| [`update-version.sh`](update-version.sh)           | Version synchronization across files    | `./scripts/update-version.sh <version>`      |
| [`dev-mode.sh`](dev-mode.sh)                       | Development environment startup         | `./scripts/dev-mode.sh`                      |
| [`setup-dev.sh`](setup-dev.sh)                     | Development environment setup           | `./scripts/setup-dev.sh`                     |

## Quick Release Workflow

For a complete release from development to distribution:

```bash
# 1. Prepare release (updates versions, prompts for changelog)
./scripts/prepare-release.sh 1.2.0

# 2. Build all platform artifacts
./scripts/build-all-platforms.sh --all

# 3. Test release artifacts
./scripts/test-release.sh

# 4. Create and publish release
git add . && git commit -m "chore: bump version to v1.2.0"
git tag v1.2.0 && git push origin v1.2.0
glab release create v1.2.0 --name "GitInspectorGUI v1.2.0" --notes-file CHANGELOG.md dist/releases/*
```

## Detailed Script Documentation

### build-all-platforms.sh

Cross-platform build script with support for multiple configurations and targets.

**Options:**

-   `--all` - Build for all supported platforms (requires platform-specific setup)
-   `--current` - Build for current platform only (default)
-   `--config <config>` - Use specific configuration (production|development)
-   `--clean` - Clean build cache before building
-   `--verbose` - Enable verbose output
-   `--help` - Show help message

**Examples:**

```bash
# Build for current platform (default)
./scripts/build-all-platforms.sh

# Build for all platforms with clean cache
./scripts/build-all-platforms.sh --all --clean

# Development build with verbose output
./scripts/build-all-platforms.sh --config development --verbose
```

**Output:**

-   Desktop applications: `dist/releases/`
-   Python wheel: `dist/releases/*.whl`
-   Checksums: `dist/releases/checksums.sha256`

### prepare-release.sh

Comprehensive release preparation script that handles version updates and validation.

**Features:**

-   Updates version in all project files (`package.json`, `tauri.conf.json`, `pyproject.toml`)
-   Creates backups of original files
-   Validates semantic versioning format
-   Prompts for CHANGELOG.md updates
-   Runs basic validation tests
-   Provides clear next steps

**Usage:**

```bash
./scripts/prepare-release.sh 1.2.0
./scripts/prepare-release.sh 2.0.0-beta.1
```

**Files Updated:**

-   `package.json`
-   `src-tauri/tauri.conf.json`
-   `src-tauri/tauri.conf.dev.json` (if exists)
-   `python/pyproject.toml`
-   `src-tauri/Cargo.toml` (if exists)
-   `README.md` version badges (if exists)

### test-release.sh

Validates release artifacts for integrity and basic functionality.

**Tests Performed:**

-   File existence and size validation
-   Checksum verification
-   Platform-specific artifact testing
-   Basic functionality tests (where possible)
-   Installation package validation

**Platform-Specific Tests:**

-   **macOS**: DMG mounting, app bundle structure
-   **Linux**: AppImage permissions, DEB package validation
-   **Windows**: Installer integrity

**Usage:**

```bash
# Test artifacts in dist/releases/
./scripts/test-release.sh
```

### update-version.sh

Standalone version update utility for synchronizing versions across all project files.

**Features:**

-   Safe JSON manipulation using `jq` (with sed fallback)
-   TOML file updates for Python configuration
-   Semantic versioning validation
-   Verification of all updates
-   Support for pre-release versions

**Usage:**

```bash
./scripts/update-version.sh 1.2.0
./scripts/update-version.sh 2.0.0-alpha.1
```

## Platform-Specific Considerations

### macOS

-   Requires Xcode Command Line Tools
-   Code signing requires Apple Developer account
-   Universal binaries supported (Intel + Apple Silicon)

### Windows

-   Requires Visual Studio Build Tools
-   MSI and NSIS installers generated
-   Code signing requires valid certificate

### Linux

-   Generates DEB, AppImage, and RPM packages
-   AppImages are made executable automatically
-   Cross-compilation support for ARM64

## CI/CD Integration

These scripts are designed to work with GitLab CI/CD:

```yaml
# Example .gitlab-ci.yml usage
build:
    script:
        - ./scripts/build-all-platforms.sh --current
        - ./scripts/test-release.sh
    artifacts:
        paths:
            - dist/releases/
```

## Development Integration

Scripts work seamlessly with [Development Mode](../docs/development/development-mode.md):

```bash
# Development workflow
./scripts/dev-mode.sh                    # Start development
./scripts/build-all-platforms.sh --config development  # Test build
./scripts/prepare-release.sh 1.2.0      # Prepare release
```

## Troubleshooting

### Common Issues

**Permission Denied:**

```bash
chmod +x scripts/*.sh
```

**Missing Dependencies:**

```bash
# Install required tools
brew install jq          # macOS
apt-get install jq       # Ubuntu/Debian
```

**Build Failures:**

```bash
# Clean and retry
./scripts/build-all-platforms.sh --clean --verbose
```

**Cross-Platform Builds:**

-   Cross-compilation requires platform-specific setup
-   Use CI/CD or platform-specific machines for complete builds
-   Consider using GitHub Actions or GitLab CI for multi-platform builds

### Getting Help

1. Check script help: `./scripts/<script-name>.sh --help`
2. Review [Troubleshooting Guide](../docs/development/troubleshooting.md)
3. Check [Deployment Documentation](../docs/operations/deployment.md)

## Contributing

When modifying scripts:

1. Maintain backward compatibility
2. Add appropriate error handling
3. Update this documentation
4. Test on multiple platforms
5. Follow the existing code style

## Related Documentation

-   [Deployment Guide](../docs/operations/deployment.md) - Complete deployment process
-   [Development Mode](../docs/development/development-mode.md) - Development workflow
-   [Environment Setup](../docs/development/environment-setup.md) - Initial setup
