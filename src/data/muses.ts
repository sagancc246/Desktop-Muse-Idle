import type { Muse } from '../types/game';

export const muses: Muse[] = [
  {
    id: 'lumi',
    name: 'Lumi',
    iconAsset: 'lumi-orchid',
    unlocked: true,
    baseSpeed: 180,
    memoryMultiplier: 1,
    cornerMultiplier: 1,
    skill: {
      id: 'mirror_echo',
      name: 'Mirror Echo',
      type: 'clone',
      description: 'Creates a temporary echo with 50% rewards.',
      durationMs: 6_000,
      cooldownMs: 14_000,
      power: 0.5,
    },
  },
  {
    id: 'astra',
    name: 'Astra',
    iconAsset: 'astra-cyan',
    unlocked: true,
    baseSpeed: 205,
    memoryMultiplier: 1.2,
    cornerMultiplier: 0.9,
    skill: {
      id: 'star_accel',
      name: 'Star Accel',
      type: 'speed_up',
      description: 'Raises all Muse speed by 30%.',
      durationMs: 5_500,
      cooldownMs: 13_000,
      power: 0.3,
    },
  },
  {
    id: 'noir',
    name: 'Noir',
    iconAsset: 'noir-rose',
    unlocked: true,
    baseSpeed: 165,
    memoryMultiplier: 0.85,
    cornerMultiplier: 1.45,
    skill: {
      id: 'night_bloom',
      name: 'Night Bloom',
      type: 'grow',
      description: 'Grows to 1.5x size.',
      durationMs: 6_500,
      cooldownMs: 14_000,
      power: 0.5,
    },
  },
];

export const initialActiveMuseIds = ['lumi'];

export function getMuseById(museId: string): Muse | undefined {
  return muses.find((muse) => muse.id === museId);
}
