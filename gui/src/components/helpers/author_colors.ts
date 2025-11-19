
type Hex = `#${string}`

export type AuthorColor = {
  name: string
  color: Hex
  bgColor: Hex
}

const PALETTE = [
  { color: "#2563eb", bgColor: "#dbeafe40" }, // blue
  { color: "#059669", bgColor: "#d1fae540" }, // emerald
  { color: "#dc2626", bgColor: "#fee2e240" }, // red
  { color: "#7c3aed", bgColor: "#ede9fe40" }, // violet
  { color: "#ea580c", bgColor: "#fed7aa40" }, // orange
  { color: "#0d9488", bgColor: "#ccfbf140" }, // teal
  { color: "#ca8a04", bgColor: "#fef9c340" }, // yellow
  { color: "#0891b2", bgColor: "#cffafe40" }, // cyan
  { color: "#65a30d", bgColor: "#ecfccb40" }, // lime
  { color: "#db2777", bgColor: "#fce7f340" }, // pink
  { color: "#4f46e5", bgColor: "#e0e7ff40" }, // indigo
  { color: "#0284c7", bgColor: "#e0f2fe40" }, // sky
  { color: "#e11d48", bgColor: "#ffe4e640" }, // rose
  { color: "#c026d3", bgColor: "#fae8ff40" }, // fuchsia
  { color: "#475569", bgColor: "#f1f5f940" }, // slate
  { color: "#15803d", bgColor: "#dcfce740" }, // green
  { color: "#c2410c", bgColor: "#ffedd540" }, // deep orange
  { color: "#6d28d9", bgColor: "#ede9fe40" }, // purple
  { color: "#b91c1c", bgColor: "#fee2e240" }, // deep red
  { color: "#047857", bgColor: "#d1fae540" }, // deep emerald
] as const satisfies ReadonlyArray<{ color: Hex; bgColor: Hex }>

let MAP: Record<string, AuthorColor> = {}

export function initializeAuthorColors(authors: readonly string[]) {
  MAP = {}
  authors.forEach((name, i) => {
    const entry = PALETTE[i % PALETTE.length]
    MAP[name] = { name, ...entry }
  })
}

export function getAuthorColor(name: string): AuthorColor {
  const hit = MAP[name]
  if (hit) return hit
  const idx = Object.keys(MAP).length % PALETTE.length
  const entry = PALETTE[idx]
  const out: AuthorColor = { name, ...entry }
  MAP[name] = out
  return out
}

