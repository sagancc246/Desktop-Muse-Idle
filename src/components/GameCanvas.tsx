import { useEffect, useRef } from 'react';
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from 'pixi.js';
import {
  cloneSpawnMaxAttempts,
  cloneSpawnMinDistance,
  cloneSpawnWallPadding,
  cornerHitAssistZonePx,
  cornerHitCooldownMs,
  memoryBugDropCollectArrivalRadius,
  memoryBugDropCollectDisableMs,
  memoryBugDropCollectMouseSpeedMultiplier,
  memoryBugDropCollectSpeed,
  memoryBugDropCollectTouchRadius,
  memoryBugDropMuseCollectPadding,
  memoryBugDropCountMax,
  memoryBugDropCountMin,
  memoryBugDropMaxVisible,
  memoryBugDropValue,
  memoryBugRespawnMs,
  museTapDirectionChangeDegreeHigh,
  museTapDirectionChangeDegreeLow,
  museTapDirectionChangeDegreeMedium,
  museTapEffectDurationMs,
  wallpaperLowEffectFlashAlphaMultiplier,
  wallpaperLowEffectLayerAlphaMultiplier,
  wallpaperLowEffectParticleMultiplier,
} from '../data/balance';
import { getBackgroundById } from '../data/backgrounds';
import { defaultEnemyTypeId, getEnemyMasterById, type EnemyMaster } from '../data/enemies';
import { getMuseById } from '../data/muses';
import { getEquippedSkinForMuse } from '../data/skins';
import { getStageById, getStageEnemyConfig, initialStageId } from '../data/stages';
import { createEffectManager } from '../effects/effectManager';
import type { CornerEffectKind } from '../effects/effectTypes';
import { createInitialBody, stepBounceBody, type BounceBody } from '../game/bouncePhysics';
import { getCollisionLimits } from '../game/cornerHitDetector';
import {
  calculateBounceReward,
  calculateBackgroundTapReward,
  calculateCornerReward,
  calculateMuseTapCornerRewardMultiplier,
  calculateNearCornerDistance,
  calculateNearCornerReward,
  calculateVegaBumperReward,
  calculateVisualSpeedMultiplier,
} from '../game/rewardCalculator';
import {
  getCloneCornerRewardMultiplier,
  getCloneWallRewardMultiplier,
  getSkillScale,
  getSkillSpeedMultiplier,
  isSkillActive,
} from '../game/skillEffects';
import { decideTapInput, getActiveTapBoostStack } from '../game/tapActions';
import { findSafeCloneSpawnPosition } from '../game/spawnUtils';
import { handleVegaBumperCollisions } from '../game/museCollision';
import { useAppStore } from '../store/useAppStore';
import { useGameStore } from '../store/useGameStore';
import { playCornerHitSound, playMuseTapVoice, prepareAudioSystem } from '../systems/audioSystem';
import { fallbackBackgroundImagePath, warnAssetFallbackOnce } from '../systems/assetFallbacks';
import { resolveMonsterSpriteAsset } from '../systems/monsterAssetResolver';
import type { CornerHitPosition, MotionIntensity, Muse } from '../types/game';

interface BurstParticle {
  graphic: Graphics;
  life: number;
  maxLife: number;
  rotationSpeed: number;
  vx: number;
  vy: number;
}

interface TapEffect {
  graphic: Graphics;
  life: number;
  maxLife: number;
}

interface FloatingTextEffect {
  life: number;
  maxLife: number;
  text: Text;
  vy: number;
}

interface EnemyView {
  body: Graphics;
  hpBack: Graphics;
  hpFill: Graphics;
  label: Text;
}

interface MemoryBugEnemy {
  defeatedAt: number | null;
  dropAmount: number;
  hitFlashRemaining: number;
  hp: number;
  id: string;
  isAlive: boolean;
  lastHitAt: number;
  maxHp: number;
  radius: number;
  respawnAt: number;
  type: string;
  view: EnemyView;
  x: number;
  y: number;
}

interface MemoryDrop {
  canCollectAt: number;
  collectSource: 'mouse' | 'muse' | null;
  collectSpeed: number;
  collectStartedAt: number | null;
  collectTargetX: number | null;
  collectTargetY: number | null;
  createdAt: number;
  graphic: Graphics;
  id: string;
  radius: number;
  rotationSpeed: number;
  state: 'falling' | 'settled' | 'collecting';
  value: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

interface ActiveMuseBody {
  runtimeId: string;
  muse: Muse;
  monsterId: 'memory_slime';
  body: BounceBody;
  baseRadius: number;
  isClone: boolean;
  glow: Graphics;
  icon: Container;
  iconHitArea: Rectangle;
  fallbackIcon: Graphics;
  slimeSprite: Sprite;
  squashAxis: 'x' | 'y' | 'corner' | null;
  squashRemaining: number;
}

interface GameCanvasProps {
  presentationMode?: 'normal' | 'muse_overlay' | 'wallpaper_stage';
}

export function GameCanvas({ presentationMode = 'normal' }: GameCanvasProps) {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const presentationModeRef = useRef(presentationMode);

  useEffect(() => {
    presentationModeRef.current = presentationMode;
  }, [presentationMode]);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) {
      return;
    }

    const app = new Application();
    let isCancelled = false;
    let isInitialized = false;
    let unsubscribeStore: (() => void) | undefined;
    let removeDebugListeners: (() => void) | undefined;
    let removeHostPointerListener: (() => void) | undefined;
    let removeVisibilityListener: (() => void) | undefined;
    let destroyEffectManager: (() => void) | undefined;
    const cleanupAudio = prepareAudioSystem();

    const setup = async () => {
      // The outer stage scales visually; Pixi keeps fixed logical coordinates.
      const logicalWidth = host.clientWidth;
      const logicalHeight = host.clientHeight;

      await app.init({
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        height: logicalHeight,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        width: logicalWidth,
      });

      if (isCancelled) {
        app.destroy(true);
        return;
      }

      isInitialized = true;
      host.appendChild(app.canvas);
      const updateTickerVisibility = () => {
        if (document.visibilityState === 'hidden') {
          app.ticker.stop();
          return;
        }

        app.ticker.start();
      };

      document.addEventListener('visibilitychange', updateTickerVisibility);
      removeVisibilityListener = () =>
        document.removeEventListener('visibilitychange', updateTickerVisibility);
      updateTickerVisibility();

      const arena = new Graphics();
      const backgroundImage = new Sprite();
      const backgroundMask = new Graphics();
      backgroundImage.alpha = 0.58;
      backgroundImage.visible = false;
      backgroundImage.mask = backgroundMask;
      const grid = new Graphics();
      const cornerZoneLayer = new Graphics();
      const cornerGlowLayer = new Container();
      const memoryDropLayer = new Container();
      const enemyLayer = new Container();
      const museLayer = new Container();
      const particleLayer = new Container();
      const tapEffectLayer = new Container();
      const ringLayer = new Container();
      const screenFlashLayer = new Container();
      const cornerTextLayer = new Container();
      const skillNotice = new Text({
        text: '',
        style: {
          fill: 0x8cdcff,
          fontFamily: 'Arial, sans-serif',
          fontSize: 20,
          fontWeight: 'bold',
          letterSpacing: 1,
          stroke: { color: 0x142044, width: 4 },
        },
      });
      skillNotice.anchor.set(0.5);
      skillNotice.visible = false;
      const tapNotice = new Text({
        text: '',
        style: {
          align: 'center',
          fill: 0xffd681,
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
          fontWeight: 'bold',
          stroke: { color: 0x142044, width: 4 },
        },
      });
      tapNotice.anchor.set(0.5);
      tapNotice.visible = false;
      const bumperNotice = new Text({
        text: 'BUMPER ACTIVE',
        style: {
          align: 'center',
          fill: 0xffd681,
          fontFamily: 'Arial, sans-serif',
          fontSize: 18,
          fontWeight: 'bold',
          letterSpacing: 1,
          stroke: { color: 0x142044, width: 4 },
        },
      });
      bumperNotice.anchor.set(0.5);
      bumperNotice.visible = false;
      app.stage.addChild(
        arena,
        backgroundImage,
        backgroundMask,
        grid,
        cornerZoneLayer,
        cornerGlowLayer,
        memoryDropLayer,
        enemyLayer,
        museLayer,
        particleLayer,
        tapEffectLayer,
        ringLayer,
        screenFlashLayer,
        cornerTextLayer,
        skillNotice,
        tapNotice,
        bumperNotice,
      );
      const effectManager = createEffectManager({
        cornerGlowLayer,
        ringLayer,
        screenFlashLayer,
        textLayer: cornerTextLayer,
      });
      destroyEffectManager = effectManager.destroy;

      let pulseTime = 0;
      let skillNoticeTime = 0;
      let tapNoticeTime = 0;
      let skillTickAccumulatorMs = 0;
      const particles: BurstParticle[] = [];
      const tapEffects: TapEffect[] = [];
      const floatingTexts: FloatingTextEffect[] = [];
      const inset = 12;
      let lastBackgroundTapAt = 0;
      let lastCornerHitAt = 0;
      let highlightedCornerZone: CornerHitPosition | null = null;
      let highlightedCornerZoneRemaining = 0;
      let backgroundRequestId = 0;
      let isBackgroundImageReady = false;
      const activeMuses = new Map<string, ActiveMuseBody>();
      const enemies: MemoryBugEnemy[] = [];
      let enemySequence = 0;
      const memoryDrops: MemoryDrop[] = [];
      let memoryDropSequence = 0;
      const vegaBumperRewardAtByPair = new Map<string, number>();
      const memorySlimeAsset = resolveMonsterSpriteAsset('memory_slime');
      const memorySlimeAssetPath = memorySlimeAsset.assetPath;
      const memorySlimeFallbackAssetPath = memorySlimeAsset.fallbackAssetPath;
      let memorySlimeTexture: Texture | null = null;
      let isMemorySlimeTextureReady = false;
      let debugLastEvent = 'GameCanvas ready';
      let debugLastEventAt: number | null = null;
      let debugStatusElapsedMs = 0;
      let currentWallpaperFps = 0;
      let lastUpdateDeltaMs = 0;
      let measuredUpdatesPerSecond = 0;
      let updateSampleCount = 0;
      let updateSampleStartedAt = performance.now();
      let updateIntervalMs = 0;
      let appliedTickerMaxFps = app.ticker.maxFPS;
      const museColors: Record<string, { fill: number; outline: number; figure: number; glow: number }> = {
        'lumi-orchid': { fill: 0x3d3568, outline: 0xb38cff, figure: 0xdbcef9, glow: 0x8ad9ff },
        'astra-cyan': { fill: 0x17455d, outline: 0x65dcff, figure: 0xd0f4ff, glow: 0x66e7ff },
        'noir-rose': { fill: 0x53283e, outline: 0xff79af, figure: 0xffd5e5, glow: 0xff79bf },
        'vega-gold': { fill: 0x4f3b20, outline: 0xffd681, figure: 0xfff0c4, glow: 0xffb85c },
        'lumi-pastel': { fill: 0x4f426c, outline: 0xffb8e7, figure: 0xffe5f5, glow: 0xffd681 },
        'astra-cyber': { fill: 0x103d72, outline: 0x37f6ff, figure: 0xe1fbff, glow: 0x9b6cff },
        'noir-gothic': { fill: 0x33223d, outline: 0xdd6bff, figure: 0xf0d4ff, glow: 0xff79af },
      };
      const radii: Record<string, number> = { lumi: 46, astra: 40, noir: 43, vega: 44 };
      let handleMuseTap = (_runtime: ActiveMuseBody) => undefined;

      const createEnemyView = (master: EnemyMaster): EnemyView => {
        const view = {
          body: new Graphics(),
          hpBack: new Graphics(),
          hpFill: new Graphics(),
          label: new Text({
            text: master.name,
            style: {
              align: 'center',
              fill: 0xf1dcff,
              fontFamily: 'Arial, sans-serif',
              fontSize: 11,
              fontWeight: 'bold',
              stroke: { color: 0x16091f, width: 3 },
            },
          }),
        };
        view.label.anchor.set(0.5);
        enemyLayer.addChild(view.body, view.hpBack, view.hpFill, view.label);
        return view;
      };

      const destroyEnemyView = (enemy: MemoryBugEnemy) => {
        enemyLayer.removeChild(enemy.view.body, enemy.view.hpBack, enemy.view.hpFill, enemy.view.label);
        enemy.view.body.destroy();
        enemy.view.hpBack.destroy();
        enemy.view.hpFill.destroy();
        enemy.view.label.destroy();
      };

      const clearEnemies = () => {
        while (enemies.length > 0) {
          const enemy = enemies.pop();
          if (enemy) {
            destroyEnemyView(enemy);
          }
        }
      };

      const getMemoryBugSpawnPosition = (radius: number, existingEnemies: MemoryBugEnemy[]) => {
        const horizontalPadding = radius + inset + 72;
        const minX = horizontalPadding;
        const maxX = Math.max(minX, app.screen.width - horizontalPadding);
        const minY = inset + radius + 84;
        const maxY = Math.max(minY, app.screen.height - inset - radius - 110);
        const minDistance = radius * 2.5;

        for (let attempt = 0; attempt < 24; attempt += 1) {
          const position = {
            x: minX + Math.random() * Math.max(1, maxX - minX),
            y: minY + Math.random() * Math.max(1, maxY - minY),
          };
          const overlapsEnemy = existingEnemies.some(
            (enemy) =>
              enemy.isAlive &&
              Math.hypot(enemy.x - position.x, enemy.y - position.y) <
                minDistance + enemy.radius,
          );
          if (!overlapsEnemy) {
            return position;
          }
        }

        const fallbackIndex = existingEnemies.length;
        return {
          x: minX + Math.max(1, maxX - minX) * (0.28 + (fallbackIndex % 3) * 0.22),
          y: minY + Math.max(1, maxY - minY) * (0.35 + (fallbackIndex % 2) * 0.24),
        };
      };

      const createMemoryBugEnemy = (
        slotIndex: number,
        enemyType = defaultEnemyTypeId,
      ): MemoryBugEnemy => {
        const master = getEnemyMasterById(enemyType) ?? getEnemyMasterById(defaultEnemyTypeId);
        if (!master) {
          throw new Error('Memory Bug enemy master is missing.');
        }
        const stage = getStageById(useGameStore.getState().currentStageId) ?? getStageById(initialStageId);
        const stageConfig = stage ? getStageEnemyConfig(stage) : null;
        const hpMultiplier = stageConfig?.enemyHpMultiplier ?? 1;
        const dropMultiplier = stageConfig?.dropMultiplier ?? 1;
        const position = getMemoryBugSpawnPosition(master.radius, enemies);

        return {
          defeatedAt: null,
          dropAmount: Math.max(1, Math.round(master.dropAmount * dropMultiplier)),
          hitFlashRemaining: 0,
          hp: Math.max(1, Math.round(master.maxHp * hpMultiplier)),
          id: `${master.id}_${slotIndex + 1}_${enemySequence}`,
          isAlive: true,
          lastHitAt: 0,
          maxHp: Math.max(1, Math.round(master.maxHp * hpMultiplier)),
          radius: master.radius,
          respawnAt: 0,
          type: master.id,
          view: createEnemyView(master),
          x: position.x,
          y: position.y,
        };
      };

      const syncEnemiesToStageConfig = () => {
        if (useGameStore.getState().pendingStageClear) {
          return;
        }

        const stage = getStageById(useGameStore.getState().currentStageId) ?? getStageById(initialStageId);
        const stageConfig = stage ? getStageEnemyConfig(stage) : null;
        const maxActiveEnemies = Math.max(1, Math.floor(stageConfig?.maxActiveEnemies ?? 1));
        const enemyTypes = stageConfig?.enemyTypes.length ? stageConfig.enemyTypes : [defaultEnemyTypeId];

        while (enemies.length > maxActiveEnemies) {
          const enemy = enemies.pop();
          if (enemy) {
            destroyEnemyView(enemy);
          }
        }

        while (enemies.length < maxActiveEnemies) {
          const enemyType = enemyTypes[enemies.length % enemyTypes.length] ?? defaultEnemyTypeId;
          enemySequence += 1;
          enemies.push(createMemoryBugEnemy(enemies.length, enemyType));
        }
      };

      const isTapInputDebugEnabled = () => {
        if (!import.meta.env.DEV || typeof window === 'undefined') {
          return false;
        }

        return new URLSearchParams(window.location.search).has('debugTapInput');
      };

      const logTapInputDebug = (message: string, details?: Record<string, unknown>) => {
        if (!isTapInputDebugEnabled()) {
          return;
        }

        console.debug(`[tap-input] ${message}`, details ?? {});
      };

      const applyMemorySlimeTexture = (texture: Texture) => {
        memorySlimeTexture = texture;
        isMemorySlimeTextureReady = true;
        for (const runtime of activeMuses.values()) {
          runtime.slimeSprite.texture = texture;
          runtime.slimeSprite.visible = true;
          runtime.fallbackIcon.visible = false;
        }
      };

      const loadMemorySlimeTexture = async () => {
        try {
          applyMemorySlimeTexture(await Assets.load<Texture>(memorySlimeAssetPath));
        } catch {
          warnAssetFallbackOnce(
            'monster-icon:memory_slime',
            `Monster asset missing at ${memorySlimeAssetPath}; using Memory Slime fallback asset.`,
          );

          try {
            applyMemorySlimeTexture(await Assets.load<Texture>(memorySlimeFallbackAssetPath));
          } catch {
            isMemorySlimeTextureReady = false;
            warnAssetFallbackOnce(
              'monster-icon:memory_slime:fallback',
              `Monster fallback asset missing at ${memorySlimeFallbackAssetPath}; using circle fallback.`,
            );
          }
        }
      };

      const createMemorySlimeVisual = () => {
        const icon = new Container();
        const fallbackIcon = new Graphics();
        const slimeSprite = new Sprite(memorySlimeTexture ?? Texture.EMPTY);
        slimeSprite.anchor.set(0.5);
        slimeSprite.visible = isMemorySlimeTextureReady;
        fallbackIcon.visible = !isMemorySlimeTextureReady;
        icon.addChild(fallbackIcon, slimeSprite);
        return { fallbackIcon, icon, slimeSprite };
      };

      const getMuseIconAsset = (muse: Muse) =>
        getEquippedSkinForMuse(muse.id, useGameStore.getState().equippedSkinByMuseId)?.iconAsset ??
        muse.iconAsset;

      const getMusePalette = (muse: Muse) => {
        const iconAsset = getMuseIconAsset(muse);
        const palette = museColors[iconAsset];

        if (!palette) {
          warnAssetFallbackOnce(
            `muse-icon:${iconAsset}`,
            `Muse icon palette missing for ${iconAsset}; using Lumi fallback palette.`,
          );
          return museColors['lumi-orchid'];
        }

        return palette;
      };

      const publishDebugCollisionStatus = (eventLabel?: string) => {
        if (!import.meta.env.DEV) {
          return;
        }

        const { isFocusMode, wallpaperMode } = useAppStore.getState();
        if (isFocusMode || wallpaperMode !== 'off') {
          return;
        }

        if (eventLabel) {
          debugLastEvent = eventLabel;
          debugLastEventAt = Date.now();
        }

        window.dispatchEvent(
          new CustomEvent('desktop-muse-idle:debug-collision-status', {
            detail: {
              activeRuntimeIds: Array.from(activeMuses.keys()),
              cloneCount: Array.from(activeMuses.values()).filter((runtime) => runtime.isClone)
                .length,
              currentWallpaperFps,
              lastEvent: debugLastEvent,
              lastEventAt: debugLastEventAt,
              lastUpdateDeltaMs,
              measuredUpdatesPerSecond,
              updateIntervalMs,
            },
          }),
        );
      };

      const getTapDirectionChangeDegrees = (motionIntensity: MotionIntensity) => {
        if (motionIntensity === 'low') {
          return museTapDirectionChangeDegreeLow;
        }

        if (motionIntensity === 'high') {
          return museTapDirectionChangeDegreeHigh;
        }

        return museTapDirectionChangeDegreeMedium;
      };

      const getWallpaperRuntimeSettings = () => {
        const { wallpaperMode, wallpaperSettings } = useAppStore.getState();
        const isWallpaperPresentation = presentationModeRef.current === 'wallpaper_stage';
        const isWallpaperMode = isWallpaperPresentation || wallpaperMode !== 'off';
        return {
          isWallpaperMode,
          isWallpaperLowEffects: isWallpaperMode && wallpaperSettings.effectsQuality === 'low',
          seVolumeScale: isWallpaperMode ? wallpaperSettings.seVolumeScale : 1,
          wallpaperFps: isWallpaperMode ? wallpaperSettings.fps : 0,
        };
      };

      const createMuseBody = (muse: Muse, index: number): ActiveMuseBody => {
        const radius = radii[muse.id] ?? 42;
        const body = createInitialBody(
          { width: app.screen.width, height: app.screen.height, inset },
          radius,
          muse.baseSpeed,
        );
        body.x = app.screen.width * (0.36 + index * 0.15);
        body.y = app.screen.height * (index % 2 === 0 ? 0.42 : 0.61);
        body.vx *= index === 1 ? -1 : 1;
        body.vy *= index === 2 ? -1 : 1;

        const visual = createMemorySlimeVisual();
        const iconHitArea = new Rectangle(-radius, -radius, radius * 2, radius * 2);
        const runtime = {
          runtimeId: muse.id,
          muse,
          monsterId: 'memory_slime' as const,
          body,
          baseRadius: radius,
          isClone: false,
          glow: new Graphics(),
          icon: visual.icon,
          iconHitArea,
          fallbackIcon: visual.fallbackIcon,
          slimeSprite: visual.slimeSprite,
          squashAxis: null,
          squashRemaining: 0,
        };
        runtime.icon.eventMode = 'static';
        runtime.icon.cursor = 'pointer';
        runtime.icon.hitArea = iconHitArea;
        museLayer.addChild(runtime.glow, runtime.icon);
        return runtime;
      };

      const removeMuseBody = (runtimeId: string, runtime: ActiveMuseBody) => {
        museLayer.removeChild(runtime.glow, runtime.icon);
        runtime.glow.destroy();
        runtime.icon.destroy();
        activeMuses.delete(runtimeId);
      };

      const syncMuseBodies = (activeMuseIds: string[]) => {
        for (const [runtimeId, runtime] of activeMuses) {
          if (!runtime.isClone && !activeMuseIds.includes(runtime.muse.id)) {
            removeMuseBody(runtimeId, runtime);
          }
        }

        activeMuseIds.forEach((museId, index) => {
          if (!activeMuses.has(museId)) {
            const muse = getMuseById(museId);
            if (muse) {
              activeMuses.set(museId, createMuseBody(muse, index));
            }
          }
        });
      };

      function rotateBodyVelocity(body: BounceBody, degrees: number) {
        const radians = (degrees * Math.PI) / 180;
        const vx = body.vx * Math.cos(radians) - body.vy * Math.sin(radians);
        const vy = body.vx * Math.sin(radians) + body.vy * Math.cos(radians);
        body.vx = vx;
        body.vy = vy;
      }

      const triggerCloneSpawnEffects = (runtime: ActiveMuseBody) => {
        const palette = getMusePalette(runtime.muse);
        const maxLife = 0.72;
        const graphic = new Graphics()
          .circle(runtime.body.x, runtime.body.y, runtime.body.radius + 18)
          .stroke({ color: palette.glow, alpha: 0.88, width: 4 })
          .circle(runtime.body.x, runtime.body.y, runtime.body.radius + 29)
          .stroke({ color: palette.outline, alpha: 0.44, width: 2 });

        for (let index = 0; index < 4; index += 1) {
          const angle = (Math.PI * 2 * index) / 4 + Math.PI / 4;
          graphic
            .star(
              runtime.body.x + Math.cos(angle) * (runtime.body.radius + 27),
              runtime.body.y + Math.sin(angle) * (runtime.body.radius + 27),
              4,
              5,
              2.4,
            )
            .fill({ color: palette.glow, alpha: 0.9 });
        }

        tapEffectLayer.addChild(graphic);
        tapEffects.push({ graphic, life: maxLife, maxLife });
      };

      const createClone = (source: ActiveMuseBody) => {
        const runtimeId = `${source.muse.id}:clone`;
        if (activeMuses.has(runtimeId)) {
          return;
        }

        const baseRadius = source.baseRadius * 0.92;
        const spawnPosition = findSafeCloneSpawnPosition({
          activeMuses: Array.from(activeMuses.values(), (runtime) => runtime.body),
          bounds: { width: app.screen.width, height: app.screen.height, inset },
          cloneRadius: baseRadius,
          maxAttempts: cloneSpawnMaxAttempts,
          minDistance: cloneSpawnMinDistance,
          sourcePosition: source.body,
          wallPadding: cloneSpawnWallPadding,
        });
        const directionOffset =
          (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 22);
        const iconHitArea = new Rectangle(-baseRadius, -baseRadius, baseRadius * 2, baseRadius * 2);
        const runtime: ActiveMuseBody = {
          runtimeId,
          muse: source.muse,
          monsterId: 'memory_slime',
          body: {
            ...source.body,
            radius: baseRadius,
            x: spawnPosition.x,
            y: spawnPosition.y,
          },
          baseRadius,
          isClone: true,
          glow: new Graphics(),
          iconHitArea,
          ...createMemorySlimeVisual(),
          squashAxis: null,
          squashRemaining: 0,
        };
        runtime.icon.hitArea = iconHitArea;
        rotateBodyVelocity(runtime.body, directionOffset);
        museLayer.addChild(runtime.glow, runtime.icon);
        activeMuses.set(runtimeId, runtime);
        triggerCloneSpawnEffects(runtime);
      };

      const drawArena = () => {
        const width = app.screen.width;
        const height = app.screen.height;

        arena
          .clear()
          .roundRect(inset, inset, width - inset * 2, height - inset * 2, 22)
          .fill({ color: 0x090d24, alpha: 0.68 })
          .stroke({ color: 0x343460, alpha: 0.8, width: 2 });

        backgroundMask
          .clear()
          .roundRect(inset, inset, width - inset * 2, height - inset * 2, 22)
          .fill({ color: 0xffffff });
        backgroundImage.position.set(inset, inset);
        backgroundImage.width = Math.max(0, width - inset * 2);
        backgroundImage.height = Math.max(0, height - inset * 2);

        grid.clear();
        for (let x = 42; x < width; x += 42) {
          grid.moveTo(x, inset).lineTo(x, height - inset);
        }
        for (let y = 42; y < height; y += 42) {
          grid.moveTo(inset, y).lineTo(width - inset, y);
        }
        grid.stroke({ color: 0x44436f, alpha: 0.08, width: 1 });

      };

      const getCornerZoneRadius = () => {
        const primaryRuntime =
          Array.from(activeMuses.values()).find((runtime) => !runtime.isClone) ??
          activeMuses.values().next().value;

        return primaryRuntime?.body.radius ?? 46;
      };

      const getCornerZoneRects = () => {
        const { maxX, maxY, minX, minY } = getCollisionLimits(
          { width: app.screen.width, height: app.screen.height, inset },
          getCornerZoneRadius(),
        );
        const zone = cornerHitAssistZonePx;

        return [
          { corner: 'top_left' as const, x: minX, y: minY },
          { corner: 'top_right' as const, x: maxX - zone, y: minY },
          { corner: 'bottom_left' as const, x: minX, y: maxY - zone },
          { corner: 'bottom_right' as const, x: maxX - zone, y: maxY - zone },
        ];
      };

      const drawCornerZones = () => {
        const { settings } = useAppStore.getState();
        const shouldShow =
          settings.showCornerZones && presentationModeRef.current !== 'muse_overlay';
        cornerZoneLayer.visible = shouldShow;
        cornerZoneLayer.clear();

        if (!shouldShow) {
          return;
        }

        const zone = cornerHitAssistZonePx;
        for (const rect of getCornerZoneRects()) {
          const isHighlighted = highlightedCornerZone === rect.corner;
          const highlightAlpha = isHighlighted
            ? Math.max(0, Math.min(1, highlightedCornerZoneRemaining / 0.35))
            : 0;
          cornerZoneLayer
            .rect(rect.x, rect.y, zone, zone)
            .fill({ color: isHighlighted ? 0xffd681 : 0x33ecff, alpha: 0.18 + highlightAlpha * 0.22 })
            .stroke({
              color: isHighlighted ? 0xfff0ba : 0x7af7ff,
              alpha: 0.64 + highlightAlpha * 0.32,
              width: isHighlighted ? 3 : 2,
            })
            .circle(
              rect.x + (rect.corner.includes('right') ? zone : 0),
              rect.y + (rect.corner.includes('bottom') ? zone : 0),
              isHighlighted ? 4 : 2.5,
            )
            .fill({ color: 0xffffff, alpha: 0.72 + highlightAlpha * 0.2 });
        }
      };

      const updateBackground = async (backgroundId: string | null) => {
        const background = getBackgroundById(backgroundId);
        const requestId = ++backgroundRequestId;

        if (!background) {
          try {
            const texture = await Assets.load<Texture>(fallbackBackgroundImagePath);

            if (!isCancelled && requestId === backgroundRequestId) {
              backgroundImage.texture = texture;
              isBackgroundImageReady = true;
              backgroundImage.visible = presentationModeRef.current !== 'muse_overlay';
              drawArena();
            }
          } catch {
            if (requestId === backgroundRequestId) {
              isBackgroundImageReady = false;
              backgroundImage.visible = false;
            }
          }
          return;
        }

        const applyTexture = (texture: Texture) => {
          if (isCancelled || requestId !== backgroundRequestId) {
            return;
          }

          backgroundImage.texture = texture;
          isBackgroundImageReady = true;
          backgroundImage.visible = presentationModeRef.current !== 'muse_overlay';
          drawArena();
        };

        try {
          applyTexture(await Assets.load<Texture>(background.imagePath));
        } catch {
          warnAssetFallbackOnce(
            `pixi-background:${background.id}`,
            `Background asset missing for ${background.id}; using fallback backdrop.`,
          );

          try {
            applyTexture(await Assets.load<Texture>(fallbackBackgroundImagePath));
          } catch {
            if (requestId === backgroundRequestId) {
              isBackgroundImageReady = false;
              backgroundImage.visible = false;
            }
          }
        }
      };

      const drawMuses = (pulseTime = 0) => {
        bumperNotice.visible = false;
        for (const runtime of activeMuses.values()) {
          const { body, muse, icon, iconHitArea, glow, fallbackIcon, slimeSprite } = runtime;
          const palette = getMusePalette(muse);
          const scale = body.radius / 46;
          const isVegaBumperActive =
            muse.id === 'vega' &&
            !runtime.isClone &&
            isSkillActive(useGameStore.getState().skillStates, muse.id);
          const glowRadius = body.radius + 7 + Math.sin(pulseTime * 2.3) * 4;
          const glowAlpha = 0.15 + (Math.sin(pulseTime * 2.3) + 1) * 0.06;

          glow
            .clear()
            .circle(body.x, body.y, glowRadius)
            .stroke({ color: palette.glow, alpha: glowAlpha, width: 3 });
          if (isVegaBumperActive) {
            const bumperRadius = body.radius * 1.25 + Math.sin(pulseTime * 5.2) * 5;
            glow
              .circle(body.x, body.y, bumperRadius)
              .stroke({ color: 0xffd681, alpha: 0.72, width: 5 })
              .circle(body.x, body.y, bumperRadius + 11)
              .stroke({ color: palette.glow, alpha: 0.3, width: 2 });
            bumperNotice.position.set(body.x, body.y - bumperRadius - 26);
            bumperNotice.visible = true;
            bumperNotice.alpha = 0.74 + Math.sin(pulseTime * 5.2) * 0.16;
          }
          icon.position.set(body.x, body.y);
          iconHitArea.x = -body.radius;
          iconHitArea.y = -body.radius;
          iconHitArea.width = body.radius * 2;
          iconHitArea.height = body.radius * 2;
          const squashProgress =
            runtime.squashRemaining > 0 ? Math.min(1, runtime.squashRemaining / 0.16) : 0;
          const squashEase = Math.sin(squashProgress * Math.PI * 0.5);
          const cornerPop = runtime.squashAxis === 'corner' ? 1 + 0.2 * squashEase : 1;
          const squashX =
            runtime.squashAxis === 'x'
              ? 0.82 + 0.18 * (1 - squashEase)
              : runtime.squashAxis === 'y'
                ? 1.16 - 0.16 * (1 - squashEase)
                : cornerPop;
          const squashY =
            runtime.squashAxis === 'y'
              ? 0.82 + 0.18 * (1 - squashEase)
              : runtime.squashAxis === 'x'
                ? 1.16 - 0.16 * (1 - squashEase)
                : cornerPop;
          icon.scale.set(squashX, squashY);
          fallbackIcon
            .clear()
            .circle(0, 0, body.radius)
            .fill({ color: palette.fill })
            .stroke({
              color: isVegaBumperActive ? 0xffd681 : palette.outline,
              alpha: isVegaBumperActive ? 0.94 : 0.76,
              width: isVegaBumperActive ? 4 : 2,
            })
            .circle(0, -8 * scale, 17 * scale)
            .fill({ color: palette.figure, alpha: 0.84 })
            .roundRect(-24 * scale, 12 * scale, 48 * scale, 21 * scale, 10 * scale)
            .fill({ color: palette.figure, alpha: 0.84 });
          if (isMemorySlimeTextureReady) {
            const textureSize = Math.max(slimeSprite.texture.width, slimeSprite.texture.height, 1);
            const targetSize = body.radius * 2.35;
            const spriteScale = targetSize / textureSize;
            slimeSprite.scale.set(spriteScale);
            slimeSprite.visible = true;
            fallbackIcon.visible = false;
          } else {
            slimeSprite.visible = false;
            fallbackIcon.visible = true;
          }
          glow.alpha = runtime.isClone ? 0.5 : 1;
          icon.alpha = runtime.isClone ? 0.58 : 1;
        }
      };

      const drawEnemy = (enemy: MemoryBugEnemy, pulseTime = 0) => {
        const shouldShowEnemy =
          presentationModeRef.current !== 'muse_overlay' && enemy.isAlive;
        enemy.view.body.visible = shouldShowEnemy;
        enemy.view.hpBack.visible = shouldShowEnemy;
        enemy.view.hpFill.visible = shouldShowEnemy;
        enemy.view.label.visible = shouldShowEnemy;

        if (!shouldShowEnemy) {
          return;
        }

        const hpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
        const pulse = 1 + Math.sin(pulseTime * 4.1) * 0.035;
        const hitFlash = Math.max(0, Math.min(1, enemy.hitFlashRemaining / 0.16));
        const bugRadius = enemy.radius * (pulse + hitFlash * 0.08);
        const bodyColor = hitFlash > 0 ? 0xff6bcb : 0x2a102f;
        const coreColor = hitFlash > 0 ? 0xffd1f2 : 0x8d3a9f;

        enemy.view.body
          .clear()
          .circle(enemy.x, enemy.y, bugRadius + 8)
          .fill({ color: 0x66164e, alpha: 0.22 + hitFlash * 0.22 })
          .circle(enemy.x, enemy.y, bugRadius)
          .fill({ color: bodyColor, alpha: 0.95 })
          .stroke({ color: 0xd85cff, alpha: 0.74, width: 3 })
          .circle(enemy.x - bugRadius * 0.32, enemy.y - bugRadius * 0.14, bugRadius * 0.17)
          .fill({ color: coreColor, alpha: 0.9 })
          .circle(enemy.x + bugRadius * 0.28, enemy.y - bugRadius * 0.11, bugRadius * 0.14)
          .fill({ color: coreColor, alpha: 0.78 });

        for (let index = 0; index < 6; index += 1) {
          const angle = (Math.PI * 2 * index) / 6 + pulseTime * 0.5;
          const legX = enemy.x + Math.cos(angle) * bugRadius * 0.82;
          const legY = enemy.y + Math.sin(angle) * bugRadius * 0.82;
          enemy.view.body
            .moveTo(legX, legY)
            .lineTo(
              enemy.x + Math.cos(angle) * (bugRadius + 8),
              enemy.y + Math.sin(angle) * (bugRadius + 8),
            );
        }
        enemy.view.body.stroke({ color: 0x1a071e, alpha: 0.9, width: 2 });

        const barWidth = 74;
        const barHeight = 8;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - enemy.radius - 24;
        enemy.view.hpBack
          .clear()
          .roundRect(barX, barY, barWidth, barHeight, 4)
          .fill({ color: 0x120a1e, alpha: 0.86 })
          .stroke({ color: 0x5d2f74, alpha: 0.82, width: 1 });
        enemy.view.hpFill
          .clear()
          .roundRect(barX + 1, barY + 1, Math.max(0, (barWidth - 2) * hpRatio), barHeight - 2, 3)
          .fill({ color: hpRatio > 0.35 ? 0xff5ca8 : 0xffd681, alpha: 0.94 });
        enemy.view.label.position.set(enemy.x, barY - 10);
      };

      const drawEnemies = (pulseTime = 0) => {
        for (const enemy of enemies) {
          drawEnemy(enemy, pulseTime);
        }
      };

      const triggerMemoryBugDamageText = (enemy: MemoryBugEnemy, damage: number) => {
        const maxLife = 0.52;
        const text = new Text({
          text: `-${damage}`,
          style: {
            fill: 0xff86c8,
            fontFamily: 'Arial, sans-serif',
            fontSize: 15,
            fontWeight: 'bold',
            stroke: { color: 0x17071d, width: 4 },
          },
        });
        text.anchor.set(0.5);
        text.position.set(enemy.x, enemy.y - enemy.radius - 5);
        cornerTextLayer.addChild(text);
        floatingTexts.push({ life: maxLife, maxLife, text, vy: -28 });
      };

      const drawMemoryDrop = (drop: MemoryDrop) => {
        const isCollecting = drop.state === 'collecting';
        const isMouseCollect = drop.collectSource === 'mouse';
        const settledGlowAlpha = drop.state === 'settled' ? 0.38 : 0.54;
        const glowAlpha = isCollecting ? (isMouseCollect ? 0.78 : 0.58) : settledGlowAlpha;
        const dropScale = isCollecting ? (isMouseCollect ? 1.18 : 1.08) : 1;
        drop.graphic
          .clear()
          .circle(0, 0, drop.radius * dropScale + 5)
          .fill({ color: 0x33ecff, alpha: glowAlpha * 0.32 })
          .roundRect(
            -drop.radius * dropScale,
            -drop.radius * dropScale,
            drop.radius * 2 * dropScale,
            drop.radius * 2 * dropScale,
            3,
          )
          .fill({ color: isCollecting ? 0xd9ffff : 0x7af7ff, alpha: 0.92 })
          .stroke({ color: 0xd9ffff, alpha: 0.82, width: 1 })
          .circle(-drop.radius * 0.28, -drop.radius * 0.3, drop.radius * 0.28)
          .fill({ color: 0xffffff, alpha: 0.62 });
        drop.graphic.position.set(drop.x, drop.y);
      };

      const removeMemoryDropAt = (index: number) => {
        const [drop] = memoryDrops.splice(index, 1);
        if (!drop) {
          return;
        }

        memoryDropLayer.removeChild(drop.graphic);
        drop.graphic.destroy();
      };

      const trimMemoryDrops = () => {
        while (memoryDrops.length > memoryBugDropMaxVisible) {
          const settledIndex = memoryDrops.findIndex((drop) => drop.state === 'settled');
          removeMemoryDropAt(settledIndex >= 0 ? settledIndex : 0);
        }
      };

      const getMemoryDropFloorY = () => {
        const bottomUiReserve = 34;
        return Math.max(
          inset + 140,
          app.screen.height - bottomUiReserve - 18,
        );
      };

      const getCanvasPointFromClient = (clientX: number, clientY: number) => {
        const bounds = host.getBoundingClientRect();
        return {
          x: (clientX - bounds.left) * (app.screen.width / Math.max(1, bounds.width)),
          y: (clientY - bounds.top) * (app.screen.height / Math.max(1, bounds.height)),
        };
      };

      const getMemoryCounterTargetPosition = () => {
        const counter = document.querySelector('[data-memory-counter="true"]');
        if (!counter) {
          return { x: app.screen.width * 0.3, y: 24 };
        }

        const counterBounds = counter.getBoundingClientRect();
        const target = getCanvasPointFromClient(
          counterBounds.left + counterBounds.width / 2,
          counterBounds.top + counterBounds.height / 2,
        );

        return {
          x: Math.max(18, Math.min(app.screen.width - 18, target.x)),
          y: Math.max(18, Math.min(app.screen.height - 18, target.y)),
        };
      };

      const triggerMemoryDropCollectStartEffect = (drop: MemoryDrop) => {
        const isMouseCollect = drop.collectSource === 'mouse';
        const sparkle = new Graphics()
          .circle(0, 0, drop.radius + (isMouseCollect ? 7 : 4))
          .stroke({ color: 0xd9ffff, alpha: isMouseCollect ? 0.72 : 0.42, width: 2 })
          .circle(0, 0, isMouseCollect ? 2.5 : 1.8)
          .fill({ color: 0xffffff, alpha: isMouseCollect ? 0.72 : 0.5 });
        sparkle.position.set(drop.x, drop.y);
        tapEffectLayer.addChild(sparkle);
        tapEffects.push({
          graphic: sparkle,
          life: isMouseCollect ? 0.28 : 0.2,
          maxLife: isMouseCollect ? 0.28 : 0.2,
        });
        // Future hook: play MemoryDrop collect SE here.
      };

      const triggerMemoryDropArrivalEffect = (drop: MemoryDrop) => {
        triggerFloatingMemoryText(drop.x, drop.y, drop.value);
        window.dispatchEvent(new Event('desktop-muse:memory-drop-collected'));
      };

      const startCollectMemoryDrop = (drop: MemoryDrop, source: 'mouse' | 'muse') => {
        if (drop.state === 'collecting') {
          return;
        }

        const now = Date.now();
        if (now < drop.canCollectAt) {
          return;
        }

        const target = getMemoryCounterTargetPosition();
        drop.collectSource = source;
        drop.collectSpeed =
          memoryBugDropCollectSpeed *
          (source === 'mouse' ? memoryBugDropCollectMouseSpeedMultiplier : 1);
        drop.collectStartedAt = now;
        drop.collectTargetX = target.x;
        drop.collectTargetY = target.y;
        drop.state = 'collecting';
        drop.vx = 0;
        drop.vy = 0;
        triggerMemoryDropCollectStartEffect(drop);
      };

      const checkMouseMemoryDropCollection = (pointerX: number, pointerY: number) => {
        if (document.querySelector('[aria-modal="true"]')) {
          return false;
        }

        let didCollect = false;
        for (const drop of memoryDrops) {
          if (drop.state === 'collecting') {
            continue;
          }

          if (Date.now() < drop.canCollectAt) {
            continue;
          }

          const distance = Math.hypot(drop.x - pointerX, drop.y - pointerY);
          if (distance <= drop.radius + memoryBugDropCollectTouchRadius) {
            startCollectMemoryDrop(drop, 'mouse');
            didCollect = true;
          }
        }

        return didCollect;
      };

      const checkMuseMemoryDropCollection = (
        museX: number,
        museY: number,
        museRadius: number,
      ) => {
        const now = Date.now();
        for (const drop of memoryDrops) {
          if (drop.state === 'collecting' || now < drop.canCollectAt) {
            continue;
          }

          const distance = Math.hypot(drop.x - museX, drop.y - museY);
          if (distance <= museRadius + drop.radius + memoryBugDropMuseCollectPadding) {
            startCollectMemoryDrop(drop, 'muse');
          }
        }
      };

      const spawnMemoryDropsFromEnemy = (enemy: MemoryBugEnemy) => {
        const now = Date.now();
        const randomDropCount =
          memoryBugDropCountMin +
          Math.floor(Math.random() * (memoryBugDropCountMax - memoryBugDropCountMin + 1));
        const dropCount = Math.max(1, Math.round((randomDropCount + enemy.dropAmount) / 2));

        for (let index = 0; index < dropCount; index += 1) {
          const radius = 4 + Math.random() * 3;
          const angle = -Math.PI * (0.18 + Math.random() * 0.64);
          const speed = 95 + Math.random() * 145;
          const sideDrift = (Math.random() * 2 - 1) * 95;
          const graphic = new Graphics();
          const drop: MemoryDrop = {
            canCollectAt: now + memoryBugDropCollectDisableMs,
            collectSource: null,
            collectSpeed: memoryBugDropCollectSpeed,
            collectStartedAt: null,
            collectTargetX: null,
            collectTargetY: null,
            createdAt: now,
            graphic,
            id: `memory_drop_${now}_${memoryDropSequence}`,
            radius,
            rotationSpeed: (Math.random() * 2 - 1) * 3.2,
            state: 'falling',
            value: memoryBugDropValue,
            vx: Math.cos(angle) * speed + sideDrift,
            vy: Math.sin(angle) * speed - 40,
            x: enemy.x + (Math.random() * 2 - 1) * enemy.radius * 0.35,
            y: enemy.y + (Math.random() * 2 - 1) * enemy.radius * 0.25,
          };
          memoryDropSequence += 1;
          drawMemoryDrop(drop);
          memoryDropLayer.addChild(graphic);
          memoryDrops.push(drop);
        }

        trimMemoryDrops();
      };

      const updateMemoryDrops = (deltaSeconds: number) => {
        const floorY = getMemoryDropFloorY();
        const gravity = 740;
        const horizontalDrag = Math.max(0, 1 - deltaSeconds * 1.8);
        const minX = inset + 18;
        const maxX = app.screen.width - inset - 18;

        for (let index = memoryDrops.length - 1; index >= 0; index -= 1) {
          const drop = memoryDrops[index];
          if (drop.state === 'falling') {
            drop.vy += gravity * deltaSeconds;
            drop.vx *= horizontalDrag;
            drop.x += drop.vx * deltaSeconds;
            drop.y += drop.vy * deltaSeconds;

            if (drop.x < minX || drop.x > maxX) {
              drop.x = Math.max(minX, Math.min(maxX, drop.x));
              drop.vx *= -0.34;
            }

            if (drop.y >= floorY - drop.radius) {
              drop.y = floorY - drop.radius;
              drop.vx = 0;
              drop.vy = 0;
              drop.state = 'settled';
            }
          } else if (
            drop.state === 'collecting' &&
            drop.collectTargetX !== null &&
            drop.collectTargetY !== null
          ) {
            const dx = drop.collectTargetX - drop.x;
            const dy = drop.collectTargetY - drop.y;
            const distance = Math.hypot(dx, dy);

            if (distance <= memoryBugDropCollectArrivalRadius) {
              useGameStore.getState().addMemory(drop.value);
              triggerMemoryDropArrivalEffect(drop);
              removeMemoryDropAt(index);
              continue;
            }

            const progressBoost = Math.min(1.9, 1 + ((Date.now() - (drop.collectStartedAt ?? Date.now())) / 620));
            const stepDistance = Math.min(
              distance,
              drop.collectSpeed * deltaSeconds * progressBoost,
            );
            drop.x += (dx / Math.max(1, distance)) * stepDistance;
            drop.y += (dy / Math.max(1, distance)) * stepDistance;
            drop.rotationSpeed *= 1.03;
          }

          drop.graphic.rotation += drop.rotationSpeed * deltaSeconds;
          drawMemoryDrop(drop);
        }
      };

      const onEnemyDefeated = (enemy: MemoryBugEnemy) => {
        spawnMemoryDropsFromEnemy(enemy);
        // TODO: Convert old settled drops into bundled Memory if drop merging is added.
      };

      const triggerMemoryBugDefeatEffects = (enemy: MemoryBugEnemy) => {
        const particleCount = 10;
        for (let index = 0; index < particleCount; index += 1) {
          const angle = (Math.PI * 2 * index) / particleCount + Math.random() * 0.2;
          const speed = 62 + Math.random() * 70;
          const particle = new Graphics()
            .circle(0, 0, 3 + Math.random() * 2)
            .fill({ color: index % 2 === 0 ? 0xff5ca8 : 0x8cdcff, alpha: 0.95 });
          particle.position.set(enemy.x, enemy.y);
          particleLayer.addChild(particle);
          particles.push({
            graphic: particle,
            life: 0.54,
            maxLife: 0.54,
            rotationSpeed: index % 2 === 0 ? 2.5 : -2.5,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
          });
        }
      };

      const defeatMemoryBug = (enemy: MemoryBugEnemy, now: number) => {
        enemy.hp = 0;
        enemy.isAlive = false;
        enemy.defeatedAt = now;
        enemy.respawnAt = now + memoryBugRespawnMs;
        triggerMemoryBugDefeatEffects(enemy);
        onEnemyDefeated(enemy);
        useGameStore.getState().recordEnemyDefeat();
      };

      const updateEnemies = (deltaSeconds: number, now: number) => {
        const { pendingStageClear } = useGameStore.getState();
        if (pendingStageClear) {
          clearEnemies();
          return;
        }

        syncEnemiesToStageConfig();
        for (let index = 0; index < enemies.length; index += 1) {
          const enemy = enemies[index];
          if (enemy.hitFlashRemaining > 0) {
            enemy.hitFlashRemaining = Math.max(0, enemy.hitFlashRemaining - deltaSeconds);
          }

          if (!enemy.isAlive && now >= enemy.respawnAt) {
            destroyEnemyView(enemy);
            const nextEnemy = createMemoryBugEnemy(index, enemy.type);
            enemies[index] = nextEnemy;
          }
        }
      };

      const checkMuseEnemyCollision = (runtime: ActiveMuseBody, now: number) => {
        for (const enemy of enemies) {
          const master = getEnemyMasterById(enemy.type) ?? getEnemyMasterById(defaultEnemyTypeId);
          const hitCooldownMs = master?.hitCooldownMs ?? 250;
          if (!enemy.isAlive || now - enemy.lastHitAt < hitCooldownMs) {
            continue;
          }

          const distance = Math.hypot(runtime.body.x - enemy.x, runtime.body.y - enemy.y);
          if (distance > runtime.body.radius + enemy.radius) {
            continue;
          }

          const damage = 1;
          const nextHp = Math.max(0, enemy.hp - damage);
          enemy.hitFlashRemaining = 0.16;
          enemy.hp = nextHp;
          enemy.lastHitAt = now;
          triggerMemoryBugDamageText(enemy, damage);

          if (nextHp <= 0) {
            defeatMemoryBug(enemy, now);
          }
        }
      };

      const triggerSlimeImpact = (
        runtime: ActiveMuseBody,
        collision: { hitXWall: boolean; hitYWall: boolean; isCornerHit: boolean },
      ) => {
        runtime.squashAxis = collision.isCornerHit
          ? 'corner'
          : collision.hitXWall
            ? 'x'
            : collision.hitYWall
              ? 'y'
              : null;
        runtime.squashRemaining = collision.isCornerHit ? 0.24 : 0.16;
      };

      const triggerSlimeCornerBurst = (runtime: ActiveMuseBody) => {
        const maxLife = 0.46;
        const graphic = new Graphics()
          .circle(runtime.body.x, runtime.body.y, runtime.body.radius + 14)
          .stroke({ color: 0x7dffff, alpha: 0.9, width: 4 })
          .circle(runtime.body.x, runtime.body.y, runtime.body.radius + 28)
          .stroke({ color: 0xffd681, alpha: 0.58, width: 2 });

        for (let index = 0; index < 8; index += 1) {
          const angle = (Math.PI * 2 * index) / 8;
          graphic
            .circle(
              runtime.body.x + Math.cos(angle) * (runtime.body.radius + 23),
              runtime.body.y + Math.sin(angle) * (runtime.body.radius + 23),
              3.4,
            )
            .fill({ color: index % 2 === 0 ? 0x7dffff : 0xffd681, alpha: 0.92 });
        }

        tapEffectLayer.addChild(graphic);
        tapEffects.push({ graphic, life: maxLife, maxLife });
      };

      const triggerCornerEffects = (
        reward: number,
        hitBody: BounceBody,
        corner: CornerHitPosition,
        kind: CornerEffectKind,
        isClone = false,
      ) => {
        const { settings } = useAppStore.getState();
        const { isWallpaperLowEffects, seVolumeScale } = getWallpaperRuntimeSettings();
        const effectiveEffectsQuality =
          isWallpaperLowEffects || settings.motionIntensity === 'low'
            ? 'low'
            : settings.effectsQuality;
        const baseParticleCount = {
          low: 6,
          medium: 12,
          high: 18,
        }[effectiveEffectsQuality];
        const wallpaperParticleMultiplier = isWallpaperLowEffects
          ? wallpaperLowEffectParticleMultiplier
          : 1;
        const particleCount = Math.max(
          2,
          Math.floor(
            baseParticleCount *
              (settings.motionIntensity === 'low' ? 0.5 : 1) *
              (isClone ? 0.55 : 1) *
              wallpaperParticleMultiplier,
          ),
        );

        effectManager.triggerCornerHitEffect({
          corner,
          kind,
          motionIntensity: settings.motionIntensity,
          reward,
          stageHeight: app.screen.height,
          stageInset: inset,
          stageWidth: app.screen.width,
          x: hitBody.x,
          y: hitBody.y,
        });

        for (let index = 0; index < particleCount; index += 1) {
          const angle = (Math.PI * 2 * index) / particleCount + Math.random() * 0.18;
          const speed = 92 + Math.random() * 48;
          const particle = new Graphics()
            .star(0, 0, 5, 7, 3.4)
            .fill({ color: index % 2 === 0 ? 0xffd681 : 0xc999ff });
          particle.position.set(hitBody.x, hitBody.y);
          particleLayer.addChild(particle);
          particles.push({
            graphic: particle,
            life: 0.62,
            maxLife: 0.62,
            rotationSpeed: index % 2 === 0 ? 3 : -3,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
          });
        }

        playCornerHitSound(settings.seVolume * seVolumeScale);
      };

      const triggerNearCornerEffects = (hitBody: BounceBody, corner: CornerHitPosition) => {
        const { motionIntensity } = useAppStore.getState().settings;

        effectManager.triggerNearCornerEffect({
          corner,
          motionIntensity,
          stageHeight: app.screen.height,
          stageInset: inset,
          stageWidth: app.screen.width,
          x: hitBody.x,
          y: hitBody.y,
        });
      };

      const triggerSkillNotice = (muse: Muse) => {
        skillNotice.text = `${muse.name}: ${muse.skill.name}!`;
        skillNotice.position.set(app.screen.width / 2, app.screen.height * 0.29);
        skillNotice.visible = true;
        skillNotice.alpha = 1;
        skillNoticeTime = 1.35;
      };

      const triggerTapEffects = (runtime: ActiveMuseBody, subtitle: string) => {
        const palette = getMusePalette(runtime.muse);
        const maxLife = museTapEffectDurationMs / 1_000;
        const graphic = new Graphics()
          .circle(runtime.body.x, runtime.body.y, runtime.body.radius + 14)
          .stroke({ color: palette.glow, alpha: 0.94, width: 3 });

        for (let index = 0; index < 6; index += 1) {
          const angle = (Math.PI * 2 * index) / 6;
          graphic
            .star(
              runtime.body.x + Math.cos(angle) * (runtime.body.radius + 22),
              runtime.body.y + Math.sin(angle) * (runtime.body.radius + 22),
              5,
              5,
              2.3,
            )
            .fill({ color: index % 2 === 0 ? palette.glow : 0xffd681, alpha: 0.92 });
        }

        tapEffectLayer.addChild(graphic);
        tapEffects.push({ graphic, life: maxLife, maxLife });
        tapNotice.text = `SPEED +\n${subtitle}`;
        tapNotice.position.set(runtime.body.x, runtime.body.y - runtime.body.radius - 39);
        tapNotice.visible = true;
        tapNotice.alpha = 1;
        tapNoticeTime = maxLife;
      };

      const triggerFloatingMemoryText = (x: number, y: number, reward: number) => {
        const maxLife = 0.72;
        const text = new Text({
          text: `+${reward.toLocaleString()} Memory`,
          style: {
            fill: 0x8cdcff,
            fontFamily: 'Arial, sans-serif',
            fontSize: 15,
            fontWeight: 'bold',
            stroke: { color: 0x142044, width: 4 },
          },
        });
        text.anchor.set(0.5);
        text.position.set(x, y);
        cornerTextLayer.addChild(text);
        floatingTexts.push({ life: maxLife, maxLife, text, vy: -34 });

        const sparkle = new Graphics()
          .circle(x, y, 8)
          .stroke({ color: 0x8cdcff, alpha: 0.82, width: 2 })
          .circle(x, y, 3)
          .fill({ color: 0xffd681, alpha: 0.85 });
        tapEffectLayer.addChild(sparkle);
        tapEffects.push({ graphic: sparkle, life: 0.42, maxLife: 0.42 });
      };

      handleMuseTap = (runtime) => {
        if (runtime.isClone) {
          return;
        }

        const { isClickThroughEnabled, settings, wallpaperMode } = useAppStore.getState();
        if (wallpaperMode === 'muse_overlay' && isClickThroughEnabled) {
          return;
        }

        const { seVolumeScale } = getWallpaperRuntimeSettings();
        const { activateMuseTap, museTapStates } = useGameStore.getState();
        const previousVoiceId = museTapStates[runtime.muse.id]?.lastTapVoiceId;
        const voiceOptions = runtime.muse.tapVoices.filter(
          (tapVoice) => tapVoice.id !== previousVoiceId,
        );
        const candidateVoices = voiceOptions.length ? voiceOptions : runtime.muse.tapVoices;
        const tapVoice = candidateVoices[Math.floor(Math.random() * candidateVoices.length)];

        if (!tapVoice || !activateMuseTap(runtime.muse.id, tapVoice.id, Date.now())) {
          return;
        }

        const directionDegrees =
          (Math.random() * 2 - 1) * getTapDirectionChangeDegrees(settings.motionIntensity);
        rotateBodyVelocity(runtime.body, directionDegrees);
        runtime.squashAxis = 'corner';
        runtime.squashRemaining = 0.22;
        triggerTapEffects(
          runtime,
          settings.language === 'ja' ? tapVoice.subtitleJa : tapVoice.subtitleEn,
        );
        playMuseTapVoice(tapVoice, settings.seVolume * seVolumeScale);
      };

      const isGameplayClickBlocked = (event: PointerEvent) => {
        const target = event.target;
        if (!(target instanceof Element)) {
          logTapInputDebug('ignored because target is not an Element');
          return true;
        }

        if (document.querySelector('[aria-modal="true"]')) {
          logTapInputDebug('ignored because modal open');
          return true;
        }

        if (
          target.closest(
            'button, input, select, textarea, a, [role="button"], .window-titlebar, .modal-close',
          )
        ) {
          logTapInputDebug('ignored because UI target', {
            tagName: target.tagName,
            className: target instanceof HTMLElement ? target.className : '',
          });
          return true;
        }

        return false;
      };

      const getStagePointFromPointer = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          return null;
        }

        return {
          x: ((event.clientX - rect.left) / rect.width) * app.screen.width,
          y: ((event.clientY - rect.top) / rect.height) * app.screen.height,
        };
      };

      const findTappedMuse = (x: number, y: number) => {
        for (const runtime of activeMuses.values()) {
          if (runtime.isClone) {
            continue;
          }

          const distance = Math.hypot(runtime.body.x - x, runtime.body.y - y);
          if (distance <= runtime.body.radius * 1.18) {
            return runtime;
          }
        }

        return null;
      };

      const grantBackgroundTapMemory = (x: number, y: number, now: number) => {
        if (presentationModeRef.current !== 'normal') {
          logTapInputDebug('ignored because presentation mode', {
            presentationMode: presentationModeRef.current,
          });
          return;
        }

        const { wallpaperMode } = useAppStore.getState();
        if (wallpaperMode !== 'off') {
          logTapInputDebug('ignored because wallpaper mode', { wallpaperMode });
          return;
        }

        const decision = decideTapInput({
          hitCharacter: false,
          lastBackgroundTapAt,
          now,
        });

        if (!decision.shouldGrantBackgroundReward) {
          logTapInputDebug('ignored because background cooldown', {
            lastBackgroundTapAt,
            now,
          });
          return;
        }

        const { addMemory, characterSkillLevels, unlockedSkillNodes, upgrades } =
          useGameStore.getState();
        const { motionIntensity } = useAppStore.getState().settings;
        const reward = calculateBackgroundTapReward(
          upgrades,
          unlockedSkillNodes,
          motionIntensity,
          characterSkillLevels,
        );

        lastBackgroundTapAt = now;
        addMemory(reward);
        logTapInputDebug('background click fired', {
          reward,
          x,
          y,
        });
        triggerFloatingMemoryText(x, y, reward);
      };

      const handleHostPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || isGameplayClickBlocked(event)) {
          return;
        }

        const point = getStagePointFromPointer(event);
        if (!point) {
          logTapInputDebug('ignored because host bounds unavailable');
          return;
        }

        if (checkMouseMemoryDropCollection(point.x, point.y)) {
          return;
        }

        const tappedMuse = findTappedMuse(point.x, point.y);
        if (tappedMuse) {
          logTapInputDebug('slime click fired', {
            museId: tappedMuse.muse.id,
            x: point.x,
            y: point.y,
          });
          handleMuseTap(tappedMuse);
          return;
        }

        grantBackgroundTapMemory(point.x, point.y, Date.now());
      };

      const handleHostPointerMove = (event: PointerEvent) => {
        const point = getStagePointFromPointer(event);
        if (!point) {
          return;
        }

        checkMouseMemoryDropCollection(point.x, point.y);
      };

      const setBodySpeedToward = (
        body: BounceBody,
        directionX: number,
        directionY: number,
        minimumSpeed = 280,
      ) => {
        const currentSpeed = Math.hypot(body.vx, body.vy);
        const speed = Math.max(minimumSpeed, currentSpeed || minimumSpeed);
        const magnitude = Math.hypot(directionX, directionY) || 1;
        body.vx = (directionX / magnitude) * speed;
        body.vy = (directionY / magnitude) * speed;
      };

      const moveRuntimeNearCornerCollision = (
        runtime: ActiveMuseBody,
        corner: CornerHitPosition,
      ) => {
        const minX = inset + runtime.body.radius;
        const maxX = app.screen.width - inset - runtime.body.radius;
        const minY = inset + runtime.body.radius;
        const maxY = app.screen.height - inset - runtime.body.radius;

        if (corner === 'top_left') {
          runtime.body.x = minX + 1;
          runtime.body.y = minY + 1;
          setBodySpeedToward(runtime.body, -1, -1);
        } else if (corner === 'top_right') {
          runtime.body.x = maxX - 1;
          runtime.body.y = minY + 1;
          setBodySpeedToward(runtime.body, 1, -1);
        } else if (corner === 'bottom_left') {
          runtime.body.x = minX + 1;
          runtime.body.y = maxY - 1;
          setBodySpeedToward(runtime.body, -1, 1);
        } else {
          runtime.body.x = maxX - 1;
          runtime.body.y = maxY - 1;
          setBodySpeedToward(runtime.body, 1, 1);
        }
      };

      const moveRuntimeNearCornerMiss = (runtime: ActiveMuseBody) => {
        const minX = inset + runtime.body.radius;
        const minY = inset + runtime.body.radius;
        const { characterSkillLevels, unlockedSkillNodes } = useGameStore.getState();
        const nearDistance = calculateNearCornerDistance(
          unlockedSkillNodes,
          characterSkillLevels,
        );
        const nearMissOffset = cornerHitAssistZonePx + 8;
        const offsetY =
          nearDistance > nearMissOffset + 4
            ? Math.min(nearMissOffset, nearDistance - 4)
            : Math.max(14, Math.min(nearDistance * 0.6, nearDistance - 4));
        runtime.body.x = minX + 1;
        runtime.body.y = minY + offsetY;
        setBodySpeedToward(runtime.body, -1, 0);
      };

      if (import.meta.env.DEV) {
        const handleDebugSkill = (event: Event) => {
          const museId = (event as CustomEvent<{ museId?: string }>).detail?.museId;
          if (!museId) {
            return;
          }

          const runtime = activeMuses.get(museId);
          if (!runtime || runtime.isClone) {
            return;
          }

          useGameStore.getState().debugActivateMuseSkill(museId);
          triggerSkillNotice(runtime.muse);
          publishDebugCollisionStatus(`Skill forced: ${runtime.muse.name}`);
          if (runtime.muse.skill.type === 'clone') {
            createClone(runtime);
          }
        };

        const handleDebugTap = (event: Event) => {
          const museId = (event as CustomEvent<{ museId?: string }>).detail?.museId;
          if (!museId) {
            return;
          }

          const runtime = activeMuses.get(museId);
          if (!runtime || runtime.isClone) {
            return;
          }

          const tapVoice = runtime.muse.tapVoices[0];
          if (!tapVoice) {
            return;
          }

          const { settings } = useAppStore.getState();
          const { seVolumeScale } = getWallpaperRuntimeSettings();
          useGameStore.getState().debugActivateMuseTap(museId);
          rotateBodyVelocity(
            runtime.body,
            (Math.random() * 2 - 1) * getTapDirectionChangeDegrees(settings.motionIntensity),
          );
          triggerTapEffects(
            runtime,
            settings.language === 'ja' ? tapVoice.subtitleJa : tapVoice.subtitleEn,
          );
          playMuseTapVoice(tapVoice, settings.seVolume * seVolumeScale);
          publishDebugCollisionStatus(`Tap forced: ${runtime.muse.name}`);
        };

        const handleDebugVegaBumper = () => {
          const runtime = activeMuses.get('vega');
          if (!runtime || runtime.isClone) {
            publishDebugCollisionStatus('Vega Bumper failed: Vega not active');
            return;
          }

          useGameStore.getState().debugActivateMuseSkill('vega');
          triggerSkillNotice(runtime.muse);
          publishDebugCollisionStatus('Vega Bumper forced');
        };

        const handleDebugVegaHit = () => {
          const vegaRuntime = activeMuses.get('vega');
          const targetRuntime = Array.from(activeMuses.values()).find(
            (runtime) => runtime.runtimeId !== 'vega',
          );

          if (!vegaRuntime || !targetRuntime) {
            publishDebugCollisionStatus('Vega Hit failed: need Vega and one target');
            return;
          }

          useGameStore.getState().debugActivateMuseSkill('vega');
          targetRuntime.body.x =
            vegaRuntime.body.x + (vegaRuntime.body.radius + targetRuntime.body.radius) * 0.45;
          targetRuntime.body.y = vegaRuntime.body.y;
          setBodySpeedToward(targetRuntime.body, -1, 0);
          publishDebugCollisionStatus(`Vega Hit armed: ${targetRuntime.runtimeId}`);
        };

        const handleDebugCloneCorner = () => {
          const sourceRuntime =
            activeMuses.get('lumi') ??
            Array.from(activeMuses.values()).find((runtime) => !runtime.isClone);

          if (!sourceRuntime || sourceRuntime.isClone) {
            publishDebugCollisionStatus('Clone Corner failed: no source Muse');
            return;
          }

          useGameStore.getState().debugActivateMuseSkill(sourceRuntime.muse.id);
          if (sourceRuntime.muse.skill.type === 'clone') {
            createClone(sourceRuntime);
          }

          const cloneRuntime = activeMuses.get(`${sourceRuntime.muse.id}:clone`);
          if (!cloneRuntime) {
            publishDebugCollisionStatus('Clone Corner failed: no clone created');
            return;
          }

          moveRuntimeNearCornerCollision(cloneRuntime, 'bottom_right');
          publishDebugCollisionStatus(`Clone Corner armed: ${cloneRuntime.runtimeId}`);
        };

        const handleDebugNearCorner = () => {
          const runtime =
            Array.from(activeMuses.values()).find((candidate) => !candidate.isClone) ??
            activeMuses.values().next().value;

          if (!runtime) {
            publishDebugCollisionStatus('Near Corner failed: no active body');
            return;
          }

          moveRuntimeNearCornerMiss(runtime);
          publishDebugCollisionStatus(`Near Corner armed: ${runtime.runtimeId}`);
        };

        window.addEventListener('desktop-muse-idle:debug-skill', handleDebugSkill);
        window.addEventListener('desktop-muse-idle:debug-tap', handleDebugTap);
        window.addEventListener(
          'desktop-muse-idle:debug-vega-bumper',
          handleDebugVegaBumper,
        );
        window.addEventListener('desktop-muse-idle:debug-vega-hit', handleDebugVegaHit);
        window.addEventListener(
          'desktop-muse-idle:debug-clone-corner',
          handleDebugCloneCorner,
        );
        window.addEventListener(
          'desktop-muse-idle:debug-near-corner',
          handleDebugNearCorner,
        );
        publishDebugCollisionStatus();
        removeDebugListeners = () => {
          window.removeEventListener('desktop-muse-idle:debug-skill', handleDebugSkill);
          window.removeEventListener('desktop-muse-idle:debug-tap', handleDebugTap);
          window.removeEventListener(
            'desktop-muse-idle:debug-vega-bumper',
            handleDebugVegaBumper,
          );
          window.removeEventListener('desktop-muse-idle:debug-vega-hit', handleDebugVegaHit);
          window.removeEventListener(
            'desktop-muse-idle:debug-clone-corner',
            handleDebugCloneCorner,
          );
          window.removeEventListener(
            'desktop-muse-idle:debug-near-corner',
            handleDebugNearCorner,
          );
        };
      }

      drawArena();
      app.stage.eventMode = 'static';
      app.stage.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
      host.addEventListener('pointerdown', handleHostPointerDown);
      host.addEventListener('pointermove', handleHostPointerMove);
      removeHostPointerListener = () => {
        host.removeEventListener('pointerdown', handleHostPointerDown);
        host.removeEventListener('pointermove', handleHostPointerMove);
      };
      void updateBackground(useGameStore.getState().currentBackgroundId);
      void loadMemorySlimeTexture();
      skillNotice.position.set(app.screen.width / 2, app.screen.height * 0.29);
      syncMuseBodies(useGameStore.getState().activeMuseIds);
      syncEnemiesToStageConfig();
      drawCornerZones();
      drawEnemies();
      drawMuses();
      unsubscribeStore = useGameStore.subscribe((state, previousState) => {
        if (state.currentBackgroundId !== previousState.currentBackgroundId) {
          void updateBackground(state.currentBackgroundId);
        }
        if (state.activeMuseIds !== previousState.activeMuseIds) {
          syncMuseBodies(state.activeMuseIds);
          drawCornerZones();
          drawMuses(pulseTime);
        }
        if (state.equippedSkinByMuseId !== previousState.equippedSkinByMuseId) {
          drawMuses(pulseTime);
        }
        if (state.currentStageId !== previousState.currentStageId) {
          clearEnemies();
          syncEnemiesToStageConfig();
          drawEnemies(pulseTime);
        } else if (state.pendingStageClear !== previousState.pendingStageClear) {
          if (state.pendingStageClear) {
            clearEnemies();
          } else {
            syncEnemiesToStageConfig();
          }
          drawEnemies(pulseTime);
        }
      });

      app.ticker.add((ticker) => {
        if (document.visibilityState === 'hidden') {
          return;
        }

        const rawDeltaMs = Math.min(ticker.deltaMS, 100);
        const isMuseOverlayPresentation =
          presentationModeRef.current === 'muse_overlay';
        const {
          isWallpaperLowEffects,
          isWallpaperMode,
          wallpaperFps,
        } = getWallpaperRuntimeSettings();
        const targetTickerMaxFps = isWallpaperMode ? wallpaperFps : 0;
        if (appliedTickerMaxFps !== targetTickerMaxFps) {
          app.ticker.maxFPS = targetTickerMaxFps;
          appliedTickerMaxFps = targetTickerMaxFps;
        }
        currentWallpaperFps = isWallpaperMode ? wallpaperFps : 0;
        updateIntervalMs = isWallpaperMode ? 1_000 / wallpaperFps : 0;
        const deltaMs = rawDeltaMs;
        lastUpdateDeltaMs = deltaMs;
        updateSampleCount += 1;
        const updateSampleElapsedMs = performance.now() - updateSampleStartedAt;
        if (updateSampleElapsedMs >= 1_000) {
          measuredUpdatesPerSecond = (updateSampleCount * 1_000) / updateSampleElapsedMs;
          updateSampleCount = 0;
          updateSampleStartedAt = performance.now();
        }

        const lowEffectAlphaMultiplier = isWallpaperLowEffects
          ? wallpaperLowEffectLayerAlphaMultiplier
          : 1;
        const flashAlphaMultiplier = isWallpaperLowEffects
          ? wallpaperLowEffectFlashAlphaMultiplier
          : 1;
        arena.visible = !isMuseOverlayPresentation;
        grid.visible = !isMuseOverlayPresentation;
        backgroundImage.visible =
          !isMuseOverlayPresentation && isBackgroundImageReady;
        cornerZoneLayer.alpha =
          (isMuseOverlayPresentation ? 0 : 1) * lowEffectAlphaMultiplier;
        cornerGlowLayer.alpha =
          (isMuseOverlayPresentation ? 0.38 : 1) * lowEffectAlphaMultiplier;
        particleLayer.alpha =
          (isMuseOverlayPresentation ? 0.42 : 1) * lowEffectAlphaMultiplier;
        memoryDropLayer.alpha =
          (isMuseOverlayPresentation ? 0 : 1) * lowEffectAlphaMultiplier;
        enemyLayer.alpha =
          (isMuseOverlayPresentation ? 0 : 1) * lowEffectAlphaMultiplier;
        ringLayer.alpha =
          (isMuseOverlayPresentation ? 0.6 : 1) * lowEffectAlphaMultiplier;
        screenFlashLayer.alpha =
          (isMuseOverlayPresentation ? 0.16 : 1) * flashAlphaMultiplier;
        cornerTextLayer.alpha =
          (isMuseOverlayPresentation ? 0.26 : 1) * lowEffectAlphaMultiplier;
        skillNotice.alpha =
          (isMuseOverlayPresentation ? 0.72 : 1) * lowEffectAlphaMultiplier;
        const simulationStepCount = Math.max(1, Math.ceil(deltaMs / 20));
        const simulationDeltaMs = deltaMs / simulationStepCount;

        for (let simulationStep = 0; simulationStep < simulationStepCount; simulationStep += 1) {
        skillTickAccumulatorMs += simulationDeltaMs;
        updateEnemies(simulationDeltaMs / 1_000, Date.now());
        if (skillTickAccumulatorMs >= 100) {
          useGameStore.getState().tickSkillStates(skillTickAccumulatorMs);
          useGameStore.getState().tickMuseTapStates(Date.now());
          skillTickAccumulatorMs = 0;
        }

        const {
          upgrades,
          addMemory,
          recordCornerHit,
          recordNearCorner,
          recordWallHit,
          triggerCornerHitFlash,
          activateMuseSkill,
          skillStates,
          unlockedSkillNodes,
          characterSkillLevels,
          museTapStates,
        } = useGameStore.getState();
        const { motionIntensity } = useAppStore.getState().settings;
        const speedSkillMuse = getMuseById('astra');
        const skillSpeedMultiplier = speedSkillMuse
          ? getSkillSpeedMultiplier(speedSkillMuse, isSkillActive(skillStates, speedSkillMuse.id))
          : 1;

        for (const [runtimeId, runtime] of activeMuses) {
          if (
            runtime.isClone &&
            !isSkillActive(useGameStore.getState().skillStates, runtime.muse.id)
          ) {
            removeMuseBody(runtimeId, runtime);
            continue;
          }

          runtime.body.radius =
            runtime.baseRadius *
            getSkillScale(runtime.muse, !runtime.isClone && isSkillActive(skillStates, runtime.muse.id));
          const now = Date.now();
          const tapBoostStack = runtime.isClone
            ? 0
            : getActiveTapBoostStack(museTapStates[runtime.muse.id], now);
          const isTapBoostActive = tapBoostStack > 0;
          const result = stepBounceBody(
            runtime.body,
            { width: app.screen.width, height: app.screen.height, inset },
            (simulationDeltaMs / 1_000) *
              calculateVisualSpeedMultiplier(
                upgrades,
                skillSpeedMultiplier,
                tapBoostStack,
                motionIntensity,
                characterSkillLevels,
              ),
            {
              nearCornerDistance: calculateNearCornerDistance(
                unlockedSkillNodes,
                characterSkillLevels,
              ),
            },
          );
          runtime.body = result.body;
          checkMuseEnemyCollision(runtime, now);
          checkMuseMemoryDropCollection(runtime.body.x, runtime.body.y, runtime.body.radius);

          if (result.bounced) {
            triggerSlimeImpact(runtime, result.collision);
            const wallRewardMultiplier = getCloneWallRewardMultiplier(runtime.isClone);
            const bounceReward = Math.max(
              1,
              Math.floor(
                calculateBounceReward(
                  upgrades,
                  unlockedSkillNodes,
                  motionIntensity,
                  characterSkillLevels,
                ) *
                  runtime.muse.memoryMultiplier *
                  wallRewardMultiplier,
              ),
            );
            recordWallHit(bounceReward);

            if (result.collision.isCornerHit && result.collision.cornerId) {
              const isCornerReady = now - lastCornerHitAt >= cornerHitCooldownMs;

              if (!isCornerReady) {
                publishDebugCollisionStatus(
                  `${runtime.isClone ? 'Clone' : runtime.muse.name} Corner cooldown`,
                );
                continue;
              }

              lastCornerHitAt = now;
              const cornerRewardMultiplier = getCloneCornerRewardMultiplier(runtime.isClone);
              const cornerReward = Math.max(
                1,
                Math.floor(
                  calculateCornerReward(
                    upgrades,
                    unlockedSkillNodes,
                    motionIntensity,
                    characterSkillLevels,
                  ) *
                    runtime.muse.cornerMultiplier *
                    cornerRewardMultiplier *
                    calculateMuseTapCornerRewardMultiplier(isTapBoostActive, motionIntensity),
                ),
              );
              const cornerPosition = result.collision.cornerId;
              const cornerEffectKind: CornerEffectKind =
                unlockedSkillNodes.lucky_corner > 0 ? 'lucky_corner' : 'corner_hit';
              highlightedCornerZone = cornerPosition;
              highlightedCornerZoneRemaining = 0.35;
              recordCornerHit(cornerReward);
              triggerCornerHitFlash(cornerPosition);
              triggerSlimeCornerBurst(runtime);
              triggerCornerEffects(
                bounceReward + cornerReward,
                runtime.body,
                cornerPosition,
                cornerEffectKind,
                runtime.isClone,
              );
              publishDebugCollisionStatus(
                `${runtime.isClone ? 'Clone' : runtime.muse.name} Corner: ${cornerPosition}`,
              );
              if (!runtime.isClone) {
                if (activateMuseSkill(runtime.muse.id)) {
                  triggerSkillNotice(runtime.muse);
                  if (runtime.muse.skill.type === 'clone') {
                    createClone(runtime);
                  }
                }
              }
            } else if (
              result.collision.isNearCorner &&
              result.collision.nearCornerId
            ) {
              const nearReward = calculateNearCornerReward(bounceReward, unlockedSkillNodes);
              if (nearReward > 0) {
                addMemory(nearReward);
              }
              recordNearCorner();
              triggerNearCornerEffects(runtime.body, result.collision.nearCornerId);
              publishDebugCollisionStatus(
                `${runtime.isClone ? 'Clone' : runtime.muse.name} Near: ${result.collision.nearCornerId}`,
              );
            }
          }
        }

        const vegaRuntime = Array.from(activeMuses.values()).find(
          (runtime) =>
            runtime.muse.id === 'vega' &&
            !runtime.isClone &&
            isSkillActive(useGameStore.getState().skillStates, runtime.muse.id),
        );
        if (vegaRuntime) {
          const bounceRewardBase = calculateBounceReward(
            upgrades,
            unlockedSkillNodes,
            motionIntensity,
            characterSkillLevels,
          );
          const bumperResults = handleVegaBumperCollisions({
            bounds: { width: app.screen.width, height: app.screen.height, inset },
            lastRewardAtByPair: vegaBumperRewardAtByPair,
            now: Date.now(),
            others: Array.from(activeMuses.values(), (runtime) => ({
              body: runtime.body,
              isClone: runtime.isClone,
              museId: runtime.muse.id,
              runtimeId: runtime.runtimeId,
            })).filter((runtime) => runtime.runtimeId !== vegaRuntime.runtimeId),
            vega: {
              body: vegaRuntime.body,
              isClone: vegaRuntime.isClone,
              museId: vegaRuntime.muse.id,
              runtimeId: vegaRuntime.runtimeId,
            },
          });

          for (const bumperResult of bumperResults) {
            if (!bumperResult.canReward) {
              continue;
            }

            addMemory(calculateVegaBumperReward(bounceRewardBase, bumperResult.targetIsClone));
            effectManager.triggerVegaBumperEffect({
              motionIntensity,
              x: vegaRuntime.body.x,
              y: vegaRuntime.body.y,
            });
            publishDebugCollisionStatus(
              `Vega Bumper hit: ${bumperResult.targetRuntimeId}`,
            );
          }
        }
        }
        const deltaSeconds = deltaMs / 1_000;
        pulseTime += deltaSeconds;
        for (const runtime of activeMuses.values()) {
          if (runtime.squashRemaining > 0) {
            runtime.squashRemaining = Math.max(0, runtime.squashRemaining - deltaSeconds);
            if (runtime.squashRemaining === 0) {
              runtime.squashAxis = null;
            }
          }
        }
        if (highlightedCornerZoneRemaining > 0) {
          highlightedCornerZoneRemaining = Math.max(
            0,
            highlightedCornerZoneRemaining - deltaSeconds,
          );
          if (highlightedCornerZoneRemaining === 0) {
            highlightedCornerZone = null;
          }
        }
        effectManager.update(deltaSeconds);
        updateMemoryDrops(deltaSeconds);
        if (skillNoticeTime > 0) {
          skillNoticeTime -= deltaSeconds;
          skillNotice.alpha = Math.min(1, Math.max(0, skillNoticeTime / 0.3));
          if (skillNoticeTime <= 0) {
            skillNotice.visible = false;
          }
        }
        if (tapNoticeTime > 0) {
          tapNoticeTime -= deltaSeconds;
          tapNotice.y -= 13 * deltaSeconds;
          tapNotice.alpha = Math.max(0, tapNoticeTime / (museTapEffectDurationMs / 1_000));
          if (tapNoticeTime <= 0) {
            tapNotice.visible = false;
          }
        }
        for (let index = particles.length - 1; index >= 0; index -= 1) {
          const particle = particles[index];
          particle.life -= deltaSeconds;
          particle.graphic.x += particle.vx * deltaSeconds;
          particle.graphic.y += particle.vy * deltaSeconds;
          particle.graphic.rotation += particle.rotationSpeed * deltaSeconds;
          particle.graphic.alpha = Math.max(0, particle.life / particle.maxLife);
          particle.graphic.scale.set(0.65 + particle.graphic.alpha * 0.7);

          if (particle.life <= 0) {
            particleLayer.removeChild(particle.graphic);
            particle.graphic.destroy();
            particles.splice(index, 1);
          }
        }
        for (let index = tapEffects.length - 1; index >= 0; index -= 1) {
          const tapEffect = tapEffects[index];
          tapEffect.life -= deltaSeconds;
          tapEffect.graphic.alpha = Math.max(0, tapEffect.life / tapEffect.maxLife);

          if (tapEffect.life <= 0) {
            tapEffectLayer.removeChild(tapEffect.graphic);
            tapEffect.graphic.destroy();
            tapEffects.splice(index, 1);
          }
        }
        for (let index = floatingTexts.length - 1; index >= 0; index -= 1) {
          const floatingText = floatingTexts[index];
          floatingText.life -= deltaSeconds;
          floatingText.text.y += floatingText.vy * deltaSeconds;
          floatingText.text.alpha = Math.max(0, floatingText.life / floatingText.maxLife);

          if (floatingText.life <= 0) {
            cornerTextLayer.removeChild(floatingText.text);
            floatingText.text.destroy();
            floatingTexts.splice(index, 1);
          }
        }
        debugStatusElapsedMs += deltaMs;
        if (debugStatusElapsedMs >= 500) {
          debugStatusElapsedMs = 0;
          publishDebugCollisionStatus();
        }
        drawCornerZones();
        drawEnemies(pulseTime);
        drawMuses(pulseTime);
      });
      updateTickerVisibility();
    };

    void setup();

    return () => {
      isCancelled = true;
      cleanupAudio();
      unsubscribeStore?.();
      removeDebugListeners?.();
      removeHostPointerListener?.();
      removeVisibilityListener?.();
      destroyEffectManager?.();
      if (!isInitialized) {
        return;
      }
      if (app.canvas.parentElement === host) {
        host.removeChild(app.canvas);
      }
      app.destroy(true, { children: true });
    };
  }, []);

  return (
    <section className="game-panel panel">
      <div className="panel-heading panel-heading-row">
        <div>
          <p className="eyebrow">GAME CANVAS</p>
          <h2>Bounce Field</h2>
        </div>
        <span className="status-chip effects-chip">Corner FX active</span>
      </div>
      <div className="pixi-host" ref={canvasHostRef} />
    </section>
  );
}
