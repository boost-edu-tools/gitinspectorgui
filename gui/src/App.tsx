"use client"

import * as React from "react";
import { AppSidebar } from "@/components/sidebar/sidebar";
import { AppMainWindow } from "@/components/main_window/main_window";
import { SidebarProvider } from "@/components/ui/sidebar";

import settings from "@/data/Settings.json";
import { initializeAuthorColors } from "@/components/helpers/AuthorColors";
import { ANALYSIS_BY_NAME} from "@/components/helpers/AnalysisRegistry";
import { AnalysisResult } from "@/components/types";

import "./App.css";


function unique<T>(arr: T[] = []): T[] {
  return Array.from(new Set(arr));
}

export default function App() {
    const repoOptions = React.useMemo<string[]>(() => {
    return Object.keys(ANALYSIS_BY_NAME);
  }, []);

  const [selectedRepo, setSelectedRepo] = React.useState<string>(repoOptions[0] ?? "");

  // Pick the analysis for the selected repo (fallback to first available)
  const currentAnalysis = React.useMemo<AnalysisResult>(() => {
    const hit = ANALYSIS_BY_NAME[selectedRepo as keyof typeof ANALYSIS_BY_NAME];
    if (hit) return hit;
    const first = Object.values(ANALYSIS_BY_NAME)[0];
    return first as AnalysisResult;
  }, [selectedRepo]);

  // Derive authors/files from current analysis
  const authorNames = React.useMemo(() => {
    const authors = (currentAnalysis as any)?.repository?.authors ?? [];
    return unique<string>(
      authors.map((a: any) => (a?.name ?? "").trim()).filter(Boolean)
    );
  }, [currentAnalysis]);

  // Prefer settings.files if present; else use analysis.repository.files for the current repo
  const filePaths = React.useMemo(() => {
    const settingsFiles = (settings as any)?.files;
    const analysisFiles = (currentAnalysis as any)?.repository?.files ?? [];
    const base = Array.isArray(settingsFiles) && settingsFiles.length > 0 ? settingsFiles : analysisFiles;
    return unique<string>(base.map((p: any) => String(p.path).trim()).filter(Boolean));
  }, [currentAnalysis]);

  // Initialize colors for the authors of the selected repo
  React.useEffect(() => {
    initializeAuthorColors(authorNames);
  }, [authorNames]);

  // Sets used by child components
  const allAuthors = React.useMemo(() => new Set<string>(authorNames), [authorNames]);
  const allRepos   = React.useMemo(() => new Set<string>(repoOptions), [repoOptions]);
  const allFiles   = React.useMemo(() => new Set<string>(filePaths), [filePaths]);

  // Selected = initially “all”, and reset when repo changes
  const [selectedAuthors, selectAuthors] = React.useState<string[]>(authorNames);
  const [selectedFiles, selectFiles]     = React.useState<string[]>(filePaths);

  React.useEffect(() => {
    selectAuthors(authorNames);
    selectFiles(filePaths);
  }, [authorNames, filePaths, selectedRepo]);

  // Filters / ranges
  const [filterData, setFilterData] = React.useState(true);
  const [startDate, setStartDate] = React.useState<Date>(new Date("2024-01-01"));
  const [endDate, setEndDate] = React.useState<Date>(new Date());
  const [startCommitHash, setStartCommitHash] = React.useState<string>("abc123def456");
  const [endCommitHash, setEndCommitHash] = React.useState<string>("xyz789uvw012");

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
        startCommitHash={startCommitHash}
        endCommitHash={endCommitHash}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onStartCommitChange={setStartCommitHash}
        onEndCommitChange={setEndCommitHash}
      />

      <AppMainWindow
        allAuthors={allAuthors}
        selectedAuthors={selectedAuthors}
        allFiles={allFiles}
        selectedFiles={selectedFiles}
        filterData={filterData}
        selectedRepo={selectedRepo}
        startCommitHash={startCommitHash}
        endCommitHash={endCommitHash}
      />
    </SidebarProvider>
  );
}
