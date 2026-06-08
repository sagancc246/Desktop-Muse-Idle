# Native Desktop Wallpaper Mode

## Current State

Native Desktop Wallpaper Mode is currently a Windows Electron MVP with a safe fallback.

- The renderer exposes `native_wallpaper` as a Wallpaper Mode option.
- Electron creates a dedicated Wallpaper `BrowserWindow`.
- Electron obtains the Wallpaper window native HWND.
- Electron can launch the C# helper and pass the Wallpaper window HWND to it.
- The helper can be published as a Windows self-contained exe and bundled into packaged Electron builds.
- The helper returns JSON for `status`, `version`, `find-desktop`, `attach`, and `detach`.
- `find-desktop` performs a dry-run Progman / WorkerW / SHELLDLL_DefView discovery pass.
- `attach --hwnd <HWND> --dry-run` validates the HWND, performs desktop discovery, and returns `dryRun: true`, `attached: false`, and `reason: "dry_run_no_set_parent"`.
- `attach --hwnd <HWND>` attempts WorkerW attach with `SetParent`, window style adjustment, and `SetWindowPos`.
- `detach --hwnd <HWND>` attempts to restore the previous parent/style values supplied by Electron, then Electron closes the Wallpaper BrowserWindow as the final cleanup fallback.
- The expected result is `native_desktop_wallpaper` only when helper attach verifies `attached: true`; otherwise the app remains in `fallback_stage`.

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
- `helperLastResult` contains the raw parsed helper result as a debug string.
- `lastError` explains the fallback reason.
- The renderer remains usable through the existing Wallpaper Stage presentation.

If the helper is built and reachable, a successful attach result includes:

```json
{
  "ok": true,
  "command": "attach",
  "attached": true,
  "backend": "native_desktop_wallpaper",
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

## Known MVP Limits

- Primary display sizing only.
- No virtual-screen or multi-monitor span support yet.
- DPI-specific coordinate handling is not implemented yet.
- Detach is best-effort; Electron closes the Wallpaper BrowserWindow even if helper detach is partial.

## Non-goals For The MVP

- Do not add native Node addons.
- Do not add FFI dependencies to Electron.
- Do not report success without WorkerW attachment.
- Do not persist active Native Wallpaper Mode.
- Do not alter Corner Hit, Memory, Stage progression, rewards, or save data.
