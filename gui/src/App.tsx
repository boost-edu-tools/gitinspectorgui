import * as React from "react";
import { AppSidebar } from "@/components/sidebar/sidebar";
import { AppMainWindow } from "@/components/main_window/main_window";
import { SidebarProvider } from "@/components/ui/sidebar";

import { initializeAuthorColors } from "@/components/helpers/author_colors";
import { AnalysisResult, Settings } from "@/components/types";

import {
  createAnalysisParameters,
  runInitialAnalysis,
  rerunAnalysis,
  loadSettingsJson
} from "@/lib/api"

import "./App.css";

export default function App() {
  const isInitialFilterSetup = React.useRef(true);
  const isUserChange = React.useRef(false); 
  const [settingsVersion, setSettingsVersion] = React.useState(0)

  const [path, setPath] = React.useState("")

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

  const [loading, setLoading] = React.useState(false);

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
      setAllAuthors(new Set());
      setAllFiles(new Set());
      selectAuthors([]);
      selectFiles([]);

      setStartDate(new Date());
      setEndDate(new Date());
      setStartCommitHash("");
      setEndCommitHash("");

      return;
    }

    isInitialFilterSetup.current = true;
    
    (async () => {
      setLoading(true);
      try {

        let settings: Settings | null = null;
        try {
        const settingsPath = `${path}/Settings.json`;
            settings = await loadSettingsJson(settingsPath);
            console.log("[App] Loaded settings:", settings);
          } catch (e) {
            console.log("[App] No Settings.json found, using defaults:", e);
          }

        const params = await createAnalysisParameters(
          selectedRepo,
          null,
          null,
          null,
          null,
          settings?.commit_hash_filter ?? null,
          settings?.commit_message_filter ?? null,
          settings?.file_types_filter ?? null,
          settings?.path_filter ?? null,
          settings?.author_names_filter ?? null,
          settings?.author_emails_filter ?? null,
        );

        try {
          const initialResult = await runInitialAnalysis(params);
          setRepoAnalysis(initialResult);

          const authors =
            initialResult.original_repository.authors.map((a) => a.name);
          const files =
            initialResult.original_repository.files.map((f) => f.path);
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
          console.log(initialResult);
        } catch (err) {
          console.error("runInitialAnalysis failed:", err);
        }
      } catch (err) {
        console.error("createAnalysisParameters failed:", err);
      }
      finally {
    setLoading(false);}
  })();
  }, [selectedRepo, settingsVersion]);


  const handleSelectAuthors = React.useCallback((authors: string[]) => {
    isUserChange.current = true;
    selectAuthors(authors);
  }, []);

  const handleSelectFiles = React.useCallback((files: string[]) => {
    isUserChange.current = true;
    selectFiles(files);
  }, []);

  const handleStartCommitChange = React.useCallback((hash: string) => {
    isUserChange.current = true;
    setStartCommitHash(hash);
  }, []);

  const handleEndCommitChange = React.useCallback((hash: string) => {
    isUserChange.current = true;
    setEndCommitHash(hash);
  }, []);

  const handleStartDateChange = React.useCallback((date: Date) => {
    isUserChange.current = true;
    setStartDate(date);
  }, []);

  const handleEndDateChange = React.useCallback((date: Date) => {
    isUserChange.current = true;
    setEndDate(date);
  }, []);

  const handleSettingsSaved = React.useCallback(() => {
    setSettingsVersion(v => v + 1); 
  }, []);


  React.useEffect(() => {
    if (!selectedRepo) return;

    if (isInitialFilterSetup.current) {
      isInitialFilterSetup.current = false;
      return;
    }

    if (!isUserChange.current) {
      return;
    }

    isUserChange.current = false;

    (async () => {
      console.time("⏱️ Re-analysis Duration");
      setLoading(true);
      try {
        const authorsFilter = {
          include: true,
          value: `{${selectedAuthors.join(",")}}`,
        };
        const filesFilter = {
          include: true,
          value: `{${selectedFiles.join(",")}}`,
        };

        const params = await createAnalysisParameters(
          selectedRepo,
          null,
          null,
          startCommitHash,
          endCommitHash,
          null,
          null,
          null,
          filesFilter,
          authorsFilter,
          null
        );

        const rerun = await rerunAnalysis(repoAnalysis, params);
        console.timeEnd("⏱️ Re-analysis Duration");
        setRepoAnalysis(rerun);
        console.log("Re-analysis", rerun);

      } catch (err) {
        console.error("Re-analysis failed:", err);
      }
      finally {
        setLoading(false);
      }
    })();
  }, [
    selectedRepo,
    selectedAuthors,
    selectedFiles,
    startCommitHash,
    endCommitHash,
  ]);

  return (

    <SidebarProvider> 
      <AppSidebar
        path = {path}
        setPath={setPath}
        repo_analysis={repoAnalysis}

        allAuthors={allAuthors}
        selectedAuthors={selectedAuthors}
        selectAuthors={handleSelectAuthors}  

        allFiles={allFiles}
        selectedFiles={selectedFiles}
        selectFiles={handleSelectFiles}    

        filterData={filterData}
        setFilterData={setFilterData}

        allRepos={allRepos}
        setAllRepos={setAllRepos}

        selectedRepo={selectedRepo}
        setSelectedRepo={setSelectedRepo}

        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange} 
        onEndDateChange={handleEndDateChange}  

        startCommitHash={startCommitHash}
        endCommitHash={endCommitHash}
        onStartCommitChange={handleStartCommitChange} 
        onEndCommitChange={handleEndCommitChange} 
        
        onSettingsSaved={handleSettingsSaved}
      />
      

      <AppMainWindow 
        repo_analysis={repoAnalysis}
        filterData = {filterData}
        setAllRepos={setAllRepos}
        setSelectedRepo={setSelectedRepo}
        path = {path}
        setPath={setPath}
        onSettingsSaved={handleSettingsSaved}

       />

       {loading && (
          <div className="loading-overlay">
            <div className="spinner" />
          </div>
        )}
  </SidebarProvider>
  );
}
