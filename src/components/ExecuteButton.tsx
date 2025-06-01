import React from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useResultsStore } from "@/stores/resultsStore";
import { Button } from "@/components/ui/button";

export function ExecuteButton() {
  const { settings } = useSettingsStore();
  const { runAnalysis, isAnalyzing } = useResultsStore();

  const handleExecute = async () => {
    if (settings.input_fstrs.length === 0) {
      alert("Please specify at least one repository path");
      return;
    }
    
    await runAnalysis(settings);
  };

  return (
    <Button
      onClick={handleExecute}
      disabled={isAnalyzing || settings.input_fstrs.length === 0}
      className="w-full"
      size="lg"
    >
      {isAnalyzing ? (
        <div className="flex items-center">
          <div className="loading-spinner w-4 h-4 mr-2"></div>
          Analyzing...
        </div>
      ) : (
        "Execute Analysis"
      )}
    </Button>
  );
}