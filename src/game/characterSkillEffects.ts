import {
  characterSkillNodes,
  createInitialCharacterSkillLevels,
  memorySlimeCharacterId,
} from '../data/skills';
import type { CharacterSkillLevels } from '../types/game';

export interface ResolvedCharacterSkillEffects {
  bounceRewardMultiplier: number;
  cornerRewardMultiplier: number;
  visualSpeedMultiplier: number;
  offlineRewardMultiplier: number;
  nearCornerDistanceBonus: number;
}

export function resolveCharacterSkillEffects(
  characterSkillLevels: CharacterSkillLevels | undefined,
  characterId = memorySlimeCharacterId,
): ResolvedCharacterSkillEffects {
  const levels = characterSkillLevels ?? createInitialCharacterSkillLevels();

  return characterSkillNodes
    .filter((skillNode) => skillNode.characterId === characterId)
    .reduce<ResolvedCharacterSkillEffects>(
      (resolved, skillNode) => {
        const level = Math.max(0, Math.floor(levels[characterId]?.[skillNode.id] ?? 0));

        if (level === 0) {
          return resolved;
        }

        for (const effect of skillNode.effects) {
          if (effect.type === 'bounce_reward_multiplier') {
            resolved.bounceRewardMultiplier *= Math.pow(effect.value, level);
          } else if (effect.type === 'corner_reward_multiplier') {
            resolved.cornerRewardMultiplier *= Math.pow(effect.value, level);
          } else if (effect.type === 'visual_speed_multiplier') {
            resolved.visualSpeedMultiplier *= Math.pow(effect.value, level);
          } else if (effect.type === 'offline_reward_multiplier') {
            resolved.offlineRewardMultiplier *= Math.pow(effect.value, level);
          } else if (effect.type === 'near_corner_distance_bonus') {
            resolved.nearCornerDistanceBonus += effect.value * level;
          }
        }

        return resolved;
      },
      {
        bounceRewardMultiplier: 1,
        cornerRewardMultiplier: 1,
        visualSpeedMultiplier: 1,
        offlineRewardMultiplier: 1,
        nearCornerDistanceBonus: 0,
      },
    );
}
