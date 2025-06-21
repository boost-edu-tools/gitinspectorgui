#!/usr/bin/env python3
"""
Test suite for the migrated utility functions.

This test suite verifies that all utility functions from the legacy system
have been properly migrated and work correctly in the enhanced system.
"""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from gigui.utils import (
    divide_to_percentage,
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
    ensure_directory_exists,
    Keys,
)


class TestUtilityFunctions(unittest.TestCase):
    """Test cases for utility functions."""

    def test_divide_to_percentage(self):
        """Test percentage calculation function."""
        # Normal cases
        self.assertEqual(divide_to_percentage(50, 100), 50.0)
        self.assertEqual(divide_to_percentage(25, 100), 25.0)
        self.assertEqual(divide_to_percentage(1, 3), 33.0)  # rounded

        # Edge cases
        self.assertTrue(str(divide_to_percentage(0, 100)) == "nan")
        self.assertTrue(str(divide_to_percentage(100, 0)) == "nan")
        self.assertTrue(str(divide_to_percentage(0, 0)) == "nan")

    def test_get_digit(self):
        """Test single digit validation function."""
        # Valid cases
        self.assertEqual(get_digit("0"), 0)
        self.assertEqual(get_digit("5"), 5)
        self.assertEqual(get_digit("9"), 9)
        self.assertEqual(get_digit(7), 7)

        # Invalid cases
        with self.assertRaises(Exception):
            get_digit("10")
        with self.assertRaises(Exception):
            get_digit("-1")
        with self.assertRaises(Exception):
            get_digit("abc")

    def test_get_pos_number(self):
        """Test positive number validation function."""
        # Valid cases
        self.assertEqual(get_pos_number("0"), 0)
        self.assertEqual(get_pos_number("10"), 10)
        self.assertEqual(get_pos_number("100"), 100)
        self.assertEqual(get_pos_number(50), 50)

        # Invalid cases
        with self.assertRaises(Exception):
            get_pos_number("-1")
        with self.assertRaises(Exception):
            get_pos_number("abc")

    def test_get_pos_number_or_empty(self):
        """Test positive number or empty validation function."""
        # Valid cases
        self.assertEqual(get_pos_number_or_empty(""), 0)
        self.assertEqual(get_pos_number_or_empty("0"), 0)
        self.assertEqual(get_pos_number_or_empty("10"), 10)

        # Invalid cases
        with self.assertRaises(Exception):
            get_pos_number_or_empty("-1")

    def test_get_outfile_name(self):
        """Test output filename generation."""
        # Test prefix
        result = get_outfile_name(Keys.prefix, "report.html", "myrepo")
        self.assertEqual(result, "myrepo-report.html")

        # Test postfix
        result = get_outfile_name(Keys.postfix, "report.html", "myrepo")
        self.assertEqual(result, "report.html-myrepo")

        # Test no fix
        result = get_outfile_name(Keys.nofix, "report.html", "myrepo")
        self.assertEqual(result, "report.html")

    def test_get_relative_fstr(self):
        """Test relative file string generation."""
        # With subfolder
        result = get_relative_fstr("/project/src/file.py", "/project")
        self.assertEqual(result, "src/file.py")

        result = get_relative_fstr("/project/file.py", "/project")
        self.assertEqual(result, "file.py")

        # Without subfolder match
        result = get_relative_fstr("/other/file.py", "/project")
        self.assertEqual(result, "//other/file.py")

        # Empty subfolder
        result = get_relative_fstr("/project/file.py", "")
        self.assertEqual(result, "/project/file.py")

    def test_strip_quotes(self):
        """Test quote stripping function."""
        self.assertEqual(strip_quotes('"hello"'), "hello")
        self.assertEqual(strip_quotes("'hello'"), "hello")
        self.assertEqual(strip_quotes("hello"), "hello")
        self.assertEqual(strip_quotes('""'), "")
        self.assertEqual(strip_quotes("''"), "")

    def test_non_hex_chars_in_list(self):
        """Test non-hexadecimal character detection."""
        # All hex
        result = non_hex_chars_in_list(["abc123", "DEF456"])
        self.assertEqual(result, [])

        # Mixed
        result = non_hex_chars_in_list(["abc123", "xyz789"])
        self.assertEqual(set(result), {"x", "y", "z"})

    def test_path_conversion_functions(self):
        """Test path conversion functions."""
        # Test POSIX conversion
        test_path = "folder/file.txt"
        posix_result = to_posix_fstr(test_path)
        self.assertEqual(posix_result, "folder/file.txt")

        # Test system conversion
        system_result = to_system_fstr(test_path)
        self.assertIsInstance(system_result, str)

        # Test list conversions
        test_paths = ["folder1/file1.txt", "folder2/file2.txt"]
        posix_results = to_posix_fstrs(test_paths)
        self.assertEqual(len(posix_results), 2)

        system_results = to_system_fstrs(test_paths)
        self.assertEqual(len(system_results), 2)

    def test_get_version(self):
        """Test version retrieval function."""
        version = get_version()
        self.assertIsInstance(version, str)
        self.assertTrue(len(version) > 0)

    def test_enhanced_utility_functions(self):
        """Test enhanced utility functions added for the new system."""
        # Test file extension
        self.assertEqual(get_file_extension("file.txt"), "txt")
        self.assertEqual(get_file_extension("file.tar.gz"), "gz")
        self.assertEqual(get_file_extension("file"), "")

        # Test bytes formatting
        self.assertEqual(format_bytes(1024), "1.0 KB")
        self.assertEqual(format_bytes(1048576), "1.0 MB")
        self.assertEqual(format_bytes(500), "500.0 B")

        # Test safe division
        self.assertEqual(safe_divide(10, 2), 5.0)
        self.assertEqual(safe_divide(10, 0), 0.0)
        self.assertEqual(safe_divide(10, 0, -1), -1.0)

        # Test string truncation
        self.assertEqual(truncate_string("hello world", 10), "hello w...")
        self.assertEqual(truncate_string("hello", 10), "hello")
        self.assertEqual(truncate_string("hello world", 5, ".."), "hel..")

    def test_file_validation(self):
        """Test file path validation function."""
        # Test with temporary file
        with tempfile.NamedTemporaryFile() as tmp_file:
            is_valid, error = validate_file_path(tmp_file.name)
            self.assertTrue(is_valid)
            self.assertEqual(error, "")

        # Test with non-existent file
        is_valid, error = validate_file_path("/non/existent/file.txt")
        self.assertFalse(is_valid)
        self.assertIn("does not exist", error)

    def test_directory_creation(self):
        """Test directory creation function."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            test_dir = Path(tmp_dir) / "new" / "nested" / "directory"

            # Directory should not exist initially
            self.assertFalse(test_dir.exists())

            # Create directory
            result = ensure_directory_exists(str(test_dir))
            self.assertTrue(result)
            self.assertTrue(test_dir.exists())

            # Should work even if directory already exists
            result = ensure_directory_exists(str(test_dir))
            self.assertTrue(result)


class TestKeysClass(unittest.TestCase):
    """Test cases for Keys class."""

    def test_keys_constants(self):
        """Test that Keys class has required constants."""
        self.assertEqual(Keys.prefix, "prefix")
        self.assertEqual(Keys.postfix, "postfix")
        self.assertEqual(Keys.nofix, "nofix")


if __name__ == "__main__":
    unittest.main()
