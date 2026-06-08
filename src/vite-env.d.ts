/// <reference types="vite/client" />

import type { NativeWallpaperResult, NativeWallpaperStatus, OverlayStatus } from './platform/platformAdapter';

interface DesktopMusePlatformBridge {
  enterOverlayMode: () => Promise<boolean>;
  exitOverlayMode: () => Promise<boolean>;
  enterNativeWallpaperMode: () => Promise<NativeWallpaperResult>;
  exitNativeWallpaperMode: () => Promise<NativeWallpaperResult>;
  getNativeWallpaperStatus: () => Promise<NativeWallpaperStatus>;
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
    desktopMusePlatform?: DesktopMusePlatformBridge;
  }
}

export {};
