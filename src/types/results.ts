export interface AuthorStat {
  name: string;
  email: string;
  commits: number;
  insertions: number;
  deletions: number;
  files: number;
  percentage: number;
}

export interface FileStat {
  name: string;
  path: string;
  lines: number;
  commits: number;
  authors: number;
  percentage: number;
}

export interface BlameEntry {
  file: string;
  line_number: number;
  author: string;
  commit: string;
  date: string;
  content: string;
}

export interface RepositoryResult {
  name: string;
  path: string;
  authors: AuthorStat[];
  files: FileStat[];
  blame_data: BlameEntry[];
}

export interface AnalysisResult {
  repositories: RepositoryResult[];
  success: boolean;
  error?: string;
}