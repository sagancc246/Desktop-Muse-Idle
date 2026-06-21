# Master CSV Workflow

Desktop Muse Idle keeps runtime master data in TypeScript today, and is adding a CSV pipeline for staged spreadsheet-friendly balancing.

## Current Scope

The first CSV-managed masters are:

- `masters/csv/balance.csv`
- `masters/csv/stages.csv`
- `masters/csv/enemies.csv`
- `masters/csv/stage_rewards.csv`

Generated TypeScript output is written to:

- `src/generated/masters/balance.generated.ts`
- `src/generated/masters/stages.generated.ts`
- `src/generated/masters/enemies.generated.ts`
- `src/generated/masters/stageRewards.generated.ts`

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

`stages.csv`, `enemies.csv`, and `stage_rewards.csv` are not connected to runtime yet. They are generated and validated in parallel until each runtime adapter is added intentionally.

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
