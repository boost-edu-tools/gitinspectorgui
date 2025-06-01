"""
Type definitions for GitInspectorGUI.

This module contains type aliases used throughout the application,
migrated from the original gitinspectorgui-old codebase.
"""

# Basic types
type Author = str
type Email = str
type FileStr = str
type FilePattern = str
type Row = list[str | int | float]
type BrowserID = str

# Git-related types
type OID = str  # Object ID = long commit SHA, 40 chars
type SHA = str  # short commit SHA, often 7 chars
type Rev = OID | SHA  # long or short commit SHA

# Output types
type HtmlStr = str
type BlameStr = str  # Output of git blame command

# Data structure types
type RowsBools = tuple[list[Row], list[bool]]