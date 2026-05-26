import type { SkillNode, SkillTreeCategory, SkillTreeEffectType } from '../types/game';

export const skillTreeCategories: { id: SkillTreeCategory; name: string }[] = [
  { id: 'bounce', name: 'Bounce' },
  { id: 'corner', name: 'Corner' },
  { id: 'muse', name: 'Muse' },
];

export const skillNodes: SkillNode[] = [
  {
    id: 'bounce_memory_1',
    category: 'bounce',
    name: 'Bounce Memory I',
    description: 'Wall-hit Memory x1.10.',
    cost: 1,
    maxLevel: 1,
    requiredNodeIds: [],
    effectType: 'bounce_reward',
    effectValue: 1.1,
  },
  {
    id: 'bounce_memory_2',
    category: 'bounce',
    name: 'Bounce Memory II',
    description: 'Wall-hit Memory x1.25.',
    cost: 2,
    maxLevel: 1,
    requiredNodeIds: ['bounce_memory_1'],
    effectType: 'bounce_reward',
    effectValue: 1.25,
  },
  {
    id: 'passive_cache',
    category: 'bounce',
    name: 'Passive Cache',
    description: 'Offline Memory cache x1.20.',
    cost: 2,
    maxLevel: 1,
    requiredNodeIds: [],
    effectType: 'offline_reward',
    effectValue: 1.2,
  },
  {
    id: 'corner_bonus_1',
    category: 'corner',
    name: 'Corner Bonus I',
    description: 'Corner bonus Memory x1.20.',
    cost: 1,
    maxLevel: 1,
    requiredNodeIds: [],
    effectType: 'corner_reward',
    effectValue: 1.2,
  },
  {
    id: 'corner_sensor_1',
    category: 'corner',
    name: 'Corner Sensor I',
    description: 'Corner detection range +4.',
    cost: 2,
    maxLevel: 1,
    requiredNodeIds: ['corner_bonus_1'],
    effectType: 'corner_threshold',
    effectValue: 4,
  },
  {
    id: 'lucky_corner',
    category: 'corner',
    name: 'Lucky Corner',
    description: 'Corner bonus Memory x1.50.',
    cost: 3,
    maxLevel: 1,
    requiredNodeIds: ['corner_sensor_1'],
    effectType: 'corner_reward',
    effectValue: 1.5,
  },
  {
    id: 'muse_sync_1',
    category: 'muse',
    name: 'Muse Sync I',
    description: 'Muse skill duration x1.10.',
    cost: 1,
    maxLevel: 1,
    requiredNodeIds: [],
    effectType: 'skill_duration',
    effectValue: 1.1,
  },
  {
    id: 'skill_cooldown_1',
    category: 'muse',
    name: 'Skill Cooldown I',
    description: 'Muse skill cooldown x0.90.',
    cost: 2,
    maxLevel: 1,
    requiredNodeIds: ['muse_sync_1'],
    effectType: 'skill_cooldown',
    effectValue: 0.9,
  },
  {
    id: 'stable_motion',
    category: 'muse',
    name: 'Stable Motion',
    description: 'Internal yield speed x1.10 without visual acceleration.',
    cost: 2,
    maxLevel: 1,
    requiredNodeIds: [],
    effectType: 'internal_speed_bonus',
    effectValue: 1.1,
  },
];

export function getSkillNodeById(skillNodeId: string): SkillNode | undefined {
  return skillNodes.find((skillNode) => skillNode.id === skillNodeId);
}

export function createInitialSkillNodes(): Record<string, number> {
  return Object.fromEntries(skillNodes.map((skillNode) => [skillNode.id, 0]));
}

export function calculateSkillTreeMultiplier(
  unlockedSkillNodes: Record<string, number>,
  effectType: SkillTreeEffectType,
): number {
  return skillNodes
    .filter((skillNode) => skillNode.effectType === effectType)
    .reduce(
      (multiplier, skillNode) =>
        multiplier *
        Math.pow(skillNode.effectValue, unlockedSkillNodes[skillNode.id] ?? 0),
      1,
    );
}

export function calculateSkillTreeAdditiveBonus(
  unlockedSkillNodes: Record<string, number>,
  effectType: SkillTreeEffectType,
): number {
  return skillNodes
    .filter((skillNode) => skillNode.effectType === effectType)
    .reduce(
      (bonus, skillNode) => bonus + skillNode.effectValue * (unlockedSkillNodes[skillNode.id] ?? 0),
      0,
    );
}
