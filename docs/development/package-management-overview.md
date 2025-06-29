# Package Management Overview

This guide provides an overview of package management in GitInspectorGUI and explains the approach to managing dependencies across the project.

## Related Guides

-   [Python Package Management](python-package-management.md) - Detailed guide for Python dependencies with uv
-   [JavaScript Package Management](javascript-package-management.md) - Detailed guide for JavaScript/TypeScript dependencies with pnpm

## Package Managers Used

GitInspectorGUI uses separate package managers for its backend and frontend components:

-   **Python backend**: Uses `uv` for fast Python package management and virtual environments
-   **JavaScript/TypeScript frontend**: Uses `pnpm` for efficient Node.js package management

These package managers have different approaches to dependency management:

-   **uv (Python)**: Focuses on speed and reproducibility while improving Python's virtual environment experience
-   **pnpm (JavaScript)**: Emphasizes disk space efficiency and automatic dependency isolation

## Package Management Philosophy: Python vs JavaScript

> **Note**: This section explains how Python and JavaScript package managers evolved in different directions. For practical commands, see the [Python Package Management](python-package-management.md) or [JavaScript Package Management](javascript-package-management.md) guides.

### Python: Manual Virtual Environment Management

Python's approach requires explicit environment management:

-   **Manual isolation**: Virtual environments must be created and activated manually
-   **Activation required**: Each project switch requires sourcing the virtual environment
-   **Explicit management**: Developers must remember to activate/deactivate environments

```bash
# Example of Python's manual environment management
cd data-processor
source .venv/bin/activate    # Manual step required
python analyze.py            # Now uses data-processor's dependencies

cd ../web-scraper
source .venv/bin/activate    # Manual step required again
python crawl.py              # Now uses web-scraper's dependencies
```

### JavaScript/Node.js: Automatic Project-Level Dependencies

JavaScript achieved seamless dependency isolation through its design philosophy:

-   **Automatic isolation**: Each project gets its own `node_modules` directory
-   **Zero configuration**: Dependencies are isolated per project by default
-   **Seamless switching**: Simply `cd` into any project and run commands normally
-   **No activation required**: Package resolution happens automatically

```bash
# Example of JavaScript's automatic dependency isolation
cd frontend-app
npm start             # Automatically uses frontend-app's dependencies

cd ../api-service
npm test              # Automatically uses api-service's dependencies
```

The JavaScript ecosystem prioritized convenience and rapid development, accepting the overhead of duplicated dependencies across projects in exchange for zero-friction isolation.

### Why the Difference?

??? info "Historical and technical background"

    #### Historical Evolution

    -   **JavaScript (2009)**: Built with npm from the start, designed for per-project dependency trees
    -   **Python (1991)**: Predates modern package management; virtual environments were retrofitted later

    #### Design Philosophy

    -   **JavaScript**: "Move fast" culture accepts dependency duplication for convenience
    -   **Python**: "Explicit is better than implicit" philosophy requires manual environment management

    #### Technical Constraints

    -   **JavaScript packages**: Mostly pure JavaScript, easily portable and duplicatable
    -   **Python packages**: Often include compiled extensions tied to specific Python versions and system architectures

    #### Practical Impact

    **JavaScript developers** can seamlessly work across multiple projects without thinking about dependency management.

    **Python developers** must manually manage environments for each project, requiring:

    -   Creating virtual environments (`uv venv`)
    -   Activating environments (`source .venv/bin/activate`)
    -   Remembering to switch environments when changing projects
    -   Deactivating when done (`deactivate`)

## Combined Development Workflow

For projects like GitInspectorGUI that use both Python and JavaScript, a combined workflow is necessary:

### Complete Setup

```bash
# 1. Install package managers (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh  # uv
corepack enable                                   # pnpm

# 2. Install all dependencies
uv sync          # Python dependencies
pnpm install     # Node.js dependencies

# 3. Start development (see Development Workflow for all options)
# PyO3 embedded - no separate server needed
pnpm run tauri dev                      # Single command
```

### Dependency Updates

```bash
# Update Python dependencies
uv sync --upgrade

# Update Node.js dependencies
pnpm update
pnpm audit fix

# Update Rust dependencies (if needed)
cargo update
```

### Clean Reinstall

If you encounter any issues with dependencies, a clean reinstall often helps:

```bash
# Clean Python environment
rm -rf .venv
uv venv
uv sync

# Clean Node.js environment
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Best Practices

### Version Management

-   **Commit lock files** to version control for reproducible builds
-   **Use exact versions** for critical dependencies
-   **Regular updates** to stay current with security patches

### Performance

-   **Use uv for Python** - significantly faster than pip
-   **Use pnpm for Node.js** - faster and more efficient than npm
-   **Enable corepack** for automatic pnpm management

### Security

-   **Regular audits** with `pnpm audit` and dependency scanning
-   **Review updates** before applying to catch breaking changes
-   **Use lock files** to ensure consistent dependency versions

## Glossary

-   **Dependency resolution**: The process of determining which versions of packages to install that satisfy all requirements without conflicts.
-   **Lock file**: A file that records the exact versions of all dependencies, ensuring reproducible builds.
-   **Monorepo**: A single repository containing multiple related projects with their own dependencies.
-   **Virtual environment**: An isolated Python environment with its own installed packages.
-   **Phantom dependencies**: Dependencies that are used but not explicitly declared in package.json.

## Related Documentation

-   **[Development Workflow](development-workflow.md)** - Core development patterns
-   **[Environment Setup](environment-setup.md)** - Development configuration
-   **[Development Commands](development-commands.md)** - Common commands reference
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
