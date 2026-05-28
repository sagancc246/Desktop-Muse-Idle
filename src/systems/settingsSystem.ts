import type { AppSettings, EffectsQuality, Language, MotionIntensity } from '../types/game';

const settingsStorageKey = 'desktop-muse-idle-settings';

export const defaultSettings: AppSettings = {
  bgmVolume: 70,
  seVolume: 80,
  language: 'ja',
  effectsQuality: 'medium',
  motionIntensity: 'medium',
  autoSaveEnabled: true,
};

function isVolume(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isLanguage(value: unknown): value is Language {
  return value === 'ja' || value === 'en';
}

function isEffectsQuality(value: unknown): value is EffectsQuality {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isMotionIntensity(value: unknown): value is MotionIntensity {
  return value === 'low' || value === 'medium' || value === 'high';
}

function migrateSettings(value: unknown): AppSettings | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const settings = value as Partial<AppSettings>;

  if (
    !isVolume(settings.bgmVolume) ||
    !isVolume(settings.seVolume) ||
    !isLanguage(settings.language) ||
    !isEffectsQuality(settings.effectsQuality) ||
    typeof settings.autoSaveEnabled !== 'boolean'
  ) {
    return null;
  }

  return {
    bgmVolume: settings.bgmVolume,
    seVolume: settings.seVolume,
    language: settings.language,
    effectsQuality: settings.effectsQuality,
    motionIntensity: isMotionIntensity(settings.motionIntensity)
      ? settings.motionIntensity
      : defaultSettings.motionIntensity,
    autoSaveEnabled: settings.autoSaveEnabled,
  };
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const serialized = window.localStorage.getItem(settingsStorageKey);

    if (!serialized) {
      return defaultSettings;
    }

    const parsed: unknown = JSON.parse(serialized);
    return migrateSettings(parsed) ?? defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  } catch {
    // Settings failure should not stop gameplay.
  }
}
