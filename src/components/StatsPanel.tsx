import { useEffect, useMemo, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useAppStore } from '../store/useAppStore';
import { useGameStore } from '../store/useGameStore';

interface StatsPanelProps {
  onBack: () => void;
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 1_000_000 ? 2 : 0,
    notation: value >= 10_000 ? 'compact' : 'standard',
  }).format(Math.floor(value));
}

function formatPlayTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export function StatsPanel({ onBack }: StatsPanelProps) {
  const language = useAppStore((state) => state.settings.language);
  const stats = useGameStore((state) => state.stats);
  const totalCornerHits = useGameStore((state) => state.totalCornerHits);
  const rebootCount = useGameStore((state) => state.rebootCount);
  const unlockedBackgrounds = useGameStore((state) => state.unlockedBackgrounds);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const heading = language === 'ja' ? '統計' : 'Statistics';
  const description =
    language === 'ja'
      ? 'これまで積み上げたプレイ実績と蓄積状況です。'
      : 'A snapshot of your accumulated progress and idle achievements.';
  const items = useMemo(
    () => [
      {
        label: language === 'ja' ? '総壁ヒット数' : 'Total Wall Hits',
        value: formatCompact(stats.totalWallHits),
      },
      {
        label: language === 'ja' ? '総Corner Hit数' : 'Total Corner Hits',
        value: formatCompact(Math.max(stats.totalCornerHits, totalCornerHits)),
      },
      {
        label: language === 'ja' ? '最高到達Stage' : 'Highest Stage Reached',
        value: `Stage ${formatCompact(stats.highestStageReached)}`,
      },
      {
        label: language === 'ja' ? 'Reboot回数' : 'Reboots',
        value: formatCompact(Math.max(stats.rebootCount, rebootCount)),
      },
      {
        label: language === 'ja' ? 'プレイ時間' : 'Play Time',
        value: formatPlayTime(stats.totalPlayTimeMs),
      },
      {
        label: language === 'ja' ? '獲得背景数' : 'Unlocked Backgrounds',
        value: formatCompact(Math.max(stats.unlockedBackgroundCount, unlockedBackgrounds.length)),
      },
      {
        label: language === 'ja' ? '累計獲得Memory' : 'Total Memory Earned',
        value: formatCompact(stats.totalMemoryEarned),
      },
      {
        label: language === 'ja' ? 'Near Corner回数' : 'Near Corners',
        value: formatCompact(stats.totalNearCorners),
      },
      {
        label: language === 'ja' ? 'Jackpot回数' : 'Jackpots',
        value: formatCompact(stats.totalJackpots),
      },
      {
        label: language === 'ja' ? 'Fever突入回数' : 'Fever Activations',
        value: formatCompact(stats.totalFeverActivations),
      },
    ],
    [language, rebootCount, stats, totalCornerHits, unlockedBackgrounds.length],
  );

  useFocusTrap(panelRef, true);

  useEffect(() => {
    const timerId = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
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
        aria-label={heading}
        aria-modal="true"
        className="stats-panel panel"
        ref={panelRef}
        role="dialog"
      >
        <header className="stats-heading">
          <div>
            <p className="eyebrow">PLAYER RECORD</p>
            <h1>{heading}</h1>
            <p>{description}</p>
          </div>
          <button className="screen-back" onClick={onBack} ref={closeButtonRef} type="button">
            {language === 'ja' ? '閉じる' : 'Close'}
          </button>
        </header>
        <div className="stats-grid">
          {items.map((item) => (
            <article className="stats-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
