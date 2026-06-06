import type { PlatformAdapter } from './platformAdapter';

const noop = async () => undefined;
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

export const steamAdapter: PlatformAdapter = {
  platformId: 'steam',
  enterOverlayMode: noop,
  exitOverlayMode: noop,
  getOverlayStatus,
  setAlwaysOnTop: noop,
  setClickThrough: noop,
  setTransparentWindow: noop,
};
