import { useMemo, useState } from "react"
import { Settings } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import {
  MetricKey,
  authorByEmail,
  timelineDataByMetric
} from "@/data/TimelineExampleData"

const COLORS = [
  "#3b82f6",
  "#22c55e", 
  "#f59e0b", 
  "#ef4444", "#a855f7", "#14b8a6", "#eab308", "#f97316",
  "#06b6d4", "#84cc16", "#fb7185", "#64748b",
]

function colorForIndex(i: number) {
  return COLORS[i % COLORS.length]
}

export function Timeline() {
  const [metric, setMetric] = useState<MetricKey>("commits") 

  const selectedAuthors = useMemo(() => {
  const allowedNames = new Set(["person1", "person2", "person3", "person4"])
  return Object.entries(authorByEmail)
    .filter(([, a]) => allowedNames.has(a.name))
    .map(([email]) => email)
}, [])

  const [dialogOpen, setDialogOpen] = useState(false)

  const data = useMemo(() => timelineDataByMetric[metric], [metric])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="text-sm font-medium mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, idx: number) => {
            const email = entry.dataKey
            const author = authorByEmail[email]
            const name = author?.name ?? email
            return (
              <p key={idx} className="text-sm" style={{ color: entry.color }}>
                {name}: {Number(entry.value).toLocaleString()}
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div>

          <div className="flex items-center justify-end gap-2">
            <Badge variant="outline">{metric}</Badge>
            <Button variant="ghost" onClick={() => setDialogOpen(true)} aria-label="Choose metric">
              <Settings className="mr-2 h-4 w-4" />
            </Button>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 24, left: 16, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tickFormatter={formatDate} interval="preserveStartEnd" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {selectedAuthors.map((email, i) => {
                  const author = authorByEmail[email]
                  const stroke = colorForIndex(i)
                  return (
                    <Line
                      key={email}
                      type="monotone"
                      dataKey={email} 
                      name={author?.name ?? email}
                      stroke={stroke}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose metric</DialogTitle>
          </DialogHeader>

          <div className="py-2">

            <RadioGroup
              value={metric}
              onValueChange={(v: MetricKey) => setMetric(v)}
              className="space-y-3"
            >
              <label className="flex items-center gap-3 cursor-pointer" htmlFor="metric-commits">
                <RadioGroupItem value="commits" id="metric-commits" />
                <span>Commits</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer" htmlFor="metric-insertions">
                <RadioGroupItem value="insertions" id="metric-insertions" />
                <span>Insertions</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer" htmlFor="metric-deletions">
                <RadioGroupItem value="deletions" id="metric-deletions" />
                <span>Deletions</span>
              </label>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
