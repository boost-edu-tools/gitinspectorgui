import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import data from "@/data/OverviewExampleData.json";

const authorData = data;
const allowed = new Set(["person1", "person2", "person3", "person4"]);
const filtered = authorData.filter(a => allowed.has(a.name));

export function DataTable() {
  return (
    <div className="grid w-full [&>div]:border [&>div]:rounded">
      <Table>
        <TableHeader>
          <TableRow className="*:whitespace-nowrap hover:bg-background">
            <TableHead className="pl-4 sticky left-0 bg-background min-w-[50px]">
              Name
            </TableHead>
            <TableHead>Commits</TableHead>
            <TableHead>Insertions</TableHead>
            <TableHead>Deletions</TableHead>
            <TableHead>% of changes</TableHead>
            <TableHead>LOCs</TableHead>
            <TableHead>% in comments</TableHead>
            
          </TableRow>
        </TableHeader>
        <TableBody className="overflow-hidden">
          {filtered.map((author) => (
            <TableRow
              key={author.name}
              className="group odd:bg-muted [&>td]:whitespace-nowrap hover:[&>td]:bg-blue-100 dark:hover:[&>td]:bg-blue-400"
            >
              <TableCell className="pl-4 sticky left-0 bg-background group-odd:bg-muted group-hover:bg-blue-100">
                {author.name}
              </TableCell>
              <TableCell>{author.commits}</TableCell>
              <TableCell>{author.insertions}</TableCell>
              <TableCell>{author.deletions}</TableCell>
              <TableCell>{author.percentage_of_changes}</TableCell>
              <TableCell>{author.rows}</TableCell>
              <TableCell>{author.percentage_in_comments}</TableCell>
              
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}