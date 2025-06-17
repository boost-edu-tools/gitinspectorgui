import { executeAnalysis } from "@/lib/api";
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
        set({ isAnalyzing: true, error: null, results: null });

        // Check if we're in demo mode
        const isDemo =
            typeof window !== "undefined" &&
            window.location.hostname.includes("gitlab.io") &&
            window.location.pathname.includes("/gitinspectorgui");

        if (isDemo) {
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

        try {
            const results = await executeAnalysis(settings);
            set({
                results,
                isAnalyzing: false,
                selectedRepository:
                    results.repositories.length > 0
                        ? results.repositories[0].name
                        : null,
            });
        } catch (error) {
            let errorMessage = "Analysis failed";

            if (error instanceof Error) {
                if (
                    error.message.includes("Connection refused") ||
                    error.message.includes("tcp connect error")
                ) {
                    errorMessage =
                        "Cannot connect to Python API server. Please ensure the server is running and try again.";
                } else if (
                    error.message.includes("Not running in Tauri context")
                ) {
                    errorMessage =
                        "This feature requires the desktop application. Please use the Tauri app instead of the web version.";
                } else {
                    errorMessage = error.message;
                }
            }

            set({
                error: errorMessage,
                isAnalyzing: false,
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
