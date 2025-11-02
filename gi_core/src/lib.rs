mod filesystem;
mod shared_types;
mod analysis;
pub use filesystem::*;
pub use shared_types::*;
pub use analysis::*;

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
    fn helper(dir: &Path, current_depth: usize, max_depth: usize, repos: &mut Vec<PathBuf>) -> Result<(), String> {
        if current_depth > max_depth {
            return Ok(());
        }
        if is_git_repository(dir) {
            repos.push(dir.to_path_buf());
            // Do not recurse into git repos
            return Ok(());
        }
        let entries = fs::read_dir(dir).map_err(|e| format!("Failed to read directory {}: {}", dir.display(), e))?;
        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read entry in {}: {}", dir.display(), e))?;
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
        let path_str = "C:/Users/MDOpc/Repositories";
        let result = retrieve_repositories(path_str, 2);
        println!("Result for C:/Users/MDOpc/Repositories: {:?}", result);
        assert!(result.is_ok(), "Should succeed for existing directory");
        let repos = result.unwrap();
        assert!(!repos.is_empty(), "Should find at least one git repository");
    }

    #[test]
    fn test_retrieve_repositories_single_git_repo() {
        let path_str = "C:/Users/MDOpc/Repositories/2ILH0-A1";
        let result = retrieve_repositories(path_str, 1);
        println!("Result for C:/Users/MDOpc/Repositories/2ILH0-A1: {:?}", result);
        assert!(result.is_ok(), "Should succeed for git repo directory");
        let repos = result.unwrap();
        assert_eq!(repos.len(), 1, "Should find exactly one git repository");
        assert_eq!(repos[0], std::path::PathBuf::from(path_str));
    }

    #[test]
    fn test_retrieve_repositories_no_git_repo() {
        let path_str = "C:/Users/MDOpc/Desktop/HACCP training";
        let result = retrieve_repositories(path_str, 2);
        println!("Result for C:/Users/MDOpc/Desktop/HACCP training: {:?}", result);
        assert!(result.is_ok(), "Should succeed for existing directory");
        let repos = result.unwrap();
        assert!(repos.is_empty(), "Should find no git repositories");
    }

    #[cfg(test)]
    fn create_test_settings_json() -> String {
        r#"{
            "repositories": ["repo1", "repo2"],
            "search_depth": 15,
            "ignored_file_extensions": ["log", "tmp"],
            "allowed_file_extensions": ["rs", "toml"]
        }"#.to_string()
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
        assert_eq!(settings.ignored_file_extensions, vec!["log", "tmp"]);
        assert_eq!(settings.allowed_file_extensions, vec!["rs", "toml"]);        
    }

    #[test]
    fn test_save_settings_json() {
        let temp_dir = TempDir::new().unwrap();
        let settings_file = temp_dir.path().join("settings_output.json");

        let settings = Settings {
            repositories: vec!["repo1".to_string(), "repo2".to_string()],
            search_depth: 15,
            ignored_file_extensions: vec!["log".to_string(), "tmp".to_string()],
            allowed_file_extensions: vec!["rs".to_string(), "toml".to_string()],
        };

        let result = save_settings_json(&settings, &settings_file);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), settings_file);

        // Verify the file was written and can be loaded back
        let loaded_settings = load_settings_json(&settings_file).unwrap();
        assert_eq!(loaded_settings.repositories, settings.repositories);
        assert_eq!(loaded_settings.search_depth, settings.search_depth);
        assert_eq!(loaded_settings.ignored_file_extensions, settings.ignored_file_extensions);
        assert_eq!(loaded_settings.allowed_file_extensions, settings.allowed_file_extensions);
    }
}
