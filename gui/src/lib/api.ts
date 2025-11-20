import { invoke } from "@tauri-apps/api/core";
import type {
  Settings,
  AnalysisResult,
  AnalysisParameters,
  Filter,
} from "@/components/types";

export async function retrieveRepositories(path: string, depth: number): Promise<string[]> {
  try {
    const result = await invoke<string[]>("retrieve_repositories", { path, depth });
    return result || [];
  } catch (err) {
    console.error("retrieveRepositories failed:", err);
    throw err;
  }
}

export async function createAnalysisParameters(
  repo_path: string,
  from_time?: string | null,
  to_time?: string | null,
  from_commit?: string | null,
  to_commit?: string | null,
  commit_hash_filter?: any | null,
  commit_message_filter?: any | null,
  file_types_filter?: any | null,
  path_filter?: any | null
): Promise<AnalysisParameters> {
  try {
    const result = await invoke<AnalysisParameters>("create_analysis_parameters", {
      repoPath: repo_path,
      fromTime: from_time,
      toTime: to_time,
      fromCommit: from_commit,
      toCommit: to_commit,
      commitHashFilter: commit_hash_filter,
      commitMessageFilter: commit_message_filter,
      fileTypesFilter: file_types_filter,
      pathFilter: path_filter,
    });
    return result as AnalysisParameters;
  } catch (err) {
    console.error("createAnalysisParameters failed:", err);
    throw err;
  }
}

export async function runInitialAnalysis(parameters: AnalysisParameters): Promise<AnalysisResult> {
  try {
    const result = await invoke<AnalysisResult>("run_initial_analysis", { params: parameters });
    return result as AnalysisResult;
  } catch (err) {
    console.error("runInitialAnalysis failed:", err);
    throw err;
  }
}

export async function rerunAnalysis(previous: AnalysisResult, newParameters: AnalysisParameters): Promise<AnalysisResult> {
  try {
    const result = await invoke<AnalysisResult>("rerun_analysis", { previous: previous, newParameters: newParameters });
    return result as AnalysisResult;
  } catch (err) {
    console.error("rerunAnalysis failed:", err);
    throw err;
  }
}

export async function verifyFilter(filter: Filter, isPathFilter: boolean): Promise<boolean> {
  try {
    const res = await invoke<boolean>("verify_filter", { filter: filter, isPathFilter: isPathFilter });
    return res;
  } catch (err) {
    console.error("verifyFilter failed:", err);
    throw err;
  }
}

export async function loadSettingsJson(path: string): Promise<Settings> {
  try {
    const res = await invoke<Settings>("load_settings_json", { path });
    return res as Settings;
  } catch (err) {
    console.error("loadSettingsJson failed:", err);
    throw err;
  }
}

export async function saveSettingsJson(settings: Settings, path: string): Promise<string> {
  try {
    const res = await invoke<string>("save_settings_json", { settings, path });
    return res;
  } catch (err) {
    console.error("saveSettingsJson failed:", err);
    throw err;
  }
}


export default {
  retrieveRepositories,
  createAnalysisParameters,
  runInitialAnalysis,
  rerunAnalysis,
  verifyFilter,
  loadSettingsJson,
  saveSettingsJson,
};
