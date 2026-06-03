import { vegaBumperCooldownMs, vegaBumperDurationMs } from './balance';
import type { MuseSkill } from '../types/game';

export const vegaBumperSkill: MuseSkill = {
  id: 'muse_bumper',
  name: 'Muse Bumper',
  type: 'bumper',
  description: 'Vega becomes a moving bumper. Muses that hit Vega bounce outward.',
  durationMs: vegaBumperDurationMs,
  cooldownMs: vegaBumperCooldownMs,
  power: 1,
};
