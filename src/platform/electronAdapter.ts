import type { OverlayStatus, PlatformAdapter } from './platformAdapter';

const bridge = () => window.desktopMusePlatform;
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

export const electronAdapter: PlatformAdapter = {
  platformId: 'electron',
  enterOverlayMode: async () => {
    await bridge()?.enterOverlayMode();
  },
  exitOverlayMode: async () => {
    await bridge()?.exitOverlayMode();
  },
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
};
