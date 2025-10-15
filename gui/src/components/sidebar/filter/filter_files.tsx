import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {Folder } from "lucide-react";
import { SelectedFullProps } from '@/components/types';

type FilterFilesProps = Pick<SelectedFullProps, 'allFiles' | 'selectedFiles' | 'selectFiles'>;

export function FilterFiles({allFiles, selectedFiles, selectFiles}: FilterFilesProps) {

  const filesArray = React.useMemo(() => Array.from(allFiles), [allFiles]);

  const toggle = (id: string) => {
    const set = new Set(selectedFiles);
    set.has(id) ? set.delete(id) : set.add(id);
    selectFiles(Array.from(set));
  };

  const selectAll = () => selectFiles(filesArray);
  const clearAll = () => selectFiles([]);

  return (
    <div className="flex flex-col p-2 gap-1">
      <div className="p-0 gap-0">
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Folder className="h-3 w-3" />
            <span className="text-xs">Files</span>
          </span>
          <span className="flex items-center gap-2">
            <Button variant="secondary" onClick={selectAll} className="h-7 px-2 text-[8px]">
              Select all
            </Button>
            <Button variant="secondary" onClick={clearAll} className="h-7 px-2 text-[8px]">
              Clear all
            </Button>
          </span>
        </span>
      </div>

      <Card className="bg-transparent border-none shadow-none p-0">
        <CardContent className="p-0">
          <ScrollArea className="rounded-md border h-20">
            <ul className="divide-y">
              {filesArray.map((file) => (
                <li key={file} className="flex items-center gap-2 p-1">
                  <Checkbox
                    className="h-3 w-3"
                    checked={selectedFiles.includes(file)}
                    onCheckedChange={() => toggle(file)}
                    aria-label={`Select ${file}`}
                  />
                  <span className="truncate text-[10px]" >
                    {file}
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