# Master CSV Workflow

Desktop Muse Idle keeps runtime master data in TypeScript today, and is adding a CSV pipeline for staged spreadsheet-friendly balancing.

## Current Scope

The first CSV-managed masters are:

- `masters/csv/balance.csv`
- `masters/csv/stages.csv`
- `masters/csv/enemies.csv`
- `masters/csv/stage_rewards.csv`
- `masters/csv/upgrades.csv`

Generated TypeScript output is written to:

- `src/generated/masters/balance.generated.ts`
- `src/generated/masters/stages.generated.ts`
- `src/generated/masters/enemies.generated.ts`
- `src/generated/masters/stageRewards.generated.ts`
- `src/generated/masters/upgrades.generated.ts`

Do not edit generated files directly. Edit CSV, then regenerate.

## Workflow

1. Edit the spreadsheet source.
2. Export or copy the result into `masters/csv/`.
3. Run `npm run masters:build`.
4. Run `npm run verify:masters`.
5. Run `npm run build`.

`npm run build` also runs `masters:build` first so local builds do not accidentally use stale generated master files.

## Runtime Policy

Steam builds must not depend on Google Sheets or any external network source at runtime. The game should use checked-in TypeScript/generated data only.

Google Sheets API integration, automatic CSV download, Steam Workshop integration, and in-game master editing UI are intentionally out of scope for this phase.

## Migration Policy

`balance.csv` is connected to runtime through `src/masters/balance.ts`. The adapter normalizes generated values, clamps unsafe numbers, and keeps existing `src/data/balance.ts` export names stable for gameplay code.

`stages.csv` is connected to runtime through `src/masters/stages.ts` and `src/data/stages.ts`. The adapter keeps existing stage names, descriptions, and rewards from `src/data/stages.ts`, while CSV controls stage number, clear condition, defeat target, max active enemies, enemy HP multiplier, drop multiplier, and corner requirement.

`enemies.csv` is connected to runtime through `src/masters/enemies.ts` and `src/data/enemies.ts`. The adapter converts generated enemy rows into the existing runtime enemy shape, including HP, radius, hit cooldown, drop amount, color palette, and spawn weight.

`stage_rewards.csv` is connected to runtime through `src/masters/stageRewards.ts` and `src/data/stages.ts`. The adapter converts generated reward rows into existing stage `Reward` entries while preserving `rewardId`-based claim keys.

`upgrades.csv` is connected to runtime through `src/masters/upgrades.ts` and `src/data/upgrades.ts`. The adapter keeps existing upgrade IDs compatible with saves while allowing CSV control of names, descriptions, costs, growth rates, max levels, effect values, unlock conditions, enabled flags, and sort order.

The existing `src/data/*.ts` masters remain the source used by gameplay until each area is intentionally switched to generated adapters.

When migrating a master to CSV-backed runtime data:

- Keep IDs compatible with existing saves.
- Preserve reward claim keys.
- Add adapters if generated shape differs from current runtime shape.
- Keep `verify:masters` warning-free.
- Do not hide broken required data behind runtime fallback.

## CSV Notes

`balance.csv` uses dot-path keys, such as `cornerSensor.cornerZonePx`, and generates a nested `balanceConfig` object.

Runtime-connected balance areas:

- Muse tap speed boost values via the `bounceBoost.*` CSV section
- Speed Tune multiplier and safe speed reference values via `speedTune.*`
- Corner assist zone, Corner cooldown, and Corner Zone default visibility via `cornerSensor.*`
- Reboot requirement and multiplier reference values via `reboot.*`

Empty optional ID fields in `stage_rewards.csv` are treated as `undefined` in generated TypeScript.

Validation commands:

- `npm run verify:csv-masters`
- `npm run verify:masters`
- `npm run verify:balance-config`
- `npm run verify:stage-config`
- `npm run verify:enemy-stage-rewards`
- `npm run verify:upgrade-config`

Runtime-connected stage areas:

- Stage number and Stage HUD numbering via `stages.csv`
- Enemy defeat target for Stage Progress HUD and Stage Clear via `targetDefeatCount`
- Active enemy count via `maxActiveEnemies`
- Enemy HP scaling via `enemyHpMultiplier`
- MemoryDrop count scaling via `dropMultiplier`
- Corner requirement fallback/compatibility via `cornerRequirement`

Runtime-connected enemy areas:

- Enemy ID, name, radius, max HP, hit cooldown, drop amount, color, and spawn weight via `enemies.csv`
- Stage HP scaling still comes from `stages.csv` and is applied on top of enemy max HP
- Stage drop scaling still comes from `stages.csv` and is applied on top of enemy drop amount

Runtime-connected stage reward areas:

- Stage Clear reward entries via `stage_rewards.csv`
- Reward claim keys continue to use stable `stageId:rewardId` values
- Reward card display can use `rewardText`
- Unsupported future reward types remain validated/generated, but only existing runtime reward types are applied until their gameplay systems exist

Runtime-connected upgrade areas:

- Upgrade names, descriptions, base costs, cost growth, max levels, unlock stage/reboot requirements, enabled flags, and sort order via `upgrades.csv`
- Upgrade purchase cost uses `baseCost * costGrowth^currentLevel`
- Existing save levels remain keyed by stable upgrade IDs
- `balance.csv` provides base values, while `upgrades.csv` provides growth values layered on top
- Bounce Boost affects wall reward scaling and tap boost growth
- Speed Tune affects speed scaling
- Corner Sensor affects corner reward scaling and assisted Corner Zone size
- REBOOT Core affects reboot fragment multiplier growth

## Existing Behavior To Preserve

- Muse/slime bounce movement
- Wall Hit Memory rewards
- Corner Hit Memory rewards
- Assisted Corner Hit and Corner Zone visualization
- Multiple enemy display
- Enemy HP bars, contact damage, defeat, and respawn
- Enemy defeat Stage Clear progress and Stage Progress HUD
- Stage Clear rewards
- MemoryDrop spawn, falling, mouse collection, Muse contact collection, and HUD absorption reward
- Background tap Memory rewards
- Muse/slime tap speed boost
- Fullscreen titlebar reveal and fullscreen stability
- Native Wallpaper surface and Control View behavior
- Memory Slime temporary image display
