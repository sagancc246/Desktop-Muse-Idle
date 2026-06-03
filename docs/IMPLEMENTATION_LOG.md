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

