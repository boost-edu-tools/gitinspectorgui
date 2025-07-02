# Technology Stack

GitInspectorGUI technology stack and architectural decisions.

## Frontend

### Core Framework

-   **[Tauri 2.x](https://tauri.app/)** - Rust-based desktop framework
    -   System webview (no Chromium bundle)
    -   Native performance and security
    -   Auto-updater support
    -   Cross-platform (Windows, macOS, Linux)

### UI Stack

-   **React 18+** - Component framework
-   **TypeScript 5+** - Type safety
-   **Tailwind CSS 3+** - Utility-first styling
-   **shadcn/ui** - Component library
-   **Zustand 4+** - State management

### Data Tables

-   **TanStack Table v8** - Advanced table functionality
    -   Column filtering and sorting
    -   Virtual scrolling
    -   Row expansion
    -   Custom cell renderers

## Backend

### Core Runtime

-   **Python 3.8+** - Analysis engine language
    -   `asyncio` for async operations
    -   `concurrent.futures` for parallel processing
    -   `multiprocessing` for CPU-intensive tasks

### Python Integration

-   **PyO3 0.22** - Python-Rust bindings for embedded Python interpreter

> **Integration Details**: For comprehensive information about the PyO3 architecture, see [PyO3 Integration Architecture](pyo3-integration.md).


### CLI Framework

-   **argparse** - Command-line interface
-   **JSON Schema** - Configuration validation
-   **Shared settings** - CLI/GUI parity

## Architecture

### Communication

-   **Tauri Commands** - Frontend ↔ Backend communication via `invoke()`
-   **Embedded Python** - Single process with embedded Python interpreter
-   **JSON Serialization** - Data exchange format

### Data Flow

```mermaid
graph LR
    A[Tauri Frontend] -->|invoke| B[Tauri Commands]
    B -->|Helper Functions| C[PyO3 Bindings]
    C -->|Direct Calls| D[Python Analysis Engine]
    D --> E[Repository Data]

    F[JSON Config] --> A
    F --> D
```

## Package Management

### Frontend Dependencies

-   **pnpm 9+** - Fast, disk-efficient package manager
-   **Vite 5+** - Build tool and dev server
-   **ESLint + Prettier** - Code quality

### Backend Dependencies

-   **uv** - Fast Python package manager
-   **pyproject.toml** - Modern Python packaging
-   **Virtual environments** - Isolated dependencies

### PyO3 Build Dependencies

-   **Cargo** - Rust package manager and build system
-   **PyO3** - Python-Rust bindings
-   **Python Development Headers** - Required for PyO3 compilation

## Distribution

### Desktop Applications

-   **Tauri Bundler** - Native installers with embedded Python
    -   Windows: `.msi`, `.exe`
    -   macOS: `.dmg`, `.app`
    -   Linux: `.deb`, `.rpm`, `.AppImage`
-   **Auto-updater** - Seamless updates via GitHub releases
-   **Embedded Python** - Python interpreter bundled within application

### CLI Distribution

-   **PyPI Package** - `pip install gitinspector-gui`
-   **Standalone Binaries** - PyInstaller/Nuitka builds
-   **Docker Images** - Containerized deployment

## Development Tools

### Design System

-   **Figma** - UI/UX design and prototyping
-   **Flowbite Components** - Pre-built UI components
-   **Storybook** - Component documentation

### AI Development

-   **Structured schemas** - JSON Schema for configuration
-   **Modular architecture** - Clear separation of concerns
-   **Template-based** - Reusable patterns and boilerplates

## Version Requirements

| Technology | Minimum Version | Current Stable |
| ---------- | --------------- | -------------- |
| Python     | 3.8+            | 3.13.5         |
| Node.js    | 22+             | 22.12 LTS      |
| Rust       | 1.63+           | 1.85.0         |
| Git        | 2.45+           | 2.47.1         |
| Tauri      | 2.0+            | 2.1.0          |
| PyO3       | 0.20+           | 0.22.0         |

## Related Documentation

-   **[Development Environment](../development/environment-setup.md)** - Setup instructions
-   **[Package Management](../development/package-management.md)** - Dependencies and tools
-   **[PyO3 Integration Architecture](pyo3-integration.md)** - Direct PyO3 integration details
