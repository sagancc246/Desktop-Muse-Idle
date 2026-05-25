import type { AppSettings, EffectsQuality, Language } from '../types/game';

const settingsStorageKey = 'desktop-muse-idle-settings';

export const defaultSettings: AppSettings = {
  bgmVolume: 70,
  seVolume: 80,
  language: 'ja',
  effectsQuality: 'medium',
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

function isSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const settings = value as Partial<AppSettings>;

  return (
    isVolume(settings.bgmVolume) &&
    isVolume(settings.seVolume) &&
    isLanguage(settings.language) &&
    isEffectsQuality(settings.effectsQuality) &&
    typeof settings.autoSaveEnabled === 'boolean'
  );
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
    return isSettings(parsed) ? parsed : defaultSettings;
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
