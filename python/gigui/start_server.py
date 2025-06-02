#!/usr/bin/env python3
"""
Entry point for GitInspectorGUI HTTP API server.
"""

import sys
import argparse
from .http_server import start_server

def main():
    """Main entry point for the HTTP server."""
    parser = argparse.ArgumentParser(description="GitInspectorGUI HTTP API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind to")
    
    args = parser.parse_args()
    
    try:
        start_server(host=args.host, port=args.port)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()