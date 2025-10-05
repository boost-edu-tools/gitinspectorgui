import { useSettingsStore } from "@/stores/settingsStore";
import { useResultsStore } from "@/stores/resultsStore";
import { Button } from "@/components/ui/button";

export function ExecuteButton() {
    const { settings } = useSettingsStore();
    const { runAnalysis, isAnalyzing } = useResultsStore();

    const handleExecute = async () => {
        console.log(
            "0. Execute button clicked with paths:",
            settings.input_fstrs
        );

        if (settings.input_fstrs.length === 0) {
            alert("Please specify at least one repository path");
            return;
        }

        await runAnalysis(settings);
    };

    const isDisabled = () => {
        if (isAnalyzing) return true;
        if (settings.input_fstrs.length === 0) return true;
        return false;
    };

    const getButtonText = () => {
        if (isAnalyzing) {
            return (
                <div className="flex items-center">
                    <div className="loading-spinner w-4 h-4 mr-2"></div>
                    Analyzing...
                </div>
            );
        }
        return "Execute Analysis";
    };

    return (
        <Button
            onClick={handleExecute}
            disabled={isDisabled()}
            className="w-full"
            size="lg"
        >
            {getButtonText()}
        </Button>
    );
}
