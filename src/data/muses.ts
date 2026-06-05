import { getSkillById } from './skills';
import type { Muse } from '../types/game';

export const muses: Muse[] = [
  {
    id: 'lumi',
    name: 'Lumi',
    description: 'A gentle starter Muse who creates short-lived echoes on Corner Hit.',
    iconAsset: 'lumi-orchid',
    defaultSkinId: 'lumi_default',
    skillId: 'clone',
    defaultUnlocked: true,
    unlockCondition: { type: 'initial' },
    baseSpeed: 180,
    memoryMultiplier: 1,
    cornerMultiplier: 1,
    skill: getSkillById('clone'),
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
        subtitleJa: 'もっと跳ねるよ。',
        subtitleEn: 'I will bounce higher!',
      },
    ],
  },
  {
    id: 'astra',
    name: 'Astra',
    description: 'A high-tempo Muse who accelerates the whole field for a short burst.',
    iconAsset: 'astra-cyan',
    defaultSkinId: 'astra_default',
    skillId: 'speed_up',
    defaultUnlocked: false,
    unlockCondition: { type: 'stage_clear', targetId: 'stage-2' },
    baseSpeed: 205,
    memoryMultiplier: 1.2,
    cornerMultiplier: 0.9,
    skill: getSkillById('speed_up'),
    tapVoices: [
      {
        id: 'tap_astra_01',
        audioPath: '/assets/voices/tap_astra_01.ogg',
        subtitleJa: '加速するよ。',
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
    description: 'A late-game Muse who grows larger and turns precise corners into big rewards.',
    iconAsset: 'noir-rose',
    defaultSkinId: 'noir_default',
    skillId: 'giant',
    defaultUnlocked: false,
    unlockCondition: { type: 'stage_clear', targetId: 'stage-4' },
    baseSpeed: 165,
    memoryMultiplier: 0.85,
    cornerMultiplier: 1.45,
    skill: getSkillById('giant'),
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
  {
    id: 'vega',
    name: 'Vega',
    description: 'A kinetic Muse who becomes a moving bumper and redirects nearby trajectories.',
    iconAsset: 'vega-gold',
    defaultSkinId: 'vega_default',
    skillId: 'muse_bumper',
    defaultUnlocked: false,
    unlockCondition: { type: 'stage_clear', targetId: 'stage-5' },
    baseSpeed: 188,
    memoryMultiplier: 1,
    cornerMultiplier: 1.1,
    skill: getSkillById('muse_bumper'),
    tapVoices: [
      {
        id: 'tap_vega_01',
        audioPath: '/assets/voices/tap_vega_01.ogg',
        subtitleJa: 'ラインを変えるよ。',
        subtitleEn: 'Changing the line.',
      },
      {
        id: 'tap_vega_02',
        audioPath: '/assets/voices/tap_vega_02.ogg',
        subtitleJa: 'バンパー起動。',
        subtitleEn: 'Bumper online.',
      },
      {
        id: 'tap_vega_03',
        audioPath: '/assets/voices/tap_vega_03.ogg',
        subtitleJa: '角へ送るよ。',
        subtitleEn: 'Sending you cornerward.',
      },
    ],
  },
];

export const initialUnlockedMuseIds = muses
  .filter((muse) => muse.defaultUnlocked)
  .map((muse) => muse.id);

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
