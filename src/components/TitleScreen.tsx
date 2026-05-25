import { useState } from 'react';
import { hasSaveData } from '../systems/saveSystem';

interface TitleScreenProps {
  onContinue: () => void;
  onCredits: () => void;
  onGallery: () => void;
  onSettings: () => void;
  onStart: () => void;
}

export function TitleScreen({
  onContinue,
  onCredits,
  onGallery,
  onSettings,
  onStart,
}: TitleScreenProps) {
  const [quitNotice, setQuitNotice] = useState(false);
  const canContinue = hasSaveData();

  return (
    <main className="title-screen">
      <div className="title-decoration title-decoration-left" />
      <div className="title-decoration title-decoration-right" />
      <section className="title-card">
        <p className="eyebrow">DESKTOP MUSE PROJECT</p>
        <h1>Desktop Muse Idle</h1>
        <p className="title-subcopy">Hit the corner. Unlock her world.</p>
        <nav aria-label="Title menu" className="title-menu">
          <button className="title-action primary" onClick={onStart} type="button">
            Start
          </button>
          <button
            className="title-action"
            disabled={!canContinue}
            onClick={onContinue}
            type="button"
          >
            Continue
          </button>
          <button className="title-action" onClick={onSettings} type="button">
            Settings
          </button>
          <button className="title-action" onClick={onGallery} type="button">
            Gallery
          </button>
          <button className="title-action" onClick={onCredits} type="button">
            Credits
          </button>
          <button className="title-action" onClick={() => setQuitNotice(true)} type="button">
            Quit
          </button>
        </nav>
        {quitNotice && <p className="quit-notice">Electron版で有効予定</p>}
      </section>
      <p className="title-version">Prototype Build</p>
    </main>
  );
}
