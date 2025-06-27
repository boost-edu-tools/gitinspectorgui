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
        console.log("2. Using Tauri PyO3 API");

        const result = await invoke<AnalysisResult>("execute_analysis", {
            settings,
        });

        console.log("3. PyO3 returned result:", {
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
        await invoke("save_settings", { settings });
    } catch (error) {
        console.error("Failed to save settings:", error);
        throw new Error(`Failed to save settings: ${error}`);
    }
}

export async function getEngineInfo(): Promise<any> {
    try {
        return await invoke("get_engine_info");
    } catch (error) {
        console.error("Failed to get engine info:", error);
        throw new Error(`Failed to get engine info: ${error}`);
    }
}

export async function getPerformanceStats(): Promise<any> {
    try {
        return await invoke("get_performance_stats");
    } catch (error) {
        console.error("Failed to get performance stats:", error);
        throw new Error(`Failed to get performance stats: ${error}`);
    }
}

export async function healthCheck(): Promise<{
    status: string;
    version: string;
}> {
    try {
        return await invoke("health_check");
    } catch (error) {
        console.error("Failed to perform health check:", error);
        throw new Error(`Health check failed: ${error}`);
    }
}
