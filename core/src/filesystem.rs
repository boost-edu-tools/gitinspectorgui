use std::path::Path;
use git_wrapper::Repository;


/// Checks if the given Path is a valid and existing path.
pub fn is_existing_path(path: &Path) -> bool {
    path.exists()
}

/// Checks if the given Path is a directory.
/// Returns true if directory, false otherwise (including if path does not exist).
pub fn is_directory(path: &Path) -> bool {
    path.is_dir()
}

/// Returns true if the given directory (as Path) is a git repository, false otherwise.
pub fn is_git_repository(path: &Path) -> bool {
    Repository::discover(path).is_ok()
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_existing_path() {
        let path = Path::new(".");
        assert!(is_existing_path(path));
        let non_existent = Path::new("this_should_not_exist_12345");
        assert!(!is_existing_path(non_existent));
    }

    #[test]
    fn test_is_directory() {
        let path = Path::new(".");
        assert!(is_directory(path));
        let file = Path::new(file!());
        assert!(!is_directory(file));
    }

    #[test]
    fn test_is_git_repository() {
        // This test assumes the current directory is a git repo
        let path = Path::new(".");
        // This will pass if run inside a git repo, otherwise will fail.
        assert!(is_git_repository(path));
    }
}