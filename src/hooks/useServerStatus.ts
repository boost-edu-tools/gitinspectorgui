import { useState, useEffect, useCallback } from "react";

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

// Dynamically import Tauri invoke only if available
const getTauriInvoke = async () => {
    if (!isTauriAvailable()) {
        throw new Error("Tauri APIs not available");
    }
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke;
};

export interface ServerStatus {
    isRunning: boolean;
    isStarting: boolean;
    error: string | null;
    lastChecked: Date | null;
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
            if (!isTauriAvailable()) {
                // In browser mode, assume server is running if we can reach it via HTTP
                const response = await fetch("http://127.0.0.1:8080/health");
                if (response.ok) {
                    setStatus((prev) => ({
                        ...prev,
                        isRunning: true,
                        error: null,
                        lastChecked: new Date(),
                    }));
                    return true;
                } else {
                    throw new Error("Server not responding");
                }
            } else {
                const invoke = await getTauriInvoke();
                await invoke("health_check");
                setStatus((prev) => ({
                    ...prev,
                    isRunning: true,
                    error: null,
                    lastChecked: new Date(),
                }));
                return true;
            }
        } catch (error) {
            setStatus((prev) => ({
                ...prev,
                isRunning: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Server not responding",
                lastChecked: new Date(),
            }));
            return false;
        }
    }, []);

    const startServer = useCallback(async () => {
        setStatus((prev) => ({ ...prev, isStarting: true, error: null }));

        try {
            if (!isTauriAvailable()) {
                // In browser mode, we can't start the server directly
                setStatus((prev) => ({
                    ...prev,
                    isStarting: false,
                    isRunning: false,
                    error: "Cannot start server from browser mode. Please start the server manually.",
                }));
                return false;
            } else {
                const invoke = await getTauriInvoke();
                await invoke("start_python_server");

                // Wait a moment for server to fully start
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Check if server is actually running
                const isHealthy = await checkServerHealth();

                setStatus((prev) => ({
                    ...prev,
                    isStarting: false,
                    isRunning: isHealthy,
                    error: isHealthy
                        ? null
                        : "Server started but not responding to health checks",
                }));

                return isHealthy;
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to start server";
            setStatus((prev) => ({
                ...prev,
                isStarting: false,
                isRunning: false,
                error: errorMessage,
            }));
            return false;
        }
    }, [checkServerHealth]);

    // Check server status on mount and periodically
    useEffect(() => {
        checkServerHealth();

        const interval = setInterval(checkServerHealth, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [checkServerHealth]);

    return {
        status,
        checkServerHealth,
        startServer,
        refresh: checkServerHealth,
    };
}
