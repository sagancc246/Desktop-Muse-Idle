import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { OfflineRewardSummary } from '../types/game';

interface OfflineRewardModalProps {
  onClose: () => void;
  reward: OfflineRewardSummary;
}

function formatElapsedTime(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${Math.max(1, minutes)}m`;
}

export function OfflineRewardModal({ onClose, reward }: OfflineRewardModalProps) {
  const rewardCardRef = useRef<HTMLElement>(null);
  const collectButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(rewardCardRef);

  useEffect(() => {
    const timerId = window.setTimeout(() => collectButtonRef.current?.focus(), 0);
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
    <div className="offline-reward-backdrop" role="presentation">
      <section
        aria-label="Offline reward"
        aria-modal="true"
        className="offline-reward-card panel"
        ref={rewardCardRef}
        role="dialog"
      >
        <p className="eyebrow">PASSIVE CACHE</p>
        <h2>Welcome Back</h2>
        <p className="offline-reward-copy">
          Cached for {formatElapsedTime(reward.elapsedSeconds)}
          {reward.wasCapped ? ' (8h cap reached)' : ''}
        </p>
        <strong className="offline-reward-value">
          +{reward.memoryEarned.toLocaleString()} Memory
        </strong>
        {reward.multiplier > 1 && (
          <p className="offline-reward-bonus">Passive Cache bonus x{reward.multiplier.toFixed(2)}</p>
        )}
        <button
          className="offline-reward-action"
          onClick={onClose}
          ref={collectButtonRef}
          type="button"
        >
          Collect
        </button>
      </section>
    </div>
  );
}
