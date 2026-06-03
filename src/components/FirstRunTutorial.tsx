import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { Language } from '../types/game';

interface TutorialStep {
  title: string;
  eyebrow: string;
  body: string;
  focus: string;
}

const tutorialSteps: Record<Language, TutorialStep[]> = {
  ja: [
    {
      eyebrow: 'STEP 1',
      title: 'Muse の動きを眺める',
      body: '中央のゲームエリアでは、出撃中のMuseが自動で跳ね続けます。壁に当たるたびにMemoryを獲得します。',
      focus: 'まずは上部のMemoryと、中央のMuseの動きを確認してください。',
    },
    {
      eyebrow: 'STEP 2',
      title: 'Corner Hit を狙う',
      body: '四隅の近くで反射するとCorner Hitになります。通常の壁ヒットより大きなMemoryとステージ進行を得られます。',
      focus: 'Corner Hit回数は上部とStagePanelで確認できます。',
    },
    {
      eyebrow: 'STEP 3',
      title: 'Upgrade で伸ばす',
      body: '左側のUpgradePanelでBounce Boost、Speed Tune、Corner Sensorを購入できます。',
      focus: 'Memoryが貯まったら、まずBounce Boostで壁ヒット報酬を伸ばすのが安定です。',
    },
    {
      eyebrow: 'STEP 4',
      title: 'Stage と背景を解放する',
      body: 'Stage目標のCorner Hit数に到達すると背景が解放されます。Galleryから獲得済み背景を確認して設定できます。',
      focus: '背景はゲームの眺め心地に直結する進行報酬です。',
    },
    {
      eyebrow: 'STEP 5',
      title: 'Tap、Reboot、Focus Mode',
      body: 'MuseをクリックするとMuse Tapが発動します。さらにMemoryを貯めてRebootすると、Fragmentで恒久強化を解放できます。',
      focus: '慣れてきたらMuse Tap、Skill Tree、Focus Modeを組み合わせて遊んでください。',
    },
  ],
  en: [
    {
      eyebrow: 'STEP 1',
      title: 'Watch the Muse bounce',
      body: 'The active Muse moves automatically inside the game area. Each wall bounce grants Memory.',
      focus: 'Start by watching the Memory value at the top and the Muse in the center.',
    },
    {
      eyebrow: 'STEP 2',
      title: 'Aim for Corner Hits',
      body: 'A bounce near one of the four corners becomes a Corner Hit. It grants more Memory and advances the current stage.',
      focus: 'Corner Hit progress appears in the top bar and StagePanel.',
    },
    {
      eyebrow: 'STEP 3',
      title: 'Upgrade the loop',
      body: 'Use the UpgradePanel on the left to buy Bounce Boost, Speed Tune, and Corner Sensor.',
      focus: 'When Memory builds up, Bounce Boost is the safest first upgrade.',
    },
    {
      eyebrow: 'STEP 4',
      title: 'Clear stages and unlock backgrounds',
      body: 'Reach the stage Corner Hit goal to unlock a background. Gallery lets you preview and set unlocked backgrounds.',
      focus: 'Backgrounds are progression rewards that change the feel of the game area.',
    },
    {
      eyebrow: 'STEP 5',
      title: 'Tap, Reboot, and Focus',
      body: 'Click a Muse to trigger Muse Tap. Later, Reboot converts progress into Fragments for permanent skill tree upgrades.',
      focus: 'Once comfortable, combine Muse Tap, Skill Tree, and Focus Mode.',
    },
  ],
};

interface FirstRunTutorialProps {
  language: Language;
  onComplete: () => void;
}

export function FirstRunTutorial({ language, onComplete }: FirstRunTutorialProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const tutorialCardRef = useRef<HTMLElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const steps = tutorialSteps[language];
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  useFocusTrap(tutorialCardRef);

  useEffect(() => {
    const timerId = window.setTimeout(() => nextButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(timerId);
  }, [stepIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onComplete();
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (isLastStep) {
          onComplete();
          return;
        }
        setStepIndex((currentStep) => Math.min(currentStep + 1, steps.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLastStep, onComplete, steps.length]);

  return (
    <div
      aria-describedby="tutorial-body tutorial-focus tutorial-key-hint"
      aria-labelledby="tutorial-title"
      aria-modal="true"
      className="tutorial-backdrop"
      role="dialog"
    >
      <section className="tutorial-card panel" ref={tutorialCardRef}>
        <div aria-label={`Tutorial step ${stepIndex + 1} of ${steps.length}`} className="tutorial-progress">
          {steps.map((tutorialStep, index) => (
            <span
              aria-hidden="true"
              className={index === stepIndex ? 'active' : ''}
              key={tutorialStep.title}
            />
          ))}
        </div>

        <p className="eyebrow">{step.eyebrow}</p>
        <h1 id="tutorial-title">{step.title}</h1>
        <p className="tutorial-body" id="tutorial-body">
          {step.body}
        </p>
        <p className="tutorial-focus" id="tutorial-focus">
          {step.focus}
        </p>

        <div className="tutorial-actions">
          <button className="tutorial-skip" onClick={onComplete} type="button">
            {language === 'ja' ? 'スキップ' : 'Skip'}
          </button>
          <button
            className="tutorial-back"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((currentStep) => Math.max(0, currentStep - 1))}
            type="button"
          >
            {language === 'ja' ? '戻る' : 'Back'}
          </button>
          <button
            className="tutorial-next"
            onClick={() => {
              if (isLastStep) {
                onComplete();
                return;
              }
              setStepIndex((currentStep) => Math.min(currentStep + 1, steps.length - 1));
            }}
            ref={nextButtonRef}
            type="button"
          >
            {isLastStep
              ? language === 'ja'
                ? 'ゲームを始める'
                : 'Start Playing'
              : language === 'ja'
                ? '次へ'
                : 'Next'}
          </button>
        </div>

        <p className="tutorial-key-hint" id="tutorial-key-hint">
          {language === 'ja' ? 'Enter: 次へ / Esc: スキップ' : 'Enter: Next / Esc: Skip'}
        </p>
      </section>
    </div>
  );
}
