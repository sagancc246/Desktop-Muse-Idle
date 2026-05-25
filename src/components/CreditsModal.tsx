interface CreditsModalProps {
  onBack: () => void;
}

export function CreditsModal({ onBack }: CreditsModalProps) {
  return (
    <main className="screen-surface title-screen">
      <section aria-label="Credits" className="credits-card panel" role="dialog">
        <p className="eyebrow">CREDITS</p>
        <h1>Desktop Muse Idle</h1>
        <p>Concept and development prototype</p>
        <dl className="credits-list">
          <dt>Engine</dt>
          <dd>React, TypeScript, Vite, PixiJS, Zustand</dd>
          <dt>World</dt>
          <dd>Memory, corner hits, and unlocked rooms</dd>
        </dl>
        <button className="screen-back" onClick={onBack} type="button">
          Title に戻る
        </button>
      </section>
    </main>
  );
}
