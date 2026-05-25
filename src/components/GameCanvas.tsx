import { useEffect, useRef } from 'react';
import { Application, Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import { cornerThreshold } from '../data/balance';
import { getBackgroundById } from '../data/backgrounds';
import { getMuseById } from '../data/muses';
import { createInitialBody, stepBounceBody, type BounceBody } from '../game/bouncePhysics';
import { isCornerHit } from '../game/cornerHit';
import {
  calculateBounceReward,
  calculateCornerReward,
  calculateSpeedMultiplier,
} from '../game/rewardCalculator';
import {
  getCloneRewardMultiplier,
  getSkillScale,
  getSkillSpeedMultiplier,
  isSkillActive,
} from '../game/skillEffects';
import { useAppStore } from '../store/useAppStore';
import { useGameStore } from '../store/useGameStore';
import { playCornerHitSound, prepareAudioSystem } from '../systems/audioSystem';
import type { Muse } from '../types/game';

interface BurstParticle {
  graphic: Graphics;
  life: number;
  maxLife: number;
  rotationSpeed: number;
  vx: number;
  vy: number;
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

export function GameCanvas() {
  const canvasHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) {
      return;
    }

    const app = new Application();
    let isCancelled = false;
    let isInitialized = false;
    let resizeObserver: ResizeObserver | undefined;
    let unsubscribeStore: (() => void) | undefined;
    const cleanupAudio = prepareAudioSystem();

    const setup = async () => {
      await app.init({
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        resizeTo: host,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (isCancelled) {
        app.destroy(true);
        return;
      }

      isInitialized = true;
      host.appendChild(app.canvas);

      const arena = new Graphics();
      const backgroundImage = new Sprite();
      const backgroundMask = new Graphics();
      backgroundImage.alpha = 0.58;
      backgroundImage.visible = false;
      backgroundImage.mask = backgroundMask;
      const grid = new Graphics();
      const cornerFlash = new Graphics();
      const museLayer = new Container();
      const particleLayer = new Container();
      const cornerNotice = new Text({
        text: 'CORNER HIT!',
        style: {
          fill: 0xffd681,
          fontFamily: 'Arial, sans-serif',
          fontSize: 48,
          fontWeight: 'bold',
          letterSpacing: 2,
          stroke: { color: 0x4b245f, width: 5 },
        },
      });
      cornerNotice.anchor.set(0.5);
      cornerNotice.visible = false;
      const rewardPopup = new Text({
        text: '',
        style: {
          fill: 0x8cdcff,
          fontFamily: 'Arial, sans-serif',
          fontSize: 27,
          fontWeight: 'bold',
          stroke: { color: 0x142044, width: 4 },
        },
      });
      rewardPopup.anchor.set(0.5);
      rewardPopup.visible = false;
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
      app.stage.addChild(
        arena,
        backgroundImage,
        backgroundMask,
        grid,
        cornerFlash,
        museLayer,
        particleLayer,
        cornerNotice,
        rewardPopup,
        skillNotice,
      );

      let pulseTime = 0;
      let cornerNoticeTime = 0;
      let flashTime = 0;
      let rewardPopupTime = 0;
      let skillNoticeTime = 0;
      let skillTickAccumulatorMs = 0;
      const particles: BurstParticle[] = [];
      const inset = 12;
      let backgroundRequestId = 0;
      const activeMuses = new Map<string, ActiveMuseBody>();
      const museColors: Record<string, { fill: number; outline: number; figure: number; glow: number }> = {
        'lumi-orchid': { fill: 0x3d3568, outline: 0xb38cff, figure: 0xdbcef9, glow: 0x8ad9ff },
        'astra-cyan': { fill: 0x17455d, outline: 0x65dcff, figure: 0xd0f4ff, glow: 0x66e7ff },
        'noir-rose': { fill: 0x53283e, outline: 0xff79af, figure: 0xffd5e5, glow: 0xff79bf },
      };
      const radii: Record<string, number> = { lumi: 46, astra: 40, noir: 43 };

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

      const createClone = (source: ActiveMuseBody) => {
        const runtimeId = `${source.muse.id}:clone`;
        if (activeMuses.has(runtimeId)) {
          return;
        }

        const baseRadius = source.baseRadius * 0.92;
        const runtime: ActiveMuseBody = {
          runtimeId,
          muse: source.muse,
          body: {
            ...source.body,
            radius: baseRadius,
            x: source.body.x,
            y: source.body.y,
            vx: -source.body.vx,
          },
          baseRadius,
          isClone: true,
          glow: new Graphics(),
          icon: new Graphics(),
        };
        museLayer.addChild(runtime.glow, runtime.icon);
        activeMuses.set(runtimeId, runtime);
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

        cornerFlash
          .clear()
          .roundRect(inset, inset, width - inset * 2, height - inset * 2, 22)
          .fill({ color: 0xffd681, alpha: 0.22 });
        cornerFlash.alpha = 0;
      };

      const updateBackground = async (backgroundId: string | null) => {
        const background = getBackgroundById(backgroundId);
        const requestId = ++backgroundRequestId;

        if (!background) {
          backgroundImage.visible = false;
          return;
        }

        try {
          const texture = await Assets.load(background.imagePath);

          if (isCancelled || requestId !== backgroundRequestId) {
            return;
          }

          backgroundImage.texture = texture;
          backgroundImage.visible = true;
          drawArena();
        } catch {
          if (requestId === backgroundRequestId) {
            backgroundImage.visible = false;
          }
        }
      };

      const drawMuses = (pulseTime = 0) => {
        for (const runtime of activeMuses.values()) {
          const { body, muse, icon, glow } = runtime;
          const palette = museColors[muse.iconAsset] ?? museColors['lumi-orchid'];
          const scale = body.radius / 46;
          const glowRadius = body.radius + 7 + Math.sin(pulseTime * 2.3) * 4;
          const glowAlpha = 0.15 + (Math.sin(pulseTime * 2.3) + 1) * 0.06;

          glow
            .clear()
            .circle(body.x, body.y, glowRadius)
            .stroke({ color: palette.glow, alpha: glowAlpha, width: 3 });
          icon
            .clear()
            .circle(body.x, body.y, body.radius)
            .fill({ color: palette.fill })
            .stroke({ color: palette.outline, alpha: 0.76, width: 2 })
            .circle(body.x, body.y - 8 * scale, 17 * scale)
            .fill({ color: palette.figure, alpha: 0.84 })
            .roundRect(body.x - 24 * scale, body.y + 12 * scale, 48 * scale, 21 * scale, 10 * scale)
            .fill({ color: palette.figure, alpha: 0.84 });
          glow.alpha = runtime.isClone ? 0.5 : 1;
          icon.alpha = runtime.isClone ? 0.58 : 1;
        }
      };

      const handleResize = () => {
        drawArena();
        cornerNotice.position.set(app.screen.width / 2, app.screen.height * 0.2);
        skillNotice.position.set(app.screen.width / 2, app.screen.height * 0.29);
        for (const runtime of activeMuses.values()) {
          runtime.body = {
            ...runtime.body,
            x: Math.min(
              Math.max(runtime.body.x, inset + runtime.body.radius),
              app.screen.width - inset - runtime.body.radius,
            ),
            y: Math.min(
              Math.max(runtime.body.y, inset + runtime.body.radius),
              app.screen.height - inset - runtime.body.radius,
            ),
          };
        }
        drawMuses();
      };

      const triggerCornerEffects = (reward: number, hitBody: BounceBody) => {
        const { effectsQuality, seVolume } = useAppStore.getState().settings;
        const particleCount = {
          low: 6,
          medium: 12,
          high: 18,
        }[effectsQuality];

        cornerNotice.visible = true;
        cornerNotice.alpha = 1;
        cornerNoticeTime = 1.1;
        flashTime = 0.16;
        rewardPopup.text = `+${reward.toLocaleString()} Memory`;
        rewardPopup.position.set(hitBody.x, hitBody.y - hitBody.radius - 20);
        rewardPopup.visible = true;
        rewardPopup.alpha = 1;
        rewardPopupTime = 0.95;

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

        playCornerHitSound(seVolume);
      };

      const triggerSkillNotice = (muse: Muse) => {
        skillNotice.text = `${muse.name}: ${muse.skill.name}!`;
        skillNotice.position.set(app.screen.width / 2, app.screen.height * 0.29);
        skillNotice.visible = true;
        skillNotice.alpha = 1;
        skillNoticeTime = 1.35;
      };

      drawArena();
      void updateBackground(useGameStore.getState().currentBackgroundId);
      cornerNotice.position.set(app.screen.width / 2, app.screen.height * 0.2);
      skillNotice.position.set(app.screen.width / 2, app.screen.height * 0.29);
      syncMuseBodies(useGameStore.getState().activeMuseIds);
      drawMuses();
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(host);
      unsubscribeStore = useGameStore.subscribe((state, previousState) => {
        if (state.currentBackgroundId !== previousState.currentBackgroundId) {
          void updateBackground(state.currentBackgroundId);
        }
        if (state.activeMuseIds !== previousState.activeMuseIds) {
          syncMuseBodies(state.activeMuseIds);
          drawMuses(pulseTime);
        }
      });

      app.ticker.add((ticker) => {
        skillTickAccumulatorMs += ticker.deltaMS;
        if (skillTickAccumulatorMs >= 100) {
          useGameStore.getState().tickSkillStates(skillTickAccumulatorMs);
          skillTickAccumulatorMs = 0;
        }

        const {
          upgrades,
          addMemory,
          incrementBounce,
          incrementCornerHit,
          activateMuseSkill,
          skillStates,
        } = useGameStore.getState();
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
          const result = stepBounceBody(
            runtime.body,
            { width: app.screen.width, height: app.screen.height, inset },
            (ticker.deltaMS / 1_000) * calculateSpeedMultiplier(upgrades) * skillSpeedMultiplier,
          );
          runtime.body = result.body;

          if (result.bounced) {
            const rewardMultiplier = runtime.isClone
              ? getCloneRewardMultiplier(runtime.muse)
              : 1;
            const bounceReward = Math.max(
              1,
              Math.floor(
                calculateBounceReward(upgrades) * runtime.muse.memoryMultiplier * rewardMultiplier,
              ),
            );
            addMemory(bounceReward);
            incrementBounce();

            if (
              isCornerHit(
                runtime.body,
                { width: app.screen.width, height: app.screen.height, inset },
                cornerThreshold,
              )
            ) {
              const cornerReward = Math.max(
                1,
                Math.floor(
                  calculateCornerReward(upgrades) *
                    runtime.muse.cornerMultiplier *
                    rewardMultiplier,
                ),
              );
              addMemory(cornerReward);
              if (!runtime.isClone) {
                incrementCornerHit();
                triggerCornerEffects(bounceReward + cornerReward, runtime.body);
                if (activateMuseSkill(runtime.muse.id)) {
                  triggerSkillNotice(runtime.muse);
                  if (runtime.muse.skill.type === 'clone') {
                    createClone(runtime);
                  }
                }
              }
            }
          }
        }
        const deltaSeconds = ticker.deltaMS / 1_000;
        pulseTime += deltaSeconds;
        if (cornerNoticeTime > 0) {
          cornerNoticeTime -= deltaSeconds;
          cornerNotice.alpha = Math.min(1, Math.max(0, cornerNoticeTime / 0.35));
          cornerNotice.scale.set(1 + Math.max(0, cornerNoticeTime - 0.85) * 0.26);
          if (cornerNoticeTime <= 0) {
            cornerNotice.visible = false;
          }
        }
        if (flashTime > 0) {
          flashTime -= deltaSeconds;
          cornerFlash.alpha = Math.max(0, flashTime / 0.16);
        }
        if (rewardPopupTime > 0) {
          rewardPopupTime -= deltaSeconds;
          rewardPopup.y -= 26 * deltaSeconds;
          rewardPopup.alpha = Math.min(1, Math.max(0, rewardPopupTime / 0.3));
          if (rewardPopupTime <= 0) {
            rewardPopup.visible = false;
          }
        }
        if (skillNoticeTime > 0) {
          skillNoticeTime -= deltaSeconds;
          skillNotice.alpha = Math.min(1, Math.max(0, skillNoticeTime / 0.3));
          if (skillNoticeTime <= 0) {
            skillNotice.visible = false;
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
        drawMuses(pulseTime);
      });
    };

    void setup();

    return () => {
      isCancelled = true;
      cleanupAudio();
      unsubscribeStore?.();
      resizeObserver?.disconnect();
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
