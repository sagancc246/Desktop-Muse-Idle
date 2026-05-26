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
    tapVoices: [
      {
        id: 'tap_lumi_01',
        audioPath: '/assets/voices/tap_lumi_01.ogg',
        subtitleJa: '見ていてね。',
        subtitleEn: 'Keep watching.',
      },
      {
        id: 'tap_lumi_02',
        audioPath: '/assets/voices/tap_lumi_02.ogg',
        subtitleJa: 'いくよっ。',
        subtitleEn: 'Here I go.',
      },
      {
        id: 'tap_lumi_03',
        audioPath: '/assets/voices/tap_lumi_03.ogg',
        subtitleJa: 'もっと跳ねるね！',
        subtitleEn: 'I will bounce higher!',
      },
    ],
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
    tapVoices: [
      {
        id: 'tap_astra_01',
        audioPath: '/assets/voices/tap_astra_01.ogg',
        subtitleJa: '加速する。',
        subtitleEn: 'Accelerating.',
      },
      {
        id: 'tap_astra_02',
        audioPath: '/assets/voices/tap_astra_02.ogg',
        subtitleJa: '軌道、調整完了。',
        subtitleEn: 'Trajectory adjusted.',
      },
      {
        id: 'tap_astra_03',
        audioPath: '/assets/voices/tap_astra_03.ogg',
        subtitleJa: '星を追い越すよ。',
        subtitleEn: 'Passing the stars.',
      },
    ],
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
    tapVoices: [
      {
        id: 'tap_noir_01',
        audioPath: '/assets/voices/tap_noir_01.ogg',
        subtitleJa: '逃さない。',
        subtitleEn: 'I will not miss.',
      },
      {
        id: 'tap_noir_02',
        audioPath: '/assets/voices/tap_noir_02.ogg',
        subtitleJa: '静かに、速く。',
        subtitleEn: 'Quietly, swiftly.',
      },
      {
        id: 'tap_noir_03',
        audioPath: '/assets/voices/tap_noir_03.ogg',
        subtitleJa: '角を狙うわ。',
        subtitleEn: 'Aiming for the corner.',
      },
    ],
  },
];

export const initialActiveMuseIds = ['lumi'];

export function getMuseById(museId: string): Muse | undefined {
  return muses.find((muse) => muse.id === museId);
}

export function createInitialMuseTapStates() {
  return Object.fromEntries(
    muses.map((muse) => [
      muse.id,
      {
        isTapBoostActive: false,
        tapBoostEndsAt: 0,
        tapCooldownEndsAt: 0,
        lastTapVoiceId: null,
      },
    ]),
  );
}
