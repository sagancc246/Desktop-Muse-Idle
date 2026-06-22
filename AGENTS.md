# AGENTS.md

## Project

This repository is for **Desktop Muse Idle**, a PC idle game built with React, TypeScript, Vite, PixiJS, and Zustand.

Core game loop:

1. A cute muse character icon bounces around the screen.
2. Wall hits generate Memory.
3. Corner Hits grant large bonus rewards.
4. Memory is spent on upgrades.
5. Upgrades improve speed, reward value, Corner Hit multiplier, and progression efficiency.
6. Characters, skins, backgrounds, conversations, and visual rewards are unlocked.
7. Reboot grants permanent progression bonuses.
8. The player becomes more efficient and repeats the loop.

The game should feel like a polished idle/clicker game with a cute desktop mascot, satisfying bounce feedback, readable UI, and clear progression rewards.

---

## Primary Goals

When implementing features, prioritize in this order:

1. Preserve the core loop and make it more satisfying.
2. Improve player feedback: rewards, hit effects, unlocks, stage clear, and progress visibility.
3. Keep the UI clean, readable, and game-like.
4. Avoid unnecessary refactors unless they directly reduce bugs or implementation friction.
5. Prefer small, reviewable changes over large rewrites.

---

## Tech Stack

Use the existing stack and patterns:

* React
* TypeScript
* Vite
* PixiJS
* Zustand
* CSS Modules or existing CSS structure, depending on the current project style

Do not introduce new large dependencies unless clearly necessary.

---

## Implementation Rules

### General

* Before editing, inspect the existing files and follow the current architecture.
* Keep changes minimal and focused on the requested task.
* Do not rewrite unrelated systems.
* Do not rename files, components, stores, or data structures unless required.
* Do not remove existing features unless the task explicitly asks for it.
* Avoid speculative features.
* Prefer data-driven implementations when adding characters, skins, stages, backgrounds, upgrades, or rewards.

### TypeScript

* Keep TypeScript strict and safe.
* Avoid `any` unless there is no reasonable alternative.
* Add or update types when adding new data fields.
* Keep state transitions predictable.

### React

* Keep components small and readable.
* Avoid putting large game logic directly inside UI components.
* Use memoization only when it clearly helps performance or prevents unnecessary rerenders.
* Do not over-engineer.

### PixiJS / Game Loop

* Keep ticker/update logic lightweight.
* Avoid expensive per-frame React state updates.
* Avoid creating new objects every frame where practical.
* Effects should be pooled or cleaned up when appropriate.
* Animation should feel juicy, but performance should stay stable.

### Zustand / State

* Keep persistent progression state in the store.
* Keep transient animation-only state out of global state when possible.
* Make unlocks and rewards deterministic.
* Avoid state duplication.

---

## Game Design Rules

### Core Feel

The game should feel:

* cute
* bouncy
* satisfying
* readable
* idle-friendly
* slightly flashy when rewards happen
* not visually overwhelming during long play

### Reward Feedback

Important events should be visually obvious:

* Wall Hit
* Corner Hit
* Stage Clear
* Skin unlock
* Background unlock
* Character unlock
* Reboot
* Upgrade purchase
* Milestone reached

Do not silently unlock major rewards. Add clear UI feedback when possible.

### Stage Clear

Stage clear should show:

* Stage cleared text
* Reward cards
* Newly unlocked content
* Continue / next stage action
* Clear connection between condition and reward

### Upgrades

Upgrades should clearly show:

* Name
* Current level
* Current effect
* Next effect
* Cost
* Whether the player can afford it

### Skill Tree

If improving the skill tree, prefer a node/tree style layout over plain buttons when practical.

The skill tree should communicate:

* unlock path
* owned nodes
* available nodes
* locked nodes
* effect preview

### Backgrounds / Skins / Characters

Prefer master-data-driven structure.

Recommended data files:

* `src/data/stages.ts`
* `src/data/skins.ts`
* `src/data/backgrounds.ts`
* `src/data/characters.ts`
* `src/data/upgrades.ts`
* `src/data/skills.ts`

When adding unlockable content, avoid hardcoding unlock logic directly in UI components.

---

## UI Rules

### Visual Direction

Use a polished anime idle game UI style:

* dark translucent panels
* soft gradients
* pastel neon accents
* rounded cards
* readable text
* clear hierarchy
* game-like reward effects

Avoid:

* plain web-app feeling
* random colors
* cluttered panels
* tiny unreadable text
* excessive borders
* AI-generated-looking inconsistent UI

### Layout

The default layout is:

* central game area / PixiJS stage
* left or side upgrade panel
* top HUD for Memory, stage, Corner Hits, and major status
* optional lower area for logs, unlocks, or mode controls

The UI must remain usable at different browser sizes.

Use responsive layout rules and avoid fixed pixel assumptions where possible.

### Focus Mode / Wallpaper Mode

These modes should reduce UI noise.

They must not cause stutter.

When working on these modes, check:

* ticker frequency
* React rerenders
* animation loops
* CSS effects
* PixiJS object creation
* hidden UI still updating unnecessarily

---

## Performance Rules

When fixing performance or stutter:

1. Identify the likely source.
2. Avoid guessing.
3. Check whether React state updates are happening too frequently.
4. Check PixiJS ticker/update load.
5. Check expensive visual effects.
6. Check whether Wallpaper FPS settings actually affect update frequency.
7. Add lightweight debug information when useful.

Do not solve performance issues by simply removing important game feedback unless necessary.

---

## Verification and CI Rules

After implementation, always run:

* `npm run build`

Run `npm run verify:all` when changes affect:

* game behavior
* save data or persistence
* screen transitions
* collision or reward logic
* Wallpaper Mode
* Focus Mode
* Electron-related behavior

Do not treat a task as complete while required build or verification checks are failing.

GitHub Actions is expected to run from `.github/workflows/ci.yml` on `push` and `pull_request`.

When CI fails:

* use the CI logs to identify the cause
* make the smallest focused fix
* do not change the intended game specification merely to make tests pass

Also run other available checks when relevant.

Prefer:

* `npm run typecheck`
* `npm run lint`
* `npm run test`

If a command does not exist, mention it in the final report.

For UI changes, verify manually when possible:

* default game screen
* upgrade purchase
* wall hit reward
* corner hit reward
* stage clear
* unlock display
* focus mode
* wallpaper mode
* resized browser window

---

## Reporting Format

At the end of each task, report:

1. Summary of changes
2. Files changed
3. Verification commands run
4. Any commands that failed or were unavailable
5. Remaining risks or follow-up tasks

Do not claim a check passed unless it was actually run.

---

## Prohibited Actions

Do not:

* Replace the entire app structure without permission.
* Delete major systems without permission.
* Add backend/server requirements unless explicitly requested.
* Add analytics, tracking, ads, or network calls unless explicitly requested.
* Add copyrighted characters or IP-based assets.
* Make large dependency changes without explaining why.
* Ignore existing TODO documents.
* Leave broken TypeScript or obvious console errors.

---

## Preferred Workflow

For each implementation task:

1. Read relevant files.
2. Identify the smallest safe change.
3. Implement.
4. Run checks.
5. Fix obvious errors.
6. Provide a concise final report.

If the requested task is large, split it into small implementation steps and complete the safest useful subset first.

---

## Project-Specific Priorities

Current priority direction:

1. Game feature implementation
2. UI polish
3. Reward and unlock clarity
4. Master data organization
5. Performance verification
6. Lazy loading and optimization

Known deferred work:

* Long-duration real desktop performance testing
* Full Wallpaper Stage / Muse Overlay 30fps and 60fps load verification
* Deep optimization unless visible stutter is confirmed

---

## Codex Behavior

Act as a careful implementation agent.

Do not only explain. Modify the code when asked to implement.

When the user asks for a bug fix:

* reproduce or inspect the likely cause
* fix the root cause when possible
* avoid cosmetic-only fixes

When the user asks for UI improvement:

* improve actual layout, spacing, hierarchy, and feedback
* do not only change colors
* preserve game readability

When the user asks for automation:

* prefer reusable scripts, checks, or documented workflows
* avoid fragile one-off hacks

When uncertain, make a reasonable best-effort implementation and clearly state assumptions in the final report.
