import { useSettingsStore } from "@/stores/settingsStore";
import { useResultsStore } from "@/stores/resultsStore";
import { Button } from "@/components/ui/button";
import { retrieveRepositories, runInitialAnalysis } from "@/lib/api";

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

        // Trigger analysis — repository expansion is handled inside `runAnalysis`.
        // Additionally: run initial analysis on the first found repository and print its object.
        try {
            const firstInput = settings.input_fstrs[0];
            const found = await retrieveRepositories(firstInput, Number(settings.depth || 1));
            if (found && found.length > 0) {
                const firstRepo = found[0];

                // Build minimal parameters object. Other fields left null/undefined.
                const params = {
                    repo_path: firstRepo,
                    from_time: null,
                    to_time: null,
                    from_commit: null,
                    to_commit: null,
                    commit_hash_filter: null,
                    commit_message_filter: null,
                    file_types_filter: null,
                    path_filter: null,
                };

                try {
                    const initialResult = await runInitialAnalysis(params);
                    console.log("Initial analysis result for first repository:", initialResult);
                } catch (err) {
                    console.warn("runInitialAnalysis failed:", err);
                }
            } else {
                console.warn("No repositories found for initial analysis");
            }
        } catch (err) {
            console.warn("Error while running initial analysis:", err);
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
