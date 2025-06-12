# GitInspectorGUI

Modern desktop application for git repository analysis with Tauri + React + TypeScript frontend and Python HTTP API backend.

## 🚀 Quick Links

-   **📖 Documentation**: [edu-boost.gitlab.io/gitinspectorgui](https://edu-boost.gitlab.io/gitinspectorgui)
-   **🎮 Live Demo**: [edu-boost.gitlab.io/gitinspectorgui/demo](https://edu-boost.gitlab.io/gitinspectorgui/demo)

## ⚡ Quick Start

### Prerequisites

-   Python 3.11+
-   Node.js 20+ with pnpm
-   Rust 1.75+
-   Git 2.40+

### Development

```bash
# Start API server
python -m gigui.start_server

# Start application (new terminal)
pnpm install
pnpm run tauri dev
```

## 🏗️ Architecture

**HTTP API Architecture (v2.0)**

-   Frontend: Tauri + React + TypeScript + shadcn/ui
-   Backend: Python FastAPI + GitInspector engine
-   Communication: JSON over HTTP

## ✨ Features

-   Multi-repository analysis with 100+ configuration options
-   Real-time progress indicators and interactive tables
-   Robust error handling with retry mechanisms
-   Cross-platform support (macOS, Windows, Linux)
-   Production-ready monitoring and deployment

## 📞 Support

-   **Documentation**: [Complete guides and API reference](https://edu-boost.gitlab.io/gitinspectorgui)
-   **Issues**: Use GitLab Issues for bug reports and feature requests

---

**Version**: 2.0.0 | **Status**: Production Ready | **License**: MIT
