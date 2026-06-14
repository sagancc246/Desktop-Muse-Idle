# Native Desktop Wallpaper Mode

## Current State

Native Desktop Wallpaper Mode is currently a Windows Electron MVP with a safe fallback.

- The renderer exposes `native_wallpaper` as a Wallpaper Mode option.
- Electron creates a dedicated Wallpaper `BrowserWindow`.
- Electron obtains the Wallpaper window native HWND.
- Electron can launch the C# helper and pass the Wallpaper window HWND to it.
- The helper can be published as a Windows self-contained exe and bundled into packaged Electron builds.
- The helper returns JSON for `status`, `version`, `find-desktop`, `host`, `inspect`, `attach`, and `detach`.
- `find-desktop` performs a dry-run Progman / WorkerW / SHELLDLL_DefView discovery pass.
- `find-desktop` includes WorkerW candidate diagnostics, before/after `0x052C` enumeration, reject reasons, and closest-candidate selection details.
- `attach --hwnd <HWND> --dry-run` validates the HWND, performs desktop discovery, and returns `dryRun: true`, `attached: false`, and `reason: "dry_run_no_set_parent"`.
- `host --hwnd <HWND>` is the active native attach path. It creates a helper-owned native host window, places that host under a desktop-sized WorkerW, parents the Electron Wallpaper window into the host, writes JSON, and remains running until Electron exits Native Wallpaper Mode.
- `inspect --hwnd <HWND> --host-hwnd <HWND> --workerw-hwnd <HWND>` re-checks that the Electron Wallpaper window, native host window, and WorkerW are still valid and still parented correctly.
- `attach --hwnd <HWND>` is retained only as a direct Electron BrowserWindow `SetParent` diagnostic probe. It does not report `attached: true` because this path failed real desktop wallpaper verification.
- `detach --hwnd <HWND>` attempts to restore the previous parent/style values supplied by Electron, then Electron closes the Wallpaper BrowserWindow as the final cleanup fallback.
- The expected result is `native_desktop_wallpaper` only when helper host attach returns `attached: true`; otherwise the app remains in `fallback_stage`.

This is intentional. The app must not report `native_desktop_wallpaper` success until the Wallpaper window is actually attached to the Windows desktop background layer.

## Architecture Boundary

Native wallpaper control must follow this path:

```text
React UI
  -> src/platform/platformAdapter.ts
  -> src/platform/electronAdapter.ts
  -> electron/preload.cjs IPC
  -> electron/main.cjs
  -> native/wallpaper-helper/wallpaper-helper.exe
  -> Win32 APIs
```

React components must not call Win32 APIs, Electron APIs, or helper processes directly.

## Selected Bridge Direction

The selected first bridge implementation is a C# self-contained helper exe.

See `docs/WIN32_WALLPAPER_BRIDGE_DECISION.md` for the candidate comparison, recommendation, attach plan, fallback rules, and manual verification checklist.

## Current Fallback Behavior

If the helper is missing or attach fails:

- `NativeWallpaperStatus.backend` becomes `fallback_stage`.
- `fallbackActive` is `true`.
- `nativeAttached` / future `attached` is `false`.
- `helperAvailable` shows whether the helper process was reachable.
- `helperPath` shows the resolved helper executable path used by Electron.
- `helperVersion` shows the helper version when JSON output includes it.
- `helperRunning` shows whether the persistent native host helper is still alive.
- `helperLastResult` contains the raw parsed helper result as a debug string.
- `lastError` explains the fallback reason.
- The renderer remains usable through the existing Wallpaper Stage presentation.

If the helper is built and reachable, a successful attach result includes:

```json
{
  "ok": true,
  "command": "host",
  "attached": true,
  "attachMethod": "native_host_window",
  "backend": "native_desktop_wallpaper",
  "helperRunning": true,
  "electronWallpaperHwnd": "12344",
  "hostHwnd": "12345",
  "parentHwndAfterSetParent": "12345",
  "rectMismatch": false,
  "setParentSucceeded": true,
  "setWindowPosSucceeded": true
}
```

Any result without `attached: true` must be treated as `fallback_stage`, not `native_desktop_wallpaper`.

## Helper Manual Check

Build or run the helper manually only when the .NET SDK is available:

```powershell
npm run build:wallpaper-helper
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- status
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- version
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- find-desktop
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- attach --hwnd 12345 --dry-run
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- host --hwnd <real-electron-wallpaper-hwnd>
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- inspect --hwnd <real-electron-wallpaper-hwnd> --host-hwnd <native-host-hwnd> --workerw-hwnd <workerw-hwnd>
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- attach --hwnd <real-electron-wallpaper-hwnd>
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- detach --hwnd <real-electron-wallpaper-hwnd> --previous-parent <previous-parent-hwnd>
```

`npm run build:wallpaper-helper` publishes to:

```text
native\wallpaper-helper\bin\publish\win-x64\wallpaper-helper.exe
```

`npm run electron:build` runs the helper publish first, then bundles the exe via `electron-builder.extraResources` at:

```text
release\win-unpacked\resources\wallpaper-helper\wallpaper-helper.exe
```

The web app build and `verify:all` do not require .NET and must continue to pass when the helper is not built. Native Wallpaper packaged verification does require the helper publish step or an explicit `DESKTOP_MUSE_WALLPAPER_HELPER` path override.

## `workerw_not_found` Diagnostics

When packaged Native Wallpaper Mode falls back with `reason: "workerw_not_found"`, do not move to WebView2 or native drawing yet. First collect the WorkerW diagnostics added in helper `0.1.7` and extended through `0.1.9`.

Expected status fields:

- `helperVersion: "0.1.9"`
- `workerWCandidateCount`
- `workerWCandidatesBeforeMessage`
- `workerWCandidates`
- `workerWDiscoveryStrategies`
- `workerWCreatedHwnds` / `workerWRemovedHwnds`
- `workerWSelectionOrder`
- `closestWorkerWHwnd`
- `closestWorkerWReason`
- `selectedWorkerWStrategy`
- `selectedWorkerWHwnd`

Each candidate should include:

- `hwnd`, `className`, `windowText`
- `parentHwnd`, `ownerHwnd`, `processId`
- `style`, `exStyle`, `isVisible`
- `rect`, `width`, `height`, nearest `monitor`
- `matchesVirtualScreen`, `matchesPrimaryScreen`, `coversVirtualScreen`, `coversPrimaryScreen`
- `hasShellDllDefView`, `hasShellDllDefViewDescendant`, `hasSysListView32`
- `selectionRank`, `selectionReason`, `rejectReason`
- `rejectedForAttach`, `usableForProbe`
- `visibleFalseButPossibleWallpaperLayer`
- `emptyRect`, `tooSmall`, `noShellDllDefViewRelation`, `noDesktopSizeMatch`

Packaged collection steps:

1. Build a fresh package from normal Windows PowerShell:

   ```powershell
   npm.cmd run electron:build
   release\win-unpacked\resources\wallpaper-helper\wallpaper-helper.exe version
   ```

2. Confirm the packaged helper reports `0.1.9`.
3. Launch `release\win-unpacked\Desktop Muse Idle.exe`.
4. Enter Native Desktop Wallpaper Mode.
5. If it falls back, click `Copy diagnostics` in NativeWallpaperStatus.
6. Check the reject summary first. Common reasons:
   - `not_desktop_sized`: WorkerW exists but is smaller than the primary/virtual screen.
   - `not_visible`: WorkerW exists but is hidden.
   - `contains_desktop_icon_view`: candidate hosts desktop icons and should not be used as the wallpaper background.
   - `empty_rect` / `missing_rect`: unusable geometry.
7. Compare `workerWCandidatesBeforeMessage` with `workerWCandidates` and `workerWCreatedHwnds` to see whether the Progman `0x052C` message changed Explorer's WorkerW layout.
8. Use `closestWorkerWHwnd` and `closestWorkerWReason` to decide the next WorkerW selection adjustment.

## WorkerW Strategy / Probe Diagnostics

Helper `0.1.9` compares multiple WorkerW discovery strategies without treating any probe as verified success:

- `current_algorithm`
- `classic_0x052c_algorithm`
- `shelldll_defview_owner_based_algorithm`
- `next_sibling_workerw_algorithm`
- `findwindowex_based_algorithm`
- `progman_child_workerw_algorithm`

Each strategy reports the candidate HWND, shell view HWNDs, sibling WorkerW HWNDs, geometry, visibility, styles, process ID, reject reason, score, and whether it selected the probe candidate.

If no verified desktop-sized WorkerW exists but a strategy finds a plausible WorkerW probe candidate, the helper may run `workerw_native_host_probe`. This probe:

- creates a helper-owned host under the selected WorkerW;
- parents the Electron Wallpaper window into the host;
- applies `WS_EX_TOOLWINDOW`, `WS_EX_NOACTIVATE`, and `WS_EX_TRANSPARENT`;
- keeps the helper process alive for manual verification;
- returns `backend: "workerw_native_host_probe"`, `probeAttached: true`, `needsManualVerification: true`, and `attached: false`.

Manual verification for a WorkerW probe:

1. Confirm `Helper: reachable 0.1.9`.
2. Confirm `Backend: workerw_native_host_probe`, `Attached: false`, `Probe attached: true`, and `Manual verification: required`.
3. Copy diagnostics and inspect `workerWDiscoveryStrategies`, `selectedWorkerWStrategy`, `selectedWorkerWHwnd`, `workerWNativeHostProbeResult`, and click-through fields.
4. Check whether the wallpaper appears behind desktop icons.
5. If it appears in front, check whether desktop icon clicks pass through.
6. Confirm Alt+Tab and taskbar do not show the Wallpaper window.
7. Press `Win + D` and confirm whether the probe remains visible.
8. Exit via Native Wallpaper OFF, Wallpaper HUD Exit, `Esc`, and app quit; each path must remove the helper host and Electron Wallpaper window.
9. Restart Explorer and confirm the app does not keep any stale verified success state.

Do not promote this to `attached:true` until the packaged checklist passes.

## Progman Child WorkerW Probe

Helper `0.1.10` adds a focused probe for the case where all top-level WorkerW strategies fail but Progman contains a full-size visible child `WorkerW`.

Candidate conditions:

- `parentHwnd == progmanHwnd`
- `className == "WorkerW"`
- `isVisible == true`
- rect matches or covers the primary/virtual screen
- no `SHELLDLL_DefView` descendant
- no `SysListView32` descendant

Diagnostics:

- `progmanChildWorkerWCandidates`
- `selectedProgmanChildWorkerWHwnd`
- `selectedWorkerWStrategy: "progman_child_workerw_algorithm"`
- `selectedWorkerWHwnd`
- `workerWChildNativeHostProbeResult`
- `workerWChildHwnd`
- `hostHwnd`
- `electronWallpaperHwnd`
- `hostParentHwndAfterSetParent`
- `electronParentHwndAfterSetParent`
- `hostWindowRect`
- `wallpaperWindowRect`
- `setParentSucceeded`
- `setWindowPosSucceeded`
- `zOrderResult`
- `clickThroughEnabled`
- `clickThroughMode`
- `needsManualVerification`

Expected status when this probe runs:

```text
Backend: workerw_child_native_host_probe
Attached: false
Probe attached: true
Manual verification: required
```

Manual verification:

1. Confirm packaged helper reports `0.1.10`.
2. Enter Native Wallpaper Mode and copy diagnostics immediately.
3. Confirm `selectedWorkerWStrategy` is `progman_child_workerw_algorithm`.
4. Confirm `workerWChildNativeHostProbeResult` is present.
5. Confirm no stale `DesktopMuseIdleWallpaperHost` remains before the new probe.
6. Check whether the wallpaper appears behind desktop icons.
7. If it appears in front of icons, check whether icon clicks pass through.
8. Confirm Alt+Tab and taskbar do not show the Wallpaper window.
9. Confirm `Win + D` leaves the wallpaper/probe visible.
10. Exit via Native Wallpaper OFF, HUD Exit, `Esc`, and app quit; each path must remove the host and leave no ghost window.

Do not promote this probe to `attached:true` before the checklist passes.

## Native Probe Display Rules

Helper `0.1.10` proved that `workerw_child_native_host_probe` can render behind desktop icons, but the foreground app also kept rendering a normal stage. Helper/app `0.1.11` treats this as duplicate display suppression work.

When `probeAttached:true` and `needsManualVerification:true`:

- Native Wallpaper drawing should be visible only through the WorkerW/Progman-hosted Wallpaper window.
- Fallback Stage must be hidden.
- The normal foreground `GameCanvas` must be hidden.
- The main app window may keep settings, diagnostics, and mode selector controls visible.
- Muse Overlay must not run at the same time.

Diagnostics to copy:

- `nativeProbeActive`
- `nativeProbeBackend`
- `nativeProbeVisible`
- `fallbackStageVisible`
- `overlayVisible`
- `mainStageVisible`
- `duplicateStageSuppressed`
- `duplicateStageSuppressionReason`
- `activeDisplaySurfaces`

Expected probe UI:

```text
Native Probe Active
Backend: workerw_child_native_host_probe
Attached: false
Probe attached: true
Manual verification required
Fallback Stage: hidden while native probe is active
```

If the foreground game canvas is still visible while `nativeProbeActive:true`, treat it as a `0.1.11` regression even if the WorkerW background probe is working.

## Wallpaper Surface / Control View Split

Helper/app `0.1.12` separates the two visible responsibilities:

- Back surface: `native_wallpaper_surface`
- Front surface: `main_window` Control View

The native wallpaper surface is click-through and visual-only. It may show:

- Muse
- background
- non-interactive visual effects

It must not show:

- `Exit Wallpaper`
- Native Wallpaper OFF
- settings
- diagnostics
- mode selector
- upgrade panel
- clickable HUD
- buttons, inputs, selects, or sliders

All operations stay in the foreground Control View:

- Exit Wallpaper / Native Wallpaper OFF
- Copy diagnostics
- mode selector
- settings
- status text

Diagnostics:

- `renderSurface`
- `nativeWallpaperSurface`
- `controlView`
- `nativeWallpaperSurfaceInteractiveUiVisible`
- `nativeWallpaperSurfaceButtonsVisible`
- `nativeWallpaperSurfaceExitButtonVisible`
- `controlViewExitButtonVisible`
- `wallpaperSurfaceClickThroughExpected`
- `wallpaperSurfaceUiSuppressed`
- `wallpaperSurfaceUiSuppressionReason`

Expected values while the probe is active:

```text
nativeWallpaperSurfaceInteractiveUiVisible: false
nativeWallpaperSurfaceButtonsVisible: false
nativeWallpaperSurfaceExitButtonVisible: false
controlViewExitButtonVisible: true
wallpaperSurfaceClickThroughExpected: true
wallpaperSurfaceUiSuppressed: true
```

Manual behavior:

- Back: Muse/background only.
- Front: Control View only.
- Minimizing the Control View should leave the wallpaper visible.
- `Win + D` should hide the Control View and leave the wallpaper visible.

## Native Wallpaper Control View

In `0.1.13`, Native Wallpaper ON must show a small foreground Control View instead of a normal game window.

Control View must show:

- Exit Wallpaper / Native Wallpaper OFF.
- Copy diagnostics.
- Mode selector.
- Native Wallpaper status.
- Backend, `probeAttached`, and `needsManualVerification`.

Control View must not show:

- `GameCanvas`.
- Wallpaper Stage.
- Muse Overlay.
- The back wallpaper surface.

Expected diagnostics:

```text
renderSurface: control_view
controlView: true
controlViewVisible: true
controlViewExitButtonVisible: true
controlViewDiagnosticsVisible: true
controlViewModeSelectorVisible: true
mainStageVisible: false
fallbackStageVisible: false
overlayVisible: false
mainWindowCoversPrimaryScreen: false
mainWindowMayBlockDesktopClicks: false
```

In `0.1.14`, the Control View is also expected to behave like a small operation panel:

- The top area reads `Native Wallpaper Control`.
- The titlebar area is draggable.
- The right-top `Minimize` button minimizes only the foreground Control View.
- The right-top close button performs the same cleanup path as `Exit Wallpaper`.
- The back native wallpaper surface continues rendering while the Control View is minimized.
- The Control View can be restored from the taskbar.
- The foreground does not show `GameCanvas`, Wallpaper Stage, Muse Overlay, or the back wallpaper surface.

Expected `0.1.14` diagnostics:

```text
controlViewMode: native_wallpaper_control
controlViewMovable: true
controlViewDraggable: true
controlViewMinimizeButtonVisible: true
controlViewCloseButtonVisible: true
controlViewCloseAction: exit_native_wallpaper
controlViewMinimized: false
controlViewBounds: <small foreground panel bounds>
controlViewRestoreTargetScreen: <display diagnostics>
duplicateStageSuppressed: true
```

In `0.1.15`, the Electron BrowserWindow itself must also become a compact Control View window. CSS-only compaction is not enough.

Expected foreground window behavior:

- Save the previous main-window bounds and state before Native Wallpaper starts.
- Resize the foreground main window to about `480x320`.
- Place it near the right-top of the primary work area.
- Leave fullscreen/maximized state before resizing.
- Suppress File/Edit/View/Window menu chrome while the Control View is active.
- Disable resizing or constrain it tightly for the Control View.
- Restore the saved bounds/state/menu visibility after Native Wallpaper OFF / Exit / Esc / app quit cleanup.

Expected `0.1.15` diagnostics:

```text
savedMainWindowBoundsBeforeNativeWallpaper: <bounds>
savedMainWindowStateBeforeNativeWallpaper: <state>
savedMenuBarVisibleBeforeNativeWallpaper: true|false
controlViewWindowBounds: <roughly 480x320 bounds>
controlViewWindowResized: true
controlViewWindowResizeReason: native_wallpaper_probe_active
controlViewMenuBarVisible: false
menuBarSuppressedForControlView: true
controlViewLayoutCompact: true
controlViewLargeBlankSuppressed: true
mainGameLayoutMounted: false
wallpaperStageLayoutMounted: false
nativeWallpaperControlViewMounted: true
restoredMainWindowBoundsAfterNativeWallpaper: <bounds after exit>
restoredMainWindowStateAfterNativeWallpaper: <state after exit>
restoreMainWindowReason: native_wallpaper_exit
```

In `0.1.16`, the Control View is no longer the normal `mainWindow`. Native Wallpaper uses a dedicated `Native Wallpaper Control` BrowserWindow:

- `width: 560`
- `height: 400`
- `minWidth: 520`
- `minHeight: 360`
- `frame: false`
- `transparent: false`
- `skipTaskbar: false`
- route/query: `nativeWallpaperControl=1`

The normal `mainWindow` is saved and hidden while the native probe is active. The dedicated Control Window mounts only `NativeWallpaperControlView`; it does not mount the normal game app shell, `GameCanvas`, Wallpaper Stage layout, or Wallpaper HUD.

Primary controls in the dedicated Control Window:

- `Minimize`
- `Exit Wallpaper`
- `Copy Diagnostics`

Do not add duplicate `x`, duplicate OFF, WallpaperStageHud Exit, or normal mode buttons to this window.

Expected `0.1.16` diagnostics:

```text
nativeWallpaperControlWindowCreated: true
nativeWallpaperControlWindowVisible: true
nativeWallpaperControlWindowBounds: <roughly 560x400 bounds>
nativeWallpaperControlWindowFrameless: true
nativeWallpaperControlWindowDraggable: true
nativeWallpaperControlWindowRoute: nativeWallpaperControl=1
nativeWallpaperControlWindowButtonCount: 3
duplicateControlButtonsDetected: false
mainWindowHiddenForNativeWallpaper: true
mainWindowRestoredAfterNativeWallpaper: true after exit
```

The Control View should be a small panel, not a transparent full-screen window. Outside the Control View bounds, desktop icons, desktop right-click, and drag selection should work.

## App Screen Restoration

Entering Native Wallpaper must not reset the app to the title screen. The renderer records the app screen before Native Wallpaper and restores it after OFF/Exit/Esc.

Diagnostics:

- `appScreen`
- `previousAppScreenBeforeNativeWallpaper`
- `restoredAppScreenAfterNativeWallpaperOff`
- `nativeWallpaperChangedAppScreen`
- `mainWindowGameCanvasSuppressed`
- `mainWindowGameCanvasSuppressionReason`
- `normalGameCanvasVisible`
- `normalBackgroundVisible`
- `normalMuseVisible`

Expected behavior:

- `nativeWallpaperChangedAppScreen: false`
- OFF returns to the previous app screen.
- Starting/continuing a game after OFF shows Muse, background, and `GameCanvas` normally.

## Desktop Click Blocking Diagnostics

If desktop icons cannot be clicked, first distinguish the back wallpaper surface from the foreground Control View:

- `desktopIconClickThroughExpected`
- `desktopIconClickThroughBlockedSuspected`
- `mainWindowMayBlockDesktopClicks`
- `wallpaperWindowMayBlockDesktopClicks`
- `controlViewMayBlockDesktopClicks`
- `electronWallpaperIgnoreMouseEventsEnabled`
- `nativeHostTransparentEnabled`
- `nativeHostNoActivateEnabled`
- `nativeHostToolWindowEnabled`

Expected behavior:

- Back wallpaper surface is click-through.
- Control View may receive clicks only inside its small bounds.
- Desktop icons outside Control View are clickable.
- Desktop right-click menu appears outside Control View.
- Desktop empty-area drag selection works outside Control View.

## Overlay Separation

Native Wallpaper and Muse Overlay are mutually exclusive. Entering Native Wallpaper exits Overlay first. While a native probe is active, the Muse Overlay button is disabled and explains that the two modes cannot be enabled at the same time.

## Stale Host Cleanup

Before starting a new native wallpaper probe, helper `0.1.10` scans Progman children for stale Desktop Muse host windows:

- class name `DesktopMuseIdleWallpaperHost`
- title beginning with `Desktop Muse Idle`

Diagnostics:

- `staleHostWindowsBeforeCleanup`
- `cleanupStaleHostWindowsAttempted`
- `cleanupStaleHostWindowsSucceeded`
- `cleanupStaleHostWindowsFailed`
- `progmanChildrenAfterCleanup`

If stale hosts remain after cleanup, keep the result as a manual-verification failure and record the copied diagnostics.

## Progman Native Host Probe

Helper `0.1.8` added `progman_native_host_probe` as a diagnostic-only fallback when no desktop-sized WorkerW is available. In packaged testing it rendered but appeared in front of desktop icons and blocked clicks. Helper `0.1.9` keeps this probe as a fallback only after WorkerW strategy probes are unavailable, and adds z-order / click-through diagnostics.

This probe is attempted only when:

- Progman is found.
- Progman is visible.
- Progman has `SHELLDLL_DefView` as a descendant.
- Progman has `SysListView32` as a descendant.
- Progman covers or matches the primary screen.

The probe creates a helper-owned native host window under Progman and places the Electron Wallpaper window inside that host. It reports:

- `backend: "progman_native_host_probe"`
- `probeAttached: true`
- `needsManualVerification: true`
- `attached: false`
- `progmanCandidate`
- `progmanNativeHostHwnd`
- `parentHwndAfterSetParent`
- `hostWindowRect`
- `wallpaperWindowRect`
- `zOrderResult`
- `progmanNativeHostProbeResult`
- `progmanChildrenBeforeProbe`
- `progmanChildrenAfterHostCreate`
- `progmanChildrenAfterSetParent`
- `progmanChildrenAfterZOrder`
- `zOrderStrategyResults`
- `hostRelativeToShellDllDefView`
- `hostRelativeToSysListView32`
- `clickThroughEnabled`
- `nativeHostTransparentEnabled`
- `electronIgnoreMouseEventsEnabled`

Important: this is not a verified success backend. `attached` must remain `false` until packaged manual verification proves that it behaves like a real desktop wallpaper.

Manual verification checklist when the probe appears:

1. Confirm the UI shows `Helper: reachable 0.1.9`, `Backend: progman_native_host_probe`, `Attached: false`, and `Manual verification: required`.
2. Click `Copy diagnostics` and save the JSON before interacting further.
3. Confirm whether the wallpaper appears behind desktop icons.
4. Confirm whether it appears in front of desktop icons. If it does, the probe failed.
5. Confirm desktop icon clicks are not blocked.
6. Confirm Alt+Tab does not show an extra Wallpaper window.
7. Confirm the taskbar has no extra Wallpaper window.
8. Press `Win + D` and confirm whether the wallpaper remains.
9. Exit via Native Wallpaper OFF, Wallpaper HUD Exit, `Esc`, and app quit; each path must remove the host and Electron Wallpaper window.
10. Confirm no ghost transparent window remains after app quit.
11. Restart Explorer and confirm the app does not report stale verified success.

If any item fails, keep the result as `fallback_stage` / `attached:false` and record the failed behavior with the copied diagnostics.

## Z-order / Coordinate / Click-through Diagnostics

For `0.1.9`, every probe result should be read with these fields:

- `requestedScreenRect`
- `requestedParentClientRect`
- `progmanWindowRect`
- `progmanClientRect`
- `hostRectBeforeSetParent`
- `hostRectAfterSetParent`
- `hostRectAfterSetWindowPos`
- `wallpaperRectAfterSetParent`
- `wallpaperRectAfterSetWindowPos`
- `coordinateMode`
- `rectMismatch`
- `zOrderStrategy`
- `zOrderStrategyResults`
- `hostRelativeToShellDllDefView`
- `hostRelativeToSysListView32`
- `clickThroughEnabled`
- `electronIgnoreMouseEventsEnabled`
- `nativeHostTransparentEnabled`
- `nativeHostNoActivateEnabled`
- `nativeExStyleBeforeClickThrough`
- `nativeExStyleAfterClickThrough`

The useful packaged result is not only "behind icons". A probe is also worth preserving if it is visually in front but reliably click-through, absent from Alt+Tab/taskbar, survives `Win + D`, and cleans up without a ghost window. Formal success still requires a later version decision.

## Packaged Windows Manual Verification

Before testing, rebuild the packaged app so the unpacked resources contain helper `0.1.16`:

```powershell
npm.cmd run electron:build
release\win-unpacked\resources\wallpaper-helper\wallpaper-helper.exe version
```

The version command must report `helperVersion: "0.1.16"`. If it reports an older version, do not use that packaged folder for Native Wallpaper verification.

Manual verification flow:

1. Launch `release\win-unpacked\Desktop Muse Idle.exe`.
2. Open Settings or Wallpaper panel and select Native Desktop Wallpaper.
3. Confirm the status panel shows `Helper: reachable 0.1.16`, `Native Probe Active`, `Backend`, `Attached`, `Probe attached`, `Manual verification`, `renderSurface: control_view`, dedicated Control Window diagnostics, `Fallback Stage: hidden`, `Main Stage: hidden`, wallpaper surface UI suppressed, `mainWindowMayBlockDesktopClicks:false`, `Helper PID`, selected WorkerW strategy/HWND, selected Progman child WorkerW, stale cleanup status, WorkerW HWND, Native Host HWND, Electron Wallpaper HWND, Parent after SetParent, Rect mismatch, z-order strategy, click-through, and Reason/Fallback reason.
4. Use `Copy diagnostics` immediately after entering the mode and after any failure.
5. Confirm the wallpaper renders behind desktop icons and behind the taskbar.
6. Confirm Alt+Tab does not show an extra Wallpaper window and the taskbar has no extra Wallpaper window.
7. Press `Win + D` and confirm the wallpaper remains visible.
8. Click desktop icons and confirm the wallpaper does not intercept clicks.
9. Confirm the normal app window is hidden and the foreground window is the dedicated frameless `Native Wallpaper Control` window.
10. Drag the Control Window titlebar and confirm it moves.
11. Press `Minimize`; confirm only the Control Window is minimized, the wallpaper remains visible, and the taskbar restores the panel.
12. Press `Exit Wallpaper` and confirm it exits Native Wallpaper, removes the back surface, closes the Control Window, cleans up helper/host/window state, and restores the previous app screen.
13. Repeat exit via `Esc` and Native Wallpaper OFF from UI; each path must remove the wallpaper.
13. Quit the app and confirm no transparent or ghost window remains.
14. Restart Explorer while Native Wallpaper is active. The app must not keep reporting `native_desktop_wallpaper` / `attached:true`; it should recheck and show `fallback_stage` / `attached:false` with a reason if the WorkerW or host disappeared.

Do not proceed to WebView2 or helper-native rendering until this checklist has a clear packaged result.

## Known MVP Limits

- Primary display sizing only.
- No virtual-screen or multi-monitor span support yet.
- DPI-specific coordinate handling is not implemented yet.
- Detach is best-effort; Electron asks the persistent host helper to exit and still closes the Wallpaper BrowserWindow as the final cleanup fallback.

## Non-goals For The MVP

- Do not add native Node addons.
- Do not add FFI dependencies to Electron.
- Do not report success without WorkerW attachment.
- Do not persist active Native Wallpaper Mode.
- Do not alter Corner Hit, Memory, Stage progression, rewards, or save data.
