# ruff: noqa: F821  # Do not complain about undefined names
"""
PyInstaller spec file for GitInspectorGUI API Sidecar.

This creates a single-file executable for the Python API backend
that can be used as a Tauri sidecar process.

Key features:
- Single-file executable (onefile mode)
- Console application for background operation
- Minimal dependencies (no GUI, no Excel, no web server)
- Entry point: python/gigui/api.py
"""

block_cipher = None

# Minimal dependencies for API-only operation
# No excludes needed since we only have lightweight dependencies
excludes = []

a = Analysis(
    ["gigui/api.py"],
    pathex=["python"],
    binaries=[],
    datas=[],
    hiddenimports=[
        "git",
        "gitpython",
        "gigui.legacy_engine",
        "gigui.typedefs",
        "gigui.person_data",
        "gigui.data",
        "gigui.repo_base",
        "gigui.repo_blame",
        "gigui.repo_data",
        "gigui.utils",
        "gigui.api_types",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="gitinspector-api-sidecar",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Console application for API background operation
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
