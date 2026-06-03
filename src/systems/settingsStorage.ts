import type { WallpaperSettings } from '../types/game';

export const wallpaperSettingsStorageKey = 'desktopMuseIdle.wallpaperSettings';

const legacySettingsStorageKey = 'desktop-muse-idle-settings';

export const defaultWallpaperSettings: WallpaperSettings = {
  alwaysOnTopPreferred: true,
  bgmEnabled: false,
  clickThroughPreferred: false,
  effectsQuality: 'low',
  fps: 30,
  seVolumeScale: 0.4,
  showOverlayHud: false,
  showStageHud: true,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeWallpaperSettings(value: unknown): WallpaperSettings {
  if (!value || typeof value !== 'object') {
    return defaultWallpaperSettings;
  }

  const settings = value as Partial<WallpaperSettings>;
  const seVolumeScale =
    typeof settings.seVolumeScale === 'number' && Number.isFinite(settings.seVolumeScale)
      ? clamp(settings.seVolumeScale, 0, 1)
      : defaultWallpaperSettings.seVolumeScale;

  return {
    alwaysOnTopPreferred:
      typeof settings.alwaysOnTopPreferred === 'boolean'
        ? settings.alwaysOnTopPreferred
        : defaultWallpaperSettings.alwaysOnTopPreferred,
    bgmEnabled:
      typeof settings.bgmEnabled === 'boolean'
        ? settings.bgmEnabled
        : defaultWallpaperSettings.bgmEnabled,
    clickThroughPreferred:
      typeof settings.clickThroughPreferred === 'boolean'
        ? settings.clickThroughPreferred
        : defaultWallpaperSettings.clickThroughPreferred,
    effectsQuality:
      settings.effectsQuality === 'normal' || settings.effectsQuality === 'low'
        ? settings.effectsQuality
        : defaultWallpaperSettings.effectsQuality,
    fps:
      settings.fps === 30 || settings.fps === 60
        ? settings.fps
        : defaultWallpaperSettings.fps,
    seVolumeScale,
    showOverlayHud:
      typeof settings.showOverlayHud === 'boolean'
        ? settings.showOverlayHud
        : defaultWallpaperSettings.showOverlayHud,
    showStageHud:
      typeof settings.showStageHud === 'boolean'
        ? settings.showStageHud
        : defaultWallpaperSettings.showStageHud,
  };
}

function loadLegacyWallpaperSettings(): WallpaperSettings | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const serialized = window.localStorage.getItem(legacySettingsStorageKey);
    if (!serialized) {
      return null;
    }

    const parsed = JSON.parse(serialized) as { wallpaperSettings?: unknown };
    return parsed.wallpaperSettings
      ? normalizeWallpaperSettings(parsed.wallpaperSettings)
      : null;
  } catch {
    return null;
  }
}

export function loadWallpaperSettings(): WallpaperSettings {
  if (typeof window === 'undefined') {
    return defaultWallpaperSettings;
  }

  try {
    const serialized = window.localStorage.getItem(wallpaperSettingsStorageKey);
    if (!serialized) {
      return loadLegacyWallpaperSettings() ?? defaultWallpaperSettings;
    }

    return normalizeWallpaperSettings(JSON.parse(serialized));
  } catch {
    return defaultWallpaperSettings;
  }
}

export function saveWallpaperSettings(settings: WallpaperSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      wallpaperSettingsStorageKey,
      JSON.stringify(normalizeWallpaperSettings(settings)),
    );
  } catch {
    // Wallpaper settings should never interrupt gameplay.
  }
}

export function resetWallpaperSettings(): WallpaperSettings {
  saveWallpaperSettings(defaultWallpaperSettings);
  return defaultWallpaperSettings;
}
