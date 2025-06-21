# GitInspectorGUI Python Backend Refactoring Proposal

## Current Issues

-   **Flat structure**: All modules in a single directory making navigation difficult
-   **Mixed concerns**: API, analysis engine, data models, and utilities all at the same level
-   **Large files**: Some modules (>1000 lines) are doing too much
-   **Circular dependencies**: Complex import relationships between modules
-   **AI readability**: Hard for AI assistants to understand the full scope and relationships

## Refined New Structure (Using Only Existing Files)

```
python/
├── gigui/
│   ├── __init__.py                    # Main package exports
│   │
│   ├── api/                          # Public API Layer
│   │   ├── __init__.py               # API exports (GitInspectorAPI, start_server)
│   │   ├── main.py                   # Main GitInspectorAPI class (from api.py)
│   │   ├── types.py                  # API data types (from api_types.py)
│   │   ├── http_server.py            # HTTP server (existing)
│   │   └── start_server.py           # Server startup (existing)
│   │
│   ├── core/                         # Core Analysis Engine
│   │   ├── __init__.py               # Core engine exports
│   │   ├── orchestrator.py           # Main analysis orchestrator (from repo_data.py)
│   │   ├── repository.py             # Repository operations (from repo_base.py)
│   │   ├── statistics.py             # Statistics calculation (from data.py)
│   │   ├── person_manager.py         # Person identity management (from person_data.py)
│   │   └── legacy_engine.py          # Legacy engine wrapper (existing)
│   │
│   ├── analysis/                     # Analysis Components
│   │   ├── __init__.py
│   │   ├── blame/                    # Blame Analysis
│   │   │   ├── __init__.py
│   │   │   ├── engine.py            # Main blame engine (from repo_blame.py - classes RepoBlame, RepoBlameHistory)
│   │   │   ├── reader.py            # Blame parser (from repo_blame.py - BlameReader class)
│   │   │   ├── base.py              # Blame base (from repo_blame.py - RepoBlameBase class)
│   │   │   └── models.py            # Blame data models (from repo_blame.py - LineData, Blame classes)
│   │   │
│   │   └── performance/              # Performance Monitoring
│   │       ├── __init__.py
│   │       └── monitor.py           # Performance monitoring (from performance_monitor.py)
│   │
│   ├── utils/                        # Utilities and Helpers
│   │   ├── __init__.py
│   │   └── common.py                # Common utilities (from utils.py)
│   │
│   ├── cli/                          # Command Line Interface
│   │   ├── __init__.py
│   │   └── interface.py             # CLI interface (from cli.py)
│   │
│   └── legacy/                       # Legacy Support Files
│       ├── __init__.py
│       └── typedefs.py              # Type definitions (existing)
│
├── tests/                           # Test Suite (Your 4 existing test files)
│   ├── __init__.py
│   ├── test_enhanced_settings.py    # Enhanced settings tests (existing)
│   ├── test_legacy_integration.py   # Legacy integration tests (existing)
│   ├── test_repo_data.py           # Repository data tests (existing)
│   └── test_utils.py               # Utility tests (existing)
│
├── tools/                           # Development and Debug Tools
│   ├── analyze_blame_data.py        # Diagnostic tools (existing)
│   ├── run_diagnosis.py             # Diagnostic runner (existing)
│   ├── build-api-sidecar.sh         # Build script (existing)
│   ├── build-cli-app.sh             # Build script (existing)
│   └── setup-api-sidecar.sh         # Setup script (existing)
│
├── main.py                          # Main entry point
├── dev_api.py                       # Development API (existing)
├── gitinspectorcli_main.py          # CLI main (existing)
└── pyproject.toml                   # Project configuration
```

## Key Refactoring Changes

### 1. **API Layer Organization**

**Split `api.py` (600+ lines) into focused modules:**

```python
# api/main.py (core GitInspectorAPI class)
from gigui.core.orchestrator import RepoDataOrchestrator
from gigui.api.types import Settings, AnalysisResult

class GitInspectorAPI:
    def __init__(self):
        self.orchestrator = RepoDataOrchestrator()

    def execute_analysis(self, settings: Settings) -> AnalysisResult:
        return self.orchestrator.execute_analysis(settings)

# api/types.py (clean data types from api_types.py)
from dataclasses import dataclass
from typing import List

@dataclass
class Settings:
    input_fstrs: List[str]
    # ... other fields

@dataclass
class AnalysisResult:
    repositories: List[RepositoryResult]
    success: bool
    error: str | None = None
```

### 2. **Core Analysis Engine Split**

**Split `repo_data.py` (400+ lines) and `repo_base.py` (800+ lines):**

```python
# core/orchestrator.py (main workflow coordination)
from gigui.core.repository import GitRepository
from gigui.core.statistics import StatisticsEngine

class RepoDataOrchestrator:
    def execute_analysis(self, settings):
        # Main analysis workflow
        repository = GitRepository(settings)
        stats_engine = StatisticsEngine()
        return stats_engine.generate_results(repository)

# core/repository.py (git operations and base functionality)
from gigui.analysis.blame.engine import BlameAnalysisEngine

class GitRepository:
    def __init__(self, settings):
        self.blame_engine = BlameAnalysisEngine()
        # Repository setup and git operations

# core/statistics.py (statistics calculation and tables)
class StatisticsEngine:
    def generate_results(self, repository):
        # Statistics table generation and calculations
```

### 3. **Blame Analysis Package**

**Split `repo_blame.py` (800+ lines) into focused components:**

```python
# analysis/blame/models.py
@dataclass
class LineData:
    line: str = ""
    line_nr: int = 0
    is_comment: bool = False

@dataclass
class Blame:
    author: str = ""
    email: str = ""
    # ... other fields

# analysis/blame/base.py
class RepoBlameBase:
    def get_blames_for(self, fstr, start_sha, i, i_max):
        # Base blame functionality

# analysis/blame/engine.py
from .base import RepoBlameBase

class RepoBlame(RepoBlameBase):
    def run_blame(self):
        # Main blame analysis

class RepoBlameHistory(RepoBlame):
    def generate_fr_blame_history(self, root_fstr, sha):
        # Historical blame tracking

# analysis/blame/reader.py
class BlameReader:
    def process_lines(self, root_fstr):
        # Git blame output parsing
```

### 4. **Utilities and Support**

**Organize utilities and move legacy support:**

```python
# utils/common.py (from utils.py)
def divide_to_percentage(dividend: int, divisor: int) -> float:
    # Utility functions

# legacy/typedefs.py (existing typedefs.py)
# Keep all type definitions for backward compatibility
```

### 5. **Test Structure Organization**

**Your 4 existing test files organized simply:**

```python
# tests/test_enhanced_settings.py (existing file)
# tests/test_legacy_integration.py (existing file)
# tests/test_repo_data.py (existing file)
# tests/test_utils.py (existing file)
```

## File Splitting Strategy

### Phase 1: Create Structure and Move Files (Week 1)

1. **Create new directory structure**
2. **Move existing files to new locations**:

    - `api_types.py` → `api/types.py`
    - `http_server.py` → `api/http_server.py`
    - `start_server.py` → `api/start_server.py`
    - `cli.py` → `cli/interface.py`
    - `utils.py` → `utils/common.py`
    - `performance_monitor.py` → `analysis/performance/monitor.py`
    - `legacy_engine.py` → `core/legacy_engine.py`
    - `typedefs.py` → `legacy/typedefs.py`

3. **Create comprehensive `__init__.py` files** with proper exports

### Phase 2: Split Large Files (Week 2)

1. **Split `api.py`**:

    ```python
    # api/main.py (core API class)
    # api/__init__.py (exports)
    ```

2. **Split `repo_data.py`**:

    ```python
    # core/orchestrator.py (main RepoData class)
    # core/statistics.py (StatTables class)
    ```

3. **Split `repo_base.py`**:

    ```python
    # core/repository.py (RepoBase class)
    ```

4. **Split `repo_blame.py`**:

    ```python
    # analysis/blame/base.py (RepoBlameBase)
    # analysis/blame/engine.py (RepoBlame, RepoBlameHistory)
    # analysis/blame/reader.py (BlameReader)
    # analysis/blame/models.py (LineData, Blame)
    ```

5. **Split remaining files**:
    ```python
    # data.py → core/statistics.py (Stat class and related)
    # person_data.py → core/person_manager.py
    ```

### Phase 3: Organize Tests (Week 3)

1. **Move your 4 existing test files to tests/ directory**:

    - `test_enhanced_settings.py` (existing)
    - `test_legacy_integration.py` (existing)
    - `test_repo_data.py` (existing)
    - `test_utils.py` (existing)

2. **Add only essential `__init__.py` for tests package**

### Phase 4: Clean Dependencies and Imports (Week 4)

1. **Update all import statements**
2. **Create clean `__init__.py` exports**
3. **Resolve any circular dependencies**
4. **Update documentation**

## Benefits of This Refined Refactoring

### 1. **Maintainability**

-   **Single responsibility**: Each module has a clear, focused purpose
-   **Logical organization**: Related functionality grouped together
-   **Manageable file sizes**: No file over 300 lines

### 2. **AI Development Support**

-   **Clear context**: AI can understand scope of each module
-   **Focused analysis**: Smaller files are easier to analyze
-   **Obvious relationships**: Package structure shows dependencies
-   **Test organization**: Clear test structure for validation

### 3. **Development Experience**

-   **Easy navigation**: Logical directory structure
-   **Clear interfaces**: Well-defined module boundaries
-   **Testing**: Comprehensive pytest structure
-   **Debugging**: Isolated components for easier troubleshooting

## Example: Clean Import Structure After Refactoring

```python
# Current (before refactoring)
from gigui.api import GitInspectorAPI, Settings
from gigui.repo_data import RepoData
from gigui.repo_blame import RepoBlame

# After refactoring
from gigui.api import GitInspectorAPI
from gigui.api.types import Settings, AnalysisResult
from gigui.core.orchestrator import RepoDataOrchestrator
from gigui.analysis.blame import BlameAnalysisEngine

# Clean, focused imports with clear intent and better IDE support
```

## Migration Commands

### Create Structure:

```bash
# Create new directory structure
mkdir -p gigui/{api,core,analysis/{blame,performance},utils,cli,legacy}
mkdir -p tests
mkdir -p tools

# Move existing files
mv api_types.py gigui/api/types.py
mv http_server.py gigui/api/http_server.py
mv start_server.py gigui/api/start_server.py
mv cli.py gigui/cli/interface.py
mv utils.py gigui/utils/common.py
mv performance_monitor.py gigui/analysis/performance/monitor.py
mv legacy_engine.py gigui/core/legacy_engine.py
mv typedefs.py gigui/legacy/typedefs.py

# Move your 4 test files
mv test_enhanced_settings.py tests/
mv test_legacy_integration.py tests/
mv test_repo_data.py tests/
mv test_utils.py tests/

# Move tools
mv analyze_blame_data.py tools/
mv run_diagnosis.py tools/
```
