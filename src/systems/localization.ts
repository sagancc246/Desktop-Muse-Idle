import type { Language } from '../types/game';

const copy = {
  ja: {
    settingsDescription: 'サウンド、演出、保存、操作補助を調整できます。',
    resetConfirm: 'ゲーム進行データを初期化しますか？設定内容は保持されます。',
    resetDone: 'ゲーム進行データを初期化しました。',
    cancel: 'キャンセル',
    confirmReset: '初期化する',
    back: '戻る',
    showTutorial: 'チュートリアルを表示',
    showTutorialHelp: '基本操作をもう一度確認します。選択するとゲーム画面でチュートリアルが開きます。',
    open: '開く',
  },
  en: {
    settingsDescription: 'Adjust sound, visual effects, saving, and accessibility helpers.',
    resetConfirm: 'Reset game progress? Your settings will be kept.',
    resetDone: 'Game progress has been reset.',
    cancel: 'Cancel',
    confirmReset: 'Reset',
    back: 'Back',
    showTutorial: 'Show Tutorial',
    showTutorialHelp: 'Review the basic controls. Selecting this opens the tutorial on the game screen.',
    open: 'Open',
  },
} as const;

export type LocalizationKey = keyof (typeof copy)['ja'];

export function localize(language: Language, key: LocalizationKey): string {
  return copy[language][key];
}
