import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Settings } from "@/types/settings";
import type { AnalysisResult } from "@/types/results";

export async function executeAnalysis(settings: Settings): Promise<AnalysisResult> {
  try {
    // Check if we're running in a Tauri context
    if (!isTauri()) {
      throw new Error("Not running in Tauri context");
    }
    
    const result = await invoke<AnalysisResult>("execute_analysis", { settings });
    return result;
  } catch (error) {
    console.error("Failed to execute analysis:", error);
    throw new Error(`Analysis failed: ${error}`);
  }
}

export async function getSettings(): Promise<Settings> {
  try {
    const settings = await invoke<Settings>("get_settings");
    return settings;
  } catch (error) {
    console.error("Failed to get settings:", error);
    throw new Error(`Failed to load settings: ${error}`);
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await invoke("save_settings", { settings });
  } catch (error) {
    console.error("Failed to save settings:", error);
    throw new Error(`Failed to save settings: ${error}`);
  }
}