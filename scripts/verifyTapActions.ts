import assert from 'node:assert/strict';
import {
  backgroundTapCooldownMs,
  museTapCooldownMs,
  museTapDecayStepMs,
  museTapDurationMs,
  museTapMaxStacks,
  museTapSpeedMultiplierCap,
} from '../src/data/balance';
import { createInitialMuseTapStates } from '../src/data/muses';
import { createInitialSkillNodes } from '../src/data/skillTree';
import { createInitialCharacterSkillLevels } from '../src/data/skills';
import { createInitialUpgrades } from '../src/data/upgrades';
import {
  calculateBackgroundTapReward,
  calculateVisualSpeedMultiplier,
  getMuseTapSpeedMultiplier,
  getVisualSpeedCap,
} from '../src/game/rewardCalculator';
import {
  applyMuseTapBoost,
  canApplyMuseTapBoost,
  decideTapInput,
  expireMuseTapBoost,
  getActiveTapBoostStack,
} from '../src/game/tapActions';

const states = createInitialMuseTapStates();
let tapState = states.lumi;
const startedAt = 1_000;

assert.equal(getActiveTapBoostStack(tapState, startedAt), 0);
assert.equal(canApplyMuseTapBoost(tapState, startedAt), true);

tapState = applyMuseTapBoost(tapState, 'tap_lumi_01', startedAt);
assert.equal(tapState.isTapBoostActive, true);
assert.equal(tapState.tapBoostStack, 1);
assert.equal(canApplyMuseTapBoost(tapState, startedAt + museTapCooldownMs - 1), false);
assert.equal(canApplyMuseTapBoost(tapState, startedAt + museTapCooldownMs), true);

for (let index = 0; index < museTapMaxStacks + 3; index += 1) {
  tapState = applyMuseTapBoost(
    tapState,
    'tap_lumi_01',
    startedAt + museTapCooldownMs * (index + 1),
  );
}
assert.equal(tapState.tapBoostStack, museTapMaxStacks);
assert.equal(getActiveTapBoostStack(tapState, startedAt + museTapDurationMs - 1), museTapMaxStacks);

const decayingState = expireMuseTapBoost(tapState, tapState.tapBoostEndsAt + 1);
assert.equal(decayingState.isTapBoostActive, true);
assert.equal(decayingState.tapBoostStack, museTapMaxStacks - 1);
assert.equal(getActiveTapBoostStack(decayingState, tapState.tapBoostEndsAt + 1), museTapMaxStacks - 1);
const expiredState = expireMuseTapBoost(
  tapState,
  tapState.tapBoostEndsAt + museTapDecayStepMs * museTapMaxStacks + 1,
);
assert.equal(expiredState.isTapBoostActive, false);
assert.equal(expiredState.tapBoostStack, 0);
assert.equal(
  getActiveTapBoostStack(
    {
      isTapBoostActive: true,
      lastTapVoiceId: null,
      tapBoostEndsAt: startedAt + museTapDurationMs,
      tapBoostStack: Number.NaN,
      tapCooldownEndsAt: 0,
    },
    startedAt + 1,
  ),
  0,
);

const tapMultiplier = getMuseTapSpeedMultiplier('medium', museTapMaxStacks + 99);
assert.equal(Number.isFinite(tapMultiplier), true);
assert.equal(tapMultiplier > 1, true);
assert.equal(tapMultiplier <= museTapSpeedMultiplierCap, true);

const visualSpeed = calculateVisualSpeedMultiplier(
  createInitialUpgrades(),
  1,
  museTapMaxStacks + 99,
  'medium',
  createInitialCharacterSkillLevels(),
);
assert.equal(Number.isFinite(visualSpeed), true);
assert.equal(visualSpeed > 0, true);
assert.equal(visualSpeed <= getVisualSpeedCap('medium') * museTapSpeedMultiplierCap, true);

const backgroundReward = calculateBackgroundTapReward(
  createInitialUpgrades(),
  createInitialSkillNodes(),
  'medium',
  createInitialCharacterSkillLevels(),
);
assert.equal(Number.isFinite(backgroundReward), true);
assert.equal(backgroundReward >= 0, true);

assert.deepEqual(
  decideTapInput({
    hitCharacter: true,
    lastBackgroundTapAt: 0,
    now: backgroundTapCooldownMs + 1,
  }),
  {
    shouldGrantBackgroundReward: false,
    shouldTriggerCharacterBoost: true,
  },
);
assert.deepEqual(
  decideTapInput({
    hitCharacter: false,
    lastBackgroundTapAt: 1_000,
    now: 1_000 + backgroundTapCooldownMs - 1,
  }),
  {
    shouldGrantBackgroundReward: false,
    shouldTriggerCharacterBoost: false,
  },
);
assert.deepEqual(
  decideTapInput({
    hitCharacter: false,
    lastBackgroundTapAt: 1_000,
    now: 1_000 + backgroundTapCooldownMs,
  }),
  {
    shouldGrantBackgroundReward: true,
    shouldTriggerCharacterBoost: false,
  },
);

console.log(
  'Tap action verification passed: speed stack cap, cooldown, duration expiry, visual speed cap, background reward, and character/background tap separation.',
);
