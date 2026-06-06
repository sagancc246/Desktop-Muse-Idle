export interface OverlayStatus {
  active: boolean;
  alwaysOnTop: boolean;
  clickThrough: boolean;
  transparent: boolean;
  overlayActive: boolean;
  alwaysOnTopEnabled: boolean;
  clickThroughEnabled: boolean;
  transparentEnabled: boolean;
  lastError?: string;
}

export interface PlatformAdapter {
  readonly platformId: 'electron' | 'local' | 'steam';
  enterOverlayMode?: () => Promise<void>;
  exitOverlayMode?: () => Promise<void>;
  getOverlayStatus?: () => Promise<OverlayStatus>;
  setAlwaysOnTop?: (enabled: boolean) => Promise<void>;
  setClickThrough?: (enabled: boolean) => Promise<void>;
  setTransparentWindow?: (enabled: boolean) => Promise<void>;
  onOverlayExitRequested?: (callback: () => void) => () => void;
  onOverlayState?: (callback: (state: OverlayStatus) => void) => () => void;
}
