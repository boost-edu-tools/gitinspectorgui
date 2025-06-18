# Quick Start

Get GitInspectorGUI development environment running in 3 steps.

**Note**: This is for setting up the development environment. For application usage, see [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Prerequisites

-   **[Technology Primer](../technology-primer.md)** - If unfamiliar with the tools
-   **Python 3.13+** with uv package manager
-   **Node.js 22+** with pnpm package manager
-   **Rust 1.85+** with Cargo (for Tauri)
-   **Git 2.45+** for repository analysis

## 3-Step Setup

### 1. Start Python Backend

```bash
python -m gigui.start_server
# Server runs at: http://127.0.0.1:8080
```

### 2. Start Desktop Frontend

```bash
pnpm install && pnpm run tauri dev
```

### 3. Verify Integration

-   Desktop app connects automatically to Python server
-   Test with sample repository analysis

## Next Steps

-   **[Installation Guide](installation.md)** - Detailed setup
-   **[CLI Guide](cli-guide.md)** - Command-line usage
-   **[First Analysis](first-analysis.md)** - Test your setup
-   **[Development Workflow](../development/development-workflow.md)** - Development patterns
