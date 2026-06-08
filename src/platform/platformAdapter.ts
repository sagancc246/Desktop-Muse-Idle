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

export type NativeWallpaperBackend =
  | 'fallback_stage'
  | 'none'
  | 'web_preview'
  | 'electron_window'
  | 'native_desktop_wallpaper';

export interface NativeWallpaperResult {
  ok: boolean;
  mode: 'native_desktop_wallpaper' | 'fallback_stage' | 'unsupported';
  message?: string;
}

export interface NativeWallpaperStatus {
  active: boolean;
  attached?: boolean;
  backend: NativeWallpaperBackend;
  fallbackActive?: boolean;
  helperAvailable?: boolean;
  helperLastResult?: string;
  helperPath?: string | null;
  helperVersion?: string;
  lastError?: string;
  nativeAttached?: boolean;
  preferredWorkerWHwnd?: string | null;
  previousParentHwnd?: string;
  progmanFound?: boolean;
  reason?: string;
  setParentSucceeded?: boolean;
  setWindowPosSucceeded?: boolean;
  shellDllDefViewFound?: boolean;
  supported: boolean;
  workerWHwnd?: string;
  workerWCandidateCount?: number;
  warnings?: string[];
  dryRun?: boolean;
}

export interface PlatformAdapter {
  readonly platformId: 'electron' | 'local' | 'steam';
  enterOverlayMode?: () => Promise<void>;
  exitOverlayMode?: () => Promise<void>;
  enterNativeWallpaperMode?: () => Promise<NativeWallpaperResult>;
  exitNativeWallpaperMode?: () => Promise<NativeWallpaperResult>;
  getNativeWallpaperStatus?: () => Promise<NativeWallpaperStatus>;
  getOverlayStatus?: () => Promise<OverlayStatus>;
  setAlwaysOnTop?: (enabled: boolean) => Promise<void>;
  setClickThrough?: (enabled: boolean) => Promise<void>;
  setTransparentWindow?: (enabled: boolean) => Promise<void>;
  onOverlayExitRequested?: (callback: () => void) => () => void;
  onOverlayState?: (callback: (state: OverlayStatus) => void) => () => void;
  onNativeWallpaperStatus?: (callback: (state: NativeWallpaperStatus) => void) => () => void;
}
