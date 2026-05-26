import { muses } from '../data/muses';
import { calculateSkillTreeMultiplier } from '../data/skillTree';
import type { Muse, MuseSkillState } from '../types/game';

export function createInitialSkillStates(): Record<string, MuseSkillState> {
  return Object.fromEntries(
    muses.map((muse) => [
      muse.id,
      {
        activeRemainingMs: 0,
        cooldownRemainingMs: 0,
      },
    ]),
  );
}

export function activateSkillState(
  skillStates: Record<string, MuseSkillState>,
  muse: Muse,
  unlockedSkillNodes: Record<string, number>,
): Record<string, MuseSkillState> {
  const durationMultiplier = calculateSkillTreeMultiplier(unlockedSkillNodes, 'skill_duration');
  const cooldownMultiplier = calculateSkillTreeMultiplier(unlockedSkillNodes, 'skill_cooldown');

  return {
    ...skillStates,
    [muse.id]: {
      activeRemainingMs: muse.skill.durationMs * durationMultiplier,
      cooldownRemainingMs: muse.skill.cooldownMs * cooldownMultiplier,
    },
  };
}

export function tickSkillStates(
  skillStates: Record<string, MuseSkillState>,
  deltaMs: number,
): Record<string, MuseSkillState> {
  let changed = false;
  const nextStates = Object.fromEntries(
    Object.entries(skillStates).map(([museId, skillState]) => {
      const activeRemainingMs = Math.max(0, skillState.activeRemainingMs - deltaMs);
      const cooldownRemainingMs = Math.max(0, skillState.cooldownRemainingMs - deltaMs);

      if (
        activeRemainingMs !== skillState.activeRemainingMs ||
        cooldownRemainingMs !== skillState.cooldownRemainingMs
      ) {
        changed = true;
      }

      return [museId, { activeRemainingMs, cooldownRemainingMs }];
    }),
  );

  return changed ? nextStates : skillStates;
}

export function isSkillActive(
  skillStates: Record<string, MuseSkillState>,
  museId: string,
): boolean {
  return (skillStates[museId]?.activeRemainingMs ?? 0) > 0;
}

export function getSkillScale(muse: Muse, isActive: boolean): number {
  return muse.skill.type === 'grow' && isActive ? 1 + muse.skill.power : 1;
}

export function getSkillSpeedMultiplier(muse: Muse, isActive: boolean): number {
  return muse.skill.type === 'speed_up' && isActive ? 1 + muse.skill.power : 1;
}

export function getCloneRewardMultiplier(muse: Muse): number {
  return muse.skill.type === 'clone' ? muse.skill.power : 1;
}
