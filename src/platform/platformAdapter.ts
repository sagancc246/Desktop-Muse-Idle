export interface PlatformAdapter {
  readonly platformId: 'local' | 'steam';
  enterOverlayMode?: () => Promise<void>;
  exitOverlayMode?: () => Promise<void>;
  setAlwaysOnTop?: (enabled: boolean) => Promise<void>;
  setClickThrough?: (enabled: boolean) => Promise<void>;
  setTransparentWindow?: (enabled: boolean) => Promise<void>;
}
