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