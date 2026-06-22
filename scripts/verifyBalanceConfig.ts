import assert from 'node:assert/strict';
import {
  assistedCornerHitEnabled,
  cornerHitAssistZonePx,
  cornerHitCooldownMs,
  museTapDurationMs,
  museTapSpeedMultiplierCap,
  museTapSpeedPerStack,
  rebootBasePermanentMultiplier,
  rebootMemoryRequirement,
  rebootMultiplierPerReboot,
  rebootRequirementGrowth,
  speedTuneBaseSpeed,
  speedTuneMaxSpeed,
  speedTuneMinSpeed,
  speedTuneMultiplier,
  speedTuneTapBoostMaxSpeed,
  strictCornerHitEnabled,
} from '../src/data/balance';
import { balanceConfig } from '../src/masters/balance';
import { detectCornerHit, type WallCollisionResult } from '../src/game/cornerHitDetector';

function assertFinite(name: string, value: number): void {
  assert.equal(Number.isFinite(value), true, `${name} must be finite`);
}

assertFinite('bounceBoost.tapBoostAdd', balanceConfig.bounceBoost.tapBoostAdd);
assertFinite('bounceBoost.maxTemporaryBoost', balanceConfig.bounceBoost.maxTemporaryBoost);
assertFinite('bounceBoost.decayDurationMs', balanceConfig.bounceBoost.decayDurationMs);
assertFinite('speedTune.baseSpeed', balanceConfig.speedTune.baseSpeed);
assertFinite('speedTune.minSpeed', balanceConfig.speedTune.minSpeed);
assertFinite('speedTune.maxSpeed', balanceConfig.speedTune.maxSpeed);
assertFinite('speedTune.tapBoostMaxSpeed', balanceConfig.speedTune.tapBoostMaxSpeed);
assertFinite('cornerSensor.cornerZonePx', balanceConfig.cornerSensor.cornerZonePx);
assertFinite('cornerSensor.cornerHitCooldownMs', balanceConfig.cornerSensor.cornerHitCooldownMs);
assertFinite('reboot.baseRequirement', balanceConfig.reboot.baseRequirement);
assertFinite('reboot.requirementGrowth', balanceConfig.reboot.requirementGrowth);
assertFinite('reboot.basePermanentMultiplier', balanceConfig.reboot.basePermanentMultiplier);
assertFinite('reboot.multiplierPerReboot', balanceConfig.reboot.multiplierPerReboot);

assert.equal(museTapSpeedPerStack, 1 + balanceConfig.bounceBoost.tapBoostAdd);
assert.equal(museTapSpeedMultiplierCap, 1 + balanceConfig.bounceBoost.maxTemporaryBoost);
assert.equal(museTapDurationMs, balanceConfig.bounceBoost.decayDurationMs);
assert.equal(speedTuneMultiplier, balanceConfig.speedTune.upgradeMultiplier);
assert.equal(speedTuneMinSpeed <= speedTuneBaseSpeed, true);
assert.equal(speedTuneBaseSpeed <= speedTuneMaxSpeed, true);
assert.equal(speedTuneTapBoostMaxSpeed >= speedTuneMaxSpeed, true);
assert.equal(cornerHitAssistZonePx, balanceConfig.cornerSensor.cornerZonePx);
assert.equal(cornerHitCooldownMs, balanceConfig.cornerSensor.cornerHitCooldownMs);
assert.equal(strictCornerHitEnabled, balanceConfig.cornerSensor.strictCornerEnabled);
assert.equal(assistedCornerHitEnabled, balanceConfig.cornerSensor.assistedCornerEnabled);
assert.equal(rebootMemoryRequirement, balanceConfig.reboot.baseRequirement);
assert.equal(rebootRequirementGrowth, balanceConfig.reboot.requirementGrowth);
assert.equal(rebootBasePermanentMultiplier, balanceConfig.reboot.basePermanentMultiplier);
assert.equal(rebootMultiplierPerReboot, balanceConfig.reboot.multiplierPerReboot);

const collision: WallCollisionResult = {
  cornerId: null,
  hitBottom: false,
  hitLeft: true,
  hitRight: false,
  hitTop: false,
  hitXWall: true,
  hitYWall: false,
  maxX: 500,
  maxY: 500,
  minX: 50,
  minY: 50,
  nextX: 49,
  nextY: 50 + cornerHitAssistZonePx,
};
assert.equal(detectCornerHit(collision).isCornerHit, true);

const outsideCollision: WallCollisionResult = {
  ...collision,
  nextY: 50 + cornerHitAssistZonePx + 1,
};
assert.equal(detectCornerHit(outsideCollision).isCornerHit, false);

console.log('Balance config verification passed');
