use gi_core::Settings;
use clap::{Arg, ArgAction, Command};
use std::{error::Error};


pub struct Config {
    pub repositories: Vec<String>,
    pub depth: usize,
    pub ignored_file_extensions: Option<String>,
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
            depth: *matches.get_one::<usize>("depth").unwrap(),
            ignored_file_extensions: matches.get_one::<String>("ignored-file-extensions")
            .cloned(),
        })

    }
}

pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let settings = Settings {
        repositories: config.repositories.clone(),
        search_depth: config.depth,
        ignored_file_extensions: config.ignored_file_extensions.clone(),
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
        .arg(Arg::new("depth")
            .long("depth")
            .value_parser(clap::value_parser!(usize))
            .default_value("1"))
        .arg(Arg::new("ignored-file-extensions")
            .long("ignored-file-extensions"))
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
    fn parses_repositories() {
        let cmd = create_parser().try_get_matches_from(vec![
            "gi-core",
            "repo1",
            "repo2",
            "--depth", "5",
            "--ignored_extensions", "exe",
        ]);
        assert!(cmd.is_ok());
        let m = cmd.unwrap();
        let repos: Vec<_> = m.get_many::<String>("repositories").unwrap().collect();
        assert_eq!(repos, vec!["repo1", "repo2"]);
    }
}