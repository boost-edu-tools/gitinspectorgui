# GitInspectorGUI Development Mode

This document explains how to use the development mode for GitInspectorGUI, which allows you to see changes to the Python API immediately in the GUI without rebuilding the PyInstaller sidecar.

## Overview

Development mode replaces the PyInstaller sidecar with a direct Python script (`python/dev_api.py`) that imports and runs the actual API code. This means:

- ✅ **Immediate feedback**: Changes to Python code are visible instantly
- ✅ **Full debugging**: Use VS Code Python debugger with breakpoints
- ✅ **Fast iteration**: No PyInstaller rebuilds required
- ✅ **Same GUI**: Uses the exact same Tauri frontend

## Quick Start

### 1. Enable Development Mode
```bash
./dev-mode.sh enable
```

### 2. Start Development Server
```bash
./dev-mode.sh dev
```

### 3. Make Changes
Edit `python/gigui/api.py` and see changes immediately in the GUI!

### 4. Disable Development Mode (when ready for production)
```bash
./dev-mode.sh disable
```

## Available Commands

| Command | Description |
|---------|-------------|
| `./dev-mode.sh enable` | Enable development mode |
| `./dev-mode.sh disable` | Disable development mode |
| `./dev-mode.sh status` | Show current mode |
| `./dev-mode.sh dev` | Start Tauri development server |
| `./dev-mode.sh test` | Test Python API directly |
| `./dev-mode.sh help` | Show help message |

## How It Works

### Production Mode (Default)
```
Tauri Frontend → PyInstaller Sidecar (binary) → Python API
```

### Development Mode
```
Tauri Frontend → dev_api.py (Python script) → Python API
```

## Development Workflow

1. **Enable development mode** once at the start of your development session
2. **Start the development server** with `./dev-mode.sh dev`
3. **Edit Python code** in `python/gigui/api.py`
4. **Test immediately** - changes are visible without restart
5. **Debug with VS Code** - set breakpoints and step through code
6. **Disable development mode** when ready to test production build

## Debugging Python Code

### VS Code Debugging Setup

1. Enable development mode: `./dev-mode.sh enable`
2. Open VS Code in the `gitinspectorgui` directory
3. Set breakpoints in `python/gigui/api.py`
4. Use VS Code's "Python: Attach to Process" or create a launch configuration

### Example VS Code Launch Configuration
Add this to `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug API Direct",
            "type": "python",
            "request": "launch",
            "program": "${workspaceFolder}/python/dev_api.py",
            "args": ["execute_analysis", "{\"input_fstrs\": [\"/path/to/test/repo\"]}"],
            "console": "integratedTerminal",
            "cwd": "${workspaceFolder}/python"
        }
    ]
}
```

## Testing Changes

### Quick API Test
```bash
./dev-mode.sh test
```

### Manual API Testing
```bash
cd python
python dev_api.py get_settings
python dev_api.py execute_analysis '{"input_fstrs": ["/path/to/repo"]}'
```

### GUI Testing
1. Start development server: `./dev-mode.sh dev`
2. Use the GUI normally
3. Changes to Python code are immediately active

## File Structure

```
gitinspectorgui/
├── dev-mode.sh                    # Development mode control script
├── python/
│   ├── dev_api.py                 # Development API script
│   └── gigui/
│       └── api.py                 # Main API code (edit this!)
└── src-tauri/
    ├── tauri.conf.json            # Current config (switches automatically)
    ├── tauri.conf.dev.json        # Development configuration
    └── tauri.conf.json.backup     # Original production configuration
```

## Integrating Legacy Code

When integrating code from `gitinspectorgui-old`, you can:

1. **Copy modules** to `python/gigui/` directory
2. **Import and use** them in `api.py`
3. **Test immediately** with development mode
4. **Debug step-by-step** with VS Code

Example integration:
```python
# In python/gigui/api.py
from .repo_data import RepoData  # Import legacy module

def execute_analysis(self, settings: Settings) -> AnalysisResult:
    # Use legacy code for actual analysis
    repo_data = RepoData(settings)
    result = repo_data.run_analysis()
    # Convert to new format and return
```

## Troubleshooting

### "Command not found" error
Make sure the script is executable:
```bash
chmod +x dev-mode.sh
```

### Python import errors
Ensure you're in the correct directory and Python can find the modules:
```bash
cd gitinspectorgui
./dev-mode.sh test
```

### GUI not updating
1. Check that development mode is enabled: `./dev-mode.sh status`
2. Restart the development server: `./dev-mode.sh dev`

### Switch back to production
```bash
./dev-mode.sh disable
```

## Benefits

- **🚀 Fast Development**: No PyInstaller rebuilds
- **🐛 Easy Debugging**: Full Python debugger support  
- **🔄 Hot Reload**: Changes visible immediately
- **🎯 Same Environment**: Uses actual Tauri GUI
- **📦 Production Ready**: Easy switch to production mode

## Next Steps

1. Start with development mode enabled
2. Begin integrating actual git analysis from `gitinspectorgui-old`
3. Test each change immediately in the GUI
4. Use debugging to understand and fix issues
5. Switch to production mode for final testing