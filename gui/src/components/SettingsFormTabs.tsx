import React, { useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { Input } from "@/components/ui/input";

type TabType =
    | "repository"
    | "files"
    | "filtering"
    | "output"
    | "analysis"
    | "performance";

export function SettingsFormTabs() {
    const { settings, updateSettings, isLoading } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<TabType>("repository");

    const handleInputChange =
        (field: keyof typeof settings) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const value =
                e.target.type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
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

    const handleNumberInputChange =
        (field: keyof typeof settings) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseInt(e.target.value) || 0;
            updateSettings({ [field]: value });
        };

    const tabs = [
        { id: "repository", label: "Repository", icon: "📁" },
        { id: "files", label: "Files", icon: "📄" },
        { id: "filtering", label: "Filtering", icon: "🔍" },
        { id: "output", label: "Output", icon: "📊" },
        { id: "analysis", label: "Analysis", icon: "⚙️" },
        { id: "performance", label: "Performance", icon: "⚡" },
    ] as const;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Settings</h3>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1 border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                            activeTab === tab.id
                                ? "bg-primary text-primary-foreground border-b-2 border-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                    >
                        <span className="mr-1">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {activeTab === "repository" && (
                    <RepositoryTab
                        settings={settings}
                        handleInputChange={handleInputChange}
                        handleArrayInputChange={handleArrayInputChange}
                        handleNumberInputChange={handleNumberInputChange}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === "files" && (
                    <FilesTab
                        settings={settings}
                        handleInputChange={handleInputChange}
                        handleArrayInputChange={handleArrayInputChange}
                        handleNumberInputChange={handleNumberInputChange}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === "filtering" && (
                    <FilteringTab
                        settings={settings}
                        handleInputChange={handleInputChange}
                        handleArrayInputChange={handleArrayInputChange}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === "output" && (
                    <OutputTab
                        settings={settings}
                        handleInputChange={handleInputChange}
                        handleArrayInputChange={handleArrayInputChange}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === "analysis" && (
                    <AnalysisTab
                        settings={settings}
                        handleInputChange={handleInputChange}
                        isLoading={isLoading}
                    />
                )}
                {activeTab === "performance" && (
                    <PerformanceTab
                        settings={settings}
                        handleInputChange={handleInputChange}
                        handleNumberInputChange={handleNumberInputChange}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </div>
    );
}

function RepositoryTab({
    settings,
    handleInputChange,
    handleArrayInputChange,
    handleNumberInputChange,
    isLoading,
}: any) {
    return (
        <div className="space-y-4">
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

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Search Depth
                </label>
                <Input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.depth}
                    onChange={handleNumberInputChange("depth")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Maximum directory depth to search for repositories
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Subfolder
                </label>
                <Input
                    placeholder="Optional subfolder path"
                    value={settings.subfolder}
                    onChange={handleInputChange("subfolder")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Analyze only a specific subfolder within repositories
                </p>
            </div>
        </div>
    );
}

function FilesTab({
    settings,
    handleArrayInputChange,
    handleNumberInputChange,
    isLoading,
}: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Max Files
                </label>
                <Input
                    type="number"
                    min="1"
                    value={settings.n_files}
                    onChange={handleNumberInputChange("n_files")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Maximum number of files to analyze per repository
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    File Extensions
                </label>
                <Input
                    placeholder="c, cpp, py, js, ts (comma-separated)"
                    value={settings.extensions.join(", ")}
                    onChange={handleArrayInputChange("extensions")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    File extensions to include in analysis
                </p>
            </div>

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
        </div>
    );
}

function FilteringTab({
    settings,
    handleInputChange,
    handleArrayInputChange,
    isLoading,
}: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Exclude Authors
                </label>
                <Input
                    placeholder="author1, author2 (comma-separated)"
                    value={settings.ex_authors.join(", ")}
                    onChange={handleArrayInputChange("ex_authors")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Author names to exclude from analysis
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Exclude Emails
                </label>
                <Input
                    placeholder="email1@domain.com, email2@domain.com"
                    value={settings.ex_emails.join(", ")}
                    onChange={handleArrayInputChange("ex_emails")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Email addresses to exclude from analysis
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Exclude Revisions
                </label>
                <Input
                    placeholder="commit1, commit2 (comma-separated)"
                    value={settings.ex_revisions.join(", ")}
                    onChange={handleArrayInputChange("ex_revisions")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Commit hashes to exclude from analysis
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Exclude Messages
                </label>
                <Input
                    placeholder="merge, revert (comma-separated)"
                    value={settings.ex_messages.join(", ")}
                    onChange={handleArrayInputChange("ex_messages")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Commit message patterns to exclude
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Since Date
                    </label>
                    <Input
                        type="text"
                        value={settings.since}
                        onChange={handleInputChange("since")}
                        disabled={isLoading}
                        placeholder="YYYY-MM-DD (empty = no restriction)"
                    />
                    <p className="text-xs text-muted-foreground">
                        Only analyze commits after this date
                    </p>
                    {settings.since && (
                        <button
                            type="button"
                            onClick={() =>
                                handleInputChange("since")({
                                    target: { value: "" },
                                } as any)
                            }
                            className="text-xs text-blue-600 hover:text-blue-800"
                            disabled={isLoading}
                        >
                            Clear date
                        </button>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                        Until Date
                    </label>
                    <Input
                        type="text"
                        value={settings.until}
                        onChange={handleInputChange("until")}
                        disabled={isLoading}
                        placeholder="YYYY-MM-DD (empty = no restriction)"
                    />
                    <p className="text-xs text-muted-foreground">
                        Only analyze commits before this date
                    </p>
                    {settings.until && (
                        <button
                            type="button"
                            onClick={() =>
                                handleInputChange("until")({
                                    target: { value: "" },
                                } as any)
                            }
                            className="text-xs text-blue-600 hover:text-blue-800"
                            disabled={isLoading}
                        >
                            Clear date
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function OutputTab({
    settings,
    handleInputChange,
    handleArrayInputChange,
    isLoading,
}: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Output File Base
                </label>
                <Input
                    placeholder="gitinspect"
                    value={settings.outfile_base}
                    onChange={handleInputChange("outfile_base")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    Base name for output files
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    File Formats
                </label>
                <select
                    multiple
                    value={settings.file_formats}
                    onChange={(e) => {
                        const values = Array.from(
                            e.target.selectedOptions,
                            (option) => option.value
                        );
                        handleArrayInputChange("file_formats")({
                            target: { value: values.join(", ") },
                        } as any);
                    }}
                    disabled={isLoading}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                    <option value="html">HTML</option>
                    <option value="excel">Excel</option>
                </select>
                <p className="text-xs text-muted-foreground">
                    Output file formats (hold Ctrl/Cmd to select multiple)
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    View Mode
                </label>
                <select
                    value={settings.view}
                    onChange={handleInputChange("view")}
                    disabled={isLoading}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                    <option value="auto">Auto</option>
                    <option value="dynamic-blame-history">
                        Dynamic Blame History
                    </option>
                    <option value="none">None</option>
                </select>
                <p className="text-xs text-muted-foreground">
                    Output view mode
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Filename Fix
                </label>
                <select
                    value={settings.fix}
                    onChange={handleInputChange("fix")}
                    disabled={isLoading}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                    <option value="prefix">Prefix</option>
                    <option value="postfix">Postfix</option>
                    <option value="nofix">No Fix</option>
                </select>
                <p className="text-xs text-muted-foreground">
                    How to handle filename conflicts
                </p>
            </div>
        </div>
    );
}

function AnalysisTab({ settings, handleInputChange, isLoading }: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Copy/Move Detection
                </label>
                <select
                    value={settings.copy_move}
                    onChange={(e) =>
                        handleInputChange("copy_move")({
                            target: { value: parseInt(e.target.value) },
                        } as any)
                    }
                    disabled={isLoading}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                    <option value={0}>None</option>
                    <option value={1}>Copy</option>
                    <option value={2}>Move</option>
                    <option value={3}>Both</option>
                </select>
                <p className="text-xs text-muted-foreground">
                    Detect file copies and moves
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Blame Exclusions
                </label>
                <select
                    value={settings.blame_exclusions}
                    onChange={handleInputChange("blame_exclusions")}
                    disabled={isLoading}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                    <option value="hide">Hide</option>
                    <option value="show">Show</option>
                    <option value="remove">Remove</option>
                </select>
                <p className="text-xs text-muted-foreground">
                    How to handle excluded content in blame
                </p>
            </div>

            <div className="space-y-3">
                {[
                    {
                        key: "scaled_percentages",
                        label: "Scaled Percentages",
                        desc: "Scale percentages to visible content",
                    },
                    {
                        key: "blame_skip",
                        label: "Skip Blame Analysis",
                        desc: "Skip the blame analysis phase",
                    },
                    {
                        key: "show_renames",
                        label: "Show Renames",
                        desc: "Show file renames in analysis",
                    },
                    {
                        key: "deletions",
                        label: "Include Deletions",
                        desc: "Include deleted lines in statistics",
                    },
                    {
                        key: "whitespace",
                        label: "Include Whitespace",
                        desc: "Include whitespace changes",
                    },
                    {
                        key: "empty_lines",
                        label: "Include Empty Lines",
                        desc: "Include empty lines in analysis",
                    },
                    {
                        key: "comments",
                        label: "Include Comments",
                        desc: "Include comment lines in analysis",
                    },
                ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id={key}
                            checked={
                                settings[
                                    key as keyof typeof settings
                                ] as boolean
                            }
                            onChange={handleInputChange(
                                key as keyof typeof settings
                            )}
                            disabled={isLoading}
                            className="rounded border-input"
                        />
                        <div>
                            <label
                                htmlFor={key}
                                className="text-sm text-foreground font-medium"
                            >
                                {label}
                            </label>
                            <p className="text-xs text-muted-foreground">
                                {desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PerformanceTab({
    settings,
    handleInputChange,
    handleNumberInputChange,
    isLoading,
}: any) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Verbosity Level
                </label>
                <select
                    value={settings.verbosity}
                    onChange={(e) =>
                        handleNumberInputChange("verbosity")({
                            target: { value: e.target.value },
                        } as any)
                    }
                    disabled={isLoading}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                    <option value={0}>Silent</option>
                    <option value={1}>Normal</option>
                    <option value={2}>Verbose</option>
                    <option value={3}>Debug</option>
                </select>
                <p className="text-xs text-muted-foreground">
                    Logging verbosity level
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Dry Run Level
                </label>
                <select
                    value={settings.dryrun}
                    onChange={(e) =>
                        handleNumberInputChange("dryrun")({
                            target: { value: e.target.value },
                        } as any)
                    }
                    disabled={isLoading}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                    <option value={0}>Disabled</option>
                    <option value={1}>Preview Only</option>
                    <option value={2}>Full Dry Run</option>
                </select>
                <p className="text-xs text-muted-foreground">
                    Dry run mode for testing
                </p>
            </div>

            <div className="space-y-3">
                {[
                    {
                        key: "multithread",
                        label: "Multi-threading",
                        desc: "Enable multi-threaded processing",
                    },
                    {
                        key: "multicore",
                        label: "Multi-core",
                        desc: "Enable multi-core processing",
                    },
                    {
                        key: "gui_settings_full_path",
                        label: "Full Path in GUI",
                        desc: "Show full paths in GUI settings",
                    },
                ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id={key}
                            checked={
                                settings[
                                    key as keyof typeof settings
                                ] as boolean
                            }
                            onChange={handleInputChange(
                                key as keyof typeof settings
                            )}
                            disabled={isLoading}
                            className="rounded border-input"
                        />
                        <div>
                            <label
                                htmlFor={key}
                                className="text-sm text-foreground font-medium"
                            >
                                {label}
                            </label>
                            <p className="text-xs text-muted-foreground">
                                {desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Column Percentage
                </label>
                <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.col_percent}
                    onChange={handleNumberInputChange("col_percent")}
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                    GUI column width percentage
                </p>
            </div>
        </div>
    );
}
