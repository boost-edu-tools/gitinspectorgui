# GitInspectorGUI Developer Documentation

Development environment and tooling documentation for GitInspectorGUI contributors.

**Note**: For application usage and features, see the main documentation at [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Development Environment Setup

For developers contributing to GitInspectorGUI who need help with the modern development stack:

-   **[Technology Primer](technology-primer.md)** - Understanding the development tools (Tauri, FastAPI, React, TypeScript, etc.)
-   **[Python-Focused Development](development/python-focused-development.md)** - Backend development workflow for Python developers

## Development Setup

-   **[Quick Start](getting-started/quick-start.md)** - Get development environment running
-   **[Installation](getting-started/installation.md)** - Detailed development setup
-   **[First Analysis](getting-started/first-analysis.md)** - Test your development setup

## Documentation

### AI Tools

-   **[Overview](ai-tools/overview.md)** - AI development ecosystem
-   **[Cline Guide](ai-tools/cline-guide.md)** - Direct coding assistance
-   **[Roo Code Guide](ai-tools/roo-code-guide.md)** - Multi-agent workflows

### Development

-   **[Python-Focused Development](development/python-focused-development.md)** - For Python developers working with this multi-stack project
-   **[Environment Setup](development/environment-setup.md)** - Development configuration
-   **[Development Mode](development/development-mode.md)** - Local workflow
-   **[Package Management (pnpm)](development/package-management-pnpm.md)** - Frontend dependencies
-   **[Python Management (uv)](development/python-management-uv.md)** - Backend dependencies
-   **[Enhanced Settings](development/enhanced-settings.md)** - Configuration options
-   **[Troubleshooting](development/troubleshooting.md)** - Common issues

### API

-   **[Reference](api/reference.md)** - HTTP API endpoints
-   **[Examples](api/examples.md)** - Code examples
-   **[Error Handling](api/error-handling.md)** - Error codes

### Architecture

-   **[Overview](architecture/overview.md)** - System architecture
-   **[Technology Stack](architecture/technology-stack.md)** - Technology choices
-   **[Legacy Integration](architecture/legacy-integration.md)** - Legacy compatibility
-   **[Design Decisions](architecture/design-decisions.md)** - Architectural rationale

### Operations

-   **[Deployment](operations/deployment.md)** - Production setup
-   **[Monitoring](operations/monitoring.md)** - System monitoring
-   **[Maintenance](operations/maintenance.md)** - Maintenance procedures

## Features

-   **HTTP API Architecture** - Tauri desktop frontend with Python backend
-   **Cross-Platform** - Windows, macOS, Linux support
-   **Git Analysis** - Comprehensive repository insights
-   **Interactive UI** - React-based interface with filtering
-   **Developer API** - Complete HTTP API documentation

## Architecture

```mermaid
graph TD
    A[Tauri Frontend] --> B[HTTP Client]
    B --> C[Python HTTP Server]
    C --> D[Git Analysis Engine]
    D --> E[Repository Data]

    F[Settings] --> A
    G[Results Store] --> A
    H[API Types] --> B
```
