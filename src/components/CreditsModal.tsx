import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface CreditsModalProps {
  onBack: () => void;
}

export function CreditsModal({ onBack }: CreditsModalProps) {
  const creditsCardRef = useRef<HTMLElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(creditsCardRef);

  useEffect(() => {
    const timerId = window.setTimeout(() => backButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBack]);

  return (
    <main className="screen-surface title-screen">
      <section
        aria-label="Credits"
        aria-modal="true"
        className="credits-card panel"
        ref={creditsCardRef}
        role="dialog"
      >
        <p className="eyebrow">CREDITS</p>
        <h1>Desktop Muse Idle</h1>
        <p>Concept and development prototype</p>
        <dl className="credits-list">
          <dt>Engine</dt>
          <dd>React, TypeScript, Vite, PixiJS, Zustand</dd>
          <dt>World</dt>
          <dd>Memory, corner hits, and unlocked rooms</dd>
        </dl>
        <button className="screen-back" onClick={onBack} ref={backButtonRef} type="button">
          Back to Title
        </button>
      </section>
    </main>
  );
}
