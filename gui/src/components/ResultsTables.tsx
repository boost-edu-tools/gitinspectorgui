import { useResultsStore } from "@/stores/resultsStore";
import { formatNumber, formatPercentage } from "@/lib/utils";
import type { AuthorStat, FileStat } from "@/types/results";

export function ResultsTables() {
  const { results, selectedRepository, selectedTable, selectRepository, selectTable, getCurrentRepository } = useResultsStore();

  if (!results) return null;

  const currentRepo = getCurrentRepository();

  return (
    <div className="h-full flex flex-col">
      {/* Repository Selector */}
      {results.repositories.length > 1 && (
        <div className="p-4 border-b border-border">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Repository:
          </label>
          <select
            value={selectedRepository || ""}
            onChange={(e) => selectRepository(e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background text-foreground"
          >
            {results.repositories.map((repo) => (
              <option key={repo.name} value={repo.name}>
                {repo.name} ({repo.path})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Table Selector */}
      <div className="p-4 border-b border-border">
        <div className="flex space-x-2">
          <button
            onClick={() => selectTable("authors")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTable === "authors"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            🔥 AUTHORS TEST 🔥 ({currentRepo?.authors.length || 0})
          </button>
          <button
            onClick={() => selectTable("files")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTable === "files"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Files ({currentRepo?.files.length || 0})
          </button>
          <button
            onClick={() => selectTable("blame")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTable === "blame"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Blame ({currentRepo?.blame_data.length || 0})
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4">
        {currentRepo && (
          <>
            {selectedTable === "authors" && <AuthorsTable authors={currentRepo.authors} />}
            {selectedTable === "files" && <FilesTable files={currentRepo.files} />}
            {selectedTable === "blame" && <BlameTable blameData={currentRepo.blame_data} />}
          </>
        )}
      </div>
    </div>
  );
}

function AuthorsTable({ authors }: { authors: AuthorStat[] }) {
  return (
    <div className="table-container">
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border p-2 text-left" style={{backgroundColor: 'yellow', color: 'black'}}>🚨 AUTHOR TEST 🚨</th>
            <th className="border border-border p-2 text-left">Email</th>
            <th className="border border-border p-2 text-right">Commits</th>
            <th className="border border-border p-2 text-right">Insertions</th>
            <th className="border border-border p-2 text-right">Deletions</th>
            <th className="border border-border p-2 text-right">Files</th>
            <th className="border border-border p-2 text-right">Percentage</th>
            <th className="border border-border p-2 text-right" style={{backgroundColor: 'red', color: 'white'}}>🎂 AGE TEST</th>
          </tr>
        </thead>
        <tbody>
          {authors.map((author, index) => (
            <tr key={index} className="table-row-hover">
              <td className="border border-border p-2">{author.name}</td>
              <td className="border border-border p-2">{author.email}</td>
              <td className="border border-border p-2 text-right">{formatNumber(author.commits)}</td>
              <td className="border border-border p-2 text-right">{formatNumber(author.insertions)}</td>
              <td className="border border-border p-2 text-right">{formatNumber(author.deletions)}</td>
              <td className="border border-border p-2 text-right">{formatNumber(author.files)}</td>
              <td className="border border-border p-2 text-right">{formatPercentage(author.percentage)}</td>
              <td className="border border-border p-2 text-right">{author.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilesTable({ files }: { files: FileStat[] }) {
  return (
    <div className="table-container">
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border p-2 text-left">File</th>
            <th className="border border-border p-2 text-left">Path</th>
            <th className="border border-border p-2 text-right">Lines</th>
            <th className="border border-border p-2 text-right">Commits</th>
            <th className="border border-border p-2 text-right">Authors</th>
            <th className="border border-border p-2 text-right">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, index) => (
            <tr key={index} className="table-row-hover">
              <td className="border border-border p-2">{file.name}</td>
              <td className="border border-border p-2">{file.path}</td>
              <td className="border border-border p-2 text-right">{formatNumber(file.lines)}</td>
              <td className="border border-border p-2 text-right">{formatNumber(file.commits)}</td>
              <td className="border border-border p-2 text-right">{formatNumber(file.authors)}</td>
              <td className="border border-border p-2 text-right">{formatPercentage(file.percentage)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlameTable({ blameData }: { blameData: any[] }) {
  return (
    <div className="table-container">
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border p-2 text-left">File</th>
            <th className="border border-border p-2 text-right">Line</th>
            <th className="border border-border p-2 text-left">Author</th>
            <th className="border border-border p-2 text-left">Commit</th>
            <th className="border border-border p-2 text-left">Date</th>
            <th className="border border-border p-2 text-left">Content</th>
          </tr>
        </thead>
        <tbody>
          {blameData.map((blame, index) => (
            <tr key={index} className="table-row-hover">
              <td className="border border-border p-2">{blame.file}</td>
              <td className="border border-border p-2 text-right">{blame.line_number}</td>
              <td className="border border-border p-2">{blame.author}</td>
              <td className="border border-border p-2">{blame.commit}</td>
              <td className="border border-border p-2">{blame.date}</td>
              <td className="border border-border p-2 font-mono text-xs">{blame.content}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
