"""
GitInspectorGUI API Layer.

This package provides the public API interface for the GitInspectorGUI backend,
including HTTP server functionality and data types.
"""

from gigui.api.main import GitInspectorAPI
from gigui.api.types import AnalysisResult, Settings

__all__ = ["AnalysisResult", "GitInspectorAPI", "Settings"]
