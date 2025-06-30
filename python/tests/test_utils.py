#!/usr/bin/env python3
"""Test suite for the migrated utility functions.

This test suite verifies that all utility functions from the legacy system
have been properly migrated and work correctly in the enhanced system.
"""

import tempfile
import unittest
from pathlib import Path

import pytest
from gigui import (
    Keys,
    divide_to_percentage,
    ensure_directory_exists,
    format_bytes,
    get_digit,
    get_file_extension,
    get_outfile_name,
    get_pos_number,
    get_pos_number_or_empty,
    get_relative_fstr,
    get_version,
    non_hex_chars_in_list,
    safe_divide,
    strip_quotes,
    to_posix_fstr,
    to_posix_fstrs,
    to_system_fstr,
    to_system_fstrs,
    truncate_string,
    validate_file_path,
)


class TestUtilityFunctions(unittest.TestCase):
    """Test cases for utility functions."""

    def test_divide_to_percentage(self) -> None:
        """Test percentage calculation function."""
        # Normal cases
        assert divide_to_percentage(50, 100) == 50.0
        assert divide_to_percentage(25, 100) == 25.0
        assert divide_to_percentage(1, 3) == 33.0  # rounded

        # Edge cases
        assert str(divide_to_percentage(0, 100)) == "nan"
        assert str(divide_to_percentage(100, 0)) == "nan"
        assert str(divide_to_percentage(0, 0)) == "nan"

    def test_get_digit(self) -> None:
        """Test single digit validation function."""
        # Valid cases
        assert get_digit("0") == 0
        assert get_digit("5") == 5
        assert get_digit("9") == 9
        assert get_digit(7) == 7

        # Invalid cases
        with pytest.raises(Exception):
            get_digit("10")
        with pytest.raises(Exception):
            get_digit("-1")
        with pytest.raises(Exception):
            get_digit("abc")

    def test_get_pos_number(self) -> None:
        """Test positive number validation function."""
        # Valid cases
        assert get_pos_number("0") == 0
        assert get_pos_number("10") == 10
        assert get_pos_number("100") == 100
        assert get_pos_number(50) == 50

        # Invalid cases
        with pytest.raises(Exception):
            get_pos_number("-1")
        with pytest.raises(Exception):
            get_pos_number("abc")

    def test_get_pos_number_or_empty(self) -> None:
        """Test positive number or empty validation function."""
        # Valid cases
        assert get_pos_number_or_empty("") == 0
        assert get_pos_number_or_empty("0") == 0
        assert get_pos_number_or_empty("10") == 10

        # Invalid cases
        with pytest.raises(Exception):
            get_pos_number_or_empty("-1")

    def test_get_outfile_name(self) -> None:
        """Test output filename generation."""
        # Test prefix
        result = get_outfile_name(Keys.prefix, "report.html", "myrepo")
        assert result == "myrepo-report.html"

        # Test postfix
        result = get_outfile_name(Keys.postfix, "report.html", "myrepo")
        assert result == "report.html-myrepo"

        # Test no fix
        result = get_outfile_name(Keys.nofix, "report.html", "myrepo")
        assert result == "report.html"

    def test_get_relative_fstr(self) -> None:
        """Test relative file string generation."""
        # With subfolder
        result = get_relative_fstr("/project/src/file.py", "/project")
        assert result == "src/file.py"

        result = get_relative_fstr("/project/file.py", "/project")
        assert result == "file.py"

        # Without subfolder match
        result = get_relative_fstr("/other/file.py", "/project")
        assert result == "//other/file.py"

        # Empty subfolder
        result = get_relative_fstr("/project/file.py", "")
        assert result == "/project/file.py"

    def test_strip_quotes(self) -> None:
        """Test quote stripping function."""
        assert strip_quotes('"hello"') == "hello"
        assert strip_quotes("'hello'") == "hello"
        assert strip_quotes("hello") == "hello"
        assert strip_quotes('""') == ""
        assert strip_quotes("''") == ""

    def test_non_hex_chars_in_list(self) -> None:
        """Test non-hexadecimal character detection."""
        # All hex
        result = non_hex_chars_in_list(["abc123", "DEF456"])
        assert result == []

        # Mixed
        result = non_hex_chars_in_list(["abc123", "xyz789"])
        assert set(result) == {"x", "y", "z"}

    def test_path_conversion_functions(self) -> None:
        """Test path conversion functions."""
        # Test POSIX conversion
        test_path = "folder/file.txt"
        posix_result = to_posix_fstr(test_path)
        assert posix_result == "folder/file.txt"

        # Test system conversion
        system_result = to_system_fstr(test_path)
        assert isinstance(system_result, str)

        # Test list conversions
        test_paths = ["folder1/file1.txt", "folder2/file2.txt"]
        posix_results = to_posix_fstrs(test_paths)
        assert len(posix_results) == 2

        system_results = to_system_fstrs(test_paths)
        assert len(system_results) == 2

    def test_get_version(self) -> None:
        """Test version retrieval function."""
        version = get_version()
        assert isinstance(version, str)
        assert len(version) > 0

    def test_enhanced_utility_functions(self) -> None:
        """Test enhanced utility functions added for the new system."""
        # Test file extension
        assert get_file_extension("file.txt") == "txt"
        assert get_file_extension("file.tar.gz") == "gz"
        assert get_file_extension("file") == ""

        # Test bytes formatting
        assert format_bytes(1024) == "1.0 KB"
        assert format_bytes(1048576) == "1.0 MB"
        assert format_bytes(500) == "500.0 B"

        # Test safe division
        assert safe_divide(10, 2) == 5.0
        assert safe_divide(10, 0) == 0.0
        assert safe_divide(10, 0, -1) == -1.0

        # Test string truncation
        assert truncate_string("hello world", 10) == "hello w..."
        assert truncate_string("hello", 10) == "hello"
        assert truncate_string("hello world", 5, "..") == "hel.."

    def test_file_validation(self) -> None:
        """Test file path validation function."""
        # Test with temporary file
        with tempfile.NamedTemporaryFile() as tmp_file:
            is_valid, error = validate_file_path(tmp_file.name)
            assert is_valid
            assert error == ""

        # Test with non-existent file
        is_valid, error = validate_file_path("/non/existent/file.txt")
        assert not is_valid
        assert "does not exist" in error

    def test_directory_creation(self) -> None:
        """Test directory creation function."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            test_dir = Path(tmp_dir) / "new" / "nested" / "directory"

            # Directory should not exist initially
            assert not test_dir.exists()

            # Create directory
            result = ensure_directory_exists(str(test_dir))
            assert result
            assert test_dir.exists()

            # Should work even if directory already exists
            result = ensure_directory_exists(str(test_dir))
            assert result


class TestKeysClass(unittest.TestCase):
    """Test cases for Keys class."""

    def test_keys_constants(self) -> None:
        """Test that Keys class has required constants."""
        assert Keys.prefix == "prefix"
        assert Keys.postfix == "postfix"
        assert Keys.nofix == "nofix"


if __name__ == "__main__":
    unittest.main()
