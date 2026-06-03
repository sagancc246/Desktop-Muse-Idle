import { useGameStore } from '../store/useGameStore';
import type { CornerHitPosition } from '../types/game';
import '../styles/pinball-background.css';

interface PinballBackgroundProps {
  cornerHit: CornerHitPosition | null;
  focusMode: boolean;
}

export function PinballBackground({ cornerHit, focusMode }: PinballBackgroundProps) {
  const currentBackgroundId = useGameStore((state) => state.currentBackgroundId);
  const isActive = currentBackgroundId === 'bg_pinball_neon';
  const cornerHitClass = cornerHit?.replace('_', '-');

  return (
    <div
      aria-hidden="true"
      className={`pinball-background${isActive ? ' is-active' : ''}${
        focusMode ? ' is-focus' : ''
      }`}
      data-corner-hit={cornerHitClass ?? undefined}
    >
      <div className="pinball-image-layer" />
      <div className="pinball-neon-layer" />
      <div className="pinball-scanline-layer" />
      <div className="pinball-floor-reflection-layer" />
      <div className="pinball-hud-dim-layer" />
      <div className="pinball-corner-flash top-left" />
      <div className="pinball-corner-flash top-right" />
      <div className="pinball-corner-flash bottom-left" />
      <div className="pinball-corner-flash bottom-right" />
    </div>
  );
}
