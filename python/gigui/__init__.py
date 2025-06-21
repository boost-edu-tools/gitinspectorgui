"""
GitInspectorGUI - Modern git repository analysis tool.

This package provides the core Python backend for analyzing git repositories,
extracting statistics, and generating blame analysis data.
"""

from gigui.api.http_server import app, start_server
from gigui.api.main import GitInspectorAPI
from gigui.api.types import (
    AnalysisResult,
    AuthorStat,
    BlameEntry,
    FileStat,
    RepositoryResult,
    Settings,
)

__version__ = "0.1.0"
__author__ = "Bert van Beek"
__email__ = "d.a.v.beek@tue.nl"

__all__ = [
    "AnalysisResult",
    "AuthorStat",
    "BlameEntry",
    "FileStat",
    "GitInspectorAPI",
    "RepositoryResult",
    "Settings",
    "app",
    "start_server",
]
