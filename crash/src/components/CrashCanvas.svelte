<script lang="ts">
  import { onMount } from 'svelte';
  import type { Scenario } from '../game/scenarios';

  let { scenario = 'betting' }: { scenario?: Scenario } = $props();

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
          const trace = (graphics: typeof curve) => graphics.moveTo(startX, startY).bezierCurveTo(width * 0.45, startY, width * 0.7, height * 0.66, endX, endY);
          trace(area).lineTo(endX, startY).lineTo(startX, startY).closePath().fill({ color, alpha: 0.12 });
          trace(curve).stroke({ color, width: 12, alpha: 0.12, cap: 'round' });
          trace(curve).stroke({ color, width: 4, cap: 'round' });
          curve.circle(endX, endY, 16).fill({ color, alpha: 0.22 });
          curve.circle(endX, endY, 6).fill(0xffffff);
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
