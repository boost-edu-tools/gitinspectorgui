"""
Test suite for Legacy Engine Wrapper.

This module provides comprehensive testing for the legacy engine wrapper,
ensuring proper integration between the current API and the sophisticated
legacy analysis engine.

Test Coverage:
- Settings translation from GUI to legacy format
- Result conversion from legacy to GUI format
- Performance monitoring and metrics
- Error handling and graceful degradation
- Integration with all migrated components
- Backward compatibility preservation
"""

import pytest
import tempfile
import time
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

from gigui.legacy_engine import (
    LegacyEngineWrapper, SettingsTranslator, ResultConverter,
    PerformanceMonitor, PerformanceMetrics
)
from gigui.api import Settings, AnalysisResult, RepositoryResult, AuthorStat, FileStat, BlameEntry
from gigui.data import IniRepo, Stat, CommitGroup, PersonStat
from gigui.person_data import Person
from gigui.repo_data import RepoData
from gigui.typedefs import FileStr, Author, Email, SHA


class TestSettingsTranslator:
    """Test settings translation from GUI to legacy format."""
    
    def test_basic_settings_translation(self):
        """Test basic settings translation to legacy format."""
        settings = Settings(
            input_fstrs=["/test/repo"],
            depth=10,
            n_files=20,
            extensions=["py", "js"],
            ex_authors=["test@example.com"],
            multithread=True,
            verbosity=1
        )
        
        translator = SettingsTranslator()
        ini_repo = translator.translate_to_legacy_args(settings)
        
        assert isinstance(ini_repo, IniRepo)
        assert ini_repo.location == Path("/test/repo")
        assert ini_repo.name == "repo"
        assert ini_repo.args['depth'] == 10
        assert ini_repo.args['n_files'] == 20
        assert ini_repo.args['extensions'] == ["py", "js"]
        assert ini_repo.args['ex_authors'] == ["test@example.com"]
        assert ini_repo.args['multithread'] is True
        assert ini_repo.args['verbosity'] == 1
    
    def test_advanced_settings_translation(self):
        """Test advanced settings translation including patterns and performance options."""
        settings = Settings(
            input_fstrs=["/test/repo"],
            ex_author_patterns=["*bot*", "ci-*"],
            ex_email_patterns=["*@noreply.github.com"],
            max_thread_workers=8,
            git_log_chunk_size=200,
            memory_limit_mb=2048,
            enable_gc_optimization=True,
            blame_follow_moves=True,
            html_theme="dark",
            excel_freeze_panes=True
        )
        
        translator = SettingsTranslator()
        ini_repo = translator.translate_to_legacy_args(settings)
        
        assert ini_repo.args['ex_author_patterns'] == ["*bot*", "ci-*"]
        assert ini_repo.args['ex_email_patterns'] == ["*@noreply.github.com"]
        assert ini_repo.args['max_thread_workers'] == 8
        assert ini_repo.args['git_log_chunk_size'] == 200
        assert ini_repo.args['memory_limit_mb'] == 2048
        assert ini_repo.args['enable_gc_optimization'] is True
        assert ini_repo.args['blame_follow_moves'] is True
        assert ini_repo.args['html_theme'] == "dark"
        assert ini_repo.args['excel_freeze_panes'] is True
    
    def test_empty_input_repositories_error(self):
        """Test error handling for empty input repositories."""
        settings = Settings(input_fstrs=[])
        
        translator = SettingsTranslator()
        
        with pytest.raises(ValueError, match="No input repositories specified"):
            translator.translate_to_legacy_args(settings)
    
    def test_none_values_handling(self):
        """Test proper handling of None values in settings."""
        settings = Settings(
            input_fstrs=["/test/repo"],
            ex_authors=None,
            ex_emails=None,
            extensions=None,
            file_formats=None
        )
        
        translator = SettingsTranslator()
        ini_repo = translator.translate_to_legacy_args(settings)
        
        assert ini_repo.args['ex_authors'] == []
        assert ini_repo.args['ex_emails'] == []
        # Extensions get default values from Settings.__post_init__
        assert len(ini_repo.args['extensions']) > 0  # Should have default extensions
        assert ini_repo.args['file_formats'] == ['html']


class TestResultConverter:
    """Test result conversion from legacy to GUI format."""
    
    def create_mock_repo_data(self):
        """Create mock RepoData for testing."""
        mock_repo_data = Mock(spec=RepoData)
        mock_repo_data.path = Path("/test/repo")
        
        # Mock author statistics
        mock_person1 = Mock(spec=Person)
        mock_person1.author = "Alice Developer"
        mock_person1.emails = {"alice@example.com"}
        
        mock_stat1 = Mock(spec=Stat)
        mock_stat1.shas = {"sha1", "sha2", "sha3"}
        mock_stat1.insertions = 1500
        mock_stat1.deletions = 200
        mock_stat1.percent_insertions = 45.5
        mock_stat1.age = "2:15:10"
        
        mock_pstat1 = Mock()
        mock_pstat1.person = mock_person1
        mock_pstat1.stat = mock_stat1
        mock_pstat1.fstrs = {"file1.py", "file2.py"}
        
        mock_person2 = Mock(spec=Person)
        mock_person2.author = "Bob Engineer"
        mock_person2.emails = {"bob@example.com"}
        
        mock_stat2 = Mock(spec=Stat)
        mock_stat2.shas = {"sha4", "sha5"}
        mock_stat2.insertions = 800
        mock_stat2.deletions = 100
        mock_stat2.percent_insertions = 24.2
        mock_stat2.age = "1:05:20"
        
        mock_pstat2 = Mock()
        mock_pstat2.person = mock_person2
        mock_pstat2.stat = mock_stat2
        mock_pstat2.fstrs = {"file3.py"}
        
        mock_repo_data.author2pstat = {
            "Alice Developer": mock_pstat1,
            "Bob Engineer": mock_pstat2,
            "*": Mock()  # Totals row
        }
        
        # Mock file statistics
        mock_fstat1 = Mock(spec=Stat)
        mock_fstat1.blame_line_count = 150
        mock_fstat1.shas = {"sha1", "sha2"}
        mock_fstat1.percent_lines = 35.0
        
        mock_fstat2 = Mock(spec=Stat)
        mock_fstat2.blame_line_count = 80
        mock_fstat2.shas = {"sha3"}
        mock_fstat2.percent_lines = 20.0
        
        mock_repo_data.fstr2fstat = {
            "file1.py": mock_fstat1,
            "file2.py": mock_fstat2,
            "*": Mock()  # Totals row
        }
        
        mock_repo_data.fstr2author2fstat = {
            "file1.py": {"Alice Developer": mock_fstat1},
            "file2.py": {"Alice Developer": mock_fstat2, "Bob Engineer": Mock()}
        }
        
        return mock_repo_data
    
    def test_convert_authors(self):
        """Test conversion of author statistics."""
        mock_repo_data = self.create_mock_repo_data()
        
        authors = ResultConverter._convert_authors(mock_repo_data)
        
        assert len(authors) == 2
        
        # Check first author (should be sorted by insertions)
        alice = authors[0]
        assert alice.name == "Alice Developer"
        assert alice.email == "alice@example.com"
        assert alice.commits == 3
        assert alice.insertions == 1500
        assert alice.deletions == 200
        assert alice.files == 2
        assert alice.percentage == 45.5
        assert alice.age == "2:15:10"
        
        # Check second author
        bob = authors[1]
        assert bob.name == "Bob Engineer"
        assert bob.email == "bob@example.com"
        assert bob.commits == 2
        assert bob.insertions == 800
        assert bob.deletions == 100
        assert bob.files == 1
        assert bob.percentage == 24.2
        assert bob.age == "1:05:20"
    
    def test_convert_files(self):
        """Test conversion of file statistics."""
        mock_repo_data = self.create_mock_repo_data()
        
        files = ResultConverter._convert_files(mock_repo_data)
        
        assert len(files) == 2
        
        # Check first file (should be sorted by lines)
        file1 = files[0]
        assert file1.name == "file1.py"
        assert file1.path == "file1.py"
        assert file1.lines == 150
        assert file1.commits == 2
        assert file1.authors == 1
        assert file1.percentage == 35.0
        
        # Check second file
        file2 = files[1]
        assert file2.name == "file2.py"
        assert file2.path == "file2.py"
        assert file2.lines == 80
        assert file2.commits == 1
        assert file2.authors == 2
        assert file2.percentage == 20.0
    
    def test_convert_blame_data(self):
        """Test conversion of blame data."""
        mock_repo_data = self.create_mock_repo_data()
        
        blame_data = ResultConverter._convert_blame_data(mock_repo_data)
        
        assert len(blame_data) > 0
        
        # Check blame entry structure
        for entry in blame_data:
            assert isinstance(entry, BlameEntry)
            assert entry.file in ["file1.py", "file2.py"]
            assert entry.line_number > 0
            assert entry.author in ["Alice Developer", "Bob Engineer"]
            assert entry.commit.startswith("legacy_commit_")
            assert entry.content.startswith("# Legacy analysis result")
    
    def test_full_conversion(self):
        """Test complete conversion from RepoData to AnalysisResult."""
        mock_repo_data = self.create_mock_repo_data()
        settings = Settings(input_fstrs=["/test/repo"])
        
        performance_metrics = PerformanceMetrics(
            start_time=time.time() - 10,
            end_time=time.time(),
            memory_usage_mb=256.0,
            repositories_processed=1,
            total_commits=5,
            total_files=2,
            total_authors=2,
            errors_encountered=0
        )
        
        result = ResultConverter.convert_repo_data_to_analysis_result(
            [mock_repo_data], settings, performance_metrics
        )
        
        assert isinstance(result, AnalysisResult)
        assert result.success is True
        assert result.error is None
        assert len(result.repositories) == 1
        
        repo = result.repositories[0]
        assert repo.name == "repo"
        assert repo.path == "/test/repo"
        assert len(repo.authors) == 2
        assert len(repo.files) == 2
        assert len(repo.blame_data) > 0
        
        # Check for performance entry
        performance_entries = [entry for entry in repo.blame_data 
                             if entry.file == "LEGACY_ENGINE_PERFORMANCE"]
        assert len(performance_entries) == 1
        assert "LEGACY ENGINE" in performance_entries[0].content


class TestPerformanceMonitor:
    """Test performance monitoring functionality."""
    
    def test_basic_monitoring(self):
        """Test basic performance monitoring workflow."""
        monitor = PerformanceMonitor()
        
        monitor.start_monitoring()
        assert monitor.start_time > 0
        
        time.sleep(0.1)  # Small delay for testing
        
        metrics = monitor.stop_monitoring(
            repositories_processed=1,
            total_commits=100,
            total_files=50,
            total_authors=5,
            errors=0
        )
        
        assert isinstance(metrics, PerformanceMetrics)
        assert metrics.duration_seconds > 0
        assert metrics.repositories_processed == 1
        assert metrics.total_commits == 100
        assert metrics.total_files == 50
        assert metrics.total_authors == 5
        assert metrics.errors_encountered == 0
        assert metrics.commits_per_second > 0
    
    def test_memory_monitoring(self):
        """Test memory usage monitoring."""
        monitor = PerformanceMonitor()
        
        monitor.start_monitoring()
        initial_memory = monitor.initial_memory
        
        monitor.update_peak_memory()
        assert monitor.peak_memory >= initial_memory
    
    def test_memory_monitoring_with_psutil(self):
        """Test memory monitoring with psutil available."""
        # Mock the entire psutil module
        with patch.dict('sys.modules', {'psutil': Mock()}):
            import sys
            mock_psutil = sys.modules['psutil']
            mock_process = Mock()
            mock_process.memory_info.return_value.rss = 1024 * 1024 * 100  # 100 MB
            mock_psutil.Process.return_value = mock_process
            
            monitor = PerformanceMonitor()
            memory_mb = monitor._get_memory_usage()
            
            assert memory_mb == 100.0  # 100 MB
    
    def test_memory_monitoring_fallback(self):
        """Test memory monitoring fallback when psutil unavailable."""
        # Mock psutil to raise ImportError
        with patch.dict('sys.modules', {'psutil': None}):
            with patch('resource.getrusage') as mock_getrusage:
                with patch('resource.RUSAGE_SELF', 0):
                    mock_usage = Mock()
                    mock_usage.ru_maxrss = 1024 * 50  # 50 MB (in KB)
                    mock_getrusage.return_value = mock_usage
                    
                    monitor = PerformanceMonitor()
                    memory_mb = monitor._get_memory_usage()
                    
                    assert memory_mb == 50.0  # 50 MB


class TestLegacyEngineWrapper:
    """Test the main legacy engine wrapper functionality."""
    
    def test_initialization(self):
        """Test wrapper initialization."""
        wrapper = LegacyEngineWrapper()
        
        assert isinstance(wrapper.settings_translator, SettingsTranslator)
        assert isinstance(wrapper.result_converter, ResultConverter)
        assert isinstance(wrapper.performance_monitor, PerformanceMonitor)
    
    def test_settings_validation_success(self):
        """Test successful settings validation."""
        wrapper = LegacyEngineWrapper()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            settings = Settings(
                input_fstrs=[temp_dir],
                max_thread_workers=4,
                memory_limit_mb=512
            )
            
            is_valid, error_msg = wrapper.validate_settings(settings)
            
            assert is_valid is True
            assert error_msg == ""
    
    def test_settings_validation_failure(self):
        """Test settings validation failure cases."""
        wrapper = LegacyEngineWrapper()
        
        # Test empty repositories
        settings = Settings(input_fstrs=[])
        is_valid, error_msg = wrapper.validate_settings(settings)
        assert is_valid is False
        assert "No input repositories specified" in error_msg
        
        # Test invalid path
        settings = Settings(input_fstrs=["/nonexistent/path"])
        is_valid, error_msg = wrapper.validate_settings(settings)
        assert is_valid is False
        assert "Invalid repository path" in error_msg
        
        # Test invalid thread workers
        with tempfile.TemporaryDirectory() as temp_dir:
            settings = Settings(
                input_fstrs=[temp_dir],
                max_thread_workers=0
            )
            is_valid, error_msg = wrapper.validate_settings(settings)
            assert is_valid is False
            assert "max_thread_workers must be at least 1" in error_msg
    
    def test_get_engine_info(self):
        """Test engine information retrieval."""
        wrapper = LegacyEngineWrapper()
        
        info = wrapper.get_engine_info()
        
        assert isinstance(info, dict)
        assert "engine_name" in info
        assert "version" in info
        assert "capabilities" in info
        assert "supported_formats" in info
        assert "performance_features" in info
        assert "filtering_features" in info
        
        assert "GitInspectorGUI Legacy Analysis Engine" in info["engine_name"]
        assert isinstance(info["capabilities"], list)
        assert len(info["capabilities"]) > 0
    
    @patch('gigui.legacy_engine.RepoData')
    def test_execute_analysis_success(self, mock_repo_data_class):
        """Test successful analysis execution."""
        # Mock RepoData creation and analysis
        mock_repo_data = Mock(spec=RepoData)
        mock_repo_data.path = Path("/test/repo")
        mock_repo_data.author2pstat = {"Alice": Mock()}
        mock_repo_data.fstr2fstat = {"file1.py": Mock()}
        mock_repo_data_class.return_value = mock_repo_data
        
        wrapper = LegacyEngineWrapper()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            settings = Settings(input_fstrs=[temp_dir])
            
            # Mock the result converter
            with patch.object(wrapper.result_converter, 'convert_repo_data_to_analysis_result') as mock_convert:
                mock_convert.return_value = AnalysisResult(
                    repositories=[RepositoryResult(
                        name="test",
                        path=temp_dir,
                        authors=[],
                        files=[],
                        blame_data=[]
                    )],
                    success=True
                )
                
                result = wrapper.execute_analysis(settings)
                
                assert isinstance(result, AnalysisResult)
                assert result.success is True
                assert len(result.repositories) == 1
    
    def test_execute_analysis_no_repositories(self):
        """Test analysis with no input repositories."""
        wrapper = LegacyEngineWrapper()
        settings = Settings(input_fstrs=[])
        
        result = wrapper.execute_analysis(settings)
        
        assert isinstance(result, AnalysisResult)
        assert result.success is False
        assert "No input repositories specified" in result.error
    
    def test_execute_analysis_invalid_paths(self):
        """Test analysis with invalid repository paths."""
        wrapper = LegacyEngineWrapper()
        settings = Settings(input_fstrs=["/nonexistent/path"])
        
        result = wrapper.execute_analysis(settings)
        
        assert isinstance(result, AnalysisResult)
        assert result.success is False
        assert "Invalid repository paths" in result.error
    
    @patch('gigui.legacy_engine.RepoData')
    def test_execute_analysis_with_errors(self, mock_repo_data_class):
        """Test analysis execution with repository processing errors."""
        # Make RepoData constructor raise an exception
        mock_repo_data_class.side_effect = Exception("Repository processing failed")
        
        wrapper = LegacyEngineWrapper()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            settings = Settings(input_fstrs=[temp_dir])
            
            result = wrapper.execute_analysis(settings)
            
            assert isinstance(result, AnalysisResult)
            assert result.success is False
            assert "No repositories could be processed" in result.error


class TestIntegration:
    """Test integration between components."""
    
    def test_settings_to_analysis_workflow(self):
        """Test complete workflow from settings to analysis result."""
        wrapper = LegacyEngineWrapper()
        
        # Create test settings
        settings = Settings(
            input_fstrs=["/test/repo"],
            depth=5,
            extensions=["py"],
            multithread=True,
            max_thread_workers=2
        )
        
        # Test settings validation
        with patch('gigui.legacy_engine.validate_file_path') as mock_validate:
            mock_validate.return_value = (True, "")
            
            is_valid, error_msg = wrapper.validate_settings(settings)
            assert is_valid is True
        
        # Test settings translation
        translator = SettingsTranslator()
        ini_repo = translator.translate_to_legacy_args(settings)
        
        assert ini_repo.args_dict['depth'] == 5
        assert ini_repo.args_dict['extensions'] == ["py"]
        assert ini_repo.args_dict['multithread'] is True
        assert ini_repo.args_dict['max_thread_workers'] == 2
    
    def test_error_handling_chain(self):
        """Test error handling throughout the processing chain."""
        wrapper = LegacyEngineWrapper()
        
        # Test with invalid settings
        settings = Settings(input_fstrs=[])
        
        # Validation should catch the error
        is_valid, error_msg = wrapper.validate_settings(settings)
        assert is_valid is False
        
        # Analysis should also catch the error
        result = wrapper.execute_analysis(settings)
        assert result.success is False
        assert result.error is not None
    
    def test_performance_monitoring_integration(self):
        """Test performance monitoring integration with analysis."""
        wrapper = LegacyEngineWrapper()
        
        # Test that performance monitor is properly initialized
        assert wrapper.performance_monitor.start_time == 0.0
        
        # Test that monitoring starts during analysis
        with tempfile.TemporaryDirectory() as temp_dir:
            settings = Settings(input_fstrs=[temp_dir])
            
            with patch('gigui.legacy_engine.RepoData') as mock_repo_data_class:
                mock_repo_data_class.side_effect = Exception("Test error")
                
                result = wrapper.execute_analysis(settings)
                
                # Even with errors, monitoring should have been attempted
                assert result.success is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])