<script lang="ts">
  import { onMount } from 'svelte';
  import { layouts, layoutTypes, type LayoutType } from '../game/layouts';
  import { scenarios, type Scenario } from '../game/scenarios';

  let selected = $state<LayoutType>('desktop');
  let scenario = $state<Scenario>('betting');
  let availableWidth = $state(0);
  let previewArea: HTMLDivElement;
  const screen = $derived(layouts[selected]);
  const scale = $derived(availableWidth > 0 ? Math.min(1, availableWidth / screen.width) : 1);
  const sceneUrl = $derived(`/scene?scenario=${scenario}`);

  onMount(() => {
    let resizeFrame = 0;
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => availableWidth = entry.contentRect.width);
    });
    observer.observe(previewArea);
    return () => { observer.disconnect(); cancelAnimationFrame(resizeFrame); };
  });
</script>

<svelte:head>
  <title>Atelier maquette — Crash</title>
  <meta name="description" content="Espace local de préparation des maquettes Crash sur quatre formats d’écran." />
</svelte:head>

<div class="workshop">
  <header><div><p class="eyebrow">MAQUETTES / CRASH</p><h1>Atelier de préparation</h1><p>Choisis un écran pour préparer la disposition des commandes.</p></div><a href={sceneUrl} target="_blank" rel="noreferrer">Ouvrir l’écran seul ↗</a></header>
  <nav aria-label="Format d’écran">
    {#each layoutTypes as type}<button aria-pressed={selected === type} onclick={() => selected = type}>{layouts[type].label}</button>{/each}
  </nav>
  <div class="settings">
    <label>Moment de la partie <select bind:value={scenario}>{#each Object.entries(scenarios) as [value, item]}<option {value}>{item.label}</option>{/each}</select></label>
    <p aria-live="polite">{screen.width} × {screen.height} px · affiché à {Math.round(scale * 100)} %</p>
  </div>
  <div class="preview-area" bind:this={previewArea}>
    <div class="screen" style:width={`${screen.width * scale}px`} style:height={`${screen.height * scale}px`}>
      <iframe title={`Maquette Crash — ${screen.label}`} src={sceneUrl} width={screen.width} height={screen.height} style:transform={`scale(${scale})`}></iframe>
    </div>
  </div>
  <footer>Maquette interactive : choisissez une mise, puis testez le bouton principal. Les montants restent fictifs.</footer>
</div>

<style>
  .workshop { max-width: 1600px; margin: 0 auto; padding: 28px; }
  header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px; }
  .eyebrow { font-size: 12px; letter-spacing: 0.15em; color: #a9c6e5; }
  h1 { margin: 10px 0; font-size: clamp(24px, 4vw, 36px); }
  header p:last-child, footer, .settings p { color: #a7b6ca; }
  nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0 16px; }
  .settings { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
  label { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .preview-area { margin-top: 20px; }
  .screen { margin: 0 auto; background: #101722; outline: 1px solid #536177; overflow: hidden; }
  iframe { display: block; border: 0; transform-origin: top left; }
  footer { margin-top: 20px; font-size: 14px; line-height: 1.6; }
  @media (max-width: 600px) { .workshop { padding: 16px; } }
</style>
