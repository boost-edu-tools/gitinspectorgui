# Architecture Diagrams

## Current Architecture (Problematic)

```mermaid
graph TB
    subgraph "Tauri Frontend"
        A[User Interface]
        B[commands.rs]
    end
    
    subgraph "Python Sidecar Process"
        C[api.py]
        D[Legacy Modules]
        E[stdout]
        F[stderr]
    end
    
    subgraph "Problems"
        G[Logging Messages]
        H[Print Statements]
        I[Progress Indicators]
        J[Debug Output]
    end
    
    A --> B
    B -->|execute_analysis| C
    C --> D
    D --> E
    G --> E
    H --> E
    I --> E
    J --> E
    E -->|Contaminated JSON| B
    F -->|Lost Errors| B
    B -->|Parse Error| A
    
    style E fill:#ffcccc
    style G fill:#ffcccc
    style H fill:#ffcccc
    style I fill:#ffcccc
    style J fill:#ffcccc
```

### Current Problems
- **Single Channel**: stdout used for both data and logging
- **Fragile Parsing**: Any contamination breaks JSON parsing
- **Lost Errors**: stderr gets discarded
- **Hard to Debug**: Can't log without breaking communication
- **Maintenance Burden**: Easy to accidentally break with innocent changes

## New HTTP Architecture (Robust)

```mermaid
graph TB
    subgraph "Tauri Frontend"
        A[User Interface]
        B[commands.rs]
        C[http_client.rs]
        D[server_manager.rs]
    end
    
    subgraph "Python HTTP Server"
        E[FastAPI Server]
        F[API Endpoints]
        G[GitInspectorAPI]
        H[Legacy Modules]
    end
    
    subgraph "Separate Channels"
        I[HTTP Request/Response]
        J[Log Files]
        K[stderr]
        L[Health Check]
    end
    
    A --> B
    B --> C
    C -->|HTTP POST| F
    F --> G
    G --> H
    F -->|JSON Response| C
    C --> B
    B --> A
    
    D -->|Start/Stop| E
    D -->|Health Check| L
    E --> J
    E --> K
    
    style I fill:#ccffcc
    style J fill:#ccffcc
    style K fill:#ccffcc
    style L fill:#ccffcc
```

### New Architecture Benefits
- **Dedicated Channels**: HTTP for data, files/stderr for logging
- **Robust Protocol**: HTTP status codes, headers, structured errors
- **Full Logging**: Complete debugging capability
- **Easy Testing**: Standard HTTP tools (curl, Postman, etc.)
- **Maintainable**: Clear separation of concerns

## Migration Strategy

```mermaid
graph LR
    subgraph "Phase 1: Foundation"
        A1[Create FastAPI Server]
        A2[Pydantic Models]
        A3[Basic Endpoints]
    end
    
    subgraph "Phase 2: Integration"
        B1[Tauri HTTP Client]
        B2[Server Management]
        B3[Feature Flag]
    end
    
    subgraph "Phase 3: Testing"
        C1[Unit Tests]
        C2[Integration Tests]
        C3[Performance Tests]
    end
    
    subgraph "Phase 4: Migration"
        D1[Default to HTTP]
        D2[Remove Sidecar]
        D3[Cleanup]
    end
    
    A1 --> A2 --> A3
    A3 --> B1 --> B2 --> B3
    B3 --> C1 --> C2 --> C3
    C3 --> D1 --> D2 --> D3
```

## Error Handling Comparison

### Current Error Handling (Limited)

```mermaid
graph TB
    A[Tauri Command] --> B[Sidecar Execution]
    B --> C{Exit Code}
    C -->|0| D[Parse stdout as JSON]
    C -->|!0| E[Return stderr as error]
    D --> F{JSON Valid?}
    F -->|Yes| G[Return Result]
    F -->|No| H[Parse Error - Lost Context]
    
    style H fill:#ffcccc
    style E fill:#ffcccc
```

### New Error Handling (Rich)

```mermaid
graph TB
    A[Tauri Command] --> B[HTTP Request]
    B --> C{HTTP Status}
    C -->|200| D[Parse JSON Response]
    C -->|4xx| E[Client Error with Details]
    C -->|5xx| F[Server Error with Context]
    D --> G[Return Result]
    E --> H[Structured Error Response]
    F --> I[Structured Error Response]
    
    subgraph "Error Details"
        J[Error Code]
        K[Message]
        L[Details Object]
        M[Request ID]
        N[Timestamp]
    end
    
    H --> J
    H --> K
    H --> L
    H --> M
    H --> N
    I --> J
    I --> K
    I --> L
    I --> M
    I --> N
    
    style G fill:#ccffcc
    style H fill:#ccffcc
    style I fill:#ccffcc
```

## Data Flow Comparison

### Current Data Flow (Fragile)

```mermaid
sequenceDiagram
    participant UI as Tauri UI
    participant CMD as commands.rs
    participant SC as Sidecar Process
    participant LOG as Logging System
    
    UI->>CMD: execute_analysis(settings)
    CMD->>SC: spawn process with args
    
    Note over SC,LOG: All output goes to stdout
    SC->>LOG: INFO: Starting analysis...
    LOG->>CMD: "INFO: Starting analysis..."
    SC->>CMD: {"repositories": [
    LOG->>CMD: "DEBUG: Processing repo..."
    SC->>CMD: ]}
    
    Note over CMD: JSON parsing fails!
    CMD->>UI: Error: "expected value at line 1 column 9"
```

### New Data Flow (Robust)

```mermaid
sequenceDiagram
    participant UI as Tauri UI
    participant CMD as commands.rs
    participant HTTP as HTTP Client
    participant API as FastAPI Server
    participant LOG as Log Files
    
    UI->>CMD: execute_analysis(settings)
    CMD->>HTTP: POST /api/execute_analysis
    HTTP->>API: HTTP Request with JSON
    
    Note over API,LOG: Separate channels
    API->>LOG: INFO: Starting analysis...
    API->>LOG: DEBUG: Processing repo...
    
    API->>HTTP: HTTP 200 + Clean JSON
    HTTP->>CMD: Parsed AnalysisResult
    CMD->>UI: Success with results
    
    Note over LOG: Full logging preserved
```

## Performance Considerations

### HTTP Overhead Analysis

```mermaid
graph LR
    subgraph "Sidecar Approach"
        A1[Process Spawn: ~50ms]
        A2[Python Import: ~200ms]
        A3[Analysis: Variable]
        A4[JSON Parse: ~1ms]
    end
    
    subgraph "HTTP Approach"
        B1[HTTP Request: ~1ms]
        B2[Server Ready: 0ms]
        B3[Analysis: Variable]
        B4[HTTP Response: ~1ms]
    end
    
    A1 --> A2 --> A3 --> A4
    B1 --> B2 --> B3 --> B4
    
    style A1 fill:#ffcccc
    style A2 fill:#ffcccc
    style B1 fill:#ccffcc
    style B2 fill:#ccffcc
```

**Performance Benefits:**
- **Faster Startup**: Server stays warm, no process spawn overhead
- **Faster Imports**: Python modules loaded once
- **Better Caching**: Server can cache expensive operations
- **Concurrent Requests**: Multiple analyses can run in parallel

## Security Considerations

```mermaid
graph TB
    subgraph "Security Measures"
        A[Local-only Binding]
        B[CORS Configuration]
        C[Request Validation]
        D[Error Sanitization]
        E[Process Isolation]
    end
    
    subgraph "Attack Vectors"
        F[Local Network Access]
        G[Malicious Requests]
        H[Path Traversal]
        I[Resource Exhaustion]
    end
    
    A -.->|Mitigates| F
    B -.->|Mitigates| G
    C -.->|Mitigates| H
    D -.->|Mitigates| I
    E -.->|Mitigates| I
```

**Security Features:**
- **Local Binding**: Server only accepts connections from localhost
- **CORS**: Restricted to Tauri origins
- **Input Validation**: Pydantic models validate all inputs
- **Error Sanitization**: No sensitive information in error responses
- **Process Isolation**: Server runs in separate process

This architecture provides a robust, maintainable, and secure foundation for the GitInspectorGUI application while completely eliminating the stdout contamination issues.