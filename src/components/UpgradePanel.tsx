import { calculateUpgradeCost, upgradeIds } from '../data/upgrades';
import { useGameStore } from '../store/useGameStore';

export function UpgradePanel() {
  const memory = useGameStore((state) => state.memory);
  const upgrades = useGameStore((state) => state.upgrades);
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade);

  return (
    <aside className="upgrade-panel panel">
      <div className="panel-heading">
        <p className="eyebrow">CALIBRATION</p>
        <h2>Upgrades</h2>
      </div>
      <div className="upgrade-list">
        {upgradeIds.map((upgradeId) => {
          const upgrade = upgrades[upgradeId];
          const cost = calculateUpgradeCost(upgrade, upgrade.level);

          return (
            <div className="upgrade-card" key={upgrade.id}>
              <div className="upgrade-title-row">
                <span className="upgrade-title">{upgrade.name}</span>
                <span className="upgrade-level">Lv {upgrade.level}</span>
              </div>
              <span className="placeholder-copy">{upgrade.description} per level</span>
              <button
                disabled={memory < cost}
                onClick={() => purchaseUpgrade(upgrade.id)}
                type="button"
              >
                Buy - {cost.toLocaleString()} Memory
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
