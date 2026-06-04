import { useEffect, useRef } from 'react';
import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import {
  cloneSpawnMaxAttempts,
  cloneSpawnMinDistance,
  cloneSpawnWallPadding,
  museTapDirectionChangeDegreeHigh,
  museTapDirectionChangeDegreeLow,
  museTapDirectionChangeDegreeMedium,
  museTapEffectDurationMs,
  wallpaperLowEffectFlashAlphaMultiplier,
  wallpaperLowEffectLayerAlphaMultiplier,
  wallpaperLowEffectParticleMultiplier,
} from '../data/balance';
import { getBackgroundById } from '../data/backgrounds';
import { getMuseById } from '../data/muses';
import { getEquippedSkinForMuse } from '../data/skins';
import { createEffectManager } from '../effects/effectManager';
import type { CornerEffectKind } from '../effects/effectTypes';
import { createInitialBody, stepBounceBody, type BounceBody } from '../game/bouncePhysics';
import {
  calculateBounceReward,
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
import { findSafeCloneSpawnPosition } from '../game/spawnUtils';
import { handleVegaBumperCollisions } from '../game/museCollision';
import { useAppStore } from '../store/useAppStore';
import { useGameStore } from '../store/useGameStore';
import { playCornerHitSound, playMuseTapVoice, prepareAudioSystem } from '../systems/audioSystem';
import { fallbackBackgroundImagePath, warnAssetFallbackOnce } from '../systems/assetFallbacks';
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

interface ActiveMuseBody {
  runtimeId: string;
  muse: Muse;
  body: BounceBody;
  baseRadius: number;
  isClone: boolean;
  glow: Graphics;
  icon: Graphics;
}

interface GameCanvasProps {
  presentationMode?: 'normal' | 'muse_overlay';
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
      const cornerGlowLayer = new Container();
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
        cornerGlowLayer,
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
      const inset = 12;
      let backgroundRequestId = 0;
      let isBackgroundImageReady = false;
      const activeMuses = new Map<string, ActiveMuseBody>();
      const vegaBumperRewardAtByPair = new Map<string, number>();
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
        return {
          isWallpaperMode: wallpaperMode !== 'off',
          isWallpaperLowEffects: wallpaperMode !== 'off' && wallpaperSettings.effectsQuality === 'low',
          seVolumeScale: wallpaperMode === 'off' ? 1 : wallpaperSettings.seVolumeScale,
          wallpaperFps: wallpaperMode === 'off' ? 0 : wallpaperSettings.fps,
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

        const runtime = {
          runtimeId: muse.id,
          muse,
          body,
          baseRadius: radius,
          isClone: false,
          glow: new Graphics(),
          icon: new Graphics(),
        };
        runtime.icon.eventMode = 'static';
        runtime.icon.cursor = 'pointer';
        runtime.icon.on('pointertap', () => handleMuseTap(runtime));
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
        const runtime: ActiveMuseBody = {
          runtimeId,
          muse: source.muse,
          body: {
            ...source.body,
            radius: baseRadius,
            x: spawnPosition.x,
            y: spawnPosition.y,
          },
          baseRadius,
          isClone: true,
          glow: new Graphics(),
          icon: new Graphics(),
        };
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
          const { body, muse, icon, glow } = runtime;
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
          icon
            .clear()
            .circle(body.x, body.y, body.radius)
            .fill({ color: palette.fill })
            .stroke({
              color: isVegaBumperActive ? 0xffd681 : palette.outline,
              alpha: isVegaBumperActive ? 0.94 : 0.76,
              width: isVegaBumperActive ? 4 : 2,
            })
            .circle(body.x, body.y - 8 * scale, 17 * scale)
            .fill({ color: palette.figure, alpha: 0.84 })
            .roundRect(body.x - 24 * scale, body.y + 12 * scale, 48 * scale, 21 * scale, 10 * scale)
            .fill({ color: palette.figure, alpha: 0.84 });
          glow.alpha = runtime.isClone ? 0.5 : 1;
          icon.alpha = runtime.isClone ? 0.58 : 1;
        }
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
        tapNotice.text = `BOOST!\n${subtitle}`;
        tapNotice.position.set(runtime.body.x, runtime.body.y - runtime.body.radius - 39);
        tapNotice.visible = true;
        tapNotice.alpha = 1;
        tapNoticeTime = maxLife;
      };

      handleMuseTap = (runtime) => {
        if (runtime.isClone) {
          return;
        }

        const { settings } = useAppStore.getState();
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
        triggerTapEffects(
          runtime,
          settings.language === 'ja' ? tapVoice.subtitleJa : tapVoice.subtitleEn,
        );
        playMuseTapVoice(tapVoice, settings.seVolume * seVolumeScale);
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
        const nearDistance = calculateNearCornerDistance(
          useGameStore.getState().unlockedSkillNodes,
        );
        const offsetY = Math.max(14, Math.min(nearDistance * 0.6, nearDistance - 4));
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
      void updateBackground(useGameStore.getState().currentBackgroundId);
      skillNotice.position.set(app.screen.width / 2, app.screen.height * 0.29);
      syncMuseBodies(useGameStore.getState().activeMuseIds);
      drawMuses();
      unsubscribeStore = useGameStore.subscribe((state, previousState) => {
        if (state.currentBackgroundId !== previousState.currentBackgroundId) {
          void updateBackground(state.currentBackgroundId);
        }
        if (state.activeMuseIds !== previousState.activeMuseIds) {
          syncMuseBodies(state.activeMuseIds);
          drawMuses(pulseTime);
        }
        if (state.equippedSkinByMuseId !== previousState.equippedSkinByMuseId) {
          drawMuses(pulseTime);
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
        cornerGlowLayer.alpha =
          (isMuseOverlayPresentation ? 0.38 : 1) * lowEffectAlphaMultiplier;
        particleLayer.alpha =
          (isMuseOverlayPresentation ? 0.42 : 1) * lowEffectAlphaMultiplier;
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
          const isTapBoostActive =
            !runtime.isClone &&
            museTapStates[runtime.muse.id]?.isTapBoostActive === true &&
            Date.now() < museTapStates[runtime.muse.id].tapBoostEndsAt;
          const result = stepBounceBody(
            runtime.body,
            { width: app.screen.width, height: app.screen.height, inset },
            (simulationDeltaMs / 1_000) *
              calculateVisualSpeedMultiplier(
                upgrades,
                skillSpeedMultiplier,
                isTapBoostActive,
                motionIntensity,
              ),
            {
              nearCornerDistance: calculateNearCornerDistance(unlockedSkillNodes),
            },
          );
          runtime.body = result.body;

          if (result.bounced) {
            const wallRewardMultiplier = getCloneWallRewardMultiplier(runtime.isClone);
            const bounceReward = Math.max(
              1,
              Math.floor(
                calculateBounceReward(upgrades, unlockedSkillNodes, motionIntensity) *
                  runtime.muse.memoryMultiplier *
                  wallRewardMultiplier,
              ),
            );
            recordWallHit(bounceReward);

            if (result.collision.isCornerHit && result.collision.cornerId) {
              const cornerRewardMultiplier = getCloneCornerRewardMultiplier(runtime.isClone);
              const cornerReward = Math.max(
                1,
                Math.floor(
                  calculateCornerReward(upgrades, unlockedSkillNodes, motionIntensity) *
                    runtime.muse.cornerMultiplier *
                    cornerRewardMultiplier *
                    calculateMuseTapCornerRewardMultiplier(isTapBoostActive, motionIntensity),
                ),
              );
              const cornerPosition = result.collision.cornerId;
              const cornerEffectKind: CornerEffectKind =
                unlockedSkillNodes.lucky_corner > 0 ? 'lucky_corner' : 'corner_hit';
              recordCornerHit(cornerReward);
              triggerCornerHitFlash(cornerPosition);
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
        effectManager.update(deltaSeconds);
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
        debugStatusElapsedMs += deltaMs;
        if (debugStatusElapsedMs >= 500) {
          debugStatusElapsedMs = 0;
          publishDebugCollisionStatus();
        }
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
