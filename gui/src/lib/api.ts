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

export async function getEngineInfo(): Promise<any> {
    try {
        const info = await invoke<any>("get_engine_info");
        return info;
    } catch (error) {
        console.error("Failed to get engine info:", error);
        throw new Error(`Failed to get engine info: ${error}`);
    }
}

export async function getPerformanceStats(): Promise<any> {
    try {
        const stats = await invoke<any>("get_performance_stats");
        return stats;
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
        console.log("Starting health check with Tauri invoke...");
        const result = await invoke<any>("health_check");
        console.log("Health check result:", result);
        return result;
    } catch (error) {
        console.error("Failed to perform health check:", error);
        console.error("Error details:", {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw new Error(`Health check failed: ${error}`);
    }
}

export async function getBlameData(settings: Settings): Promise<any> {
    try {
        const blameData = await invoke<any>("get_blame_data", { settings });
        return blameData;
    } catch (error) {
        console.error("Failed to get blame data:", error);
        throw new Error(`Failed to get blame data: ${error}`);
    }
}

// Add a simple test function to debug the communication
export async function testInvoke(): Promise<any> {
    try {
        console.log("Testing basic Tauri invoke communication...");

        // Try the simplest possible call
        const result = await invoke<any>("health_check");
        console.log("Invoke test successful:", result);
        return result;
    } catch (error) {
        console.error("Invoke test failed:", error);
        throw error;
    }
}
