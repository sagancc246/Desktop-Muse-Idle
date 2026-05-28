import { useGameStore } from '../store/useGameStore';
import '../styles/neon-background.css';

export function NeonBackground() {
  const currentBackgroundId = useGameStore((state) => state.currentBackgroundId);
  const isActive = currentBackgroundId === 'bg_neon_room';

  return (
    <div className={`neon-background${isActive ? ' is-active' : ''}`} aria-hidden="true">
      <div className="neon-image-layer" />
      <div className="neon-glow-layer" />
      <div className="neon-sweep-layer" />
      <div className="neon-vignette-layer" />
    </div>
  );
}
