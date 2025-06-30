"""Performance monitoring utilities for GitInspectorGUI analysis."""

import logging
import time
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any

import psutil

logger = logging.getLogger(__name__)


@dataclass
class PerformanceStep:
    name: str
    start_time: float
    end_time: float | None = None
    memory_before_mb: float = 0
    memory_after_mb: float = 0

    @property
    def duration_ms(self) -> float:
        if self.end_time is None:
            return 0
        return (self.end_time - self.start_time) * 1000

    @property
    def memory_delta_mb(self) -> float:
        return self.memory_after_mb - self.memory_before_mb


class PerformanceProfiler:
    """Detailed performance profiler for analysis operations."""

    def __init__(self) -> None:
        self.steps: dict[str, PerformanceStep] = {}
        self.current_step: str | None = None
        self.total_start_time = time.time()

    @contextmanager
    def step(self, name: str):
        """Context manager for timing analysis steps."""
        self.start_step(name)
        try:
            yield
        finally:
            self.end_step(name)

    def start_step(self, name: str) -> None:
        """Start timing a specific step."""
        if self.current_step:
            logger.warning(
                f"Starting step '{name}' while '{self.current_step}' is still active"
            )

        try:
            memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
        except:
            memory_mb = 0

        self.steps[name] = PerformanceStep(
            name=name, start_time=time.time(), memory_before_mb=memory_mb
        )
        self.current_step = name

        logger.info(f"Started step: {name} (Memory: {memory_mb:.1f}MB)")

    def end_step(self, name: str) -> None:
        """End timing a specific step."""
        if name not in self.steps:
            logger.error(f"Cannot end step '{name}' - not started")
            return

        step = self.steps[name]
        step.end_time = time.time()

        try:
            step.memory_after_mb = psutil.Process().memory_info().rss / 1024 / 1024
        except:
            step.memory_after_mb = step.memory_before_mb

        if self.current_step == name:
            self.current_step = None

        logger.info(
            f"Completed step: {name} ({step.duration_ms:.1f}ms, "
            f"Memory: {step.memory_after_mb:.1f}MB, "
            f"Delta: {step.memory_delta_mb:+.1f}MB)"
        )

    def get_summary(self) -> dict[str, Any]:
        """Get performance summary."""
        total_duration = time.time() - self.total_start_time

        summary = {"total_duration_ms": total_duration * 1000, "steps": {}}

        for name, step in self.steps.items():
            summary["steps"][name] = {
                "duration_ms": step.duration_ms,
                "memory_delta_mb": step.memory_delta_mb,
                "percentage_of_total": (step.duration_ms / (total_duration * 1000))
                * 100
                if total_duration > 0
                else 0,
            }

        return summary

    def log_summary(self) -> None:
        """Log performance summary."""
        summary = self.get_summary()
        logger.info("=== PERFORMANCE SUMMARY ===")
        logger.info(f"Total Duration: {summary['total_duration_ms']:.1f}ms")

        # Sort steps by duration
        sorted_steps = sorted(
            summary["steps"].items(), key=lambda x: x[1]["duration_ms"], reverse=True
        )

        for name, metrics in sorted_steps:
            logger.info(
                f"  {name}: {metrics['duration_ms']:.1f}ms "
                f"({metrics['percentage_of_total']:.1f}%) "
                f"[{metrics['memory_delta_mb']:+.1f}MB]"
            )


# Global profiler instance
profiler = PerformanceProfiler()
