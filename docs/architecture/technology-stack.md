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

### PyO3 Integration

-   **PyO3 0.20+** - Rust bindings for Python
    -   Embedded Python interpreter within Rust binary
    -   Direct function calls between Rust and Python
    -   Type-safe Python object handling with smart pointers
    -   Native error handling via PyResult<T> and PyErr
    -   GIL (Global Interpreter Lock) management
    -   Support for async Python operations

**Purpose**: PyO3 enables GitInspectorGUI to embed a Python interpreter directly within the Rust Tauri application, allowing direct execution of Python analysis code without separate processes or network communication.

**Key Features**:

-   **Zero IPC overhead** - Direct function calls between Rust and Python
-   **Native memory access** - No serialization between Rust and Python
-   **Embedded interpreter** - Python runs within the same process
-   **Type-safe conversion** - Automatic Python ↔ Rust type conversion

### CLI Framework

-   **argparse** - Command-line interface
-   **JSON Schema** - Configuration validation
-   **Shared settings** - CLI/GUI parity

## Architecture

### Communication

-   **PyO3 Direct Integration** - Direct Python function calls from Rust
-   **Tauri Commands** - Frontend ↔ Rust backend communication
-   **Single Process** - Embedded Python within Tauri application
-   **JSON Configuration** - Shared settings between CLI/GUI

### Data Flow

```mermaid
graph LR
    A[Tauri Frontend] -->|invoke()| B[Tauri Rust Backend]
    B -->|Direct calls| C[PyO3 Bindings]
    C -->|Python functions| D[Python Analysis Engine]
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
-   **[Package Management](../development/package-management-overview.md)** - Frontend dependencies
-   **[PyO3 Integration](../architecture/design-decisions.md)** - PyO3 architecture details
