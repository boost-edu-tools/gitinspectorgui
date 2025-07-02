# Package Management Overview

This guide provides an overview of package management in GitInspectorGUI and explains the approach to managing dependencies across the project.

## Related Guides

-   [Python Package Management](python-package-management.md) - Detailed guide for Python dependencies with uv
-   [JavaScript Package Management](javascript-package-management.md) - Detailed guide for JavaScript/TypeScript dependencies with pnpm

## Package Managers Used

GitInspectorGUI uses separate package managers for its backend and frontend components:

-   **Python backend**: Uses `uv` for fast Python package management and virtual environments
-   **JavaScript/TypeScript frontend**: Uses `pnpm` for efficient Node.js package management

These package managers were chosen for their performance and developer
experience improvements over traditional alternatives:

-   **uv (Python)**: Focuses on speed and reproducibility while improving Python's virtual environment experience
-   **pnpm (JavaScript)**: Emphasizes disk space efficiency and automatic dependency isolation



## Fundamental Differences: Python vs JavaScript Development

> **Note**: Understanding these core differences is essential for comprehending why package management works so differently between Python and JavaScript.

### Environment Management Philosophy

**Python: Manual Virtual Environment Management**

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

**JavaScript/Node.js: Automatic Project-Level Dependencies**

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

### Editable Installs: Development Workflow Differences

**Python: Editable Installs Required**

In Python, when developing a package, you need to **install your own project**
so that:

- Your package modules can be imported from anywhere in the virtual environment
- Changes to your source code are immediately reflected without reinstalling
- Your package's console scripts/entry points work correctly

**uv approach**: `uv sync` automatically installs the current project in editable mode, handling both dependencies and project setup in one command.

**pip approach**: Requires explicit editable install with `pip install -e .` (the `-e` flag stands for "editable"). Without this, changes to your source code won't be reflected when importing your package.

```bash
# Python development setup
cd my-python-package
source .venv/bin/activate

# uv handles everything automatically
uv sync

# pip requires explicit steps
pip install -r requirements.txt -r requirements-dev.txt -e .
```

**JavaScript: No Editable Installs Needed**

JavaScript/TypeScript projects work differently:

- Code runs directly from source files in the project directory
- No "installation" step required for local development
- Module resolution happens at runtime based on file paths
- Build tools (like Tauri, Webpack, Vite) compile from source during development

```bash
# JavaScript development setup
cd my-js-project

# Just install dependencies - no project "installation" needed
pnpm install
npm run dev  # Runs directly from source files
```

### Historical and Technical Background

??? info "Why these differences evolved"

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

The JavaScript ecosystem prioritized convenience and rapid development, accepting the overhead of duplicated dependencies across projects in exchange for zero-friction isolation. This fundamental difference explains why `uv sync` includes project installation while `pnpm install` does not - they're solving different problems due to how Python and JavaScript development fundamentally works.

## Package Manager Comparison

Now that you understand the fundamental differences, here's how the package managers compare across key features:

| Feature | uv (Python) | pip (Python) | pnpm (JavaScript) | npm (JavaScript) |
|---------|-------------|--------------|-------------------|------------------|
| **Speed** | 10-100x faster | Baseline | 2x faster | Baseline |
| **Disk Efficiency** | Standard | Standard | Shared storage | Duplicated dependencies |
| **Lock Files** | Auto-generated | Manual (requirements.txt + requirements-dev.txt) | Automatic (pnpm-lock.yaml) | Automatic (package-lock.json) |
| **Dependency Resolution** | Advanced conflict prevention | Basic | Strict (prevents phantom deps) | Permissive |
| **Virtual Environments** | Integrated (`uv venv`) | Separate tool required | Not needed | Not needed |
| **Configuration** | pyproject.toml | requirements.txt + requirements-dev.txt | package.json | package.json |
| **Install All Dependencies** | `uv sync` | `pip install -r requirements.txt -r requirements-dev.txt -e .` | `pnpm install` | `npm install` |
| **Add New Package** | `uv add package` | `pip install package` | `pnpm add package` | `npm install package` |
| **Add New Package** | `uv remove package` | `pip uninstall package` | `pnpm remove package` | `npm uninstall package` |
| **Add Dev Dependencies** | `uv add --group dev package` | Separate requirements-dev.txt | `pnpm add -D package` | `npm install --save-dev package` |
| **Update All** | `uv sync --upgrade` | `pip install --upgrade -r requirements.txt` | `pnpm update` | `npm update` |
| **Environment Activation** | Manual (`source .venv/bin/activate`) | Manual (`source .venv/bin/activate`) | Automatic (project-based) | Automatic (project-based) |
| **Offline Support** | Excellent | Limited | Good (shared cache) | Good (cache) |
| **Cross-platform** | Yes | Yes | Yes | Yes |

## Quick Setup

```bash
# Complete development setup
uv sync && pnpm install && pnpm run tauri dev
```

## Glossary

-   **Dependency resolution**: The process of determining which versions of packages to install that satisfy all requirements without conflicts.
-   **Lock file**: A file that records the exact versions of all dependencies, ensuring reproducible builds.
-   **Virtual environment**: An isolated Python environment with its own installed packages.
-   **Phantom dependencies**: Dependencies that are used but not explicitly declared in package.json.

## Related Documentation

-   **[Development Workflow](development-workflow.md)** - Core development patterns
-   **[Environment Setup](environment-setup.md)** - Development configuration
-   **[Development Commands](development-commands.md)** - Common commands reference
-   **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
