# GitInspectorGUI

Modern desktop application for git repository analysis with Tauri + React + TypeScript frontend and embedded Python backend via PyO3 helper functions.

## ⚠️ IMPORTANT NOTICE

**This version of GitInspectorGUI is currently under development and not yet ready for production use.**

For the stable, production-ready version, please use the original GitInspectorGUI which has been renamed and relocated to:
[https://github.com/boost-edu-tools/gitinspectorgui-old](https://github.com/boost-edu-tools/gitinspectorgui-old)

## 🚀 Quick Links

- **📖 Documentation**: [boost-edu-tools.github.io/gitinspectorgui/](https://boost-edu-tools.github.io/gitinspectorgui/)
- **🎮 Live Demo**: [boost-edu-tools.github.io/gitinspectorgui/demo](https://boost-edu-tools.github.io/gitinspectorgui/demo)

## ⚡ Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+ with pnpm
- Rust 1.75+
- Git 2.40+

### Development

```bash
# Install dependencies and start development
pnpm install
pnpm run tauri dev
```

## 🏗️ Architecture

**PyO3 Helper Function Architecture (v2.0)**

- Frontend: Tauri + React + TypeScript + shadcn/ui
- Backend: Embedded Python analysis engine via PyO3 helper functions
- Communication: Direct function calls (zero IPC overhead)

## ✨ Features

- **Desktop GUI**: Modern Tauri + React interface with real-time progress
- **Standalone CLI**: Portable command-line tool for automation and CI/CD
- Multi-repository analysis with 100+ configuration options
- Real-time progress indicators and interactive tables
- Robust error handling with retry mechanisms
- Cross-platform support (macOS, Windows, Linux)
- Production-ready monitoring and deployment

## 📞 Support

- **Documentation**: [Complete guides and API reference](https://boost-edu-tools.github.io/gitinspectorgui/)
- **Issues**: Use GitHub Issues for bug reports and feature requests

---

**Version**: Alpha | **Status**: In Development | **License**: MIT
