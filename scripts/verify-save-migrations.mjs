import assert from 'node:assert/strict';
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

async function importBundledModule(entryPoint) {
  const result = await build({
    bundle: true,
    entryPoints: [entryPoint],
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

storeJson(storage, saveStorageKey, legacyCoreSave);
const coreState = saveSystem.loadGameState({ applyOfflineReward: true, now: 1_000_000 });
assert.equal(coreState.memory, legacyCoreSave.memory);
assert.equal(coreState.upgrades.bounce_boost.level, 2);
assert.equal(coreState.currentStageId, 'stage-1');
assert.deepEqual(coreState.stageCornerHits, { 'stage-1': 0, 'stage-2': 0, 'stage-3': 0 });
assert.deepEqual(coreState.clearedStages, []);
assert.deepEqual(coreState.unlockedBackgrounds, []);
assert.deepEqual(coreState.activeMuseIds, ['lumi']);
assert.equal(coreState.fragments, 0);
assert.equal(coreState.rebootCount, 0);
assert.equal(coreState.pendingOfflineReward, null);

storeJson(storage, saveStorageKey, expandedProgressSave);
const expandedState = saveSystem.loadGameState();
assert.equal(expandedState.currentStageId, 'stage-2');
assert.deepEqual(expandedState.stageCornerHits, { 'stage-1': 100, 'stage-2': 28, 'stage-3': 0 });
assert.deepEqual(expandedState.clearedStages, ['stage-1']);
assert.deepEqual(expandedState.unlockedBackgrounds, ['bg_default_room', 'bg_cozy_room']);
assert.equal(expandedState.currentBackgroundId, 'bg_cozy_room');
assert.deepEqual(expandedState.activeMuseIds, ['astra', 'noir']);
assert.equal(expandedState.fragments, 5);
assert.equal(expandedState.unlockedSkillNodes.bounce_memory_1, 1);
assert.equal(expandedState.unlockedSkillNodes.passive_cache, 1);
assert.equal(expandedState.unlockedSkillNodes.removed_skill, undefined);
assert.equal(expandedState.rebootCount, 2);

storeJson(storage, settingsStorageKey, savedSettings);
assert.deepEqual(settingsSystem.loadSettings(), savedSettings);

storeJson(storage, settingsStorageKey, legacySettings);
assert.deepEqual(settingsSystem.loadSettings(), {
  ...legacySettings,
  motionIntensity: 'medium',
});

storeJson(storage, settingsStorageKey, incompleteSettings);
assert.deepEqual(settingsSystem.loadSettings(), settingsSystem.defaultSettings);

storage.setItem(saveStorageKey, '{bad-json');
const corruptState = saveSystem.loadGameState();
assert.equal(corruptState.memory, 0);
assert.equal(storage.getItem(saveStorageKey), null);

storeJson(storage, saveStorageKey, { ...legacyCoreSave, memory: -1 });
const invalidState = saveSystem.loadGameState();
assert.equal(invalidState.memory, 0);
assert.equal(storage.getItem(saveStorageKey), null);

console.log('Save migration verification passed: legacy defaults, extended progress, settings, and corrupt data.');
