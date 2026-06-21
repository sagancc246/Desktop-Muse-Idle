import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAppStore } from '../store/useAppStore';
import { playStageClearJingle } from '../systems/audioSystem';
import type { StageClearSummary } from '../types/game';
import { RewardCard } from './RewardCard';

interface StageClearModalProps {
  onContinue: () => void;
  onOpenGallery: () => void;
  summary: StageClearSummary;
}

export function StageClearModal({ onContinue, onOpenGallery, summary }: StageClearModalProps) {
  const modalRef = useRef<HTMLElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const language = useAppStore((state) => state.settings.language);
  const motionIntensity = useAppStore((state) => state.settings.motionIntensity);
  const seVolume = useAppStore((state) => state.settings.seVolume);
  const clearConditionCopy =
    summary.clearConditionType === 'enemy_defeats'
      ? language === 'ja'
        ? `\u6483\u7834\u6570: ${summary.progressCurrent.toLocaleString()} / ${summary.progressTarget.toLocaleString()}`
        : `Memory Bugs Defeated: ${summary.progressCurrent.toLocaleString()} / ${summary.progressTarget.toLocaleString()}`
      : null;

  useFocusTrap(modalRef);

  useEffect(() => {
    playStageClearJingle(seVolume);
    const timerId = window.setTimeout(() => continueButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onContinue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onContinue, seVolume, summary.stageId]);

  return (
    <div
      aria-live="polite"
      className={`stage-clear-backdrop${motionIntensity === 'low' ? ' low-motion' : ''}`}
      role="presentation"
    >
      <div className="stage-clear-flash" aria-hidden="true" />
      <div className="stage-clear-sparkles" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <section
        aria-label="Stage clear rewards"
        aria-modal="true"
        className="stage-clear-modal panel"
        ref={modalRef}
        role="dialog"
      >
        <header className="stage-clear-header">
          <p className="eyebrow">MISSION COMPLETE</p>
          <h1>STAGE CLEAR!</h1>
          <p className="stage-clear-stage-name">{summary.stageName}</p>
          {clearConditionCopy ? (
            <p className="stage-clear-condition">{clearConditionCopy}</p>
          ) : null}
        </header>
        <div className="stage-clear-reward-grid">
          {summary.rewards.map((reward) => (
            <RewardCard
              key={reward.claimKey}
              onOpenGallery={onOpenGallery}
              reward={reward}
            />
          ))}
        </div>
        <footer className="stage-clear-footer">
          <p>
            {summary.nextStageName
              ? `Next mission unlocked: ${summary.nextStageName}`
              : 'All current stages cleared. More worlds can be added later.'}
          </p>
          <button
            className="stage-clear-action"
            onClick={onContinue}
            ref={continueButtonRef}
            type="button"
          >
            Continue
          </button>
        </footer>
      </section>
    </div>
  );
}
