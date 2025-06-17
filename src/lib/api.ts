import type { Settings } from "@/types/settings";
import type { AnalysisResult } from "@/types/results";

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
    try {
        if (isTauriAvailable()) {
            // Use Tauri API in desktop mode
            const { invoke, isTauri } = await getTauriApis();
            if (!isTauri()) {
                throw new Error("Not running in Tauri context");
            }

            const result = await invoke<AnalysisResult>("execute_analysis", {
                settings,
            });
            return result;
        } else {
            // Use HTTP API in browser mode
            const response = await fetch(
                "http://127.0.0.1:8080/api/execute_analysis",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(settings),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            return result;
        }
    } catch (error) {
        console.error("Failed to execute analysis:", error);
        throw new Error(`Analysis failed: ${error}`);
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
            // Import and return the default settings
            const { defaultSettings } = await import("../types/settings");
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
