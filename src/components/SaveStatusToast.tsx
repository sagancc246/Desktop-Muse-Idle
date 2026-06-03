import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export function SaveStatusToast() {
  const saveStatus = useGameStore((state) => state.saveStatus);
  const lastSaveError = useGameStore((state) => state.lastSaveError);
  const lastSaveSource = useGameStore((state) => state.lastSaveSource);
  const clearSaveStatus = useGameStore((state) => state.clearSaveStatus);

  useEffect(() => {
    if (saveStatus === 'idle' || saveStatus === 'saving') {
      return undefined;
    }

    const timerId = window.setTimeout(
      clearSaveStatus,
      saveStatus === 'saved' ? 1_700 : 3_200,
    );
    return () => window.clearTimeout(timerId);
  }, [clearSaveStatus, saveStatus]);

  if (saveStatus === 'idle') {
    return null;
  }

  const label =
    saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Failed';

  return (
    <div
      aria-live="polite"
      className={`save-status-toast ${saveStatus} ${lastSaveSource ?? 'manual'}`}
      role="status"
    >
      <strong>{label}</strong>
      {saveStatus === 'error' && lastSaveError ? <span>{lastSaveError}</span> : null}
    </div>
  );
}
