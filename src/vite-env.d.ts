/// <reference types="vite/client" />

import type { NativeWallpaperResult, NativeWallpaperStatus, OverlayStatus } from './platform/platformAdapter';
import type { WindowDisplayMode } from './types/game';

interface DesktopMuseBridge {
  getDisplayMode: () => Promise<WindowDisplayMode>;
  minimizeWindow: () => Promise<void>;
  quitApp: () => Promise<void>;
  setDisplayMode: (mode: WindowDisplayMode) => Promise<WindowDisplayMode>;
  toggleFullscreen: () => Promise<WindowDisplayMode>;
}

interface DesktopMusePlatformBridge {
  getDisplayMode?: () => Promise<WindowDisplayMode>;
  minimizeWindow?: () => Promise<void>;
  quitApp?: () => Promise<void>;
  setDisplayMode?: (mode: WindowDisplayMode) => Promise<WindowDisplayMode>;
  toggleFullscreen?: () => Promise<WindowDisplayMode>;
  enterOverlayMode: () => Promise<boolean>;
  exitOverlayMode: () => Promise<boolean>;
  enterNativeWallpaperMode: () => Promise<NativeWallpaperResult>;
  exitNativeWallpaperMode: () => Promise<NativeWallpaperResult>;
  minimizeNativeWallpaperControlView?: () => Promise<{ ok: boolean; minimized?: boolean; reason?: string }>;
  getNativeWallpaperStatus: () => Promise<NativeWallpaperStatus>;
  inspectNativeWallpaper?: () => Promise<NativeWallpaperStatus>;
  getOverlayStatus: () => Promise<OverlayStatus>;
  setAlwaysOnTop: (enabled: boolean) => Promise<boolean>;
  setClickThrough: (enabled: boolean) => Promise<boolean>;
  setTransparentWindow: (enabled: boolean) => Promise<boolean>;
  onOverlayExitRequested: (callback: () => void) => () => void;
  onOverlayState: (callback: (state: OverlayStatus) => void) => () => void;
  onNativeWallpaperStatus: (callback: (state: NativeWallpaperStatus) => void) => () => void;
}

declare global {
  interface Window {
    desktopMuse?: DesktopMuseBridge;
    desktopMusePlatform?: DesktopMusePlatformBridge;
  }
}

export {};
