import type { UpgradeCollection, UpgradeId, UpgradeProgress } from '../types/game';
export {
  calculateUpgradeCost,
  calculateEffectiveCornerZonePx,
  calculateEffectiveMuseTapSpeedPerStack,
  calculateEffectiveRebootMultiplierPerReboot,
  calculateUpgradeMasterEffect,
  calculateUpgradePerLevelBonus,
  calculateUpgradeTargetAdditiveBonus,
  clampUpgradeLevel,
  getUpgradeMaster,
  getVisibleUpgradeMasters,
  upgradeDefinitions,
  upgradeIds,
  upgradeMasters,
} from '../masters/upgrades';
import { upgradeDefinitions, upgradeIds } from '../masters/upgrades';

export function createInitialUpgrades(): UpgradeCollection {
  return Object.fromEntries(
    upgradeIds.map((upgradeId) => [
      upgradeId,
      {
        ...upgradeDefinitions[upgradeId],
        level: 0,
      } satisfies UpgradeProgress,
    ]),
  ) as unknown as UpgradeCollection;
}

export function hasUpgradeId(upgradeId: string): upgradeId is UpgradeId {
  return upgradeIds.includes(upgradeId as UpgradeId);
}
