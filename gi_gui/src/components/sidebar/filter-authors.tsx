import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const authors = [
  { id: "person1", name: "person1" },
  { id: "person2", name: "person2" },
  { id: "person3", name: "person3" },
  { id: "person4", name: "person4" },
  { id: "person5", name: "person5" },
];

export function FilterAuthors() {
  
  const allIds = React.useMemo(() => authors.map((a) => a.id), [authors]);
  const [value, onChange] = React.useState<string[]>([
  "person1",
  "person2",
  "person3",
  "person4"
])

  const toggle = (id: string) => {
    const set = new Set(value);
    set.has(id) ? set.delete(id) : set.add(id);
    onChange(Array.from(set));
  };

  const selectAll = () => onChange(allIds);
  const clearAll = () => onChange([]);

  return (
    <div className="flex flex-col p-2 gap-1">
     <div className="p-0 gap-0">
          <Button variant="secondary" onClick={selectAll} className="h-7 px-2 text-[10px]">
            Select all
          </Button>
          <Button variant="secondary"  onClick={clearAll} className="h-7 px-2 text-[10px]">
            Clear all
          </Button>
        </div>

    <Card className="bg-transparent border-none shadow-none p-0 ">
      <CardContent className="p-0">
        <ScrollArea className="rounded-md border">
          <ul className="divide-y">
            {authors.map((author) => (
              <li key={author.id} className="flex items-center gap-2 p-1">
                <Checkbox
                    className="h- w-4"
                  checked={value.includes(author.id)}
                  onCheckedChange={() => toggle(author.id)}
                  aria-label={`Select ${author.name}`}
                />
                <span className="truncate text-xs">{author.name}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  </div>
  );
}


