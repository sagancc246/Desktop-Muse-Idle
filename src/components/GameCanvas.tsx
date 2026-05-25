import { useEffect, useRef } from 'react';
import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { BALANCE } from '../data/balance';
import { useGameStore } from '../store/useGameStore';

interface Particle {
  display: Graphics;
  velocityX: number;
  velocityY: number;
  life: number;
}

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) {
      return;
    }

    const app = new Application();
    let cancelled = false;
    let initialized = false;
    let resizeObserver: ResizeObserver | undefined;

    const setup = async () => {
      await app.init({
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        resizeTo: host,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });
      const museTexture = await Assets.load('/assets/muse-icon.png');

      if (cancelled) {
        app.destroy(true);
        return;
      }

      initialized = true;
      host.appendChild(app.canvas);

      const scene = new Container();
      const backdrop = new Graphics();
      const cornerGuides = new Graphics();
      const trail = new Graphics();
      const effects = new Container();
      const mask = new Graphics();
      const ring = new Graphics();
      const muse = new Sprite(museTexture);
      const flashLabel = new Text({
        text: 'CORNER HIT!',
        style: new TextStyle({
          fill: '#ffe58a',
          fontFamily: 'Arial, sans-serif',
          fontSize: 26,
          fontWeight: 'bold',
          letterSpacing: 3,
          stroke: { color: '#522e90', width: 5 },
        }),
      });

      flashLabel.anchor.set(0.5);
      flashLabel.visible = false;
      muse.anchor.set(0.5);
      muse.width = BALANCE.iconRadius * 2;
      muse.height = BALANCE.iconRadius * 2;
      muse.mask = mask;

      scene.addChild(backdrop, cornerGuides, trail, effects, mask, muse, ring, flashLabel);
      app.stage.addChild(scene);

      const particles: Particle[] = [];
      const position = { x: 0, y: 0 };
      const direction = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
      let labelLife = 0;
      let initializedPosition = false;

      const drawArena = () => {
        const width = app.screen.width;
        const height = app.screen.height;
        const inset = 14;
        const radius = 26;

        backdrop
          .clear()
          .roundRect(inset, inset, width - inset * 2, height - inset * 2, radius)
          .fill({ color: 0x090e26, alpha: 0.82 })
          .stroke({ color: 0x34386a, alpha: 0.9, width: 2 });

        cornerGuides.clear();
        const glowSize = BALANCE.cornerDetectionDistance;
        const corners = [
          [inset + radius, inset + radius],
          [width - inset - radius, inset + radius],
          [inset + radius, height - inset - radius],
          [width - inset - radius, height - inset - radius],
        ];
        corners.forEach(([x, y]) => {
          cornerGuides.circle(x, y, glowSize).fill({ color: 0xa55bff, alpha: 0.035 });
          cornerGuides.circle(x, y, 5).fill({ color: 0xffd966, alpha: 0.72 });
        });

        if (!initializedPosition) {
          position.x = width / 2;
          position.y = height / 2;
          initializedPosition = true;
        } else {
          position.x = Math.min(Math.max(position.x, BALANCE.iconRadius), width - BALANCE.iconRadius);
          position.y = Math.min(Math.max(position.y, BALANCE.iconRadius), height - BALANCE.iconRadius);
        }
      };

      const updateMuse = () => {
        muse.position.set(position.x, position.y);
        mask
          .clear()
          .circle(position.x, position.y, BALANCE.iconRadius)
          .fill({ color: 0xffffff });
        ring
          .clear()
          .circle(position.x, position.y, BALANCE.iconRadius + 4)
          .stroke({ color: 0xa9d8ff, alpha: 0.7, width: 2 })
          .circle(position.x, position.y, BALANCE.iconRadius + 9)
          .stroke({ color: 0xc679ff, alpha: 0.22, width: 2 });
      };

      const burst = () => {
        labelLife = 1;
        flashLabel.visible = true;
        flashLabel.position.set(position.x, position.y - BALANCE.iconRadius - 34);

        for (let index = 0; index < 12; index += 1) {
          const angle = (index / 12) * Math.PI * 2;
          const dot = new Graphics()
            .circle(0, 0, index % 3 === 0 ? 5 : 3)
            .fill({ color: index % 2 === 0 ? 0xffdc73 : 0xcf8dff });
          dot.position.set(position.x, position.y);
          effects.addChild(dot);
          particles.push({
            display: dot,
            velocityX: Math.cos(angle) * (130 + (index % 4) * 22),
            velocityY: Math.sin(angle) * (130 + (index % 4) * 22),
            life: 1,
          });
        }
      };

      drawArena();
      updateMuse();
      resizeObserver = new ResizeObserver(drawArena);
      resizeObserver.observe(host);

      app.ticker.add((ticker) => {
        const seconds = ticker.deltaMS / 1_000;
        const speed = useGameStore.getState().getCurrentSpeed();
        const width = app.screen.width;
        const height = app.screen.height;
        const min = BALANCE.iconRadius + 14;
        const maxX = width - BALANCE.iconRadius - 14;
        const maxY = height - BALANCE.iconRadius - 14;

        position.x += direction.x * speed * seconds;
        position.y += direction.y * speed * seconds;

        let hitHorizontal = false;
        let hitVertical = false;
        if (position.x <= min || position.x >= maxX) {
          position.x = Math.min(Math.max(position.x, min), maxX);
          direction.x *= -1;
          hitHorizontal = true;
        }
        if (position.y <= min || position.y >= maxY) {
          position.y = Math.min(Math.max(position.y, min), maxY);
          direction.y *= -1;
          hitVertical = true;
        }

        if (hitHorizontal || hitVertical) {
          const closeToHorizontalEdge =
            position.y - min <= BALANCE.cornerDetectionDistance ||
            maxY - position.y <= BALANCE.cornerDetectionDistance;
          const closeToVerticalEdge =
            position.x - min <= BALANCE.cornerDetectionDistance ||
            maxX - position.x <= BALANCE.cornerDetectionDistance;
          const isCornerHit =
            (hitHorizontal && closeToHorizontalEdge) ||
            (hitVertical && closeToVerticalEdge);
          useGameStore.getState().recordBounce(isCornerHit);
          if (isCornerHit) {
            burst();
          }
        }

        trail
          .clear()
          .circle(position.x - direction.x * 16, position.y - direction.y * 16, 32)
          .fill({ color: 0x9565ed, alpha: 0.06 });

        particles.forEach((particle) => {
          particle.life -= seconds * 2.2;
          particle.display.x += particle.velocityX * seconds;
          particle.display.y += particle.velocityY * seconds;
          particle.display.alpha = Math.max(0, particle.life);
          particle.display.scale.set(0.7 + particle.life * 0.45);
        });
        for (let index = particles.length - 1; index >= 0; index -= 1) {
          if (particles[index].life <= 0) {
            effects.removeChild(particles[index].display);
            particles[index].display.destroy();
            particles.splice(index, 1);
          }
        }

        if (labelLife > 0) {
          labelLife -= seconds * 1.15;
          flashLabel.alpha = Math.max(0, labelLife);
          flashLabel.y -= 26 * seconds;
          flashLabel.visible = labelLife > 0;
        }

        updateMuse();
      });
    };

    void setup();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (!initialized) {
        return;
      }
      if (app.canvas.parentElement === host) {
        host.removeChild(app.canvas);
      }
      app.destroy(true, { children: true });
    };
  }, []);

  return (
    <section className="canvas-shell">
      <div className="canvas-label">
        <span>LIVE WINDOW</span>
        <small>Catch the corners</small>
      </div>
      <div className="game-canvas" ref={containerRef} />
    </section>
  );
}
