import { UPGRADES, formatMemory, getUpgradeCost, type UpgradeKey } from '../data/balance';
import { useGameStore } from '../store/useGameStore';

const upgradeKeys: UpgradeKey[] = ['bounceBoost', 'speedTune', 'cornerSensor'];

export function UpgradePanel() {
  const memory = useGameStore((state) => state.memory);
  const upgrades = useGameStore((state) => state.upgrades);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);

  return (
    <aside className="upgrade-panel">
      <div className="panel-heading">
        <p className="eyebrow">CALIBRATION</p>
        <h2>Upgrades</h2>
      </div>
      <div className="upgrade-list">
        {upgradeKeys.map((key) => {
          const definition = UPGRADES[key];
          const level = upgrades[key];
          const cost = getUpgradeCost(key, level);

          return (
            <button
              className="upgrade-card"
              disabled={memory < cost}
              key={key}
              onClick={() => buyUpgrade(key)}
              type="button"
            >
              <span className="upgrade-title">
                {definition.name}
                <b>Lv. {level}</b>
              </span>
              <span className="upgrade-description">{definition.summary}</span>
              <span className="upgrade-price">
                Upgrade <strong>{formatMemory(cost)} Memory</strong>
              </span>
            </button>
          );
        })}
      </div>
      <p className="panel-hint">
        Corners create rare resonance bursts with a much larger Memory reward.
      </p>
    </aside>
  );
}
