# GitInspectorGUI

Modern desktop application for git repository analysis with Tauri + React + TypeScript frontend and Python HTTP API backend.

## ⚠️ IMPORTANT NOTICE

**This version of GitInspectorGUI is currently under development and not yet ready for production use.**

For the stable, production-ready version, please use the original GitInspectorGUI which has been renamed and relocated to:
[https://github.com/davbeek/gitinspectorgui-old](https://github.com/davbeek/gitinspectorgui-old)

## 🚀 Quick Links

- **📖 Documentation**: [davbeek.github.io/gitinspectorgui/](https://davbeek.github.io/gitinspectorgui/)
- **🎮 Live Demo**: [davbeek.github.io/gitinspectorgui/demo](https://davbeek.github.io/gitinspectorgui/demo)

## ⚡ Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+ with pnpm
- Rust 1.75+
- Git 2.40+

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

- Frontend: Tauri + React + TypeScript + shadcn/ui
- Backend: Python FastAPI + GitInspector engine
- Communication: JSON over HTTP

## ✨ Features

- **Desktop GUI**: Modern Tauri + React interface with real-time progress
- **Standalone CLI**: Portable command-line tool for automation and CI/CD
- Multi-repository analysis with 100+ configuration options
- Real-time progress indicators and interactive tables
- Robust error handling with retry mechanisms
- Cross-platform support (macOS, Windows, Linux)
- Production-ready monitoring and deployment

## 📞 Support

- **Documentation**: [Complete guides and API reference](https://davbeek.github.io/gitinspectorgui/)
- **Issues**: Use GitHub Issues for bug reports and feature requests

---

**Version**: Alpha | **Status**: In Development | **License**: MIT
