import assert from 'node:assert/strict';
import { createInitialSkillNodes } from '../src/data/skillTree';
import {
  createInitialCharacterSkillLevels,
  memorySlimeCharacterId,
} from '../src/data/skills';
import { createInitialUpgrades } from '../src/data/upgrades';
import { resolveCharacterSkillEffects } from '../src/game/characterSkillEffects';
import {
  calculateNearCornerDistance,
  calculateOfflineRewardMultiplier,
  calculateVisualSpeedMultiplier,
  getVisualSpeedCap,
} from '../src/game/rewardCalculator';

const characterId = memorySlimeCharacterId;

function createLevelsWith(skillId: string, level = 1) {
  const levels = createInitialCharacterSkillLevels();
  levels[characterId][skillId] = level;
  return levels;
}

const identity = resolveCharacterSkillEffects(createInitialCharacterSkillLevels(), characterId);
assert.deepEqual(identity, {
  bounceRewardMultiplier: 1,
  cornerRewardMultiplier: 1,
  visualSpeedMultiplier: 1,
  offlineRewardMultiplier: 1,
  nearCornerDistanceBonus: 0,
});

const memoryOnly = resolveCharacterSkillEffects(createLevelsWith('memory_slime_core'), characterId);
assert.equal(memoryOnly.bounceRewardMultiplier > 1, true);
assert.equal(memoryOnly.cornerRewardMultiplier, 1);
assert.equal(memoryOnly.visualSpeedMultiplier, 1);
assert.equal(memoryOnly.offlineRewardMultiplier, 1);
assert.equal(memoryOnly.nearCornerDistanceBonus, 0);

const motionOnly = resolveCharacterSkillEffects(
  createLevelsWith('memory_slime_spring_body'),
  characterId,
);
assert.equal(motionOnly.visualSpeedMultiplier > 1, true);
assert.equal(motionOnly.bounceRewardMultiplier, 1);
assert.equal(motionOnly.cornerRewardMultiplier, 1);
assert.equal(motionOnly.offlineRewardMultiplier, 1);
assert.equal(motionOnly.nearCornerDistanceBonus, 0);

const cornerOnly = resolveCharacterSkillEffects(
  createLevelsWith('memory_slime_corner_gleam'),
  characterId,
);
assert.equal(cornerOnly.cornerRewardMultiplier > 1, true);
assert.equal(cornerOnly.bounceRewardMultiplier, 1);
assert.equal(cornerOnly.visualSpeedMultiplier, 1);
assert.equal(cornerOnly.offlineRewardMultiplier, 1);
assert.equal(cornerOnly.nearCornerDistanceBonus, 0);

const archiveOnly = resolveCharacterSkillEffects(
  createLevelsWith('memory_slime_cache_bubble'),
  characterId,
);
assert.equal(archiveOnly.offlineRewardMultiplier > 1, true);
assert.equal(archiveOnly.bounceRewardMultiplier, 1);
assert.equal(archiveOnly.cornerRewardMultiplier, 1);
assert.equal(archiveOnly.visualSpeedMultiplier, 1);
assert.equal(archiveOnly.nearCornerDistanceBonus, 0);

const assistOnly = resolveCharacterSkillEffects(
  createLevelsWith('memory_slime_corner_feelers'),
  characterId,
);
assert.equal(assistOnly.nearCornerDistanceBonus > 0, true);
assert.equal(assistOnly.bounceRewardMultiplier, 1);
assert.equal(assistOnly.cornerRewardMultiplier, 1);
assert.equal(assistOnly.visualSpeedMultiplier, 1);
assert.equal(assistOnly.offlineRewardMultiplier, 1);

const combinedLevels = createInitialCharacterSkillLevels();
combinedLevels[characterId].memory_slime_core = 1;
combinedLevels[characterId].memory_slime_spring_body = 2;
combinedLevels[characterId].memory_slime_corner_gleam = 1;
combinedLevels[characterId].memory_slime_cache_bubble = 1;
combinedLevels[characterId].memory_slime_corner_feelers = 1;
const combined = resolveCharacterSkillEffects(combinedLevels, characterId);
assert.equal(combined.bounceRewardMultiplier > memoryOnly.bounceRewardMultiplier - 0.0001, true);
assert.equal(combined.cornerRewardMultiplier > 1, true);
assert.equal(combined.visualSpeedMultiplier > motionOnly.visualSpeedMultiplier, true);
assert.equal(combined.offlineRewardMultiplier > 1, true);
assert.equal(combined.nearCornerDistanceBonus > 0, true);

const pollutedLevels = createInitialCharacterSkillLevels();
pollutedLevels[characterId].removed_skill = 999;
pollutedLevels.other_character = {
  memory_slime_core: 99,
  memory_slime_corner_gleam: 99,
};
assert.deepEqual(resolveCharacterSkillEffects(pollutedLevels, characterId), identity);
assert.deepEqual(resolveCharacterSkillEffects(combinedLevels, 'other_character'), {
  bounceRewardMultiplier: 1,
  cornerRewardMultiplier: 1,
  visualSpeedMultiplier: 1,
  offlineRewardMultiplier: 1,
  nearCornerDistanceBonus: 0,
});

const maxedLevels = createInitialCharacterSkillLevels();
for (const skillId of Object.keys(maxedLevels[characterId])) {
  maxedLevels[characterId][skillId] = 99;
}
const upgrades = createInitialUpgrades();
upgrades.speed_tune.level = 20;
const visualSpeed = calculateVisualSpeedMultiplier(upgrades, 1, 0, 'medium', maxedLevels);
assert.equal(Number.isFinite(visualSpeed), true);
assert.equal(visualSpeed > 0, true);
assert.equal(visualSpeed <= getVisualSpeedCap('medium'), true);

const nearCornerDistance = calculateNearCornerDistance(createInitialSkillNodes(), maxedLevels);
assert.equal(Number.isFinite(nearCornerDistance), true);
assert.equal(nearCornerDistance > 0, true);

const offlineRewardMultiplier = calculateOfflineRewardMultiplier(
  createInitialSkillNodes(),
  maxedLevels,
);
assert.equal(Number.isFinite(offlineRewardMultiplier), true);
assert.equal(offlineRewardMultiplier > 0, true);

console.log(
  'Skill effects verification passed: identity, branch-specific effects, combined effects, polluted saves, cross-character isolation, speed cap, near-corner assist, and offline multiplier.',
);
