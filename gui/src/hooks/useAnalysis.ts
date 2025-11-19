import { ANALYSIS_BY_NAME } from "@/components/helpers/analysis_registry";

export type AnalysisResult = typeof ANALYSIS_BY_NAME[keyof typeof ANALYSIS_BY_NAME];

export function useAnalysis(repo: string | null | undefined) {
  const analysis =
    repo && ANALYSIS_BY_NAME[repo as keyof typeof ANALYSIS_BY_NAME]
      ? ANALYSIS_BY_NAME[repo as keyof typeof ANALYSIS_BY_NAME]
      : undefined;

  return {
    analysis,
    isLoading: false,
    error: analysis ? undefined : new Error("No local analysis for repo"),
    refresh: async () => {},
  };
}
