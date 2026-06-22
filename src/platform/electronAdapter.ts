import type { NativeWallpaperStatus, OverlayStatus, PlatformAdapter } from './platformAdapter';

const bridge = () => window.desktopMusePlatform;
const appBridge = () => window.desktopMuse;
const fallbackOverlayStatus: OverlayStatus = {
  active: false,
  alwaysOnTop: false,
  clickThrough: false,
  transparent: false,
  overlayActive: false,
  alwaysOnTopEnabled: false,
  clickThroughEnabled: false,
  transparentEnabled: false,
  lastError: 'Electron platform bridge is unavailable.',
};
const fallbackNativeWallpaperStatus: NativeWallpaperStatus = {
  active: false,
  attached: false,
  backend: 'none',
  fallbackActive: false,
  helperAvailable: false,
  lastError: 'Electron platform bridge is unavailable.',
  nativeAttached: false,
  supported: false,
};

export const electronAdapter: PlatformAdapter = {
  platformId: 'electron',
  quitApp: async () => {
    await (appBridge()?.quitApp() ?? bridge()?.quitApp?.());
  },
  getDisplayMode: async () =>
    (await (appBridge()?.getDisplayMode() ?? bridge()?.getDisplayMode?.())) ?? 'windowed',
  minimizeWindow: async () => {
    await (appBridge()?.minimizeWindow() ?? bridge()?.minimizeWindow?.());
  },
  setDisplayMode: async (mode) =>
    (await (appBridge()?.setDisplayMode(mode) ?? bridge()?.setDisplayMode?.(mode))) ?? mode,
  toggleFullscreen: async () =>
    (await (appBridge()?.toggleFullscreen() ?? bridge()?.toggleFullscreen?.())) ?? 'windowed',
  enterOverlayMode: async () => {
    await bridge()?.enterOverlayMode();
  },
  exitOverlayMode: async () => {
    await bridge()?.exitOverlayMode();
  },
  enterNativeWallpaperMode: async () =>
    bridge()?.enterNativeWallpaperMode() ?? {
      ok: false,
      mode: 'unsupported',
      message: 'Electron platform bridge is unavailable.',
    },
  exitNativeWallpaperMode: async () =>
    bridge()?.exitNativeWallpaperMode() ?? {
      ok: true,
      mode: 'fallback_stage',
    },
  minimizeNativeWallpaperControlView: async () =>
    bridge()?.minimizeNativeWallpaperControlView?.() ?? {
      ok: false,
      reason: 'Electron platform bridge is unavailable.',
    },
  getNativeWallpaperStatus: async () =>
    bridge()?.getNativeWallpaperStatus() ?? fallbackNativeWallpaperStatus,
  getOverlayStatus: async () => bridge()?.getOverlayStatus() ?? fallbackOverlayStatus,
  setAlwaysOnTop: async (enabled) => {
    await bridge()?.setAlwaysOnTop(enabled);
  },
  setClickThrough: async (enabled) => {
    await bridge()?.setClickThrough(enabled);
  },
  setTransparentWindow: async (enabled) => {
    await bridge()?.setTransparentWindow(enabled);
  },
  onOverlayExitRequested: (callback) => bridge()?.onOverlayExitRequested(callback) ?? (() => undefined),
  onOverlayState: (callback: (state: OverlayStatus) => void) =>
    bridge()?.onOverlayState(callback) ?? (() => undefined),
  onNativeWallpaperStatus: (callback: (state: NativeWallpaperStatus) => void) =>
    bridge()?.onNativeWallpaperStatus(callback) ?? (() => undefined),
};
