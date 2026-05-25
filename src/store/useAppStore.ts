import { create } from 'zustand';
import { loadSettings, saveSettings } from '../systems/settingsSystem';
import type { AppSettings } from '../types/game';

export type AppScreen = 'title' | 'game' | 'settings' | 'gallery' | 'credits';

interface AppStore {
  currentScreen: AppScreen;
  settingsReturnScreen: 'title' | 'game';
  settings: AppSettings;
  setScreen: (screen: AppScreen) => void;
  openSettings: (from: 'title' | 'game') => void;
  closeSettings: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentScreen: 'title',
  settingsReturnScreen: 'title',
  settings: loadSettings(),
  setScreen: (screen) => set({ currentScreen: screen }),
  openSettings: (from) => set({ currentScreen: 'settings', settingsReturnScreen: from }),
  closeSettings: () =>
    set((state) => ({
      currentScreen: state.settingsReturnScreen,
    })),
  updateSettings: (updates) =>
    set((state) => {
      const settings = { ...state.settings, ...updates };
      saveSettings(settings);
      return { settings };
    }),
}));
