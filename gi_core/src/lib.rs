mod analysis;
mod filesystem;
mod shared_types;
pub use analysis::*;
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

// A function for running an analysis on a repository given certain parameters.
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
// This will return an AnalysisResult with the original repository set to None.
pub fn run_initial_analysis(
    parameters: AnalysisParameters,
) -> Result<AnalysisResult, String> {
    // Placeholder for actual analysis logic.
    // In a real implementation, this would involve cloning the repository,
    // applying filters, and collecting metrics.

    // For now, we return an empty AnalysisResult with the provided parameters.

    Ok(AnalysisResult {
        original_repository: None,
        parameters,
        repository,
    })
}

// A function for rerunning an already performed analysis with new parameters.
// This will preserve the original repository in the AnalysisResult under original_repository.
pub fn rerun_analysis(
    previous_result: &AnalysisResult,
    new_parameters: AnalysisParameters,
) -> Result<AnalysisResult, String> {
    // Placeholder for actual re-analysis logic.
    // In a real implementation, this would involve reapplying filters
    // and collecting metrics on the original repository.

    // For now, we return a new AnalysisResult with the original repository preserved.

    Ok(AnalysisResult {
        original_repository: previous_result.original_repository.clone(),
        parameters: new_parameters,
        repository,
    })
}

// A function for verifying filters
pub fn verify_filter(filter: &Filter) -> bool {
    // Placeholder for actual filter verification logic.
    // In a real implementation, this would check the validity of the filter criteria.

    // For now, we simply return true.
    true
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
}
