# Master Data Validation

Run `npm run verify:masters` after adding or changing Stage, Reward, Muse, Skin, Background, Skill, Upgrade, or initial-state master data.

The command bundles `scripts/verifyMasters.ts` with the existing esbuild dependency and runs it as a Node-only validation script. It does not load React, PixiJS, Electron, or game UI components.

## Errors

Validation exits with code `1` when it finds:

- Duplicate Stage, Muse, Skin, Background, Skill, or Upgrade IDs.
- Duplicate Stage numbers derived from the current `stage-N` IDs.
- Invalid Stage goals or Reward shapes.
- Duplicate global `rewardId` values or generated Stage Reward claim keys.
- Missing Skin, Background, or Muse Reward targets.
- Invalid Muse default Skin or Skill references.
- Invalid Skin Muse references, rarity, unlock method, or default Skin relationship.
- Invalid UnlockCondition values or missing Stage references.
- Invalid initial unlocked, active, background, or equipped Skin references.
- A legacy Stage-claim migration result that differs from `scripts/__snapshots__/masterClaimMigration.snapshot.json`.

## Warnings

Warnings do not fail validation. Current warnings cover:

- Missing Skin and Background image files because runtime fallback rendering is supported.
- Capsule and Conversation references while their master files are not implemented.
- DLC references while DLC validation is not implemented.

## Claim Migration Snapshot

`scripts/__snapshots__/masterClaimMigration.snapshot.json` protects the fixed migration from legacy `claimedStageRewardIds` to Reward-level `claimedRewardIds`.

Do not update the legacy migration map or snapshot merely because a new Reward is added to an already-cleared Stage. New Rewards must remain unclaimed for existing players so the backfill Reward flow can grant them.

## Workflow

1. Update the relevant master data.
2. Run `npm run verify:masters`.
3. Fix all errors and review warnings.
4. Run `npm run verify:all` before committing.
