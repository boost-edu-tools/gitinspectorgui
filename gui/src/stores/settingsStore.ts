import { create } from "zustand";
import type { Settings } from "@/types/settings";
import { defaultSettings } from "@/types/settings";
import { getSettings, saveSettings } from "@/lib/api";

interface SettingsStore {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<Settings>) => void;
  loadSettings: () => Promise<void>;
  saveSettingsToFile: () => Promise<void>;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  error: null,

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
      error: null,
    }));
  },

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load settings",
        isLoading: false,
      });
    }
  },

  saveSettingsToFile: async () => {
    set({ isLoading: true, error: null });
    try {
      await saveSettings(get().settings);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to save settings",
        isLoading: false,
      });
    }
  },

  resetSettings: () => {
    set({ settings: defaultSettings, error: null });
  },
}));