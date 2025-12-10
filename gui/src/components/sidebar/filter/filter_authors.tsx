import { Button } from "@/components/ui/button";
import { Card, CardContent} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuthorColor } from "@/components/helpers/author_colors";
import { User} from "lucide-react";
import { AnalysisProps } from '@/components/types';

export function FilterAuthors({
  allAuthors, 
  selectedAuthors, 
  selectAuthors}: 
  Pick<
  AnalysisProps, 
  'allAuthors'  
  |'selectedAuthors'  
  |'selectAuthors'>) {
  
  const toggle = (name: string) => {
    const set = new Set(selectedAuthors);
    set.has(name) ? set.delete(name) : set.add(name);
    selectAuthors(Array.from(set));
  };

  const selectAll = () => selectAuthors(Array.from(allAuthors));
  const clearAll = () => selectAuthors([]);

  return (
    <div className="flex flex-col p-2 gap-1">
      <div className="p-0 gap-0">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span className="text-xs">Authors</span>
          </span>
          <span className="flex items-center gap-2">
            <Button variant="secondary" onClick={selectAll} className="h-7 px-2 text-[8px] bg-gray-200 hover:bg-gray-300 text-gray-900">
              Select all
            </Button>
            <Button variant="secondary" onClick={clearAll} className="h-7 px-2 text-[8px] bg-gray-200 hover:bg-gray-300 text-gray-900">
              Clear all
            </Button>
          </span>
        </span>
      </div>

      <Card className="bg-transparent border-none shadow-none p-0 ">
        <CardContent className="p-0">
          <ScrollArea className="rounded-md border h-25">
            <ul className="divide-y">
              {Array.from(allAuthors)
              .sort((a, b) => a.localeCompare(b))
              .map((author: string) => (
                <li key={author} className="flex items-center gap-2 p-1">
                  <Checkbox
                    className="h-3 w-3"
                    checked={selectedAuthors.includes(author)}
                    onCheckedChange={() => toggle(author)}
                    aria-label={`Select ${author}`}
                  />
                  <span className="truncate text-[10px]" style={{color: getAuthorColor(author).color}}>
                    {author}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}