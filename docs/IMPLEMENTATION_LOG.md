# Desktop Muse Idle Implementation Log

## Project Summary

Desktop Muse Idle is a small idle game built with React, TypeScript, Vite, PixiJS, Zustand, and a future Electron target.

The core loop is to watch Muse icons bounce inside a fixed 1920x1080 stage, earn Memory from wall hits, and earn larger rewards from true Corner Hits. Stage clears unlock backgrounds and skins, Reboot grants Fragments, and Fragments are spent on permanent Skill Tree upgrades.

The project also has foundations for Wallpaper Stage Mode, Muse Overlay Mode, and future Electron desktop mascot behavior.

## Implemented In This Thread

### Core Progression

- Stage progression with per-stage Corner Hit goals.
- Stage clear rewards for backgrounds and skins.
- Stage clear overlay and reward feedback.
- Background gallery with locked/unlocked states and preview modal.
- Current background selection and save/load restoration.
- Non-default skin unlock flow through stage rewards and the development Debug Panel.
- Stage 2 cozy room background asset replacement.

### Muse Systems

- Multiple active Muses, up to three at once.
- Muse data for Lumi, Astra, Noir, and Vega.
- Muse unlock conditions tied to stage progression.
- Muse unlock modal.
- Muse Panel active/locked display.
- Muse Tap with cooldown, temporary boost, direction shift, subtitle/voice fallback, and tap effects.
- Character skills:
  - Clone.
  - Grow.
  - Speed Up.
  - Vega Muse Bumper.
- Clone safety spawning, clone lifetime, clone rewards, and clone Corner Hit support.
- Vega Bumper collision is limited to Vega versus other active Muses/clones.

### Collision And Rewards

- Fixed-stage collision based on 1920x1080 logical coordinates.
- Strict Corner Hit detection: only same-frame X-wall and Y-wall contact counts.
- Near Corner detection separated from true Corner Hit.
- Corner Sensor redefined to affect Near Corner guidance, not Corner Hit leniency.
- Reward calculator updates for upgrades, Skill Tree effects, clone multipliers, Muse Tap, and offline rewards.
- Jackpot/Fever-compatible effect hooks and stats tracking.

### Reboot And Skill Tree

- Reboot with Fragment gain.
- Skill Tree categories:
  - Bounce.
  - Corner.
  - Muse.
- Skill unlock costs, prerequisites, levels, and persistent unlock state.
- Passive Cache and offline reward integration.

### UI And App Flow

- Fixed 1920x1080 stage layout with browser-size scaling.
- Title screen with Start, Continue, Settings, Gallery, Credits, Stats, and Quit placeholder.
- Settings screen for audio, language, effects quality, motion intensity, auto-save, reset, stats, tutorial replay, and Wallpaper settings.
- ResourceBar controls for Save, Settings, Stats, Focus, and Wallpaper modes.
- Focus Mode with minimal HUD.
- Wallpaper Mode shared state.
- Wallpaper Stage Mode with minimal HUD.
- Muse Overlay Mode web preview with minimal HUD placeholder.
- Stats Panel for accumulated play statistics.
- Debug Panel with development-only helpers.
- Debug collision tools for Vega Bumper, Clone Corner, Near Corner, and collision state inspection.
- First-run tutorial with replay from Settings.
- Keyboard accessibility pass and focus traps for major modals.
- Hidden tab rendering suppression and resume handling.

### Effects And Presentation

- Corner Hit screen flash, corner glow, ring, floating text, and HUD pulse.
- Motion Intensity low-mode reductions for effects.
- CSS-only Neon Background glow.
- CSS-only Pinball Background animation and corner flash.
- Asset fallback behavior for missing background and Muse assets.
- Asset rules and ledger documentation for future replacement work.

### Save And Settings

- Game progress save/load through LocalStorage.
- Manual Save from ResourceBar and Settings.
- Save status toast:
  - Saving...
  - Saved!
  - Save Failed
- Last saved timestamp.
- 10-second auto-save preserved.
- Save migration and default field completion for newer fields.
- Skin ownership and equipped skin persistence.
- Muse unlock and active Muse persistence.
- Stats persistence.
- Wallpaper settings persistence in a separate key:
  - `desktopMuseIdle.wallpaperSettings`
- `wallpaperMode` itself is intentionally not persisted.

### Platform Boundary

- Platform adapter stubs for future Electron overlay behavior:
  - Always on top.
  - Click through.
  - Transparent window.
  - Enter/exit overlay mode.
- Web/local and Steam adapters are safe no-op implementations for now.

## Main Files Changed Or Added

- `src/App.tsx`
- `src/components/GameCanvas.tsx`
- `src/store/useGameStore.ts`
- `src/store/useAppStore.ts`
- `src/systems/saveSystem.ts`
- `src/systems/settingsSystem.ts`
- `src/systems/settingsStorage.ts`
- `src/types/game.ts`
- `src/data/balance.ts`
- `src/data/muses.ts`
- `src/data/stages.ts`
- `src/data/backgrounds.ts`
- `src/data/skins.ts`
- `src/data/skills.ts`
- `src/data/skillTree.ts`
- `src/game/*`
- `src/effects/*`
- `src/components/*Panel.tsx`
- `src/components/*Modal.tsx`
- `src/components/*Toast.tsx`
- `src/platform/*`
- `src/styles/panels.css`
- `src/styles/layout.css`
- `src/styles/globals.css`
- `README.md`
- `TODO.md`
- `docs/ASSET_LEDGER.md`

## Current Repository State

- Active branch: `codex/desktop-muse-features`.
- Previous feature commit before this handoff documentation pass: `e567d01` (`Update desktop muse idle features`).
- `npm run build` passed after the manual save work.
- Local dev server responded with `200 OK` at `http://127.0.0.1:5173/` during the last verification.

## Remaining Warnings

- Vite build warns that one generated chunk is larger than 500 kB.
- Git prints a permission warning for `C:\Users\81802/.config/git/ignore` in this environment.
- Git also prints normal Windows CRLF conversion warnings.
- `gh` CLI is not installed, so PR creation was not done from Codex.

## Known Risks Or Unverified Areas

- Long-duration Wallpaper Stage Mode and Muse Overlay Mode performance needs hands-on testing.
- Vega Bumper, Clone Corner, Near Corner, Jackpot, and Fever interactions need more gameplay regression checks.
- Old LocalStorage save variants should be tested more thoroughly.
- Electron-specific behavior is not implemented yet; only adapter stubs exist.
- In-app browser automation previously failed in this environment, so some UI checks were manual/procedural rather than automated.

## Priority 1 Regression Verification

- Added `scripts/priority1-regression.cjs` for repeatable Electron-based UI regression checks against the local Vite dev server.
- Added `npm run verify:priority1` as the command wrapper for the regression script.
- Verified the title-to-game flow:
  - Start.
  - Continue.
  - Settings.
  - Gallery.
  - Credits.
  - Stats.
  - Quit placeholder.
- Verified manual save from ResourceBar and Settings, including Last Saved update.
- Verified `Saved!` and forced `Save Failed` toast paths.
- Verified save reload for Memory, Stage, backgrounds, Muses, skins, stats, and Skill Tree fields.
- Verified 10-second auto-save persists changed Memory.
- Verified Wallpaper settings persist through `desktopMuseIdle.wallpaperSettings` and remain separate from game progress.
- Verified reload after Wallpaper Stage Mode and Muse Overlay Mode starts with `wallpaperMode` back to `off`.
- `npm.cmd run build` passed after the verification work; the existing Vite large chunk warning remains.

## Priority 2 Collision And Reward Verification

- Added `scripts/priority2-collision-reward.cjs` for repeatable Electron/Vite collision and reward checks.
- Added `npm run verify:priority2` as the command wrapper for the Priority 2 verification script.
- Reviewed the relevant collision and reward implementation:
  - `src/game/cornerHitDetector.ts`
  - `src/game/bouncePhysics.ts`
  - `src/game/rewardCalculator.ts`
  - `src/game/skillEffects.ts`
  - `src/game/museCollision.ts`
  - `src/components/GameCanvas.tsx`
  - `src/store/useGameStore.ts`
- Verified true Corner Hit is still `hitXWall && hitYWall` in the same collision step.
- Verified wall-only near-corner contact is Near Corner feedback and does not become Corner Hit.
- Verified Near Corner does not increment `totalCornerHits` or current `stageCornerHits`.
- Verified Corner Sensor increases Near Corner distance only; it does not widen true Corner Hit detection.
- Verified clone wall and clone Corner reward multipliers are reduced in the reward helpers.
- Verified runtime clone Corner collision increments Corner Hit and stage progress exactly once.
- Verified clones do not create additional clones from clone Corner Hits.
- Verified Vega Bumper reward uses the bumper reward path and does not increment Corner Hit count or stage progress.
- Verified Vega Bumper pair cooldown blocks repeated rewards for the same Vega/target pair.
- No implementation fix was required during this pass.

## Priority 3 Save Migration Verification

- Extended `scripts/verify-save-migrations.mjs` for repeatable save migration and reset-boundary checks.
- Added `npm run verify:priority3` as the command wrapper for the save migration verification script.
- Reviewed the relevant save, settings, and reset implementation:
  - `src/systems/saveSystem.ts`
  - `src/systems/settingsSystem.ts`
  - `src/systems/settingsStorage.ts`
  - `src/store/useGameStore.ts`
  - `src/data/skins.ts`
- Verified empty LocalStorage loads a fresh default game state and reports no save data.
- Verified malformed game save JSON falls back to a fresh state and removes the invalid game save key.
- Verified old saves with missing stats, Muse, skin, and newer progression fields are restored with safe defaults.
- Verified invalid skin ownership/equipped skin IDs fall back to default unlocked/equipped skins.
- Verified saved app settings and legacy settings still migrate correctly.
- Verified malformed and invalid wallpaper settings fall back through the existing wallpaper settings normalizer.
- Verified legacy wallpaper settings can still be loaded from the app settings key when the dedicated wallpaper key is absent.
- Verified the Reset Save Data storage boundary by confirming `clearSaveData()` removes only game progress and leaves app/wallpaper settings intact.
- Verified persisted game save payloads do not include `wallpaperMode` or `wallpaperSettings`.
- No game implementation fix was required during this pass.

## Bundle Chunk Splitting

- Addressed the Vite build warning where the main `index` chunk exceeded 500 kB.
- Changed `App.tsx` to lazy-load non-initial screens and heavy runtime views:
  - Settings.
  - Gallery.
  - Credits.
  - Stats.
  - Debug Panel.
  - GameCanvas.
- Added focused Rollup manual chunks in `vite.config.ts` for:
  - React vendor code.
  - Zustand vendor code.
  - Other non-Pixi vendor code.
- Left PixiJS on Vite/Rollup's automatic split path after confirming aggressive manual Pixi splitting caused circular chunk warnings.
- `npm.cmd run build` now completes without the 500 kB chunk warning.
- Current largest build chunks after splitting:
  - `GameCanvas`: about 302.86 kB.
  - `react-vendor`: about 142.92 kB.
  - `index`: about 76.47 kB.
- Re-ran `npm.cmd run verify:priority1`, `npm.cmd run verify:priority2`, and `npm.cmd run verify:priority3`; all passed.

## Priority 5-A Lazy UI Loading

- Lazy-loaded the remaining heavy on-demand UI:
  - `SkillTreePanel`
  - `SkinSelectorModal`
- Added lightweight fixed-stage loading fallbacks for lazy-loaded screens and modal panels.
- Updated the Priority 1 regression script to verify the lazy-loaded Skin Selector opens and can equip an unlocked skin.
- Build comparison for the lazy UI pass:
  - Before: main `index` about 76.47 kB, with Skill Tree and Skin Selector included in parent chunks.
  - After: main `index` about 73.64 kB, `SkillTreePanel` about 1.90 kB, and `SkinSelectorModal` about 2.23 kB.
- Title, Settings, Gallery, Credits, Stats, Skill Tree, and Skin Selector navigation passed the Priority 1 regression flow.

## Priority 5-B Wallpaper FPS Follow-Up

- Confirmed `wallpaperSettings.fps` supports 30 and 60 through the existing wallpaper settings storage.
- Confirmed `GameCanvas` applies the selected Wallpaper FPS through Pixi ticker `maxFPS`, which limits both the game update callback and Pixi render cadence in Wallpaper Stage and Muse Overlay modes.
- Removed a redundant manual update accumulator after review found it could double-throttle the already-limited Pixi ticker.
- Updated the ticker limit only when the requested Wallpaper FPS changes instead of invoking the Pixi `maxFPS` setter every callback.
- Game updates continue using Pixi ticker delta time, so 30fps does not intentionally change internal speed, rewards, coordinates, or collision rules.
- Normal gameplay remains unrestricted.
- Added development-only Debug Panel readout for Wallpaper FPS, expected update interval, last update delta, and wall-clock measured updates per second.
- Attempted automated cadence measurement in the Electron regression runner. The runner's hidden document is intentionally stopped by the existing visibility control, so visible-window 30/s and 60/s cadence remains a manual Debug Panel check instead of a misleading automated assertion.
- Regression result: `verify:priority1`, `verify:priority2`, and `verify:priority3` passed after the ticker change.
- `npm.cmd run build` now completes without a 500 kB chunk warning; `SkillTreePanel` and `SkinSelectorModal` are emitted as separate lazy chunks.

## Skin Selector Equip Feedback

- Selected the Skin Selector Equip feedback task as the next player-facing improvement because skin unlock notifications already existed and this change could improve a frequent interaction without touching game, collision, reward, or save behavior.
- Added an always-visible current equipment state to the selected skin card.
- Added a polite live status message after Equip so the player can confirm the new skin before closing the modal.
- Added a focused equipped-card visual treatment while keeping locked skins and locked Muses unequippable.
- Extended the Priority 1 regression flow to confirm the Equip completion message appears.
- Verification: `npm.cmd run build` and `npm.cmd run verify:priority1` passed.

## Stage Clear Reward Presentation

- Replaced the single-background Stage Clear overlay with `StageClearModal` and reusable `RewardCard` components.
- Added typed stage `rewards` for skin, background, Muse, Memory, and Capsule rewards while preserving legacy background and skin reward fields.
- Stage 2 now explicitly presents and grants Cozy Room, Lumi Pastel, and Astra.
- Stage rewards are granted atomically only on a new stage clear, then saved immediately before the modal is dismissed.
- Added reward-card actions for immediate skin Equip, background selection, Gallery opening, and Muse activation.
- Added Capsule inventory persistence with a safe `0` fallback for older saves.
- Added a soft Stage Clear flash, small sparkles, low-motion presentation, and a short audio jingle stub.
- Stage-reward skin and Muse notifications are removed from their follow-up queues when the Stage Clear modal closes, avoiding duplicate unlock presentation.
- Extended Priority 1 verification to cover Stage 1/2 reward display, Gallery opening, Cozy Room selection, Lumi Pastel Equip, save persistence, and single ownership.
- Verification passed:
  - `npm.cmd run build`
  - `npm.cmd run verify:priority1`
  - `npm.cmd run verify:priority2`
  - `npm.cmd run verify:priority3`

## Visible Wall Collision Reward Fix

- Fixed visible gameplay failing to advance wall collisions, Bounce count, and Memory in all presentation modes while hidden-time offline Memory still accrued.
- Root cause: GameCanvas synchronized ticker visibility before registering its gameplay update callback. If the ticker became stopped during async setup, there was no final visible-state synchronization after the callback was registered.
- Added a final visibility synchronization immediately after registering the GameCanvas ticker callback.
- Extended Priority 2 regression checks to assert that a runtime wall collision increments Bounce count and grants Memory.
- Kept collision rules, reward calculations, Wallpaper Mode coordinates/multipliers, and save formats unchanged.

## Focus And Wallpaper Mode Stutter Fix

- Investigated ticker registration and cleanup, Wallpaper FPS application, React and Zustand updates, HUD and effects work, Debug Panel updates, and Pixi object lifecycle.
- Confirmed mode switches do not duplicate or leak the GameCanvas ticker, visibility listener, or store subscription.
- Root cause: a `ResizeObserver` resized the Pixi renderer and rescaled every Muse body when Focus or Wallpaper CSS expanded the canvas host. This sharply increased high-DPI render load and changed internal game coordinates during presentation-mode switches.
- Removed mode-driven Pixi renderer and Muse-body resizing. CSS still scales the presentation, while Pixi internal dimensions and game coordinates remain stable.
- Kept Wallpaper ticker `maxFPS` as the render/update cadence control and split simulation work into steps of at most 20 ms, reducing coarse 30fps collision and reward processing without changing configured render cadence.
- Stopped development Debug Panel status dispatches while the panel is hidden in Focus or Wallpaper modes.
- Added Priority 1 assertions that Pixi internal canvas dimensions remain stable in Focus Mode, Wallpaper Stage Mode, and Muse Overlay Mode.
- Kept save formats, reward calculations, balance, Corner Hit rules, and platform adapters unchanged.
- Verification passed: `npm.cmd run build`, `npm.cmd run verify:priority1`, `npm.cmd run verify:priority2`, and `npm.cmd run verify:priority3`.

## Automated Verification And CI Foundation

- Added `scripts/run-verifications.cjs` to start a dedicated Vite dev server on port `4174`, wait for readiness, run Electron verification suites, and stop the server.
- Updated `verify:priority1` and `verify:priority2` so they no longer require a manually started Vite server.
- Added `npm run verify:e2e` and `scripts/e2e-smoke.cjs` with smoke coverage for:
  - Title display.
  - Settings.
  - Gallery.
  - Stats.
  - Start.
  - Save.
  - Continue after reload.
  - Focus Mode enter/exit without renderer crash.
  - Wallpaper Stage Mode enter/exit without renderer crash.
- Added `npm run verify:all`, which runs:
  - `npm run build`.
  - Priority 1 regression verification.
  - Priority 2 collision/reward verification.
  - E2E smoke verification.
  - Priority 3/save migration verification.
- `verify:priority3` and `verify:save-migrations` intentionally remain aliases for the same migration suite, so `verify:all` runs that suite once.
- Added `.github/workflows/ci.yml` for Ubuntu GitHub Actions using `npm ci` and `xvfb-run --auto-servernum npm run verify:all`.
- Stabilized the existing Priority 1 Pixi canvas-size assertions by waiting for canvas initialization before capturing the normal-mode baseline.
- No game logic, collision, reward, save format, `GameCanvas.tsx`, or `useGameStore.ts` behavior was changed.

Verification results on 2026-06-05:

- `npm.cmd run build`: passed.
- `npm.cmd run verify:e2e`: passed.
- `npm.cmd run verify:all`: passed.
- The first sandboxed build attempt failed because the environment denied access while Vite loaded its config; rerunning with the required workspace permission passed.
- The initial automation run detected and fixed two verification-infrastructure issues:
  - Windows `npm.cmd` child-process startup needed a Windows-compatible command invocation.
  - The existing Priority 1 canvas-size assertion could capture `null` before Pixi initialization.
- Port `5173` was already used by an existing development server, so verification was isolated on port `4174` rather than stopping or reusing the developer server.

## Reward And Unlock Master Foundation

- Added the shared `Reward` union for skin, background, Muse, Memory, Capsule, Shard, and Conversation rewards.
- Added `rewardApplier.ts` to centralize reward validation, ownership checks, granting, and unsupported reward results.
- Replaced Stage-specific reward types and legacy Stage reward fields with the shared `Reward` type.
- Added the shared `UnlockCondition` union and applied it to Muse, skin, and background master data.
- Added persistent `claimedStageRewardIds` so Stage rewards are granted once independently from Stage Clear modal presentation.
- Kept Stage 2 Cozy Room, Lumi Pastel, and Astra rewards and their existing immediate actions.
- Added safe Unknown Reward presentation for missing master IDs and deferred reward types.
- Kept `saveVersion = 1`; older saves fill missing `claimedStageRewardIds` with an empty array.
- Verification passed: `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run verify:priority1`, `npm.cmd run verify:priority3`, `npm.cmd run verify:all`, and standalone `npm.cmd run dev` startup.

## V1.0 Master Data Pass

- Organized the v1.0 master set for 4 Muses, 8 skins, 6 backgrounds, 10 stages, 4 Muse skills, and 3 upgrades.
- Kept all existing Muse, skin, background, Stage 1-4, and upgrade IDs; retained `bg_pinball_neon` as an additional Stage 7 background reward.
- Added Muse `defaultSkinId` and centralized skill definitions with `durationMs`, `cooldownMs`, and `trigger`.
- Made `bg_default_room` the initial background and added background thumbnails and shared unlock conditions.
- Preserved Stage 2 Lumi Pastel and Astra unlocks while moving Vega to the v1.0 Stage 5 condition.
- Moved upgrade costs and multipliers into `balance.ts`; Corner Sensor copy now describes Near Corner guidance instead of widening true Corner Hit detection.
- Verification passed: `npm.cmd run typecheck`, `npm.cmd run verify:priority1`, `npm.cmd run verify:priority3`, `npm.cmd run verify:all`, and standalone `npm.cmd run dev` startup.

## Reward-Level Stage Claims

- Replaced Stage-level reward decisions with persistent Reward-level `claimedRewardIds`.
- Added stable Stage reward `rewardId` values and claim keys in the `${stageId}:${rewardId}` format, with a type/value fallback for rewards without `rewardId`.
- Stage clears now check and claim each reward independently; unsupported rewards remain unclaimed for future implementations.
- Continue/load reconciliation checks cleared Stages and grants only newly added, unclaimed rewards.
- Existing `claimedStageRewardIds` remains readable for compatibility and migrates through a fixed legacy Reward ID snapshot, so future Stage rewards are not incorrectly marked claimed.
- Stage Clear reward cards can distinguish `Already Claimed` from owned or newly granted rewards.
- Added regression coverage that removes one Reward claim from an already-cleared Stage and verifies only that reward is granted and claimed again.
- Verification passed: `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run verify:priority1`, `npm.cmd run verify:priority3`, `npm.cmd run verify:all`, and standalone `npm.cmd run dev` startup.

## Backfill Reward Summary

- Added transient `pendingBackfillRewards` state so rewards added to multiple already-cleared Stages are retained as Stage-grouped results.
- Added `BackfillRewardsModal` with all affected Stage groups, shared Reward cards, Gallery access, and a single Continue action.
- Kept normal Stage Clear presentation on `StageClearModal`; backfill reconciliation no longer overwrites `pendingStageClear`.
- Dismissing the backfill summary does not alter granted rewards or Reward-level claim state.
- Expanded Priority 1 regression coverage to verify two already-cleared Stage groups appear together and both claim keys remain unique.
- Verification passed: `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run verify:priority1`, `npm.cmd run verify:all`, and standalone `npm.cmd run dev` startup.
- In-app Browser inspection was attempted twice but its Windows sandbox runtime failed to start; the Electron Priority 1 UI regression verified the rendered backfill modal content instead.

## Master Data Validation

- Added `npm run verify:masters`, implemented as a Node-only TypeScript validator bundled with the existing esbuild dependency.
- Added validation for master IDs, Stage numbers/goals, Reward shapes and references, global Reward IDs, generated claim keys, Muse/Skin/Background relationships, UnlockConditions, Skills, Upgrades, and initial unlock/equipment state.
- Extracted the legacy Stage-claim migration into a shared pure function and added `masterClaimMigration.snapshot.json` coverage.
- Missing image files and not-yet-implemented Capsule, Conversation, and DLC masters remain warnings rather than errors.
- Added `verify:masters` once at the end of `verify:all`.
- Confirmed the validator fails for a temporary missing Skin Reward target and duplicate `rewardId`, reporting the missing reference, Stage/global Reward ID duplication, and generated claim-key duplication before the test data was restored.
- Verification passed: `npm.cmd run typecheck`, `npm.cmd run verify:masters`, `npm.cmd run build`, and `npm.cmd run verify:all`.

## Development Debug Panel Visibility

- Removed the development Debug Panel from the permanent normal-game side panel stack.
- Added transient DEV-only open state with a subtle `Debug` button and `Ctrl + Shift + D` shortcut.
- Added `Esc` and Close-button dismissal; screen, Focus Mode, Wallpaper Stage Mode, and Muse Overlay transitions close the panel.
- Kept all existing debug actions inside a fixed-stage right-side overlay with internal scrolling.
- Production builds do not render the Debug button or Debug Panel because access remains guarded by `import.meta.env.DEV`.
- Verification passed: `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run verify:priority1`, `npm.cmd run verify:priority2`, and `npm.cmd run verify:all`.
