"""
Integration test for Legacy Engine Wrapper with current API.

This test verifies that the legacy engine wrapper integrates correctly
with the current API and can be used as a drop-in replacement.
"""

import tempfile
from pathlib import Path
from unittest.mock import Mock, patch

from gigui.api import Settings, GitInspectorAPI
from gigui.legacy_engine import legacy_engine


def test_legacy_engine_integration():
    """Test that legacy engine can be integrated with current API."""

    # Test engine info
    info = legacy_engine.get_engine_info()
    assert "GitInspectorGUI Legacy Analysis Engine" in info["engine_name"]
    assert "capabilities" in info
    assert len(info["capabilities"]) > 0

    # Test settings validation
    with tempfile.TemporaryDirectory() as temp_dir:
        settings = Settings(
            input_fstrs=[temp_dir], depth=5, extensions=["py", "js"], multithread=True
        )

        is_valid, error_msg = legacy_engine.validate_settings(settings)
        assert is_valid is True
        assert error_msg == ""


def test_legacy_engine_as_api_replacement():
    """Test using legacy engine as a replacement for current API analysis."""

    # Create a mock API that uses the legacy engine
    api = GitInspectorAPI()

    with tempfile.TemporaryDirectory() as temp_dir:
        # Create a test file in the temp directory
        test_file = Path(temp_dir) / "test.py"
        test_file.write_text("# Test file\nprint('Hello, World!')\n")

        settings = Settings(input_fstrs=[temp_dir], extensions=["py"], n_files=10)

        # Mock the RepoData to avoid actual git operations
        with patch("gigui.legacy_engine.RepoData") as mock_repo_data_class:
            # Create a mock repo data with minimal structure
            mock_repo_data = Mock()
            mock_repo_data.path = Path(temp_dir)
            mock_repo_data.author2pstat = {}
            mock_repo_data.fstr2fstat = {}
            mock_repo_data.fstr2author2fstat = {}
            mock_repo_data_class.return_value = mock_repo_data

            # Test that legacy engine can execute analysis
            result = legacy_engine.execute_analysis(settings)

            # Should return a valid result structure
            assert hasattr(result, "success")
            assert hasattr(result, "repositories")
            assert hasattr(result, "error")


def test_settings_translation_compatibility():
    """Test that settings translation maintains compatibility."""

    # Test with various settings configurations
    test_cases = [
        # Basic settings
        Settings(input_fstrs=["/test/repo"]),
        # Advanced settings
        Settings(
            input_fstrs=["/test/repo"],
            depth=10,
            n_files=20,
            extensions=["py", "js", "ts"],
            ex_authors=["bot@example.com"],
            multithread=True,
            max_thread_workers=4,
            memory_limit_mb=1024,
        ),
        # Pattern-based filtering
        Settings(
            input_fstrs=["/test/repo"],
            ex_author_patterns=["*bot*", "ci-*"],
            ex_email_patterns=["*@noreply.github.com"],
            blame_follow_moves=True,
            html_theme="dark",
        ),
    ]

    for settings in test_cases:
        # Test that settings can be translated without errors
        is_valid, error_msg = legacy_engine.validate_settings(settings)

        # Should either be valid or have a clear error message
        if not is_valid:
            assert error_msg != ""
            assert "No input repositories specified" not in error_msg or not settings.input_fstrs


if __name__ == "__main__":
    test_legacy_engine_integration()
    test_legacy_engine_as_api_replacement()
    test_settings_translation_compatibility()
    print("✅ All integration tests passed!")
