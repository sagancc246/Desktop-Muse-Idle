import assert from 'node:assert/strict';
import { enemyMasters as generatedEnemyMasters } from '../src/generated/masters/enemies.generated';
import { stageRewardMasters as generatedStageRewardMasters } from '../src/generated/masters/stageRewards.generated';
import {
  enemyMasters,
  getEnemyMaster,
  getEnemyMasterById,
  normalizeEnemyMasters,
} from '../src/masters/enemies';
import {
  getStageRewardMasters,
  getStageRewards,
  normalizeStageRewardMasters,
} from '../src/masters/stageRewards';
import { getStageById, getStageEnemyConfig } from '../src/data/stages';
import type { EnemyMaster as GeneratedEnemyMaster, StageRewardMaster } from '../src/masters/types';

assert.ok(generatedEnemyMasters.length > 0, 'generated enemies should be importable');
assert.ok(generatedStageRewardMasters.length > 0, 'generated stage rewards should be importable');

for (const generatedEnemy of generatedEnemyMasters) {
  const runtimeEnemy = getEnemyMasterById(generatedEnemy.enemyId);
  assert.ok(runtimeEnemy, `runtime enemy ${generatedEnemy.enemyId} should exist`);
  assert.equal(runtimeEnemy.name, generatedEnemy.name);
  assert.equal(runtimeEnemy.radius, generatedEnemy.radius);
  assert.equal(runtimeEnemy.maxHp, generatedEnemy.maxHp);
  assert.equal(runtimeEnemy.hitCooldownMs, generatedEnemy.hitCooldownMs);
  assert.equal(runtimeEnemy.dropAmount, generatedEnemy.dropAmount);
  assert.equal(runtimeEnemy.spawnWeight, generatedEnemy.spawnWeight);
  assert.ok(Number.isFinite(runtimeEnemy.color.outline));
}

const stageTwo = getStageById('stage-2');
assert.ok(stageTwo, 'stage-2 should exist');
const stageTwoConfig = getStageEnemyConfig(stageTwo);
const memoryBug = getEnemyMaster('memory_bug');
assert.ok(Number.isFinite(memoryBug.maxHp * stageTwoConfig.enemyHpMultiplier));
assert.ok(memoryBug.maxHp * stageTwoConfig.enemyHpMultiplier > 0);
assert.ok(Number.isFinite(memoryBug.dropAmount * stageTwoConfig.dropMultiplier));
assert.ok(Math.round(memoryBug.dropAmount * stageTwoConfig.dropMultiplier) >= 1);

const malformedEnemy: GeneratedEnemyMaster = {
  enemyId: '',
  name: '',
  radius: Number.NaN,
  maxHp: Number.POSITIVE_INFINITY,
  hitCooldownMs: -1,
  dropAmount: 0,
  color: 'not-a-color',
  spawnWeight: -10,
};
const [normalizedEnemy] = normalizeEnemyMasters([malformedEnemy], [memoryBug]);
assert.equal(normalizedEnemy.id, memoryBug.id);
assert.equal(normalizedEnemy.name, memoryBug.name);
assert.equal(normalizedEnemy.radius, memoryBug.radius);
assert.equal(normalizedEnemy.maxHp, memoryBug.maxHp);
assert.equal(normalizedEnemy.hitCooldownMs, memoryBug.hitCooldownMs);
assert.equal(normalizedEnemy.dropAmount, memoryBug.dropAmount);
assert.equal(normalizedEnemy.spawnWeight, memoryBug.spawnWeight);

for (const generatedReward of generatedStageRewardMasters) {
  const stage = getStageById(generatedReward.stageId);
  assert.ok(stage, `stage reward stageId ${generatedReward.stageId} should exist`);
  assert.ok(Number.isFinite(generatedReward.clearRewardMemory));
  assert.ok(generatedReward.clearRewardMemory >= 0);
  assert.ok(Number.isFinite(generatedReward.firstClearRewardMemory));
  assert.ok(generatedReward.firstClearRewardMemory >= 0);
}

const stageOneRewardMasters = getStageRewardMasters('stage-1');
assert.ok(stageOneRewardMasters.length > 0, 'stage-1 rewards should be loaded');
const stageOneRuntimeRewards = getStageRewards('stage-1', []);
assert.ok(stageOneRuntimeRewards.some((reward) => reward.rewardId === 'memory_500'));
assert.ok(stageOneRuntimeRewards.some((reward) => reward.rewardId === 'cozy_room'));
assert.equal(
  stageOneRuntimeRewards.find((reward) => reward.rewardId === 'memory_500')?.rewardText,
  'Memory bonus',
);

const fallbackRewards = [{ type: 'memory' as const, amount: 1, rewardId: 'fallback' }];
assert.equal(getStageRewards('missing-stage', fallbackRewards), fallbackRewards);

const malformedReward: StageRewardMaster = {
  stageId: 'stage-x',
  rewardId: '',
  rewardType: 'memory',
  clearRewardMemory: Number.NaN,
  firstClearRewardMemory: Number.NaN,
};
assert.equal(normalizeStageRewardMasters([malformedReward]).length, 0);

assert.equal(enemyMasters[0]?.id, 'memory_bug');

console.log('Enemy and stage reward config verification passed');
