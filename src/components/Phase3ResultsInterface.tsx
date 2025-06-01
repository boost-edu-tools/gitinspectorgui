import React, { useState } from "react";
import { useResultsStore } from "@/stores/resultsStore";
import { InteractiveResultsTables } from "./InteractiveResultsTables";
import { BlameHistoryNavigator } from "./BlameHistoryNavigator";
import { Button } from "@/components/ui/button";

type ViewMode = "standard" | "interactive" | "history";

interface ViewModeConfig {
  id: ViewMode;
  label: string;
  icon: string;
  description: string;
  component: React.ComponentType;
}

export function Phase3ResultsInterface() {
  const { results } = useResultsStore();
  const [currentView, setCurrentView] = useState<ViewMode>("interactive");

  const viewModes: ViewModeConfig[] = [
    {
      id: "interactive",
      label: "Analysis Tables",
      icon: "📊",
      description: "Interactive tables with sorting and filtering",
      component: InteractiveResultsTables,
    },
    {
      id: "history",
      label: "Blame History",
      icon: "📜",
      description: "Navigate through commit history and blame information",
      component: BlameHistoryNavigator,
    },
  ];

  const currentViewConfig = viewModes.find(view => view.id === currentView);
  const CurrentComponent = currentViewConfig?.component || InteractiveResultsTables;

  if (!results) {
    return (
      <div className="h-full flex flex-col">
        {/* View Mode Selector (always visible) */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Analysis Results
            </h2>
            <div className="flex gap-2">
              {viewModes.map((mode) => (
                <Button
                  key={mode.id}
                  variant={currentView === mode.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView(mode.id)}
                  className="flex items-center gap-2"
                >
                  <span>{mode.icon}</span>
                  <span className="hidden sm:inline">{mode.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Current View Description */}
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>{currentViewConfig?.icon} {currentViewConfig?.label}:</strong>{" "}
              {currentViewConfig?.description}
            </p>
          </div>
        </div>

        {/* No Results State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">📭</div>
            <div>
              <p className="text-lg text-muted-foreground mb-2">
                No analysis results yet
              </p>
              <p className="text-sm text-muted-foreground">
                Configure your settings and click "Execute Analysis" to get started
              </p>
            </div>
            
            {/* Feature Preview */}
            <div className="mt-8 p-4 border border-border rounded-lg bg-muted/20 max-w-md">
              <h3 className="font-medium mb-2">🚀 Advanced Features Ready</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📊 Interactive Tables: Cell editing, row expansion, and advanced filtering</p>
                <p>🕒 History Navigator: Commit timeline and blame navigation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced View Mode Selector */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Analysis Results
          </h2>
          <div className="flex gap-2">
            {viewModes.map((mode) => (
              <Button
                key={mode.id}
                variant={currentView === mode.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView(mode.id)}
                className="flex items-center gap-2"
              >
                <span>{mode.icon}</span>
                <span className="hidden sm:inline">{mode.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Current View Description and Stats */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <p>
              {currentViewConfig?.icon && currentViewConfig?.label && (
                <>
                  <strong>{currentViewConfig.icon} {currentViewConfig.label}:</strong>{" "}
                </>
              )}
              {currentViewConfig?.description}
            </p>
          </div>
          
        </div>

        {/* Phase 3 Feature Indicators */}
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          {currentView === "interactive" && (
            <>
            </>
          )}
          {currentView === "history" && (
            <>
            </>
          )}
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-hidden">
        <CurrentComponent />
      </div>

      {/* Phase 3 Status Bar */}
      <div className="p-2 border-t border-border bg-muted/10 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>
            🚀 GitInspectorGUI: Advanced Features Active • {currentViewConfig?.label}
          </span>
          <span>
            GitInspectorGUI v2.0 • Modern Analysis Interface
          </span>
        </div>
      </div>
    </div>
  );
}
