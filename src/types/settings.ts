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
  extensions: ["c", "cc", "cif", "cpp", "glsl", "h", "hh", "hpp", "java", "js", "py", "rb", "sql", "ts"],
  
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
};