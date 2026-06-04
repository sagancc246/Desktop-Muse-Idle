const { app, BrowserWindow } = require('electron');

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:5173/';
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
      partition: `e2e-smoke-${Date.now()}`,
      sandbox: false,
    },
  });
  let renderProcessGone = false;

  win.webContents.on('render-process-gone', () => {
    renderProcessGone = true;
  });

  const js = (source) => win.webContents.executeJavaScript(source, true);
  const text = () => js(`document.body ? document.body.innerText : ''`);
  const buttons = () =>
    js(`Array.from(document.querySelectorAll('button')).map((button) => ({
      aria: button.getAttribute('aria-label'),
      disabled: button.disabled,
      text: button.textContent.trim()
    }))`);
  const pass = (name) => results.push({ name, ok: true });
  const fail = (name, details) => results.push({ name, details, ok: false });
  const assert = async (name, predicate) => {
    try {
      if (await predicate()) {
        pass(name);
      } else {
        fail(name, 'Assertion returned false');
      }
    } catch (error) {
      fail(name, error.message);
    }
  };
  const waitFor = async (name, predicate, timeoutMs = 8_000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (await predicate()) {
        pass(name);
        return;
      }
      await sleep(100);
    }
    throw new Error(`${name} timed out after ${timeoutMs}ms`);
  };
  const click = async (label) => {
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
      throw new Error(`Button not clickable: ${label}; available=${JSON.stringify(await buttons())}`);
    }
  };

  await win.loadURL(appUrl);
  await waitFor('Title displays', async () => (await text()).includes('Desktop Muse Idle'));
  await js(`window.localStorage.clear();
    window.localStorage.setItem('desktop-muse-idle-settings', JSON.stringify({
      bgmVolume: 70,
      seVolume: 80,
      language: 'en',
      effectsQuality: 'medium',
      motionIntensity: 'medium',
      autoSaveEnabled: true
    }));
    window.localStorage.setItem('desktop-muse-idle-tutorial-seen', 'true');`);
  await win.reload();
  await waitFor('Clean title reload displays', async () => (await text()).includes('Desktop Muse Idle'));

  await click('Settings');
  await waitFor('Settings opens', async () => (await text()).includes('SETTINGS'));
  await click('Back');
  await click('Gallery');
  await waitFor('Gallery opens', async () => (await text()).includes('Still Gallery'));
  await click('Back to Title');
  await click('Stats');
  await waitFor('Stats opens', async () => (await text()).includes('Statistics'));
  await click('Close');

  await click('Start');
  await waitFor('Start opens game', async () => (await text()).includes('Idle Observatory'));
  await click('Save Game');
  await waitFor('Save completes', async () => (await text()).includes('Saved!'));
  await win.reload();
  await waitFor('Reload returns to title', async () => (await text()).includes('Desktop Muse Idle'));
  await assert('Continue is enabled after save', async () => {
    const button = (await buttons()).find((candidate) => candidate.text === 'Continue');
    return button?.disabled === false;
  });
  await click('Continue');
  await waitFor('Continue opens saved game', async () => (await text()).includes('Idle Observatory'));

  await click('Toggle Focus Mode');
  await waitFor('Focus Mode opens', async () => (await text()).includes('Exit Focus'));
  await click('Exit Focus');
  await waitFor('Focus Mode exits without crash', async () => (await text()).includes('Idle Observatory'));
  await click('Toggle Wallpaper Stage Mode');
  await waitFor('Wallpaper Mode opens', async () => (await text()).includes('Exit Wallpaper'));
  await click('Exit Wallpaper');
  await waitFor('Wallpaper Mode exits without crash', async () => (await text()).includes('Idle Observatory'));
  await assert('Mode toggles keep renderer alive', async () => !renderProcessGone && !win.isDestroyed());

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
