import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAppStore } from '../store/useAppStore';
import { playStageClearJingle } from '../systems/audioSystem';
import type { BackfillRewardGroup } from '../types/game';
import { RewardCard } from './RewardCard';

interface BackfillRewardsModalProps {
  groups: BackfillRewardGroup[];
  onContinue: () => void;
  onOpenGallery: () => void;
}

export function BackfillRewardsModal({
  groups,
  onContinue,
  onOpenGallery,
}: BackfillRewardsModalProps) {
  const modalRef = useRef<HTMLElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const motionIntensity = useAppStore((state) => state.settings.motionIntensity);
  const seVolume = useAppStore((state) => state.settings.seVolume);

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
  }, [onContinue, seVolume]);

  return (
    <div
      aria-live="polite"
      className={`stage-clear-backdrop${motionIntensity === 'low' ? ' low-motion' : ''}`}
      role="presentation"
    >
      <section
        aria-label="New rewards unlocked"
        aria-modal="true"
        className="backfill-rewards-modal panel"
        ref={modalRef}
        role="dialog"
      >
        <header className="stage-clear-header">
          <p className="eyebrow">REWARD UPDATE</p>
          <h1>NEW REWARDS UNLOCKED!</h1>
          <p>New rewards were added to stages you already cleared.</p>
        </header>
        <div aria-label="Backfill reward groups" className="backfill-reward-groups">
          {groups.map((group) => (
            <section className="backfill-reward-group" key={group.stageId}>
              <h2>{group.stageName} Rewards</h2>
              <div className="stage-clear-reward-grid">
                {group.rewards.map((reward) => (
                  <RewardCard
                    key={reward.claimKey}
                    onOpenGallery={onOpenGallery}
                    reward={reward}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
        <footer className="stage-clear-footer">
          <p>All listed rewards have been added to your save.</p>
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
