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
      partition: `priority2-regression-${Date.now()}`,
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

  const visibleText = () => js(`document.body ? document.body.innerText : ''`);
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
  const openDebugPanel = async (name) => {
    if (!(await js(`Boolean(document.querySelector('.debug-panel'))`))) {
      await clickButton('Toggle Debug Panel');
    }
    await waitFor(name, async () => js(`Boolean(document.querySelector('.debug-panel'))`));
  };
  const saveAndRead = async () => {
    await waitFor('Save button ready', async () => {
      const button = (await buttons()).find((candidate) => candidate.aria === 'Save Game');
      return button?.disabled === false;
    });
    await clickButton('Save Game');
    await waitFor('Save completes', async () => (await visibleText()).includes('Saved!'));
    return JSON.parse(await js(`window.localStorage.getItem('desktop-muse-idle-save')`));
  };

  await win.loadURL(appUrl);
  await waitFor('App loads', async () => (await visibleText()).includes('Desktop Muse Idle'));
  await js(`window.localStorage.clear();
    window.localStorage.setItem('desktop-muse-idle-settings', ${JSON.stringify(
      JSON.stringify(defaultSettings),
    )});
    window.localStorage.setItem('desktop-muse-idle-tutorial-seen', 'true');`);
  await win.reload();
  await waitFor('Title reloads', async () => (await visibleText()).includes('Hit the corner.'));

  const pureChecks = await js(`(async () => {
    const { stepBounceBody } = await import('/src/game/bouncePhysics.ts');
    const { createInitialUpgrades } = await import('/src/data/upgrades.ts');
    const { createInitialSkillNodes } = await import('/src/data/skillTree.ts');
    const {
      calculateBounceReward,
      calculateCornerReward,
      calculateNearCornerDistance,
      calculateVegaBumperReward
    } = await import('/src/game/rewardCalculator.ts');
    const {
      getCloneWallRewardMultiplier,
      getCloneCornerRewardMultiplier
    } = await import('/src/game/skillEffects.ts');
    const {
      canRewardVegaBumperCollision,
      handleVegaBumperCollisions
    } = await import('/src/game/museCollision.ts');
    const bounds = { width: 1920, height: 1080, inset: 12 };
    const radius = 46;
    const minX = bounds.inset + radius;
    const minY = bounds.inset + radius;
    const maxX = bounds.width - bounds.inset - radius;
    const maxY = bounds.height - bounds.inset - radius;
    const upgrades = createInitialUpgrades();
    const skills = createInitialSkillNodes();
    const bounceReward = calculateBounceReward(upgrades, skills, 'medium');
    const cornerReward = calculateCornerReward(upgrades, skills, 'medium');
    const boostedUpgrades = createInitialUpgrades();
    boostedUpgrades.bounce_boost.level = 8;
    boostedUpgrades.corner_sensor.level = 8;
    const boostedBounceReward = calculateBounceReward(boostedUpgrades, skills, 'medium');
    const boostedCornerReward = calculateCornerReward(boostedUpgrades, skills, 'medium');
    const corner = stepBounceBody({ x: minX + 1, y: minY + 1, vx: -300, vy: -300, radius }, bounds, 1, {
      nearCornerDistance: calculateNearCornerDistance(skills)
    }).collision;
    const near = stepBounceBody({ x: minX + 1, y: minY + 20, vx: -300, vy: 0, radius }, bounds, 1, {
      nearCornerDistance: calculateNearCornerDistance(skills)
    }).collision;
    const wall = stepBounceBody({ x: minX + 1, y: 500, vx: -300, vy: 0, radius }, bounds, 1, {
      nearCornerDistance: calculateNearCornerDistance(skills)
    }).collision;
    const sensorSkills = { ...skills, corner_sensor_1: 1 };
    const sensorDefault = stepBounceBody({ x: minX + 1, y: minY + 54, vx: -300, vy: 0, radius }, bounds, 1, {
      nearCornerDistance: calculateNearCornerDistance(skills)
    }).collision;
    const sensorBoosted = stepBounceBody({ x: minX + 1, y: minY + 54, vx: -300, vy: 0, radius }, bounds, 1, {
      nearCornerDistance: calculateNearCornerDistance(sensorSkills)
    }).collision;
    const firstBumperReward = canRewardVegaBumperCollision('lumi', 'vega', 1000, new Map());
    const cooldownMap = new Map();
    const cooldownFirst = canRewardVegaBumperCollision('lumi', 'vega', 1000, cooldownMap);
    const cooldownSecond = canRewardVegaBumperCollision('lumi', 'vega', 1100, cooldownMap);
    const cooldownThird = canRewardVegaBumperCollision('lumi', 'vega', 1400, cooldownMap);
    const vega = { runtimeId: 'vega', museId: 'vega', isClone: false, body: { x: 500, y: 500, vx: 10, vy: 0, radius: 44 } };
    const lumi = { runtimeId: 'lumi', museId: 'lumi', isClone: false, body: { x: 520, y: 500, vx: -10, vy: 0, radius: 46 } };
    const astra = { runtimeId: 'astra', museId: 'astra', isClone: false, body: { x: 520, y: 500, vx: -10, vy: 0, radius: 40 } };
    const bumperResults = handleVegaBumperCollisions({
      bounds,
      lastRewardAtByPair: new Map(),
      now: 2000,
      others: [lumi, astra],
      vega,
    });
    return {
      bounceReward,
      boostedBounceReward,
      boostedCloneWallReward: Math.max(1, Math.floor(boostedBounceReward * getCloneWallRewardMultiplier(true))),
      boostedCornerReward,
      boostedCloneCornerReward: Math.max(1, Math.floor(boostedCornerReward * getCloneCornerRewardMultiplier(true))),
      boostedVegaBumperReward: calculateVegaBumperReward(boostedBounceReward, false),
      boostedVegaCloneBumperReward: calculateVegaBumperReward(boostedBounceReward, true),
      cornerReward,
      cloneCornerReward: Math.max(1, Math.floor(cornerReward * getCloneCornerRewardMultiplier(true))),
      cloneCornerRewardMultiplier: getCloneCornerRewardMultiplier(true),
      cloneWallReward: Math.max(1, Math.floor(bounceReward * getCloneWallRewardMultiplier(true))),
      cloneWallRewardMultiplier: getCloneWallRewardMultiplier(true),
      corner,
      firstBumperReward,
      near,
      sensorDefault,
      sensorBoosted,
      vegaBumperReward: calculateVegaBumperReward(bounceReward, false),
      vegaCloneBumperReward: calculateVegaBumperReward(bounceReward, true),
      bumperResultCount: bumperResults.length,
      bumperResultRuntimeIds: bumperResults.map((result) => result.targetRuntimeId),
      cooldownFirst,
      cooldownSecond,
      cooldownThird,
      wall,
    };
  })()`);

  await assert('Pure true Corner requires same-frame X and Y wall hits', async () =>
    pureChecks.corner.hitXWall === true &&
    pureChecks.corner.hitYWall === true &&
    pureChecks.corner.isCornerHit === true &&
    pureChecks.corner.isNearCorner === false &&
    pureChecks.corner.cornerId === 'top_left',
  );
  await assert('Pure wall-only near corner is Near Corner, not Corner Hit', async () =>
    pureChecks.near.hitXWall === true &&
    pureChecks.near.hitYWall === false &&
    pureChecks.near.isNearCorner === true &&
    pureChecks.near.isCornerHit === false &&
    pureChecks.near.nearCornerId === 'top_left',
  );
  await assert('Pure ordinary wall hit is neither Corner nor Near Corner', async () =>
    pureChecks.wall.hitXWall === true &&
    pureChecks.wall.hitYWall === false &&
    pureChecks.wall.isNearCorner === false &&
    pureChecks.wall.isCornerHit === false,
  );
  await assert('Corner Sensor affects Near distance only', async () =>
    pureChecks.sensorDefault.isNearCorner === false &&
    pureChecks.sensorBoosted.isNearCorner === true &&
    pureChecks.sensorBoosted.isCornerHit === false,
  );
  await assert('Clone reward multipliers are reduced', async () =>
    pureChecks.cloneWallRewardMultiplier === 0.5 &&
    pureChecks.cloneCornerRewardMultiplier === 0.5 &&
    pureChecks.boostedCloneWallReward < pureChecks.boostedBounceReward &&
    pureChecks.boostedCloneCornerReward < pureChecks.boostedCornerReward,
  );
  await assert('Vega Bumper reward and clone reward are reduced', async () =>
    pureChecks.vegaBumperReward >= 1 &&
    pureChecks.vegaCloneBumperReward >= 1 &&
    pureChecks.boostedVegaBumperReward < pureChecks.boostedBounceReward &&
    pureChecks.boostedVegaCloneBumperReward < pureChecks.boostedVegaBumperReward,
  );
  await assert('Vega Bumper pair cooldown gates repeated rewards', async () =>
    pureChecks.cooldownFirst === true &&
    pureChecks.cooldownSecond === false &&
    pureChecks.cooldownThird === true,
  );
  await assert('Vega collision helper only resolves Vega-vs-other pairs it is given', async () =>
    pureChecks.bumperResultCount === 2 &&
    pureChecks.bumperResultRuntimeIds.includes('lumi') &&
    pureChecks.bumperResultRuntimeIds.includes('astra'),
  );

  await clickButton('Start');
  await waitFor('Game screen opens', async () => (await visibleText()).includes('Idle Observatory'));
  await openDebugPanel('Debug Panel opens for collision checks');

  const beforeNear = await saveAndRead();
  await clickButton('Force Near Corner');
  await waitFor('Debug Near Corner event observed', async () => (await visibleText()).includes('Near: top_left'));
  const afterNear = await saveAndRead();
  await assert('Runtime wall collision increments Bounce count', async () =>
    afterNear.totalBounces > beforeNear.totalBounces,
  );
  await assert('Runtime wall collision grants Memory', async () =>
    afterNear.memory > beforeNear.memory,
  );
  await assert('Runtime Near Corner does not increment totalCornerHits', async () =>
    afterNear.totalCornerHits === beforeNear.totalCornerHits,
  );
  await assert('Runtime Near Corner does not increment current stage progress', async () =>
    afterNear.stageCornerHits[beforeNear.currentStageId] === beforeNear.stageCornerHits[beforeNear.currentStageId],
  );

  const beforeClone = afterNear;
  await clickButton('Force Clone Corner');
  await waitFor('Debug Clone Corner event observed', async () => (await visibleText()).includes('Clone Corner'));
  await waitFor('Debug Clone true Corner result observed', async () => (await visibleText()).includes('Clone Corner: bottom_right'));
  const afterClone = await saveAndRead();
  await assert('Runtime Clone Corner increments Corner Hit and stage exactly once', async () =>
    afterClone.totalCornerHits === beforeClone.totalCornerHits + 1 &&
    afterClone.stageCornerHits[beforeClone.currentStageId] === beforeClone.stageCornerHits[beforeClone.currentStageId] + 1,
  );
  await assert('Runtime clone count does not grow from clone hitting a corner', async () => {
    const text = await visibleText();
    const match = text.match(/Clones\\s+(\\d+)/);
    return match ? Number(match[1]) <= 1 : true;
  });

  await clickButton('Deploy Vega');
  await waitFor('Vega deploys', async () => (await visibleText()).includes('vega'));
  const beforeVega = await saveAndRead();
  await clickButton('Force Vega Bumper');
  await waitFor('Vega Bumper active', async () => (await visibleText()).includes('Vega Bumper Active'));
  await clickButton('Force Vega Hit');
  await waitFor('Debug Vega Bumper hit observed', async () => (await visibleText()).includes('Vega Bumper hit:'));
  const afterVega = await saveAndRead();
  await assert('Runtime Vega Bumper does not increment totalCornerHits', async () =>
    afterVega.totalCornerHits === beforeVega.totalCornerHits,
  );
  await assert('Runtime Vega Bumper does not increment stage progress', async () =>
    afterVega.stageCornerHits[beforeVega.currentStageId] === beforeVega.stageCornerHits[beforeVega.currentStageId],
  );
  await assert('Runtime Vega Bumper grants bounded Memory through bumper reward path', async () =>
    afterVega.memory >= beforeVega.memory + pureChecks.vegaBumperReward,
  );

  const failures = results.filter((result) => !result.ok);
  console.log(JSON.stringify({ failures, pureChecks, results }, null, 2));
  win.destroy();
  await app.quit();
  process.exit(failures.length ? 1 : 0);
}

app.whenReady().then(main).catch((error) => {
  console.error(error);
  app.quit();
  process.exit(1);
});
