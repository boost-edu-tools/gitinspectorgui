
export const METRIC_DESCRIPTIONS = {
  total_commits:   { label: "Commits",   description: "Total number of commits that modified this file" },
  insertions:{ label: "Insertions",description: "Total number of lines added to this file across all commits" },
  deletions: { label: "Deletions", description: "Total number of lines removed from this file across all commits" },
  loc:       { label: "LOC",       description: "Total lines including blanks and comments" },
  sloc:      { label: "SLOC",      description: "Source lines (excludes blanks/comments)" },
  stability: { label: "Stability", description: "Ratio of LOCs/insertions (%)" },
  last_modified:       { label: "Last modified (Y:M:D)",description: "Time elapsed since the last commit, shown in years, months, and days" },
} as const

