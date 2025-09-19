
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import commits from "@/data/CommitListExampleData"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown } from "lucide-react"
import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


function formatCompact(ts: string) {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  // Compact ISO-like format: YYYY-MM-DD HH:mm
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function shortHash(hash: string) {
  return hash.slice(0, 7)
}

export function CommitsTable() {

    const allowed = new Set(["person1", "person2", "person3", "person4"]);
    const [selectedFileType, setSelectedFileType] = useState("CSV");
    
  return (
    <div>

        <div className="grid w-full [&>div]:border [&>div]:rounded">
          <Table>
            <TableHeader>
              <TableRow className="*:whitespace-nowrap hover:bg-background">
                <TableHead className="pl-4 sticky left-0 bg-background min-w-[50px]">Hash</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="text-right">Insertions</TableHead>
                <TableHead className="text-right">Deletions</TableHead>
                <TableHead className="text-right">LOCs changed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-hidden">
              {commits
                .filter(c => allowed.has(c.name))
                .map((c) => {
                const name = c.name
                const plus = c.insertions
                const minus = c.deletions
                const delta = plus + minus
                return (
                  <TableRow key={c.hash} className="odd:bg-muted/30 hover:bg-muted/50 [&>td]:px-2 [&>td]:py-1">
                    <TableCell className="pl-4 sticky left-0 bg-background group-odd:bg-muted group-hover:bg-blue-100">
                      {shortHash(c.hash)}
                      <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{c.message}</div>
                    </TableCell>
                    <TableCell >{name}</TableCell>
                    <TableCell>{formatCompact(c.timestamp)}</TableCell>
                    <TableCell className="text-right">{plus.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{minus.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{delta.toLocaleString()}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
            
            <div className="mt-4 flex justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger>
                <Button variant="secondary">
                    {selectedFileType}
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Choose file type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedFileType("HTML")}>
                    HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFileType("CSV")}>
                    CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFileType("JSON")}>
                    JSON
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="hover:bg-muted/50">
                Export
            </Button>
        </div>

        </div>
        

  )
}
