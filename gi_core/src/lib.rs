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


#[cfg(test)]
mod tests {
    use super::*;
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
}
