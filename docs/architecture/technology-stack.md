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

-   **PyO3 0.22** - Direct Python-Rust bindings with simplified integration
    -   Embedded Python interpreter within Rust binary
    -   Custom helper functions for clean API
    -   Automatic JSON serialization/deserialization
    -   Direct PyO3 bindings with elegant abstractions
    -   Type-safe communication interface
    -   Support for async Python operations

**Purpose**: Our simplified PyO3 helper function integration provides the performance and reliability of direct PyO3 bindings while maintaining a clean, easy-to-use API through custom helper functions.

**Key Features**:

-   **Zero IPC overhead** - Direct function calls via PyO3
-   **Automatic error conversion** - Python exceptions to Rust Result types
-   **Embedded interpreter** - Python runs within the same process
-   **Simplified API** - Clean `invoke()` interface for frontend
-   **Custom abstractions** - Helper functions eliminate PyO3 boilerplate

### CLI Framework

-   **argparse** - Command-line interface
-   **JSON Schema** - Configuration validation
-   **Shared settings** - CLI/GUI parity

## Architecture

### Communication

-   **Direct PyO3 Integration** - Python function calls through simplified PyO3 bindings
-   **Tauri Commands** - Frontend ↔ Backend communication via `invoke()`
-   **Single Process** - Embedded Python within Tauri application via PyO3
-   **JSON Serialization** - Automatic type conversion between Rust and Python

### Data Flow

```mermaid
graph LR
    A[Tauri Frontend] -->|invoke()| B[Tauri Commands]
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
-   **[Package Management](../development/package-management-overview.md)** - Frontend dependencies
-   **[PyO3 Architecture](../architecture/design-decisions.md)** - Direct PyO3 integration details
