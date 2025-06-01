# GitInspectorGUI Redesign - Implementation Plan

## Overview

This document outlines the complete implementation plan for redesigning GitInspectorGUI from PySimpleGUI to a modern Tauri + React + TypeScript application.

## Phase 1: Proof-of-Concept Setup

### 1.1 Project Structure Creation

```
gitinspectorgui/
├── src-tauri/                 # Tauri Rust backend
│   ├── src/
│   │   ├── main.rs           # Main Tauri application
│   │   ├── commands.rs       # Python integration commands
│   │   └── lib.rs            # Library exports
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json       # Tauri configuration
│   └── build.rs              # Build script
├── src/                      # React frontend
│   ├── components/
│   │   ├── ui/               # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── table.tsx
│   │   │   └── form.tsx
│   │   ├── SettingsForm.tsx  # Main settings form
│   │   ├── ExecuteButton.tsx # Execute analysis button
│   │   ├── ResultsTables.tsx # Results display tables
│   │   └── Layout.tsx        # Main application layout
│   ├── stores/
│   │   ├── settingsStore.ts  # Zustand settings state
│   │   └── resultsStore.ts   # Zustand results state
│   ├── types/
│   │   ├── settings.ts       # Settings type definitions
│   │   ├── results.ts        # Results type definitions
│   │   └── api.ts            # API type definitions
│   ├── lib/
│   │   ├── utils.ts          # Utility functions
│   │   └── api.ts            # Tauri API calls
│   ├── App.tsx               # Main React application
│   ├── main.tsx              # React entry point
│   └── index.css             # Global styles
├── python/                   # Python backend (extracted from gigui)
│   ├── gigui/                # Core analysis logic (copied from original)
│   │   ├── __init__.py
│   │   ├── args_settings.py  # Settings management
│   │   ├── repo_data.py      # Repository analysis
│   │   ├── repo_blame.py     # Blame analysis
│   │   └── ...               # Other core modules
│   ├── api.py                # JSON API for Tauri communication
│   ├── cli.py                # CLI interface
│   └── requirements.txt      # Python dependencies
├── package.json              # Node.js dependencies
├── pyproject.toml            # Python project configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── vite.config.ts            # Vite configuration
├── components.json           # shadcn/ui configuration
└── README.md                 # Project documentation
```

### 1.2 Technology Stack Setup

#### Frontend Dependencies (package.json)
```json
{
  "name": "gitinspectorgui",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "dependencies": {
    "@tauri-apps/api": "^1.5.0",
    "@tauri-apps/plugin-shell": "^1.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-table": "^8.10.0",
    "zustand": "^4.4.0",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-button": "^1.0.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0",
    "lucide-react": "^0.284.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.5.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

#### Rust Dependencies (Cargo.toml)
```toml
[package]
name = "gitinspectorgui"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.5", features = ["api-all", "shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1", features = ["full"] }
```

#### Python Dependencies (requirements.txt)
```
beautifulsoup4>=4.12.3
colorlog>=6.9
gitpython>=3.1.43
jinja2>=3.1.4
jsonschema>=4.23
platformdirs>=4.3.6
requests>=2.32.3
werkzeug>=3.1.3
xlsxwriter>=3.2
fastapi>=0.115
```

### 1.3 Core Components Implementation

#### Settings Form Component
- Form with 10-15 key settings from original (subset for POC)
- Input validation using JSON schema
- Real-time state management with Zustand
- shadcn/ui form components

#### Execute Button Component
- Triggers Python backend via Tauri commands
- Loading states and progress indication
- Error handling and user feedback

#### Results Tables Component
- Basic table display using TanStack Table
- Column sorting and filtering
- Responsive design

#### Python API Module
- Extract core logic from original gigui modules
- Create JSON API interface for Tauri communication
- Maintain CLI compatibility

## Phase 2: Core Feature Implementation

### 2.1 Complete Settings UI
- All 50+ settings from original application
- Organized into logical groups/tabs
- Form validation and error handling
- Settings persistence to JSON file

### 2.2 Multi-Repository Support
- Repository discovery and selection
- Parallel processing of multiple repositories
- Progress tracking and status updates

### 2.3 Advanced Table Features
- Excel-like column filtering
- Row sorting and grouping
- Virtual scrolling for large datasets
- Export functionality

### 2.4 CLI Integration
- Shared JSON settings file
- CLI argument override support
- Identical output between CLI and GUI

## Phase 3: Advanced Features

### 3.1 Interactive Table Enhancements
- Comment line toggle functionality
- Row height auto-expansion on hover
- Cell editing capabilities
- Custom column configurations

### 3.2 Blame History Navigation
- Clickable commit navigation
- Dynamic table updates based on selected commit
- History visualization

### 3.3 Distribution and Updates
- Tauri auto-updater setup
- Single-file app generation
- Cross-platform builds (Windows, macOS, Linux)
- PyPI distribution for CLI

## Implementation Steps

### Step 1: Initialize Tauri Project
```bash
npm create tauri-app@latest gitinspectorgui --template react-ts
cd gitinspectorgui
npm install
```

### Step 2: Setup shadcn/ui
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input checkbox label form table
```

### Step 3: Extract Python Backend
- Copy core modules from `gitinspectorgui-old/src/gigui/`
- Create new `api.py` module for JSON communication
- Adapt existing logic for JSON output instead of HTML/Excel

### Step 4: Implement Core Components
- Create basic React components
- Setup Zustand stores
- Implement Tauri commands for Python integration

### Step 5: Test and Iterate
- Validate proof-of-concept functionality
- Gather feedback and refine approach
- Plan next phase implementation

## Success Criteria for POC

1. ✅ New repository structure created
2. ⏳ Tauri + React application runs successfully
3. ⏳ Basic settings form with 10+ options
4. ⏳ Execute button triggers Python backend
5. ⏳ Results displayed in simple table format
6. ⏳ Settings persist between sessions
7. ⏳ Cross-platform compatibility verified

## Risk Mitigation

### Technical Risks
- **Python Integration Complexity**: Start with simple subprocess calls, evolve to more sophisticated communication
- **Performance with Large Datasets**: Implement virtual scrolling and pagination early
- **Cross-platform Compatibility**: Test on all target platforms during POC

### Development Risks
- **Learning Curve**: Focus on minimal viable features first
- **Scope Creep**: Stick to POC goals, document future enhancements
- **AI Development**: Use clear, well-documented code structure for AI assistance

## Next Actions

1. Switch to Code mode for implementation
2. Create the complete project structure
3. Initialize Tauri project with React + TypeScript
4. Setup shadcn/ui and basic styling
5. Extract and adapt Python backend
6. Implement core components
7. Test proof-of-concept functionality

This plan provides a clear roadmap for the redesign while maintaining focus on delivering a working proof-of-concept quickly.