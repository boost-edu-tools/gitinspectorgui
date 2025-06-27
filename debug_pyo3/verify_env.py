#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path


def verify_environment():
    info = {
        "python_executable": sys.executable,
        "python_version": sys.version,
        "python_path": sys.path,
        "current_working_directory": os.getcwd(),
        "gigui_importable": False,
        "gigui_location": None,
        "virtual_env": os.environ.get("VIRTUAL_ENV"),
        "conda_env": os.environ.get("CONDA_DEFAULT_ENV"),
    }

    try:
        import gigui

        info["gigui_importable"] = True
        info["gigui_location"] = str(Path(gigui.__file__).parent)
        info["gigui_version"] = getattr(gigui, "__version__", "unknown")
    except ImportError as e:
        info["gigui_import_error"] = str(e)

    print(json.dumps(info, indent=2))
    return info


if __name__ == "__main__":
    verify_environment()
