use std::fs;
use std::path::{Path, PathBuf};
use serde_json;
use csv;

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

pub fn load_file(path: &Path) -> Result<String, String> { // TODO: Change return type to gi_core::File
    fs::read_to_string(path)
        .map_err(|error| format!("Error loading file: {}", error))
}

pub fn save_file(content: String, path: &Path) -> Result<PathBuf, String> { // TODO: Check return type
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

// TODO: Add save_file test functions
// TODO: Create CSV conversion testing function that tests representative input for the final application

#[cfg(test)]

mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;
    use crate::Settings;

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

    #[test]
    fn convert_to_csv_should_work_with_multiple_records() {
        let data_vec = vec![
            "Test test".to_string(),
            "Hoi, hallo daar".to_string(),
        ];

        let result = convert_to_csv(&data_vec);
        assert!(result.is_ok());

        let csv_string = result.unwrap();

        assert!(csv_string.contains("Test test"));
        assert!(csv_string.contains("Hoi, hallo daar"));
    }

    #[test]
    fn test_convert_from_json() {
        let json_string = r#"{
            "repositories": ["repo1", "repo2"],
            "search_depth": 15,
            "ignored_file_extensions": ["log", "tmp"],
            "allowed_file_extensions": ["rs", "toml"]
        }"#;

        let result: Result<Settings, String> = convert_from_json(json_string);
        assert!(result.is_ok());

        let settings = result.unwrap();

        // Verify all fields are accessible and have correct values
        assert_eq!(settings.repositories, vec!["repo1", "repo2"]);
        assert_eq!(settings.search_depth, 15);
    }

    #[test]
    fn test_convert_from_json_with_invalid_json() {
        let invalid_json = "This is not JSON.";

        let result: Result<Settings, String> = convert_from_json(invalid_json);
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(error.starts_with("Error parsing JSON:"));
    }
}