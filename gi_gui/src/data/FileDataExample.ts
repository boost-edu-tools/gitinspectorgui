export type BlameInfo = {
  authorName: string
  authorEmail: string
  commitHash: string
  commitMessage: string
  timestamp: string
}

export type FileLine = {
  no: number
  text: string
  lastChange: BlameInfo
}

export type RepoFile = {
  path: string
  lines: FileLine[]
}

export const repoFiles: RepoFile[] = [
  {
    path: "src/example1.tsx",
    lines: [
      // commit1 — person1 (lines 1–3)
      { no: 1, text: "// math library", lastChange: { authorName: "person1", authorEmail: "person1@example.com", commitHash: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0", commitMessage: "commit1", timestamp: "2025-09-02T14:33:00Z" } },
      { no: 2, text: "export function add(a: number, b: number) {", lastChange: { authorName: "person1", authorEmail: "person1@example.com", commitHash: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0", commitMessage: "commit1", timestamp: "2025-09-02T14:33:00Z" } },
      { no: 3, text: "  return a + b", lastChange: { authorName: "person1", authorEmail: "person1@example.com", commitHash: "c1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0", commitMessage: "commit1", timestamp: "2025-09-02T14:33:00Z" } },

      // commit2 — person2 (lines 4–6)
      { no: 4, text: "}", lastChange: { authorName: "person2", authorEmail: "person2@example.com", commitHash: "a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2c1", commitMessage: "commit2", timestamp: "2025-09-01T09:12:00Z" } },
      { no: 5, text: "export function sub(a: number, b: number) {", lastChange: { authorName: "person2", authorEmail: "person2@example.com", commitHash: "a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2c1", commitMessage: "commit2", timestamp: "2025-09-01T09:12:00Z" } },
      { no: 6, text: "  return a - b", lastChange: { authorName: "person2", authorEmail: "person2@example.com", commitHash: "a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2c1", commitMessage: "commit2", timestamp: "2025-09-01T09:12:00Z" } },

      // commit4 — person4 (lines 7–9)
      { no: 7, text: "}", lastChange: { authorName: "person4", authorEmail: "person4@example.com", commitHash: "1234567890abcdef1234567890abcdef12345678", commitMessage: "commit4", timestamp: "2025-08-28T08:05:00Z" } },
      { no: 8, text: "export const PI = 3.14159", lastChange: { authorName: "person4", authorEmail: "person4@example.com", commitHash: "1234567890abcdef1234567890abcdef12345678", commitMessage: "commit4", timestamp: "2025-08-28T08:05:00Z" } },
      { no: 9, text: "export function mul(a: number, b: number) {", lastChange: { authorName: "person4", authorEmail: "person4@example.com", commitHash: "1234567890abcdef1234567890abcdef12345678", commitMessage: "commit4", timestamp: "2025-08-28T08:05:00Z" } },

      // commit6 — person1 (lines 10–12)
      { no: 10, text: "  return a * b", lastChange: { authorName: "person1", authorEmail: "person1@example.com", commitHash: "fedcba9876543210fedcba9876543210fedcba98", commitMessage: "commit6", timestamp: "2025-08-25T10:02:00Z" } },
      { no: 11, text: "}", lastChange: { authorName: "person1", authorEmail: "person1@example.com", commitHash: "fedcba9876543210fedcba9876543210fedcba98", commitMessage: "commit6", timestamp: "2025-08-25T10:02:00Z" } },
      { no: 12, text: "export function area(r: number) {", lastChange: { authorName: "person1", authorEmail: "person1@example.com", commitHash: "fedcba9876543210fedcba9876543210fedcba98", commitMessage: "commit6", timestamp: "2025-08-25T10:02:00Z" } },

      // commit9 — person4 (lines 13–15)
      { no: 13, text: "  return PI * r * r", lastChange: { authorName: "person4", authorEmail: "person4@example.com", commitHash: "0f1e2d3c4b5a69788776655443322110ffeeddcc", commitMessage: "commit9", timestamp: "2025-08-18T11:11:00Z" } },
      { no: 14, text: "}", lastChange: { authorName: "person4", authorEmail: "person4@example.com", commitHash: "0f1e2d3c4b5a69788776655443322110ffeeddcc", commitMessage: "commit9", timestamp: "2025-08-18T11:11:00Z" } },
      { no: 15, text: "export default { add, sub, mul, area }", lastChange: { authorName: "person4", authorEmail: "person4@example.com", commitHash: "0f1e2d3c4b5a69788776655443322110ffeeddcc", commitMessage: "commit9", timestamp: "2025-08-18T11:11:00Z" } },

      // commit10 — person5 (lines 16–17)
      { no: 16, text: "// end of file", lastChange: { authorName: "person5", authorEmail: "person5@example.com", commitHash: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef", commitMessage: "commit10", timestamp: "2025-08-15T19:30:00Z" } },
      { no: 17, text: "", lastChange: { authorName: "person5", authorEmail: "person5@example.com", commitHash: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef", commitMessage: "commit10", timestamp: "2025-08-15T19:30:00Z" } },
    ],
  },
  {
    path: "src/example2.tsx",
    lines: [
      // commit3 — person3 (lines 1–2)
      { no: 1, text: "import React from 'react'", lastChange: { authorName: "person3", authorEmail: "person3@example.com", commitHash: "0abc1def23456789fedcba9876543210aaaabbbb", commitMessage: "commit3", timestamp: "2025-08-29T17:45:00Z" } },
      { no: 2, text: "type Props = { label: string }", lastChange: { authorName: "person3", authorEmail: "person3@example.com", commitHash: "0abc1def23456789fedcba9876543210aaaabbbb", commitMessage: "commit3", timestamp: "2025-08-29T17:45:00Z" } },

      // commit4 — person4 (lines 3–5)
      { no: 3, text: "export default function Button({ label }: Props) {", lastChange: { authorName: "person4", authorEmail: "person4@example.com", commitHash: "1234567890abcdef1234567890abcdef12345678", commitMessage: "commit4", timestamp: "2025-08-28T08:05:00Z" } },
      { no: 4, text: "  return <button className=\"btn\">{label}</button>", lastChange: { authorName: "person4", authorEmail: "person4@example.com", commitHash: "1234567890abcdef1234567890abcdef12345678", commitMessage: "commit4", timestamp: "2025-08-28T08:05:00Z" } },
      { no: 5, text: "}", lastChange: { authorName: "person4", authorEmail: "person4@example.com", commitHash: "1234567890abcdef1234567890abcdef12345678", commitMessage: "commit4", timestamp: "2025-08-28T08:05:00Z" } },

      // commit5 — person5 (lines 6–8)
      { no: 6, text: "export const ButtonAlt = ({ label }: Props) => (", lastChange: { authorName: "person5", authorEmail: "person5@example.com", commitHash: "abcdefabcdefabcdefabcdefabcdefabcdefabcd", commitMessage: "commit5", timestamp: "2025-08-27T13:20:00Z" } },
      { no: 7, text: "  <button className=\"btn alt\">{label}</button>", lastChange: { authorName: "person5", authorEmail: "person5@example.com", commitHash: "abcdefabcdefabcdefabcdefabcdefabcdefabcd", commitMessage: "commit5", timestamp: "2025-08-27T13:20:00Z" } },
      { no: 8, text: ")", lastChange: { authorName: "person5", authorEmail: "person5@example.com", commitHash: "abcdefabcdefabcdefabcdefabcdefabcdefabcd", commitMessage: "commit5", timestamp: "2025-08-27T13:20:00Z" } },

      // commit6 — person1 (lines 9–10)
      { no: 9, text: "export const ICON = () => (\n  <svg />\n)", lastChange: { authorName: "person1", authorEmail: "person1@example.com", commitHash: "fedcba9876543210fedcba9876543210fedcba98", commitMessage: "commit6", timestamp: "2025-08-25T10:02:00Z" } },
      { no: 10, text: "// styles below", lastChange: { authorName: "person1", authorEmail: "person1@example.com", commitHash: "fedcba9876543210fedcba9876543210fedcba98", commitMessage: "commit6", timestamp: "2025-08-25T10:02:00Z" } },

      // commit7 — person2 (lines 11–12)
      { no: 11, text: "export const cls = (s: string) => 'btn ' + s", lastChange: { authorName: "person2", authorEmail: "person2@example.com", commitHash: "aaaabbbbccccddddeeeeffff1111222233334444", commitMessage: "commit7", timestamp: "2025-08-22T16:40:00Z" } },
      { no: 12, text: "// end of component", lastChange: { authorName: "person2", authorEmail: "person2@example.com", commitHash: "aaaabbbbccccddddeeeeffff1111222233334444", commitMessage: "commit7", timestamp: "2025-08-22T16:40:00Z" } },

      // commit8 — person3 (lines 13–14)
      { no: 13, text: "// simple button", lastChange: { authorName: "person3", authorEmail: "person3@example.com", commitHash: "1111222233334444555566667777888899990000", commitMessage: "commit8", timestamp: "2025-08-20T07:58:00Z" } },
      { no: 14, text: "", lastChange: { authorName: "person3", authorEmail: "person3@example.com", commitHash: "1111222233334444555566667777888899990000", commitMessage: "commit8", timestamp: "2025-08-20T07:58:00Z" } },
    ],
  },
]

export default repoFiles
