# Publishing and Distribution

Guide for publishing GitInspectorGUI packages to PyPI and TestPyPI.

## Overview

GitInspectorGUI can be published as a Python package to PyPI for distribution. This guide covers the publishing workflow, including testing via TestPyPI before production release.

## Prerequisites

- **uv** package manager installed
- **PyPI account** with API token
- **TestPyPI account** with API token (for testing)
- **Package built** and ready for distribution

## Building the Package

Before publishing, build the package:

```bash
# Build Python package
uv build
```

This creates distribution files in the `dist/` directory.

## Testing with TestPyPI

Before publishing to PyPI, test the publishing process and package installation via TestPyPI.

### Publish to TestPyPI

```bash
uv publish --index testpypi --username __token__ --password AUTHENTICATION-TOKEN
```

**Notes**:
- `__token__` should be entered literally as `__token__`
- `AUTHENTICATION-TOKEN` should be replaced with your TestPyPI API token

### Install from TestPyPI

When installing from TestPyPI, dependencies should still come from PyPI. Use this command instead of the basic TestPyPI install command:

```bash
pip install --pre --index-url https://test.pypi.org/simple/ \
    --extra-index-url https://pypi.org/simple/ gitinspectorgui
```

**Flags explained**:
- `--pre`: Required because TestPyPI versions are pre-releases
- `--index-url`: Primary index (TestPyPI for the package)
- `--extra-index-url`: Secondary index (PyPI for dependencies)

### Install Specific Version

For release candidates or specific versions:

```bash
pip install --pre --index-url https://test.pypi.org/simple/ \
    --extra-index-url https://pypi.org/simple/ gitinspectorgui==0.4.0rc7
```

## Publishing to PyPI

Once testing is complete, publish to production PyPI:

```bash
uv publish --username __token__ --password PRODUCTION-API-TOKEN
```

## Best Practices

### Version Management
- Use semantic versioning (e.g., 1.2.3)
- Test release candidates on TestPyPI first
- Tag releases in version control

### Security
- Use API tokens instead of passwords
- Store tokens securely (environment variables, CI secrets)
- Rotate tokens periodically

### Testing
- Always test installation from TestPyPI first
- Verify all dependencies resolve correctly
- Test in clean virtual environments

## Troubleshooting

### Upload Errors
```bash
# Check package metadata
uv build --check

# Verify package contents
tar -tzf dist/gitinspectorgui-*.tar.gz
```

### Dependency Issues
```bash
# Test dependency resolution
pip install --dry-run --index-url https://test.pypi.org/simple/ \
    --extra-index-url https://pypi.org/simple/ gitinspectorgui
```

### Token Authentication
- Ensure token has correct permissions
- Check token hasn't expired
- Verify correct index (TestPyPI vs PyPI tokens are different)

## Related Documentation

- **[Build Process](build-process.md)** - Complete build documentation
- **[Development Workflow](development-workflow.md)** - General development patterns
- **[Package Management](package-management.md)** - Dependency management
