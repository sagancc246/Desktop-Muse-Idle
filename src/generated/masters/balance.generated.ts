// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source: masters/csv/balance.csv

import type { BalanceConfig, BalanceCsvRow } from '../../masters/types';

export const balanceRows = [
  {
    "description": "Temporary speed multiplier added per Muse tap stack.",
    "key": "bounceBoost.tapBoostAdd",
    "type": "number",
    "value": "0.12"
  },
  {
    "description": "Maximum additional temporary Muse tap speed multiplier.",
    "key": "bounceBoost.maxTemporaryBoost",
    "type": "number",
    "value": "1"
  },
  {
    "description": "Muse tap boost active duration in milliseconds.",
    "key": "bounceBoost.decayDurationMs",
    "type": "number",
    "value": "1800"
  },
  {
    "description": "Muse tap boost stack decay step in milliseconds.",
    "key": "bounceBoost.decayStepMs",
    "type": "number",
    "value": "260"
  },
  {
    "description": "Reserved visual pulse scale for Muse tap feedback.",
    "key": "bounceBoost.visualPulseScale",
    "type": "number",
    "value": "1.08"
  },
  {
    "description": "Temporary speed multiplier applied per Muse tap stack.",
    "key": "museTap.speedPerStack",
    "type": "number",
    "value": "1.12"
  },
  {
    "description": "Maximum temporary Muse tap speed stacks.",
    "key": "museTap.maxStacks",
    "type": "number",
    "value": "8"
  },
  {
    "description": "Muse tap boost duration in milliseconds.",
    "key": "museTap.durationMs",
    "type": "number",
    "value": "1800"
  },
  {
    "description": "Minimum interval between Muse tap boosts in milliseconds.",
    "key": "museTap.cooldownMs",
    "type": "number",
    "value": "50"
  },
  {
    "description": "Maximum temporary Muse tap speed multiplier.",
    "key": "museTap.speedMultiplierCap",
    "type": "number",
    "value": "2"
  },
  {
    "description": "Default starter Muse base speed reference.",
    "key": "speedTune.baseSpeed",
    "type": "number",
    "value": "180"
  },
  {
    "description": "Minimum safe speed reference.",
    "key": "speedTune.minSpeed",
    "type": "number",
    "value": "120"
  },
  {
    "description": "Normal visual speed cap reference.",
    "key": "speedTune.maxSpeed",
    "type": "number",
    "value": "720"
  },
  {
    "description": "Tap boosted safe speed cap reference.",
    "key": "speedTune.tapBoostMaxSpeed",
    "type": "number",
    "value": "980"
  },
  {
    "description": "Speed Tune upgrade multiplier per level.",
    "key": "speedTune.upgradeMultiplier",
    "type": "number",
    "value": "1.2"
  },
  {
    "description": "Visual speed cap for low motion.",
    "key": "speedTune.visualSpeedMultiplierMaxLow",
    "type": "number",
    "value": "1.6"
  },
  {
    "description": "Visual speed cap for medium motion.",
    "key": "speedTune.visualSpeedMultiplierMaxMedium",
    "type": "number",
    "value": "2.2"
  },
  {
    "description": "Visual speed cap for high motion.",
    "key": "speedTune.visualSpeedMultiplierMaxHigh",
    "type": "number",
    "value": "3"
  },
  {
    "description": "Assisted Corner Hit zone in pixels.",
    "key": "cornerSensor.cornerZonePx",
    "type": "number",
    "value": "32"
  },
  {
    "description": "Corner Hit reward cooldown in milliseconds.",
    "key": "cornerSensor.cornerHitCooldownMs",
    "type": "number",
    "value": "600"
  },
  {
    "description": "Default Corner Zone debug overlay visibility.",
    "key": "cornerSensor.showCornerZonesDefault",
    "type": "boolean",
    "value": "false"
  },
  {
    "description": "Memory required for the current Reboot loop.",
    "key": "reboot.baseRequirement",
    "type": "number",
    "value": "100000"
  },
  {
    "description": "Reserved Reboot requirement growth rate for CSV balancing.",
    "key": "reboot.requirementGrowth",
    "type": "number",
    "value": "1.8"
  },
  {
    "description": "Reserved base permanent Reboot multiplier.",
    "key": "reboot.basePermanentMultiplier",
    "type": "number",
    "value": "0.05"
  },
  {
    "description": "Reserved additional permanent multiplier per Reboot.",
    "key": "reboot.multiplierPerReboot",
    "type": "number",
    "value": "0.03"
  }
] as const satisfies readonly BalanceCsvRow[];

export const balanceConfig = {
  "bounceBoost": {
    "tapBoostAdd": 0.12,
    "maxTemporaryBoost": 1,
    "decayDurationMs": 1800,
    "decayStepMs": 260,
    "visualPulseScale": 1.08
  },
  "museTap": {
    "speedPerStack": 1.12,
    "maxStacks": 8,
    "durationMs": 1800,
    "cooldownMs": 50,
    "speedMultiplierCap": 2
  },
  "speedTune": {
    "baseSpeed": 180,
    "minSpeed": 120,
    "maxSpeed": 720,
    "tapBoostMaxSpeed": 980,
    "upgradeMultiplier": 1.2,
    "visualSpeedMultiplierMaxLow": 1.6,
    "visualSpeedMultiplierMaxMedium": 2.2,
    "visualSpeedMultiplierMaxHigh": 3
  },
  "cornerSensor": {
    "cornerZonePx": 32,
    "cornerHitCooldownMs": 600,
    "showCornerZonesDefault": false
  },
  "reboot": {
    "baseRequirement": 100000,
    "requirementGrowth": 1.8,
    "basePermanentMultiplier": 0.05,
    "multiplierPerReboot": 0.03
  }
} as const satisfies BalanceConfig;
