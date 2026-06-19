import {
  characterSkillEffectTypes,
  characterSkillNodes,
  createInitialCharacterSkillLevels,
  memorySlimeCharacterId,
} from '../src/data/skills';
import { monsterAssets } from '../src/data/monsters';
import { resolveCharacterSkillEffects } from '../src/game/characterSkillEffects';

const errors: string[] = [];
const monsterIds = new Set(monsterAssets.map((monster) => monster.id));
const effectTypes = new Set(characterSkillEffectTypes);
const nodeIds = new Set(characterSkillNodes.map((node) => node.id));

function addError(message: string): void {
  errors.push(message);
}

for (const node of characterSkillNodes) {
  if (!monsterIds.has(node.characterId)) {
    addError(`${node.id}: characterId ${node.characterId} is not a monster id`);
  }
  if (!Number.isInteger(node.maxLevel) || node.maxLevel <= 0) {
    addError(`${node.id}: maxLevel must be positive integer`);
  }
  if (!Number.isFinite(node.cost) || node.cost <= 0) {
    addError(`${node.id}: cost must be positive`);
  }
  if (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)) {
    addError(`${node.id}: position must be finite`);
  }
  for (const requiredId of node.prerequisites) {
    if (!nodeIds.has(requiredId)) {
      addError(`${node.id}: prerequisite ${requiredId} is missing`);
    }
  }
  for (const effect of node.effects) {
    if (!effectTypes.has(effect.type)) {
      addError(`${node.id}: effect ${effect.type} is not supported`);
    }
    if (!Number.isFinite(effect.value) || effect.value <= 0) {
      addError(`${node.id}: effect ${effect.type} value must be positive`);
    }
  }
}

const memorySlimeNodes = characterSkillNodes.filter(
  (node) => node.characterId === memorySlimeCharacterId,
);
if (memorySlimeNodes.length < 10 || memorySlimeNodes.length > 13) {
  addError(`memory_slime: expected 10-13 skill nodes, found ${memorySlimeNodes.length}`);
}

const initialLevels = createInitialCharacterSkillLevels();
for (const node of characterSkillNodes) {
  if (initialLevels[node.characterId]?.[node.id] !== 0) {
    addError(`${node.id}: initial characterSkillLevels entry is missing or non-zero`);
  }
}

const maxedLevels = createInitialCharacterSkillLevels();
for (const node of memorySlimeNodes) {
  maxedLevels[memorySlimeCharacterId][node.id] = node.maxLevel;
}
const resolved = resolveCharacterSkillEffects(maxedLevels, memorySlimeCharacterId);
if (resolved.bounceRewardMultiplier <= 1) addError('resolver did not increase bounce reward');
if (resolved.cornerRewardMultiplier <= 1) addError('resolver did not increase corner reward');
if (resolved.visualSpeedMultiplier <= 1) addError('resolver did not increase visual speed');
if (resolved.offlineRewardMultiplier <= 1) addError('resolver did not increase offline reward');
if (resolved.nearCornerDistanceBonus <= 0) addError('resolver did not increase near-corner distance');

function detectCycles(): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (nodeId: string, trail: string[]): void => {
    if (visited.has(nodeId)) {
      return;
    }
    if (visiting.has(nodeId)) {
      addError(`cycle detected: ${[...trail, nodeId].join(' -> ')}`);
      return;
    }

    visiting.add(nodeId);
    const node = characterSkillNodes.find((candidate) => candidate.id === nodeId);
    for (const requiredId of node?.prerequisites ?? []) {
      visit(requiredId, [...trail, nodeId]);
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  for (const node of characterSkillNodes) {
    visit(node.id, []);
  }
}

detectCycles();

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`Skill verification failed: ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Skill verification passed: ${characterSkillNodes.length} character skill nodes, Memory Slime resolver, initial levels, prerequisites, and cycle checks.`,
  );
}
