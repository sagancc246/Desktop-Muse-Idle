import { enemyMasters as generatedEnemyMasters } from '../generated/masters/enemies.generated';
import {
  memoryBugDropCountMax,
  memoryBugDropCountMin,
  memoryBugHitCooldownMs,
  memoryBugMaxHp,
  memoryBugRadius,
} from '../data/balance';
import type { EnemyMaster as GeneratedEnemyMaster } from './types';

export interface RuntimeEnemyMaster {
  id: 'memory_bug' | string;
  name: string;
  radius: number;
  maxHp: number;
  hitCooldownMs: number;
  dropAmount: number;
  color: {
    body: number;
    core: number;
    glow: number;
    outline: number;
  };
  spawnWeight: number;
}

const fallbackEnemyMasters: readonly RuntimeEnemyMaster[] = [
  {
    id: 'memory_bug',
    name: 'Memory Bug',
    radius: memoryBugRadius,
    maxHp: memoryBugMaxHp,
    hitCooldownMs: memoryBugHitCooldownMs,
    dropAmount: Math.round((memoryBugDropCountMin + memoryBugDropCountMax) / 2),
    color: {
      body: 0x2a102f,
      core: 0x8d3a9f,
      glow: 0x66164e,
      outline: 0xd85cff,
    },
    spawnWeight: 1,
  },
];

function readPositiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function readNonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function parseHexColor(value: unknown, fallback: number): number {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return fallback;
  }

  return Number.parseInt(normalized, 16);
}

function mixColor(color: number, target: number, amount: number): number {
  const sourceR = (color >> 16) & 0xff;
  const sourceG = (color >> 8) & 0xff;
  const sourceB = color & 0xff;
  const targetR = (target >> 16) & 0xff;
  const targetG = (target >> 8) & 0xff;
  const targetB = target & 0xff;
  const mix = (source: number, destination: number) =>
    Math.max(0, Math.min(255, Math.round(source + (destination - source) * amount)));

  return (
    (mix(sourceR, targetR) << 16) |
    (mix(sourceG, targetG) << 8) |
    mix(sourceB, targetB)
  );
}

function createEnemyPalette(color: number, fallback: RuntimeEnemyMaster['color']) {
  return {
    body: mixColor(color, 0x000000, 0.72),
    core: mixColor(color, 0xffffff, 0.2),
    glow: mixColor(color, 0x000000, 0.42),
    outline: color || fallback.outline,
  };
}

function normalizeEnemyMaster(
  source: GeneratedEnemyMaster,
  fallback: RuntimeEnemyMaster,
): RuntimeEnemyMaster {
  const id =
    typeof source.enemyId === 'string' && source.enemyId.trim().length > 0
      ? source.enemyId.trim()
      : fallback.id;
  const outline = parseHexColor(source.color, fallback.color.outline);

  return {
    id,
    name:
      typeof source.name === 'string' && source.name.trim().length > 0
        ? source.name.trim()
        : fallback.name,
    radius: readPositiveNumber(source.radius, fallback.radius),
    maxHp: readPositiveNumber(source.maxHp, fallback.maxHp),
    hitCooldownMs: readNonNegativeNumber(source.hitCooldownMs, fallback.hitCooldownMs),
    dropAmount: readPositiveNumber(source.dropAmount, fallback.dropAmount),
    color: createEnemyPalette(outline, fallback.color),
    spawnWeight: readPositiveNumber(source.spawnWeight, fallback.spawnWeight),
  };
}

export function normalizeEnemyMasters(
  sourceEnemies: readonly GeneratedEnemyMaster[] = generatedEnemyMasters,
  fallbackEnemies: readonly RuntimeEnemyMaster[] = fallbackEnemyMasters,
): RuntimeEnemyMaster[] {
  const fallbackById = new Map(fallbackEnemies.map((enemy) => [enemy.id, enemy]));
  const normalized = sourceEnemies.map((enemy, index) => {
    const fallback =
      fallbackById.get(enemy.enemyId) ??
      fallbackEnemies[index] ??
      fallbackEnemies[0];

    return normalizeEnemyMaster(enemy, fallback);
  });

  return normalized.length > 0 ? normalized : fallbackEnemies.map((enemy) => ({ ...enemy }));
}

export const enemyMasters = normalizeEnemyMasters();

export const defaultEnemyTypeId = enemyMasters[0]?.id ?? 'memory_bug';

export function getEnemyMasterById(enemyId: string): RuntimeEnemyMaster | undefined {
  return enemyMasters.find((enemy) => enemy.id === enemyId);
}

export function getEnemyMaster(enemyId: string): RuntimeEnemyMaster {
  return getEnemyMasterById(enemyId) ?? enemyMasters[0] ?? fallbackEnemyMasters[0];
}
