# Wallpaper Helper

This directory contains the Windows-only Native Desktop Wallpaper helper.

Selected direction: C# self-contained helper exe.

The helper is a C# console project. It should be built outside the Electron renderer and called only by Electron main process code.

Current commands:

```text
wallpaper-helper.exe version
wallpaper-helper.exe status
wallpaper-helper.exe find-desktop
wallpaper-helper.exe host --hwnd <hwnd>
wallpaper-helper.exe inspect --hwnd <hwnd> --host-hwnd <hwnd> --workerw-hwnd <hwnd>
wallpaper-helper.exe attach --hwnd <hwnd>
wallpaper-helper.exe attach --hwnd <hwnd> --dry-run
wallpaper-helper.exe detach --hwnd <hwnd>
```

Current behavior:

- `version` returns helper metadata as JSON.
- `status` returns helper reachability as JSON.
- `find-desktop` searches for Progman, sends the WorkerW creation message, enumerates WorkerW / SHELLDLL_DefView candidates, and returns the dry-run discovery result as JSON.
- `find-desktop` also reports WorkerW candidates before/after the Progman `0x052C` messages, per-candidate geometry/style/monitor/icon-view diagnostics, reject reasons, selection order, closest rejected WorkerW, and WorkerW discovery strategy diagnostics.
- `attach --hwnd <hwnd> --dry-run` validates that `--hwnd` exists, runs desktop discovery, and returns `attached: false`, `dryRun: true`, and `reason: "dry_run_no_set_parent"`.
- `host --hwnd <hwnd>` creates a native helper-owned host window, places that host under the selected WorkerW/probe target, parents the Electron Wallpaper window into the host, writes the probe JSON, and keeps running until Electron sends `exit` on stdin.
- In helper `0.1.16`, WorkerW host attempts are investigation probes unless packaged manual verification proves the desktop behavior. Top-level WorkerW probes return `backend: "workerw_native_host_probe"`; Progman child WorkerW probes return `backend: "workerw_child_native_host_probe"`. Both keep `attached: false`, `probeAttached: true`, and `needsManualVerification: true`.
- Before starting a probe, the helper scans Progman for stale `DesktopMuseIdleWallpaperHost` children and reports cleanup diagnostics.
- If no useful WorkerW probe target exists, `host --hwnd <hwnd>` may run `progman_native_host_probe`. This also keeps `attached: false`, sets `probeAttached: true` and `needsManualVerification: true`, and must not be treated as verified success before packaged manual checks pass.
- `inspect --hwnd <hwnd> --host-hwnd <hwnd> --workerw-hwnd <hwnd>` re-checks HWND liveness, parent relationship, window rectangles, virtual screen rectangle, and rect mismatch.
- `attach` without `--dry-run` is retained as a direct Electron BrowserWindow `SetParent` probe. It returns `attached: false`, `backend: "fallback_stage"`, and `reason: "electron_window_direct_set_parent_not_verified"` even if `SetParent` and `SetWindowPos` succeed.
- `detach` accepts optional `--previous-parent`, `--previous-style`, and `--previous-ex-style` values and attempts to restore them before Electron closes the Wallpaper BrowserWindow.

The `hwnd` value is included in JSON only as debug plumbing so Electron can verify that the BrowserWindow native handle reached the helper. Do not treat it as a stable user-facing value.

Planned command shape:

```text
wallpaper-helper.exe attach --hwnd <hwnd> --x <px> --y <px> --width <px> --height <px>
```

Expected stdout:

```json
{
  "ok": true,
  "attached": true,
  "workerW": "0x00000000",
  "message": "attached"
}
```

Failure stdout:

```json
{
  "ok": false,
  "attached": false,
  "message": "reason"
}
```

Do not commit published helper binaries to this directory. Publish locally before creating an Electron packaged build.

Manual development commands:

```powershell
dotnet build native\wallpaper-helper\WallpaperHelper.csproj
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- status
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- find-desktop
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- attach --hwnd 12345 --dry-run
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- host --hwnd <real-electron-wallpaper-hwnd>
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- inspect --hwnd <real-electron-wallpaper-hwnd> --host-hwnd <native-host-hwnd> --workerw-hwnd <workerw-hwnd>
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- attach --hwnd <real-electron-wallpaper-hwnd>
dotnet run --project native\wallpaper-helper\WallpaperHelper.csproj -- detach --hwnd <real-electron-wallpaper-hwnd> --previous-parent <previous-parent-hwnd>
npm run build:wallpaper-helper
```

Use the Electron NativeWallpaperStatus `helperLastResult` field to copy a real Wallpaper BrowserWindow HWND for manual attach testing.

Publish output:

```text
native/wallpaper-helper/bin/publish/win-x64/wallpaper-helper.exe
```

Packaged Electron location:

```text
release/win-unpacked/resources/wallpaper-helper/wallpaper-helper.exe
```

Known MVP limits:

- Primary display sizing only through `GetSystemMetrics(SM_CXSCREEN/SM_CYSCREEN)`.
- No virtual-screen or multi-monitor span support yet.
- DPI-specific positioning is not handled yet.
- Electron close remains the final fallback if detach is partial.

Electron looks for the published helper at:

```text
native/wallpaper-helper/bin/publish/win-x64/wallpaper-helper.exe
native/wallpaper-helper/bin/Release/net8.0/win-x64/publish/wallpaper-helper.exe
release/win-unpacked/resources/wallpaper-helper/wallpaper-helper.exe
```

It also accepts an explicit override:

```text
DESKTOP_MUSE_WALLPAPER_HELPER=C:\path\to\wallpaper-helper.exe
```

See `../../docs/WIN32_WALLPAPER_BRIDGE_DECISION.md`.
