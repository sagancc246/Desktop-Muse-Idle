export function DialoguePanel() {
  return (
    <footer className="dialogue-panel panel">
      <div className="dialogue-heading">
        <p className="eyebrow">DIALOGUE</p>
        <h2>Transmission Log</h2>
      </div>
      <p className="dialogue-copy">
        Conversation events, notifications, and Reboot controls will live here.
      </p>
      <button className="placeholder-action" disabled type="button">
        Reboot unavailable
      </button>
    </footer>
  );
}
