import type { PlatformAdapter } from './platformAdapter';

const noop = async () => undefined;

export const steamAdapter: PlatformAdapter = {
  platformId: 'steam',
  enterOverlayMode: noop,
  exitOverlayMode: noop,
  setAlwaysOnTop: noop,
  setClickThrough: noop,
  setTransparentWindow: noop,
};
