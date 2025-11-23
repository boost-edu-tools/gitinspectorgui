import * as React from "react";
import { AppSidebar } from "@/components/sidebar/sidebar";
import { AppMainWindow } from "@/components/main_window/main_window";
import { SidebarProvider } from "@/components/ui/sidebar";

import { initializeAuthorColors } from "@/components/helpers/author_colors";
import { AnalysisResult } from "@/components/types";

import {
  retrieveRepositories,
  createAnalysisParameters,
  runInitialAnalysis,
  rerunAnalysis,
  verifyFilter,
  loadSettingsJson,
  saveSettingsJson,
} from "@/lib/api"

import "./App.css";

export default function App() {
  
  
  const [allAuthors, setAllAuthors] = React.useState<Set<string>>(new Set());
  const [allRepos, setAllRepos]     = React.useState<Set<string>>(new Set());
  const [allFiles, setAllFiles]     = React.useState<Set<string>>(new Set());

  const [selectedAuthors, selectAuthors] = React.useState<string[]>([]);
  const [selectedFiles, selectFiles]     = React.useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = React.useState<string>("");

  const [filterData, setFilterData] = React.useState(true);
  const [startDate, setStartDate] = React.useState<Date>(new Date());
  const [endDate, setEndDate] = React.useState<Date>(new Date());
  const [startCommitHash, setStartCommitHash] = React.useState<string>("");
  const [endCommitHash, setEndCommitHash] = React.useState<string>("");

  const [repoAnalysis, setRepoAnalysis] = React.useState<AnalysisResult>({
  parameters: { repo_path: "" },
  repository: {
    name: "",
    path: "",
    authors: [],
    commits: [],
    files: [],
    metrics: {},
  },
});

  React.useEffect(() => {
    if (!selectedRepo) return;
    (async () => {
      try {

      // const authorFilter = { include: true, value: Array.from(selectedAuthors)[0] }
  //     const verifyAuthor = await verifyFilter(authorFilter as any, true)
  //     console.log("verifyFilter (authors) result:", verifyAuthor)
  // const params = await createAnalysisParameters(selectedRepo, null, null, null, null, null, null, verifyAuthor, null)

      const params = await createAnalysisParameters(selectedRepo, null, null, null, null, null, null, null, null)

      try {
        const initialResult = await runInitialAnalysis(params)
        setRepoAnalysis(initialResult)
        console.log("Initial analysis completed");
      } catch (err) {
        console.error("runInitialAnalysis failed:", err)
      }
      } catch (err) {
        console.error("createAnalysisParameters failed:", err)}
      })();
  }, [selectedRepo]);


  React.useEffect(() => {
    const authors = repoAnalysis.repository.authors.map(a => a.name);
    const files = repoAnalysis.repository.files.map(f => f.path);

    setAllAuthors(new Set(authors));
    setAllFiles(new Set(files));

    selectAuthors(authors);
    selectFiles(files);
    initializeAuthorColors(authors);

}, [selectedRepo, repoAnalysis.repository.path]);


  return (
    <SidebarProvider>
      <AppSidebar

        repo_analysis={repoAnalysis}

        allAuthors={allAuthors}
        selectedAuthors={selectedAuthors}
        selectAuthors={selectAuthors}

        allFiles={allFiles}
        selectedFiles={selectedFiles}
        selectFiles={selectFiles}

        filterData={filterData}
        setFilterData={setFilterData}

        allRepos={allRepos}
        setAllRepos={setAllRepos}
        
        selectedRepo={selectedRepo}
        setSelectedRepo={setSelectedRepo}

        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}

        startCommitHash={startCommitHash}
        endCommitHash={endCommitHash}
        onStartCommitChange={setStartCommitHash}
        onEndCommitChange={setEndCommitHash}
      />

      <AppMainWindow
        repo_analysis={repoAnalysis}
      />
    </SidebarProvider>
  );
}
