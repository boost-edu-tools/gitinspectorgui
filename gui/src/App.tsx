import * as React from "react";
import { AppSidebar } from "@/components/sidebar/sidebar";
import { AppMainWindow } from "@/components/main_window/main_window";
import { SidebarProvider } from "@/components/ui/sidebar";

import { initializeAuthorColors } from "@/components/helpers/author_colors";
import { ANALYSIS_BY_NAME} from "@/components/helpers/analysis_registry";
import { AnalysisResult } from "@/components/types";

import "./App.css";

export default function App() {
    const repoOptions = React.useMemo<string[]>(() => {
    return Object.keys(ANALYSIS_BY_NAME);
  }, []);

  const [selectedRepo, setSelectedRepo] = React.useState<string>(repoOptions[0]);

  const currentAnalysis = React.useMemo<AnalysisResult>(() => {
    const analysis = ANALYSIS_BY_NAME[selectedRepo as keyof typeof ANALYSIS_BY_NAME];
    return analysis;
  }, [selectedRepo]);

  const authorNames = React.useMemo(() => {
    const authors = currentAnalysis.repository.authors;
    return Array.from(new Set(
      authors.map((a: any) => (a?.name ?? "").trim()).filter(Boolean)
    ));
  }, [currentAnalysis]);

  React.useEffect(() => {
    initializeAuthorColors(authorNames);
  }, [authorNames]);

  const filePaths = React.useMemo(() => {
    const analysisFiles = currentAnalysis.repository.files 
    return analysisFiles.map((p: any) => String(p.path))
  }, [currentAnalysis]);

  React.useEffect(() => {
    selectAuthors(authorNames);
    selectFiles(filePaths);
  }, [authorNames, filePaths, selectedRepo]);

  const allAuthors = React.useMemo(() => new Set<string>(authorNames), [authorNames]);
  const allRepos   = React.useMemo(() => new Set<string>(repoOptions), [repoOptions]);
  const allFiles   = React.useMemo(() => new Set<string>(filePaths), [filePaths]);

  const [selectedAuthors, selectAuthors] = React.useState<string[]>(authorNames);
  const [selectedFiles, selectFiles]     = React.useState<string[]>(filePaths);

  const [filterData, setFilterData] = React.useState(true);
  const [startDate, setStartDate] = React.useState<Date>(new Date());
  const [endDate, setEndDate] = React.useState<Date>(new Date());
  const [startCommitHash, setStartCommitHash] = React.useState<string>("");
  const [endCommitHash, setEndCommitHash] = React.useState<string>("");

  return (
    <SidebarProvider>
      <AppSidebar

        allAuthors={allAuthors}
        selectedAuthors={selectedAuthors}
        selectAuthors={selectAuthors}

        allFiles={allFiles}
        selectedFiles={selectedFiles}
        selectFiles={selectFiles}

        filterData={filterData}
        setFilterData={setFilterData}

        allRepos={allRepos}
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
        selectedRepo={selectedRepo}
      />
    </SidebarProvider>
  );
}
