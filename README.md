# GitInspectorGUI

A modern desktop application for git repository analysis with a Tauri + React + TypeScript frontend and Python HTTP API backend.

## 📚 Documentation

**Complete documentation is available at: [edu-boost.gitlab.io/gitinspectorgui](https://edu-boost.gitlab.io/gitinspectorgui)**

**Try the Live Demo at: [edu-boost.gitlab.io/gitinspectorgui/demo](https://edu-boost.gitlab.io/gitinspectorgui/demo)**

The documentation site includes:

-   **Getting Started** - Installation and quick start guide
-   **API Reference** - Complete HTTP API documentation
-   **Development** - Setup, troubleshooting, and contribution guides
-   **Architecture** - System design and technology stack
-   **Operations** - Deployment and maintenance procedures

## 🚀 Quick Start

### Prerequisites

-   **Python 3.8+** with pip
-   **Node.js 16+** with pnpm
-   **Rust 1.70+** with Cargo
-   **Git 2.20+**

### Development Setup

1. **Start the HTTP API Server**:

    ```bash
    python -m gigui.start_server
    ```

2. **Start the Tauri Application**:
    ```bash
    pnpm install
    pnpm run tauri dev
    ```

For detailed setup instructions, troubleshooting, and advanced configuration, visit the [documentation site](https://edu-boost.gitlab.io/gitinspectorgui).

## 🏗️ Architecture

**Current: HTTP API Architecture (v2.0)**

-   **Frontend**: Tauri + React + TypeScript + shadcn/ui
-   **Backend**: Python FastAPI + GitInspector analysis engine
-   **Communication**: JSON over HTTP with structured error handling

## 🔧 Features

-   Multi-repository analysis with 100+ configuration options
-   Modern React frontend with real-time progress indicators
-   Robust error handling and retry mechanisms
-   Cross-platform support (macOS, Windows, Linux)
-   Production-ready with comprehensive monitoring

## 📞 Support

-   **Documentation**: [edu-boost.gitlab.io/gitinspectorgui](https://edu-boost.gitlab.io/gitinspectorgui)
-   **Issues**: Use GitLab Issues for bug reports and feature requests

---

**Current Version**: 2.0.0 (HTTP API Edition)
**Status**: ✅ Production Ready
**License**: MIT
