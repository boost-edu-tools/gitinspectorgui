use gi_core::{Settings, Filter};
use clap::{Arg, Command};
use std::{error::Error};


pub struct Config {
    pub repositories: Vec<String>,
    pub search_depth: usize,
    pub ignored_file_extensions: Vec<String>,
    pub allowed_file_extensions: Vec<String>,
}

impl Config {
    pub fn build() -> Result<Self, &'static str> {
        let matches = create_parser().get_matches();

        let repositories: Vec<String> = matches
            .get_many::<String>("repositories")
            .unwrap_or_default()
            .map(|s| s.to_string())
            .collect();

        if repositories.is_empty() {
            return Err("No repositories specified");
        }

        Ok(Self {
            repositories,
            search_depth: *matches.get_one::<usize>("search-depth").unwrap(),
            ignored_file_extensions: matches
                .get_many::<String>("ignored-file-extensions")
                .unwrap_or_default()
                .map(|s| s.to_string())
                .collect(),
            allowed_file_extensions: matches
                .get_many::<String>("allowed-file-extensions")
                .unwrap_or_default()
                .map(|s| s.to_string())
                .collect(),
        })

    }
}

pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    // Validate mutual exclusivity of file extensions
    if !config.allowed_file_extensions.is_empty() && !config.ignored_file_extensions.is_empty() {
        return Err("Cannot specify both --allowed-file-extensions and --ignored-file-extensions".into());
    }

    let file_types_filter = if !config.allowed_file_extensions.is_empty() {
        Some(Filter {
            value: config.allowed_file_extensions.join(","),
            include: true,
        })
    } else if !config.ignored_file_extensions.is_empty() {
        Some(Filter {
            value: config.ignored_file_extensions.join(","),
            include: false,
        })
    } else {
        None
    };

    let settings = Settings {
        repositories: config.repositories.clone(),
        search_depth: config.search_depth,
        ..Settings::default()
    };

    // RUN CORE

    Ok(())
}

pub fn create_parser() -> Command {
    Command::new("gi-core")
        .about("Analyze repositories")
        .arg(Arg::new("repositories")
            .num_args(1..)
            .required(true))
        .arg(Arg::new("search-depth")
            .long("search-depth")
            .value_parser(clap::value_parser!(usize))
            .default_value("3"))
        .arg(Arg::new("ignored-file-extensions")
            .long("ignored-file-extensions")
            .help("File extensions to ignore (e.g.: exe, py)")
            .conflicts_with("allowed-file-extensions")
            .num_args(1..))
        .arg(Arg::new("allowed-file-extensions")
            .long("allowed-file-extensions")
            .help("Only analyze these extensions (e.g.: rs, js)")
            .conflicts_with("ignored-file-extensions")
            .num_args(1..))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_repos_should_fail() {
        // Simulate no repos
        let cmd = create_parser().try_get_matches_from(vec!["gi-core"]);
        assert!(cmd.is_err());
    }

    #[test]
    fn test_ignored_file_extensions() {
        let cmd = create_parser().try_get_matches_from(vec![
            "gi-core",
            "repo1",
            "--ignored-file-extensions", "exe", "py", "rs",
        ]);
        assert!(cmd.is_ok());
        
        let m = cmd.unwrap();
        let ignored: Vec<_> = m.get_many::<String>("ignored-file-extensions")
            .unwrap()
            .collect();
        assert_eq!(ignored, vec!["exe", "py", "rs"]);
    }

    #[test]
    fn test_full_cli_command_parsing() {
        let cmd = create_parser().try_get_matches_from(vec![ // Simulate cmdline typing
            "gi-core",
            "repo1",
            "repo2",
            "--search-depth", "5",
            "--ignored-file-extensions", "exe",
        ]);
        assert!(cmd.is_ok());
        let m = cmd.unwrap();
        let repos: Vec<_> = m.get_many::<String>("repositories").unwrap().collect();
        assert_eq!(repos, vec!["repo1", "repo2"]);

        let search_depth = m.get_one::<usize>("search-depth").unwrap();
        assert_eq!(*search_depth, 5);

        let ignored_extensions = m.get_one::<String>("ignored-file-extensions")
            .unwrap();
        assert_eq!(ignored_extensions, "exe");
    }

    #[test]
    fn default_search_depth_is_from_settings() {
        // This test ensures that if search-depth is not provided, it defaults to Settings default
        // Also tests whether the settings struct and cli default are in sync
        let cmd = create_parser().try_get_matches_from(vec![
            "gi-core",
            "repo1",
        ]);
        assert!(cmd.is_ok());
        let m = cmd.unwrap();
        let search_depth = m.get_one::<usize>("search-depth").unwrap();
        assert_eq!(*search_depth, Settings::default().search_depth);
    }

    #[test]
    fn test_mutual_exclusivity_of_file_filters() {
        let cmd = create_parser().try_get_matches_from(vec![
            "gi-core",
            "repo1",
            "--allowed-file-extensions", "rs", "js",
            "--ignored-file-extensions", "exe", "py",
        ]);
        assert!(cmd.is_err(), "Should not allow both allowed and ignored extensions");
    }
}