import { backgrounds } from '../data/backgrounds';
import { useGameStore } from '../store/useGameStore';

export function BackgroundSelectPanel() {
  const unlockedBackgrounds = useGameStore((state) => state.unlockedBackgrounds);
  const currentBackgroundId = useGameStore((state) => state.currentBackgroundId);
  const selectBackground = useGameStore((state) => state.selectBackground);
  const unlockedItems = backgrounds.filter((background) =>
    unlockedBackgrounds.includes(background.id),
  );

  return (
    <section className="background-panel panel">
      <div className="panel-heading background-panel-heading">
        <p className="eyebrow">BACKGROUND</p>
        <h2>Room Select</h2>
      </div>
      {unlockedItems.length === 0 ? (
        <p className="placeholder-copy background-empty">
          Clear a stage to unlock its room backdrop.
        </p>
      ) : (
        <div className="background-list">
          {unlockedItems.map((background) => {
            const isSelected = background.id === currentBackgroundId;

            return (
              <button
                className={`background-option${isSelected ? ' selected' : ''}`}
                key={background.id}
                onClick={() => selectBackground(background.id)}
                type="button"
              >
                <span>{background.name}</span>
                <small>{background.description}</small>
                <b>{isSelected ? 'IN USE' : 'SELECT'}</b>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
