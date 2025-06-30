"""Utility functions for GitInspectorGUI.

This module provides essential utility functions for path manipulation,
percentage calculations, string formatting, and various helper functions.
Migrated from the original gitinspectorgui-old codebase with enhanced
type definitions and settings compatibility.
"""

import argparse
import platform
import subprocess
import threading
import time
from cProfile import Profile
from io import StringIO
from multiprocessing.synchronize import Event as multiprocessingEvent
from pathlib import Path
from pstats import Stats
from typing import Any

from gigui.typedefs import FileStr

# Constants
STDOUT = True
DEFAULT_WRAP_WIDTH = 88


# Keys for compatibility with legacy system
class Keys:
    """Key constants for configuration and settings."""

    prefix = "prefix"
    postfix = "postfix"
    nofix = "nofix"


def log(
    message: Any, text_color: str | None = None, end: str = "\n", flush: bool = False
) -> None:
    """Simple logging function for compatibility with legacy system.
    In the enhanced system, this provides basic console output.
    """
    print(message, end=end, flush=flush)


def open_file(fstr: FileStr) -> None:
    """Open a file using the system's default application.

    Args:
        fstr: File path to open

    Raises:
        RuntimeError: If the platform is not supported

    """
    if fstr:
        match platform.system():
            case "Darwin":
                subprocess.run(["open", fstr], check=True)
            case "Linux":
                subprocess.run(["xdg-open", fstr], check=True)
            case "Windows":
                subprocess.run(["start", "", fstr], check=True, shell=True)
            case _:
                msg = f"Unknown platform {platform.system()}"
                raise RuntimeError(msg)


def log_end_time(start_time: float) -> None:
    """Output the amount of passed time since 'start_time'.

    Args:
        start_time: Start time in seconds (from time.time())

    """
    end_time = time.time()
    log(f"Analysis done in {end_time - start_time:.1f} s.")


def get_outfile_name(fix: str, outfile_base: str, repo_name: str) -> FileStr:
    """Generate output filename based on prefix/postfix configuration.

    Args:
        fix: Type of fix to apply ("prefix", "postfix", or other)
        outfile_base: Base filename for output
        repo_name: Name of the repository

    Returns:
        Generated filename with appropriate prefix/postfix

    """
    base_name = Path(outfile_base).name
    if fix == Keys.prefix:
        outfile_name = repo_name + "-" + base_name
    elif fix == Keys.postfix:
        outfile_name = base_name + "-" + repo_name
    else:
        outfile_name = base_name
    return outfile_name


def divide_to_percentage(dividend: int, divisor: int) -> float:
    """Calculate percentage from dividend and divisor.

    Args:
        dividend: Numerator value
        divisor: Denominator value

    Returns:
        Percentage value rounded to nearest integer, or NaN if invalid

    """
    if dividend and divisor:
        return round(dividend / divisor * 100)
    return float("NaN")


def get_digit(arg: Any) -> int:
    """Validate and convert argument to single digit integer.

    Args:
        arg: Value to convert and validate

    Returns:
        Single digit integer (0-9)

    Raises:
        argparse.ArgumentTypeError: If value is not a valid single digit

    """
    try:
        arg = int(arg)
        if 0 <= arg < 10:
            return arg
        raise ValueError
    except (TypeError, ValueError) as e:
        msg = f"Invalid value '{arg}', use a single digit integer >= 0."
        raise argparse.ArgumentTypeError(
            msg
        ) from e


def get_pos_number(arg: Any) -> int:
    """Validate and convert argument to positive integer.

    Args:
        arg: Value to convert and validate

    Returns:
        Positive integer (>= 0)

    Raises:
        argparse.ArgumentTypeError: If value is not a valid positive integer

    """
    try:
        arg = int(arg)
        if arg >= 0:
            return arg
        raise ValueError
    except (TypeError, ValueError) as e:
        msg = f"Invalid value '{arg}', use a positive integer number."
        raise argparse.ArgumentTypeError(
            msg
        ) from e


def get_pos_number_or_empty(arg: Any) -> int:
    """Validate and convert argument to positive integer or handle empty string.

    Args:
        arg: Value to convert and validate

    Returns:
        Positive integer (>= 0) or 0 for empty string

    Raises:
        argparse.ArgumentTypeError: If value is not valid

    """
    if arg == "":
        return 0
    try:
        arg = int(arg)
        if arg >= 0:
            return arg
        raise ValueError
    except (TypeError, ValueError) as e:
        msg = f"Invalid value '{arg}', use a positive integer number or empty string \"\"."
        raise argparse.ArgumentTypeError(
            msg
        ) from e


def get_relative_fstr(fstr: str, subfolder: str) -> str:
    """Get relative file path string based on subfolder.

    Args:
        fstr: File path string
        subfolder: Subfolder to make path relative to

    Returns:
        Relative file path string

    """
    if len(subfolder):
        if fstr.startswith(subfolder):
            relative_fstr = fstr[len(subfolder) :]
            if relative_fstr.startswith("/"):
                return relative_fstr[1:]
            return relative_fstr
        return "/" + fstr
    return fstr


def get_version() -> str:
    """Get version string from version.txt file.

    Returns:
        Version string

    Note:
        In the enhanced system, this looks for version.txt in the same directory
        as this module. If not found, returns a default version.

    """
    try:
        my_dir = Path(__file__).resolve().parent
        version_file = my_dir / "version.txt"
        with open(version_file, encoding="utf-8") as file:
            return file.read().strip()
    except FileNotFoundError:
        # Return default version for enhanced system
        return "2.0.0-enhanced"


def out_profile(profiler: Profile | None, nr_lines: int) -> None:
    """Output profiling results.

    Args:
        profiler: Profile object to analyze
        nr_lines: Number of lines to output (0 to disable, >100 to dump to file)

    """

    def log_profile(profile: Profile, sort: str) -> None:
        io_stream = StringIO()
        stats = Stats(profile, stream=io_stream).strip_dirs()
        stats.sort_stats(sort).print_stats(nr_lines)
        s = io_stream.getvalue()
        log(s)

    if nr_lines:
        assert profiler is not None
        log("Profiling results:")
        profiler.disable()
        if 0 < nr_lines < 100:
            log_profile(profiler, "cumulative")
            log_profile(profiler, "time")
        else:
            stats = Stats(profiler).strip_dirs()
            log("printing to: gigui.prof")
            stats.dump_stats("gigui.prof")


def non_hex_chars_in_list(s_list: list[str]) -> list[str]:
    """Find non-hexadecimal characters in a list of strings.

    Args:
        s_list: List of strings to check

    Returns:
        List of non-hexadecimal characters found

    """
    hex_chars = set("0123456789abcdefABCDEF")
    return [c for s in s_list for c in s if c not in hex_chars]


def to_posix_fstr(fstr: str) -> str:
    """Convert file path string to POSIX format.

    Args:
        fstr: File path string

    Returns:
        POSIX-formatted file path string

    """
    if not fstr:
        return fstr
    return Path(fstr).as_posix()


def to_posix_fstrs(fstrs: list[str]) -> list[str]:
    """Convert list of file path strings to POSIX format.

    Args:
        fstrs: List of file path strings

    Returns:
        List of POSIX-formatted file path strings

    """
    return [to_posix_fstr(fstr) for fstr in fstrs]


def to_system_fstr(fstr: FileStr) -> FileStr:
    """Convert file path string to system-specific format.

    Args:
        fstr: File path string

    Returns:
        System-specific file path string

    """
    if not fstr:
        return fstr
    return str(Path(fstr))


def to_system_fstrs(fstrs: list[str]) -> list[str]:
    """Convert list of file path strings to system-specific format.

    Args:
        fstrs: List of file path strings

    Returns:
        List of system-specific file path strings

    """
    return [to_system_fstr(fstr) for fstr in fstrs]


def get_dir_matches(input_fstrs: list[FileStr]) -> list[FileStr]:
    """Get directory matches for input file patterns.

    Normally, the input paths have already been expanded by the shell, but in case the
    wildcard were protected in quotes, we expand them here.

    Args:
        input_fstrs: List of file path patterns

    Returns:
        List of matching directory paths

    """
    matching_fstrs: list[FileStr] = []
    for pattern in input_fstrs:
        matches: list[FileStr] = get_posix_dir_matches_for(pattern)
        for match in matches:
            if match not in matching_fstrs:
                matching_fstrs.append(match)
    return matching_fstrs


def get_posix_dir_matches_for(pattern: FileStr) -> list[FileStr]:
    """Return a list of posix directories that match the pattern and are not hidden.

    The pattern is case insensitive.
    If the pattern is absolute, the search is done in the root directory.
    If the pattern is relative, the search is done in the current directory.
    The pattern can be posix or windows style.

    Args:
        pattern: File path pattern to match

    Returns:
        List of matching POSIX directory paths

    """
    base_path: Path
    no_drive_pattern: str

    pattern = strip_quotes(pattern)  # Remove quotes from the pattern.
    if not pattern:
        return []
    pattern_path: Path = Path(pattern)

    if platform.system() == "Windows":
        no_drive_pattern = pattern_path.as_posix().replace(pattern_path.drive, "", 1)
        # Note that on Windows, Path("/").is_absolute() is False, but
        # Path("C:/").is_absolute() is True.
        if pattern_path.is_absolute() or pattern_path.as_posix().startswith("/"):
            rel_pattern = no_drive_pattern[1:]  # type: ignore
            base_path = Path(pattern_path.drive) / "/"
        else:
            rel_pattern = no_drive_pattern
            base_path = (
                Path.cwd()
                if pattern_path.drive in {Path.cwd().drive, ""}
                else Path(pattern_path.drive) / "/"
            )
        if rel_pattern == ".":
            # Path("/").glob(".") crashes
            # Path.cwd().glob(".") crashes
            return [str(base_path)]
    else:  # macOS or Linux
        if pattern_path.is_absolute():
            rel_pattern = pattern_path.relative_to(Path("/")).as_posix()
            base_path = Path("/")
        else:
            rel_pattern = pattern
            base_path = Path.cwd()
        if rel_pattern == ".":
            # Path("/").glob(".") crashes
            # Path.cwd().glob(".") crashes
            return [str(base_path)]

    if not rel_pattern:
        return []
    matches: list[FileStr] = [
        path.as_posix()
        for path in base_path.glob(rel_pattern, case_sensitive=False)
        # Match only directories that are not hidden.
        if path.is_dir() and not path.name.startswith(".")
    ]
    return matches


def resolve_and_strip_input_fstrs(input_fstrs: list[FileStr]) -> list[FileStr]:
    """Resolve and strip input file path strings.

    If the input _fstrs are not absolute, resolve them to absolute posix file strings.
    If an input_fstr item equals  `.`, it is replaced with the current working directory.

    Args:
        input_fstrs: List of input file path strings

    Returns:
        List of resolved absolute POSIX file path strings

    """
    input_fstrs_posix: list[FileStr] = [
        Path(strip_quotes(fstr)).resolve().as_posix()  # strip enclosing '' and ""
        for fstr in input_fstrs
    ]
    return input_fstrs_posix


def strip_quotes(s: str) -> str:
    """Remove quotes from the string.

    Args:
        s: String to strip quotes from

    Returns:
        String with leading/trailing quotes removed

    """
    return s.strip("'\"")  # Does nothing if the string is not quoted.


def print_threads(message: str) -> None:
    """Print information about current threads for debugging.

    Args:
        message: Message to display with thread information

    """
    time.sleep(0.05)
    print(f"\n{message}:")
    for thread in threading.enumerate():
        print(
            f"  Thread Name: {thread.name}, Thread State: "
            f"{'Alive' if thread.is_alive() else 'Dead'}"
        )
    print()


def sigint_handler(
    signum: int, frame: Any, sigint_event: multiprocessingEvent | threading.Event
) -> None:
    """Handle SIGINT signal.

    Args:
        signum: Signal number
        frame: Current stack frame
        sigint_event: Event to set when signal is received

    """
    sigint_event.set()  # Only used for single core in this main process


def setup_sigint_handler(sigint_event: multiprocessingEvent | threading.Event) -> None:
    """Setup SIGINT signal handler.

    Args:
        sigint_event: Event to set when signal is received

    Note:
        Currently disabled in the enhanced system for compatibility.
        Signal handling can be enabled by uncommenting the signal.signal calls.

    """
    # signal.signal(
    #     signal.SIGINT,
    #     lambda signum, frame: sigint_handler(
    #         signum,
    #         frame,
    #         sigint_event,  # type: ignore
    #     ),
    # )
    # signal.signal(
    #     signal.SIGTERM,
    #     lambda signum, frame: sigint_handler(
    #         signum,
    #         frame,
    #         sigint_event,  # type: ignore
    #     ),
    # )


# Enhanced utility functions for the new system
def validate_file_path(file_path: str) -> tuple[bool, str]:
    """Validate if a file path is valid and accessible.

    Args:
        file_path: Path to validate

    Returns:
        Tuple of (is_valid, error_message)

    """
    try:
        path = Path(file_path)
        if not path.exists():
            return False, f"Path does not exist: {file_path}"
        if not path.is_file() and not path.is_dir():
            return False, f"Path is neither file nor directory: {file_path}"
        return True, ""
    except Exception as e:
        return False, f"Invalid path: {e}"


def ensure_directory_exists(dir_path: str) -> bool:
    """Ensure a directory exists, creating it if necessary.

    Args:
        dir_path: Directory path to ensure exists

    Returns:
        True if directory exists or was created successfully

    """
    try:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        return True
    except Exception:
        return False


def get_file_extension(file_path: str) -> str:
    """Get file extension from file path.

    Args:
        file_path: Path to get extension from

    Returns:
        File extension (without dot) or empty string if no extension

    """
    return Path(file_path).suffix.lstrip(".")


def format_bytes(bytes_value: int) -> str:
    """Format bytes value into human-readable string.

    Args:
        bytes_value: Number of bytes

    Returns:
        Formatted string (e.g., "1.5 MB")

    """
    value = float(bytes_value)
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if value < 1024.0:
            return f"{value:.1f} {unit}"
        value /= 1024.0
    return f"{value:.1f} PB"


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safely divide two numbers, returning default if denominator is zero.

    Args:
        numerator: Numerator value
        denominator: Denominator value
        default: Default value to return if division by zero

    Returns:
        Result of division or default value

    """
    if denominator == 0:
        return default
    return numerator / denominator


def truncate_string(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate string to maximum length with optional suffix.

    Args:
        text: Text to truncate
        max_length: Maximum length including suffix
        suffix: Suffix to add when truncating

    Returns:
        Truncated string

    """
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix
