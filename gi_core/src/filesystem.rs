use csv;
use git_wrapper::Repository;
use serde_json;
use std::fs;
use std::path::{Path, PathBuf};

use crate::{Settings, Author};

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

/// Returns true if the given directory (as Path) is a git repository, false otherwise.
pub fn is_git_repository(path: &Path) -> bool {
    Repository::discover(path).is_ok()
}

pub fn load_file(path: &Path) -> Result<String, String> {
    fs::read_to_string(path).map_err(|error| format!("Error loading file: {}", error))
}

pub fn save_file(content: String, path: &Path) -> Result<PathBuf, String> {
    match fs::write(&path, content) {
        Ok(_) => Ok(path.to_path_buf()),
        Err(error) => Err(format!("Error saving file: {}", error)),
    }
}

/// Converts a serializable type into a JSON string.
pub fn convert_to_json<T: serde::Serialize>(object_to_convert: &T) -> Result<String, String> {
    serde_json::to_string_pretty(object_to_convert)
        .map_err(|error| format!("Error converting to JSON: {}", error))
}

/// Converts a JSON string into a deserializable type.
pub fn convert_from_json<T: serde::de::DeserializeOwned>(json_string: &str) -> Result<T, String> {
    serde_json::from_str(json_string).map_err(|error| format!("Error parsing JSON: {}", error))
}

/// Converts a serializable type into csv.
pub fn convert_to_csv<T: serde::Serialize>(object_to_convert: &[T]) -> Result<String, String> {
    let mut writer = csv::Writer::from_writer(Vec::new());

    // Write all entries
    for entry in object_to_convert {
        writer
            .serialize(entry)
            .map_err(|error| format!("Error serializing record to CSV: {}", error))?;
    }

    // Extract CSV data from writer
    let data = writer
        .into_inner()
        .map_err(|error| format!("Error consuming CSV writer: {}", error))?;

    // Convert data from string
    String::from_utf8(data)
        .map_err(|error| format!("Error converting CSV bytes to string: {}", error))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Author;
    use crate::Metrics;
    use crate::Settings;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_directory_path_should_exist() {
        let temp_dir = TempDir::new().unwrap();

        assert!(is_existing_path(temp_dir.path()));
    }

    #[test]
    fn test_file_path_should_exist() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.txt");
        fs::write(&test_file, "test content").unwrap();

        assert!(is_existing_path(&test_file));
    }

    #[test]
    fn test_non_path_should_fail() {
        let temp_dir = TempDir::new().unwrap();
        let non_existent = temp_dir.path().join("does-not-exist.mp4");

        assert!(!is_existing_path(&non_existent));
    }

    #[test]
    fn test_directory_should_exist() {
        let temp_dir = TempDir::new().unwrap();

        assert!(is_directory(temp_dir.path()));
    }

    #[test]
    fn test_file_should_not_be_directory() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.txt");
        fs::write(&test_file, "test content").unwrap();

        assert!(!is_directory(&test_file));
    }

    #[test]
    fn test_git_repo_should_exist() {
        let temp_dir = TempDir::new().unwrap();
        let git_dir = temp_dir.path().join(".git");
        fs::create_dir(&git_dir).unwrap();

        assert!(is_git_repository(temp_dir.path()));
    }

    #[test]
    fn test_upward_git_repo_discovery() {
        let temp_dir = TempDir::new().unwrap();
        // Should find the top-level .git file in the gitinspectorgui folder
        assert!(is_git_repository(temp_dir.path()));
    }

    #[test]
    fn test_file_should_load() {
        let temp_dir = TempDir::new().unwrap();
        let test_file = temp_dir.path().join("test.txt");
        let content = "Hello, world!";
        fs::write(&test_file, content).unwrap();

        let result = load_file(&test_file);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), content);
    }

    #[test]
    fn test_file_load_should_fail() {
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
    fn test_convert_to_json_should_work() {
        let settings = Settings {
            repositories: vec!["test.txt".to_string()],
            search_depth: 10,
            max_blame_files: 1000,
            commit_hash_filter: None,
            commit_message_filter: None,
            file_types_filter: None,
            path_filter: None,
        };

        let result = convert_to_json(&settings);
        assert!(result.is_ok());

        let json_string = result.unwrap();
        assert!(json_string.contains("\"search_depth\": 10"));
        assert!(json_string.contains("\"repositories\""));
        assert!(json_string.contains("test.txt"));
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
    fn test_convert_from_json() {
        let json_string = create_test_settings_json();

        let result: Result<Settings, String> = convert_from_json(&json_string);
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
        let authors = vec![Author {
            id: 1,
            name: "Alice".to_string(),
            email: "alice@gitinspector.com".to_string(),
            commit_hashes: vec![],
            files: vec![],
            last_modified_date: "".to_string(),
            last_modified_time: "".to_string(),
            last_modified_timezone: "".to_string(),
            metrics: Metrics::default(),
        }];

        let result = Author::to_csv(&authors);
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
                whitespace: None,
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
                whitespace: None,
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

        let mut missing = Vec::new();
        for expected in [
            // CSV headers
            "loc",
            "sloc",
            "cloc",
            "whitespace",
            "insertions",
            "deletions",
            "total_commits",
            "total_authors",
            "total_files",
            // Metric values
            "500",
            "400",
            "100",
            "",
            "200",
            "150",
            "20",
            "3",
            "45",
            "800",
            "650",
            "",
            "900",
            "",
            "75",
            "3",
            "20",
        ] {
            if !csv_string.contains(expected) {
                missing.push(expected);
            }
        }
        assert!(
            missing.is_empty(),
            "CSV output missing expected values: {:?}",
            missing
        );

        // Verify row count (1 header + 2 data rows)
        assert_eq!(csv_string.lines().count(), 3);
    }
}
