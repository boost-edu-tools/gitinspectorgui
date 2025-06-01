export interface Settings {
  input_fstrs: string[];
  depth: number;
  n_files: number;
  include_files: string[];
  ex_files: string[];
  ex_authors: string[];
  ex_emails: string[];
  ex_revisions: string[];
  ex_messages: string[];
  copy_move: number;
  scaled_percentages: boolean;
  blame_exclusions: boolean;
  dynamic_blame_history: boolean;
  dryrun: boolean;
}

export const defaultSettings: Settings = {
  input_fstrs: [],
  depth: 3,
  n_files: 100,
  include_files: [],
  ex_files: [],
  ex_authors: [],
  ex_emails: [],
  ex_revisions: [],
  ex_messages: [],
  copy_move: 0,
  scaled_percentages: false,
  blame_exclusions: false,
  dynamic_blame_history: false,
  dryrun: false,
};