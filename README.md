# GitInspectorGUI - Redesigned

A modern desktop application for git repository analysis with a Tauri + React + TypeScript frontend and Python backend.

## Architecture

- **Frontend**: Tauri + React + TypeScript + shadcn/ui + Zustand
- **Backend**: Python (extracted from original gigui)
- **Communication**: JSON-RPC over Tauri commands
- **Distribution**: Single-file desktop apps with auto-update support

## Development Status

🚧 **Currently in development** - Proof-of-concept phase

### Phase 1: Proof-of-Concept ✅
- [x] Repository structure
- [ ] Basic Tauri setup
- [ ] React frontend with settings form
- [ ] Python backend integration
- [ ] Simple table display

### Phase 2: Core Features (Planned)
- [ ] Complete settings UI (50+ options)
- [ ] Multi-repository support
- [ ] Interactive tables with filtering
- [ ] CLI integration

### Phase 3: Advanced Features (Planned)
- [ ] Excel-like table interactions
- [ ] Blame history navigation
- [ ] Auto-update mechanism
- [ ] Cross-platform distribution

## Quick Start

```bash
# Install dependencies
npm install
cd src-tauri && cargo build

# Development
npm run tauri dev

# Build
npm run tauri build
```

## Original Project

This is a redesign of the original [gitinspectorgui](../gitinspectorgui-old/) project, migrating from PySimpleGUI to a modern web-based desktop application.