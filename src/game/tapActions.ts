import {
  backgroundTapCooldownMs,
  museTapCooldownMs,
  museTapDecayStepMs,
  museTapDurationMs,
  museTapMaxStacks,
} from '../data/balance';
import type { MuseTapState } from '../types/game';

export interface TapInputDecision {
  shouldGrantBackgroundReward: boolean;
  shouldTriggerCharacterBoost: boolean;
}

export function getActiveTapBoostStack(tapState: MuseTapState | undefined, now: number): number {
  if (!tapState) {
    return 0;
  }

  const stack = Number.isFinite(tapState.tapBoostStack) ? tapState.tapBoostStack : 0;
  const safeStack = Math.min(museTapMaxStacks, Math.max(0, Math.floor(stack)));

  if (now < tapState.tapBoostEndsAt) {
    return safeStack;
  }

  const decayedStacks = Math.floor((now - tapState.tapBoostEndsAt) / museTapDecayStepMs) + 1;
  return Math.max(0, safeStack - decayedStacks);
}

export function canApplyMuseTapBoost(tapState: MuseTapState | undefined, now: number): boolean {
  return tapState !== undefined && now >= tapState.tapCooldownEndsAt;
}

export function applyMuseTapBoost(
  tapState: MuseTapState,
  voiceId: string,
  now: number,
): MuseTapState {
  const currentStack = getActiveTapBoostStack(tapState, now);
  const nextStack = Math.min(museTapMaxStacks, currentStack + 1);

  return {
    isTapBoostActive: true,
    lastTapVoiceId: voiceId,
    tapBoostEndsAt: now + museTapDurationMs,
    tapBoostStack: nextStack,
    tapCooldownEndsAt: now + museTapCooldownMs,
  };
}

export function expireMuseTapBoost(tapState: MuseTapState, now: number): MuseTapState {
  const activeStack = getActiveTapBoostStack(tapState, now);

  return {
    ...tapState,
    isTapBoostActive: activeStack > 0,
    tapBoostEndsAt:
      activeStack > 0 && now >= tapState.tapBoostEndsAt
        ? now + museTapDecayStepMs
        : tapState.tapBoostEndsAt,
    tapBoostStack: activeStack,
  };
}

export function canGrantBackgroundTapReward(lastGrantedAt: number, now: number): boolean {
  return now - lastGrantedAt >= backgroundTapCooldownMs;
}

export function decideTapInput({
  hitCharacter,
  lastBackgroundTapAt,
  now,
}: {
  hitCharacter: boolean;
  lastBackgroundTapAt: number;
  now: number;
}): TapInputDecision {
  return {
    shouldGrantBackgroundReward:
      !hitCharacter && canGrantBackgroundTapReward(lastBackgroundTapAt, now),
    shouldTriggerCharacterBoost: hitCharacter,
  };
}
