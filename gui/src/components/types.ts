import type { Dispatch, SetStateAction } from "react";

export type SelectedFullProps = { 
  allAuthors: Set<string>;
  selectedAuthors: string[];
  selectAuthors: (authors: string[]) => void;
  allFiles: Set<string>;
  selectedFiles: string[];
  selectFiles: (authors: string[]) => void;
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
};

export type Metrics = {
  insertions?: number;
  deletions?: number;
  loc?: number;
  sloc?: number;
  cloc?: number;
  total_commits?: number;
  total_authors?: number;
  total_files?: number;
};

export type AuthorFileMetrics = {
  file_path: string;
  metrics: Metrics;
};

export type AuthorId = string;

export type Author = {
  id: AuthorId;         
  name: string;
  email: string;
  metrics: Metrics;
  files?: AuthorFileMetrics[];
};

export type LineEntry = {
  number: number;
  content: string;
  authorId: AuthorId;   
  commit_hash: string;
  date: string;
};

export type FileEntry = {
  name: string;
  extension: string;
  path: string;
  file_size: number;
  lines: LineEntry[];
  metrics: Metrics;
};

export type Commit = {
  hash: string;
  authorId: AuthorId;    
  date: string;
  message: string;
  files_changed: FileEntry[];
  metrics: Metrics;
};

export type Repository = {
  name: string;
  path: string;
  authors: Author[];
  commits: Commit[];
  files: string[];
  metrics: Metrics;
};

export type AnalysisResult = {
  parameters: {
    repo_path: string;
    from_time: string;
    to_time: string;
    from_commit: string;
    to_commit: string;
    exclude_authors: AuthorId[];  
    exclude_files: any[];
  };
  repository: Repository;
};

