import assert from 'node:assert/strict';
import { upgrades as generatedUpgrades } from '../src/generated/masters/upgrades.generated';
import {
  calculateEffectiveCornerZonePx,
  calculateEffectiveMuseTapSpeedPerStack,
  calculateEffectiveRebootMultiplierPerReboot,
  calculateUpgradeCost,
  clampUpgradeLevel,
  createInitialUpgrades,
  getUpgradeMaster,
  getVisibleUpgradeMasters,
  upgradeIds,
  upgradeMasters,
} from '../src/data/upgrades';
import {
  cornerHitAssistZonePx,
  museTapSpeedPerStack,
  rebootMultiplierPerReboot,
} from '../src/data/balance';

assert.ok(generatedUpgrades.length > 0, 'generated upgrades should be importable');
assert.equal(upgradeMasters.length, generatedUpgrades.length);
assert.deepEqual(
  upgradeIds,
  generatedUpgrades.map((upgrade) => upgrade.upgradeId),
);

for (const generatedUpgrade of generatedUpgrades) {
  const runtimeUpgrade = getUpgradeMaster(generatedUpgrade.upgradeId);
  assert.ok(runtimeUpgrade, `runtime upgrade ${generatedUpgrade.upgradeId} should exist`);
  assert.equal(runtimeUpgrade.name, generatedUpgrade.name);
  assert.equal(runtimeUpgrade.description, generatedUpgrade.description);
  assert.equal(runtimeUpgrade.baseCost, generatedUpgrade.baseCost);
  assert.equal(runtimeUpgrade.costRate, generatedUpgrade.costGrowth);
  assert.equal(runtimeUpgrade.maxLevel, generatedUpgrade.maxLevel);
  assert.equal(runtimeUpgrade.enabled, generatedUpgrade.enabled);
  assert.equal(runtimeUpgrade.unlockStageNumber, generatedUpgrade.unlockStageNumber);
  assert.equal(runtimeUpgrade.unlockRebootCount, generatedUpgrade.unlockRebootCount);
  assert.ok(Number.isFinite(calculateUpgradeCost(runtimeUpgrade, 0)));
  assert.ok(calculateUpgradeCost(runtimeUpgrade, 0) >= 0);
}

const upgrades = createInitialUpgrades();
assert.equal(upgrades.bounce_boost.level, 0);
assert.equal(upgrades.speed_tune.level, 0);
assert.equal(upgrades.corner_sensor.level, 0);
assert.equal(upgrades.reboot_core.level, 0);

assert.equal(calculateUpgradeCost(upgrades.bounce_boost, 0), 25);
assert.equal(calculateUpgradeCost(upgrades.speed_tune, 0), 40);
assert.equal(clampUpgradeLevel('speed_tune', 999), getUpgradeMaster('speed_tune')?.maxLevel);
assert.equal(clampUpgradeLevel('missing_upgrade', 999), 999);

upgrades.bounce_boost.level = 2;
upgrades.corner_sensor.level = 3;
upgrades.reboot_core.level = 4;

assert.ok(calculateEffectiveMuseTapSpeedPerStack(museTapSpeedPerStack, upgrades) > museTapSpeedPerStack);
assert.equal(calculateEffectiveCornerZonePx(cornerHitAssistZonePx, upgrades), cornerHitAssistZonePx + 12);
assert.ok(
  calculateEffectiveRebootMultiplierPerReboot(rebootMultiplierPerReboot, upgrades) >
    rebootMultiplierPerReboot,
);

assert.ok(getVisibleUpgradeMasters({ rebootCount: 0, stageNumber: 1 }).some((upgrade) => upgrade.id === 'bounce_boost'));
assert.ok(!getVisibleUpgradeMasters({ rebootCount: 0, stageNumber: 1 }).some((upgrade) => upgrade.id === 'reboot_core'));
assert.ok(getVisibleUpgradeMasters({ rebootCount: 1, stageNumber: 3 }).some((upgrade) => upgrade.id === 'reboot_core'));

console.log('Upgrade config verification passed');
