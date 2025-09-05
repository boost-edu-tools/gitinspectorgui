use std::fs;
use std::env;
use std::path::Path;

use git_wrapper::Repository;

use crate::shared_types::*;


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

/// Loads the settings.json file into a Settings struct from a given path.
/// If no path is given, uses the directory of the current executable.
/// Pre-condition: path is valid
pub fn load_settings_json(path: Option<&Path>) -> Result<Settings, String> {
    let settings_path = match path {
        Some(p) => p.to_path_buf(),
        None => {
            let exe_path = env::current_exe().map_err(|e| format!("Failed to get current exe path: {}", e))?;
            exe_path.parent()
                .map(|dir| dir.join("settings.json"))
                .ok_or_else(|| "Failed to get parent directory of exe".to_string())?
        }
    };
    let contents = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings.json at {}: {}", settings_path.display(), e))?;
    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse settings.json: {}", e))
}

/// Saves the Settings struct to settings.json at the given path, or next to the executable if no path is provided.
/// If no Settings is provided, saves the default Settings.
/// Pre-condition: path is valid
pub fn save_settings_json(settings: Option<&Settings>, path: Option<&Path>) -> Result<(), String> {
    let settings_to_save = match settings {
        Some(s) => s.clone(),
        None => Settings::default(),
    };
    let settings_path = match path {
        Some(p) => p.to_path_buf(),
        None => {
            let exe_path = env::current_exe().map_err(|e| format!("Failed to get current exe path: {}", e))?;
            exe_path.parent()
                .map(|dir| dir.join("settings.json"))
                .ok_or_else(|| "Failed to get parent directory of exe".to_string())?
        }
    };
    let json = serde_json::to_string_pretty(&settings_to_save)
        .map_err(|e| format!("Failed to serialize Settings: {}", e))?;
    fs::write(&settings_path, json)
        .map_err(|e| format!("Failed to write settings.json at {}: {}", settings_path.display(), e))
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