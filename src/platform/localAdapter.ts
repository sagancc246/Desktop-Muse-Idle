import type { PlatformAdapter } from './platformAdapter';

const noop = async () => undefined;
const getDisplayMode = async () => 'windowed' as const;
const setDisplayMode = async (mode: 'windowed' | 'fullscreen') => mode;
const toggleFullscreen = async () => 'windowed' as const;
const unsupportedNativeWallpaper = async () => ({
  ok: false,
  mode: 'unsupported' as const,
  message: 'Native wallpaper is only available in the Windows Electron build.',
});
const getNativeWallpaperStatus = async () => ({
  active: false,
  attached: false,
  backend: 'web_preview' as const,
  fallbackActive: true,
  helperAvailable: false,
  lastError: 'Native wallpaper is only available in the Windows Electron build.',
  nativeAttached: false,
  supported: false,
});
const getOverlayStatus = async () => ({
  active: false,
  alwaysOnTop: false,
  clickThrough: false,
  transparent: false,
  overlayActive: false,
  alwaysOnTopEnabled: false,
  clickThroughEnabled: false,
  transparentEnabled: false,
});

export const localAdapter: PlatformAdapter = {
  platformId: 'local',
  quitApp: noop,
  getDisplayMode,
  minimizeWindow: noop,
  setDisplayMode,
  toggleFullscreen,
  enterOverlayMode: noop,
  exitOverlayMode: noop,
  enterNativeWallpaperMode: unsupportedNativeWallpaper,
  exitNativeWallpaperMode: unsupportedNativeWallpaper,
  getNativeWallpaperStatus,
  getOverlayStatus,
  setAlwaysOnTop: noop,
  setClickThrough: noop,
  setTransparentWindow: noop,
};
