import assert from 'node:assert/strict';
import { stageMasters as generatedStageMasters } from '../src/generated/masters/stages.generated';
import {
  getStageMasterById,
  getStageMasterByNumber,
  normalizeStageMasters,
} from '../src/masters/stages';
import {
  getStageById,
  getStageClearConditionType,
  getStageEnemyConfig,
  getStageNumber,
  stages,
} from '../src/data/stages';
import type { StageMaster } from '../src/masters/types';

assert.ok(generatedStageMasters.length > 0, 'generated stages should be importable');
assert.equal(stages.length, generatedStageMasters.length, 'runtime stages should follow CSV count');

for (const generatedStage of generatedStageMasters) {
  const runtimeStage = getStageById(generatedStage.stageId);
  assert.ok(runtimeStage, `runtime stage ${generatedStage.stageId} should exist`);
  assert.equal(getStageNumber(runtimeStage), generatedStage.stageNumber);
  assert.equal(runtimeStage.cornerHitGoal, generatedStage.cornerRequirement);
  assert.equal(getStageClearConditionType(runtimeStage), generatedStage.clearConditionType);

  if (generatedStage.clearConditionType === 'enemy_defeats') {
    const enemyConfig = getStageEnemyConfig(runtimeStage);
    assert.equal(enemyConfig.targetDefeatCount, generatedStage.targetDefeatCount);
    assert.equal(enemyConfig.maxActiveEnemies, generatedStage.maxActiveEnemies);
    assert.equal(enemyConfig.enemyHpMultiplier, generatedStage.enemyHpMultiplier);
    assert.equal(enemyConfig.dropMultiplier, generatedStage.dropMultiplier);
  }
}

const stageTwo = getStageMasterByNumber(2);
assert.equal(stageTwo?.stageId, 'stage-2');
assert.equal(getStageMasterById('stage-2')?.stageNumber, 2);

const malformedStage: StageMaster = {
  stageId: '',
  stageNumber: Number.NaN,
  clearConditionType: 'enemy_defeats',
  targetDefeatCount: Number.NaN,
  maxActiveEnemies: -10,
  enemyHpMultiplier: Number.POSITIVE_INFINITY,
  dropMultiplier: 0,
  cornerRequirement: -50,
};
const fallbackStage: StageMaster = {
  stageId: 'stage-fallback',
  stageNumber: 99,
  clearConditionType: 'corner_hits',
  targetDefeatCount: 7,
  maxActiveEnemies: 2,
  enemyHpMultiplier: 1.5,
  dropMultiplier: 1.25,
  cornerRequirement: 123,
};
const [normalizedStage] = normalizeStageMasters([malformedStage], [fallbackStage]);
assert.equal(normalizedStage.stageId, fallbackStage.stageId);
assert.equal(normalizedStage.stageNumber, fallbackStage.stageNumber);
assert.equal(normalizedStage.clearConditionType, 'enemy_defeats');
assert.equal(normalizedStage.targetDefeatCount, fallbackStage.targetDefeatCount);
assert.equal(normalizedStage.maxActiveEnemies, fallbackStage.maxActiveEnemies);
assert.equal(normalizedStage.enemyHpMultiplier, fallbackStage.enemyHpMultiplier);
assert.equal(normalizedStage.dropMultiplier, fallbackStage.dropMultiplier);
assert.equal(normalizedStage.cornerRequirement, fallbackStage.cornerRequirement);

console.log('Stage config verification passed');
