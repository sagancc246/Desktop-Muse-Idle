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
const stages = await importBundledModule('./src/data/stages.ts');
const backgrounds = await importBundledModule('./src/data/backgrounds.ts');
const muses = await importBundledModule('./src/data/muses.ts');
const skills = await importBundledModule('./src/data/skills.ts');
const rewardApplier = await importBundledModule('./src/game/rewardApplier.ts');

assert.equal(stages.stages.length, 10);
assert.equal(muses.muses.length, 4);
assert.equal(skins.museSkins.length, 8);
assert.equal(backgrounds.backgrounds.length, 6);
assert.deepEqual(Object.keys(skills.skills), ['clone', 'speed_up', 'giant', 'muse_bumper']);
assert.equal(backgrounds.initialBackgroundId, 'bg_default_room');
assert.equal(muses.getMuseById('vega').unlockCondition.targetId, 'stage-5');
assert.equal(
  stages.getStageById('stage-2').rewards.some(
    (reward) => reward.type === 'skin' && reward.id === 'lumi_pastel',
  ),
  true,
);
for (const muse of muses.muses) {
  assert.equal(skins.getSkinById(muse.defaultSkinId)?.museId, muse.id);
  assert.equal(skills.getSkillById(muse.skillId).id, muse.skillId);
}

assert.deepEqual(saveSystem.loadGameState(), saveSystem.createNewGameState());
assert.equal(saveSystem.hasSaveData(), false);

storeJson(storage, saveStorageKey, legacyCoreSave);
const coreState = saveSystem.loadGameState({ applyOfflineReward: true, now: 1_000_000 });
assert.equal(coreState.memory, legacyCoreSave.memory);
assert.equal(coreState.upgrades.bounce_boost.level, 2);
assert.equal(coreState.stats.totalWallHits, legacyCoreSave.totalBounces);
assert.equal(coreState.stats.totalCornerHits, legacyCoreSave.totalCornerHits);
assert.equal(coreState.currentStageId, 'stage-1');
assert.deepEqual(coreState.stageCornerHits, stages.createInitialStageCornerHits());
assert.deepEqual(coreState.clearedStages, []);
assert.deepEqual(coreState.claimedRewardIds, []);
assert.deepEqual(coreState.claimedStageRewardIds, []);
assert.deepEqual(coreState.unlockedBackgrounds, ['bg_default_room']);
assert.equal(coreState.currentBackgroundId, 'bg_default_room');
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
  ...stages.createInitialStageCornerHits(),
  'stage-1': 100,
  'stage-2': 28,
});
assert.deepEqual(expandedState.clearedStages, ['stage-1']);
assert.deepEqual(expandedState.claimedRewardIds, []);
assert.deepEqual(expandedState.claimedStageRewardIds, []);
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
resetBoundaryState.claimedRewardIds = ['stage-2:lumi_pastel', 'stage-2:lumi_pastel'];
resetBoundaryState.claimedStageRewardIds = ['stage-2', 'stage-2'];
saveSystem.saveGameState(resetBoundaryState);
const capsuleState = saveSystem.loadGameState();
assert.equal(capsuleState.capsuleCount, 3);
assert.deepEqual(capsuleState.claimedRewardIds, ['stage-2:lumi_pastel']);
assert.deepEqual(capsuleState.claimedStageRewardIds, ['stage-2']);

storeJson(storage, saveStorageKey, {
  ...legacyCoreSave,
  currentStageId: 'stage-3',
  stageCornerHits: {
    ...stages.createInitialStageCornerHits(),
    'stage-1': stages.getStageById('stage-1').cornerHitGoal,
    'stage-2': stages.getStageById('stage-2').cornerHitGoal,
  },
  clearedStages: ['stage-1', 'stage-2'],
  claimedStageRewardIds: ['stage-2'],
});
const migratedStageClaimState = saveSystem.loadGameState();
assert.deepEqual(
  migratedStageClaimState.claimedRewardIds,
  ['stage-2:lumi_pastel', 'stage-2:astra'],
);

storeJson(storage, saveStorageKey, {
  ...legacyCoreSave,
  claimedRewardIds: [],
  claimedStageRewardIds: ['stage-2'],
});
assert.deepEqual(saveSystem.loadGameState().claimedRewardIds, []);

let appliedMemory = 0;
const rewardActions = {
  addMemory(amount) {
    appliedMemory += amount;
  },
  hasBackground() {
    return false;
  },
  hasMuse() {
    return false;
  },
  hasSkin() {
    return false;
  },
  unlockBackground() {},
  unlockMuse() {},
  unlockSkin() {},
};
const memoryRewardResult = rewardApplier.applyReward(
  { type: 'memory', amount: 25 },
  rewardActions,
);
assert.equal(memoryRewardResult.granted, true);
assert.equal(appliedMemory, 25);
const unknownSkinResult = rewardApplier.applyReward(
  { type: 'skin', id: 'removed_skin' },
  rewardActions,
);
assert.equal(unknownSkinResult.unsupported, true);
const unknownRewardResult = rewardApplier.applyReward(
  { type: 'removed_reward' },
  rewardActions,
);
assert.equal(unknownRewardResult.unsupported, true);
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
  'Save migration verification passed: empty storage, legacy/malformed saves, claimed stage rewards, reward fallback, skin fallback, settings, wallpaper settings, and reset storage separation.',
);
