import { useSettingsStore } from "@/stores/settingsStore";
import { useResultsStore } from "@/stores/resultsStore";
import { Button } from "@/components/ui/button";

export function ExecuteButton() {
  const { settings } = useSettingsStore();
  const { runAnalysis, isAnalyzing, setResults } = useResultsStore();

  const handleExecute = async () => {
    if (settings.input_fstrs.length === 0) {
      alert("Please specify at least one repository path");
      return;
    }
    
    await runAnalysis(settings);
  };

  const handleTestPhase3 = () => {
    // Mock data for testing Phase 3 features
    const mockResults = {
      success: true,
      repositories: [
        {
          name: "GitInspectorGUI",
          path: "/Users/dvbeek/1-repos/gitlab/gitinspectorgui",
          authors: [
            { name: "John Doe", email: "john@example.com", commits: 45, insertions: 3421, deletions: 892, files: 28, percentage: 28.8 },
            { name: "Jane Smith", email: "jane@example.com", commits: 38, insertions: 2876, deletions: 654, files: 22, percentage: 24.4 },
            { name: "Bob Wilson", email: "bob@example.com", commits: 32, insertions: 2234, deletions: 445, files: 18, percentage: 20.5 },
            { name: "Alice Brown", email: "alice@example.com", commits: 25, insertions: 1987, deletions: 321, files: 15, percentage: 16.0 },
            { name: "Charlie Davis", email: "charlie@example.com", commits: 16, insertions: 1329, deletions: 287, files: 12, percentage: 10.3 }
          ],
          files: [
            { name: "main.tsx", path: "src/main.tsx", lines: 245, commits: 23, authors: 4, percentage: 19.1 },
            { name: "App.tsx", path: "src/App.tsx", lines: 189, commits: 18, authors: 3, percentage: 14.7 },
            { name: "Table.tsx", path: "src/components/Table.tsx", lines: 156, commits: 12, authors: 2, percentage: 12.1 },
            { name: "helpers.ts", path: "src/utils/helpers.ts", lines: 134, commits: 15, authors: 3, percentage: 10.4 },
            { name: "README.md", path: "README.md", lines: 89, commits: 8, authors: 4, percentage: 6.9 }
          ],
          blame_data: [
            { file: "src/main.tsx", line_number: 1, author: "John Doe", commit: "abc123", date: "2025-05-28", content: "import React from 'react'" },
            { file: "src/main.tsx", line_number: 2, author: "Jane Smith", commit: "def456", date: "2025-05-25", content: "import ReactDOM from 'react-dom/client'" },
            { file: "src/App.tsx", line_number: 1, author: "Bob Wilson", commit: "ghi789", date: "2025-06-01", content: "function App() {" },
            { file: "src/App.tsx", line_number: 2, author: "Alice Brown", commit: "jkl012", date: "2025-05-30", content: "  return (" },
            { file: "src/App.tsx", line_number: 3, author: "John Doe", commit: "mno345", date: "2025-05-29", content: "    <div className=\"app\">" },
            { file: "src/components/Table.tsx", line_number: 1, author: "Jane Smith", commit: "pqr678", date: "2025-05-27", content: "export function Table() {" },
            { file: "src/components/Table.tsx", line_number: 2, author: "Bob Wilson", commit: "stu901", date: "2025-05-26", content: "  const [data, setData] = useState([]);" },
            { file: "src/utils/helpers.ts", line_number: 1, author: "Alice Brown", commit: "vwx234", date: "2025-05-24", content: "export function formatDate(date: string) {" }
          ]
        }
      ]
    };
    
    setResults(mockResults);
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleExecute}
        disabled={isAnalyzing || settings.input_fstrs.length === 0}
        className="w-full"
        size="lg"
      >
        {isAnalyzing ? (
          <div className="flex items-center">
            <div className="loading-spinner w-4 h-4 mr-2"></div>
            Analyzing...
          </div>
        ) : (
          "Execute Analysis"
        )}
      </Button>
      
      <Button
        onClick={handleTestPhase3}
        variant="outline"
        className="w-full"
        size="sm"
      >
        🧪 Test Phase 3 Features
      </Button>
    </div>
  );
}