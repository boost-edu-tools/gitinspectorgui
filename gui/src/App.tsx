import * as React from "react";
import { AppSidebar } from "@/components/sidebar/sidebar";
import { AppMainWindow } from "@/components/main_window/main_window";
import { SidebarProvider } from "@/components/ui/sidebar";

import { initializeAuthorColors } from "@/components/helpers/author_colors";
import { AnalysisResult } from "@/components/types";

import {
  createAnalysisParameters,
  runInitialAnalysis,
  rerunAnalysis,
  verifyFilter,
  loadSettingsJson,
  saveSettingsJson,
} from "@/lib/api"

import "./App.css";
import { CommandList } from "cmdk";

export default function App() {
  
  const isInitialFilterSetup = React.useRef(true);
  
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

  const defaultRepoAnalysis: AnalysisResult = {
  parameters: { repo_path: "" },
  original_repository: {
    name: "",
    path: "",
    authors: [],
    commits: [],
    files: [],
    metrics: {},
    },
  repository: {
    name: "",
    path: "",
    authors: [],
    commits: [],
    files: [],
    metrics: {},
    },
  };

  const [repoAnalysis, setRepoAnalysis] = React.useState<AnalysisResult>(defaultRepoAnalysis);

  React.useEffect(() => {
    console.log("Selected repo changed:", selectedRepo);
    if (!selectedRepo) {
    setRepoAnalysis(defaultRepoAnalysis);
    return;
  }
    isInitialFilterSetup.current = true;

    (async () => {
      try {

      const params = await createAnalysisParameters(selectedRepo, null, null, null, null, null, null, null, null)

      try {
        const initialResult = await runInitialAnalysis(params)
        setRepoAnalysis(initialResult)
        const authors = initialResult.original_repository.authors.map(a => a.name);
        const files = initialResult.original_repository.files.map(f => f.path);
        const commits = initialResult.original_repository.commits;
        
        if (commits.length > 0) {
        
          const startCommit = commits[commits.length - 1];
          const endCommit = commits[0]; 
          setStartCommitHash(startCommit.hash);
          setEndCommitHash(endCommit.hash);
          }

        setAllAuthors(new Set(authors));
        setAllFiles(new Set(files));

        selectAuthors(authors);
        selectFiles(files);
        initializeAuthorColors(authors);

        console.log("Initial analysis completed");
      } catch (err) {
        console.error("runInitialAnalysis failed:", err)
      }
      } catch (err) {
        console.error("createAnalysisParameters failed:", err)}
      })();

}, [selectedRepo]);


    React.useEffect(() => {
    if (!selectedRepo) return;

    if (selectedAuthors.length === 0 && selectedFiles.length === 0) return;
    
    if (isInitialFilterSetup.current) {
        isInitialFilterSetup.current = false;
        return;
      }

    (async () => {
      try {
        const authorsFilter = selectedAuthors.length > 0
          ? { include: true, value: `{${selectedAuthors.join(",")}}`}
          : null;

        const params = await createAnalysisParameters(
          selectedRepo,
          null,
          null,               
          null,
          null,            
          null,            
          null,     
          null,
          null,          
          authorsFilter,      
          null                
        );

        const rerun = await rerunAnalysis(repoAnalysis, params);
        setRepoAnalysis(rerun);
        console.log("Re-analysis", rerun);

      } catch (err) {
        console.error("Re-analysis failed:", err);
      }
    })();
  }, [selectedAuthors]);


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
