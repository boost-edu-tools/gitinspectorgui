# Monitoring and Logging

Basic monitoring and logging for GitInspectorGUI.

## Overview

GitInspectorGUI consists of a Tauri desktop application with a Python HTTP API backend. This guide covers essential monitoring and logging practices.

## Health Monitoring

### Built-in Health Check

The HTTP API provides a health check endpoint:

```bash
# Check if the API server is running
curl http://127.0.0.1:8080/health
```

**Expected Response:**

```json
{
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-06-05T21:04:00.000Z",
    "uptime": 3600.5
}
```

### Performance Statistics

```bash
# Get performance metrics
curl http://127.0.0.1:8080/api/performance_stats
```

### Engine Information

```bash
# Get engine capabilities
curl http://127.0.0.1:8080/api/engine_info
```

## Application Logging

### Development Logging

When running in development mode, logs are displayed in the console:

```bash
# Start with debug logging
python -m gigui.start_server --log-level DEBUG

# Start Tauri with logging
npm run tauri dev
```

### Log Locations

-   **API Server**: Console output when running the Python server
-   **Tauri Application**: Terminal output during development
-   **Browser Console**: Frontend logs (accessible via DevTools)

### Log Levels

The Python API supports standard log levels:

-   `DEBUG`: Detailed execution information
-   `INFO`: General operational information
-   `WARNING`: Potential issues
-   `ERROR`: Error conditions
-   `CRITICAL`: Severe errors

## Basic Monitoring

### System Resource Monitoring

Monitor system resources during analysis:

```bash
# Monitor CPU and memory usage (macOS)
top -pid $(pgrep -f "gigui.start_server")

# Monitor CPU and memory usage (Linux)
htop -p $(pgrep -f "gigui.start_server")

# Windows Task Manager
# Look for Python processes related to GitInspectorGUI
```

### Application Monitoring

**Check if services are running:**

```bash
# Check if HTTP server is running
curl -f http://127.0.0.1:8080/health || echo "API server not running"

# Check if port 8080 is in use
lsof -i :8080  # macOS/Linux
netstat -an | findstr :8080  # Windows
```

**Monitor analysis performance:**

-   Watch memory usage during large repository analysis
-   Monitor disk I/O for temporary file operations
-   Check network connectivity if accessing remote repositories

## Error Tracking

### Common Error Patterns

**API Connection Errors:**

-   Server not running on port 8080
-   Firewall blocking local connections
-   Port conflicts with other applications

**Analysis Errors:**

-   Invalid repository paths
-   Insufficient permissions
-   Out of memory for large repositories
-   Git command failures

### Error Log Analysis

```bash
# Search for errors in logs
grep -i error /path/to/logfile

# Monitor logs in real-time
tail -f /path/to/logfile | grep -i error
```

## Performance Monitoring

### Analysis Performance

Monitor these metrics during repository analysis:

-   **Duration**: Time taken for analysis completion
-   **Memory Usage**: Peak memory consumption
-   **Repository Size**: Number of commits and files processed
-   **Success Rate**: Percentage of successful analyses

### System Performance

**Memory Usage:**

```bash
# Check available memory
free -h  # Linux
vm_stat  # macOS
```

**Disk Space:**

```bash
# Check disk usage
df -h  # macOS/Linux
```

**Process Monitoring:**

```bash
# Monitor GitInspectorGUI processes
ps aux | grep -E "(gigui|tauri)"
```

## Simple Alerting

### Basic Health Checks

Create a simple health check script:

```bash
#!/bin/bash
# health-check.sh

if curl -f http://127.0.0.1:8080/health > /dev/null 2>&1; then
    echo "✅ GitInspectorGUI API is healthy"
    exit 0
else
    echo "❌ GitInspectorGUI API is not responding"
    exit 1
fi
```

### Resource Alerts

Monitor critical resources:

```bash
#!/bin/bash
# resource-check.sh

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    echo "⚠️  High memory usage: ${MEMORY_USAGE}%"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "⚠️  High disk usage: ${DISK_USAGE}%"
fi
```

## Troubleshooting

### Log Analysis

**Find recent errors:**

```bash
# Last 100 lines with errors
tail -100 /path/to/logfile | grep -i error

# Errors from last hour
grep -i error /path/to/logfile | grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')"
```

**Performance issues:**

```bash
# Look for slow operations
grep -i "duration\|timeout\|slow" /path/to/logfile
```

### Common Issues

**High Memory Usage:**

-   Reduce repository analysis scope
-   Close other applications
-   Restart GitInspectorGUI

**Slow Performance:**

-   Check system resources
-   Reduce analysis parameters
-   Verify repository accessibility

**Connection Issues:**

-   Verify HTTP server is running
-   Check port 8080 availability
-   Restart both frontend and backend

## Best Practices

1. **Regular Health Checks**: Periodically verify the API health endpoint
2. **Resource Monitoring**: Keep an eye on memory and disk usage during large analyses
3. **Log Retention**: Keep logs for troubleshooting but manage disk space
4. **Error Tracking**: Monitor and investigate recurring errors
5. **Performance Baselines**: Establish normal performance metrics for comparison

This monitoring approach focuses on the essential aspects of keeping GitInspectorGUI running smoothly without unnecessary complexity.
