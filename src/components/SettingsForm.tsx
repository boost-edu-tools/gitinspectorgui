import React from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { Input } from "@/components/ui/input";

export function SettingsForm() {
    const { settings, updateSettings, isLoading } = useSettingsStore();

    const handleInputChange =
        (field: keyof typeof settings) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value =
                e.target.type === "checkbox"
                    ? e.target.checked
                    : e.target.value;
            updateSettings({ [field]: value });
        };

    const handleArrayInputChange =
        (field: keyof typeof settings) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            updateSettings({ [field]: value });
        };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Settings</h3>

            {/* Repository Paths */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Repository Paths
                </label>
                <Input
                    placeholder="Enter repository paths (comma-separated)"
                    value={settings.input_fstrs.join(", ")}
                    onChange={handleArrayInputChange("input_fstrs")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Paths to repositories or folders to analyze
                </p>
            </div>

            {/* Depth */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Search Depth
                </label>
                <Input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.depth}
                    onChange={handleInputChange("depth")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Maximum directory depth to search for repositories
                </p>
            </div>

            {/* Number of Files */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Max Files
                </label>
                <Input
                    type="number"
                    min="1"
                    value={settings.n_files}
                    onChange={handleInputChange("n_files")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Maximum number of files to analyze per repository
                </p>
            </div>

            {/* Include Files */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Include Files
                </label>
                <Input
                    placeholder="*.py, *.js, *.ts (comma-separated)"
                    value={settings.include_files.join(", ")}
                    onChange={handleArrayInputChange("include_files")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    File patterns to include in analysis
                </p>
            </div>

            {/* Exclude Files */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Exclude Files
                </label>
                <Input
                    placeholder="*.min.js, *.test.* (comma-separated)"
                    value={settings.ex_files.join(", ")}
                    onChange={handleArrayInputChange("ex_files")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    File patterns to exclude from analysis
                </p>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Since Date
                </label>
                <Input
                    type="date"
                    value={settings.since}
                    onChange={handleInputChange("since")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Only analyze commits after this date (leave empty for no
                    restriction)
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Until Date
                </label>
                <Input
                    type="date"
                    value={settings.until}
                    onChange={handleInputChange("until")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Only analyze commits before this date (leave empty for no
                    restriction)
                </p>
            </div>

            {/* Copy/Move Detection */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Copy/Move Detection
                </label>
                <Input
                    type="number"
                    min="0"
                    max="3"
                    value={settings.copy_move}
                    onChange={handleInputChange("copy_move")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    0: None, 1: Copy, 2: Move, 3: Both
                </p>
            </div>

            {/* Boolean Options */}
            <div className="space-y-3">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="scaled_percentages"
                        checked={settings.scaled_percentages}
                        onChange={handleInputChange("scaled_percentages")}
                        disabled={isLoading}
                        className="rounded border-input"
                    />
                    <label
                        htmlFor="scaled_percentages"
                        className="text-sm text-foreground"
                    >
                        Scaled Percentages
                    </label>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="blame_exclusions"
                        checked={
                            settings.blame_exclusions === "show" ||
                            settings.blame_exclusions === "remove"
                        }
                        onChange={(e) =>
                            updateSettings({
                                blame_exclusions: e.target.checked
                                    ? "show"
                                    : "hide",
                            })
                        }
                        disabled={isLoading}
                        className="rounded border-input"
                    />
                    <label
                        htmlFor="blame_exclusions"
                        className="text-sm text-foreground"
                    >
                        Blame Exclusions
                    </label>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="dynamic_blame_history"
                        checked={settings.view === "dynamic-blame-history"}
                        onChange={(e) =>
                            updateSettings({
                                view: e.target.checked
                                    ? "dynamic-blame-history"
                                    : "auto",
                            })
                        }
                        disabled={isLoading}
                        className="rounded border-input"
                    />
                    <label
                        htmlFor="dynamic_blame_history"
                        className="text-sm text-foreground"
                    >
                        Dynamic Blame History
                    </label>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="dryrun"
                        checked={settings.dryrun !== 0}
                        onChange={(e) =>
                            updateSettings({ dryrun: e.target.checked ? 1 : 0 })
                        }
                        disabled={isLoading}
                        className="rounded border-input"
                    />
                    <label htmlFor="dryrun" className="text-sm text-foreground">
                        Dry Run (Preview Only)
                    </label>
                </div>
            </div>
        </div>
    );
}
