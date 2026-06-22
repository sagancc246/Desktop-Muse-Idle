import { calculateUpgradeCost, getVisibleUpgradeMasters, upgradeMasters } from '../data/upgrades';
import { getStageById, initialStageId } from '../data/stages';
import { getStageNumber } from '../game/statsTracker';
import { useGameStore } from '../store/useGameStore';

export function UpgradePanel() {
  const memory = useGameStore((state) => state.memory);
  const upgrades = useGameStore((state) => state.upgrades);
  const currentStageId = useGameStore((state) => state.currentStageId);
  const rebootCount = useGameStore((state) => state.rebootCount);
  const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade);
  const currentStage = getStageById(currentStageId) ?? getStageById(initialStageId);
  const stageNumber = currentStage ? getStageNumber(currentStage.id) : 1;
  const visibleUpgradeIds = new Set(
    getVisibleUpgradeMasters({ rebootCount, stageNumber }).map((upgrade) => upgrade.id),
  );

  return (
    <aside className="upgrade-panel panel">
      <div className="panel-heading">
        <p className="eyebrow">CALIBRATION</p>
        <h2>Upgrades</h2>
      </div>
      <div className="upgrade-list">
        {upgradeMasters.map((master) => {
          const upgrade = upgrades[master.id] ?? { ...master, level: 0 };
          const isVisible = visibleUpgradeIds.has(master.id);
          if (!master.enabled || !isVisible) {
            return null;
          }
          const cost = calculateUpgradeCost(upgrade, upgrade.level);
          const isMaxed = upgrade.level >= master.maxLevel;
          const canAfford = memory >= cost;

          return (
            <div className="upgrade-card" key={master.id}>
              <div className="upgrade-title-row">
                <span className="upgrade-title">{master.name}</span>
                <span className="upgrade-level">
                  Lv {upgrade.level} / {master.maxLevel}
                </span>
              </div>
              <span className="placeholder-copy">{master.description}</span>
              <button
                disabled={isMaxed || !canAfford}
                onClick={() => purchaseUpgrade(master.id)}
                type="button"
              >
                {isMaxed ? 'MAX' : `Buy - ${cost.toLocaleString()} Memory`}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
