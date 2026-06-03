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
