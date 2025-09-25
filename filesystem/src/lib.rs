use std::fs;
use std::path::{Path, PathBuf};
use std::io;

pub fn is_existing_path(path: &Path) -> bool {
    match path.try_exists() {
        Ok(exists) => exists,
        Err(error) => {
            eprintln!("Error checking if path exists: {}", error);
            false
        }
    }
}

pub fn is_directory(path: &Path) -> bool {
    match fs::metadata(path) {
        Ok(metadata) => metadata.is_dir(),
        Err(error) => {
            eprintln!("Error checking if path is directory: {}", error);
            false
        }
    }
}

pub fn is_git_repository(path: &Path) -> bool {
    let git_dir = path.join(".git");
    match git_dir.try_exists() {
        Ok(exists) => exists,
        Err(error) => {
            eprintln!("Error checking for .git directory: {}", error);
            false
        }
    }
}


#[cfg(test)]

mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    #[test]
    fn directory_path_should_exist() {
        let temp_dir = TempDir::new().unwrap();
    
        assert!(is_existing_path(temp_dir.path()));
    }

    #[test]
    fn file_path_should_exist() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.txt");
        fs::write(&test_file, "test content").unwrap();
    
        assert!(is_existing_path(&test_file));
    }

    #[test]
    fn non_path_should_fail() {
        let temp_dir = TempDir::new().unwrap();
        let non_existent = temp_dir.path().join("does-not-exist.mp4");
    
        assert!(!is_existing_path(&non_existent));
    }

    #[test]
    fn directory_should_exist() {
        let temp_dir = TempDir::new().unwrap();

        assert!(is_directory(temp_dir.path()));
    }

    #[test]
    fn file_should_not_be_directory() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.txt");
        fs::write(&test_file, "test content").unwrap();
    
        assert!(!is_directory(&test_file));
    }


    #[test]
    fn git_repo_should_exist() {
        let temp_dir = TempDir::new().unwrap();
        let git_dir = temp_dir.path().join(".git");
        fs::create_dir(&git_dir).unwrap();

        assert!(is_git_repository(temp_dir.path()));
    }

    #[test]
    fn non_git_repo_should_fail() {
        let temp_dir = TempDir::new().unwrap();

        assert!(!is_git_repository(temp_dir.path()));
    }
}