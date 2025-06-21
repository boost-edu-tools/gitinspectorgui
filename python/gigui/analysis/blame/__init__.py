"""
GitInspectorGUI Blame Analysis Package.

This package provides comprehensive blame analysis capabilities including
line-by-line attribution, historical tracking, and stability metrics.
"""

from gigui.analysis.blame.engine import RepoBlame, RepoBlameHistory
from gigui.analysis.blame.models import Blame, LineData

__all__ = ["Blame", "LineData", "RepoBlame", "RepoBlameHistory"]
