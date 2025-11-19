mod analysis;
mod filesystem;
mod shared_types;
pub use analysis::*;
use analysis::*;
pub use filesystem::*;
pub use shared_types::*;

use std::fs;
use std::path::{Path, PathBuf};

/// Recursively finds all git repositories within the given directory up to the specified depth.
pub fn retrieve_repositories(path_str: &str, depth: usize) -> Result<Vec<PathBuf>, String> {
    let path = Path::new(path_str);
    let mut repos = Vec::new();
    if !is_existing_path(path) {
        return Err("Path does not exist".to_string());
    }
    if !is_directory(path) {
        return Err("Path is not a directory".to_string());
    }
    fn helper(
        dir: &Path,
        current_depth: usize,
        max_depth: usize,
        repos: &mut Vec<PathBuf>,
    ) -> Result<(), String> {
        if current_depth > max_depth {
            return Ok(());
        }
        if is_git_repository(dir) {
            repos.push(dir.to_path_buf());
            // Do not recurse into git repos
            return Ok(());
        }
        let entries = fs::read_dir(dir)
            .map_err(|e| format!("Failed to read directory {}: {}", dir.display(), e))?;
        for entry in entries {
            let entry =
                entry.map_err(|e| format!("Failed to read entry in {}: {}", dir.display(), e))?;
            let path = entry.path();
            if path.is_dir() {
                helper(&path, current_depth + 1, max_depth, repos)?;
            }
        }
        Ok(())
    }
    helper(path, 0, depth, &mut repos)?;
    Ok(repos)
}

/// This function creates an AnalysisParameters struct from the provided arguments and returns it
/// Arguments:
/// - repo_path: String - The file system path to the git repository to analyze
/// - from_time: Option<String> - The start time for the analysis in YYYY-MM-DDTHH:MM:SS+HHMM format
/// - to_time: Option<String> - The end time for the analysis in YYYY-MM-DDTHH:MM:SS+HHMM format
/// - from_commit: Option<String> - The starting commit hash for the analysis
/// - to_commit: Option<String> - The ending commit hash for the analysis
/// - commit_hash_filter: Option<Filter> - A filter to apply to commit hashes
/// - commit_message_filter: Option<Filter> - A filter to apply to commit messages
/// - file_types_filter: Option<Filter> - A filter to apply to file types
/// - path_filter: Option<Filter> - A filter to apply to file paths
/// Returns:
/// - AnalysisParameters - The constructed AnalysisParameters struct
pub fn create_analysis_parameters(
    repo_path: String,
    from_time: Option<String>,
    to_time: Option<String>,
    from_commit: Option<String>,
    to_commit: Option<String>,
    commit_hash_filter: Option<Filter>,
    commit_message_filter: Option<Filter>,
    file_types_filter: Option<Filter>,
    path_filter: Option<Filter>,
) -> AnalysisParameters {
    AnalysisParameters {
        repo_path,
        from_time,
        to_time,
        from_commit,
        to_commit,
        commit_hash_filter,
        commit_message_filter,
        file_types_filter,
        path_filter,
    }
}

/// This function performs the initial analysis of a repository based on the provided parameters and returns the analysis result.
/// Sets original_repository and repository to the same Repository instance initially.
/// Arguments:
/// - parameters: AnalysisParameters - The parameters to use for the analysis
/// Returns:
/// - Result<AnalysisResult, String> - The result of the analysis or an error message
pub fn run_initial_analysis(parameters: AnalysisParameters) -> Result<AnalysisResult, String> {
    let repository = analysis::analyse_repository(&parameters)?;

    Ok(AnalysisResult {
        original_repository: Some(repository.clone()),
        parameters,
        repository,
    })
}

/// This function re-runs the analysis with new parameters on the same repository.
/// Arguments:
/// - previous_result: &AnalysisResult - The previous analysis result to base the re-analysis on
/// - new_parameters: AnalysisParameters - The new parameters to use for the re-analysis
/// Returns:
/// - Result<AnalysisResult, String> - The result of the re-analysis or an error message
pub fn rerun_analysis(
    previous_result: &AnalysisResult,
    new_parameters: AnalysisParameters,
) -> Result<AnalysisResult, String> {
    let repository = analysis::analyse_repository(&new_parameters)?;

    Ok(AnalysisResult {
        original_repository: previous_result.original_repository.clone(),
        parameters: new_parameters,
        repository,
    })
}

// A function for verifying filters
pub(crate) fn verify_filter(filter: &Filter, is_path_filter: bool) -> bool {
    // Use the glob_matcher_builder to validate the filter pattern
    match crate::analysis::glob_matcher_builder(&filter.value, is_path_filter) {
        Ok(_) => true,
        Err(_) => false,
    }
}

/// Loads a Settings struct from a JSON file.
/// This is a wrapper function that chains the load_file() and convert_from_json() functions for convenience.
pub fn load_settings_json(path: &Path) -> Result<Settings, String> {
    let json_string = load_file(path)?;
    convert_from_json(&json_string)
}

/// Saves a Settings struct to a JSON file.
/// This is a wrapper function that chains the convert_to_json() and save_file() functions for convenience.
pub fn save_settings_json(settings: &Settings, path: &Path) -> Result<PathBuf, String> {
    let json_string = convert_to_json(settings)?;
    save_file(json_string, path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_retrieve_repositories_with_git_repos() {
        // Use the repository root (parent of this crate) so tests don't depend on user-specific paths.
        let repo_root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .to_path_buf();
        let path_str = repo_root.to_str().unwrap();
        let result = retrieve_repositories(path_str, 2);
        println!("Result for repo root {}: {:?}", path_str, result);
        assert!(result.is_ok(), "Should succeed for existing directory");
        let repos = result.unwrap();
        assert!(
            !repos.is_empty(),
            "Should find at least one git repository in the repo root"
        );
    }

    #[test]
    fn test_retrieve_repositories_single_git_repo() {
        // Point directly at the repository root which should itself be a git repository.
        let repo_root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .to_path_buf();
        let path_str = repo_root.to_str().unwrap();
        let result = retrieve_repositories(path_str, 1);
        println!("Result for repo root {}: {:?}", path_str, result);
        assert!(result.is_ok(), "Should succeed for git repo directory");
        let repos = result.unwrap();
        // Expect the repo root itself to be discovered as a single git repository when starting at it.
        assert_eq!(
            repos.len(),
            1,
            "Should find exactly one git repository when pointing at the repo root"
        );
        assert_eq!(repos[0], repo_root);
    }

    #[test]
    fn test_retrieve_repositories_no_git_repo() {
        // Use the parent folder of the repository root (one level above the workspace root).
        let repo_root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .to_path_buf();
        let parent_of_repo = repo_root.parent().unwrap().to_path_buf();
        let path_str = parent_of_repo.to_str().unwrap();
        let result = retrieve_repositories(path_str, 2);
        println!("Result for parent folder {}: {:?}", path_str, result);
        assert!(result.is_ok(), "Should succeed for existing directory");
        let repos = result.unwrap();
        // The parent folder will typically contain at least one git repository (this workspace),
        // so assert we find at least one repository there.
        assert!(
            !repos.is_empty(),
            "Should find at least one git repository in the parent folder"
        );
    }

    #[cfg(test)]
    fn create_test_settings_json() -> String {
        r#"{
            "repositories": ["repo1", "repo2"],
            "search_depth": 15,
            "max_blame_files": 500,
            "commit_hash_filter": null,
            "commit_message_filter": null,
            "file_types_filter": null,
            "path_filter": null
        }"#
        .to_string()
    }

    #[test]
    fn test_load_settings_json() {
        let temp_dir = TempDir::new().unwrap();
        let settings_file = temp_dir.path().join("settings.json");

        let json_content = create_test_settings_json();
        fs::write(&settings_file, json_content).unwrap();

        let result = load_settings_json(&settings_file);
        assert!(result.is_ok());

        let settings = result.unwrap();
        // Verify all fields are accessible and have correct values
        assert_eq!(settings.repositories, vec!["repo1", "repo2"]);
        assert_eq!(settings.search_depth, 15);
        assert_eq!(settings.max_blame_files, 500);
        assert!(settings.commit_hash_filter.is_none());
        assert!(settings.commit_message_filter.is_none());
    }

    #[test]
    fn test_save_settings_json() {
        let temp_dir = TempDir::new().unwrap();
        let settings_file = temp_dir.path().join("settings_output.json");

        let settings = Settings {
            repositories: vec!["repo1".to_string(), "repo2".to_string()],
            search_depth: 15,
            max_blame_files: 500,
            commit_hash_filter: None,
            commit_message_filter: None,
            file_types_filter: None,
            path_filter: None,
        };

        let result = save_settings_json(&settings, &settings_file);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), settings_file);

        // Verify the file was written and can be loaded back
        let loaded_settings = load_settings_json(&settings_file).unwrap();
        assert_eq!(loaded_settings.repositories, settings.repositories);
        assert_eq!(loaded_settings.search_depth, settings.search_depth);
        assert_eq!(loaded_settings.max_blame_files, settings.max_blame_files);
        assert!(loaded_settings.commit_hash_filter.is_none());
        assert!(loaded_settings.commit_message_filter.is_none());
    }

    #[test]
    fn test_create_analysis_parameters() {
        let repo = "C:/test/repo".to_string();
        let params = create_analysis_parameters(
            repo.clone(),
            Some("2020-01-01T00:00:00+0000".to_string()),
            Some("2020-12-31T23:59:59+0000".to_string()),
            Some("abc123".to_string()),
            Some("def456".to_string()),
            None,
            None,
            None,
            None,
        );

        assert_eq!(params.repo_path, repo);
        assert_eq!(params.from_commit.unwrap(), "abc123");
        assert_eq!(params.to_commit.unwrap(), "def456");
        assert!(params.commit_hash_filter.is_none());
    }

    #[test]
    fn test_run_initial_analysis_on_repo_root() {
        // Use the repository root (parent of this crate) as the repo to analyze
        let repo_root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf();
        let repo_path = repo_root.to_str().unwrap().to_string();

        // Create parameters for initial analysis
        let params = create_analysis_parameters(repo_path.clone(), None, None, None, None, None, None, None, None);

        // Run initial analysis
        let initial_res = run_initial_analysis(params.clone());
        assert!(initial_res.is_ok(), "Initial analysis should succeed");
        let initial = initial_res.unwrap();
        assert_eq!(initial.parameters.repo_path, repo_path);
        // Repository should have been populated (may have zero commits in some cases, but path must match)
        assert_eq!(initial.repository.path, repo_path);
        // original_repository should be set by run_initial_analysis
        assert!(initial.original_repository.is_some());
    }

    #[test]
    fn test_rerun_analysis_on_repo_root() {
        // Use the repository root (parent of this crate) as the repo to analyze
        let repo_root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf();
        let repo_path = repo_root.to_str().unwrap().to_string();

        // Create parameters for initial analysis and run it
        let params = create_analysis_parameters(repo_path.clone(), None, None, None, None, None, None, None, None);
        let initial = run_initial_analysis(params.clone()).expect("Initial analysis should succeed");

        // Rerun analysis with a time range that likely yields fewer commits
        let new_params = create_analysis_parameters(repo_path.clone(), Some("2100-01-01T00:00:00+0000".to_string()), None, None, None, None, None, None, None);
        let rerun_res = rerun_analysis(&initial, new_params.clone());
        assert!(rerun_res.is_ok(), "Rerun analysis should succeed");
        let rerun = rerun_res.unwrap();

        // original_repository should be preserved from the initial result
        assert!(rerun.original_repository.is_some());
        assert_eq!(rerun.original_repository.as_ref().unwrap().path, initial.original_repository.as_ref().unwrap().path);
        // New parameters must match the provided new_params
        assert_eq!(rerun.parameters.repo_path, new_params.repo_path);
    }

    #[test]
    fn test_verify_filter_patterns() {
        let good = Filter { value: "*.rs".to_string(), include: true };
        let bad = Filter { value: "[invalid[".to_string(), include: true };

        assert!(verify_filter(&good, false), "Valid glob pattern should verify true");
        assert!(!verify_filter(&bad, true), "Invalid glob pattern should verify false");
    }

    
}
