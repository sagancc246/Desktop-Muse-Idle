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
- Add packaged Electron platform-adapter E2E for transparent Overlay, always-on-top, click-through, shortcut recovery, and quit behavior.

Still requires manual verification:

- Long-duration Focus Mode, Wallpaper Stage Mode, and Muse Overlay Mode performance on real desktop hardware.
- Visual quality, animation smoothness, and effect readability.
- Packaged Windows verification of the newly implemented Electron transparent Overlay window behavior.

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

- [x] Hide Debug Panel from normal UI; expose it only in development through the small Debug toggle or `Ctrl + Shift + D`, with `Esc`/Close support.
- [x] Keep Debug Panel closed in Focus Mode, Wallpaper Stage Mode, Muse Overlay Mode, and production builds.
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
- [x] Verify Backfill Rewards modal bounds, independent reward-list scrolling, fixed header/footer, and RewardCard actions with a 10-Stage DEV fixture at 1280x720 and 1920x1080.
- Release-before manual check: visually inspect Backfill Rewards spacing and scrollbar contrast on the final packaged desktop build.
- After resolving the Windows runtime startup failure, visually inspect BackfillRewardsModal in a real app window.
- During the real-window inspection, verify BackfillRewardsModal at both 1280x720 and 1920x1080.
- After Playwright is introduced, add BackfillRewardsModal viewport regression coverage.

## Priority 8: Electron Preparation

- Keep Electron-specific calls behind `src/platform/*`.
- Do not call Electron APIs directly from React components.
- [x] Add a Windows-only Native Desktop Wallpaper MVP entry point that creates a dedicated Wallpaper `BrowserWindow`, attempts the main-process attach path, reports status through `platformAdapter`, and safely falls back to Wallpaper Stage.
- [x] Select the Win32 bridge strategy for Native Desktop Wallpaper. Decision: C# self-contained helper exe; see `docs/WIN32_WALLPAPER_BRIDGE_DECISION.md`.
- Native Desktop Wallpaper currently uses a reviewed-safe fallback because WorkerW/Progman/SetParent requires the helper implementation.
- Native Desktop Wallpaper implementation tasks:
  - [x] Create the C# helper project under `native/wallpaper-helper/`.
  - [x] Implement helper command parsing for `status`, `version`, `attach --hwnd`, and `detach --hwnd`.
  - [x] Add helper `find-desktop` dry-run command.
  - [x] Add helper `attach --hwnd <HWND> --dry-run` command.
  - [x] Launch the helper from Electron main process and pass the Wallpaper BrowserWindow HWND.
  - [x] Parse helper JSON output and surface helper reachability/version/last result in NativeWallpaperStatus.
  - [x] Surface Progman / SHELLDLL_DefView / WorkerW candidate dry-run results in NativeWallpaperStatus.
  - Extend helper command parsing for `attach --hwnd --x --y --width --height`.
  - [x] Implement Progman discovery with `FindWindow("Progman", null)`.
  - [x] Send the WorkerW creation message to Progman with timeout handling.
  - [x] Implement `EnumWindows` / `FindWindowEx` traversal for `SHELLDLL_DefView`.
  - [x] Select and validate the target WorkerW behind the desktop icon layer for dry-run reporting.
  - [x] Implement `SetParent` attach for the Wallpaper Window.
  - [x] Adjust window style and use `SetWindowPos` for primary display bounds.
  - [x] Add persistent helper `host --hwnd` mode with a native host window under WorkerW.
  - [x] Prefer native host mode before the legacy direct `SetParent` diagnostic probe.
  - [x] Keep Electron BrowserWindow direct `SetParent` as fallback/probe only, never as verified native wallpaper success.
  - [x] Extend `NativeWallpaperStatus` with `helperRunning` while preserving current fallback fields.
  - [x] Add 0.1.6 packaged-verification diagnostics: helper PID, host HWND, Electron HWND, parent HWND, rects, rect mismatch, process liveness, copy diagnostics, and active-state recheck.
  - [x] Add 0.1.7 WorkerW candidate diagnostics: before/after `0x052C`, per-candidate reject reasons, nearest monitor data, selection order, and closest rejected candidate.
  - [x] Add helper path resolution for development and packaged Electron builds.
  - [x] Add helper missing / timeout / invalid JSON / non-zero exit fallback handling.
  - [x] Implement helper detach with previous parent/style arguments and Electron BrowserWindow close fallback.
  - Confirm `fallback_stage` still works when helper is missing or attach fails.
  - [x] Add `build:wallpaper-helper` for Windows self-contained helper publish.
  - [x] Package the helper with `electron-builder` via `extraResources`.
  - Confirm packaged helper startup from `release\win-unpacked\resources\wallpaper-helper\wallpaper-helper.exe` reports `0.1.6` on a fresh packaged build.
  - Add virtual-screen / multi-monitor placement support.
  - Add DPI-aware placement verification.
  - Run Windows local実機確認 for `Win + D`.
  - Run Windows local実機確認 for desktop icon back-layer rendering.
  - Run Windows local実機確認 for desktop icon clicks.
  - Run Windows local実機確認 for Alt+Tab and taskbar absence.
  - Run Windows local実機確認 for Exit restoration and no orphan Wallpaper window.
- [x] Add an Electron platform adapter and IPC bridge for transparent Muse Overlay, always-on-top, click-through, fullscreen Overlay entry/exit, skip-taskbar behavior, and truthful HUD status.
- Native Desktop Wallpaper 0.1.6 packaged manual verification pending:
  - Confirm `release\win-unpacked\resources\wallpaper-helper\wallpaper-helper.exe version` reports `0.1.6` after a fresh `npm.cmd run electron:build`.
  - Confirm desktop icon back-layer rendering.
  - Confirm taskbar back-layer behavior.
  - Confirm Alt+Tab absence.
  - Confirm no extra taskbar window.
  - Confirm `Win + D` persistence.
  - Confirm desktop icon clicks are not blocked.
  - Confirm Exit button removes wallpaper.
  - Confirm `Esc` removes wallpaper.
  - Confirm Native Wallpaper OFF removes wallpaper.
  - Confirm app quit leaves no ghost window.
  - Confirm Explorer restart does not keep stale `attached:true`.
  - Confirm failure shows `fallback_stage` / `attached:false` / reason.
- Native Desktop Wallpaper 0.1.7 WorkerW candidate diagnostics result pending:
  - Collect Copy diagnostics after `workerw_not_found` on packaged Windows.
  - Confirm `helperVersion` is `0.1.7`.
  - Review `workerwCandidateCount`, `workerwCandidates`, `workerWSelectionOrder`, `closestWorkerWHwnd`, and `closestWorkerWReason`.
  - Decide whether selection logic can be safely refined without accepting Progman fallback or direct Electron `SetParent` as success.
- Native Desktop Wallpaper 0.1.8 Progman native host probe result pending:
  - Build a fresh package and confirm packaged helper reports `0.1.8`.
  - Confirm whether `progman_native_host_probe` is attempted when all WorkerW candidates are rejected.
  - Copy diagnostics and preserve `progmanCandidate`, `progmanNativeHostProbeResult`, host window result, z-order result, and `needsManualVerification`.
  - Verify whether the probe renders behind desktop icons or incorrectly appears in front of them.
  - Verify desktop icon clicks, Alt+Tab absence, taskbar absence, `Win + D`, Native Wallpaper OFF, Exit, `Esc`, app quit, ghost window cleanup, and Explorer restart behavior.
  - Keep the probe as `attached:false` unless the full checklist passes.
- Native Desktop Wallpaper 0.1.9 WorkerW / z-order / click-through investigation pending:
  - Build a fresh package and confirm packaged helper reports `0.1.9`.
  - Enter Native Wallpaper Mode and copy diagnostics immediately.
  - Review `workerWDiscoveryStrategies`, `selectedWorkerWStrategy`, `selectedWorkerWHwnd`, and per-candidate probe flags.
  - If `workerw_native_host_probe` runs, verify whether it appears behind icons or at least lets desktop icon clicks pass through.
  - If `progman_native_host_probe` runs, compare `progmanChildrenBeforeProbe`, `progmanChildrenAfterZOrder`, `zOrderStrategyResults`, and host-relative order against `SHELLDLL_DefView` / `SysListView32`.
  - Confirm `clickThroughEnabled`, `electronIgnoreMouseEventsEnabled`, `nativeHostTransparentEnabled`, and `nativeHostNoActivateEnabled`.
  - Verify Alt+Tab absence, taskbar absence, `Win + D`, Native Wallpaper OFF, Exit, `Esc`, app quit, ghost window cleanup, and Explorer restart behavior.
  - Keep all probes as `attached:false` until manual verification proves icon-back-layer rendering or reliable click-through.
  - If a probe is viable, consider formal backend promotion in `0.1.10`; otherwise decide whether WebView2 or native drawing is the next investigation.
- Native Desktop Wallpaper 0.1.10 Progman child WorkerW probe result pending:
  - Build a fresh package and confirm packaged helper reports `0.1.10`.
  - Confirm Native Wallpaper ON performs stale host cleanup before starting a new probe.
  - Confirm `staleHostWindowsBeforeCleanup`, `cleanupStaleHostWindowsSucceeded`, and `progmanChildrenAfterCleanup` in Copy diagnostics.
  - Confirm `selectedWorkerWStrategy` becomes `progman_child_workerw_algorithm` when a full-size visible Progman child WorkerW exists.
  - Confirm `selectedProgmanChildWorkerWHwnd` and `workerWChildNativeHostProbeResult` are present.
  - Verify whether the wallpaper appears behind desktop icons.
  - If it appears in front of icons, verify whether clicks pass through and do not block desktop icons.
  - Verify Alt+Tab absence, taskbar absence, `Win + D`, Native Wallpaper OFF, Exit, `Esc`, app quit, ghost window cleanup, and Explorer restart behavior.
  - Keep `workerw_child_native_host_probe` as `attached:false` until the full manual checklist passes.
- Native Desktop Wallpaper 0.1.11 duplicate display suppression pending:
  - Build a fresh package and confirm packaged helper reports `0.1.11`.
  - Confirm `workerw_child_native_host_probe` still renders behind desktop icons.
  - Confirm the foreground app no longer shows a duplicate GameCanvas or Wallpaper Stage while `nativeProbeActive:true`.
  - Confirm diagnostics show `fallbackStageVisible:false`, `mainStageVisible:false`, `duplicateStageSuppressed:true`, and `activeDisplaySurfaces` containing only the native probe surface for stage rendering.
  - Confirm Muse Overlay cannot be enabled while a native probe is active.
  - Confirm normal app controls/diagnostics remain usable.
  - Confirm minimizing the normal window leaves the desktop wallpaper probe visible.
  - Verify desktop icon clicks, `Win + D`, Alt+Tab absence, taskbar absence, Native Wallpaper OFF, Exit, `Esc`, app quit, and ghost window cleanup.
  - Keep `attached:false` until the full manual checklist passes.
- Native Desktop Wallpaper 0.1.12 wallpaper surface / Control View split pending:
  - Build a fresh package and confirm packaged helper reports `0.1.12`.
  - Confirm Native Wallpaper ON shows only Muse/background on the desktop wallpaper surface.
  - Confirm the back wallpaper surface does not show `Exit Wallpaper` or any clickable UI.
  - Confirm foreground Control View shows Exit Wallpaper / OFF controls and diagnostics.
  - Confirm `nativeWallpaperSurfaceInteractiveUiVisible:false`, `nativeWallpaperSurfaceButtonsVisible:false`, `nativeWallpaperSurfaceExitButtonVisible:false`, `controlViewExitButtonVisible:true`, and `wallpaperSurfaceUiSuppressed:true`.
  - Confirm Control View Exit Wallpaper removes the back wallpaper.
  - Confirm desktop icon clicks, `Win + D`, Alt+Tab/taskbar absence, OFF, `Esc`, app quit, and ghost cleanup.
  - Keep `attached:false` until the full manual checklist passes.
- Native Desktop Wallpaper 0.1.13 Control View recovery pending:
  - Build a fresh package and confirm packaged helper reports `0.1.13`.
  - Confirm Native Wallpaper ON shows a small foreground Control View with Exit/OFF, Copy diagnostics, mode selector, and native status.
  - Confirm Control View does not cover the full primary screen.
  - Confirm `mainWindowMayBlockDesktopClicks:false`, `mainWindowCoversPrimaryScreen:false`, and `controlViewVisible:true`.
  - Confirm Control View outside area allows desktop icon clicks, desktop right-click menu, and desktop drag selection.
  - Confirm `renderSurface: control_view` in the main window and `native_wallpaper_surface` only for the back wallpaper renderer.
  - Confirm Native Wallpaper ON does not reset the app to title.
  - Confirm OFF/Exit/Esc restores the previous app screen.
  - Confirm Start/Continue after OFF shows Muse, background, and `GameCanvas`.
  - Confirm WorkerW back wallpaper remains visible after `Win + D`, and app quit leaves no ghost window.
  - Keep `attached:false` until the full manual checklist passes.
- Native Desktop Wallpaper 0.1.14 Control View UX pending:
  - Build a fresh package and confirm packaged helper reports `0.1.14`.
  - Confirm Native Wallpaper ON shows only Muse/background on the back surface.
  - Confirm the foreground is a small `Native Wallpaper Control` panel with titlebar, `Minimize`, right-top close/Exit, Copy Diagnostics, mode selector, and native status.
  - Confirm the Control View can be dragged to a new position.
  - Confirm `Minimize` minimizes only the Control View and the back wallpaper remains visible.
  - Confirm the taskbar can restore the minimized Control View.
  - Confirm the right-top close button and `Exit Wallpaper` both stop the native wallpaper, clean helper/host/window state, and restore the pre-Native app screen.
  - Confirm diagnostics show `controlViewMode:native_wallpaper_control`, `controlViewMovable:true`, `controlViewDraggable:true`, `controlViewMinimizeButtonVisible:true`, `controlViewCloseButtonVisible:true`, and `controlViewCloseAction:exit_native_wallpaper`.
  - Confirm normal GameCanvas / Wallpaper Stage / Muse Overlay do not appear in front while the native probe is active.
  - Confirm desktop icon clicks, desktop right-click, `Win + D`, app quit, and ghost cleanup still behave correctly.
  - Keep `attached:false` until the full manual checklist passes.
- Native Desktop Wallpaper 0.1.15 Control View window resize / menu suppression / compact layout pending:
  - Build a fresh package and confirm packaged helper reports `0.1.15`.
  - Confirm Native Wallpaper ON shows Muse/background only on the back surface and no operation UI.
  - Confirm the foreground Control View BrowserWindow actually resizes to a small panel around `480x320`.
  - Confirm File/Edit/View/Window menu chrome is not visible while the Control View is active.
  - Confirm there is no large blank space above the compact Control View content.
  - Confirm the compact Control View contains titlebar, Minimize, right-top close, Exit Wallpaper, Copy Diagnostics, compact mode row, and collapsible diagnostics.
  - Confirm diagnostics show `controlViewWindowResized:true`, `controlViewMenuBarVisible:false`, `menuBarSuppressedForControlView:true`, `controlViewLayoutCompact:true`, `controlViewLargeBlankSuppressed:true`, `mainGameLayoutMounted:false`, `wallpaperStageLayoutMounted:false`, and `nativeWallpaperControlViewMounted:true`.
  - Confirm Minimize affects only the Control View and the back wallpaper remains visible.
  - Confirm right-top close / Exit Wallpaper / OFF / Esc clean up the host/helper/window and restore the previous app screen and window bounds.
  - Confirm app quit leaves no ghost window.
  - Keep `attached:false` until the full manual checklist passes.
- Native Desktop Wallpaper 0.1.16 dedicated NativeWallpaperControlWindow pending:
  - Build a fresh package and confirm packaged helper reports `0.1.16`.
  - Confirm Native Wallpaper ON shows Muse/background only on the back surface.
  - Confirm the foreground is a separate frameless `Native Wallpaper Control` BrowserWindow, not a resized normal app window.
  - Confirm the normal `mainWindow` is hidden while Native Wallpaper is active and restored after OFF/Exit.
  - Confirm Control Window text and buttons are readable at `560x400`.
  - Confirm only `Minimize`, `Exit Wallpaper`, and `Copy Diagnostics` are shown as primary controls.
  - Confirm no File/Edit/View/Window menu chrome appears.
  - Confirm titlebar drag moves the Control Window and buttons remain clickable.
  - Confirm `Minimize` minimizes only the Control Window and the back wallpaper remains visible.
  - Confirm `Exit Wallpaper`, `Esc`, Native Wallpaper OFF, and app quit close the Control Window, remove the back wallpaper, restore mainWindow, and leave no ghost windows.
  - Confirm diagnostics show `nativeWallpaperControlWindowCreated:true`, `nativeWallpaperControlWindowVisible:true`, `nativeWallpaperControlWindowFrameless:true`, `nativeWallpaperControlWindowDraggable:true`, `nativeWallpaperControlWindowRoute:nativeWallpaperControl=1`, `nativeWallpaperControlWindowButtonCount:3`, `duplicateControlButtonsDetected:false`, `mainWindowHiddenForNativeWallpaper:true`, and `mainWindowRestoredAfterNativeWallpaper:true` after exit.
  - Keep `attached:false` until the full manual checklist passes.
- Release-before manual check: verify `Win + D`, `Alt + Tab`, desktop-icon layering/clicks, taskbar presence, startup 3-second Click Through safety guide, `Ctrl + Shift + M` recovery, Click Through ON pass-through, Click Through OFF Muse Tap/HUD button interaction, HUD Last Error, and Esc restoration in the packaged Windows build.
- Release-before manual check: verify Native Desktop Wallpaper Mode on local Windows Electron after the real WorkerW bridge is implemented; check `Win + D`, icon back-layer rendering, icon clicks, Alt + Tab/taskbar absence, app-behind behavior, and Exit restoration.
- Current MVP manual check: confirm Windows Electron reports Native Wallpaper fallback cleanly and returns to normal mode without leaving a hidden Wallpaper window.
- Windows Computer Use runtime startup currently fails with `windows sandbox failed: spawn setup refresh`; retry the packaged Overlay manual check after the runtime issue is resolved.
- When Windows Computer Use runtime cannot start, switch to local Windows manual verification by launching `release\win-unpacked\Desktop Muse Idle.exe` and follow the README Electron checklist.
- Later implement:
  - Packaged Electron Overlay regression automation.
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
