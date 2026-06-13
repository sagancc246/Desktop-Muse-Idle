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

## Backfill Rewards Responsive Layout

- Changed Backfill Rewards presentation to a fixed-stage bounded grid with a fixed header/footer and an independently scrolling Stage-group list.
- Added readable scrollbar styling, Stage-group spacing, wrapping RewardCard grids, bounded card widths, wrapping actions, and safe long-name wrapping.
- Added DEV-only 3/5/10 Stage Backfill fixtures that update only transient `pendingBackfillRewards` without granting or claiming rewards.
- Expanded Priority 1 regression coverage for 1280x720 and 1920x1080 viewport bounds, fixed header/footer visibility, independent scrolling, RewardCard actions, Continue, and unchanged Reward claims.
- Verification passed: `npm.cmd run typecheck`, `npm.cmd run verify:priority1`, `npm.cmd run build`, and `npm.cmd run verify:all`.
- In-app Browser visual inspection was attempted twice, but its Windows sandbox runtime failed to start; the Electron renderer regression verified the requested viewport and interaction behavior instead.
- Playwright is not installed; real-window visual verification and future Playwright viewport coverage remain tracked in `docs/TODO.md`.

## Wallpaper Backend Investigation

- Confirmed Wallpaper Stage and Muse Overlay are presentation modes inside the existing browser/Electron window.
- Confirmed `platformAdapter` currently resolves to `localAdapter`, whose overlay, transparent-window, always-on-top, and click-through methods are no-op stubs.
- Confirmed Electron creates one normal framed 1280x820 `BrowserWindow`; preload exposes no desktop APIs.
- Found no WorkerW, Progman, SetParent, native window handle, or other Windows desktop-layer attachment code.
- Classified the packaged implementation as `electron_window`, the web implementation as `browser_only`, and native desktop wallpaper / transparent overlay as not implemented.

## Electron Muse Transparent Overlay

- Added a context-isolated preload IPC bridge and Electron platform adapter for Muse Overlay window control.
- Electron now creates a transparent-capable window while normal screens remain visually opaque.
- Muse Overlay switches the existing window to fullscreen, always-on-top, skip-taskbar transparent presentation and restores previous window state on exit.
- Added real click-through through `setIgnoreMouseEvents`, with Overlay-only global `Ctrl + Shift + M` and `Esc` recovery shortcuts.
- Added renderer synchronization for actual Overlay window state and truthful Electron Overlay / Web Preview HUD labels.
- Kept Wallpaper Stage as a normal Electron window and did not add WorkerW/Progman/native desktop wallpaper behavior.
- Verification passed: `npm.cmd run typecheck`, `node --check electron/main.cjs`, `node --check electron/preload.cjs`, `npm.cmd run verify:priority1`, `npm.cmd run electron:build`, and `npm.cmd run verify:all`.
- Packaged Windows visual/input verification remains pending because the Windows Computer Use runtime failed twice with `windows sandbox failed: spawn setup refresh`.

## Electron Muse Click Through Fix

- Added `overlay:get-status` / `overlay:set-click-through` IPC status flow with `lastError` reporting.
- Click Through ON now applies `setIgnoreMouseEvents(true, { forward: true })` on Windows/macOS, falls back safely where needed, and makes the Overlay window non-focusable while pass-through is active.
- Click Through OFF restores mouse handling, focusability, and Muse Tap interaction.
- Muse Tap is explicitly blocked in GameCanvas while Muse Overlay Click Through is ON, including the web fallback path.
- Muse Overlay HUD now shows Overlay Active, Transparent, Always On Top, Click Through priority, and Last Error.

## Electron Muse Click Through Safety Guide

- Muse Overlay now always starts with Click Through OFF, even when the saved preference is ON.
- If the saved preference is ON, Click Through is applied after a 3-second safety delay.
- The Overlay HUD is mounted during Muse Overlay so the startup safety guide can appear even when the normal Overlay HUD preference is OFF.
- The safety guide explains that Overlay buttons are unavailable while Click Through is ON and that `Ctrl + Shift + M` returns to operation mode; `Esc` exits Overlay.

## Native Desktop Wallpaper MVP

- Added `native_wallpaper` to the shared Wallpaper Mode type without persisting the active mode.
- Added `enterNativeWallpaperMode`, `exitNativeWallpaperMode`, and `getNativeWallpaperStatus` to the platform adapter boundary, with safe local/Steam no-op fallbacks.
- Added context-isolated preload IPC for `wallpaper:enter-native`, `wallpaper:exit-native`, and `wallpaper:get-status`.
- Added a dedicated hidden Wallpaper `BrowserWindow` factory for Electron that loads the renderer with `nativeWallpaperRenderer=1`, hides taskbar presence, uses transparent frameless bounds, and does not replace the main window.
- Added a Win32 desktop attach boundary in `electron/nativeWallpaper.cjs`. It prepares the native window handle but deliberately returns fallback until a reviewed WorkerW/Progman/SetParent bridge is selected.
- Native Wallpaper entry now attempts the Electron main-process attach path on Windows, reports backend/nativeAttached/fallback/lastError status, and falls back to the existing Wallpaper Stage presentation on failure.
- Settings, WallpaperModePanel, and WallpaperStageHud now expose Native Wallpaper status while keeping unsupported web/non-Windows environments safe.
- The dedicated Wallpaper renderer forces the game into the existing Wallpaper Stage presentation path and reuses Wallpaper FPS/effects settings without changing game coordinates, collision, rewards, or save data.

## Win32 Wallpaper Bridge Decision

- Compared C# helper exe, C++ helper exe, Node native addon, and ffi-napi/user32 direct-call approaches for WorkerW / Progman / SetParent integration.
- Selected a C# self-contained helper exe as the first implementation path because it isolates Win32 failure from Electron, avoids Node/Electron ABI risk, is reviewable with explicit P/Invoke calls, and can be bundled with Steam/Electron as a separate executable.
- Added `docs/WIN32_WALLPAPER_BRIDGE_DECISION.md` with the candidate comparison, recommended architecture, WorkerW attach plan, Electron integration flow, fallback rules, status model changes, and manual verification checklist.
- Added `docs/NATIVE_WALLPAPER.md` and `native/wallpaper-helper/README.md` to document current fallback behavior and the future helper command contract.
- No Win32 attach code or native dependencies were added in this step; the app remains on the safe `fallback_stage` MVP path until the helper is implemented.

## Wallpaper Helper Skeleton

- Added `native/wallpaper-helper/WallpaperHelper.csproj` and `Program.cs` as a C# console helper skeleton.
- The helper supports `status`, `version`, `attach --hwnd <HWND>`, and `detach --hwnd <HWND>` and writes JSON to stdout for success, expected failure, and exception paths.
- `attach` validates that an HWND was passed, then returns `attached: false` with `reason: "attach_not_implemented"`; no WorkerW / Progman / SetParent attach is attempted yet.
- Electron `nativeWallpaper.cjs` now resolves a helper path, starts the helper with `child_process.spawn`, passes the Wallpaper BrowserWindow HWND, parses JSON stdout, enforces a timeout, and falls back safely on missing helper, spawn failure, invalid JSON, timeout, or attach-not-implemented.
- Native Wallpaper status now exposes helper availability, helper version, helper last result, and attached/nativeAttached state for Settings, WallpaperModePanel, and WallpaperStageHud.
- The normal `npm run build` and `verify:all` flows do not require the .NET SDK or a built helper executable.

## Wallpaper Helper Desktop Discovery Dry Run

- Added Win32 P/Invoke definitions in `native/wallpaper-helper/Win32.cs` for Progman/WorkerW dry-run discovery: `FindWindow`, `FindWindowEx`, `EnumWindows`, `GetClassName`, `GetWindowText`, `SendMessageTimeout`, `IsWindowVisible`, and `GetWindowRect`.
- Added `DesktopWindowFinder` and discovery result models to keep Win32 traversal out of `Program.cs`.
- Added `find-desktop`, which finds Progman, sends the `0x052C` WorkerW creation message with timeout, enumerates top-level windows, detects `SHELLDLL_DefView`, lists WorkerW candidates, and selects a preferred WorkerW candidate without calling `SetParent`.
- Added `attach --hwnd <HWND> --dry-run`, which validates the HWND, runs the same desktop discovery, returns `dryRun: true`, `attached: false`, and `reason: "dry_run_no_set_parent"`.
- Electron status surfaces Progman, SHELLDLL_DefView, WorkerW candidate count, preferred WorkerW, dryRun, reason, warnings, and helper JSON from helper attach/discovery results.
- Dry-run discovery never reports `native_desktop_wallpaper` success.

## Wallpaper Helper SetParent Attach

- Added `WallpaperAttacher.cs` to perform the first real WorkerW attach attempt from the helper process.
- `attach --hwnd <HWND>` now validates the target HWND with `IsWindow`, reuses desktop discovery, selects the preferred WorkerW, records previous parent/style/exStyle, adjusts style for WorkerW child-window use, calls `SetParent`, calls `SetWindowPos`, and returns `attached: true` only after successful verification.
- Window style adjustment adds `WS_CHILD`, `WS_VISIBLE`, `WS_CLIPSIBLINGS`, `WS_CLIPCHILDREN`, removes `WS_POPUP`, and adds `WS_EX_TOOLWINDOW` / `WS_EX_NOACTIVATE` while preserving the old values for detach.
- `detach --hwnd <HWND> --previous-parent --previous-style --previous-ex-style` now attempts to restore the previous parent/style values. Electron still closes the Wallpaper BrowserWindow afterward as the final cleanup fallback.
- Electron now calls helper attach without `--dry-run`, stores workerW / previous parent / previous style fields, reports `native_desktop_wallpaper` only when `attached: true`, and calls helper detach during Native Wallpaper exit.
- Current MVP positions the wallpaper on the primary display only via `GetSystemMetrics`; multi-monitor, virtual-screen, and DPI-specific placement remain TODO.

## Wallpaper Helper Publish Packaging

- Added `build:wallpaper-helper` to publish `native/wallpaper-helper/WallpaperHelper.csproj` as a Windows x64 self-contained single-file exe.
- Standardized the helper publish output at `native/wallpaper-helper/bin/publish/win-x64/wallpaper-helper.exe`.
- Added `electron-builder.extraResources` packaging so the published helper is copied to `resources/wallpaper-helper/wallpaper-helper.exe` in `release/win-unpacked`.
- Updated Electron helper path resolution to prefer the new development publish output and packaged resources path, while preserving `DESKTOP_MUSE_WALLPAPER_HELPER` override and safe missing-helper fallback.
- NativeWallpaperStatus now surfaces the resolved helper path in addition to helper availability/version.
- `npm run build` and `npm run verify:all` remain independent of dotnet; packaged native wallpaper verification requires running the helper publish step first.

## Wallpaper Helper Desktop Target Selection Fix

- Investigated a Windows packaged result where helper attach reported `backend: native_desktop_wallpaper`, `attached: true`, `SetParent: true`, and `SetWindowPos: true`, but `Win + D`, desktop icon back-layer rendering, and desktop icon clicks did not work.
- Found that the helper selected the first `WorkerW` without `SHELLDLL_DefView`, even when that candidate was an invisible `91x26` window rather than a desktop-sized background layer.
- Updated WorkerW selection to prefer only desktop-sized candidates, exposing that `Progman` fallback can look successful while still failing desktop behavior checks.
- Changed attach positioning to place the Wallpaper child at `HWND_BOTTOM` instead of preserving the existing child z-order.
- Bumped `wallpaper-helper` to `0.1.1` so packaged verification can confirm the fixed helper is being used.

## Wallpaper Helper Progman Fallback Correction

- Investigated a second Windows packaged result where `Preferred WorkerW` was actually `className: "Progman"` with `preferredReason: "fallback_progman_with_shelldll_defview"`, and the wallpaper still failed `Win + D`, desktop icon back-layer rendering, and desktop icon click checks.
- Removed `Progman` / `SHELLDLL_DefView` parent fallback from native success selection. A successful `native_desktop_wallpaper` result now requires a desktop-sized `WorkerW` target, not just a valid parent HWND.
- Added additional `0x052C` WorkerW creation message variants so Windows versions that need the `0x0D` message sequence can expose the proper background WorkerW before enumeration.
- Added sibling WorkerW discovery after the `SHELLDLL_DefView` host window.
- Set the Electron Wallpaper BrowserWindow to ignore mouse events after native attach so the wallpaper surface does not block desktop icon clicks.
- Bumped `wallpaper-helper` to `0.1.2` so the next packaged log can distinguish this correction from the previous WorkerW selection fix.

## Wallpaper Helper Progman Child Fallback

- Investigated a `0.1.2` packaged result where all discovered `WorkerW` windows were tiny invisible candidates and the only desktop-sized candidate was `Progman`; strict WorkerW selection correctly returned `fallback_stage` with `reason: "workerw_not_found"`.
- Added an explicit `progman_desktop_child` backend for environments where Windows does not expose a desktop-sized WorkerW target, but `Progman` can still be used as a desktop child parent.
- Kept `native_desktop_wallpaper` reserved for successful desktop-sized WorkerW attach, while allowing `Progman` fallback to be tested separately and shown truthfully in NativeWallpaperStatus.
- Bumped `wallpaper-helper` to `0.1.3` so packaged verification can confirm this fallback path is active.

## Wallpaper Helper Progman Fallback Rejected

- Verified on the Windows packaged app that `progman_desktop_child` still fails the required native wallpaper behavior: `Win + D` persistence, desktop-icon back-layer rendering, desktop-icon clicks, Alt+Tab/taskbar absence, clean Exit/Esc restore, and no leftover transparent window.
- Removed `Progman` child fallback from the success path. The helper now returns `fallback_stage` unless it can attach to a desktop-sized `WorkerW` target.
- Bumped `wallpaper-helper` to `0.1.4` so future logs clearly show the rejected Progman fallback is no longer being used.
- Next implementation direction should avoid treating Electron BrowserWindow -> Progman `SetParent` as a valid wallpaper backend. A native host-window bridge or a different desktop compositor strategy is required for environments where Explorer does not expose a usable desktop-sized WorkerW.

## Wallpaper Helper Native Host Window

- Added `host --hwnd <HWND>` to `wallpaper-helper` as the preferred Native Desktop Wallpaper attach path.
- The helper now creates a helper-owned native host window, parents that host under the selected desktop-sized WorkerW, parents the Electron Wallpaper `BrowserWindow` HWND into the host, writes JSON to stdout, and keeps a message loop alive until Electron sends `exit` on stdin.
- Electron now starts the persistent host helper first, keeps the process handle while Native Wallpaper Mode is active, and stops it during Native Wallpaper exit before closing the Wallpaper `BrowserWindow`.
- Retained direct Electron `BrowserWindow` -> WorkerW `attach --hwnd` only as a diagnostic probe. Even if `SetParent` and `SetWindowPos` succeed, it now restores the previous parent/style, returns `attached: false`, and reports `reason: "electron_window_direct_set_parent_not_verified"`.
- NativeWallpaperStatus now surfaces `attachMethod`, `helperRunning`, `hostHwnd`, and `restoredAfterProbe` so host success and direct-probe fallback are distinguishable in Settings, WallpaperModePanel, and WallpaperStageHud.
- Bumped `wallpaper-helper` to `0.1.5`; packaged Windows verification is still required for `Win + D`, desktop icon back-layer rendering/clicks, Alt+Tab/taskbar absence, Exit/Esc restoration, and no ghost window.

## Wallpaper Helper 0.1.6 Diagnostics

- Bumped `wallpaper-helper` to `0.1.6` without changing the native rendering strategy.
- Added host-mode diagnostics for `electronWallpaperHwnd`, `parentHwndAfterSetParent`, `setParentResult`, host/window/virtual-screen rects, and `rectMismatch`.
- Added `inspect --hwnd --host-hwnd --workerw-hwnd` so Electron can re-check whether the Wallpaper child, native host, and WorkerW still exist and whether the child is still parented to the host.
- Electron now tracks helper PID/process liveness, logs native wallpaper enter/attach/inspect/detach/fallback JSON to the main-process console, and marks `fallback_stage` / `attached:false` if the persistent helper exits unexpectedly.
- `wallpaper:get-status` now re-inspects active native wallpaper state, so Explorer restart or WorkerW disappearance does not keep a stale success state.
- NativeWallpaperStatus and WallpaperStageHud now expose helper PID, WorkerW HWND, Native Host HWND, Electron Wallpaper HWND, parent-after-SetParent, rect mismatch, reason, fallback reason, and copyable diagnostics.
- App quit now waits for Native Wallpaper cleanup once before quitting, so the helper receives `exit` and can restore the Electron Wallpaper window before final close.
- Existing `release/win-unpacked` output was detected with stale helper `0.1.3`; a fresh `electron:build` is required before packaged 0.1.6 manual verification.

## Wallpaper Helper 0.1.7 WorkerW Candidate Diagnostics

- Bumped `wallpaper-helper` to `0.1.7` without adding WebView2, native drawing, Progman success fallback, or direct Electron `BrowserWindow` success fallback.
- Expanded WorkerW discovery JSON so `workerw_not_found` includes every enumerated candidate and its HWND, class name, window text, parent HWND, owner HWND, process ID, style, exStyle, visibility, rect, width/height, nearest monitor, primary/virtual screen match flags, `SHELLDLL_DefView` / `SysListView32` flags, selection rank, selection reason, and reject reason.
- Discovery now enumerates candidates before and after the Progman `0x052C` WorkerW creation messages, then reports `workerWCandidatesBeforeMessage`, `workerWCreatedHwnds`, and `workerWRemovedHwnds`.
- Added `workerWSelectionOrder`, `closestWorkerWHwnd`, and `closestWorkerWReason` so a packaged failure can show which WorkerW was nearest to being eligible and why it was rejected.
- Kept selection conservative: the helper still requires a visible desktop-sized `WorkerW` without desktop icon views; small, empty, invisible, non-WorkerW, and icon-host candidates are rejected with explicit reasons.
- Electron now passes candidate arrays and selection diagnostics into NativeWallpaperStatus so Copy diagnostics contains the data needed for packaged Windows investigation.
- NativeWallpaperStatus and WallpaperStageHud now show WorkerW candidate count, before-message count, closest candidate, closest reject reason, preferred reason, and a compact reject summary.

## Wallpaper Helper 0.1.8 Progman Native Host Probe

- Bumped `wallpaper-helper` to `0.1.8` without adding WebView2, native drawing, Progman success fallback, or direct Electron `BrowserWindow` success fallback.
- Added a final diagnostic-only `progman_native_host_probe` path for environments where WorkerW candidates exist but all are rejected as hidden or empty and no desktop-sized WorkerW is available.
- The helper still prefers the existing `native_host_window` WorkerW path whenever a desktop-sized eligible WorkerW exists.
- The Progman probe is attempted only when Progman is found, visible, has `SHELLDLL_DefView` / `SysListView32` descendants, and covers or matches the primary screen.
- In the probe, the helper creates its own native host window as a child of Progman, parents the Electron Wallpaper window into that host, attempts `HWND_BOTTOM` z-order placement, and reports host HWND, child HWND, parent after SetParent, rects, z-order result, and Progman candidate details.
- The probe returns `backend: "progman_native_host_probe"`, `probeAttached: true`, `needsManualVerification: true`, and `attached: false`; API success is deliberately not treated as verified native wallpaper success.
- Electron keeps the helper process alive for this probe so packaged manual verification can check desktop icon layering, click-through, Alt+Tab/taskbar absence, Win+D behavior, Exit/Esc cleanup, app quit cleanup, and Explorer restart behavior.
- NativeWallpaperStatus and WallpaperStageHud now expose Progman probe attempted, Progman HWND, Progman `SHELLDLL_DefView` / `SysListView32` / primary coverage flags, Progman native host HWND, z-order result, and manual-verification requirement.
- Result is pending packaged manual verification. Do not promote this probe to `attached:true` unless the full desktop behavior checklist passes.

## Wallpaper Helper 0.1.9 WorkerW Re-Verification Probes

- Bumped `wallpaper-helper` to `0.1.9` as an investigation build, not a rollback from Native Desktop Wallpaper Mode.
- Recorded the `0.1.8` packaged result: `progman_native_host_probe` succeeded at the API layer, kept the helper alive, and rendered, but appeared in front of desktop icons and blocked desktop clicks.
- Added WorkerW discovery strategy diagnostics modeled after common `0x052C` / WorkerW wallpaper examples: current algorithm, classic `0x052C`, `SHELLDLL_DefView` owner based, next sibling WorkerW, and `FindWindowEx` based discovery.
- Strategy diagnostics now report candidate HWND/class/style/exStyle/process/rect/visibility, shell view HWNDs, sibling WorkerW HWNDs, reject reason, score, and which strategy selected the probe candidate.
- Split WorkerW candidate rejection into attach rejection vs probe usefulness, including `visibleFalseButPossibleWallpaperLayer`, `emptyRect`, `tooSmall`, `noShellDllDefViewRelation`, and `noDesktopSizeMatch`.
- Added a manual-verification-only `workerw_native_host_probe` path for strategy-selected WorkerW candidates that are not eligible for verified attach but may still be the hidden wallpaper layer used by Explorer.
- Kept all probe paths as `attached:false`, `probeAttached:true`, and `needsManualVerification:true`; `native_desktop_wallpaper` success is not reported by this investigation build.
- Strengthened Progman probe diagnostics with child z-order snapshots before/after host creation, SetParent, and z-order attempts, plus host-relative order against `SHELLDLL_DefView` and `SysListView32`.
- Added multiple z-order strategies for diagnostics only: `hwnd_bottom`, `behind_shell_dll_defview`, `before_shell_dll_defview`, `shell_dll_defview_top_after_host`, and `syslistview_top_after_host`.
- Added parent-client coordinate diagnostics so screen coordinates, virtual-screen coordinates, Progman client coordinates, host rects, and wallpaper rects can be compared after SetParent / SetWindowPos.
- Added click-through diagnostics: Electron ignore-mouse-events is enabled by Electron for probes, and the helper applies `WS_EX_TRANSPARENT`, `WS_EX_NOACTIVATE`, and `WS_EX_TOOLWINDOW` to the native host.
- NativeWallpaperStatus and WallpaperStageHud now show selected WorkerW strategy/HWND, discovery strategy count, shell HWNDs, z-order strategy, host-relative order, click-through flags, parent HWNDs, and rect mismatch.
- Result is pending packaged manual verification. If either icon-back-layer rendering or non-blocking click-through is confirmed, consider formal backend promotion in `0.1.10`; otherwise use the diagnostics to decide whether WebView2/native drawing is needed.

## Wallpaper Helper 0.1.10 Progman Child WorkerW Probe

- Bumped `wallpaper-helper` to `0.1.10` as a continued investigation build.
- Recorded the `0.1.9` packaged result: ordinary top-level WorkerW strategies still selected only tiny hidden WorkerWs, but `progmanChildrenBeforeProbe` showed a full-size visible `WorkerW` directly under Progman.
- Added `progman_child_workerw_algorithm` to discover visible full-size WorkerW children of Progman that do not contain `SHELLDLL_DefView` or `SysListView32`.
- Added `progmanChildWorkerWCandidates`, `selectedProgmanChildWorkerWHwnd`, candidate geometry/visibility/parent/icon-view flags, and strategy scoring to diagnostics.
- Kept Progman child WorkerW candidates out of verified `PreferredWorkerW` attach by marking them `progman_child_workerw_probe_only`; they are probe candidates only until manual verification passes.
- Added `workerw_child_native_host_probe`, which creates the helper-owned native host under the selected Progman child WorkerW and parents the Electron Wallpaper window into that host.
- The child WorkerW probe returns `attached:false`, `probeAttached:true`, `needsManualVerification:true`, and `backend:"workerw_child_native_host_probe"`.
- Added startup cleanup for stale `DesktopMuseIdleWallpaperHost` children under Progman before starting a new probe. Diagnostics now include `staleHostWindowsBeforeCleanup`, `cleanupStaleHostWindowsAttempted`, `cleanupStaleHostWindowsSucceeded`, `cleanupStaleHostWindowsFailed`, and `progmanChildrenAfterCleanup`.
- Expanded click-through diagnostics with requested/enabled flags for Electron ignore-mouse-events and native transparent/no-activate styles, plus `clickThroughMode`.
- UI now surfaces selected Progman child WorkerW, stale cleanup status, child host HWND, and click-through mode.
- Packaged manual verification remains required before any probe can be promoted to `attached:true`.

## Native Wallpaper 0.1.11 Duplicate Display Suppression

- Bumped `wallpaper-helper` to `0.1.11`; the helper attach strategy is unchanged from `0.1.10`.
- Recorded the `0.1.10` packaged result: `workerw_child_native_host_probe` with `selectedWorkerWStrategy: "progman_child_workerw_algorithm"` rendered behind desktop icons, but the normal foreground game/stage was also visible.
- Treated the result as a duplicate display bug, not as a Native Wallpaper failure.
- Added explicit native probe display state to Electron status: `nativeProbeActive`, `nativeProbeBackend`, `nativeProbeVisible`, `fallbackStageVisible`, `overlayVisible`, `mainStageVisible`, `duplicateStageSuppressed`, `duplicateStageSuppressionReason`, and `activeDisplaySurfaces`.
- During `probeAttached:true` / `needsManualVerification:true`, Electron now reports `fallbackActive:false` and marks the native probe as the active display surface instead of showing fallback stage as the primary outcome.
- Renderer now suppresses the foreground Wallpaper Stage and normal `GameCanvas` while a native probe is active. The main window keeps only controls/diagnostics/mode selection.
- Muse Overlay is disabled in the UI while a native probe is active, and Electron exits overlay mode before entering Native Wallpaper Mode.
- NativeWallpaperStatus and WallpaperStageHud now show `Native Probe Active`, the probe backend, fallback-stage visibility, main-stage visibility, duplicate suppression, and active display surfaces.
- Manual verification is still required; `attached:true` is not promoted in this version.

## Native Wallpaper 0.1.12 Surface / Control UI Separation

- Bumped `wallpaper-helper` to `0.1.12`; the native host strategy is unchanged.
- Recorded the `0.1.11` packaged result: WorkerW child native host rendered behind desktop icons, desktop icon clicks worked, `Win + D` preserved the wallpaper, and ghost cleanup was broadly successful.
- Identified the remaining issue as UI responsibility leakage: the click-through native wallpaper surface still displayed an `Exit Wallpaper` button, which looked clickable but could not receive input.
- Added explicit surface diagnostics: `renderSurface`, `nativeWallpaperSurface`, `controlView`, `nativeWallpaperSurfaceInteractiveUiVisible`, `nativeWallpaperSurfaceButtonsVisible`, `nativeWallpaperSurfaceExitButtonVisible`, `controlViewExitButtonVisible`, `wallpaperSurfaceClickThroughExpected`, `wallpaperSurfaceUiSuppressed`, and `wallpaperSurfaceUiSuppressionReason`.
- The `nativeWallpaperRenderer=1` wallpaper surface now suppresses `WallpaperStageHud`, including the `Exit Wallpaper` button.
- Added CSS safeguards so buttons/inputs/selects/sliders and native wallpaper actions are hidden on `.native-wallpaper-surface-mode`.
- The foreground native probe Control View remains responsible for Exit, Native Wallpaper OFF, Copy diagnostics, mode selection, settings, and status text.
- Manual verification is still required; `attached:true` is not promoted in this version.
