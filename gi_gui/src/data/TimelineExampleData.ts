export type MetricKey = "commits" | "insertions" | "deletions"

export type DailyPoint = {
  date: string
  commits: number
  insertions: number
  deletions: number
}

export type Aggregate = {
  email: string
  commits: number
  insertions: number
  deletions: number
}

export type Author = {
  email: string
  name: string
}

export const authorByEmail: Record<string, Author> = {
  "person1@example.com": { email: "person1@example.com", name: "person1" },
  "person2@example.com": { email: "person2@example.com", name: "person2" },
  "person3@example.com": { email: "person3@example.com", name: "person3" },
  "person4@example.com": { email: "person4@example.com", name: "person4" },
  "person5@example.com": { email: "person5@example.com", name: "person5" },
}

export const authorAggregates: Aggregate[] = [
  { email: "person1@example.com", commits: 79, insertions: 1535, deletions: 912 },
  { email: "person2@example.com", commits: 78, insertions: 1085, deletions: 740 },
  { email: "person3@example.com", commits: 49, insertions: 954, deletions: 724 },
  { email: "person4@example.com", commits: 51, insertions: 951, deletions: 550 },
  { email: "person5@example.com", commits: 37, insertions: 620, deletions: 403 },
]

export const authorSeries: Record<string, DailyPoint[]> = {
  "person1@example.com": [
    { date: "2025-07-01", commits: 8, insertions: 168, deletions: 110 },
    { date: "2025-07-08", commits: 6, insertions: 78, deletions: 66 },
    { date: "2025-07-15", commits: 10, insertions: 250, deletions: 120 },
    { date: "2025-07-22", commits: 11, insertions: 132, deletions: 93 },
    { date: "2025-07-29", commits: 11, insertions: 231, deletions: 126 },
    { date: "2025-08-05", commits: 12, insertions: 192, deletions: 84 },
    { date: "2025-08-12", commits: 6, insertions: 90, deletions: 48 },
    { date: "2025-08-19", commits: 4, insertions: 44, deletions: 44 },
    { date: "2025-08-26", commits: 6, insertions: 168, deletions: 117 },
    { date: "2025-09-02", commits: 5, insertions: 182, deletions: 104 },
  ],
  "person2@example.com": [
    { date: "2025-07-01", commits: 9, insertions: 117, deletions: 63 },
    { date: "2025-07-08", commits: 8, insertions: 96, deletions: 56 },
    { date: "2025-07-15", commits: 10, insertions: 130, deletions: 120 },
    { date: "2025-07-22", commits: 10, insertions: 140, deletions: 70 },
    { date: "2025-07-29", commits: 11, insertions: 198, deletions: 110 },
    { date: "2025-08-05", commits: 9, insertions: 117, deletions: 81 },
    { date: "2025-08-12", commits: 6, insertions: 84, deletions: 60 },
    { date: "2025-08-19", commits: 6, insertions: 66, deletions: 90 },
    { date: "2025-08-26", commits: 5, insertions: 70, deletions: 50 },
    { date: "2025-09-02", commits: 4, insertions: 67, deletions: 40 },
  ],
  "person3@example.com": [
    { date: "2025-07-01", commits: 8, insertions: 192, deletions: 128 },
    { date: "2025-07-08", commits: 3, insertions: 60, deletions: 42 },
    { date: "2025-07-15", commits: 7, insertions: 189, deletions: 70 },
    { date: "2025-07-22", commits: 7, insertions: 112, deletions: 63 },
    { date: "2025-07-29", commits: 4, insertions: 84, deletions: 48 },
    { date: "2025-08-05", commits: 3, insertions: 42, deletions: 42 },
    { date: "2025-08-12", commits: 5, insertions: 85, deletions: 80 },
    { date: "2025-08-19", commits: 5, insertions: 125, deletions: 70 },
    { date: "2025-08-26", commits: 5, insertions: 35, deletions: 105 },
    { date: "2025-09-02", commits: 2, insertions: 30, deletions: 66 },
  ],
  "person4@example.com": [
    { date: "2025-07-01", commits: 7, insertions: 98, deletions: 63 },
    { date: "2025-07-08", commits: 7, insertions: 112, deletions: 42 },
    { date: "2025-07-15", commits: 6, insertions: 120, deletions: 60 },
    { date: "2025-07-22", commits: 7, insertions: 112, deletions: 49 },
    { date: "2025-07-29", commits: 4, insertions: 60, deletions: 56 },
    { date: "2025-08-05", commits: 1, insertions: 5, deletions: 8 },
    { date: "2025-08-12", commits: 5, insertions: 75, deletions: 45 },
    { date: "2025-08-19", commits: 5, insertions: 55, deletions: 65 },
    { date: "2025-08-26", commits: 4, insertions: 80, deletions: 56 },
    { date: "2025-09-02", commits: 5, insertions: 239, deletions: 106 },
  ],
  "person5@example.com": [
    { date: "2025-07-01", commits: 7, insertions: 98, deletions: 56 },
    { date: "2025-07-08", commits: 2, insertions: 20, deletions: 14 },
    { date: "2025-07-15", commits: 2, insertions: 34, deletions: 18 },
    { date: "2025-07-22", commits: 2, insertions: 36, deletions: 14 },
    { date: "2025-07-29", commits: 3, insertions: 48, deletions: 33 },
    { date: "2025-08-05", commits: 6, insertions: 66, deletions: 60 },
    { date: "2025-08-12", commits: 4, insertions: 60, deletions: 52 },
    { date: "2025-08-19", commits: 4, insertions: 52, deletions: 36 },
    { date: "2025-08-26", commits: 4, insertions: 120, deletions: 60 },
    { date: "2025-09-02", commits: 3, insertions: 86, deletions: 60 },
  ],
}


export const timelineDataByMetric: Record<MetricKey, Array<Record<string, string | number | null>>> = {
  commits: [
    { date: "2025-07-01", "person1@example.com": 8,  "person2@example.com": 9,  "person3@example.com": 8,  "person4@example.com": 7,  "person5@example.com": 7 },
    { date: "2025-07-08", "person1@example.com": 6,  "person2@example.com": 8,  "person3@example.com": 3,  "person4@example.com": 7,  "person5@example.com": 2 },
    { date: "2025-07-15", "person1@example.com": 10, "person2@example.com": 10, "person3@example.com": 7,  "person4@example.com": 6,  "person5@example.com": 2 },
    { date: "2025-07-22", "person1@example.com": 11, "person2@example.com": 10, "person3@example.com": 7,  "person4@example.com": 7,  "person5@example.com": 2 },
    { date: "2025-07-29", "person1@example.com": 11, "person2@example.com": 11, "person3@example.com": 4,  "person4@example.com": 4,  "person5@example.com": 3 },
    { date: "2025-08-05", "person1@example.com": 12, "person2@example.com": 9,  "person3@example.com": 3,  "person4@example.com": 1,  "person5@example.com": 6 },
    { date: "2025-08-12", "person1@example.com": 6,  "person2@example.com": 6,  "person3@example.com": 5,  "person4@example.com": 5,  "person5@example.com": 4 },
    { date: "2025-08-19", "person1@example.com": 4,  "person2@example.com": 6,  "person3@example.com": 5,  "person4@example.com": 5,  "person5@example.com": 4 },
    { date: "2025-08-26", "person1@example.com": 6,  "person2@example.com": 5,  "person3@example.com": 5,  "person4@example.com": 4,  "person5@example.com": 4 },
    { date: "2025-09-02", "person1@example.com": 5,  "person2@example.com": 4,  "person3@example.com": 2,  "person4@example.com": 5,  "person5@example.com": 3 },
  ],
  insertions: [
    { date: "2025-07-01", "person1@example.com": 168, "person2@example.com": 117, "person3@example.com": 192, "person4@example.com": 98,  "person5@example.com": 98 },
    { date: "2025-07-08", "person1@example.com": 78,  "person2@example.com": 96,  "person3@example.com": 60,  "person4@example.com": 112, "person5@example.com": 20 },
    { date: "2025-07-15", "person1@example.com": 250, "person2@example.com": 130, "person3@example.com": 189, "person4@example.com": 120, "person5@example.com": 34 },
    { date: "2025-07-22", "person1@example.com": 132, "person2@example.com": 140, "person3@example.com": 112, "person4@example.com": 112, "person5@example.com": 36 },
    { date: "2025-07-29", "person1@example.com": 231, "person2@example.com": 198, "person3@example.com": 84,  "person4@example.com": 60,  "person5@example.com": 48 },
    { date: "2025-08-05", "person1@example.com": 192, "person2@example.com": 117, "person3@example.com": 42,  "person4@example.com": 5,   "person5@example.com": 66 },
    { date: "2025-08-12", "person1@example.com": 90,  "person2@example.com": 84,  "person3@example.com": 85,  "person4@example.com": 75,  "person5@example.com": 60 },
    { date: "2025-08-19", "person1@example.com": 44,  "person2@example.com": 66,  "person3@example.com": 125, "person4@example.com": 55,  "person5@example.com": 52 },
    { date: "2025-08-26", "person1@example.com": 168, "person2@example.com": 70,  "person3@example.com": 35,  "person4@example.com": 80,  "person5@example.com": 120 },
    { date: "2025-09-02", "person1@example.com": 182, "person2@example.com": 67,  "person3@example.com": 30,  "person4@example.com": 239, "person5@example.com": 86 },
  ],
  deletions: [
    { date: "2025-07-01", "person1@example.com": 110, "person2@example.com": 63,  "person3@example.com": 128, "person4@example.com": 63,  "person5@example.com": 56 },
    { date: "2025-07-08", "person1@example.com": 66,  "person2@example.com": 56,  "person3@example.com": 42,  "person4@example.com": 42,  "person5@example.com": 14 },
    { date: "2025-07-15", "person1@example.com": 120, "person2@example.com": 120, "person3@example.com": 70,  "person4@example.com": 60,  "person5@example.com": 18 },
    { date: "2025-07-22", "person1@example.com": 93,  "person2@example.com": 70,  "person3@example.com": 63,  "person4@example.com": 49,  "person5@example.com": 14 },
    { date: "2025-07-29", "person1@example.com": 126, "person2@example.com": 110, "person3@example.com": 48,  "person4@example.com": 56,  "person5@example.com": 33 },
    { date: "2025-08-05", "person1@example.com": 84,  "person2@example.com": 81,  "person3@example.com": 42,  "person4@example.com": 8,   "person5@example.com": 60 },
    { date: "2025-08-12", "person1@example.com": 48,  "person2@example.com": 60,  "person3@example.com": 80,  "person4@example.com": 45,  "person5@example.com": 52 },
    { date: "2025-08-19", "person1@example.com": 44,  "person2@example.com": 90,  "person3@example.com": 70,  "person4@example.com": 65,  "person5@example.com": 36 },
    { date: "2025-08-26", "person1@example.com": 117, "person2@example.com": 50,  "person3@example.com": 105, "person4@example.com": 56,  "person5@example.com": 60 },
    { date: "2025-09-02", "person1@example.com": 104, "person2@example.com": 40,  "person3@example.com": 66,  "person4@example.com": 106, "person5@example.com": 60 },
  ],
}

