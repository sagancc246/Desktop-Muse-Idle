import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import {
  expandedProgressSave,
  incompleteSettings,
  legacySettings,
  legacyCoreSave,
  savedSettings,
} from './fixtures/saveMigrationFixtures.mjs';

const saveStorageKey = 'desktop-muse-idle-save';
const settingsStorageKey = 'desktop-muse-idle-settings';
const wallpaperSettingsStorageKey = 'desktopMuseIdle.wallpaperSettings';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function importBundledModule(entryPoint) {
  const result = await build({
    absWorkingDir: repoRoot,
    bundle: true,
    entryPoints: [resolve(repoRoot, entryPoint)],
    format: 'esm',
    platform: 'browser',
    write: false,
  });
  const source = result.outputFiles[0].text;
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

  return import(url);
}

function createStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function storeJson(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

const storage = createStorage();
globalThis.window = { localStorage: storage };

const saveSystem = await importBundledModule('./src/systems/saveSystem.ts');
const settingsSystem = await importBundledModule('./src/systems/settingsSystem.ts');
const settingsStorage = await importBundledModule('./src/systems/settingsStorage.ts');
const skins = await importBundledModule('./src/data/skins.ts');

assert.deepEqual(saveSystem.loadGameState(), saveSystem.createNewGameState());
assert.equal(saveSystem.hasSaveData(), false);

storeJson(storage, saveStorageKey, legacyCoreSave);
const coreState = saveSystem.loadGameState({ applyOfflineReward: true, now: 1_000_000 });
assert.equal(coreState.memory, legacyCoreSave.memory);
assert.equal(coreState.upgrades.bounce_boost.level, 2);
assert.equal(coreState.stats.totalWallHits, legacyCoreSave.totalBounces);
assert.equal(coreState.stats.totalCornerHits, legacyCoreSave.totalCornerHits);
assert.equal(coreState.currentStageId, 'stage-1');
assert.deepEqual(coreState.stageCornerHits, {
  'stage-1': 0,
  'stage-2': 0,
  'stage-3': 0,
  'stage-4': 0,
});
assert.deepEqual(coreState.clearedStages, []);
assert.deepEqual(coreState.unlockedBackgrounds, []);
assert.deepEqual(coreState.unlockedMuseIds, ['lumi']);
assert.deepEqual(coreState.activeMuseIds, ['lumi']);
assert.deepEqual(coreState.unlockedSkinIds, skins.initialUnlockedSkinIds);
assert.deepEqual(coreState.equippedSkinByMuseId, skins.createInitialEquippedSkinByMuseId());
assert.equal(coreState.fragments, 0);
assert.equal(coreState.capsuleCount, 0);
assert.equal(coreState.rebootCount, 0);
assert.equal(coreState.pendingOfflineReward, null);

storeJson(storage, saveStorageKey, expandedProgressSave);
const expandedState = saveSystem.loadGameState();
assert.equal(expandedState.currentStageId, 'stage-2');
assert.deepEqual(expandedState.stageCornerHits, {
  'stage-1': 100,
  'stage-2': 28,
  'stage-3': 0,
  'stage-4': 0,
});
assert.deepEqual(expandedState.clearedStages, ['stage-1']);
assert.deepEqual(expandedState.unlockedBackgrounds, ['bg_default_room', 'bg_cozy_room']);
assert.equal(expandedState.currentBackgroundId, 'bg_cozy_room');
assert.deepEqual(expandedState.unlockedMuseIds, ['lumi']);
assert.deepEqual(expandedState.activeMuseIds, ['lumi']);
assert.equal(expandedState.fragments, 5);
assert.equal(expandedState.capsuleCount, 0);
assert.equal(expandedState.unlockedSkillNodes.bounce_memory_1, 1);
assert.equal(expandedState.unlockedSkillNodes.passive_cache, 1);
assert.equal(expandedState.unlockedSkillNodes.removed_skill, undefined);
assert.equal(expandedState.rebootCount, 2);

storeJson(storage, saveStorageKey, {
  ...legacyCoreSave,
  equippedSkinByMuseId: {
    lumi: 'removed_skin',
    astra: 'lumi_default',
    noir: 'noir_gothic',
  },
  unlockedSkinIds: ['removed_skin'],
});
const invalidSkinState = saveSystem.loadGameState();
assert.deepEqual(invalidSkinState.unlockedSkinIds, skins.initialUnlockedSkinIds);
assert.deepEqual(invalidSkinState.equippedSkinByMuseId, skins.createInitialEquippedSkinByMuseId());

storeJson(storage, settingsStorageKey, savedSettings);
assert.deepEqual(settingsSystem.loadSettings(), savedSettings);

storeJson(storage, settingsStorageKey, legacySettings);
assert.deepEqual(settingsSystem.loadSettings(), {
  ...legacySettings,
  motionIntensity: 'medium',
});

storeJson(storage, settingsStorageKey, incompleteSettings);
assert.deepEqual(settingsSystem.loadSettings(), settingsSystem.defaultSettings);

storage.setItem(wallpaperSettingsStorageKey, '{bad-json');
assert.deepEqual(
  settingsStorage.loadWallpaperSettings(),
  settingsStorage.defaultWallpaperSettings,
);

storeJson(storage, wallpaperSettingsStorageKey, {
  alwaysOnTopPreferred: false,
  bgmEnabled: 'yes',
  clickThroughPreferred: true,
  effectsQuality: 'ultra',
  fps: 120,
  seVolumeScale: 'loud',
  showOverlayHud: true,
  showStageHud: false,
  wallpaperMode: 'stage',
});
const invalidWallpaperSettings = settingsStorage.loadWallpaperSettings();
assert.deepEqual(invalidWallpaperSettings, {
  ...settingsStorage.defaultWallpaperSettings,
  alwaysOnTopPreferred: false,
  clickThroughPreferred: true,
  showOverlayHud: true,
  showStageHud: false,
});
assert.equal(Object.hasOwn(invalidWallpaperSettings, 'wallpaperMode'), false);

storage.removeItem(wallpaperSettingsStorageKey);
storeJson(storage, settingsStorageKey, {
  ...savedSettings,
  wallpaperSettings: {
    ...settingsStorage.defaultWallpaperSettings,
    fps: 60,
    bgmEnabled: true,
    effectsQuality: 'normal',
  },
});
assert.deepEqual(settingsStorage.loadWallpaperSettings(), {
  ...settingsStorage.defaultWallpaperSettings,
  fps: 60,
  bgmEnabled: true,
  effectsQuality: 'normal',
});

storage.setItem(saveStorageKey, '{bad-json');
const corruptState = saveSystem.loadGameState();
assert.equal(corruptState.memory, 0);
assert.equal(storage.getItem(saveStorageKey), null);

storeJson(storage, saveStorageKey, { ...legacyCoreSave, memory: -1 });
const invalidState = saveSystem.loadGameState();
assert.equal(invalidState.memory, 0);
assert.equal(storage.getItem(saveStorageKey), null);

const resetBoundaryState = saveSystem.createNewGameState();
resetBoundaryState.memory = 999;
resetBoundaryState.capsuleCount = 3;
saveSystem.saveGameState(resetBoundaryState);
const capsuleState = saveSystem.loadGameState();
assert.equal(capsuleState.capsuleCount, 3);
storeJson(storage, settingsStorageKey, savedSettings);
storeJson(storage, wallpaperSettingsStorageKey, {
  ...settingsStorage.defaultWallpaperSettings,
  fps: 60,
  bgmEnabled: true,
});
assert.equal(saveSystem.hasSaveData(), true);
saveSystem.clearSaveData();
assert.equal(saveSystem.hasSaveData(), false);
assert.equal(storage.getItem(saveStorageKey), null);
assert.deepEqual(settingsSystem.loadSettings(), savedSettings);
assert.deepEqual(settingsStorage.loadWallpaperSettings(), {
  ...settingsStorage.defaultWallpaperSettings,
  fps: 60,
  bgmEnabled: true,
});

saveSystem.saveGameState(saveSystem.createNewGameState());
const persistedGameSave = storage.getItem(saveStorageKey);
assert.equal(persistedGameSave.includes('wallpaperMode'), false);
assert.equal(persistedGameSave.includes('wallpaperSettings'), false);

console.log(
  'Save migration verification passed: empty storage, legacy/malformed saves, skin fallback, settings, wallpaper settings, and reset storage separation.',
);
