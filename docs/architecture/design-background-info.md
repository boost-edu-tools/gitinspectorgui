# Design Background

Original architecture requirements that guided GitInspectorGUI development.

## Core Requirements

### Application Type

-   **Single-user desktop application** - No multi-user or web deployment
-   **Cross-platform** - Windows, macOS (Arm + Intel), Linux (optional)
-   **Single-file distribution** - Self-contained executable

### Backend Architecture

-   **Python-based** - Multithreading and multiprocessing support
-   **Process management** - Both short-lived and persistent Python processes
-   **CLI/GUI parity** - Shared JSON settings file with jsonschema validation

### Frontend Requirements

-   **Single-page application** - Settings panel, output tables, execute button
-   **Interactive tables** - Excel-like filtering, comment toggle, row expansion
-   **Real-time updates** - Settings changes trigger immediate analysis updates
-   **TypeScript preferred** - Modern development with type safety

### UI/UX Preferences

-   **Component libraries** - Mantine and Zustand
-   **Design system** - Flowbite Figma UI Kit for rapid prototyping
-   **JSX familiarity** - Coming from PySimpleGUI background
-   **No code generators** - Manual implementation from Figma designs or from
    old GUI screenshots

### CLI/GUI Integration

-   **Typer CLI** - Nearly identical settings to GUI
-   **Execution patterns** - CLI runs once, GUI supports multiple runs
-   **Output consistency** - Identical analysis results between CLI/GUI
-   **JSON configuration** - Shared settings with CLI override capability

### Technical Constraints

-   **Modern browsers only** - No legacy compatibility required
-   **Avoid localhost servers** - Prefer native desktop integration
-   **Auto-update support** - Seamless update mechanism for GUI
-   **PyPI distribution** - Additional CLI distribution via uv/pyproject.toml

### Development Goals

-   **Template-driven** - Minimize custom code through library usage
-   **AI-friendly** - Architecture suitable for AI-assisted development
-   **Maintainable** - Robust, small, easy-to-maintain codebase
-   **Academic users** - Target audience of teachers and CS students

## Implementation Outcome

These requirements led to the current architecture:

-   **Tauri + React + TypeScript** frontend
-   **Embedded Python** backend via PyO3 helper functions
-   **JSON Schema** configuration management
-   **TanStack Table** for interactive data display
-   **Cross-platform** desktop distribution

## Related Documentation

-   **[Technology Stack](technology-stack.md)** - Selected technologies and rationale
-   **[System Overview](overview.md)** - High-level architecture implementation
-   **[PyO3 Integration Architecture](pyo3-integration.md)** - Specific architectural choices
