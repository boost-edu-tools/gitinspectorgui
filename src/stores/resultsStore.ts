import { create } from "zustand";
import type { AnalysisResult, RepositoryResult } from "@/types/results";
import { executeAnalysis } from "@/lib/api";
import type { Settings } from "@/types/settings";

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
    try {
      const results = await executeAnalysis(settings);
      set({
        results,
        isAnalyzing: false,
        selectedRepository: results.repositories.length > 0 ? results.repositories[0].name : null
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Analysis failed",
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
    return results.repositories.find(repo => repo.name === selectedRepository) || null;
  },

  setResults: (results) => {
    set({
      results,
      error: null,
      selectedRepository: results.repositories.length > 0 ? results.repositories[0].name : null
    });
  },
}));