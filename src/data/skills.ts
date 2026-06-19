import {
  cloneCornerRewardMultiplier,
  cloneSkillCooldownMs,
  cloneSkillDurationMs,
  giantSkillCooldownMs,
  giantSkillDurationMs,
  speedUpSkillCooldownMs,
  speedUpSkillDurationMs,
  vegaBumperCooldownMs,
  vegaBumperDurationMs,
} from './balance';
import type {
  CharacterSkillEffectType,
  CharacterSkillLevels,
  CharacterSkillNode,
  MuseSkill,
  MuseSkillId,
} from '../types/game';

export const skills: Record<MuseSkillId, MuseSkill> = {
  clone: {
    id: 'clone',
    name: 'Mirror Echo',
    type: 'clone',
    description: 'Creates a temporary echo with reduced rewards.',
    durationMs: cloneSkillDurationMs,
    cooldownMs: cloneSkillCooldownMs,
    trigger: 'corner_hit',
    power: cloneCornerRewardMultiplier,
  },
  speed_up: {
    id: 'speed_up',
    name: 'Star Accel',
    type: 'speed_up',
    description: 'Briefly accelerates every active Muse.',
    durationMs: speedUpSkillDurationMs,
    cooldownMs: speedUpSkillCooldownMs,
    trigger: 'corner_hit',
    power: 0.3,
  },
  giant: {
    id: 'giant',
    name: 'Night Bloom',
    type: 'grow',
    description: 'Briefly grows larger for easier wall contact.',
    durationMs: giantSkillDurationMs,
    cooldownMs: giantSkillCooldownMs,
    trigger: 'corner_hit',
    power: 0.5,
  },
  muse_bumper: {
    id: 'muse_bumper',
    name: 'Muse Bumper',
    type: 'bumper',
    description: 'Becomes a moving bumper that redirects other Muses.',
    durationMs: vegaBumperDurationMs,
    cooldownMs: vegaBumperCooldownMs,
    trigger: 'corner_hit',
    power: 1,
  },
};

export const vegaBumperSkill = skills.muse_bumper;

export function getSkillById(skillId: MuseSkillId): MuseSkill {
  return skills[skillId];
}

export const memorySlimeCharacterId = 'memory_slime';

export const characterSkillEffectTypes: CharacterSkillEffectType[] = [
  'bounce_reward_multiplier',
  'corner_reward_multiplier',
  'visual_speed_multiplier',
  'offline_reward_multiplier',
  'near_corner_distance_bonus',
];

export const memorySlimeSkillNodes: CharacterSkillNode[] = [
  {
    id: 'memory_slime_core',
    characterId: memorySlimeCharacterId,
    name: 'Gel Memory Core',
    description: 'Memory earned from wall hits x1.08.',
    branch: 'memory',
    cost: 1,
    maxLevel: 1,
    prerequisites: [],
    effects: [{ type: 'bounce_reward_multiplier', value: 1.08 }],
    position: { x: 80, y: 220 },
  },
  {
    id: 'memory_slime_gloss',
    characterId: memorySlimeCharacterId,
    name: 'Glossy Recall',
    description: 'Memory earned from wall hits x1.05 per level.',
    branch: 'memory',
    cost: 2,
    maxLevel: 2,
    prerequisites: ['memory_slime_core'],
    effects: [{ type: 'bounce_reward_multiplier', value: 1.05 }],
    position: { x: 220, y: 150 },
  },
  {
    id: 'memory_slime_cache_bubble',
    characterId: memorySlimeCharacterId,
    name: 'Cache Bubble',
    description: 'Offline Memory reward x1.12.',
    branch: 'archive',
    cost: 2,
    maxLevel: 1,
    prerequisites: ['memory_slime_core'],
    effects: [{ type: 'offline_reward_multiplier', value: 1.12 }],
    position: { x: 220, y: 290 },
  },
  {
    id: 'memory_slime_spring_body',
    characterId: memorySlimeCharacterId,
    name: 'Spring Body',
    description: 'Visual bounce speed x1.04 per level.',
    branch: 'motion',
    cost: 2,
    maxLevel: 2,
    prerequisites: ['memory_slime_core'],
    effects: [{ type: 'visual_speed_multiplier', value: 1.04 }],
    position: { x: 360, y: 70 },
  },
  {
    id: 'memory_slime_wall_spark',
    characterId: memorySlimeCharacterId,
    name: 'Wall Spark',
    description: 'Memory earned from wall hits x1.10.',
    branch: 'memory',
    cost: 3,
    maxLevel: 1,
    prerequisites: ['memory_slime_gloss'],
    effects: [{ type: 'bounce_reward_multiplier', value: 1.1 }],
    position: { x: 360, y: 210 },
  },
  {
    id: 'memory_slime_corner_feelers',
    characterId: memorySlimeCharacterId,
    name: 'Corner Feelers',
    description: 'Near Corner sensing distance +8.',
    branch: 'corner',
    cost: 2,
    maxLevel: 1,
    prerequisites: ['memory_slime_cache_bubble'],
    effects: [{ type: 'near_corner_distance_bonus', value: 8 }],
    position: { x: 360, y: 350 },
  },
  {
    id: 'memory_slime_corner_gleam',
    characterId: memorySlimeCharacterId,
    name: 'Corner Gleam',
    description: 'Corner Hit reward x1.10.',
    branch: 'corner',
    cost: 3,
    maxLevel: 1,
    prerequisites: ['memory_slime_corner_feelers'],
    effects: [{ type: 'corner_reward_multiplier', value: 1.1 }],
    position: { x: 500, y: 300 },
  },
  {
    id: 'memory_slime_archive_jelly',
    characterId: memorySlimeCharacterId,
    name: 'Archive Jelly',
    description: 'Offline Memory reward x1.08 per level.',
    branch: 'archive',
    cost: 3,
    maxLevel: 2,
    prerequisites: ['memory_slime_cache_bubble'],
    effects: [{ type: 'offline_reward_multiplier', value: 1.08 }],
    position: { x: 500, y: 430 },
  },
  {
    id: 'memory_slime_rebound_mote',
    characterId: memorySlimeCharacterId,
    name: 'Rebound Mote',
    description: 'Memory earned from wall hits x1.06 and visual bounce speed x1.03.',
    branch: 'motion',
    cost: 4,
    maxLevel: 1,
    prerequisites: ['memory_slime_spring_body', 'memory_slime_wall_spark'],
    effects: [
      { type: 'bounce_reward_multiplier', value: 1.06 },
      { type: 'visual_speed_multiplier', value: 1.03 },
    ],
    position: { x: 640, y: 150 },
  },
  {
    id: 'memory_slime_corner_bloom',
    characterId: memorySlimeCharacterId,
    name: 'Corner Bloom',
    description: 'Corner Hit reward x1.08 per level.',
    branch: 'corner',
    cost: 4,
    maxLevel: 2,
    prerequisites: ['memory_slime_corner_gleam'],
    effects: [{ type: 'corner_reward_multiplier', value: 1.08 }],
    position: { x: 640, y: 300 },
  },
  {
    id: 'memory_slime_luminous_cache',
    characterId: memorySlimeCharacterId,
    name: 'Luminous Cache',
    description: 'Memory earned from wall hits x1.08 and offline Memory reward x1.08.',
    branch: 'archive',
    cost: 5,
    maxLevel: 1,
    prerequisites: ['memory_slime_rebound_mote', 'memory_slime_archive_jelly'],
    effects: [
      { type: 'bounce_reward_multiplier', value: 1.08 },
      { type: 'offline_reward_multiplier', value: 1.08 },
    ],
    position: { x: 780, y: 230 },
  },
  {
    id: 'memory_slime_prismatic_corner',
    characterId: memorySlimeCharacterId,
    name: 'Prismatic Corner',
    description: 'Corner Hit reward x1.12 and Near Corner sensing distance +6.',
    branch: 'corner',
    cost: 6,
    maxLevel: 1,
    prerequisites: ['memory_slime_corner_bloom', 'memory_slime_luminous_cache'],
    effects: [
      { type: 'corner_reward_multiplier', value: 1.12 },
      { type: 'near_corner_distance_bonus', value: 6 },
    ],
    position: { x: 920, y: 300 },
  },
];

export const characterSkillNodes: CharacterSkillNode[] = [...memorySlimeSkillNodes];

export function getCharacterSkillNodesByCharacterId(characterId: string): CharacterSkillNode[] {
  return characterSkillNodes.filter((skillNode) => skillNode.characterId === characterId);
}

export function getCharacterSkillNodeById(
  characterId: string,
  skillNodeId: string,
): CharacterSkillNode | undefined {
  return characterSkillNodes.find(
    (skillNode) => skillNode.characterId === characterId && skillNode.id === skillNodeId,
  );
}

export function createInitialCharacterSkillLevels(): CharacterSkillLevels {
  return characterSkillNodes.reduce<CharacterSkillLevels>((levels, skillNode) => {
    levels[skillNode.characterId] ??= {};
    levels[skillNode.characterId][skillNode.id] = 0;
    return levels;
  }, {});
}
