<script lang="ts">
  import { onMount } from 'svelte';
  import type { Scenario } from '../game/scenarios';

  /** progress : part de la courbe tracée (0 à 1), pour faire monter la courbe pendant une manche du jeu automatique. */
  let { scenario = 'betting', progress = 1 }: { scenario?: Scenario; progress?: number } = $props();

  // Mêmes teintes que l'écran : violet en vol, vert après encaissement, rouge au crash.
  const colors: Record<Scenario, number> = { betting: 0xa78bfa, queued: 0xfbbf24, running: 0xa78bfa, cashedOut: 0x34d399, ended: 0xfb7185 };

  let host: HTMLDivElement;
  let failed = $state(false);
  let ready = $state(false);
  let drawScene = $state<(() => void) | null>(null);

  $effect(() => { drawScene?.(); });

  onMount(() => {
    let disposed = false;
    let cleanup = () => {};

    async function initialize() {
      const { Application, Graphics } = await import('pixi.js');
      if (disposed) return;
      const app = new Application();
      try {
        await app.init({
          width: Math.max(host.clientWidth, 1),
          height: Math.max(host.clientHeight, 1),
          backgroundAlpha: 0,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
          autoStart: false,
          preference: 'webgl',
        });
      } catch (error) {
        if (!disposed) failed = true;
        console.error('Impossible de préparer la zone PixiJS.', error);
        return;
      }
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      host.prepend(app.canvas);
      app.canvas.setAttribute('aria-hidden', 'true');
      const area = new Graphics();
      const curve = new Graphics();
      app.stage.addChild(area, curve);
      const draw = () => {
        const width = Math.max(host.clientWidth, 1);
        const height = Math.max(host.clientHeight, 1);
        app.renderer.resize(width, height);
        area.clear();
        curve.clear();
        const color = colors[scenario];
        const startX = width * 0.06;
        const startY = height * 0.86;
        const endX = width * 0.86;
        const endY = height * 0.3;
        if (scenario === 'betting' || scenario === 'queued') {
          // Avant le départ : seul le point de départ est visible.
          curve.circle(startX, startY, 14).fill({ color, alpha: 0.18 });
          curve.circle(startX, startY, 5).fill(color);
        } else {
          // Même courbe de Bézier, tracée jusqu'à `progress` (points échantillonnés).
          const end = Math.min(1, Math.max(0.02, progress));
          const c1x = width * 0.45, c1y = startY, c2x = width * 0.7, c2y = height * 0.66;
          const at = (t: number) => {
            const u = 1 - t;
            return [
              u * u * u * startX + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * endX,
              u * u * u * startY + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * endY,
            ];
          };
          const points = Array.from({ length: 41 }, (_, index) => at((end * index) / 40));
          const [tipX, tipY] = points[points.length - 1];
          const trace = (graphics: typeof curve) => {
            graphics.moveTo(startX, startY);
            for (const [x, y] of points.slice(1)) graphics.lineTo(x, y);
            return graphics;
          };
          trace(area).lineTo(tipX, startY).lineTo(startX, startY).closePath().fill({ color, alpha: 0.12 });
          trace(curve).stroke({ color, width: 12, alpha: 0.12, cap: 'round', join: 'round' });
          trace(curve).stroke({ color, width: 4, cap: 'round', join: 'round' });
          curve.circle(tipX, tipY, 16).fill({ color, alpha: 0.22 });
          curve.circle(tipX, tipY, 6).fill(0xffffff);
        }
        app.render();
      };
      let resizeFrame = 0;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(draw);
      });
      observer.observe(host);
      cleanup = () => {
        observer.disconnect();
        cancelAnimationFrame(resizeFrame);
        app.destroy(true, { children: true });
      };
      draw();
      drawScene = draw;
      ready = true;
    }

    void initialize().catch((error) => {
      if (!disposed) failed = true;
      console.error(error);
    });
    return () => { disposed = true; drawScene = null; cleanup(); };
  });
</script>

<div class="canvas-host" bind:this={host} data-pixi-ready={ready}>
  {#if failed}<div class="placeholder"><span>Le rendu PixiJS est indisponible sur ce navigateur.</span></div>{/if}
</div>

<style>
  .canvas-host { position: absolute; inset: 0; overflow: hidden; }
  .canvas-host :global(canvas) { position: absolute; inset: 0; display: block; }
  .placeholder { position: absolute; inset: 0; display: grid; place-content: center; gap: 12px; text-align: center; padding: 20px; color: #91a2b9; }
  span { font-size: 16px; }
</style>
