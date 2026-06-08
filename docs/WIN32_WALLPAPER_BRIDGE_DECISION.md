# Win32 Wallpaper Bridge Decision

## Status

Desktop Muse Idle currently has a Native Desktop Wallpaper MVP entry point, but real Windows desktop-layer attachment is not implemented yet.

- Web development: `browser_only`
- Electron Wallpaper Stage: `electron_window`
- Muse Overlay: `transparent_overlay`
- Native Desktop Wallpaper: `fallback_stage` MVP with C# helper skeleton

The current Electron MVP creates a dedicated hidden Wallpaper `BrowserWindow`, obtains its native HWND, passes that HWND to the C# helper skeleton when available, and then falls back because the helper returns `attach_not_implemented`.

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

## WorkerW Attach Plan

The helper should implement one command first:

```text
wallpaper-helper.exe attach --hwnd <decimal-or-hex-hwnd> --x <px> --y <px> --width <px> --height <px>
```

The command returns JSON on stdout:

```json
{
  "ok": true,
  "attached": true,
  "workerW": "0x00000000",
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
6. Receive the Electron Wallpaper `BrowserWindow` HWND from Electron.
7. Adjust the Wallpaper window style if needed:
   - Remove caption/border styles if present.
   - Ensure child-window behavior is compatible after `SetParent`.
8. Call `SetParent(wallpaperHwnd, workerWHwnd)`.
9. Position the Wallpaper window with `SetWindowPos` to match the primary display bounds passed by Electron.
10. Return structured JSON to Electron with `attached: true` only after all steps succeed.

## Detach / Exit Plan

Initial MVP detach can be conservative:

1. Electron owns the Wallpaper `BrowserWindow`.
2. On exit, Electron closes the Wallpaper window.
3. The helper does not need to keep a long-running process for MVP attach.
4. If a later persistent helper is used, add:
   - `detach --hwnd <hwnd>`
   - `status`
   - watchdog cleanup for dead Electron parent process.

Closing the Wallpaper window should be the first detach strategy because the child HWND disappears from WorkerW without needing to reparent it to the main app.

## Electron Integration Plan

1. Keep `enterNativeWallpaperMode()` in `electron/main.cjs` as the only Electron entry point.
2. Create the dedicated Wallpaper `BrowserWindow`.
3. Wait for the window to be ready enough to have a stable native HWND.
4. Get the HWND with `wallpaperWindow.getNativeWindowHandle()`.
5. Resolve helper path:
   - development: `native/wallpaper-helper/bin/.../wallpaper-helper.exe` or a documented env override.
   - packaged app: `process.resourcesPath` or bundled `electron/resources` helper location.
6. If the helper is missing, return `fallback_stage` with a clear `lastError`.
7. Spawn the helper with a short timeout.
8. Parse JSON stdout.
9. If `ok && attached`, show the Wallpaper window inactive and set status:
   - `supported: true`
   - `active: true`
   - `backend: "native_desktop_wallpaper"`
   - `attached: true`
   - `helperRunning: false` for one-shot helper, or true if persistent helper is later added.
10. If attach fails, close the Wallpaper window and set status:
   - `backend: "electron_window"`
   - `fallbackActive: true`
   - `attached: false`
   - `lastError: "Native wallpaper attach failed. Fallback to Wallpaper Stage Mode. ..."`

## Status Model Updates

Extend `NativeWallpaperStatus` in a future implementation to include:

```ts
interface NativeWallpaperStatus {
  supported: boolean;
  active: boolean;
  backend: 'none' | 'web_preview' | 'electron_window' | 'native_desktop_wallpaper';
  attached?: boolean;
  helperRunning?: boolean;
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
