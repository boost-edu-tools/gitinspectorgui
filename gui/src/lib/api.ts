import type { Settings } from "@/types/settings";
import type { AnalysisResult } from "@/types/results";
import { defaultSettings } from "@/types/settings";
import { invoke } from "@tauri-apps/api/core";

export async function executeAnalysis(
    settings: Settings
): Promise<AnalysisResult> {
    console.log(
        "1. Execute Analysis - Starting with settings:",
        settings.input_fstrs
    );

    try {
        console.log("2. Using Tauri invoke API");

        // Call Rust command directly with settings object
        const result = await invoke<AnalysisResult>("execute_analysis", { settings });

        console.log("3. Tauri returned result:", {
            success: result.success,
            repositoryCount: result.repositories?.length || 0,
            error: result.error,
            repositories: result.repositories,
        });

        return result;
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error("ERROR: Analysis execution failed:", errorMessage);
        throw new Error(`Analysis failed: ${errorMessage}`);
    }
}

export async function retrieveRepositories(path: string, depth: number): Promise<string[]> {
    try {
        const result = await invoke<string[]>("retrieve_repositories", { path, depth });
        return result || [];
    } catch (error) {
        console.error("Failed to retrieve repositories:", error);
        throw error;
    }
}

export async function runInitialAnalysis(parameters: any): Promise<any> {
    try {
        const result = await invoke<any>("run_initial_analysis", { parameters });
        return result;
    } catch (error) {
        console.error("Failed to run initial analysis:", error);
        throw error;
    }
}

export async function getSettings(): Promise<Settings> {
    try {
        const settings = await invoke<Settings>("get_settings");
        return settings;
    } catch (error) {
        console.error("Failed to get settings:", error);
        // Return default settings as fallback
        return defaultSettings;
    }
}

export async function saveSettings(settings: Settings): Promise<void> {
    try {
        await invoke<void>("save_settings", { settings });
    } catch (error) {
        console.error("Failed to save settings:", error);
        throw new Error(`Failed to save settings: ${error}`);
    }
}
