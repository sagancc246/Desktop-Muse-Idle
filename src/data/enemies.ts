import {
  memoryBugDropCountMax,
  memoryBugDropCountMin,
  memoryBugHitCooldownMs,
  memoryBugMaxHp,
  memoryBugRadius,
} from './balance';

export interface EnemyMaster {
  id: 'memory_bug';
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

export const defaultEnemyTypeId = 'memory_bug';

export const enemyMasters: EnemyMaster[] = [
  {
    id: defaultEnemyTypeId,
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

export function getEnemyMasterById(enemyId: string): EnemyMaster | undefined {
  return enemyMasters.find((enemy) => enemy.id === enemyId);
}
