import { useEffect, useRef, useState } from 'react';
import { hasSaveData } from '../systems/saveSystem';

interface TitleScreenProps {
  onContinue: () => void;
  onCredits: () => void;
  onGallery: () => void;
  onSettings: () => void;
  onStats: () => void;
  onStart: () => void;
}

export function TitleScreen({
  onContinue,
  onCredits,
  onGallery,
  onSettings,
  onStats,
  onStart,
}: TitleScreenProps) {
  const [quitNotice, setQuitNotice] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const canContinue = hasSaveData();

  useEffect(() => {
    const timerId = window.setTimeout(() => startButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && quitNotice) {
        event.preventDefault();
        setQuitNotice(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quitNotice]);

  return (
    <main className="title-screen">
      <div className="title-decoration title-decoration-left" />
      <div className="title-decoration title-decoration-right" />
      <section className="title-card">
        <p className="eyebrow">DESKTOP MUSE PROJECT</p>
        <h1>Desktop Muse Idle</h1>
        <p className="title-subcopy">Hit the corner. Unlock her world.</p>
        <nav aria-label="Title menu" className="title-menu">
          <button
            className="title-action primary"
            onClick={onStart}
            ref={startButtonRef}
            type="button"
          >
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
          <button className="title-action" onClick={onStats} type="button">
            Stats
          </button>
          <button className="title-action" onClick={onGallery} type="button">
            Gallery
          </button>
          <button className="title-action" onClick={onCredits} type="button">
            Credits
          </button>
          <button
            aria-describedby={quitNotice ? 'quit-notice' : undefined}
            className="title-action"
            onClick={() => setQuitNotice(true)}
            type="button"
          >
            Quit
          </button>
        </nav>
        {quitNotice && (
          <p aria-live="polite" className="quit-notice" id="quit-notice">
            Quit will be available in the Electron build.
          </p>
        )}
      </section>
      <p className="title-version">Prototype Build</p>
    </main>
  );
}
