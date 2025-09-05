mod cli_parser;
use cli_parser::create_parser;
// use crate::api::PythonApiClient;
use gi_core::Settings;
// use gitinspectorgui_cli::output::{format_table_output, print_analysis};
use std::process;

// Main CLI entry point
fn main() {
    let mut parser = create_parser();
    let matches = parser.clone().get_matches();

    // Extract command-line arguments
    let repositories: Vec<String> = matches
        .get_many::<String>("repositories")
        .unwrap_or_default()
        .map(|s| s.to_string())
        .collect();

    let depth = *matches.get_one::<usize>("depth").unwrap();
    let n_files = *matches.get_one::<u32>("n-files").unwrap();
    
    let include_files: Vec<String> = matches
        .get_many::<String>("include-files")
        .unwrap_or_default()
        .map(|s| s.to_string())
        .collect();

    let exclude_files: Vec<String> = matches
        .get_many::<String>("exclude-files")
        .unwrap_or_default()
        .map(|s| s.to_string())
        .collect();

    let exclude_authors: Vec<String> = matches
        .get_many::<String>("exclude-authors")
        .unwrap_or_default()
        .map(|s| s.to_string())
        .collect();

    let exclude_emails: Vec<String> = matches
        .get_many::<String>("exclude-emails")
        .unwrap_or_default()
        .map(|s| s.to_string())
        .collect();

    let copy_move = matches
        .get_one::<String>("copy-move")
        .unwrap()
        .parse::<u8>()
        .unwrap();

    let scaled_percentages = matches.get_flag("scaled-percentages");
    let blame_exclusions = matches.get_flag("blame-exclusions");
    let dynamic_blame_history = matches.get_flag("dynamic-blame-history");
    let dry_run = matches.get_flag("dry-run");
    let output_format = matches.get_one::<String>("output-format").unwrap();

    // Set view based on dynamic blame history flag
    let view = if dynamic_blame_history {
        "dynamic-blame-history"
    } else {
        "auto"
    };

    // Create settings from command-line arguments
    let settings = Settings {
        repositories: repositories.clone(),
        depth,
        /* n_files,
        include_files,
        ex_files: exclude_files,
        ex_authors: exclude_authors,
        ex_emails: exclude_emails,
        ex_revisions: Vec::new(),
        ex_messages: Vec::new(),
        copy_move,
        scaled_percentages,
        blame_exclusions: if blame_exclusions { "show" } else { "hide" }.to_string(),
        view: view.to_string(),
        dryrun: dry_run,*/
    };

    if repositories.is_empty() {
        eprintln!("Error: No repositories specified");
        let _ = parser.print_help();
        process::exit(1);
    }

    // Execute analysis
    api::run_core(&settings);

    // Output results
    /*if let Err(e) = print_analysis(&result, output_format) {
    eprintln!("{}", e);
    process::exit(1);*/
}