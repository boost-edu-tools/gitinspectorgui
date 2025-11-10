import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { METRIC_DESCRIPTIONS } from "@/components/main_window/metrics_descriptions"
import { Info } from "lucide-react"

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

export const fmt_pct_abs = (v: number, total: number, displayMode: string) => {
    return displayMode === "percentage"
      ? `${total ? ((v / total) * 100).toFixed(0) : "0"}%`
      : String(v)}


export const time_diff_YDH = (ms: number) => {
    const MS_PER_HOUR = 60 * 60 * 1000;
    const MS_PER_DAY  = 24 * MS_PER_HOUR;
    const MS_PER_YEAR = 365 * MS_PER_DAY; 

    const years = Math.floor(ms / MS_PER_YEAR);
    ms %= MS_PER_YEAR;
    const days  = Math.floor(ms / MS_PER_DAY);
    ms %= MS_PER_DAY;
    const hours = Math.floor(ms / MS_PER_HOUR);

    return { years, days, hours };
};

export function MetricHeader({ metricKey }: { metricKey: keyof typeof METRIC_DESCRIPTIONS}) {
  const info = METRIC_DESCRIPTIONS[metricKey]
  return (
    <div className="flex items-center gap-1 justify-end">
      <span>{info.label}</span>
      <TooltipProvider >
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{info.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

