# ruff: noqa: F821  # Do not complain about undefined names
"""
PyInstaller spec file for GitInspectorCLI standalone application.

This creates a single-file executable for the command-line interface
that can be distributed as a standalone binary.

Key features:
- Single-file executable (onefile mode)
- Console application for CLI operation
- Full analysis capabilities
- Entry point: python/gigui/cli.py
"""

block_cipher = None

# Dependencies for full CLI operation
excludes = []

a = Analysis(
    ["gitinspectorcli_main.py"],
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
        "gigui.api",
        "gigui.performance_monitor",
        "argparse",
        "json",
        "sys",
        "pathlib",
        "dataclasses",
        "importlib.metadata",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "pkg_resources",
        "setuptools.pkg_resources",
    ],
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
    name="gitinspectorcli",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,  # Console application for CLI operation
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
