import { executeAnalysis, retrieveRepositories } from "@/lib/api";
import type { AnalysisResult, RepositoryResult } from "@/types/results";
import type { Settings } from "@/types/settings";
import { create } from "zustand";

interface ResultsStore {
    results: AnalysisResult | null;
    isAnalyzing: boolean;
    error: string | null;
    selectedRepository: string | null;
    selectedTable: "authors" | "files" | "blame";
    runAnalysis: (settings: Settings) => Promise<void>;
    selectRepository: (repoName: string) => void;
    selectTable: (table: "authors" | "files" | "blame") => void;
    clearResults: () => void;
    getCurrentRepository: () => RepositoryResult | null;
    setResults: (results: AnalysisResult) => void;
}

export const useResultsStore = create<ResultsStore>((set, get) => ({
    results: null,
    isAnalyzing: false,
    error: null,
    selectedRepository: null,
    selectedTable: "authors",

    runAnalysis: async (settings) => {
        console.log(
            "A. Starting analysis with repositories:",
            settings.input_fstrs
        );

        set({ isAnalyzing: true, error: null, results: null });

        // Check if we're in demo mode
        const isDemo =
            typeof window !== "undefined" &&
            window.location.hostname.includes("github.io") &&
            window.location.pathname.includes("/gitinspectorgui");

        if (isDemo) {
            console.log("B. Demo mode detected - using sample data");

            // Use sample data in demo mode
            const { sampleAnalysisResult } = await import("@/data/sampleData");

            // Simulate loading time
            await new Promise((resolve) => setTimeout(resolve, 1500));

            set({
                results: sampleAnalysisResult,
                isAnalyzing: false,
                selectedRepository:
                    sampleAnalysisResult.repositories.length > 0
                        ? sampleAnalysisResult.repositories[0].name
                        : null,
            });
            return;
        }

        console.log("B. Production mode - expanding repository paths and calling executeAnalysis API");

        try {
            // Expand user-provided repository paths by calling the Tauri `retrieve_repositories` command.
            // This will search folders for git repos up to the configured depth.
            const expandedPaths: string[] = [];
            for (const inputPath of settings.input_fstrs) {
                try {
                    const found = await retrieveRepositories(inputPath, Number(settings.depth || 1));
                    if (found && found.length > 0) {
                        expandedPaths.push(...found);
                    }
                } catch (err) {
                    console.warn("retrieve_repositories failed for path", inputPath, err);
                }
            }

            // If we found expanded paths, use them for analysis; otherwise fall back to original inputs.
            const analysisSettings = {
                ...settings,
                input_fstrs: expandedPaths.length > 0 ? expandedPaths : settings.input_fstrs,
            };

            let results;
            try {
                results = await executeAnalysis(analysisSettings as any);
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                // If Python backend was removed, show the expanded repository list instead of failing
                if (errMsg.includes("Python backend has been removed")) {
                    const repoPaths: string[] = (analysisSettings as any).input_fstrs || [];
                    const repos = repoPaths.map((p) => ({
                        name: p.split(/[\\/]/).pop() || p,
                        path: p,
                        authors: [],
                        files: [],
                        blame_data: [],
                    }));
                    const stub: AnalysisResult = {
                        repositories: repos,
                        success: true,
                    };

                    set({
                        results: stub,
                        isAnalyzing: false,
                        error: null,
                        selectedRepository: repos.length > 0 ? repos[0].name : null,
                    });
                    return;
                }
                // rethrow other errors to be handled by outer catch
                throw err;
            }

            console.log("C. Analysis completed, received results:", {
                success: results.success,
                repositoryCount: results.repositories?.length || 0,
                error: results.error,
                hasRepositories:
                    !!results.repositories && results.repositories.length > 0,
            });

            // Check if the API returned an error
            if (!results.success || results.error) {
                console.error("API returned error:", results.error);

                // Convert technical errors to user-friendly messages
                let userFriendlyMessage = results.error || "Analysis failed";

                if (results.error?.includes("No such file or directory")) {
                    const pathMatch = settings.input_fstrs[0];
                    userFriendlyMessage = `Repository path '${pathMatch}' does not exist. Please check the path and try again.`;
                } else if (results.error?.includes("not a git repository")) {
                    userFriendlyMessage = `The specified path is not a Git repository. Please select a valid Git repository.`;
                } else if (results.error?.includes("Permission denied")) {
                    userFriendlyMessage = `Permission denied accessing the repository. Please check file permissions.`;
                }

                set({
                    error: userFriendlyMessage,
                    isAnalyzing: false,
                    results: null,
                });
                return;
            }

            if (!results.repositories || results.repositories.length === 0) {
                console.error("PROBLEM: Analysis returned zero repositories!", {
                    success: results.success,
                    error: results.error,
                    resultKeys: Object.keys(results),
                });

                set({
                    error: "No repositories found to analyze. Please check your repository paths.",
                    isAnalyzing: false,
                    results: null,
                });
                return;
            }

            set({
                results,
                isAnalyzing: false,
                error: null,
                selectedRepository:
                    results.repositories.length > 0
                        ? results.repositories[0].name
                        : null,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            console.error("ERROR: Analysis execution failed:", errorMessage);

            let userFriendlyMessage = "Analysis failed";

            if (error instanceof Error) {
                if (
                    error.message.includes("Connection refused") ||
                    error.message.includes("tcp connect error")
                ) {
                    userFriendlyMessage =
                        "Cannot connect to Python backend. Please restart the application and try again.";
                } else if (
                    error.message.includes("Not running in Tauri context")
                ) {
                    userFriendlyMessage =
                        "This feature requires the desktop application. Please use the Tauri app instead of the web version.";
                } else if (error.message.startsWith("Analysis failed: ")) {
                    // Remove the "Analysis failed: " prefix to avoid duplication
                    userFriendlyMessage = error.message.replace(
                        "Analysis failed: ",
                        ""
                    );
                } else {
                    userFriendlyMessage = error.message;
                }
            }

            set({
                error: userFriendlyMessage,
                isAnalyzing: false,
                results: null,
            });
        }
    },

    selectRepository: (repoName) => {
        set({ selectedRepository: repoName });
    },

    selectTable: (table) => {
        set({ selectedTable: table });
    },

    clearResults: () => {
        set({ results: null, error: null, selectedRepository: null });
    },

    getCurrentRepository: () => {
        const { results, selectedRepository } = get();
        if (!results || !selectedRepository) return null;
        return (
            results.repositories.find(
                (repo) => repo.name === selectedRepository
            ) || null
        );
    },

    setResults: (results) => {
        set({
            results,
            error: null,
            selectedRepository:
                results.repositories.length > 0
                    ? results.repositories[0].name
                    : null,
        });
    },
}));
