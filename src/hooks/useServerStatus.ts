import { useState, useEffect, useCallback } from "react";

// Check if Tauri APIs are available
const isTauriAvailable = () => {
    try {
        // In Tauri v2, check for the presence of the Tauri context
        return (
            typeof window !== "undefined" &&
            ((window as any).__TAURI__ !== undefined ||
                (window as any).__TAURI_INTERNALS__ !== undefined ||
                // Also check if we can access Tauri APIs directly
                typeof (window as any).__TAURI_INVOKE__ === "function")
        );
    } catch {
        return false;
    }
};

// Dynamically import Tauri invoke only if available
const getTauriInvoke = async () => {
    try {
        const { invoke } = await import("@tauri-apps/api/core");
        return invoke;
    } catch (error) {
        throw new Error("Tauri APIs not available");
    }
};

export interface ServerStatus {
    isRunning: boolean;
    isStarting: boolean;
    error: string | null;
    lastChecked: Date | null;
    engineInfo?: any;
}

export function useServerStatus() {
    const [status, setStatus] = useState<ServerStatus>({
        isRunning: false,
        isStarting: false,
        error: null,
        lastChecked: null,
    });

    const checkServerHealth = useCallback(async () => {
        try {
            // Try to directly use Tauri invoke - if it works, we're in desktop mode
            const invoke = await getTauriInvoke();
            const healthResult = await invoke("health_check");
            const engineInfo = await invoke("get_engine_info");

            setStatus((prev) => ({
                ...prev,
                isRunning: true,
                error: null,
                lastChecked: new Date(),
                engineInfo,
            }));
            return true;
        } catch (error) {
            // If Tauri invoke fails, we're either in browser mode or there's an actual error
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            // Check if this is a "Tauri not available" error vs a backend error
            const isTauriError =
                errorMessage.includes("Tauri APIs not available") ||
                errorMessage.includes("Cannot resolve") ||
                errorMessage.includes("__TAURI__");

            setStatus((prev) => ({
                ...prev,
                isRunning: false,
                error: isTauriError
                    ? "PyO3 backend only available in desktop app"
                    : `PyO3 backend error: ${errorMessage}`,
                lastChecked: new Date(),
            }));
            return false;
        }
    }, []);

    const startServer = useCallback(async () => {
        // With PyO3, there's no separate server to start
        // The Python backend is embedded in the Tauri app
        setStatus((prev) => ({ ...prev, isStarting: true, error: null }));

        try {
            // Just check if the PyO3 backend is working
            const isHealthy = await checkServerHealth();

            setStatus((prev) => ({
                ...prev,
                isStarting: false,
                isRunning: isHealthy,
                error: isHealthy ? null : "PyO3 backend is not available",
            }));

            return isHealthy;
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "PyO3 backend check failed";
            setStatus((prev) => ({
                ...prev,
                isStarting: false,
                isRunning: false,
                error: errorMessage,
            }));
            return false;
        }
    }, [checkServerHealth]);

    // Check backend status on mount and periodically
    useEffect(() => {
        checkServerHealth();

        const interval = setInterval(checkServerHealth, 30000); // Check every 30 seconds (less frequent since it's embedded)

        return () => clearInterval(interval);
    }, [checkServerHealth]);

    return {
        status,
        checkServerHealth,
        startServer,
        refresh: checkServerHealth,
    };
}
