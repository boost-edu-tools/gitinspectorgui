use gi_core::Settings;
use clap::{Arg, Command};
use std::{error::Error};


pub struct Config {
    pub repositories: Vec<String>,
    pub depth: usize,
    pub ignored_file_extensions: Vec<String>,
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
            ignored_file_extensions: matches
                .get_many::<String>("ignored-file-extensions")
                .unwrap_or_default()
                .map(|s| s.to_string())
                .collect(),
        })

    }
}

pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let settings = Settings {
        repositories: config.repositories.clone(),
        search_depth: config.depth,
        ignored_file_extensions: config.ignored_file_extensions.clone(),
    };

    //TODO: RUN CORE

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
            .long("ignored-file-extensions")
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
    fn parses_full_cmd() {
        let cmd = create_parser().try_get_matches_from(vec![ // Simulate cmdline typing
            "gi-core",
            "repo1",
            "repo2",
            "--depth", "5",
            "--ignored-file-extensions", "exe",
        ]);
        assert!(cmd.is_ok());
        let m = cmd.unwrap();
        let repos: Vec<_> = m.get_many::<String>("repositories").unwrap().collect();
        assert_eq!(repos, vec!["repo1", "repo2"]);

        let depth = m.get_one::<usize>("depth").unwrap();
        assert_eq!(*depth, 5);

        let ignored_extensions = m.get_one::<String>("ignored-file-extensions")
            .unwrap();
        assert_eq!(ignored_extensions, "exe");
    }

    #[test]
    fn default_depth_is_1() {
        let cmd = create_parser().try_get_matches_from(vec![
            "gi-core",
            "repo1",
        ]);
        assert!(cmd.is_ok());
        let m = cmd.unwrap();
        let depth = m.get_one::<usize>("depth").unwrap();
        assert_eq!(*depth, 1);
    }
}