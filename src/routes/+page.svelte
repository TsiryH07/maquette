<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';
  import { families, familyIds, layouts, layoutTypes, resolveScenario, type FamilyId, type LayoutType } from '$lib/catalog';

  const familyId = $derived(familyIds.includes(page.url.searchParams.get('famille') as FamilyId) ? page.url.searchParams.get('famille') as FamilyId : 'crash');
  const family = $derived(families[familyId]);
  const format = $derived(layoutTypes.includes(page.url.searchParams.get('format') as LayoutType) ? page.url.searchParams.get('format') as LayoutType : 'desktop');
  const scenario = $derived(resolveScenario(familyId, page.url.searchParams.get('scenario')));
  const screen = $derived(layouts[format]);
  const sceneUrl = $derived(`/scene/${familyId}?scenario=${encodeURIComponent(scenario)}`);
  let previewArea: HTMLDivElement;
  let availableWidth = $state(0);
  let revision = $state(0);
  const scale = $derived(availableWidth > 0 ? Math.min(1, availableWidth / screen.width) : 1);

  function choose(nextFamily = familyId, nextFormat = format, nextScenario = scenario) {
    const params = new URLSearchParams({ famille:nextFamily, format:nextFormat, scenario:nextScenario });
    return goto(`?${params}`, { noScroll:true, keepFocus:true });
  }
  onMount(() => {
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => availableWidth = entry.contentRect.width);
    });
    observer.observe(previewArea);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  });
</script>

<svelte:head><title>Atelier des maquettes — {family.label}</title><meta name="description" content="Les quatre familles de maquettes Baobab dans un seul atelier : Crash, Instantanés, Révélation et Slots." /></svelte:head>

<div class="workshop">
  <div class="workshop-inner">
    <header class="workshop-header"><div><p class="eyebrow"><span class="brand-mark" aria-hidden="true">B</span>BAOBAB <span class="eyebrow-divider">/</span> MAQUETTES</p><h1>Atelier des maquettes</h1><p class="intro">Une famille, un écran, puis à vous d’essayer.</p></div><span class="local-badge"><span aria-hidden="true"></span>Atelier local · montants fictifs</span></header>

    <nav class="families" aria-label="Familles de jeux">
      {#each familyIds as id}
        <button class="family" aria-pressed={familyId === id} onclick={() => choose(id, format, families[id].initial)}><span class="family-icon"><Icon name={families[id].icon} size={23} /></span><span class="family-label"><strong>{families[id].label}</strong><small>{families[id].hint}</small></span><span class="active-dot" aria-hidden="true"></span></button>
      {/each}
    </nav>

    <section class="viewer" aria-label={`Atelier ${family.label}`}>
      <div class="viewer-heading"><div><p class="section-caption">APERÇU INTERACTIF</p><h2>{family.label}</h2></div><div class="viewer-actions"><button class="reset" aria-label="Réinitialiser la maquette" title="Revenir au scénario choisi" onclick={() => revision++}><Icon name="reset" size={18} /><span>Réinitialiser</span></button><a href={sceneUrl} target="_blank" rel="noreferrer"><span>Ouvrir l’écran seul</span><Icon name="external" size={16} /></a></div></div>
      <div class="toolbar">
        <nav class="formats" aria-label="Format d’écran">{#each layoutTypes as type}<button aria-pressed={format === type} onclick={() => choose(familyId, type)}><Icon name={type} size={17} /><span>{layouts[type].label}</span></button>{/each}</nav>
        <label class="scenario">Moment de la partie<select value={scenario} onchange={event => choose(familyId, format, event.currentTarget.value)}>{#each Object.entries(family.scenarios) as [value, item]}<option {value}>{item.label}</option>{/each}</select></label>
      </div>
      <div class="preview-info"><span>{screen.label}</span><span aria-live="polite">{screen.width} × {screen.height} px <span class="info-divider">·</span> {Math.round(scale * 100)} %</span></div>
      <div class="preview-area" bind:this={previewArea}>
        <div class="screen" style:width={`${screen.width * scale}px`} style:height={`${screen.height * scale}px`}>
          {#key `${familyId}-${scenario}-${revision}`}
            <iframe title={`Maquette ${family.label} — ${screen.label}`} src={sceneUrl} width={screen.width} height={screen.height} style:transform={`scale(${scale})`}></iframe>
          {/key}
        </div>
      </div>
      <footer>Les boutons de chaque maquette sont interactifs. Changer de famille ou réinitialiser démarre un nouvel aperçu.</footer>
    </section>
  </div>
</div>

<style>
  .workshop { min-height:100dvh; padding:32px 24px; color:#f5f3fb; background:radial-gradient(ellipse at 50% 0,#24163b88,transparent 60%),#0a0713; font-family:'Segoe UI',Arial,sans-serif; }
  .workshop-inner { max-width:1664px; margin:0 auto; }
  .workshop-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:20px; margin-bottom:28px; }
  .eyebrow { display:flex; align-items:center; gap:9px; margin:0 0 14px; color:#c4b5fd; font-size:11px; font-weight:700; letter-spacing:.14em; }
  .brand-mark { display:grid; place-items:center; width:26px; height:26px; border-radius:8px; background:#a78bfa; color:#1a0f33; font-size:17px; letter-spacing:0; }
  .eyebrow-divider { color:#625476; }
  h1 { margin:0; font-size:clamp(26px,3vw,36px); font-weight:650; letter-spacing:-.025em; }
  .intro { margin:8px 0 0; color:#a39cba; font-size:14px; }
  .local-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid #ffffff12; border-radius:999px; color:#a39cba; font-size:12px; }
  .local-badge > span { width:6px; height:6px; border-radius:50%; background:#6ee7b7; }
  .families { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:24px; }
  .family { display:flex; align-items:center; gap:12px; min-width:0; min-height:86px; padding:16px; border:1px solid #ffffff14; border-radius:16px; color:#a39cba; background:#130f20; text-align:left; transition:background-color .2s,border-color .2s; }
  .family:hover { background:#20182f; border-color:#a78bfa66; }
  .family[aria-pressed='true'] { color:#f5f3fb; border-color:#a78bfa; background:linear-gradient(110deg,#a78bfa1c,transparent),#1b1630; }
  .family-icon { display:grid; place-items:center; flex:0 0 44px; height:44px; border-radius:12px; color:#a78bfa; background:#a78bfa14; }
  .family[aria-pressed='true'] .family-icon { background:#a78bfa2e; color:#d4c5ff; }
  .family-label { flex:1; min-width:0; display:grid; gap:5px; }
  .family-label strong { font-size:16px; font-weight:650; }
  .family-label small { color:#a39cba; font-size:12px; }
  .active-dot { flex:0 0 6px; height:6px; border-radius:50%; background:#a78bfa; opacity:0; }
  .family[aria-pressed='true'] .active-dot { opacity:1; }
  .viewer { padding:22px; border:1px solid #ffffff14; border-radius:22px; background:#130f20; }
  .viewer-heading { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:20px; }
  .section-caption { margin:0 0 4px; color:#857a9e; font-size:10px; font-weight:700; letter-spacing:.12em; }
  h2 { margin:0; font-size:22px; font-weight:650; }
  .viewer-actions { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
  .viewer-actions button,.viewer-actions a { display:flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:8px 12px; border:1px solid #ffffff14; border-radius:10px; color:#c4b5fd; background:transparent; font-size:12px; text-decoration:none; }
  .viewer-actions a { border-color:transparent; }
  .viewer-actions button:hover,.viewer-actions a:hover { background:#a78bfa12; }
  .toolbar { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:18px; padding:18px 0; border-top:1px solid #ffffff0f; border-bottom:1px solid #ffffff0f; }
  .formats { display:flex; flex-wrap:wrap; gap:4px; padding:4px; border-radius:12px; background:#0b0813; }
  .formats button { display:flex; align-items:center; justify-content:center; gap:7px; min-height:42px; padding:8px 12px; border:1px solid transparent; border-radius:9px; background:transparent; color:#a39cba; font-size:12px; }
  .formats button[aria-pressed='true'] { border-color:#a78bfa38; background:#a78bfa24; color:#e9e2ff; }
  .formats button:hover { color:#f5f3fb; }
  .scenario { display:grid; gap:6px; color:#a39cba; font-size:11px; }
  .scenario select { min-width:210px; min-height:44px; padding:8px 34px 8px 12px; border:1px solid #ffffff24; border-radius:10px; background:#1b1630; color:#f5f3fb; font-size:12px; }
  .preview-info { display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; padding:18px 2px 12px; color:#a39cba; font-size:11px; }
  .info-divider { padding:0 5px; color:#625476; }
  .preview-area { min-width:0; }
  .screen { max-width:100%; margin:0 auto; overflow:hidden; border-radius:14px; background:#0a0713; box-shadow:0 0 0 1px #ffffff14,0 12px 32px #00000033; }
  iframe { display:block; border:0; transform-origin:top left; }
  footer { margin-top:16px; color:#857a9e; font-size:12px; line-height:1.5; }
  .workshop :focus-visible { outline:2px solid #c4b5fd; outline-offset:3px; }
  @media (max-width:1000px) { .family { gap:9px; padding:12px; } .family-label small { display:none; } .family-icon { flex-basis:34px; height:38px; } }
  @media (max-width:650px) { .workshop { padding:20px 12px; } .workshop-header { gap:14px; margin-bottom:20px; } .families { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-bottom:16px; } .family { min-height:68px; } .family-label strong { font-size:14px; } .viewer { padding:14px; border-radius:18px; } .viewer-heading { gap:10px; } .viewer-actions { width:100%; justify-content:space-between; } .toolbar { gap:14px; } .formats { width:100%; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); } .formats button { justify-content:flex-start; } .scenario { width:100%; } .scenario select { width:100%; min-width:0; } .local-badge { padding:6px 10px; } }
  @media (prefers-reduced-motion:reduce) { .family { transition:none; } }
</style>
