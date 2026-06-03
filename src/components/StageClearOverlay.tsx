import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { StageClearSummary } from '../types/game';

interface StageClearOverlayProps {
  onClose: () => void;
  summary: StageClearSummary;
}

export function StageClearOverlay({ onClose, summary }: StageClearOverlayProps) {
  const stageClearCardRef = useRef<HTMLElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(stageClearCardRef);

  useEffect(() => {
    const timerId = window.setTimeout(() => continueButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div aria-live="polite" className="stage-clear-backdrop" role="presentation">
      <section
        aria-label="Stage clear"
        aria-modal="true"
        className="stage-clear-card panel"
        ref={stageClearCardRef}
        role="dialog"
      >
        <div className="stage-clear-burst" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">MISSION COMPLETE</p>
        <h1>Stage Clear!</h1>
        <p className="stage-clear-stage">{summary.stageName}</p>
        <div className="stage-clear-reward">
          <span>Background Unlocked</span>
          <strong>{summary.rewardBackgroundName}</strong>
        </div>
        <p className="stage-clear-next">
          {summary.nextStageName
            ? `Next mission unlocked: ${summary.nextStageName}`
            : 'All current stages cleared. More worlds can be added later.'}
        </p>
        <button
          className="stage-clear-action"
          onClick={onClose}
          ref={continueButtonRef}
          type="button"
        >
          Continue
        </button>
      </section>
    </div>
  );
}
