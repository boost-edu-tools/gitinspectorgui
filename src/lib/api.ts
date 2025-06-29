import type { Settings } from "@/types/settings";
import type { AnalysisResult } from "@/types/results";
import { defaultSettings } from "@/types/settings";
import { callFunction } from "tauri-plugin-python-api";

export async function executeAnalysis(
    settings: Settings
): Promise<AnalysisResult> {
    console.log(
        "1. Execute Analysis - Starting with settings:",
        settings.input_fstrs
    );

    try {
        console.log("2. Using tauri-plugin-python API");

        // Convert settings to JSON string for Python function
        const settingsJson = JSON.stringify(settings);

        // Call Python function through plugin
        const resultJson = await callFunction("execute_analysis", [
            settingsJson,
        ]);

        // Parse JSON response
        const result = JSON.parse(resultJson as string) as AnalysisResult;

        console.log("3. Plugin returned result:", {
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
        const settingsJson = await callFunction("get_settings", []);
        const settings = JSON.parse(settingsJson as string) as Settings;
        return settings;
    } catch (error) {
        console.error("Failed to get settings:", error);
        // Return default settings as fallback
        return defaultSettings;
    }
}

export async function saveSettings(settings: Settings): Promise<void> {
    try {
        const settingsJson = JSON.stringify(settings);
        const resultJson = await callFunction("save_settings", [settingsJson]);
        const result = JSON.parse(resultJson as string);

        if (!result.success) {
            throw new Error(result.error || "Failed to save settings");
        }
    } catch (error) {
        console.error("Failed to save settings:", error);
        throw new Error(`Failed to save settings: ${error}`);
    }
}

export async function getEngineInfo(): Promise<any> {
    try {
        const infoJson = await callFunction("get_engine_info", []);
        return JSON.parse(infoJson as string);
    } catch (error) {
        console.error("Failed to get engine info:", error);
        throw new Error(`Failed to get engine info: ${error}`);
    }
}

export async function getPerformanceStats(): Promise<any> {
    try {
        const statsJson = await callFunction("get_performance_stats", []);
        return JSON.parse(statsJson as string);
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
        console.log("Starting health check with tauri-plugin-python...");
        const healthJson = await callFunction("health_check", []);
        console.log("Health check raw response:", healthJson);
        const result = JSON.parse(healthJson as string);
        console.log("Health check parsed result:", result);
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

// Add a simple test function to debug the plugin
export async function testPlugin(): Promise<string> {
    try {
        console.log("Testing basic plugin communication...");

        // Try the simplest possible call
        const result = await callFunction("health_check", []);
        console.log("Plugin test successful:", result);
        return result as string;
    } catch (error) {
        console.error("Plugin test failed:", error);
        throw error;
    }
}
