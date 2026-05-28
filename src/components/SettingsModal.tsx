import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useGameStore } from '../store/useGameStore';
import { localize } from '../systems/localization';
import type { EffectsQuality, Language, MotionIntensity } from '../types/game';

interface SettingsModalProps {
  onBack: () => void;
}

export function SettingsModal({ onBack }: SettingsModalProps) {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const resetSaveData = useGameStore((state) => state.resetSaveData);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetDone, setShowResetDone] = useState(false);

  const confirmReset = () => {
    resetSaveData();
    setShowResetConfirm(false);
    setShowResetDone(true);
  };

  return (
    <main className="screen-surface title-screen">
      <section aria-label="Settings" className="settings-modal panel">
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
          <label className="setting-row toggle-row">
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
          </label>
        </div>
        <div className="settings-actions">
          <button className="danger-action" onClick={() => setShowResetConfirm(true)} type="button">
            Reset Save Data
          </button>
          <button className="screen-back" onClick={onBack} type="button">
            {localize(settings.language, 'back')}
          </button>
        </div>
        {showResetDone && <p className="settings-notice">{localize(settings.language, 'resetDone')}</p>}
      </section>
      {showResetConfirm && (
        <div className="confirm-backdrop">
          <section aria-label="Reset Save Data confirmation" className="confirm-dialog panel" role="dialog">
            <h2>Reset Save Data</h2>
            <p>{localize(settings.language, 'resetConfirm')}</p>
            <div>
              <button className="modal-close" onClick={() => setShowResetConfirm(false)} type="button">
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
