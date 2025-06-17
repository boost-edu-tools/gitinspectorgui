import type { Settings } from "@/types/settings";
import type { AnalysisResult } from "@/types/results";
import { defaultSettings } from "@/types/settings";

// Check if Tauri APIs are available
const isTauriAvailable = () => {
    try {
        return (
            typeof window !== "undefined" &&
            (window as any).__TAURI__ !== undefined
        );
    } catch {
        return false;
    }
};

// Dynamically import Tauri APIs only if available
const getTauriApis = async () => {
    if (!isTauriAvailable()) {
        throw new Error("Tauri APIs not available");
    }
    const { invoke, isTauri } = await import("@tauri-apps/api/core");
    return { invoke, isTauri };
};

export async function executeAnalysis(
    settings: Settings
): Promise<AnalysisResult> {
    console.log(
        "1. Execute Analysis - Starting with settings:",
        settings.input_fstrs
    );

    try {
        if (isTauriAvailable()) {
            console.log("2. Using Tauri API in desktop mode");

            // Use Tauri API in desktop mode
            const { invoke, isTauri } = await getTauriApis();
            if (!isTauri()) {
                const error = "Not running in Tauri context";
                console.error("ERROR:", error);
                throw new Error(error);
            }

            const result = await invoke<AnalysisResult>("execute_analysis", {
                settings,
            });

            console.log("3. Tauri returned result:", {
                success: result.success,
                repositoryCount: result.repositories?.length || 0,
                error: result.error,
                repositories: result.repositories,
            });

            return result;
        } else {
            console.log("2. Using HTTP API in browser mode");

            const url = "http://127.0.0.1:8080/api/execute_analysis";

            // Use HTTP API in browser mode
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;

                try {
                    // Try to parse JSON error response
                    const errorText = await response.text();
                    const errorData = JSON.parse(errorText);

                    // Extract detailed error message from the response
                    if (errorData.detail?.message) {
                        errorMessage = errorData.detail.message;
                    } else if (errorData.detail?.error) {
                        errorMessage = errorData.detail.error;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    } else {
                        errorMessage = `HTTP ${response.status}: ${errorText}`;
                    }
                } catch (parseError) {
                    // If JSON parsing fails, use the raw error text
                    const errorText = await response.text();
                    errorMessage = `HTTP ${response.status}: ${errorText}`;
                }

                console.error("ERROR: HTTP request failed:", errorMessage);
                throw new Error(errorMessage);
            }

            const result = await response.json();

            console.log("3. HTTP API returned result:", {
                success: result.success,
                repositoryCount: result.repositories?.length || 0,
                error: result.error,
                repositories: result.repositories,
            });

            return result;
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error("ERROR: Analysis execution failed:", errorMessage);
        throw new Error(`Analysis failed: ${errorMessage}`);
    }
}

export async function getSettings(): Promise<Settings> {
    try {
        if (isTauriAvailable()) {
            const { invoke } = await getTauriApis();
            const settings = await invoke<Settings>("get_settings");
            return settings;
        } else {
            // In browser mode, return default settings or fetch from HTTP API
            return defaultSettings;
        }
    } catch (error) {
        console.error("Failed to get settings:", error);
        throw new Error(`Failed to load settings: ${error}`);
    }
}

export async function saveSettings(settings: Settings): Promise<void> {
    try {
        if (isTauriAvailable()) {
            const { invoke } = await getTauriApis();
            await invoke("save_settings", { settings });
        } else {
            // In browser mode, we could save to localStorage or send to HTTP API
            // For now, just log that settings would be saved
            console.log("Settings would be saved:", settings);
        }
    } catch (error) {
        console.error("Failed to save settings:", error);
        throw new Error(`Failed to save settings: ${error}`);
    }
}
