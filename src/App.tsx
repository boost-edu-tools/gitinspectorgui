import { SettingsFormTabs } from "./components/SettingsFormTabs";
import { ExecuteButton } from "./components/ExecuteButton";
import { Phase3ResultsInterface } from "./components/Phase3ResultsInterface";
import { useResultsStore } from "./stores/resultsStore";

function App() {
  const { results, isAnalyzing, error } = useResultsStore();

  return (
    <div className="app-container flex h-screen">
      {/* Settings Panel */}
      <div className="settings-panel w-1/3 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            GitInspectorGUI
          </h1>
          <p className="text-sm text-muted-foreground">
            Modern git repository analysis tool
          </p>
        </div>
        
        {/* Scrollable Settings */}
        <div className="flex-1 p-6 overflow-y-auto">
          <SettingsFormTabs />
        </div>
        
        {/* Fixed Execute Button */}
        <div className="p-6 pt-4 border-t border-border">
          <ExecuteButton />
          
          {error && (
            <div className="p-4 mt-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Panel */}
      <div className="results-panel flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Analysis Results
          </h2>
          {isAnalyzing && (
            <div className="flex items-center mt-2">
              <div className="loading-spinner w-4 h-4 mr-2"></div>
              <span className="text-sm text-muted-foreground">
                Analyzing repositories...
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-hidden">
          {results ? (
            <Phase3ResultsInterface />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-lg text-muted-foreground mb-2">
                  No analysis results yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Configure your settings and click "Execute Analysis" to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
