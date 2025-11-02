use std::fs;
use std::path::{Path, PathBuf};
use serde_json;
use csv;

use crate::Settings;

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

pub fn load_file(path: &Path) -> Result<String, String> {
    fs::read_to_string(path)
        .map_err(|error| format!("Error loading file: {}", error))
}

pub fn save_file(content: String, path: &Path) -> Result<PathBuf, String> {
    match fs::write(&path, content) {
        Ok(_) => Ok(path.to_path_buf()),
        Err(error) => {
            Err(format!("Error saving file: {}", error))
        }
    }
}

/// Converts a serializable type into a JSON string.
pub fn convert_to_json<T: serde::Serialize>(object_to_convert: &T) -> Result<String, String> {
    serde_json::to_string_pretty(object_to_convert)
        .map_err(|error| format!("Error converting to JSON: {}", error))
}

/// Converts a JSON string into a deserializable type.
pub fn convert_from_json<T: serde::de::DeserializeOwned>(json_string: &str) -> Result<T, String> {
    serde_json::from_str(json_string)
        .map_err(|error| format!("Error parsing JSON: {}", error))
}

/// Converts a serializable type into csv.
pub fn convert_to_csv<T: serde::Serialize>(object_to_convert: &[T]) -> Result<String, String> {
    let mut writer = csv::Writer::from_writer(Vec::new());

    // Write all entries
    for entry in object_to_convert {
        writer.serialize(entry)
            .map_err(|error| format!("Error serializing record to CSV: {}", error))?;
    }

    // Extract CSV data from writer
    let data = writer.into_inner()
        .map_err(|error| format!("Error consuming CSV writer: {}", error))?;

    // Convert data from string
    String::from_utf8(data)
        .map_err(|error| format!("Error converting CSV bytes to string: {}", error))

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
    use std::fs;
    use crate::Settings;
    use crate::Author;
    use crate::Metrics;

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

    #[test]
    fn file_should_load() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.txt");
        let content = "Hello, world!";
        fs::write(&test_file, content).unwrap();

        let result = load_file(&test_file);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), content);
    }

    #[test]
    fn file_load_should_fail() {
        let temp_dir = TempDir::new().unwrap();
        let non_existent = temp_dir.path().join("does-not-exist.txt");

        let result = load_file(&non_existent);
        assert!(result.is_err());
        let error_message = result.unwrap_err();
        assert!(error_message.starts_with("Error loading file:"));
    }

    #[test]
    fn test_save_file() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("output.txt");
        let content = "Hellp, world!".to_string();

        let result = save_file(content.clone(), &test_file);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), test_file);

        // Verify the file was actually written
        let saved_content = fs::read_to_string(&test_file).unwrap();
        assert_eq!(saved_content, content);
    }

    #[test]
    fn test_save_file_to_invalid_path() {
        let temp_dir = TempDir::new().unwrap();
        let invalid_path = temp_dir.path().join("nonexistent_dir").join("test.txt");
        let content = "Hello, world!".to_string();

        let result = save_file(content, &invalid_path);
        assert!(result.is_err());

        let error_message = result.unwrap_err();
        assert!(error_message.starts_with("Error saving file:"));
    }

    #[test]
    fn convert_to_json_should_work() {
        let settings = Settings {
            repositories: vec!["test.txt".to_string()],
            search_depth: 10,
            ignored_file_extensions: vec!["txt".to_string(), "log".to_string()],
            allowed_file_extensions: vec!["hoi".to_string(), "csv".to_string()],
        };

        let result = convert_to_json(&settings);
        assert!(result.is_ok());

        let json_string = result.unwrap();
        assert!(json_string.contains("\"search_depth\": 10"));
        assert!(json_string.contains("\"ignored_file_extensions\""));
        assert!(json_string.contains("\"txt\""));
        assert!(json_string.contains("\"log\""));
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
    fn test_convert_from_json() {
        let json_string = create_test_settings_json();

        let result: Result<Settings, String> = convert_from_json(&json_string);
        assert!(result.is_ok());

        let settings = result.unwrap();

        // Verify all fields are accessible and have correct values
        assert_eq!(settings.repositories, vec!["repo1", "repo2"]);
        assert_eq!(settings.search_depth, 15);
        assert_eq!(settings.ignored_file_extensions, vec!["log", "tmp"]);
        assert_eq!(settings.allowed_file_extensions, vec!["rs", "toml"]);
    }

    #[test]
    fn test_convert_from_json_with_invalid_json() {
        let invalid_json = "This is not JSON.";

        let result: Result<Settings, String> = convert_from_json(invalid_json);
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(error.starts_with("Error parsing JSON:"));
    }

    #[test]
    fn test_convert_author_to_csv() {
        // Create test authors
        let authors = vec![
            Author {
                name: "Alice".to_string(),
                email: "alice@gitinspector.com".to_string(),
            },
        ];

        let result = convert_to_csv(&authors);
        assert!(result.is_ok());

        let csv_string = result.unwrap();

        // Verify CSV structure
        assert!(csv_string.contains("name"));
        assert!(csv_string.contains("email"));
        assert!(csv_string.contains("Alice"));
        assert!(csv_string.contains("alice@gitinspector.com"));

        // Verify row count (1 header + 1 data row)
        assert_eq!(csv_string.lines().count(), 2);
    }

    #[test]
    fn test_convert_metrics_to_csv() {
        // Create representative test metrics
        let metrics = vec![
            Metrics {
                loc: Some(500),
                sloc: Some(400),
                cloc: Some(100),
                insertions: Some(200),
                deletions: Some(150),
                total_commits: Some(20),
                total_authors: Some(3),
                total_files: Some(45),
            },
            Metrics {
                loc: Some(800),
                sloc: Some(650),
                cloc: None,
                insertions: Some(900),
                deletions: None,
                total_commits: Some(75),
                total_authors: Some(3),
                total_files: Some(20), 
            },
        ];

        let result = convert_to_csv(&metrics);
        assert!(result.is_ok());

        let csv_string = result.unwrap();

        // Verify CSV headers
        assert!(csv_string.contains("loc"));
        assert!(csv_string.contains("sloc"));
        assert!(csv_string.contains("cloc"));
        assert!(csv_string.contains("insertions"));
        assert!(csv_string.contains("deletions"));
        assert!(csv_string.contains("total_commits"));
        assert!(csv_string.contains("total_authors"));
        assert!(csv_string.contains("total_files"));

        // Verify metric values are present
        assert!(csv_string.contains("500"));
        assert!(csv_string.contains("400"));
        assert!(csv_string.contains("100"));
        assert!(csv_string.contains("200"));
        assert!(csv_string.contains("150"));
        assert!(csv_string.contains("20"));
        assert!(csv_string.contains("3"));
        assert!(csv_string.contains("45"));

        assert!(csv_string.contains("800"));
        assert!(csv_string.contains("650"));
        assert!(csv_string.contains(""));
        assert!(csv_string.contains("900"));
        assert!(csv_string.contains(""));
        assert!(csv_string.contains("75"));
        assert!(csv_string.contains("3"));
        assert!(csv_string.contains("20"));

        // Verify row count (1 header + 2 data rows)
        assert_eq!(csv_string.lines().count(), 3);
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