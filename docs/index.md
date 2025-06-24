# GitInspectorGUI Developer Documentation

Development environment and tooling documentation for GitInspectorGUI contributors.

**Note**: For application usage and features, see the main documentation at [gitinspectorgui.readthedocs.io](https://gitinspectorgui.readthedocs.io/en/latest/).

## Quick Navigation

### Try the Demo

-   **[Interactive Demo](https://boost-edu-tools.github.io/gitinspectorgui/demo/)** - Try GitInspectorGUI in your browser without installation

### New to the Project?

-   **[Technology Primer](technology-primer.md)** - Understanding the development tools
-   **[Prerequisites](getting-started/01-prerequisites.md)** - System requirements and tool installation
-   **[Installation Guide](getting-started/02-installation.md)** - Detailed setup
-   **[Quick Start](getting-started/03-quick-start.md)** - Get running in 3 steps

### Development

-   **[Development Workflow](development/development-workflow.md)** - Core development patterns
-   **[Package Management](development/package-management-overview.md)** - Dependencies and tools
-   **[Build Process](development/build-process.md)** - Creating releases
-   **[Environment Setup](development/environment-setup.md)** - Development configuration
-   **[Troubleshooting](development/troubleshooting.md)** - Common issues

### Command Line Interface

-   **[CLI Guide](getting-started/cli-guide.md)** - Complete command-line usage
-   **[First Analysis](getting-started/04-first-analysis.md)** - Test your setup

### API Development

-   **[HTTP API Reference](api/reference.md)** - Complete API documentation
-   **[API Examples](api/examples.md)** - Usage patterns and code samples
-   **[Error Handling](api/error-handling.md)** - Error codes and troubleshooting

### Architecture & Operations

-   **[System Overview](architecture/overview.md)** - System architecture
-   **[Technology Stack](architecture/technology-stack.md)** - Technology choices
-   **[Design Decisions](architecture/design-decisions.md)** - Architectural rationale
-   **[Release & Distribution](operations/deployment.md)** - Production deployment
-   **[Server Management](operations/server-management.md)** - Operational procedures

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
