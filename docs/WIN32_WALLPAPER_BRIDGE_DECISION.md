# Win32 Wallpaper Bridge Decision

## Status

Desktop Muse Idle currently has a Native Desktop Wallpaper MVP entry point and a C# helper bridge.

- Web development: `browser_only`
- Electron Wallpaper Stage: `electron_window`
- Muse Overlay: `transparent_overlay`
- Native Desktop Wallpaper: host-helper attempt first, then `fallback_stage` when native attach is unavailable

The current Electron path creates a dedicated hidden Wallpaper `BrowserWindow`, obtains its native HWND, and asks the C# helper to run `host --hwnd <HWND>`. Direct Electron `BrowserWindow` -> WorkerW `SetParent` is retained only as a diagnostic probe and must not be treated as verified native wallpaper success.

## Decision

Use a **C# self-contained helper exe** as the first real Win32 bridge implementation.

Electron should call the helper only from the main process:

`platformAdapter -> electronAdapter -> preload IPC -> Electron main process -> wallpaper-helper.exe`

React components must never call the helper or Win32 APIs directly.

## Candidate Comparison

| Option | Implementation difficulty | Codex implementation fit | Electron safety | Windows distribution stability | Steam bundling | Build dependency | Fallback behavior | Maintenance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C# helper exe | Medium | Good. P/Invoke is explicit and readable. | Strong. Helper failure is isolated from Electron. | Good if published self-contained x64. | Good. Ship helper beside Electron resources. | Requires .NET SDK for helper builds, not for Electron runtime if self-contained. | Strong. Missing/failed helper returns fallback. | Good. Clear code, easier diagnostics. |
| C++ helper exe | Medium-high | Moderate. Win32 is direct but more error-prone. | Strong. Separate process isolates crashes. | Very good when built with stable toolchain/runtime choices. | Good. Small exe is easy to ship. | Requires MSVC/Windows SDK. | Strong. Same process isolation benefits. | Moderate. Lower-level memory/window handling. |
| Node native addon | High | Weak for this repo. ABI and Electron version coupling add friction. | Weaker. Native crash can take Electron down. | Riskier across Electron/Node upgrades. | More complex. Must ship correct binary per arch/Electron ABI. | Requires node-gyp toolchain and rebuild policy. | Medium. Runtime load failure can fallback, native crashes are harder. | Lower. ABI churn. |
| ffi-napi / user32.dll | Medium initially, high operationally | Weak-medium. Fast prototype but dependency risk is high. | Weaker. Runs inside Electron process. | Risky with Electron ABI and native module packaging. | More complex. Native module packaging/signing concerns. | Adds native npm dependency and install/build risk. | Medium. Load errors can fallback, call errors can destabilize. | Lower. Dependency health and ABI issues. |

## Recommended Approach

Choose **C# helper exe** for the first real implementation.

Reasons:

- Keeps Electron and React code behind the existing platform adapter boundary.
- Prevents Win32 mistakes or helper crashes from taking down the renderer process.
- Allows helper absence or attach failure to remain a normal `fallback_stage` path.
- P/Invoke keeps the Win32 calls explicit without adding Electron native addon ABI risk.
- A self-contained x64 publish can be bundled with Steam/Electron without requiring users to install .NET.
- Helper stdout/stderr can provide structured status for diagnostics.

## Non-recommended Approaches

- **Node native addon**: avoid for the first implementation because it couples this feature to Electron's Node ABI and can crash the main process on native failure.
- **ffi-napi / direct user32.dll calls**: avoid for the first implementation because it adds native npm dependency and packaging risk while still running inside Electron.
- **C++ helper exe**: viable later if we need smaller binary size or tighter control. It is not the first choice because C# P/Invoke is faster to review and iterate for this project.

## Native Host WorkerW Attach Plan

The helper should prefer a persistent native host command:

```text
wallpaper-helper.exe host --hwnd <decimal-or-hex-hwnd>
```

The command returns JSON on stdout:

```json
{
  "ok": true,
  "command": "host",
  "attached": true,
  "attachMethod": "native_host_window",
  "workerW": "0x00000000",
  "hostHwnd": "0x00000000",
  "message": "attached"
}
```

Failure returns:

```json
{
  "ok": false,
  "attached": false,
  "message": "reason"
}
```

Implementation steps inside the helper:

1. Find the `Progman` window with `FindWindow("Progman", null)`.
2. Send the WorkerW creation message to Progman with `SendMessageTimeout(Progman, 0x052C, ...)`.
3. Enumerate top-level windows with `EnumWindows`.
4. For each top-level window, look for a child `SHELLDLL_DefView` using `FindWindowEx`.
5. Identify the WorkerW behind the desktop icon layer. Common strategy:
   - Find the top-level window that owns `SHELLDLL_DefView`.
   - Find the next sibling `WorkerW` behind or adjacent to that shell view.
   - Validate the candidate before using it.
6. Create a helper-owned native host window as a child of the selected WorkerW.
7. Receive the Electron Wallpaper `BrowserWindow` HWND from Electron.
8. Parent the Electron Wallpaper window into the helper host window and adjust its style if needed:
   - Remove caption/border styles if present.
   - Ensure child-window behavior is compatible after `SetParent`.
9. Position the host and child windows to match the selected desktop target bounds.
10. Return structured JSON to Electron with `attached: true` only after all host steps succeed.
11. Keep the helper process alive with a message loop. Electron sends `exit` on stdin during Native Wallpaper exit so the helper can restore the child parent/style before the Wallpaper window is closed.

The legacy `attach --hwnd <HWND>` command can still run a direct `SetParent` probe for diagnostics. It must return `attached: false` because real Windows verification showed that API success alone does not satisfy the native wallpaper requirements.

## Detach / Exit Plan

Native host detach is conservative:

1. Electron owns the Wallpaper `BrowserWindow`.
2. Electron sends `exit` to the persistent host helper on stdin.
3. The helper restores the Wallpaper child parent/style and exits its message loop.
4. Electron closes the Wallpaper window as the final cleanup fallback.

Closing the Wallpaper window remains the final fallback if helper cleanup is partial.

## Electron Integration Plan

1. Keep `enterNativeWallpaperMode()` in `electron/main.cjs` as the only Electron entry point.
2. Create the dedicated Wallpaper `BrowserWindow`.
3. Wait for the window to be ready enough to have a stable native HWND.
4. Get the HWND with `wallpaperWindow.getNativeWindowHandle()`.
5. Resolve helper path:
   - development: `native/wallpaper-helper/bin/.../wallpaper-helper.exe` or a documented env override.
   - packaged app: `process.resourcesPath` or bundled `electron/resources` helper location.
6. If the helper is missing, return `fallback_stage` with a clear `lastError`.
7. Spawn the persistent helper with `host --hwnd <HWND>` and a short timeout for its first JSON status line.
8. Parse JSON stdout and keep the helper process alive when host attach succeeds.
9. If `ok && attached`, show the Wallpaper window inactive and set status:
   - `supported: true`
   - `active: true`
   - `backend: "native_desktop_wallpaper"`
   - `attached: true`
   - `helperRunning: true`
10. If attach fails, close the Wallpaper window and set status:
   - `backend: "fallback_stage"`
   - `fallbackActive: true`
   - `attached: false`
   - `lastError: "Native wallpaper attach failed. Fallback to Wallpaper Stage Mode. ..."`

## Status Model Updates

Extend `NativeWallpaperStatus` in a future implementation to include:

```ts
interface NativeWallpaperStatus {
  supported: boolean;
  active: boolean;
  backend: 'fallback_stage' | 'none' | 'web_preview' | 'electron_window' | 'native_desktop_wallpaper';
  attached?: boolean;
  attachMethod?: string;
  helperRunning?: boolean;
  hostHwnd?: string;
  fallbackActive?: boolean;
  lastError?: string;
}
```

The existing `nativeAttached` field can be kept temporarily for compatibility, but new code should converge on `attached`.

## Fallback Rules

Fallback is required when:

- Platform is not Windows.
- Helper exe is missing.
- Helper exits non-zero.
- Helper stdout is not valid JSON.
- Progman or WorkerW cannot be found.
- `SetParent` fails.
- `SetWindowPos` fails.
- Electron window is destroyed during attach.

Any fallback must keep game progress, rewards, save data, Muse Overlay, and Wallpaper Stage behavior unchanged.

## 0.1.8 Packaged Diagnostic Result

Packaged helper `0.1.7` confirmed that this Windows environment can enumerate WorkerW windows but cannot find an eligible desktop-sized WorkerW:

- `workerwCandidateCount`: 15.
- All WorkerW candidates were rejected as `not_visible` or `empty_rect`.
- `closestWorkerWHwnd`: `131340`.
- `closestWorkerWReason`: `not_visible`.
- `workerWCreatedHwnds` / `workerWRemovedHwnds`: empty after Progman `0x052C` messages.
- Progman was visible, had `SHELLDLL_DefView` and `SysListView32`, and covered the primary screen.

Decision for `0.1.8`:

- Do not loosen WorkerW success to accept hidden or empty WorkerW candidates.
- Do not restore Electron `BrowserWindow` direct `SetParent` as a valid backend.
- Do not restore `progman_desktop_child` as a valid success backend.
- Add `progman_native_host_probe` only as a diagnostic/manual-verification path.
- Keep `attached:false` and `needsManualVerification:true` for the Progman probe until the packaged checklist proves real wallpaper behavior.

## 0.1.9 Re-Verification Rationale

Packaged helper `0.1.8` showed that the Progman native host probe can pass API checks but still fail desktop behavior:

- `backend`: `progman_native_host_probe`.
- `attached`: `false`.
- `probeAttached`: `true`.
- `needsManualVerification`: `true`.
- `setParentSucceeded`, `setWindowPosSucceeded`, and `zOrderSucceeded`: `true`.
- Manual result: the wallpaper appeared in front of desktop icons and blocked desktop clicks.

This does not prove that Native Desktop Wallpaper Mode is impossible. Lively Wallpaper and electron-as-wallpaper style implementations commonly rely on `0x052C`, `WorkerW`, shell-view relationships, and web-rendered content. The next decision point is therefore to compare our WorkerW discovery and z-order assumptions against those classic approaches.

Decision for `0.1.9`:

- Keep Native Desktop Wallpaper Mode under active investigation.
- Add strategy diagnostics for current, classic `0x052C`, `SHELLDLL_DefView` owner based, next sibling WorkerW, and `FindWindowEx` based discovery.
- Allow hidden-but-plausible WorkerW candidates to run a manual-verification-only native host probe when they are not safe for verified attach.
- Strengthen Progman z-order diagnostics because `HWND_BOTTOM` under Progman still appeared in front of icons.
- Add click-through diagnostics with Electron `setIgnoreMouseEvents(true, { forward: true })` plus native `WS_EX_TRANSPARENT` / `WS_EX_NOACTIVATE`.
- Keep every investigation path as `attached:false`, `probeAttached:true`, and `needsManualVerification:true`.
- Do not restore direct Electron `BrowserWindow` SetParent or `progman_desktop_child` as success backends.
- Defer WebView2 or helper-native rendering until packaged `0.1.9` diagnostics show whether WorkerW, z-order, or click-through provides a viable route.

## 0.1.10 Progman Child WorkerW Finding

Packaged helper `0.1.9` showed two important details:

- The common top-level WorkerW discovery strategies still selected only tiny hidden WorkerWs, not a desktop-sized target.
- Progman children included a full-size visible `WorkerW` with no `SHELLDLL_DefView` or `SysListView32`, matching the primary screen.

The same diagnostics also showed an old `DesktopMuseIdleWallpaperHost` child under Progman before the new probe started, suggesting stale helper host cleanup needed to be treated as part of the attach path.

Decision for `0.1.10`:

- Add `progman_child_workerw_algorithm`.
- Treat full-size visible Progman child WorkerW as a manual-verification-only probe target.
- Add `workerw_child_native_host_probe` so this route is distinguishable from top-level WorkerW probes and Progman host probes.
- Clean stale Desktop Muse host windows under Progman before starting any new probe.
- Keep `attached:false`, `probeAttached:true`, and `needsManualVerification:true` until packaged manual checks prove icon back-layer behavior or reliable click-through.

## 0.1.11 Duplicate Display Finding

Packaged `0.1.10` confirmed an important breakthrough:

- `workerw_child_native_host_probe` rendered behind desktop icons.
- The selected strategy was `progman_child_workerw_algorithm`.
- The native host was parented under the Progman child WorkerW.
- Host and wallpaper rects matched the primary screen.

The remaining issue was not WorkerW placement, but duplicate foreground rendering: the main app still showed the same game/stage in front of the desktop.

Decision for `0.1.11`:

- Do not promote to `attached:true` yet.
- Treat `probeAttached:true` as an active native probe display, not as a fallback-stage failure.
- Hide the foreground Wallpaper Stage and normal game canvas during native probes.
- Keep only diagnostics/settings/mode controls in the main window.
- Forbid Muse Overlay and Native Wallpaper probe from running together.
- Add display-surface diagnostics so packaged logs can prove whether duplicate rendering was suppressed.

## 0.1.12 Surface UI Separation

Packaged `0.1.11` confirmed the WorkerW child route is close to viable:

- Background rendering through the native host worked.
- Desktop icons remained clickable.
- `Win + D` left the wallpaper visible.
- Cleanup generally avoided ghost windows.

The new problem was UI placement: the click-through wallpaper surface displayed an `Exit Wallpaper` button. Since the surface intentionally ignores mouse input, this created a false affordance.

Decision for `0.1.12`:

- Treat the native wallpaper surface as visual-only.
- Hide all interactive UI from `nativeWallpaperRenderer=1`.
- Keep Exit/OFF/diagnostics/settings/mode controls in the foreground Control View only.
- Add diagnostics that prove the back surface has no interactive UI while the Control View has the exit control.
- Continue to keep `attached:false`, `probeAttached:true`, and `needsManualVerification:true` until the full checklist passes.

## 0.1.13 Control View Recovery

Packaged `0.1.12` confirmed that the wallpaper surface / Control View split was only partial:

- The back surface showed Muse/background only.
- `Exit Wallpaper` no longer appeared on the back surface.
- The foreground Control View could be missing or hard to find.
- The foreground main window could still cover the desktop and block icon clicks.
- Returning from Native Wallpaper could leave the app at title or with normal UI but no Muse/background/canvas.

Decision for `0.1.13`:

- Keep the WorkerW child native host path as a probe only.
- Make the foreground main window an explicit small Control View while native probe is active.
- Restore the previous main-window geometry and app screen after OFF/Exit/Esc/fallback.
- Prioritize Control View rendering over title/settings/game screen branches while `nativeProbeActive`.
- Add diagnostics for window bounds, primary-screen coverage, click blocking, app-screen restoration, and normal-game visibility.

## 0.1.14 Control View UX

Packaged `0.1.13` improved the foreground state enough that only a small Control View remained, but the operation panel itself was still awkward:

- The panel behaved as a fixed foreground window.
- There was no clear in-app titlebar or right-top close action.
- Hiding the panel required `Win + D` instead of a normal minimize affordance.
- Exit/diagnostics needed to stay in the foreground Control View, not on the visual-only wallpaper surface.

Decision for `0.1.14`:

- Keep Native Wallpaper as a manual-verification probe with `attached:false`, `probeAttached:true`, and `needsManualVerification:true`.
- Add a dedicated draggable `Native Wallpaper Control` titlebar inside the foreground Control View.
- Add explicit `Minimize` and right-top `Exit Wallpaper` controls.
- Minimize only the Control View; keep the WorkerW child wallpaper probe alive behind desktop icons.
- Keep cleanup routed through the existing Native Wallpaper OFF/Exit path so host/helper/window cleanup and previous app-screen restoration are preserved.
- Add diagnostics for Control View movement, draggable region, minimize/close button visibility, minimized state, bounds, and restore target screen.

## Manual Verification After Real Attach

Run the packaged Windows build and verify:

1. Select Native Desktop Wallpaper from Settings or WallpaperModePanel.
2. Status reports `backend: native_desktop_wallpaper` and `attached: true`.
3. `Win + D` leaves the wallpaper visible.
4. The wallpaper renders behind desktop icons.
5. Desktop icons remain clickable.
6. Alt + Tab does not show the Wallpaper window as a normal app.
7. Taskbar does not show the Wallpaper window.
8. Opening another app leaves the wallpaper behind it.
9. Exit closes the Wallpaper window and restores normal game UI.
10. If attach fails, status reports fallback and the existing Wallpaper Stage mode remains usable.
