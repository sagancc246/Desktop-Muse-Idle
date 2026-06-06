/// <reference types="vite/client" />

import type { OverlayStatus } from './platform/platformAdapter';

interface DesktopMusePlatformBridge {
  enterOverlayMode: () => Promise<boolean>;
  exitOverlayMode: () => Promise<boolean>;
  getOverlayStatus: () => Promise<OverlayStatus>;
  setAlwaysOnTop: (enabled: boolean) => Promise<boolean>;
  setClickThrough: (enabled: boolean) => Promise<boolean>;
  setTransparentWindow: (enabled: boolean) => Promise<boolean>;
  onOverlayExitRequested: (callback: () => void) => () => void;
  onOverlayState: (callback: (state: OverlayStatus) => void) => () => void;
}

declare global {
  interface Window {
    desktopMusePlatform?: DesktopMusePlatformBridge;
  }
}

export {};
