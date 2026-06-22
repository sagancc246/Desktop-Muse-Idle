// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: masters/csv/upgrades.csv

import type { UpgradeMaster } from '../../masters/types';

export const upgrades = [
  {
    "baseCost": 25,
    "category": "bounce",
    "costGrowth": 1.45,
    "description": "Wall hit reward and tap boost growth",
    "effectBaseValue": 1,
    "effectMultiplierPerLevel": 2,
    "effectTarget": "bounceReward.multiplier",
    "effectType": "multiply",
    "effectValuePerLevel": 0.02,
    "enabled": true,
    "maxLevel": 10,
    "name": "Bounce Boost",
    "sortOrder": 10,
    "unlockRebootCount": 0,
    "unlockStageNumber": 1,
    "upgradeId": "bounce_boost"
  },
  {
    "baseCost": 40,
    "category": "speed",
    "costGrowth": 1.5,
    "description": "Muse speed multiplier",
    "effectBaseValue": 1,
    "effectMultiplierPerLevel": 1.2,
    "effectTarget": "speedTune.multiplier",
    "effectType": "multiply",
    "effectValuePerLevel": 0,
    "enabled": true,
    "maxLevel": 20,
    "name": "Speed Tune",
    "sortOrder": 20,
    "unlockRebootCount": 0,
    "unlockStageNumber": 1,
    "upgradeId": "speed_tune"
  },
  {
    "baseCost": 60,
    "category": "corner",
    "costGrowth": 1.55,
    "description": "Corner reward and assisted Corner Hit range",
    "effectBaseValue": 1,
    "effectMultiplierPerLevel": 1.5,
    "effectTarget": "cornerReward.multiplier",
    "effectType": "multiply",
    "effectValuePerLevel": 4,
    "enabled": true,
    "maxLevel": 10,
    "name": "Corner Sensor",
    "sortOrder": 30,
    "unlockRebootCount": 0,
    "unlockStageNumber": 2,
    "upgradeId": "corner_sensor"
  },
  {
    "baseCost": 120,
    "category": "reboot",
    "costGrowth": 1.8,
    "description": "Improve permanent reboot multiplier",
    "effectBaseValue": 0.03,
    "effectMultiplierPerLevel": 0,
    "effectTarget": "reboot.multiplierPerReboot",
    "effectType": "add",
    "effectValuePerLevel": 0.005,
    "enabled": true,
    "maxLevel": 10,
    "name": "REBOOT Core",
    "sortOrder": 40,
    "unlockRebootCount": 1,
    "unlockStageNumber": 3,
    "upgradeId": "reboot_core"
  }
] as const satisfies readonly UpgradeMaster[];
