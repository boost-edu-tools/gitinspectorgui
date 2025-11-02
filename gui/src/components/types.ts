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


  commits?: number;

  total_commits?: number;
  total_authors?: number;
  total_files?: number;

  age?: number;
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
  aliases_email?: string[];
  files?: AuthorFileMetrics[];
};


export type LineEntry = {
  number: number;
  content: string;
  authorId: AuthorId;
  commitHash: string;       
  commitMessage: string;   
  date: string;            
  line_type: number
};


export type FileEntry = {
  path: string;
  lines: LineEntry[];
  metrics?: Metrics;        
};


export type FileMetadataEntry = {
  path: string;
  metrics: Metrics;
};


export type Commit = {
  number: number;
  hash: string;
  authorId: AuthorId;
  message: string;
  date: string;             // ISO
  insertions: number;
  deletions: number;
  changesPercent: number;
};


export type Repository = {
  name: string;
  path: string;
  authors: Author[];
  commits: Commit[];
  files: FileEntry[];              
  files_metadata?: FileMetadataEntry[];
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
