const { app, BrowserWindow } = require('electron');

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:5173/';

const defaultSettings = {
  bgmVolume: 70,
  seVolume: 80,
  language: 'en',
  effectsQuality: 'medium',
  motionIntensity: 'medium',
  autoSaveEnabled: true,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const results = [];
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      partition: `priority1-regression-${Date.now()}`,
      sandbox: false,
    },
  });

  const js = (source) => win.webContents.executeJavaScript(source, true);

  const pass = (name, details = '') => results.push({ name, details, ok: true });
  const fail = (name, details = '') => results.push({ name, details, ok: false });
  const assert = async (name, predicate, details = '') => {
    if (await predicate()) {
      pass(name, details);
    } else {
      fail(name, details);
    }
  };

  const waitFor = async (name, predicate, timeoutMs = 8_000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (await predicate()) {
        pass(name);
        return true;
      }
      await sleep(100);
    }
    fail(name, `Timed out after ${timeoutMs}ms`);
    return false;
  };

  const visibleText = () =>
    js(`document.body ? document.body.innerText : ''`);

  const buttons = () =>
    js(`Array.from(document.querySelectorAll('button')).map((button) => ({
      aria: button.getAttribute('aria-label'),
      disabled: button.disabled,
      text: button.textContent.trim()
    }))`);

  const clickButton = async (label) => {
    const clicked = await js(`(() => {
      const label = ${JSON.stringify(label)};
      const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
        candidate.textContent.trim() === label || candidate.getAttribute('aria-label') === label
      );
      if (!button || button.disabled) return false;
      button.click();
      return true;
    })()`);
    if (!clicked) {
      throw new Error(`Button not clickable: ${label}`);
    }
  };

  const selectByLabel = async (label, value) => {
    const selected = await js(`(() => {
      const select = Array.from(document.querySelectorAll('select')).find((candidate) =>
        candidate.getAttribute('aria-label') === ${JSON.stringify(label)}
      );
      if (!select) return false;
      select.value = ${JSON.stringify(value)};
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`);
    if (!selected) {
      throw new Error(`Select not found: ${label}`);
    }
  };

  const getSelectValue = (label) =>
    js(`(() => {
      const select = Array.from(document.querySelectorAll('select')).find((candidate) =>
        candidate.getAttribute('aria-label') === ${JSON.stringify(label)}
      );
      return select ? select.value : null;
    })()`);

  const getStorage = (key) =>
    js(`window.localStorage.getItem(${JSON.stringify(key)})`);

  await win.loadURL(appUrl);
  await waitFor('App loads title screen', async () => (await visibleText()).includes('Desktop Muse Idle'));

  await js(`window.localStorage.clear();
    window.localStorage.setItem('desktop-muse-idle-settings', ${JSON.stringify(
      JSON.stringify(defaultSettings),
    )});
    window.localStorage.setItem('desktop-muse-idle-tutorial-seen', 'true');`);
  await win.reload();
  await waitFor('Title screen reloads with English settings', async () =>
    (await visibleText()).includes('Hit the corner. Unlock her world.'),
  );

  await assert('Title menu has Start/Continue/Settings/Gallery/Credits/Stats/Quit', async () => {
    const labels = (await buttons()).map((button) => button.text);
    return ['Start', 'Continue', 'Settings', 'Gallery', 'Credits', 'Stats', 'Quit'].every(
      (label) => labels.includes(label),
    );
  });
  await assert('Continue is disabled before save exists', async () => {
    const button = (await buttons()).find((candidate) => candidate.text === 'Continue');
    return button?.disabled === true;
  });

  await clickButton('Quit');
  await assert('Quit placeholder notice appears', async () =>
    (await visibleText()).includes('Quit will be available in the Electron build.'),
  );

  await clickButton('Settings');
  await waitFor('Settings opens from title', async () => (await visibleText()).includes('SETTINGS'));
  await assert('Settings shows Manual Save and Last Saved', async () => {
    const text = await visibleText();
    return text.includes('Manual Save') && text.includes('Last Saved: Not saved yet');
  });
  await clickButton('Back');
  await waitFor('Settings returns to title', async () => (await visibleText()).includes('Prototype Build'));

  await clickButton('Stats');
  await waitFor('Stats opens from title', async () => (await visibleText()).includes('Statistics'));
  await clickButton('Close');
  await waitFor('Stats returns to title', async () => (await visibleText()).includes('Prototype Build'));

  await clickButton('Gallery');
  await waitFor('Gallery opens from title', async () => (await visibleText()).includes('Still Gallery'));
  await clickButton('Back to Title');
  await waitFor('Gallery returns to title', async () => (await visibleText()).includes('Prototype Build'));

  await clickButton('Credits');
  await waitFor('Credits opens from title', async () => (await visibleText()).includes('CREDITS'));
  await clickButton('Back to Title');
  await waitFor('Credits returns to title', async () => (await visibleText()).includes('Prototype Build'));

  await clickButton('Start');
  await waitFor('Start opens game screen', async () => (await visibleText()).includes('Idle Observatory'));
  await assert('ResourceBar exposes Save/Settings/Stats/Wallpaper', async () => {
    const labels = (await buttons()).map((button) => button.aria || button.text);
    return ['Save Game', 'Open Settings', 'Open Statistics', 'Toggle Wallpaper Stage Mode'].every(
      (label) => labels.includes(label),
    );
  });

  await clickButton('+1K Memory');
  await clickButton('+1 Fragment');
  await clickButton('Unlock All Skins');
  await clickButton('Clear Stage');
  if ((await visibleText()).includes('Stage Clear!')) {
    await clickButton('Continue');
    await waitFor('Stage clear overlay continues', async () => !(await visibleText()).includes('Stage Clear!'));
  }

  await clickButton('Skill Tree');
  await waitFor('Skill Tree opens', async () => (await visibleText()).includes('Bounce Memory I'));
  await clickButton('Unlock - 1 Fragment');
  await waitFor('Skill Tree unlock consumes Fragment', async () => (await visibleText()).includes('Unlocked'));
  await clickButton('Close');

  await clickButton('Save Game');
  await waitFor('Manual Save from ResourceBar shows Saved toast', async () =>
    (await visibleText()).includes('Saved!'),
  );

  await clickButton('Open Settings');
  await waitFor('Settings opens from game', async () => (await visibleText()).includes('SETTINGS'));
  await assert('Last Saved timestamp updates after ResourceBar save', async () => {
    const text = await visibleText();
    return text.includes('Last Saved:') && !text.includes('Last Saved: Not saved yet');
  });
  await clickButton('Manual Save');
  await waitFor('Manual Save from Settings updates saved payload', async () => {
    const saved = JSON.parse(await getStorage('desktop-muse-idle-save'));
    return typeof saved.lastSavedAt === 'number' && saved.lastSavedAt > 0;
  });
  await clickButton('Back');
  await waitFor('Settings returns to game', async () => (await visibleText()).includes('Idle Observatory'));
  await waitFor('Save button is enabled before forced failure check', async () => {
    const button = (await buttons()).find((candidate) => candidate.aria === 'Save Game');
    return button?.disabled === false;
  });

  await js(`window.__originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new Error('forced save failure'); };
    undefined;`);
  await clickButton('Save Game');
  await waitFor('Save Failed toast appears when storage write fails', async () =>
    (await visibleText()).includes('Save Failed'),
  );
  await js(`Storage.prototype.setItem = window.__originalSetItem; delete window.__originalSetItem; undefined;`);

  const savedBeforeReload = JSON.parse(await getStorage('desktop-muse-idle-save'));
  await win.reload();
  await waitFor('Reload after save returns to title', async () => (await visibleText()).includes('Desktop Muse Idle'));
  await assert('Continue is enabled after save exists', async () => {
    const button = (await buttons()).find((candidate) => candidate.text === 'Continue');
    return button?.disabled === false;
  });
  await clickButton('Continue');
  await waitFor('Continue opens saved game', async () => (await visibleText()).includes('Idle Observatory'));
  const savedAfterContinue = JSON.parse(await getStorage('desktop-muse-idle-save'));
  await assert('Saved game contains Memory/Stage/background/Muse/skin/stats/Skill Tree fields', async () =>
    savedBeforeReload.memory >= 1000 &&
    savedBeforeReload.currentStageId &&
    Array.isArray(savedBeforeReload.unlockedBackgrounds) &&
    Array.isArray(savedBeforeReload.unlockedMuseIds) &&
    Array.isArray(savedBeforeReload.unlockedSkinIds) &&
    savedBeforeReload.stats &&
    savedBeforeReload.unlockedSkillNodes?.bounce_memory_1 === 1,
  );
  await assert('Continue reload keeps saved Memory and Skill Tree state', async () =>
    savedAfterContinue.memory >= 1000 &&
    savedAfterContinue.unlockedSkillNodes?.bounce_memory_1 === 1,
  );

  const memoryBeforeAutoSave = savedAfterContinue.memory;
  await clickButton('+1K Memory');
  await sleep(11_500);
  const autoSaved = JSON.parse(await getStorage('desktop-muse-idle-save'));
  await assert('10-second auto-save persists changed Memory', async () =>
    autoSaved.memory >= memoryBeforeAutoSave + 1000,
  );

  await clickButton('Open Settings');
  await waitFor('Settings opens for wallpaper checks', async () => (await visibleText()).includes('Wallpaper Settings'));
  await selectByLabel('Wallpaper FPS', '60');
  await selectByLabel('Wallpaper Effects Quality', 'normal');
  await clickButton('Overlay HUD');
  const wallpaperSettings = JSON.parse(await getStorage('desktopMuseIdle.wallpaperSettings'));
  const gameSaveRaw = await getStorage('desktop-muse-idle-save');
  await assert('Wallpaper settings persist in separate LocalStorage key', async () =>
    wallpaperSettings.fps === 60 &&
    wallpaperSettings.effectsQuality === 'normal' &&
    gameSaveRaw !== null &&
    !gameSaveRaw.includes('wallpaperSettings'),
  );

  await selectByLabel('Wallpaper Mode', 'stage');
  await win.reload();
  await waitFor('Reload after Wallpaper Stage mode returns to title', async () =>
    (await visibleText()).includes('Desktop Muse Idle'),
  );
  await clickButton('Settings');
  await waitFor('Settings opens after Wallpaper Stage reload', async () => (await visibleText()).includes('SETTINGS'));
  await assert('wallpaperMode is off after Wallpaper Stage reload', async () =>
    (await getSelectValue('Wallpaper Mode')) === 'off',
  );

  await selectByLabel('Wallpaper Mode', 'muse_overlay');
  await win.reload();
  await waitFor('Reload after Muse Overlay mode returns to title', async () =>
    (await visibleText()).includes('Desktop Muse Idle'),
  );
  await clickButton('Settings');
  await waitFor('Settings opens after Muse Overlay reload', async () => (await visibleText()).includes('SETTINGS'));
  await assert('wallpaperMode is off after Muse Overlay reload', async () =>
    (await getSelectValue('Wallpaper Mode')) === 'off',
  );

  const failures = results.filter((result) => !result.ok);
  console.log(JSON.stringify({ failures, results }, null, 2));
  win.destroy();
  await app.quit();
  process.exit(failures.length ? 1 : 0);
}

app.whenReady().then(main).catch((error) => {
  console.error(error);
  app.quit();
  process.exit(1);
});
