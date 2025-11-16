
import type { Dispatch, SetStateAction } from "react";


export type AnalysisProps = { 
  
  allAuthors: Set<string>;
  selectedAuthors: string[];
  selectAuthors: (authors: string[]) => void;

  allFiles: Set<string>;
  selectedFiles: string[];
  selectFiles: (files: string[]) => void;

  filterData: boolean;
  setFilterData: Dispatch<SetStateAction<boolean>>;

  allRepos: Set<string>;
  selectedRepo: string | null;
  setSelectedRepo: Dispatch<SetStateAction<string>>;

  startDate: Date;
  endDate: Date;
  startCommitHash: string;
  endCommitHash: string;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onStartCommitChange: (hash: string) => void;
  onEndCommitChange: (hash: string) => void;

  selectedFile: string | undefined;
  setSelectedFile: Dispatch<SetStateAction<string | null>>;
};


export type Repository = {
  name: string;
  path: string;
  authors: Author[];
  commits: Commit[];
  files: File[];              
  metrics: Metrics;
};

export type Author = {
  id: number;
  name: string;
  email: string;
  aliases_email?: string[];
  commit_hashes: string[];
  files: AuthorFileMetrics[];
  last_modified_date: string;
  last_modified_time: string;
  last_modified_timezone: string;   
  metrics: Metrics; 
};

export type Commit = {
  id: number;
  hash: string;
  author_id: number;
  date: string; 
  time: string;
  timezone: string;   
  message: string;
  files_changed: string[];
  metrics: Metrics;
};

export type File = {
  name: string;
  path: string;
  extension: string;
  file_size?: number;
  lines: Line[];
  metrics: Metrics;  
  last_modified_date: string;
  last_modified_time: string;
  last_modified_timezone: string;      
};

export type Line = {
  number: number;
  content: string;
  commit_hash: string;
  line_type: number;
};

export type LineType = "SLOC" | "CLOC" | "WHITESPACE";

export type Metrics = {
  loc?: number;
  sloc?: number;
  cloc?: number;
  whitespace?: number;
  insertions?: number;
  deletions?: number;
  total_commits?: number;
  total_authors?: number;
  total_files?: number; 
  stability?: number;
};

export type AuthorFileMetrics = {
  file_path: string;
  metrics: Metrics;
};

export type Filter ={
  value: string;
  include: boolean;
}

export type Settings = {
  repositories: string[];
  search_depth: number;
  max_blame_files: number;
  commit_hash_filter?: Filter[];
  commit_message_filter?: Filter[];
  file_types_filter?: Filter[];
  path_filter?: Filter[];
  max_repo_size_mb?: number;
  detect_mode?: string;
  paths?: string[];
  authorNames?: string[];
  authorEmails?: string[];
  commitHashes?: string[]
  commitMessages?: string[];
}

export type AnalysisParameters = {
  repo_path: string;
  from_time?: string;
  to_time?: string;
  from_commit?: string;
  to_commit?: string;
  commit_hash_filter?: Filter[];
  commit_message_filter?: Filter[];
  file_types_filter?: Filter[];
  path_filter?: Filter[];
}

export type AnalysisResult = {
  parameters: AnalysisParameters;
  original_repository?: Repository;
  repository: Repository;
};
