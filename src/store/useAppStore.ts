import { create } from 'zustand';
import {
  enterPlatformOverlayMode,
  exitPlatformOverlayMode,
  setPlatformAlwaysOnTop,
  setPlatformClickThrough,
  setPlatformTransparentWindow,
} from '../platform/platform';
import { loadSettings, saveSettings } from '../systems/settingsSystem';
import {
  loadWallpaperSettings as loadStoredWallpaperSettings,
  resetWallpaperSettings as resetStoredWallpaperSettings,
  saveWallpaperSettings as saveStoredWallpaperSettings,
} from '../systems/settingsStorage';
import { clearTutorialSeen, loadTutorialSeen, saveTutorialSeen } from '../systems/tutorialSystem';
import type { AppSettings, WallpaperMode, WallpaperSettings } from '../types/game';

export type AppScreen = 'title' | 'game' | 'settings' | 'gallery' | 'credits' | 'stats';

interface AppStore {
  currentScreen: AppScreen;
  hasSeenTutorial: boolean;
  isAlwaysOnTopEnabled: boolean;
  isClickThroughEnabled: boolean;
  isFocusMode: boolean;
  isTransparentWindowEnabled: boolean;
  wallpaperMode: WallpaperMode;
  wallpaperSettings: WallpaperSettings;
  settingsReturnScreen: 'title' | 'game';
  statsReturnScreen: 'title' | 'game' | 'settings';
  settings: AppSettings;
  setScreen: (screen: AppScreen) => void;
  openSettings: (from: 'title' | 'game') => void;
  closeSettings: () => void;
  openStats: (from: 'title' | 'game' | 'settings') => void;
  closeStats: () => void;
  completeTutorial: () => void;
  replayTutorial: () => void;
  setWallpaperMode: (mode: WallpaperMode) => void;
  exitWallpaperMode: () => void;
  setAlwaysOnTopEnabled: (enabled: boolean) => void;
  setClickThroughEnabled: (enabled: boolean) => void;
  setTransparentWindowEnabled: (enabled: boolean) => void;
  loadWallpaperSettings: () => void;
  resetWallpaperSettings: () => void;
  saveWallpaperSettings: () => void;
  setWallpaperSettings: (settings: Partial<WallpaperSettings>) => void;
  updateWallpaperSettings: (settings: Partial<WallpaperSettings>) => void;
  toggleWallpaperStageMode: () => void;
  toggleMuseOverlayMode: () => void;
  toggleFocusMode: () => void;
  exitFocusMode: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const initialSettings = loadSettings();
const initialWallpaperSettings = loadStoredWallpaperSettings();

export const useAppStore = create<AppStore>((set) => ({
  currentScreen: 'title',
  hasSeenTutorial: loadTutorialSeen(),
  isAlwaysOnTopEnabled: initialWallpaperSettings.alwaysOnTopPreferred,
  isClickThroughEnabled: initialWallpaperSettings.clickThroughPreferred,
  isFocusMode: false,
  isTransparentWindowEnabled: false,
  wallpaperMode: 'off',
  wallpaperSettings: initialWallpaperSettings,
  settingsReturnScreen: 'title',
  statsReturnScreen: 'title',
  settings: initialSettings,
  setScreen: (screen) => set({ currentScreen: screen, isFocusMode: false }),
  openSettings: (from) =>
    set({ currentScreen: 'settings', isFocusMode: false, settingsReturnScreen: from }),
  closeSettings: () =>
    set((state) => ({
      currentScreen: state.settingsReturnScreen,
    })),
  openStats: (from) =>
    set({ currentScreen: 'stats', isFocusMode: false, statsReturnScreen: from }),
  closeStats: () =>
    set((state) => ({
      currentScreen: state.statsReturnScreen,
    })),
  completeTutorial: () => {
    saveTutorialSeen();
    set({ hasSeenTutorial: true });
  },
  replayTutorial: () => {
    clearTutorialSeen();
    set({ currentScreen: 'game', hasSeenTutorial: false, isFocusMode: false });
  },
  setWallpaperMode: (mode) => {
    void (mode === 'muse_overlay' ? enterPlatformOverlayMode() : exitPlatformOverlayMode());
    set((state) => ({
      isFocusMode: mode === 'off' ? state.isFocusMode : false,
      wallpaperMode: mode,
    }));
  },
  exitWallpaperMode: () => {
    void exitPlatformOverlayMode();
    set({ wallpaperMode: 'off' });
  },
  setAlwaysOnTopEnabled: (enabled) => {
    void setPlatformAlwaysOnTop(enabled);
    set((state) => {
      const wallpaperSettings = { ...state.wallpaperSettings, alwaysOnTopPreferred: enabled };
      saveStoredWallpaperSettings(wallpaperSettings);
      return { isAlwaysOnTopEnabled: enabled, wallpaperSettings };
    });
  },
  setClickThroughEnabled: (enabled) => {
    void setPlatformClickThrough(enabled);
    set((state) => {
      const wallpaperSettings = { ...state.wallpaperSettings, clickThroughPreferred: enabled };
      saveStoredWallpaperSettings(wallpaperSettings);
      return { isClickThroughEnabled: enabled, wallpaperSettings };
    });
  },
  setTransparentWindowEnabled: (enabled) => {
    void setPlatformTransparentWindow(enabled);
    set({ isTransparentWindowEnabled: enabled });
  },
  loadWallpaperSettings: () =>
    set(() => {
      const wallpaperSettings = loadStoredWallpaperSettings();
      return {
        isAlwaysOnTopEnabled: wallpaperSettings.alwaysOnTopPreferred,
        isClickThroughEnabled: wallpaperSettings.clickThroughPreferred,
        wallpaperSettings,
      };
    }),
  resetWallpaperSettings: () =>
    set(() => {
      const wallpaperSettings = resetStoredWallpaperSettings();
      return {
        isAlwaysOnTopEnabled: wallpaperSettings.alwaysOnTopPreferred,
        isClickThroughEnabled: wallpaperSettings.clickThroughPreferred,
        wallpaperSettings,
      };
    }),
  saveWallpaperSettings: () =>
    set((state) => {
      saveStoredWallpaperSettings(state.wallpaperSettings);
      return state;
    }),
  setWallpaperSettings: (updates) =>
    set((state) => {
      const wallpaperSettings = { ...state.wallpaperSettings, ...updates };
      saveStoredWallpaperSettings(wallpaperSettings);
      return {
        isAlwaysOnTopEnabled: wallpaperSettings.alwaysOnTopPreferred,
        isClickThroughEnabled: wallpaperSettings.clickThroughPreferred,
        wallpaperSettings,
      };
    }),
  updateWallpaperSettings: (updates) => useAppStore.getState().setWallpaperSettings(updates),
  toggleWallpaperStageMode: () => {
    void exitPlatformOverlayMode();
    set((state) => ({
      isFocusMode: state.wallpaperMode === 'stage' ? state.isFocusMode : false,
      wallpaperMode: state.wallpaperMode === 'stage' ? 'off' : 'stage',
    }));
  },
  toggleMuseOverlayMode: () =>
    set((state) => {
      const wallpaperMode = state.wallpaperMode === 'muse_overlay' ? 'off' : 'muse_overlay';
      void (wallpaperMode === 'muse_overlay'
        ? enterPlatformOverlayMode()
        : exitPlatformOverlayMode());

      return {
        isFocusMode: wallpaperMode === 'muse_overlay' ? false : state.isFocusMode,
        wallpaperMode,
      };
    }),
  toggleFocusMode: () => {
    void exitPlatformOverlayMode();
    set((state) => ({
      isFocusMode: !state.isFocusMode,
      wallpaperMode: !state.isFocusMode ? 'off' : state.wallpaperMode,
    }));
  },
  exitFocusMode: () => set({ isFocusMode: false }),
  updateSettings: (updates) =>
    set((state) => {
      const settings = { ...state.settings, ...updates };
      saveSettings(settings);
      return { settings };
    }),
}));
