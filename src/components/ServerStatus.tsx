import { useServerStatus } from "@/hooks/useServerStatus";
import { Button } from "@/components/ui/button";
import {
    RefreshCw,
    Server,
    AlertCircle,
    CheckCircle,
    Loader2,
} from "lucide-react";

export function ServerStatus() {
    const { status, startServer, refresh } = useServerStatus();

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
            return "Starting server...";
        }
        if (status.isRunning) {
            return "Server running";
        }
        return "Server not running";
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
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        Python API Server
                    </span>
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

            <div className="flex gap-2">
                {!status.isRunning && !status.isStarting && (
                    <Button
                        onClick={startServer}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                    >
                        <Server className="w-3 h-3 mr-1" />
                        Start Server
                    </Button>
                )}

                <Button
                    onClick={refresh}
                    size="sm"
                    variant="outline"
                    disabled={status.isStarting}
                >
                    <RefreshCw className="w-3 h-3" />
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
