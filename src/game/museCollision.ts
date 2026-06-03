import {
  vegaBumperMaxVelocity,
  vegaBumperMinSeparation,
  vegaBumperPairCooldownMs,
  vegaBumperRadiusMultiplier,
  vegaBumperVelocityBoost,
} from '../data/balance';
import { clampPositionToBounds, getCollisionLimits } from './cornerHitDetector';
import type { ArenaBounds, BounceBody } from './bouncePhysics';

export interface BumperCollisionMuse {
  body: BounceBody;
  isClone: boolean;
  museId: string;
  runtimeId: string;
}

export interface VegaBumperCollisionResult {
  canReward: boolean;
  targetIsClone: boolean;
  targetMuseId: string;
  targetRuntimeId: string;
}

interface HandleVegaBumperCollisionsParams {
  bounds: ArenaBounds;
  lastRewardAtByPair: Map<string, number>;
  now: number;
  others: BumperCollisionMuse[];
  vega: BumperCollisionMuse;
}

function getPairKey(museRuntimeId: string, vegaRuntimeId: string): string {
  return `${vegaRuntimeId}::${museRuntimeId}`;
}

function getSpeed(body: BounceBody): number {
  return Math.hypot(body.vx, body.vy);
}

function limitVelocity(body: BounceBody): void {
  const speed = getSpeed(body);
  const maxVelocityPerSecond = vegaBumperMaxVelocity * 60;

  if (speed <= maxVelocityPerSecond || speed <= 0) {
    return;
  }

  body.vx = (body.vx / speed) * maxVelocityPerSecond;
  body.vy = (body.vy / speed) * maxVelocityPerSecond;
}

export function isCollidingWithVega(muse: BumperCollisionMuse, vega: BumperCollisionMuse): boolean {
  const bumperRadius = vega.body.radius * vegaBumperRadiusMultiplier;
  return Math.hypot(muse.body.x - vega.body.x, muse.body.y - vega.body.y) <= muse.body.radius + bumperRadius;
}

export function canRewardVegaBumperCollision(
  museRuntimeId: string,
  vegaRuntimeId: string,
  now: number,
  lastRewardAtByPair: Map<string, number>,
): boolean {
  const pairKey = getPairKey(museRuntimeId, vegaRuntimeId);
  const lastRewardAt = lastRewardAtByPair.get(pairKey) ?? 0;

  if (now - lastRewardAt < vegaBumperPairCooldownMs) {
    return false;
  }

  lastRewardAtByPair.set(pairKey, now);
  return true;
}

export function resolveVegaBumperCollision(
  muse: BumperCollisionMuse,
  vega: BumperCollisionMuse,
  bounds: ArenaBounds,
): void {
  const bumperRadius = vega.body.radius * vegaBumperRadiusMultiplier;
  const minDistance = muse.body.radius + bumperRadius + vegaBumperMinSeparation;
  const dx = muse.body.x - vega.body.x;
  const dy = muse.body.y - vega.body.y;
  const distance = Math.hypot(dx, dy) || 1;
  const normalX = dx / distance;
  const normalY = dy / distance;
  const overlap = Math.max(0, minDistance - distance);
  const musePush = overlap * 0.78;
  const vegaPush = overlap * 0.22;
  const museLimits = getCollisionLimits(bounds, muse.body.radius);
  const vegaLimits = getCollisionLimits(bounds, vega.body.radius);
  const musePosition = clampPositionToBounds(
    {
      x: muse.body.x + normalX * musePush,
      y: muse.body.y + normalY * musePush,
    },
    museLimits,
  );
  const vegaPosition = clampPositionToBounds(
    {
      x: vega.body.x - normalX * vegaPush,
      y: vega.body.y - normalY * vegaPush,
    },
    vegaLimits,
  );
  const targetSpeed = Math.max(getSpeed(muse.body), getSpeed(vega.body), 1) * vegaBumperVelocityBoost;

  muse.body.x = musePosition.x;
  muse.body.y = musePosition.y;
  muse.body.vx = normalX * targetSpeed;
  muse.body.vy = normalY * targetSpeed;
  vega.body.x = vegaPosition.x;
  vega.body.y = vegaPosition.y;
  vega.body.vx -= normalX * targetSpeed * 0.08;
  vega.body.vy -= normalY * targetSpeed * 0.08;
  limitVelocity(muse.body);
  limitVelocity(vega.body);
}

export function handleVegaBumperCollisions({
  bounds,
  lastRewardAtByPair,
  now,
  others,
  vega,
}: HandleVegaBumperCollisionsParams): VegaBumperCollisionResult[] {
  const results: VegaBumperCollisionResult[] = [];

  for (const muse of others) {
    if (muse.runtimeId === vega.runtimeId || !isCollidingWithVega(muse, vega)) {
      continue;
    }

    resolveVegaBumperCollision(muse, vega, bounds);
    results.push({
      canReward: canRewardVegaBumperCollision(
        muse.runtimeId,
        vega.runtimeId,
        now,
        lastRewardAtByPair,
      ),
      targetIsClone: muse.isClone,
      targetMuseId: muse.museId,
      targetRuntimeId: muse.runtimeId,
    });
  }

  return results;
}
