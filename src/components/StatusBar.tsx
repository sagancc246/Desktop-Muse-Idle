import { formatMemory } from '../data/balance';
import { useGameStore } from '../store/useGameStore';

export function StatusBar() {
  const memory = useGameStore((state) => state.memory);
  const memoryPerSecond = useGameStore((state) => state.memoryPerSecond);
  const cornerHits = useGameStore((state) => state.cornerHits);

  return (
    <header className="status-bar">
      <div className="brand">
        <p className="eyebrow">DESKTOP MUSE</p>
        <h1>Idle Observatory</h1>
      </div>
      <div className="metrics" aria-label="Game metrics">
        <div className="metric">
          <span>Memory</span>
          <strong>{formatMemory(memory)}</strong>
        </div>
        <div className="metric">
          <span>Memory/sec</span>
          <strong>{formatMemory(memoryPerSecond)}</strong>
        </div>
        <div className="metric accent">
          <span>Corner Hits</span>
          <strong>{cornerHits}</strong>
        </div>
      </div>
    </header>
  );
}
