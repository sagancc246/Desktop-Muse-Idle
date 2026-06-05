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
import type { MuseSkill, MuseSkillId } from '../types/game';

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
