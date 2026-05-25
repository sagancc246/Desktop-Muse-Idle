import type { Language } from '../types/game';

const copy = {
  ja: {
    settingsDescription: 'サウンド、表示効果、保存動作を調整できます。',
    resetConfirm: 'ゲーム進行データを初期化しますか？ 設定内容は保持されます。',
    resetDone: 'ゲーム進行データを初期化しました。',
    cancel: 'キャンセル',
    confirmReset: '初期化する',
    back: '戻る',
  },
  en: {
    settingsDescription: 'Adjust sound, visual effects, and save behavior.',
    resetConfirm: 'Reset game progress? Your settings will be kept.',
    resetDone: 'Game progress has been reset.',
    cancel: 'Cancel',
    confirmReset: 'Reset',
    back: 'Back',
  },
} as const;

export type LocalizationKey = keyof (typeof copy)['ja'];

export function localize(language: Language, key: LocalizationKey): string {
  return copy[language][key];
}
