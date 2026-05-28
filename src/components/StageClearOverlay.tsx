import type { StageClearSummary } from '../types/game';

interface StageClearOverlayProps {
  onClose: () => void;
  summary: StageClearSummary;
}

export function StageClearOverlay({ onClose, summary }: StageClearOverlayProps) {
  return (
    <div aria-live="polite" className="stage-clear-backdrop" role="status">
      <div className="stage-clear-card panel">
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
        <button className="stage-clear-action" onClick={onClose} type="button">
          Continue
        </button>
      </div>
    </div>
  );
}
