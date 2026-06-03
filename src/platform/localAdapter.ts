import type { PlatformAdapter } from './platformAdapter';

const noop = async () => undefined;

export const localAdapter: PlatformAdapter = {
  platformId: 'local',
  enterOverlayMode: noop,
  exitOverlayMode: noop,
  setAlwaysOnTop: noop,
  setClickThrough: noop,
  setTransparentWindow: noop,
};
