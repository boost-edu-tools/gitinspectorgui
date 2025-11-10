export const shortHash = (h: string) => h.slice(0, 7)

export const fmtDate = (d: Date | null) => {
  if (!d) return "—"
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
}
