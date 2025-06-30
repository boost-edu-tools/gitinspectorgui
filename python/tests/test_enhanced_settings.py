#!/usr/bin/env python3
"""Test script for enhanced Settings class with legacy integration features.

This script tests the new advanced configuration options, performance tuning,
and pattern-based filtering capabilities.
"""

import tempfile
from pathlib import Path

from gigui.api import GitInspectorAPI, Settings
from gigui.core.person_manager import Person


def test_basic_settings_creation() -> None:
    """Test basic Settings creation with defaults."""
    print("Testing basic Settings creation...")

    settings = Settings(input_fstrs=["test_repo"])

    # Test basic defaults
    assert settings.depth == 5
    assert settings.n_files == 5
    assert settings.multithread
    assert settings.blame_exclusions == "hide"
    assert settings.view == "auto"
    assert settings.fix == "prefix"

    # Test new advanced defaults
    assert settings.max_thread_workers == 6
    assert settings.git_log_chunk_size == 100
    assert settings.blame_chunk_size == 20
    assert settings.memory_limit_mb == 1024
    assert settings.enable_gc_optimization

    print("✓ Basic settings creation works correctly")


def test_advanced_filtering_patterns() -> None:
    """Test advanced pattern-based filtering."""
    print("Testing advanced filtering patterns...")

    settings = Settings(
        input_fstrs=["test_repo"],
        ex_author_patterns=["bot-*", "*automated*"],
        ex_email_patterns=["*@noreply.github.com", "ci-*"],
        ex_message_patterns=["Merge pull request*", "Auto-generated*"],
        ex_file_patterns=["*.generated.*", "build/*"],
    )

    # Test that patterns are properly initialized
    assert "bot-*" in settings.ex_author_patterns
    assert "*@noreply.github.com" in settings.ex_email_patterns
    assert "Merge pull request*" in settings.ex_message_patterns
    assert "*.generated.*" in settings.ex_file_patterns

    print("✓ Advanced filtering patterns work correctly")


def test_performance_settings() -> None:
    """Test performance optimization settings."""
    print("Testing performance settings...")

    settings = Settings(input_fstrs=["test_repo"])

    # Test large repository configuration
    settings.configure_for_large_repository()
    assert settings.multithread
    assert settings.multicore
    assert settings.memory_limit_mb == 2048
    assert settings.git_log_chunk_size == 200
    assert settings.enable_gc_optimization

    # Test small repository configuration
    settings.configure_for_small_repository()
    assert not settings.multithread
    assert not settings.multicore
    assert settings.memory_limit_mb == 512
    assert settings.git_log_chunk_size == 50

    print("✓ Performance settings work correctly")


def test_blame_analysis_configuration() -> None:
    """Test blame analysis configuration options."""
    print("Testing blame analysis configuration...")

    settings = Settings(
        input_fstrs=["test_repo"],
        blame_follow_moves=True,
        blame_ignore_whitespace=True,
        blame_minimal_context=False,
        blame_show_email=True,
        ignore_revs_file=".git-blame-ignore-revs",
        enable_ignore_revs=True,
    )

    assert settings.blame_follow_moves
    assert settings.blame_ignore_whitespace
    assert settings.blame_show_email
    assert settings.ignore_revs_file == ".git-blame-ignore-revs"
    assert settings.enable_ignore_revs

    print("✓ Blame analysis configuration works correctly")


def test_output_format_options() -> None:
    """Test output format and display options."""
    print("Testing output format options...")

    settings = Settings(
        input_fstrs=["test_repo"],
        output_encoding="utf-8",
        date_format="iso",
        author_display_format="both",
        line_number_format="decimal",
        excel_max_rows=500000,
        excel_abbreviate_names=False,
        html_theme="dark",
        html_enable_search=True,
        html_max_entries_per_page=50,
    )

    assert settings.output_encoding == "utf-8"
    assert settings.date_format == "iso"
    assert settings.author_display_format == "both"
    assert settings.excel_max_rows == 500000
    assert settings.html_theme == "dark"
    assert settings.html_max_entries_per_page == 50

    print("✓ Output format options work correctly")


def test_settings_validation() -> bool:
    """Test settings validation."""
    print("Testing settings validation...")

    # Test valid settings
    try:
        Settings(
            input_fstrs=["test_repo"],
            n_files=10,
            depth=3,
            max_thread_workers=4,
            memory_limit_mb=512,
            fix="postfix",
            view="dynamic-blame-history",
            blame_exclusions="show",
            date_format="short",
            author_display_format="email",
        )
        print("✓ Valid settings accepted")
    except ValueError as e:
        print(f"✗ Valid settings rejected: {e}")
        return False

    # Test invalid settings
    invalid_cases = [
        {"n_files": -1},
        {"depth": -1},
        {"max_thread_workers": 0},
        {"memory_limit_mb": 32},
        {"fix": "invalid"},
        {"view": "invalid"},
        {"blame_exclusions": "invalid"},
        {"date_format": "invalid"},
        {"author_display_format": "invalid"},
    ]

    for invalid_case in invalid_cases:
        try:
            Settings(input_fstrs=["test_repo"], **invalid_case)
            print(f"✗ Invalid setting {invalid_case} was accepted")
            return False
        except ValueError:
            pass  # Expected

    print("✓ Settings validation works correctly")
    return True


def test_person_filtering() -> bool:
    """Test enhanced Person filtering with patterns."""
    print("Testing Person filtering...")

    settings = Settings(
        input_fstrs=["test_repo"],
        ex_author_patterns=["bot-*", "*automated*"],
        ex_email_patterns=["*@noreply.github.com"],
        ex_authors=["GitHub Actions"],
        ex_emails=["noreply@example.com"],
    )

    # Configure Person class
    Person.ex_author_patterns = settings.ex_author_patterns + settings.ex_authors
    Person.ex_email_patterns = settings.ex_email_patterns + settings.ex_emails

    # Test filtering
    test_cases = [
        ("bot-user", "bot@example.com", True),  # Should be filtered (pattern match)
        (
            "automated-system",
            "auto@example.com",
            True,
        ),  # Should be filtered (pattern match)
        ("user", "user@noreply.github.com", True),  # Should be filtered (pattern match)
        (
            "GitHub Actions",
            "actions@github.com",
            True,
        ),  # Should be filtered (exact match)
        ("normal-user", "user@example.com", False),  # Should not be filtered
    ]

    for author, email, should_be_filtered in test_cases:
        person = Person(author, email)
        if person.filter_matched != should_be_filtered:
            print(
                f"✗ Filtering failed for {author}/{email}: expected {should_be_filtered}, got {person.filter_matched}"
            )
            return False

    print("✓ Person filtering works correctly")
    return True


def test_legacy_compatibility() -> bool:
    """Test legacy format conversion."""
    print("Testing legacy compatibility...")

    settings = Settings(
        input_fstrs=["test_repo"],
        depth=3,
        n_files=10,
        extensions=["py", "js"],
        ex_authors=["bot"],
        multithread=False,
        verbosity=2,
    )

    legacy_format = settings.to_legacy_format()

    # Check that all legacy fields are present
    expected_fields = [
        "input_fstrs",
        "depth",
        "n_files",
        "extensions",
        "ex_authors",
        "multithread",
        "verbosity",
        "outfile_base",
        "fix",
        "view",
    ]

    for field in expected_fields:
        if field not in legacy_format:
            print(f"✗ Legacy field {field} missing")
            return False

    # Check values
    assert legacy_format["depth"] == 3
    assert legacy_format["n_files"] == 10
    assert legacy_format["extensions"] == ["py", "js"]
    assert legacy_format["ex_authors"] == ["bot"]
    assert not legacy_format["multithread"]
    assert legacy_format["verbosity"] == 2

    print("✓ Legacy compatibility works correctly")
    return True


def test_settings_persistence() -> bool | None:
    """Test settings save/load functionality."""
    print("Testing settings persistence...")

    # Create test settings
    original_settings = Settings(
        input_fstrs=["test_repo"],
        depth=7,
        n_files=15,
        ex_author_patterns=["bot-*"],
        memory_limit_mb=2048,
        html_theme="dark",
        blame_follow_moves=False,
    )

    # Test with temporary file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        temp_path = f.name

    try:
        # Save settings
        api = GitInspectorAPI()
        api.settings_file = Path(temp_path)
        api.save_settings(original_settings)

        # Load settings
        loaded_settings = api.get_settings()

        # Compare key fields
        assert loaded_settings.depth == original_settings.depth
        assert loaded_settings.n_files == original_settings.n_files
        assert loaded_settings.memory_limit_mb == original_settings.memory_limit_mb
        assert loaded_settings.html_theme == original_settings.html_theme
        assert (
            loaded_settings.blame_follow_moves == original_settings.blame_follow_moves
        )

        print("✓ Settings persistence works correctly")
        return True

    finally:
        # Cleanup
        Path(temp_path).unlink(missing_ok=True)


def test_helper_methods() -> bool:
    """Test helper methods."""
    print("Testing helper methods...")

    settings = Settings(
        input_fstrs=["test_repo"],
        extensions=[],  # Will be set to default
        ex_authors=["user1"],
        ex_author_patterns=["bot-*"],
        ex_emails=["spam@example.com"],
        ex_email_patterns=["*@noreply.*"],
    )

    # Test effective extensions
    effective_extensions = settings.get_effective_extensions()
    assert len(effective_extensions) > 0
    assert "py" in effective_extensions

    # Test exclusion patterns
    all_patterns = settings.get_all_exclusion_patterns()
    assert "user1" in all_patterns["authors"]
    assert "bot-*" in all_patterns["authors"]
    assert "spam@example.com" in all_patterns["emails"]
    assert "*@noreply.*" in all_patterns["emails"]

    # Test performance optimization check
    settings.multithread = True
    settings.max_thread_workers = 4
    settings.git_log_chunk_size = 100
    settings.enable_gc_optimization = True
    assert settings.is_performance_optimized()

    # Test memory settings
    memory_settings = settings.get_memory_settings()
    assert "memory_limit_mb" in memory_settings
    assert "git_log_chunk_size" in memory_settings

    print("✓ Helper methods work correctly")
    return True


def main() -> bool:
    """Run all tests."""
    print("Running Enhanced Settings Tests")
    print("=" * 50)

    tests = [
        test_basic_settings_creation,
        test_advanced_filtering_patterns,
        test_performance_settings,
        test_blame_analysis_configuration,
        test_output_format_options,
        test_settings_validation,
        test_person_filtering,
        test_legacy_compatibility,
        test_settings_persistence,
        test_helper_methods,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            result = test()
            if result is not False:
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} failed with exception: {e}")
            failed += 1
        print()

    print("=" * 50)
    print(f"Tests completed: {passed} passed, {failed} failed")

    if failed == 0:
        print(
            "🎉 All tests passed! Enhanced Settings integration is working correctly."
        )
        return True
    print("❌ Some tests failed. Please check the implementation.")
    return False


if __name__ == "__main__":
    main()
