# Desktop Muse Idle TODO

This TODO focuses on the next practical work after the current `codex/desktop-muse-features` implementation pass.

## Automated Verification Foundation

Status: `npm run build`, `npm run verify:e2e`, and `npm run verify:all` passed on 2026-06-05.

- [x] Add `npm run verify:all` for build, Priority 1, Priority 2, E2E smoke, and Priority 3/save migration verification.
- [x] Make `verify:priority1`, `verify:priority2`, and `verify:e2e` start and stop their own Vite dev server.
- [x] Use dedicated verification port `4174` so the automated suite does not interfere with the normal port `5173` dev server.
- [x] Add Electron E2E smoke coverage for Title, Start, Settings, Gallery, Stats, Save, Continue reload, Focus Mode, and Wallpaper Mode.
- [x] Add `.github/workflows/ci.yml` to run `npm ci` and `xvfb-run --auto-servernum npm run verify:all`.
- [x] Stabilize the Priority 1 canvas-size check by waiting for Pixi canvas initialization.

Next automation candidates:

- [x] Add `npm run verify:masters` for master ID, Reward reference, claim key, initial-state, and legacy claim migration validation.
- Add viewport-size E2E coverage for 1920x1080, 1280x720, 1366x768, and a narrow viewport.
- Add keyboard/Escape and focus-trap E2E coverage for major screens and modals.
- Add visible-window Wallpaper 30fps/60fps cadence checks on suitable CI or desktop hardware.
- Add Electron platform-adapter E2E when transparent window, always-on-top, click-through, and quit behavior are implemented.

Still requires manual verification:

- Long-duration Focus Mode, Wallpaper Stage Mode, and Muse Overlay Mode performance on real desktop hardware.
- Visual quality, animation smoothness, and effect readability.
- OS-level Electron window behavior that is not implemented yet.

## Priority 1: Regression Checks

Status: verified with `npm run verify:priority1` after `npm.cmd run build`.

- Verify the full title-to-game flow:
  - Start.
  - Continue.
  - Settings.
  - Gallery.
  - Credits.
  - Stats.
  - Quit placeholder.
- Verify manual save:
  - Save from ResourceBar.
  - Manual Save from Settings.
  - Saving/Saved/Save Failed toast behavior.
  - Last Saved timestamp.
  - Save reload for Memory, Stage, backgrounds, Muses, skins, stats, and Skill Tree.
- Verify 10-second auto-save still works.
- Verify Wallpaper settings persist separately from game progress.
- Verify app always starts with `wallpaperMode: "off"` after reload.

## Priority 2: Collision And Reward Validation

Status: verified with `npm run verify:priority2`.

- Confirm true Corner Hit only occurs on same-frame X-wall and Y-wall contact.
- Confirm wall-only hits near corners become Near Corner, not Corner Hit.
- Confirm Near Corner does not increment:
  - `totalCornerHits`.
  - `stageCornerHits`.
- Confirm Corner Hit rewards are not double-counted in one collision.
- Confirm Corner Sensor affects Near Corner guidance only.
- Confirm clone wall hits and clone Corner Hits use reduced reward multipliers.
- Confirm clones cannot trigger clone skill again.
- Confirm clones cannot be Muse Tap targets.
- Confirm Vega Bumper collisions:
  - Only Vega collides with other Muses/clones.
  - Non-Vega Muse pairs pass through each other.
  - Collision rewards respect pair cooldowns.
  - Collisions are not treated as Corner Hits.

## Priority 3: Save Migration Testing

Status: verified with `npm run verify:priority3`.

- Test with an empty LocalStorage.
- Test with malformed game save JSON.
- Test with old saves missing:
  - `stats`.
  - `unlockedMuseIds`.
  - `activeMuseIds`.
  - `unlockedSkinIds`.
  - `equippedSkinByMuseId`.
  - `wallpaperSettings`.
- Test that default skins are added when skin fields are missing.
- Test that invalid equipped skin IDs fall back safely.
- Test that invalid wallpaper settings fall back to defaults.
- Test that Reset Save Data clears game progress but does not clear app/wallpaper settings.

## Priority 4: UI And Accessibility Pass

- Check all major screens at:
  - 1920x1080.
  - 1280x720.
  - 1366x768.
  - 2560x1440.
  - Narrow/vertical viewport.
- Confirm fixed-stage scaling keeps Pixi and UI aligned.
- Confirm Focus Mode hides management UI and keeps Minimal HUD usable.
- Confirm Wallpaper Stage Mode hides normal UI and keeps Minimal HUD usable.
- Confirm Muse Overlay Mode hides background and large UI.
- Confirm Esc exits:
  - Focus Mode.
  - Wallpaper Stage Mode.
  - Muse Overlay Mode.
  - Settings/Gallery/Credits/Stats where appropriate.
- Check focus traps in:
  - Settings.
  - Gallery.
  - Background preview.
  - Credits.
  - Offline reward.
  - Stage clear.
  - First-run tutorial.
  - Skin selector.
- Review Japanese/English labels for consistency.

### Player Experience Improvements

- [x] Improve Skin Selector Equip confirmation and equipped-state visibility.
- [x] Improve Stage Clear rewards with reward cards, immediate reward actions, and clear feedback.

## Priority 5: Performance And Bundle Size

Status: Vite large `index` chunk warning resolved; Wallpaper FPS long-duration hardware profiling deferred to release-before checks.

### Priority 5-A: Lazy UI Loading

- [x] Investigate Vite chunk warning for large `index` chunk. Done: `index` is about 73.64 kB after splitting.
- [x] Consider dynamic imports for heavy panels:
  - [x] Gallery.
  - [x] Stats.
  - [x] Settings.
  - [x] Credits.
  - [x] Skill Tree.
  - [x] Debug Panel.
  - [x] Skin selector.

### Priority 5-B: Runtime Performance

- Profile GameCanvas under:
  - Normal gameplay.
  - Focus Mode.
  - Wallpaper Stage Mode.
  - Muse Overlay Mode.
- [x] Verify Wallpaper FPS setting is applied to ticker/update/render load through Pixi ticker `maxFPS`; the development Debug Panel exposes real-time cadence for visible Wallpaper modes.
- Tune low effects mode for long-running display.

Next TODO:

- Consider adding `rollup-plugin-visualizer` as a dev-only bundle analysis tool if chunk size grows again.
- Release-before manual check: run Focus Mode for several minutes and confirm character movement remains smooth.
- Release-before manual check: confirm Wallpaper Stage remains stable at both 30fps and 60fps.
- Release-before manual check: confirm Muse Overlay remains stable at both 30fps and 60fps.
- Release-before manual check: confirm Memory, Corner Hit count, and rewards do not change because of the Wallpaper FPS setting.
- Release-before manual check: profile Focus Mode, Wallpaper Stage, and Muse Overlay over a long session on real desktop hardware.
- Release-before manual check: confirm the Debug Panel reports approximately 30/s and 60/s on a visible desktop window; hidden Electron regression windows are intentionally stopped by the existing visibility control and cannot measure Wallpaper cadence.

## Priority 6: Debug Tools

- Expand Debug Panel with explicit test controls for:
  - Force true Corner Hit.
  - Force Near Corner.
  - Force Clone Corner Hit.
  - Force Vega Bumper active.
  - Show collision debug state.
  - Show active save payload summary.
- Add developer-only display for:
  - `hitXWall`.
  - `hitYWall`.
  - `isCornerHit`.
  - `isNearCorner`.
  - `cornerId`.
  - active skill states.
  - clone count and clone expiry.

## Priority 7: Asset And Presentation Cleanup

- Replace placeholder Muse icon assets with final transparent PNG/WebP assets.
- Add final background assets for each stage reward.
- Resolve current `verify:masters` asset warnings for Muse thumbnails and `bg_night_room` / `bg_star_room`.
- Confirm all background runtime paths use `public/assets/backgrounds`.
- Keep editable/source assets documented in `docs/ASSET_LEDGER.md`.
- Add missing voice files or keep subtitle fallback clearly documented.
- Review effect readability on bright backgrounds.
- Review Gallery thumbnail consistency.
- Manually verify Backfill Rewards modal scrolling and RewardCard actions with many Stage groups at once.

## Priority 8: Electron Preparation

- Keep Electron-specific calls behind `src/platform/*`.
- Do not call Electron APIs directly from React components.
- Later implement:
  - Transparent window.
  - Always on top.
  - Click through.
  - Overlay mode enter/exit.
  - Quit behavior.
- Verify Web build remains safe when Electron APIs are unavailable.

## Priority 9: Documentation And Release Prep

- Keep `README.md` focused on user-facing verification.
- Keep `docs/IMPLEMENTATION_LOG.md` as the chronological/technical handoff.
- Keep this `docs/TODO.md` as the next-action list.
- Install or configure `gh` CLI if Codex should create PRs automatically.
- Open a PR from `codex/desktop-muse-features` when ready.

## Do Not Break

- Corner Hit must remain strict: same-frame X-wall and Y-wall collision only.
- Near Corner must not count as Corner Hit.
- Wallpaper Mode must not change game logic coordinates or reward multipliers.
- `wallpaperMode` must not be persisted.
- Game progress save and wallpaper settings must remain separate.
- Skins must not change gameplay performance.
- Locked skins must not be equippable.
- Locked Muses must not be active.
- Clone must not clone again.
- Clone must not be Muse Tap target.
- React components must not directly call future Electron APIs.
