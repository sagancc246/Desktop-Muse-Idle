'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const helperTimeoutMs = 4_000;
let lastAttachState = null;

function nativeHandleToHwndString(handle) {
  if (!Buffer.isBuffer(handle) || handle.length === 0) {
    return '';
  }

  if (handle.length >= 8 && typeof handle.readBigUInt64LE === 'function') {
    return handle.readBigUInt64LE(0).toString();
  }

  return handle.readUInt32LE(0).toString();
}

function getHelperCandidates() {
  const projectRoot = path.join(__dirname, '..');
  const resourceRoot = process.resourcesPath;
  const configuredPath = process.env.DESKTOP_MUSE_WALLPAPER_HELPER;
  const candidates = [
    configuredPath,
    path.join(
      projectRoot,
      'native',
      'wallpaper-helper',
      'bin',
      'publish',
      'win-x64',
      'wallpaper-helper.exe',
    ),
    path.join(
      projectRoot,
      'native',
      'wallpaper-helper',
      'bin',
      'Release',
      'net8.0',
      'win-x64',
      'publish',
      'wallpaper-helper.exe',
    ),
    path.join(
      projectRoot,
      'native',
      'wallpaper-helper',
      'bin',
      'Debug',
      'net8.0',
      'wallpaper-helper.exe',
    ),
    path.join(
      projectRoot,
      'native',
      'wallpaper-helper',
      'bin',
      'Release',
      'net8.0',
      'wallpaper-helper.exe',
    ),
  ];

  if (resourceRoot) {
    candidates.push(
      path.join(resourceRoot, 'wallpaper-helper', 'wallpaper-helper.exe'),
      path.join(resourceRoot, 'native', 'wallpaper-helper', 'wallpaper-helper.exe'),
      path.join(resourceRoot, 'wallpaper-helper.exe'),
    );
  }

  return candidates.filter(Boolean);
}

function resolveWallpaperHelperPath() {
  for (const candidate of getHelperCandidates()) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function parseHelperOutput(stdout) {
  const trimmedOutput = stdout.trim();
  if (!trimmedOutput) {
    return {
      ok: false,
      reason: 'empty_helper_output',
    };
  }

  return JSON.parse(trimmedOutput);
}

function runWallpaperHelper(args) {
  const helperPath = resolveWallpaperHelperPath();
  if (!helperPath) {
    return Promise.resolve({
      helperAvailable: false,
      helperPath: null,
      ok: false,
      reason: 'helper_not_found',
    });
  }

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const child = spawn(helperPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const finish = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve({
        helperAvailable: true,
        helperPath,
        ...result,
      });
    };

    const timeoutId = setTimeout(() => {
      child.kill();
      finish({
        ok: false,
        reason: 'helper_timeout',
        stderr,
        stdout,
      });
    }, helperTimeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      finish({
        ok: false,
        reason: 'helper_spawn_failed',
        message: error.message,
        stderr,
        stdout,
      });
    });
    child.on('close', (exitCode) => {
      clearTimeout(timeoutId);
      try {
        const parsed = parseHelperOutput(stdout);
        finish({
          exitCode,
          stderr,
          stdout,
          ...parsed,
        });
      } catch (error) {
        finish({
          exitCode,
          ok: false,
          reason: 'helper_invalid_json',
          message: error instanceof Error ? error.message : String(error),
          stderr,
          stdout,
        });
      }
    });
  });
}

async function getWallpaperHelperStatus() {
  return runWallpaperHelper(['status']);
}

async function findDesktopWallpaperTarget() {
  return runWallpaperHelper(['find-desktop']);
}

async function attachWallpaperWindowToDesktop(wallpaperWindow) {
  if (process.platform !== 'win32') {
    return {
      helperAvailable: false,
      ok: false,
      message: 'Native wallpaper is only available on Windows.',
      reason: 'unsupported_platform',
    };
  }

  const hwnd = nativeHandleToHwndString(wallpaperWindow.getNativeWindowHandle());
  if (!hwnd) {
    return {
      helperAvailable: false,
      ok: false,
      message: 'Wallpaper window HWND could not be read.',
      reason: 'missing_hwnd',
    };
  }

  const helperResult = await runWallpaperHelper(['attach', '--hwnd', hwnd]);
  const result = {
    hwnd,
    ...helperResult,
  };
  if (result.attached) {
    lastAttachState = {
      hwnd,
      previousExStyle: result.previousExStyle,
      previousParentHwnd: result.previousParentHwnd,
      previousStyle: result.previousStyle,
      workerWHwnd: result.workerWHwnd,
    };
  }

  return result;
}

async function detachWallpaperWindowFromDesktop(wallpaperWindow) {
  if (process.platform !== 'win32') {
    return {
      helperAvailable: false,
      ok: true,
      reason: 'unsupported_platform',
    };
  }

  const hwnd = nativeHandleToHwndString(wallpaperWindow?.getNativeWindowHandle?.());
  const attachState = lastAttachState;
  lastAttachState = null;

  if (!hwnd) {
    return {
      helperAvailable: false,
      ok: true,
      reason: 'missing_hwnd',
    };
  }

  const args = ['detach', '--hwnd', hwnd];
  if (attachState?.previousParentHwnd) {
    args.push('--previous-parent', attachState.previousParentHwnd);
  }
  if (attachState?.previousStyle) {
    args.push('--previous-style', attachState.previousStyle);
  }
  if (attachState?.previousExStyle) {
    args.push('--previous-ex-style', attachState.previousExStyle);
  }

  const helperResult = await runWallpaperHelper(args);
  return {
    hwnd,
    ...helperResult,
  };
}

module.exports = {
  attachWallpaperWindowToDesktop,
  detachWallpaperWindowFromDesktop,
  findDesktopWallpaperTarget,
  getWallpaperHelperStatus,
};
