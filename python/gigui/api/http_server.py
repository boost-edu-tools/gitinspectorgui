"""
HTTP server wrapper for GitInspector API.

This module provides a FastAPI HTTP server that wraps the existing GitInspectorAPI
class, exposing all functionality through REST endpoints while preserving all
existing logic and capabilities.
"""

import logging
import time
import uuid
from datetime import datetime
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from gigui.api.main import GitInspectorAPI

# Import from existing types and API - no duplication
from gigui.api.types import AnalysisResult, Settings

# Configure logging - now we can log freely!
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), logging.FileHandler("gitinspector-api.log")],
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GitInspectorGUI API", description="HTTP API for GitInspector analysis", version="1.0.0"
)

# Add CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use existing API infrastructure
api_instance = GitInspectorAPI()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": str(uuid.uuid4()),
        },
    )


@app.get("/health")
async def health_check() -> dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "api_info": api_instance.get_engine_info(),
    }


@app.post("/api/execute_analysis", response_model=AnalysisResult)
async def execute_analysis(settings: Settings) -> AnalysisResult:
    """Execute git repository analysis using existing API infrastructure."""
    request_id = str(uuid.uuid4())
    start_time = time.time()
    logger.info(f"[{request_id}] Starting analysis for {len(settings.input_fstrs)} repositories")

    try:
        # Use existing API validation and execution
        validation_start = time.time()
        is_valid, error_msg = api_instance.validate_settings(settings)
        validation_time = time.time() - validation_start
        logger.info(f"[{request_id}] Settings validation took {validation_time:.3f}s")

        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Settings validation failed",
                    "message": error_msg,
                    "timestamp": datetime.utcnow().isoformat(),
                    "request_id": request_id,
                },
            )

        # Execute analysis using existing sophisticated API
        analysis_start = time.time()
        logger.info(f"[{request_id}] Starting API analysis execution...")
        result = api_instance.execute_analysis(settings)
        analysis_time = time.time() - analysis_start
        total_time = time.time() - start_time

        logger.info(
            f"[{request_id}] Analysis completed: {len(result.repositories)} repositories "
            f"(Analysis: {analysis_time:.3f}s, Total: {total_time:.3f}s)"
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"[{request_id}] Analysis failed after {total_time:.3f}s: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Analysis failed",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request_id,
                "duration_seconds": total_time,
            },
        )


@app.get("/api/settings", response_model=Settings)
async def get_settings() -> Settings:
    """Get current settings using existing API."""
    try:
        return api_instance.get_settings()
    except Exception as e:
        logger.error(f"Failed to get settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/settings")
async def save_settings(settings: Settings) -> dict[str, Any]:
    """Save settings using existing API."""
    try:
        api_instance.save_settings(settings)
        return {"success": True, "message": "Settings saved successfully"}
    except Exception as e:
        logger.error(f"Failed to save settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/engine_info")
async def get_engine_info() -> dict[str, Any]:
    """Get engine information and capabilities."""
    return api_instance.get_engine_info()


@app.get("/api/performance_stats")
async def get_performance_stats() -> dict[str, Any]:
    """Get API performance statistics."""
    return api_instance.get_performance_stats()


def start_server(host: str = "127.0.0.1", port: int = 8000):
    """Start the HTTP server."""
    logger.info(f"Starting GitInspectorGUI API server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    start_server()
