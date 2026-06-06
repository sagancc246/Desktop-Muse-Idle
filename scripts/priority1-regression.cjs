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
      const availableButtons = await buttons();
      throw new Error(`Button not clickable: ${label}; available=${JSON.stringify(availableButtons)}`);
    }
  };
  const openDebugPanel = async (name) => {
    if (!(await js(`Boolean(document.querySelector('.debug-panel'))`))) {
      await clickButton('Toggle Debug Panel');
    }
    await waitFor(name, async () => js(`Boolean(document.querySelector('.debug-panel'))`));
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
  const getGameCanvasSize = () =>
    js(`(() => {
      const canvas = document.querySelector('.pixi-host canvas');
      return canvas ? { height: canvas.height, width: canvas.width } : null;
    })()`);
  const getBackfillLayout = () =>
    js(`(() => {
      const modal = document.querySelector('.backfill-rewards-modal');
      const groups = document.querySelector('.backfill-reward-groups');
      const header = modal?.querySelector('.stage-clear-header');
      const footer = modal?.querySelector('.stage-clear-footer');
      if (!modal || !groups || !header || !footer) return null;
      const rect = modal.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      return {
        groupCount: groups.querySelectorAll('.backfill-reward-group').length,
        groupClientHeight: groups.clientHeight,
        groupScrollHeight: groups.scrollHeight,
        headerVisible: headerRect.top >= 0 && headerRect.bottom <= window.innerHeight,
        footerVisible: footerRect.top >= 0 && footerRect.bottom <= window.innerHeight,
        modalFitsViewport:
          rect.left >= 0 &&
          rect.top >= 0 &&
          rect.right <= window.innerWidth &&
          rect.bottom <= window.innerHeight
      };
    })()`);

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
  await assert('Debug Panel starts closed', async () =>
    !(await visibleText()).includes('Debug Panel'),
  );
  await js(`window.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    ctrlKey: true,
    key: 'd',
    shiftKey: true
  }))`);
  await waitFor('Ctrl+Shift+D opens Debug Panel', async () =>
    (await visibleText()).includes('Debug Panel'),
  );
  await js(`window.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    key: 'Escape'
  }))`);
  await waitFor('Escape closes Debug Panel', async () =>
    !(await visibleText()).includes('Debug Panel'),
  );
  await openDebugPanel('Debug toggle opens Debug Panel');
  await clickButton('Close Debug Panel');
  await waitFor('Close button closes Debug Panel', async () =>
    !(await visibleText()).includes('Debug Panel'),
  );
  await openDebugPanel('Debug Panel reopens after Close button check');
  const claimsBeforeDebugBackfill = await js(`import('/src/store/useGameStore.ts').then(({ useGameStore }) =>
    JSON.stringify(useGameStore.getState().claimedRewardIds)
  )`);
  const unlockNotificationsBeforeDebugBackfill = await js(`import('/src/store/useGameStore.ts').then(({ useGameStore }) => {
    const state = useGameStore.getState();
    return JSON.stringify([state.newlyUnlockedMuseIds, state.newlyUnlockedSkinIds]);
  })`);
  await clickButton('Show Backfill Rewards: 10 Stages');
  await waitFor('10-Stage Backfill fixture opens', async () => {
    const layout = await getBackfillLayout();
    return layout?.groupCount === 10;
  });
  await assert('1280x720 Backfill modal fits viewport with fixed header/footer', async () => {
    const layout = await getBackfillLayout();
    return layout?.modalFitsViewport && layout.headerVisible && layout.footerVisible;
  });
  await assert('10-Stage Backfill reward list scrolls independently', async () => {
    const layout = await getBackfillLayout();
    return layout?.groupScrollHeight > layout?.groupClientHeight;
  });
  await assert('Backfill fixture exposes RewardCard actions', async () => {
    const labels = (await buttons()).map((button) => button.text);
    return labels.includes('Equip') &&
      labels.includes('Set Background') &&
      labels.includes('Open Gallery') &&
      labels.includes('Continue');
  });
  await clickButton('Equip');
  await clickButton('Set Background');
  await assert('Backfill Equip and Set Background actions remain operable', async () =>
    js(`Boolean(document.querySelector('.backfill-rewards-modal'))`),
  );
  await assert('Backfill fixture does not alter Reward claims', async () =>
    claimsBeforeDebugBackfill === await js(`import('/src/store/useGameStore.ts').then(({ useGameStore }) =>
      JSON.stringify(useGameStore.getState().claimedRewardIds)
    )`),
  );
  await js(`document.querySelector('.backfill-reward-groups').scrollTop = 999999`);
  await assert('Backfill reward list accepts scrolling', async () =>
    js(`document.querySelector('.backfill-reward-groups').scrollTop > 0`),
  );
  await clickButton('Open Gallery');
  await waitFor('Backfill Open Gallery action opens Gallery', async () =>
    js(`Boolean(document.querySelector('.gallery-backdrop'))`),
  );
  await clickButton('Close Gallery');
  await assert('Closing Backfill fixture preserves unlock notifications', async () =>
    unlockNotificationsBeforeDebugBackfill === await js(`import('/src/store/useGameStore.ts').then(({ useGameStore }) => {
      const state = useGameStore.getState();
      return JSON.stringify([state.newlyUnlockedMuseIds, state.newlyUnlockedSkinIds]);
    })`),
  );
  await openDebugPanel('Debug Panel opens for 1920x1080 Backfill check');
  await clickButton('Show Backfill Rewards: 10 Stages');
  win.setSize(1920, 1080);
  await sleep(250);
  await assert('1920x1080 Backfill modal fits viewport with fixed header/footer', async () => {
    const layout = await getBackfillLayout();
    return layout?.modalFitsViewport && layout.headerVisible && layout.footerVisible;
  });
  win.setSize(1280, 720);
  await sleep(250);
  await clickButton('Continue');
  await openDebugPanel('Debug Panel reopens after Backfill fixture checks');
  await assert('ResourceBar exposes Save/Settings/Stats/Wallpaper', async () => {
    const labels = (await buttons()).map((button) => button.aria || button.text);
    return ['Save Game', 'Open Settings', 'Open Statistics', 'Toggle Wallpaper Stage Mode'].every(
      (label) => labels.includes(label),
    );
  });
  await waitFor('Pixi canvas initializes', async () => (await getGameCanvasSize()) !== null);
  const normalCanvasSize = await getGameCanvasSize();
  await clickButton('Toggle Focus Mode');
  await waitFor('Focus Mode opens', async () => (await visibleText()).includes('Exit Focus'));
  await assert('Focus Mode closes and hides Debug Panel', async () => {
    const text = await visibleText();
    const labels = (await buttons()).map((button) => button.aria || button.text);
    return !text.includes('Debug Panel') && !labels.includes('Toggle Debug Panel');
  });
  await assert('Focus Mode keeps Pixi internal canvas size stable', async () => {
    const focusCanvasSize = await getGameCanvasSize();
    return JSON.stringify(focusCanvasSize) === JSON.stringify(normalCanvasSize);
  });
  await clickButton('Exit Focus');
  await clickButton('Toggle Wallpaper Stage Mode');
  await waitFor('Wallpaper Stage Mode opens', async () => (await visibleText()).includes('Exit Wallpaper'));
  await assert('Wallpaper Stage Mode keeps Pixi internal canvas size stable', async () => {
    const wallpaperCanvasSize = await getGameCanvasSize();
    return JSON.stringify(wallpaperCanvasSize) === JSON.stringify(normalCanvasSize);
  });
  await clickButton('Exit Wallpaper');
  await js(`import('/src/store/useAppStore.ts').then(({ useAppStore }) =>
    useAppStore.getState().toggleMuseOverlayMode()
  )`);
  await waitFor('Muse Overlay Mode opens as transparent overlay surface', async () =>
    js(`document.querySelector('.appViewport')?.classList.contains('muse-overlay-viewport') &&
      getComputedStyle(document.querySelector('.appViewport')).backgroundColor === 'rgba(0, 0, 0, 0)'`),
  );
  await js(`import('/src/store/useAppStore.ts').then(({ useAppStore }) =>
    useAppStore.getState().setClickThroughEnabled(true)
  )`);
  await waitFor('Overlay status reports Click Through ON', async () =>
    js(`import('/src/store/useAppStore.ts').then(({ useAppStore }) =>
      useAppStore.getState().isClickThroughEnabled === true &&
      !useAppStore.getState().overlayLastError
    )`),
  );
  await assert('Muse Overlay Mode keeps Pixi internal canvas size stable', async () => {
    const overlayCanvasSize = await getGameCanvasSize();
    return JSON.stringify(overlayCanvasSize) === JSON.stringify(normalCanvasSize);
  });
  await js(`import('/src/store/useAppStore.ts').then(({ useAppStore }) =>
    useAppStore.getState().exitWallpaperMode()
  )`);
  await assert('Exiting Muse Overlay clears transient Click Through state', async () =>
    js(`import('/src/store/useAppStore.ts').then(({ useAppStore }) =>
      useAppStore.getState().isClickThroughEnabled === false
    )`),
  );
  await openDebugPanel('Debug Panel reopens after presentation mode checks');

  await clickButton('+1K Memory');
  await clickButton('+1 Fragment');
  await clickButton('Clear Stage');
  await waitFor('Stage 1 clear modal shows its background reward', async () => {
    const text = await visibleText();
    return text.includes('STAGE CLEAR!') && text.includes('Cozy Room');
  });
  await clickButton('Set Background');
  await waitFor('Stage 1 reward card sets Cozy Room', async () =>
    (await visibleText()).includes('In Use'),
  );
  await clickButton('Open Gallery');
  await waitFor('Stage reward card opens Gallery', async () =>
    js(`Boolean(document.querySelector('.gallery-backdrop'))`),
  );
  await clickButton('Close Gallery');
  await waitFor('Stage reward Gallery closes', async () =>
    js(`!document.querySelector('.gallery-backdrop')`),
  );

  await clickButton('Clear Stage');
  await waitFor('Stage 2 clear modal opens', async () => (await visibleText()).includes('STAGE CLEAR!'));
  await assert('Stage 2 clear modal names the cleared stage', async () =>
    (await visibleText()).includes('Stage 2'),
  );
  await assert('Stage 2 clear modal announces a new skin', async () =>
    (await visibleText()).includes('NEW SKIN UNLOCKED!'),
  );
  await assert('Stage 2 clear modal shows Lumi Pastel reward', async () =>
    (await visibleText()).includes('Lumi Pastel'),
  );
  await assert('Stage 2 clear modal shows Astra reward', async () =>
    (await visibleText()).includes('Astra'),
  );
  await clickButton('Equip');
  await waitFor('Stage 2 reward card equips Lumi Pastel', async () =>
    (await visibleText()).includes('Equipped'),
  );
  await clickButton('Continue');
  await waitFor('Stage 2 clear modal continues', async () => !(await visibleText()).includes('STAGE CLEAR!'));

  await clickButton('Skill Tree');
  await waitFor('Skill Tree opens', async () => (await visibleText()).includes('Bounce Memory I'));
  await clickButton('Unlock - 1 Fragment');
  await waitFor('Skill Tree unlock consumes Fragment', async () => (await visibleText()).includes('Unlocked'));
  await clickButton('Close');

  await clickButton('Change Skin');
  await waitFor('Skin selector opens', async () =>
    js(`Boolean(document.querySelector('.skin-selector-modal'))`),
  );
  await waitFor('Skin selector shows the Stage 2 reward as equipped', async () =>
    (await visibleText()).includes('Currently equipped'),
  );
  await clickButton('Close');
  await waitFor('Skin selector closes with equipped skin visible', async () =>
    (await visibleText()).includes('Lumi Pastel'),
  );

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
  const stage1MemoryClaimKey = 'stage-1:memory_500';
  const stage2AstraClaimKey = 'stage-2:astra';
  const memoryBeforeAddedRewardReconcile = savedBeforeReload.memory;
  savedBeforeReload.claimedRewardIds = savedBeforeReload.claimedRewardIds.filter(
    (claimId) => claimId !== stage1MemoryClaimKey && claimId !== stage2AstraClaimKey,
  );
  await win.reload();
  await waitFor('Reload after save returns to title', async () => (await visibleText()).includes('Desktop Muse Idle'));
  await js(`window.localStorage.setItem(
    'desktop-muse-idle-save',
    ${JSON.stringify(JSON.stringify(savedBeforeReload))}
  )`);
  await assert('Continue is enabled after save exists', async () => {
    const button = (await buttons()).find((candidate) => candidate.text === 'Continue');
    return button?.disabled === false;
  });
  await clickButton('Continue');
  await waitFor('Continue opens saved game', async () => (await visibleText()).includes('Idle Observatory'));
  const collectButton = (await buttons()).find((candidate) => candidate.text === 'Collect');
  if (collectButton) {
    await clickButton('Collect');
  }
  await waitFor('Backfill modal shows every Stage reward group', async () => {
    const text = await visibleText();
    return text.includes('NEW REWARDS UNLOCKED!') &&
      text.includes('Stage 1 Rewards') &&
      text.includes('Stage 2 Rewards') &&
      text.toLowerCase().includes('memory acquired') &&
      text.includes('Astra');
  });
  await waitFor('Cleared Stage receives newly unclaimed reward', async () => {
    const saved = JSON.parse(await getStorage('desktop-muse-idle-save'));
    return saved.memory >= memoryBeforeAddedRewardReconcile + 500 &&
      saved.claimedRewardIds.filter((claimId) => claimId === stage1MemoryClaimKey).length === 1 &&
      saved.claimedRewardIds.filter((claimId) => claimId === stage2AstraClaimKey).length === 1;
  });
  await clickButton('Continue');
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
  await assert('Stage 2 rewards persist once in the saved game', async () =>
    savedBeforeReload.clearedStages.includes('stage-2') &&
    savedBeforeReload.unlockedBackgrounds.includes('bg_cozy_room') &&
    savedBeforeReload.unlockedMuseIds.includes('astra') &&
    savedBeforeReload.unlockedSkinIds.filter((skinId) => skinId === 'lumi_pastel').length === 1 &&
    savedBeforeReload.claimedRewardIds.filter((claimId) => claimId === 'stage-2:lumi_pastel').length === 1 &&
    savedBeforeReload.currentBackgroundId === 'bg_cozy_room' &&
    savedBeforeReload.equippedSkinByMuseId.lumi === 'lumi_pastel',
  );
  await assert('Continue reload keeps saved Memory and Skill Tree state', async () =>
    savedAfterContinue.memory >= 1000 &&
    savedAfterContinue.memory >= memoryBeforeAddedRewardReconcile + 500 &&
    savedAfterContinue.claimedRewardIds.filter((claimId) => claimId === stage1MemoryClaimKey).length === 1 &&
    savedAfterContinue.claimedRewardIds.filter((claimId) => claimId === stage2AstraClaimKey).length === 1 &&
    savedAfterContinue.unlockedSkillNodes?.bounce_memory_1 === 1,
  );

  const memoryBeforeAutoSave = savedAfterContinue.memory;
  await openDebugPanel('Debug Panel reopens for auto-save resource check');
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

  await selectByLabel('Wallpaper FPS', '60');
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
