import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAppStore } from '../store/useAppStore';
import { useGameStore } from '../store/useGameStore';
import { localize } from '../systems/localization';
import { isElectronOverlayAvailable } from '../platform/platform';
import type {
  EffectsQuality,
  Language,
  MotionIntensity,
  WallpaperMode,
  WallpaperSettings,
} from '../types/game';

interface SettingsModalProps {
  onBack: () => void;
  onStats: () => void;
}

export function SettingsModal({ onBack, onStats }: SettingsModalProps) {
  const settings = useAppStore((state) => state.settings);
  const wallpaperMode = useAppStore((state) => state.wallpaperMode);
  const wallpaperSettings = useAppStore((state) => state.wallpaperSettings);
  const isAlwaysOnTopEnabled = useAppStore((state) => state.isAlwaysOnTopEnabled);
  const isClickThroughEnabled = useAppStore((state) => state.isClickThroughEnabled);
  const isTransparentWindowEnabled = useAppStore(
    (state) => state.isTransparentWindowEnabled,
  );
  const setWallpaperMode = useAppStore((state) => state.setWallpaperMode);
  const setWallpaperSettings = useAppStore((state) => state.setWallpaperSettings);
  const setAlwaysOnTopEnabled = useAppStore((state) => state.setAlwaysOnTopEnabled);
  const setClickThroughEnabled = useAppStore((state) => state.setClickThroughEnabled);
  const setTransparentWindowEnabled = useAppStore(
    (state) => state.setTransparentWindowEnabled,
  );
  const updateSettings = useAppStore((state) => state.updateSettings);
  const replayTutorial = useAppStore((state) => state.replayTutorial);
  const resetSaveData = useGameStore((state) => state.resetSaveData);
  const manualSave = useGameStore((state) => state.manualSave);
  const saveStatus = useGameStore((state) => state.saveStatus);
  const lastSavedAt = useGameStore((state) => state.lastSavedAt);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetDone, setShowResetDone] = useState(false);
  const settingsPanelRef = useRef<HTMLElement>(null);
  const resetDialogRef = useRef<HTMLElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const cancelResetButtonRef = useRef<HTMLButtonElement>(null);

  const confirmReset = () => {
    resetSaveData();
    setShowResetConfirm(false);
    setShowResetDone(true);
  };

  const lastSavedLabel = lastSavedAt
    ? new Intl.DateTimeFormat(settings.language === 'ja' ? 'ja-JP' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(lastSavedAt))
    : 'Not saved yet';

  useFocusTrap(settingsPanelRef, !showResetConfirm);
  useFocusTrap(resetDialogRef, showResetConfirm);

  useEffect(() => {
    const timerId = window.setTimeout(() => backButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (!showResetConfirm) {
      return undefined;
    }

    const timerId = window.setTimeout(() => cancelResetButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(timerId);
  }, [showResetConfirm]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      if (showResetConfirm) {
        setShowResetConfirm(false);
        return;
      }

      onBack();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, showResetConfirm]);

  return (
    <main className="screen-surface title-screen">
      <section aria-label="Settings" className="settings-modal panel" ref={settingsPanelRef}>
        <header className="settings-heading">
          <div>
            <p className="eyebrow">SETTINGS</p>
            <h1>Settings</h1>
            <p>{localize(settings.language, 'settingsDescription')}</p>
          </div>
        </header>
        <div className="settings-controls">
          <label className="setting-row">
            <span>BGM Volume</span>
            <div className="volume-control">
              <input
                aria-label="BGM Volume"
                max={100}
                min={0}
                onChange={(event) => updateSettings({ bgmVolume: Number(event.target.value) })}
                type="range"
                value={settings.bgmVolume}
              />
              <strong>{settings.bgmVolume}</strong>
            </div>
          </label>
          <label className="setting-row">
            <span>SE Volume</span>
            <div className="volume-control">
              <input
                aria-label="SE Volume"
                max={100}
                min={0}
                onChange={(event) => updateSettings({ seVolume: Number(event.target.value) })}
                type="range"
                value={settings.seVolume}
              />
              <strong>{settings.seVolume}</strong>
            </div>
          </label>
          <label className="setting-row">
            <span>Language</span>
            <select
              aria-label="Language"
              onChange={(event) => updateSettings({ language: event.target.value as Language })}
              value={settings.language}
            >
              <option value="ja">ja</option>
              <option value="en">en</option>
            </select>
          </label>
          <label className="setting-row">
            <span>Effects Quality</span>
            <select
              aria-label="Effects Quality"
              onChange={(event) =>
                updateSettings({ effectsQuality: event.target.value as EffectsQuality })
              }
              value={settings.effectsQuality}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label className="setting-row">
            <span>Motion Intensity</span>
            <select
              aria-label="Motion Intensity"
              onChange={(event) =>
                updateSettings({ motionIntensity: event.target.value as MotionIntensity })
              }
              value={settings.motionIntensity}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <div className="setting-row toggle-row">
            <span>Auto Save</span>
            <button
              aria-label="Auto Save"
              aria-pressed={settings.autoSaveEnabled}
              className={`setting-toggle${settings.autoSaveEnabled ? ' enabled' : ''}`}
              onClick={() => updateSettings({ autoSaveEnabled: !settings.autoSaveEnabled })}
              type="button"
            >
              {settings.autoSaveEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <label className="setting-row">
            <span>Wallpaper Mode</span>
            <select
              aria-label="Wallpaper Mode"
              onChange={(event) => setWallpaperMode(event.target.value as WallpaperMode)}
              value={wallpaperMode}
            >
              <option value="off">Off</option>
              <option value="stage">Wallpaper Stage</option>
              <option value="muse_overlay">Muse Overlay</option>
            </select>
          </label>
          <div className="wallpaper-settings-group">
            <div className="wallpaper-settings-heading">
              <span>Wallpaper Settings</span>
              <small>Used only in Wallpaper Stage / Muse Overlay</small>
            </div>
            <label className="setting-row compact">
              <span>FPS</span>
              <select
                aria-label="Wallpaper FPS"
                onChange={(event) =>
                  setWallpaperSettings({
                    fps: Number(event.target.value) as WallpaperSettings['fps'],
                  })
                }
                value={wallpaperSettings.fps}
              >
                <option value={30}>30</option>
                <option value={60}>60</option>
              </select>
            </label>
            <label className="setting-row compact">
              <span>Effects</span>
              <select
                aria-label="Wallpaper Effects Quality"
                onChange={(event) =>
                  setWallpaperSettings({
                    effectsQuality: event.target
                      .value as WallpaperSettings['effectsQuality'],
                  })
                }
                value={wallpaperSettings.effectsQuality}
              >
                <option value="low">low</option>
                <option value="normal">normal</option>
              </select>
            </label>
            <div className="setting-row compact toggle-row">
              <span>Wallpaper BGM</span>
              <button
                aria-label="Wallpaper BGM"
                aria-pressed={wallpaperSettings.bgmEnabled}
                className={`setting-toggle${wallpaperSettings.bgmEnabled ? ' enabled' : ''}`}
                onClick={() =>
                  setWallpaperSettings({ bgmEnabled: !wallpaperSettings.bgmEnabled })
                }
                type="button"
              >
                {wallpaperSettings.bgmEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <label className="setting-row compact">
              <span>Wallpaper SE Scale</span>
              <div className="volume-control">
                <input
                  aria-label="Wallpaper SE Scale"
                  max={100}
                  min={0}
                  onChange={(event) =>
                    setWallpaperSettings({
                      seVolumeScale: Number(event.target.value) / 100,
                    })
                  }
                  type="range"
                  value={Math.round(wallpaperSettings.seVolumeScale * 100)}
                />
                <strong>{Math.round(wallpaperSettings.seVolumeScale * 100)}</strong>
              </div>
            </label>
            <div className="setting-row compact toggle-row">
              <span>Stage HUD</span>
              <button
                aria-label="Stage HUD"
                aria-pressed={wallpaperSettings.showStageHud}
                className={`setting-toggle${wallpaperSettings.showStageHud ? ' enabled' : ''}`}
                onClick={() =>
                  setWallpaperSettings({
                    showStageHud: !wallpaperSettings.showStageHud,
                  })
                }
                type="button"
              >
                {wallpaperSettings.showStageHud ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="setting-row compact toggle-row">
              <span>Overlay HUD</span>
              <button
                aria-label="Overlay HUD"
                aria-pressed={wallpaperSettings.showOverlayHud}
                className={`setting-toggle${wallpaperSettings.showOverlayHud ? ' enabled' : ''}`}
                onClick={() =>
                  setWallpaperSettings({
                    showOverlayHud: !wallpaperSettings.showOverlayHud,
                  })
                }
                type="button"
              >
                {wallpaperSettings.showOverlayHud ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          <div className="setting-row toggle-row platform-placeholder-row">
            <span>Always on Top</span>
            <button
              aria-label="Always on Top"
              aria-pressed={isAlwaysOnTopEnabled}
              className={`setting-toggle${isAlwaysOnTopEnabled ? ' enabled' : ''}`}
              onClick={() => setAlwaysOnTopEnabled(!isAlwaysOnTopEnabled)}
              type="button"
            >
              {isAlwaysOnTopEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="setting-row toggle-row platform-placeholder-row">
            <span>Click Through</span>
            <button
              aria-label="Click Through"
              aria-pressed={isClickThroughEnabled}
              className={`setting-toggle${isClickThroughEnabled ? ' enabled' : ''}`}
              onClick={() => setClickThroughEnabled(!isClickThroughEnabled)}
              type="button"
            >
              {isClickThroughEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="setting-row toggle-row platform-placeholder-row">
            <span>Transparent Window</span>
            <button
              aria-label="Transparent Window"
              aria-pressed={isTransparentWindowEnabled}
              className={`setting-toggle${isTransparentWindowEnabled ? ' enabled' : ''}`}
              disabled
              onClick={() => setTransparentWindowEnabled(!isTransparentWindowEnabled)}
              type="button"
            >
              {isTransparentWindowEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="settings-help">
            {isElectronOverlayAvailable()
              ? 'Electron Overlay: transparency is automatic in Muse Overlay. Click Through can also be toggled with Ctrl + Shift + M.'
              : 'Web Preview: Electron window controls are unavailable and remain safe no-ops.'}
          </p>
          <div className="setting-row toggle-row">
            <span>{localize(settings.language, 'showTutorial')}</span>
            <button
              aria-describedby="show-tutorial-help"
              aria-label={localize(settings.language, 'showTutorial')}
              className="setting-toggle"
              onClick={replayTutorial}
              type="button"
            >
              {localize(settings.language, 'open')}
            </button>
          </div>
          <p className="settings-help" id="show-tutorial-help">
            {localize(settings.language, 'showTutorialHelp')}
          </p>
        </div>
        <div className="settings-actions">
          <div className="save-settings-group">
            <button
              className="screen-back manual-save-action"
              disabled={saveStatus === 'saving'}
              onClick={manualSave}
              type="button"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Manual Save'}
            </button>
            <span>Last Saved: {lastSavedLabel}</span>
          </div>
          <button className="danger-action" onClick={() => setShowResetConfirm(true)} type="button">
            Reset Save Data
          </button>
          <button className="screen-back" onClick={onStats} type="button">
            Stats
          </button>
          <button className="screen-back" onClick={onBack} ref={backButtonRef} type="button">
            {localize(settings.language, 'back')}
          </button>
        </div>
        {showResetDone && <p className="settings-notice">{localize(settings.language, 'resetDone')}</p>}
      </section>
      {showResetConfirm && (
        <div className="confirm-backdrop">
          <section
            aria-label="Reset Save Data confirmation"
            aria-modal="true"
            className="confirm-dialog panel"
            ref={resetDialogRef}
            role="dialog"
          >
            <h2>Reset Save Data</h2>
            <p>{localize(settings.language, 'resetConfirm')}</p>
            <div>
              <button
                className="modal-close"
                onClick={() => setShowResetConfirm(false)}
                ref={cancelResetButtonRef}
                type="button"
              >
                {localize(settings.language, 'cancel')}
              </button>
              <button className="danger-action" onClick={confirmReset} type="button">
                {localize(settings.language, 'confirmReset')}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
