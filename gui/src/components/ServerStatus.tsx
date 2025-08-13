import { useServerStatus } from "@/hooks/useServerStatus";
import { Button } from "@/components/ui/button";
import {
    RefreshCw,
    Cpu,
    AlertCircle,
    CheckCircle,
    Loader2,
} from "lucide-react";

export function ServerStatus() {
    const { status, refresh } = useServerStatus();

    const getStatusIcon = () => {
        if (status.isStarting) {
            return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
        }
        if (status.isRunning) {
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    };

    const getStatusText = () => {
        if (status.isStarting) {
            return "Checking backend...";
        }
        if (status.isRunning) {
            return "Plugin backend ready";
        }
        return "Backend not available";
    };

    const getStatusColor = () => {
        if (status.isStarting) {
            return "text-blue-600";
        }
        if (status.isRunning) {
            return "text-green-600";
        }
        return "text-red-600";
    };

    return (
        <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Python Backend</span>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <span className={`text-sm font-medium ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                </div>
            </div>

            {status.error && (
                <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    <strong>Error:</strong> {status.error}
                </div>
            )}

            {status.engineInfo && status.isRunning && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                    <div className="font-medium">{status.engineInfo.name}</div>
                    <div className="text-xs text-green-600">
                        Version: {status.engineInfo.version} | Backend:{" "}
                        {status.engineInfo.backend}
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                <Button
                    onClick={refresh}
                    size="sm"
                    variant="outline"
                    disabled={status.isStarting}
                    className="flex-1"
                >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Check Status
                </Button>
            </div>

            {status.lastChecked && (
                <div className="mt-2 text-xs text-muted-foreground">
                    Last checked: {status.lastChecked.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
}
