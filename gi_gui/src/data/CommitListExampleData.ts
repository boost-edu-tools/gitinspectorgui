export type Commit = {
  hash: string
  authorEmail: string
  name: string
  timestamp: string // ISO string
  insertions: number
  deletions: number
  message: string
}

export const commits: Commit[] = [
  {
    hash: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    authorEmail: "person1@example.com",
    name: "person1",
    timestamp: "2025-09-02T14:33:00Z",
    insertions: 120,
    deletions: 45,
    message: "commit1",
  },
  {
    hash: "a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2c1",
    authorEmail: "person2@example.com",
    name: "person2",
    timestamp: "2025-09-01T09:12:00Z",
    insertions: 32,
    deletions: 18,
    message: "commit2",
  },
  {
    hash: "0abc1def23456789fedcba9876543210aaaabbbb",
    authorEmail: "person3@example.com",
    name: "person3",
    timestamp: "2025-08-29T17:45:00Z",
    insertions: 12,
    deletions: 20,
    message: "commit3",
  },
  {
    hash: "1234567890abcdef1234567890abcdef12345678",
    authorEmail: "person4@example.com",
    name: "person4",
    timestamp: "2025-08-28T08:05:00Z",
    insertions: 260,
    deletions: 110,
    message: "commit4",
  },
  {
    hash: "abcdefabcdefabcdefabcdefabcdefabcdefabcd",
    authorEmail: "person5@example.com",
    name: "person5",
    timestamp: "2025-08-27T13:20:00Z",
    insertions: 40,
    deletions: 12,
    message: "commit5",
  },
  {
    hash: "fedcba9876543210fedcba9876543210fedcba98",
    authorEmail: "person1@example.com",
    name: "person1",
    timestamp: "2025-08-25T10:02:00Z",
    insertions: 85,
    deletions: 60,
    message: "commit6",
  },
  {
    hash: "aaaabbbbccccddddeeeeffff1111222233334444",
    authorEmail: "person2@example.com",
    name: "person2",
    timestamp: "2025-08-22T16:40:00Z",
    insertions: 15,
    deletions: 6,
    message: "commit7",
  }
]

export default commits
