# Desktop Muse Idle TODO

This TODO focuses on the next practical work after the current `codex/desktop-muse-features` implementation pass.

## Priority 1: Regression Checks

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

## Priority 5: Performance And Bundle Size

- Investigate Vite chunk warning for large `index` chunk.
- Consider dynamic imports for heavy panels:
  - Gallery.
  - Stats.
  - Skill Tree.
  - Debug Panel.
  - Skin selector.
- Profile GameCanvas under:
  - Normal gameplay.
  - Focus Mode.
  - Wallpaper Stage Mode.
  - Muse Overlay Mode.
- Verify Wallpaper FPS setting actually reduces ticker/update load.
- Tune low effects mode for long-running display.

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
- Confirm all background runtime paths use `public/assets/backgrounds`.
- Keep editable/source assets documented in `docs/ASSET_LEDGER.md`.
- Add missing voice files or keep subtitle fallback clearly documented.
- Review effect readability on bright backgrounds.
- Review Gallery thumbnail consistency.

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

