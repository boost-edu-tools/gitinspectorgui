import repo1 from "@/data/MockData.json";
import repo2 from "@/data/MockData2.json";
import repo3 from "@/data/MockData3.json";
import { AnalysisResult } from "@/components/types";

export const ANALYSIS_BY_NAME = {
  // [repo1.repository.name]: repo1 as AnalysisResult,
  [repo2.repository.name]: repo2 as AnalysisResult,
  // [repo3.repository.name]: repo3 as AnalysisResult,

} as const;