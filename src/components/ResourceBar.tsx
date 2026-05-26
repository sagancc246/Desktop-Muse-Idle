import { useGameStore } from '../store/useGameStore';

interface ResourceBarProps {
  onFocus: () => void;
  onSettings: () => void;
}

export function ResourceBar({ onFocus, onSettings }: ResourceBarProps) {
  const memory = useGameStore((state) => state.memory);
  const memoryPerSecond = useGameStore((state) => state.memoryPerSecond);
  const totalBounces = useGameStore((state) => state.totalBounces);
  const totalCornerHits = useGameStore((state) => state.totalCornerHits);
  const fragments = useGameStore((state) => state.fragments);
  const resources = [
    { label: 'Memory', value: memory.toLocaleString() },
    { label: 'Memory/sec', value: memoryPerSecond.toLocaleString() },
    { label: 'Bounces', value: totalBounces.toLocaleString() },
    { label: 'Corner Hits', value: totalCornerHits.toLocaleString() },
    { label: 'Fragments', value: fragments.toLocaleString() },
  ];

  return (
    <header className="resource-bar panel">
      <div className="brand">
        <p className="eyebrow">DESKTOP MUSE</p>
        <h1>Idle Observatory</h1>
        <p className="phase-label">Stage missions active</p>
      </div>
      <div className="resource-actions">
        <div className="metrics" aria-label="Game resource display">
          {resources.map((resource) => (
            <div className="metric" key={resource.label}>
              <span>{resource.label}</span>
              <strong>{resource.value}</strong>
            </div>
          ))}
        </div>
        <button className="resource-settings" onClick={onFocus} type="button">
          Focus
        </button>
        <button className="resource-settings" onClick={onSettings} type="button">
          Settings
        </button>
      </div>
    </header>
  );
}
