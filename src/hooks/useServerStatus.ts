import { useState, useEffect, useCallback } from "react";
import { healthCheck, getEngineInfo } from "@/lib/api";

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
            // Use the new plugin API
            const healthResult = await healthCheck();
            const engineInfo = await getEngineInfo();

            setStatus((prev) => ({
                ...prev,
                isRunning: true,
                error: null,
                lastChecked: new Date(),
                engineInfo,
            }));
            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            setStatus((prev) => ({
                ...prev,
                isRunning: false,
                error: `Plugin backend error: ${errorMessage}`,
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
