export interface Settings {
    // Repository and Input Settings
    input_fstrs: string[];
    depth: number;
    subfolder: string;

    // File Analysis Settings
    n_files: number;
    include_files: string[];
    ex_files: string[];
    extensions: string[];

    // Author and Commit Filtering
    ex_authors: string[];
    ex_emails: string[];
    ex_revisions: string[];
    ex_messages: string[];
    since: string;
    until: string;

    // Output and Format Settings
    outfile_base: string;
    fix: string; // prefix, postfix, nofix
    file_formats: string[]; // html, excel
    view: string; // auto, dynamic-blame-history, none

    // Analysis Options
    copy_move: number;
    scaled_percentages: boolean;
    blame_exclusions: string; // hide, show, remove
    blame_skip: boolean;
    show_renames: boolean;

    // Content Analysis
    deletions: boolean;
    whitespace: boolean;
    empty_lines: boolean;
    comments: boolean;

    // Performance Settings
    multithread: boolean;
    multicore: boolean;
    verbosity: number;

    // Development/Testing
    dryrun: number;

    // GUI-specific
    gui_settings_full_path: boolean;
    col_percent: number;

    // Additional required fields for Python backend compatibility
    ex_author_patterns: string[];
    ex_email_patterns: string[];
    ex_message_patterns: string[];
    ex_file_patterns: string[];
    ignore_revs_file: string;
    enable_ignore_revs: boolean;
    blame_follow_moves: boolean;
    blame_ignore_whitespace: boolean;
    blame_minimal_context: boolean;
    blame_show_email: boolean;
    output_encoding: string;
    date_format: string;
    author_display_format: string;
    line_number_format: string;
    excel_max_rows: number;
    excel_abbreviate_names: boolean;
    excel_freeze_panes: boolean;
    html_theme: string;
    html_enable_search: boolean;
    html_max_entries_per_page: number;
    server_port: number;
    server_host: string;
    max_browser_tabs: number;
    auto_open_browser: boolean;
    profile: number;
    debug_show_main_event_loop: boolean;
    debug_multiprocessing: boolean;
    debug_git_commands: boolean;
    log_git_output: boolean;
    legacy_mode: boolean;
    preserve_legacy_output_format: boolean;
    max_thread_workers: number;
    git_log_chunk_size: number;
    blame_chunk_size: number;
    max_core_workers: number;
    memory_limit_mb: number;
    enable_gc_optimization: boolean;
    max_commit_count: number;
    max_file_size_kb: number;
    follow_renames: boolean;
    ignore_merge_commits: boolean;
}

export const defaultSettings: Settings = {
    // Repository and Input Settings
    input_fstrs: [],
    depth: 5,
    subfolder: "",

    // File Analysis Settings
    n_files: 5,
    include_files: [],
    ex_files: [],
    extensions: [
        "c",
        "cc",
        "cif",
        "cpp",
        "glsl",
        "h",
        "hh",
        "hpp",
        "java",
        "js",
        "py",
        "rb",
        "sql",
        "ts",
    ],

    // Author and Commit Filtering
    ex_authors: [],
    ex_emails: [],
    ex_revisions: [],
    ex_messages: [],
    since: "",
    until: "",

    // Output and Format Settings
    outfile_base: "gitinspect",
    fix: "prefix",
    file_formats: ["html"],
    view: "auto",

    // Analysis Options
    copy_move: 1,
    scaled_percentages: false,
    blame_exclusions: "hide",
    blame_skip: false,
    show_renames: false,

    // Content Analysis
    deletions: false,
    whitespace: false,
    empty_lines: false,
    comments: false,

    // Performance Settings
    multithread: true,
    multicore: false,
    verbosity: 0,

    // Development/Testing
    dryrun: 0,

    // GUI-specific
    gui_settings_full_path: false,
    col_percent: 75,

    // Additional required fields for Python backend compatibility
    ex_author_patterns: [],
    ex_email_patterns: [],
    ex_message_patterns: [],
    ex_file_patterns: [],
    ignore_revs_file: "",
    enable_ignore_revs: false,
    blame_follow_moves: true,
    blame_ignore_whitespace: false,
    blame_minimal_context: false,
    blame_show_email: true,
    output_encoding: "utf-8",
    date_format: "iso",
    author_display_format: "name",
    line_number_format: "decimal",
    excel_max_rows: 1048576,
    excel_abbreviate_names: true,
    excel_freeze_panes: true,
    html_theme: "default",
    html_enable_search: true,
    html_max_entries_per_page: 100,
    server_port: 8000,
    server_host: "localhost",
    max_browser_tabs: 20,
    auto_open_browser: true,
    profile: 0,
    debug_show_main_event_loop: false,
    debug_multiprocessing: false,
    debug_git_commands: false,
    log_git_output: false,
    legacy_mode: false,
    preserve_legacy_output_format: false,
    max_thread_workers: 6,
    git_log_chunk_size: 100,
    blame_chunk_size: 20,
    max_core_workers: 16,
    memory_limit_mb: 1024,
    enable_gc_optimization: true,
    max_commit_count: 0,
    max_file_size_kb: 1024,
    follow_renames: true,
    ignore_merge_commits: false,
};
