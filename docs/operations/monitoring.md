# Monitoring and Logging

Essential monitoring and logging for GitInspectorGUI.

## Health Monitoring

### API Health Check

```bash
# Check server status
curl http://127.0.0.1:8080/health
```

**Response:**

```json
{
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-06-05T21:04:00.000Z"
}
```

### Performance Metrics

```bash
# Performance stats
curl http://127.0.0.1:8080/api/performance_stats

# Engine info
curl http://127.0.0.1:8080/api/engine_info
```

## Logging

### Development Mode

```bash
# Debug logging
python -m gigui.start_server --log-level DEBUG

# Tauri logging
pnpm run tauri dev
```

### Log Locations

-   **API Server**: Console output
-   **Tauri App**: Terminal output
-   **Frontend**: Browser DevTools Console

### Log Levels

-   `DEBUG`: Detailed execution info
-   `INFO`: General operations
-   `WARNING`: Potential issues
-   `ERROR`: Error conditions
-   `CRITICAL`: Severe errors

## System Monitoring

### Resource Usage

```bash
# CPU and memory (macOS/Linux)
top -pid $(pgrep -f "gigui.start_server")
htop -p $(pgrep -f "gigui.start_server")

# Windows: Task Manager → Python processes
```

### Service Status

```bash
# API server health
curl -f http://127.0.0.1:8080/health || echo "Server down"

# Port usage
lsof -i :8080  # macOS/Linux
netstat -an | findstr :8080  # Windows
```

### Performance Metrics

-   Memory usage during large analyses
-   Disk I/O for temporary files
-   Network connectivity for remote repos

## Error Tracking

### Common Errors

**API Connection:**

-   Server not running on port 8080
-   Firewall blocking connections
-   Port conflicts

**Analysis Issues:**

-   Invalid repository paths
-   Insufficient permissions
-   Out of memory
-   Git command failures

### Log Analysis

```bash
# Find errors
grep -i error /path/to/logfile

# Real-time monitoring
tail -f /path/to/logfile | grep -i error
```

## Performance Metrics

### Analysis Performance

-   **Duration**: Analysis completion time
-   **Memory**: Peak consumption
-   **Repository**: Commits/files processed
-   **Success Rate**: Analysis success percentage

### System Resources

```bash
# Memory
free -h  # Linux
vm_stat  # macOS

# Disk space
df -h

# Processes
ps aux | grep -E "(gigui|tauri)"
```

## Health Checks

### API Health Script

```bash
#!/bin/bash
if curl -f http://127.0.0.1:8080/health > /dev/null 2>&1; then
    echo "✅ API healthy"
else
    echo "❌ API not responding"
fi
```

### Resource Alerts

```bash
#!/bin/bash
# Memory check
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
[ "$MEMORY_USAGE" -gt 90 ] && echo "⚠️ High memory: ${MEMORY_USAGE}%"

# Disk check
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
[ "$DISK_USAGE" -gt 90 ] && echo "⚠️ High disk: ${DISK_USAGE}%"
```

## Troubleshooting

### Log Analysis

```bash
# Recent errors
tail -100 /path/to/logfile | grep -i error

# Performance issues
grep -i "duration\|timeout\|slow" /path/to/logfile
```

### Common Issues

**High Memory:**

-   Reduce analysis scope
-   Close other apps
-   Restart application

**Slow Performance:**

-   Check system resources
-   Reduce parameters
-   Verify repo accessibility

**Connection Issues:**

-   Verify server running
-   Check port availability
-   Restart services

## Best Practices

1. **Regular health checks** - Monitor API endpoint
2. **Resource monitoring** - Watch memory/disk during analysis
3. **Log retention** - Balance troubleshooting needs with disk space
4. **Error tracking** - Investigate recurring issues
5. **Performance baselines** - Establish normal metrics

## Related

-   **[Maintenance](maintenance.md)** - System maintenance
-   **[Deployment](deployment.md)** - Production deployment
-   **[Troubleshooting](../development/troubleshooting.md)** - Issue resolution
