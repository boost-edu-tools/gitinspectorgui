# GitInspector GUI

A desktop application for Git repository inspection built with Tauri, React, and TypeScript.

## Prerequisites

Before running the app, ensure you have the following installed:

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **pnpm** - Install with: `npm install -g pnpm`
- **Rust** (latest stable) - [Install here](https://rustup.rs/)
- **Visual Studio C++ Build Tools** (Windows only) - [Download here](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

## Setup

1. **Clone the repository**
```bash
   git clone <your-repo-url>
   cd gitinspectorgui/gui
```

2. **Install dependencies**
```bash
   pnpm install
```
## Running the App

### Development Mode
```bash
pnpm tauri dev
```

This will:
- Start the Vite development server
- Compile the Rust backend
- Launch the application window with hot-reload enabled

