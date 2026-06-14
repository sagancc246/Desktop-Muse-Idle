import { create } from 'zustand';
import {
  enterPlatformNativeWallpaperMode,
  enterPlatformOverlayMode,
  exitPlatformNativeWallpaperMode,
  exitPlatformOverlayMode,
  getPlatformNativeWallpaperStatus,
  getPlatformOverlayStatus,
  isElectronOverlayAvailable,
  setPlatformAlwaysOnTop,
  setPlatformClickThrough,
  setPlatformTransparentWindow,
} from '../platform/platform';
import type { NativeWallpaperStatus, OverlayStatus } from '../platform/platformAdapter';
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
  isDebugPanelOpen: boolean;
  isFocusMode: boolean;
  isTransparentWindowEnabled: boolean;
  nativeWallpaperStatus: NativeWallpaperStatus;
  overlayLastError?: string;
  previousAppScreenBeforeNativeWallpaper?: AppScreen;
  restoredAppScreenAfterNativeWallpaperOff?: AppScreen;
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
  applyNativeWallpaperStatus: (state: NativeWallpaperStatus) => void;
  applyPlatformOverlayState: (state: OverlayStatus) => void;
  refreshNativeWallpaperStatus: () => Promise<void>;
  refreshOverlayStatus: () => Promise<void>;
  loadWallpaperSettings: () => void;
  resetWallpaperSettings: () => void;
  saveWallpaperSettings: () => void;
  setWallpaperSettings: (settings: Partial<WallpaperSettings>) => void;
  updateWallpaperSettings: (settings: Partial<WallpaperSettings>) => void;
  toggleWallpaperStageMode: () => void;
  toggleMuseOverlayMode: () => void;
  toggleDebugPanel: () => void;
  setDebugPanelOpen: (open: boolean) => void;
  toggleFocusMode: () => void;
  exitFocusMode: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const initialSettings = loadSettings();
const initialWallpaperSettings = loadStoredWallpaperSettings();
const initialNativeWallpaperStatus: NativeWallpaperStatus = {
  active: false,
  attached: false,
  backend: 'web_preview',
  fallbackActive: false,
  helperAvailable: false,
  nativeAttached: false,
  supported: false,
};
let overlayClickThroughDelayId: number | undefined;
const getOverlayErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
const clearOverlayClickThroughDelay = () => {
  if (overlayClickThroughDelayId !== undefined) {
    window.clearTimeout(overlayClickThroughDelayId);
    overlayClickThroughDelayId = undefined;
  }
};
const applyPlatformClickThrough = (enabled: boolean) => {
  if (!isElectronOverlayAvailable()) {
    return;
  }

  void setPlatformClickThrough(enabled)
    .then(() => useAppStore.getState().refreshOverlayStatus())
    .catch((error) => {
      useAppStore.setState({ overlayLastError: getOverlayErrorMessage(error) });
    });
};
const applyDelayedPreferredClickThrough = () => {
  clearOverlayClickThroughDelay();
  overlayClickThroughDelayId = window.setTimeout(() => {
    overlayClickThroughDelayId = undefined;
    const state = useAppStore.getState();
    if (state.wallpaperMode !== 'muse_overlay' || !state.wallpaperSettings.clickThroughPreferred) {
      return;
    }

    applyPlatformClickThrough(true);
    useAppStore.setState({ isClickThroughEnabled: true });
  }, 3_000);
};

export const useAppStore = create<AppStore>((set) => ({
  currentScreen: 'title',
  hasSeenTutorial: loadTutorialSeen(),
  isAlwaysOnTopEnabled: false,
  isClickThroughEnabled: false,
  isDebugPanelOpen: false,
  isFocusMode: false,
  isTransparentWindowEnabled: false,
  nativeWallpaperStatus: initialNativeWallpaperStatus,
  overlayLastError: undefined,
  previousAppScreenBeforeNativeWallpaper: undefined,
  restoredAppScreenAfterNativeWallpaperOff: undefined,
  wallpaperMode: 'off',
  wallpaperSettings: initialWallpaperSettings,
  settingsReturnScreen: 'title',
  statsReturnScreen: 'title',
  settings: initialSettings,
  setScreen: (screen) =>
    set({ currentScreen: screen, isDebugPanelOpen: false, isFocusMode: false }),
  openSettings: (from) =>
    set({
      currentScreen: 'settings',
      isDebugPanelOpen: false,
      isFocusMode: false,
      settingsReturnScreen: from,
    }),
  closeSettings: () =>
    set((state) => ({
      currentScreen: state.settingsReturnScreen,
    })),
  openStats: (from) =>
    set({
      currentScreen: 'stats',
      isDebugPanelOpen: false,
      isFocusMode: false,
      statsReturnScreen: from,
    }),
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
    set({
      currentScreen: 'game',
      hasSeenTutorial: false,
      isDebugPanelOpen: false,
      isFocusMode: false,
    });
  },
  setWallpaperMode: (mode) => {
    clearOverlayClickThroughDelay();
    if (mode === 'muse_overlay') {
      void exitPlatformNativeWallpaperMode();
      void enterPlatformOverlayMode().then(() => {
        const state = useAppStore.getState();
        void setPlatformAlwaysOnTop(true);
        void setPlatformTransparentWindow(true);
        applyPlatformClickThrough(false);
        if (state.wallpaperSettings.clickThroughPreferred) {
          applyDelayedPreferredClickThrough();
        }
      });
    } else if (mode === 'native_wallpaper') {
      set((state) => ({
        previousAppScreenBeforeNativeWallpaper:
          state.previousAppScreenBeforeNativeWallpaper ?? state.currentScreen,
        restoredAppScreenAfterNativeWallpaperOff: undefined,
      }));
      void exitPlatformOverlayMode();
      void enterPlatformNativeWallpaperMode()
        .then((result) => {
          if (result?.message) {
            useAppStore.setState((state) => ({
              nativeWallpaperStatus: {
                ...state.nativeWallpaperStatus,
                fallbackActive:
                  !state.nativeWallpaperStatus.probeAttached &&
                  result.mode !== 'native_desktop_wallpaper',
                lastError: result.message,
              },
            }));
          }
          return useAppStore.getState().refreshNativeWallpaperStatus();
        })
        .catch((error) => {
          useAppStore.setState((state) => ({
            nativeWallpaperStatus: {
              ...state.nativeWallpaperStatus,
              active: false,
              backend: 'fallback_stage',
              fallbackActive: true,
              lastError: getOverlayErrorMessage(error),
              nativeAttached: false,
            },
          }));
        });
    } else {
      void exitPlatformNativeWallpaperMode();
      void exitPlatformOverlayMode();
    }
    set((state) => {
      const restoredScreen =
        mode === 'off' && state.wallpaperMode === 'native_wallpaper'
          ? state.previousAppScreenBeforeNativeWallpaper
          : undefined;
      return {
        currentScreen: restoredScreen ?? state.currentScreen,
        isDebugPanelOpen: false,
        isClickThroughEnabled: false,
        isFocusMode: mode === 'off' ? state.isFocusMode : false,
        overlayLastError: undefined,
        isTransparentWindowEnabled: mode === 'muse_overlay',
        previousAppScreenBeforeNativeWallpaper:
          mode === 'off' && state.wallpaperMode === 'native_wallpaper'
            ? undefined
            : state.previousAppScreenBeforeNativeWallpaper,
        restoredAppScreenAfterNativeWallpaperOff:
          restoredScreen ?? state.restoredAppScreenAfterNativeWallpaperOff,
        wallpaperMode: mode,
      };
    });
  },
  exitWallpaperMode: () => {
    clearOverlayClickThroughDelay();
    void exitPlatformNativeWallpaperMode();
    void exitPlatformOverlayMode();
    set((state) => {
      const restoredScreen = state.previousAppScreenBeforeNativeWallpaper;
      return {
        currentScreen: restoredScreen ?? state.currentScreen,
        isClickThroughEnabled: false,
        isTransparentWindowEnabled: false,
        nativeWallpaperStatus: {
          ...state.nativeWallpaperStatus,
          appScreen: restoredScreen ?? state.currentScreen,
          restoredAppScreenAfterNativeWallpaperOff: restoredScreen,
          nativeWallpaperChangedAppScreen: false,
        },
        overlayLastError: undefined,
        previousAppScreenBeforeNativeWallpaper: undefined,
        restoredAppScreenAfterNativeWallpaperOff: restoredScreen,
        wallpaperMode: 'off',
      };
    });
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
    set((state) => {
      const wallpaperSettings = { ...state.wallpaperSettings, clickThroughPreferred: enabled };
      saveStoredWallpaperSettings(wallpaperSettings);
      if (state.wallpaperMode === 'muse_overlay') {
        applyPlatformClickThrough(enabled);
      }
      return { isClickThroughEnabled: enabled, wallpaperSettings };
    });
  },
  setTransparentWindowEnabled: (enabled) => {
    if (useAppStore.getState().wallpaperMode === 'muse_overlay') {
      void setPlatformTransparentWindow(enabled);
    }
    set({ isTransparentWindowEnabled: enabled });
  },
  applyNativeWallpaperStatus: (nativeWallpaperStatus) =>
    set((state) => {
      const nativeWallpaperStopped =
        state.wallpaperMode === 'native_wallpaper' &&
        nativeWallpaperStatus.active === false &&
        nativeWallpaperStatus.probeAttached === false &&
        nativeWallpaperStatus.nativeProbeActive === false &&
        nativeWallpaperStatus.fallbackActive === false;
      const restoredScreen = nativeWallpaperStopped
        ? state.previousAppScreenBeforeNativeWallpaper
        : undefined;

      return {
        currentScreen: restoredScreen ?? state.currentScreen,
        nativeWallpaperStatus: {
          ...nativeWallpaperStatus,
          appScreen: restoredScreen ?? state.currentScreen,
          previousAppScreenBeforeNativeWallpaper: nativeWallpaperStopped
            ? undefined
            : state.previousAppScreenBeforeNativeWallpaper,
          restoredAppScreenAfterNativeWallpaperOff:
            restoredScreen ?? state.restoredAppScreenAfterNativeWallpaperOff,
          nativeWallpaperChangedAppScreen: false,
        },
        previousAppScreenBeforeNativeWallpaper: nativeWallpaperStopped
          ? undefined
          : state.previousAppScreenBeforeNativeWallpaper,
        restoredAppScreenAfterNativeWallpaperOff:
          restoredScreen ?? state.restoredAppScreenAfterNativeWallpaperOff,
        wallpaperMode: nativeWallpaperStopped ? 'off' : state.wallpaperMode,
      };
    }),
  applyPlatformOverlayState: (overlayState) =>
    set({
      isAlwaysOnTopEnabled: overlayState.alwaysOnTopEnabled,
      isClickThroughEnabled: overlayState.clickThroughEnabled,
      isTransparentWindowEnabled: overlayState.transparentEnabled,
      overlayLastError: overlayState.lastError,
    }),
  refreshOverlayStatus: async () => {
    const overlayStatus = await getPlatformOverlayStatus();
    if (overlayStatus) {
      useAppStore.getState().applyPlatformOverlayState(overlayStatus);
    }
  },
  refreshNativeWallpaperStatus: async () => {
    const nativeWallpaperStatus = await getPlatformNativeWallpaperStatus();
    if (nativeWallpaperStatus) {
      useAppStore.getState().applyNativeWallpaperStatus(nativeWallpaperStatus);
    }
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
    clearOverlayClickThroughDelay();
    void exitPlatformNativeWallpaperMode();
    void exitPlatformOverlayMode();
    set((state) => ({
      isDebugPanelOpen: false,
      isClickThroughEnabled: false,
      isFocusMode:
        state.wallpaperMode === 'stage' || state.wallpaperMode === 'native_wallpaper'
          ? state.isFocusMode
          : false,
      isTransparentWindowEnabled: false,
      overlayLastError: undefined,
      currentScreen:
        state.wallpaperMode === 'native_wallpaper' && state.previousAppScreenBeforeNativeWallpaper
          ? state.previousAppScreenBeforeNativeWallpaper
          : state.currentScreen,
      previousAppScreenBeforeNativeWallpaper:
        state.wallpaperMode === 'native_wallpaper' ? undefined : state.previousAppScreenBeforeNativeWallpaper,
      restoredAppScreenAfterNativeWallpaperOff:
        state.wallpaperMode === 'native_wallpaper'
          ? state.previousAppScreenBeforeNativeWallpaper
          : state.restoredAppScreenAfterNativeWallpaperOff,
      wallpaperMode:
        state.wallpaperMode === 'stage' || state.wallpaperMode === 'native_wallpaper'
          ? 'off'
          : 'stage',
    }));
  },
  toggleMuseOverlayMode: () =>
    set((state) => {
      clearOverlayClickThroughDelay();
      const wallpaperMode = state.wallpaperMode === 'muse_overlay' ? 'off' : 'muse_overlay';
      if (wallpaperMode === 'muse_overlay') {
        void exitPlatformNativeWallpaperMode();
        void enterPlatformOverlayMode().then(() => {
          const currentState = useAppStore.getState();
          void setPlatformAlwaysOnTop(true);
          void setPlatformTransparentWindow(true);
          applyPlatformClickThrough(false);
          if (currentState.wallpaperSettings.clickThroughPreferred) {
            applyDelayedPreferredClickThrough();
          }
        });
      } else {
        void exitPlatformOverlayMode();
      }

      return {
        isDebugPanelOpen: false,
        isClickThroughEnabled: false,
        isFocusMode: wallpaperMode === 'muse_overlay' ? false : state.isFocusMode,
        isTransparentWindowEnabled: wallpaperMode === 'muse_overlay',
        overlayLastError: undefined,
        wallpaperMode,
      };
    }),
  toggleDebugPanel: () => {
    if (!import.meta.env.DEV) {
      return;
    }

    set((state) => ({ isDebugPanelOpen: !state.isDebugPanelOpen }));
  },
  setDebugPanelOpen: (open) =>
    set({ isDebugPanelOpen: import.meta.env.DEV ? open : false }),
  toggleFocusMode: () => {
    void exitPlatformNativeWallpaperMode();
    void exitPlatformOverlayMode();
    set((state) => ({
      isDebugPanelOpen: false,
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
