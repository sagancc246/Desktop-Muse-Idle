# Wallpaper Helper

This directory contains the Windows-only Native Desktop Wallpaper helper.

Selected direction: C# self-contained helper exe.

The helper is a C# console project. It should be built outside the Electron renderer and called only by Electron main process code.

Current commands:

```text
wallpaper-helper.exe version
wallpaper-helper.exe status
wallpaper-helper.exe find-desktop
wallpaper-helper.exe attach --hwnd <hwnd>
wallpaper-helper.exe attach --hwnd <hwnd> --dry-run
wallpaper-helper.exe detach --hwnd <hwnd>
```

Current behavior:

- `version` returns helper metadata as JSON.
- `status` returns helper reachability as JSON.
- `find-desktop` searches for Progman, sends the WorkerW creation message, enumerates WorkerW / SHELLDLL_DefView candidates, and returns the dry-run discovery result as JSON.
- `attach --hwnd <hwnd> --dry-run` validates that `--hwnd` exists, runs desktop discovery, and returns `attached: false`, `dryRun: true`, and `reason: "dry_run_no_set_parent"`.
- `attach` without `--dry-run` validates that `--hwnd` exists, discovers WorkerW, adjusts window style, calls `SetParent`, calls `SetWindowPos`, and returns `attached: true` only when the attach is verified.
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
