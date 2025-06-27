# Application Monitoring

Monitoring and observability for GitInspectorGUI PyO3-based desktop application.

## Overview

GitInspectorGUI uses a single-process architecture with embedded Python via PyO3. Monitoring focuses on application performance, Python integration health, and desktop application responsiveness.

## Application Health Monitoring

### Development Mode Monitoring

```bash
# Start application with verbose logging
pnpm run tauri dev

# Monitor terminal output for:
# ✓ Python modules loaded successfully
# ✓ PyO3 integration initialized
# ✓ Tauri application started
# ✓ Frontend connected
```

### Production Application Status

**Application Process Monitoring:**

```bash
# Check if application is running (Unix-like systems)
ps aux | grep gitinspectorgui

# Monitor application process
top -p $(pgrep gitinspectorgui)

# Windows equivalent
tasklist | findstr gitinspectorgui
```

**Application Responsiveness:**

-   Desktop application window responds to user input
-   Analysis operations complete within expected timeframes
-   No application freezing during large repository analysis

## Performance Monitoring

### System Resource Usage

**Memory Monitoring:**

```bash
# Monitor memory usage (macOS/Linux)
ps -o pid,ppid,rss,vsz,comm -p $(pgrep gitinspectorgui)

# Detailed memory analysis
top -pid $(pgrep gitinspectorgui)

# Windows memory monitoring
tasklist /fi "imagename eq gitinspectorgui.exe" /fo table
```

**CPU Usage:**

```bash
# Monitor CPU usage (macOS/Linux)
top -p $(pgrep gitinspectorgui)

# Continuous monitoring
htop -p $(pgrep gitinspectorgui)
```

### Python Integration Performance

**PyO3 Performance Metrics:**

-   Function call latency between Rust and Python
-   Python memory usage within the embedded interpreter
-   GIL (Global Interpreter Lock) contention
-   Python exception frequency

**Analysis Performance:**

-   Repository analysis duration
-   Memory usage during large repository processing
-   Parallel processing efficiency
-   Git operation performance

## Logging and Observability

### Application Logging

**Development Logging:**

```bash
# Start with debug logging
RUST_LOG=debug pnpm run tauri dev

# Python-specific logging
PYTHONPATH=python python -c "
import logging
logging.basicConfig(level=logging.DEBUG)
from gigui.analysis import execute_analysis
# Test with debug logging enabled
"
```

**Production Logging Locations:**

-   **Windows:** `%APPDATA%/com.gitinspectorgui.app/logs/`
-   **macOS:** `~/Library/Logs/com.gitinspectorgui.app/`
-   **Linux:** `~/.local/share/com.gitinspectorgui.app/logs/`

### Structured Logging Implementation

**Python Analysis Logging:**

```python
# gigui/analysis/monitoring.py
import logging
import time
from functools import wraps

def monitor_analysis_performance(func):
    """Decorator to monitor analysis function performance."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        logger = logging.getLogger(func.__name__)

        try:
            logger.info(f"Starting {func.__name__}")
            result = func(*args, **kwargs)

            duration = time.time() - start_time
            logger.info(f"Completed {func.__name__} in {duration:.2f}s")

            return result

        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Failed {func.__name__} after {duration:.2f}s: {e}")
            raise

    return wrapper

@monitor_analysis_performance
def execute_analysis(settings):
    """Monitored analysis execution."""
    # Your analysis implementation
    pass
```

**Application Event Logging:**

```python
# Application lifecycle events
logging.info("Application started")
logging.info("Python interpreter initialized")
logging.info("PyO3 bindings loaded")
logging.info("Analysis engine ready")

# Performance events
logging.info(f"Repository analysis completed: {repo_count} repos in {duration:.2f}s")
logging.warning(f"Large repository detected: {repo_path} ({file_count} files)")
logging.error(f"Analysis failed for repository: {repo_path} - {error}")
```

## Error Monitoring

### Python Exception Tracking

**Exception Categories:**

-   **AnalysisError** - Git analysis failures
-   **RepositoryError** - Repository access issues
-   **ValidationError** - Input validation failures
-   **PyO3Error** - Python-Rust integration issues

**Error Logging Pattern:**

```python
import traceback
import logging

def log_analysis_error(error, context=None):
    """Log analysis errors with context."""
    error_info = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "traceback": traceback.format_exc(),
        "context": context or {}
    }

    logging.error(f"Analysis error: {error_info}")
```

### Application Crash Detection

**Crash Monitoring:**

```bash
# Check for application crashes (Unix-like)
dmesg | grep gitinspectorgui

# Check system logs for crashes
journalctl -u gitinspectorgui --since "1 hour ago"

# macOS crash reports
ls ~/Library/Logs/DiagnosticReports/ | grep GitInspectorGUI
```

**Common Crash Patterns:**

-   Segmentation faults in PyO3 integration
-   Out of memory errors during large repository analysis
-   Python import errors on application startup
-   File permission errors accessing repositories

## Performance Metrics

### Key Performance Indicators

**Application Performance:**

-   Application startup time
-   Memory usage baseline and peak
-   CPU usage during analysis
-   Analysis throughput (repositories per minute)

**Python Integration:**

-   PyO3 function call overhead
-   Python memory usage within embedded interpreter
-   Exception rate in Python functions
-   GIL acquisition time

### Performance Monitoring Script

```bash
#!/bin/bash
# monitor_performance.sh

APP_NAME="gitinspectorgui"
LOG_FILE="performance_$(date +%Y%m%d_%H%M%S).log"

echo "Starting performance monitoring for $APP_NAME" | tee $LOG_FILE

while true; do
    if pgrep $APP_NAME > /dev/null; then
        # Get process stats
        PID=$(pgrep $APP_NAME)
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

        # Memory usage (RSS in KB)
        MEMORY=$(ps -o rss= -p $PID)

        # CPU usage
        CPU=$(ps -o %cpu= -p $PID)

        echo "$TIMESTAMP - PID: $PID, Memory: ${MEMORY}KB, CPU: ${CPU}%" | tee -a $LOG_FILE
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Application not running" | tee -a $LOG_FILE
    fi

    sleep 10
done
```

## Alerting and Notifications

### Performance Thresholds

**Memory Usage Alerts:**

-   Warning: > 1GB memory usage
-   Critical: > 2GB memory usage
-   Alert: Memory growth rate > 100MB/minute

**Analysis Performance Alerts:**

-   Warning: Analysis taking > 5 minutes for single repository
-   Critical: Analysis timeout (> 15 minutes)
-   Alert: High error rate (> 10% failed analyses)

### Health Check Implementation

```python
# gigui/analysis/health.py
import psutil
import time
from typing import Dict, Any

def get_application_health() -> Dict[str, Any]:
    """Get comprehensive application health status."""

    process = psutil.Process()

    return {
        "timestamp": time.time(),
        "status": "healthy",
        "memory": {
            "rss": process.memory_info().rss,
            "vms": process.memory_info().vms,
            "percent": process.memory_percent()
        },
        "cpu": {
            "percent": process.cpu_percent(),
            "times": process.cpu_times()._asdict()
        },
        "python": {
            "interpreter_ready": True,
            "modules_loaded": check_python_modules(),
            "pyo3_status": "connected"
        },
        "analysis": {
            "engine_ready": True,
            "last_analysis_time": get_last_analysis_time(),
            "error_count": get_recent_error_count()
        }
    }

def check_python_modules() -> bool:
    """Verify critical Python modules are available."""
    try:
        from gigui.analysis import execute_analysis
        return True
    except ImportError:
        return False
```

## Troubleshooting Monitoring Issues

### Common Monitoring Problems

**High Memory Usage:**

```bash
# Identify memory leaks
valgrind --tool=memcheck --leak-check=full ./target/release/gitinspectorgui

# Python memory profiling
python -m memory_profiler your_analysis_script.py
```

**Performance Degradation:**

```bash
# Profile application performance
perf record -g ./target/release/gitinspectorgui
perf report

# Python profiling
python -m cProfile -o analysis.prof your_analysis_script.py
```

**PyO3 Integration Issues:**

```bash
# Debug PyO3 integration
RUST_LOG=pyo3=debug pnpm run tauri dev

# Check Python interpreter status
python -c "import sys; print(f'Python {sys.version} at {sys.executable}')"
```

## Best Practices

### Monitoring Guidelines

1. **Monitor resource usage** during development and testing
2. **Set up automated health checks** for production deployments
3. **Log performance metrics** for analysis optimization
4. **Track error patterns** to identify common issues
5. **Monitor Python integration** for PyO3-specific problems

### Performance Optimization

1. **Profile before optimizing** - Measure actual bottlenecks
2. **Monitor memory growth** - Detect leaks early
3. **Track analysis performance** - Optimize for large repositories
4. **Test under load** - Verify performance with multiple repositories

### Operational Monitoring

1. **Application lifecycle** - Startup, shutdown, crash recovery
2. **User experience** - Response times, error rates
3. **System resources** - Memory, CPU, disk usage
4. **Integration health** - PyO3, Python interpreter status

This monitoring approach provides comprehensive observability for the PyO3-based desktop application without the complexity of HTTP endpoint monitoring or multi-server coordination.
