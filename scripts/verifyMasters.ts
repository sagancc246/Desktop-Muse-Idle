import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { backgrounds, initialBackgroundId, initialUnlockedBackgroundIds } from '../src/data/backgrounds';
import { initialActiveMuseIds, initialUnlockedMuseIds, muses } from '../src/data/muses';
import {
  getStageRewardClaimKey,
  migrateLegacyStageRewardClaims,
  type Reward,
} from '../src/data/rewards';
import { skills } from '../src/data/skills';
import {
  createInitialEquippedSkinByMuseId,
  initialUnlockedSkinIds,
  museSkins,
} from '../src/data/skins';
import { legacyClaimedRewardIdsByStageId, stages } from '../src/data/stages';
import { upgradeDefinitions, upgradeIds } from '../src/data/upgrades';
import type { UnlockCondition } from '../src/types/game';
import {
  addError,
  addWarning,
  findDuplicates,
  isNonEmptyString,
  isNonNegativeNumber,
  isPositiveNumber,
  type ValidationReport,
} from './masterValidationUtils';

const repoRoot = process.cwd();
const report: ValidationReport = { errors: [], warnings: [] };
const allowedRewardTypes = new Set([
  'skin',
  'background',
  'muse',
  'memory',
  'capsule',
  'shard',
  'conversation',
]);
const allowedSkinRarities = new Set(['common', 'rare', 'super_rare', 'ultra_rare', 'secret']);
const allowedSkinUnlockMethods = new Set(['default', 'stage', 'capsule', 'shard', 'dlc']);
const stageIds = new Set(stages.map((stage) => stage.id));
const museIds = new Set(muses.map((muse) => muse.id));
const skinIds = new Set(museSkins.map((skin) => skin.id));
const backgroundIds = new Set(backgrounds.map((background) => background.id));
const skillIds = new Set(Object.keys(skills));

function validateUniqueIds(scope: string, ids: string[]): void {
  for (const duplicate of findDuplicates(ids)) {
    addError(report, scope, `duplicate id ${duplicate}`);
  }
}

function validateUnlockCondition(scope: string, condition: UnlockCondition): void {
  if (!condition || !isNonEmptyString(condition.type)) {
    addError(report, scope, 'unlockCondition is missing or invalid');
    return;
  }

  switch (condition.type) {
    case 'initial':
      return;
    case 'stage_clear':
      if (!isNonEmptyString(condition.targetId) || !stageIds.has(condition.targetId)) {
        addError(report, scope, `stage_clear targetId ${condition.targetId} not found in stages`);
      }
      return;
    case 'total_corner_hits':
    case 'jackpot_count':
    case 'reboot_count':
      if (!isNonNegativeNumber(condition.value)) {
        addError(report, scope, `${condition.type} value must be a non-negative number`);
      }
      return;
    case 'capsule':
      if (condition.targetId !== undefined && !isNonEmptyString(condition.targetId)) {
        addError(report, scope, 'capsule targetId must be a non-empty string when provided');
      } else {
        addWarning(report, scope, 'capsule reference cannot be checked until capsules master exists');
      }
      return;
    case 'shard_exchange':
      if (condition.value !== undefined && !isPositiveNumber(condition.value)) {
        addError(report, scope, 'shard_exchange value must be positive when provided');
      }
      return;
    case 'dlc':
      if (!isNonEmptyString(condition.targetId)) {
        addError(report, scope, 'dlc targetId must be a non-empty string');
      } else {
        addWarning(report, scope, `dlc target ${condition.targetId} is not validated yet`);
      }
      return;
    default:
      addError(report, scope, `unsupported unlockCondition type ${(condition as { type: string }).type}`);
  }
}

function validateReward(scope: string, reward: Reward): void {
  if (!reward || !allowedRewardTypes.has(reward.type)) {
    addError(report, scope, `unsupported reward type ${(reward as { type?: string })?.type}`);
    return;
  }
  if (reward.rewardId !== undefined && !isNonEmptyString(reward.rewardId)) {
    addError(report, scope, 'rewardId must be a non-empty string when provided');
  }

  switch (reward.type) {
    case 'skin':
      if (!isNonEmptyString(reward.id)) addError(report, scope, 'skin reward id is required');
      else if (!skinIds.has(reward.id)) addError(report, scope, `reward skin:${reward.id} not found in skins`);
      return;
    case 'background':
      if (!isNonEmptyString(reward.id)) addError(report, scope, 'background reward id is required');
      else if (!backgroundIds.has(reward.id)) addError(report, scope, `reward background:${reward.id} not found in backgrounds`);
      return;
    case 'muse':
      if (!isNonEmptyString(reward.id)) addError(report, scope, 'muse reward id is required');
      else if (!museIds.has(reward.id)) addError(report, scope, `reward muse:${reward.id} not found in muses`);
      return;
    case 'conversation':
      if (!isNonEmptyString(reward.id)) addError(report, scope, 'conversation reward id is required');
      else addWarning(report, scope, `conversation:${reward.id} cannot be checked until conversations master exists`);
      return;
    case 'capsule':
      if (!isNonEmptyString(reward.id)) addError(report, scope, 'capsule reward id is required');
      if (!isPositiveNumber(reward.amount)) addError(report, scope, 'capsule reward amount must be positive');
      addWarning(report, scope, `capsule:${reward.id} cannot be checked until capsules master exists`);
      return;
    case 'memory':
    case 'shard':
      if (!isPositiveNumber(reward.amount)) addError(report, scope, `${reward.type} reward amount must be positive`);
  }
}

function assetPathExists(assetPath: string): boolean {
  const normalized = assetPath.replace(/^\.?\//, '');
  const relativePath = normalized.startsWith('assets/') ? `public/${normalized}` : normalized;
  return existsSync(resolve(repoRoot, relativePath));
}

validateUniqueIds('stages', stages.map((stage) => stage.id));
validateUniqueIds('muses', muses.map((muse) => muse.id));
validateUniqueIds('skins', museSkins.map((skin) => skin.id));
validateUniqueIds('backgrounds', backgrounds.map((background) => background.id));
validateUniqueIds('skills', Object.values(skills).map((skill) => skill.id));
validateUniqueIds('upgrades', upgradeIds);

const stageNumbers = stages.flatMap((stage) => {
  const match = /^stage-(\d+)$/.exec(stage.id);
  if (!match) {
    addError(report, `stages:${stage.id}`, 'stageNumber cannot be derived; expected id format stage-N');
    return [];
  }
  return [match[1]];
});
for (const duplicate of findDuplicates(stageNumbers)) {
  addError(report, 'stages', `duplicate stageNumber ${duplicate}`);
}

const globalRewardIds: string[] = [];
const claimKeys: string[] = [];
for (const stage of stages) {
  const scope = `stages:${stage.id}`;
  if (!isPositiveNumber(stage.cornerHitGoal)) addError(report, scope, 'cornerHitGoal must be positive');
  if (!Array.isArray(stage.rewards)) {
    addError(report, scope, 'rewards must be an array');
    continue;
  }

  const stageRewardIds = stage.rewards.flatMap((reward) => reward.rewardId ? [reward.rewardId] : []);
  for (const duplicate of findDuplicates(stageRewardIds)) addError(report, scope, `duplicate rewardId ${duplicate}`);

  stage.rewards.forEach((reward, index) => {
    validateReward(`${scope}:reward:${index}`, reward);
    if (reward.rewardId) globalRewardIds.push(reward.rewardId);
    const claimKey = getStageRewardClaimKey(stage.id, reward, index);
    if (!isNonEmptyString(claimKey)) addError(report, `${scope}:reward:${index}`, 'claim key is empty');
    claimKeys.push(claimKey);
  });
}
for (const duplicate of findDuplicates(globalRewardIds)) addError(report, 'stages', `duplicate global rewardId ${duplicate}`);
for (const duplicate of findDuplicates(claimKeys)) addError(report, 'stages', `duplicate claim key ${duplicate}`);

for (const muse of muses) {
  const scope = `muses:${muse.id}`;
  const defaultSkin = museSkins.find((skin) => skin.id === muse.defaultSkinId);
  if (!defaultSkin) addError(report, scope, `defaultSkinId ${muse.defaultSkinId} not found in skins`);
  else {
    if (defaultSkin.museId !== muse.id) addError(report, scope, `defaultSkinId ${muse.defaultSkinId} belongs to ${defaultSkin.museId}`);
    if (!defaultSkin.defaultUnlocked) addError(report, scope, `defaultSkinId ${muse.defaultSkinId} must be defaultUnlocked`);
  }
  if (!skillIds.has(muse.skillId)) addError(report, scope, `skillId ${muse.skillId} not found in skills`);
  if (muse.skill.id !== muse.skillId) addError(report, scope, `embedded skill ${muse.skill.id} does not match skillId ${muse.skillId}`);
  validateUnlockCondition(scope, muse.unlockCondition);
}
if (!muses.some((muse) => muse.defaultUnlocked)) addError(report, 'muses', 'at least one Muse must be defaultUnlocked');

for (const skin of museSkins) {
  const scope = `skins:${skin.id}`;
  if (!museIds.has(skin.museId)) addError(report, scope, `museId ${skin.museId} not found in muses`);
  if (!allowedSkinRarities.has(skin.rarity)) addError(report, scope, `rarity ${skin.rarity} is not allowed`);
  if (!allowedSkinUnlockMethods.has(skin.unlockMethod)) addError(report, scope, `unlockMethod ${skin.unlockMethod} is not allowed`);
  if (!isNonEmptyString(skin.iconAsset)) addError(report, scope, 'iconAsset must not be empty');
  if (!isNonEmptyString(skin.thumbnailAsset)) addError(report, scope, 'thumbnailAsset must not be empty');
  else if (!assetPathExists(skin.thumbnailAsset)) addWarning(report, scope, `thumbnail asset not found: ${skin.thumbnailAsset}`);
  if (skin.defaultUnlocked && muses.find((muse) => muse.id === skin.museId)?.defaultSkinId !== skin.id) {
    addError(report, scope, 'defaultUnlocked skin must be the Muse defaultSkinId');
  }
  validateUnlockCondition(scope, skin.unlockCondition);
}
for (const muse of muses) {
  if (!museSkins.some((skin) => skin.museId === muse.id)) addError(report, `muses:${muse.id}`, 'has no skins');
}

for (const background of backgrounds) {
  const scope = `backgrounds:${background.id}`;
  if (!isNonEmptyString(background.imagePath)) addError(report, scope, 'imagePath must not be empty');
  else if (!assetPathExists(background.imagePath)) addWarning(report, scope, `image asset not found: ${background.imagePath}`);
  if (!isNonEmptyString(background.thumbnailAsset)) addError(report, scope, 'thumbnailAsset must not be empty');
  else if (!assetPathExists(background.thumbnailAsset)) addWarning(report, scope, `thumbnail asset not found: ${background.thumbnailAsset}`);
  validateUnlockCondition(scope, background.unlockCondition);
}
if (initialUnlockedBackgroundIds.length === 0) addError(report, 'backgrounds', 'at least one initial background is required');

for (const skill of Object.values(skills)) {
  const scope = `skills:${skill.id}`;
  if (!isNonNegativeNumber(skill.durationMs)) addError(report, scope, 'durationMs must be non-negative');
  if (!isNonNegativeNumber(skill.cooldownMs)) addError(report, scope, 'cooldownMs must be non-negative');
}
for (const [skillId, skill] of Object.entries(skills)) {
  if (skill.id !== skillId) addError(report, `skills:${skillId}`, `definition id is ${skill.id}`);
}
for (const upgradeId of upgradeIds) {
  const upgrade = upgradeDefinitions[upgradeId];
  if (!upgrade || upgrade.id !== upgradeId) addError(report, `upgrades:${upgradeId}`, 'definition is missing or mismatched');
}

for (const museId of initialUnlockedMuseIds) if (!museIds.has(museId)) addError(report, 'initialState', `unlocked Muse ${museId} not found`);
for (const skinId of initialUnlockedSkinIds) if (!skinIds.has(skinId)) addError(report, 'initialState', `unlocked Skin ${skinId} not found`);
for (const backgroundId of initialUnlockedBackgroundIds) if (!backgroundIds.has(backgroundId)) addError(report, 'initialState', `unlocked Background ${backgroundId} not found`);
if (!initialBackgroundId || !backgroundIds.has(initialBackgroundId)) addError(report, 'initialState', `initial background ${initialBackgroundId} not found`);
else if (!initialUnlockedBackgroundIds.includes(initialBackgroundId)) addError(report, 'initialState', `initial background ${initialBackgroundId} is not initially unlocked`);
for (const museId of initialActiveMuseIds) {
  if (!museIds.has(museId)) addError(report, 'initialState', `active Muse ${museId} not found`);
  if (!initialUnlockedMuseIds.includes(museId)) addError(report, 'initialState', `active Muse ${museId} is not initially unlocked`);
}
for (const [museId, skinId] of Object.entries(createInitialEquippedSkinByMuseId())) {
  const skin = museSkins.find((candidate) => candidate.id === skinId);
  if (!museIds.has(museId)) addError(report, 'initialState', `equipped Muse ${museId} not found`);
  if (!skin) addError(report, 'initialState', `equipped Skin ${skinId} not found`);
  else if (skin.museId !== museId) addError(report, 'initialState', `equipped Skin ${skinId} belongs to ${skin.museId}, not ${museId}`);
  if (!initialUnlockedSkinIds.includes(skinId)) addError(report, 'initialState', `equipped Skin ${skinId} is not initially unlocked`);
}

const snapshotPath = resolve(repoRoot, 'scripts/__snapshots__/masterClaimMigration.snapshot.json');
const migrationSnapshot = JSON.parse(readFileSync(snapshotPath, 'utf8')) as {
  claimedStageRewardIds: string[];
  claimedRewardIds: string[];
};
const migratedClaims = migrateLegacyStageRewardClaims(
  migrationSnapshot.claimedStageRewardIds,
  legacyClaimedRewardIdsByStageId,
);
if (JSON.stringify(migratedClaims) !== JSON.stringify(migrationSnapshot.claimedRewardIds)) {
  addError(report, 'claimMigration', 'legacy Stage claim migration does not match masterClaimMigration.snapshot.json');
}
for (const [stageId, legacyRewardIds] of Object.entries(legacyClaimedRewardIdsByStageId)) {
  if (!stageIds.has(stageId)) addError(report, 'claimMigration', `legacy stage ${stageId} not found`);
  for (const rewardId of legacyRewardIds) {
    if (!isNonEmptyString(rewardId)) addError(report, `claimMigration:${stageId}`, 'legacy rewardId must not be empty');
  }
}

for (const warning of report.warnings) console.warn(`⚠ ${warning}`);
if (report.errors.length > 0) {
  for (const error of report.errors) console.error(`✖ ${error}`);
  console.error(`\nMaster validation failed with ${report.errors.length} error(s) and ${report.warnings.length} warning(s).`);
  process.exitCode = 1;
} else {
  const rewardCount = stages.reduce((total, stage) => total + stage.rewards.length, 0);
  console.log('\n✅ Master validation passed');
  console.log(`Validated ${stages.length + rewardCount + muses.length + museSkins.length + backgrounds.length} master records`);
  console.log(`Stages: ${stages.length}`);
  console.log(`Rewards: ${rewardCount}`);
  console.log(`Muses: ${muses.length}`);
  console.log(`Skins: ${museSkins.length}`);
  console.log(`Backgrounds: ${backgrounds.length}`);
  console.log(`Warnings: ${report.warnings.length}`);
}
