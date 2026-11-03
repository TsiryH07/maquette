<script lang="ts">
  import { scenarios, risks, riskTypes, type Scenario, type Risk } from '../game/scenarios';
  import { formatDecimal } from '../game/format';
  import Icon from './Icon.svelte';
  let { scenario, risk = $bindable<Risk>('balanced'), playedRisk = 'balanced', face = 5, payout = 0 }: { scenario: Scenario; risk?: Risk; playedRisk?: Risk; face?: number; payout?: number } = $props();
  const pips: Record<number, number[]> = { 1: [4], 2: [0,8], 3: [0,4,8], 4: [0,2,6,8], 5: [0,2,4,6,8], 6: [0,2,3,5,6,8] };
  const result = $derived(scenario === 'won' || scenario === 'lost');
</script>

<div class="dice-stage" data-state={scenario}>
  <span class="phase">{scenarios[scenario].phase}</span>
  <div class="hero">
    <div class="die" class:rolling={scenario === 'playing'} aria-label={result ? `Dé : ${face}` : 'Dé prêt à lancer'}>
      {#each Array(9) as _, i}<span class="pip" class:visible={pips[result ? face : 5].includes(i)}></span>{/each}
    </div>
    <div class="hero-caption" aria-live="polite">
      {#if scenario === 'won'}<strong class="gain">+{formatDecimal(payout)} <small>FCFA</small></strong>
      {:else if scenario === 'lost'}<strong>Aucun gain</strong>
      {:else}<strong>{risks[risk].hint}</strong>{/if}
      <span>{result ? `Objectif joué : ${risks[playedRisk].hint.toLowerCase()}` : scenarios[scenario].hint}</span>
    </div>
  </div>
  <div class="risk-zone" data-risk={risk} class:locked={scenario === 'playing'}>
    <div class="risk-heading"><strong>Niveau de risque</strong><span>{scenario === 'playing' ? 'Choix verrouillé' : result ? 'Pour la prochaine partie' : 'Choisissez un niveau'}</span></div>
    <div class="risk-buttons" role="group" aria-label="Niveau de risque" style:--risk-index={riskTypes.indexOf(risk)}>
      <span class="risk-selection" aria-hidden="true"></span>
      {#each riskTypes as key, index}
        <button data-risk={key} aria-label={`${risks[key].label} ${risks[key].hint}`} aria-pressed={risk === key} disabled={scenario === 'playing'} onclick={() => risk = key}>
          <span class="risk-symbols" aria-hidden="true">
            <span class="risk-meter">{#each [0, 1, 2] as bar}<span class:lit={bar <= index} style:--bar={bar}></span>{/each}</span>
            <span class="risk-check"><Icon name="check" size={14} /></span>
          </span>
          <span class="risk-copy"><strong>{risks[key].label}</strong><span class="risk-hint">{risks[key].hint}</span></span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .dice-stage { height: 100%; display: grid; grid-template-rows: auto minmax(0,1fr) auto; justify-items: center; padding: 22px; gap: 12px; }
  .phase { display: inline-flex; padding: 6px 12px; border-radius: 999px; color: var(--accent); background: var(--accent-soft); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
  .hero { display: grid; place-content: center; justify-items: center; gap: 22px; min-height: 0; }
  .die { --die-size: clamp(104px, 28cqmin, 190px); width: var(--die-size); aspect-ratio: 1; display: grid; grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(3,1fr); gap: calc(var(--die-size) * .08); padding: calc(var(--die-size) * .18); border-radius: 22%; background: linear-gradient(135deg,#fff,#d9d0f6); box-shadow: 0 18px 55px #6d28d94d,inset 0 2px 0 #fff,inset -5px -7px 0 #b5a5d733; transform: rotate(-8deg); }
  .pip { width: 100%; aspect-ratio: 1; align-self: center; border-radius: 50%; background: #35215b; opacity: 0; box-shadow: inset 0 2px 2px #0004; }
  .pip.visible { opacity: 1; }
  .hero-caption { display: grid; justify-items: center; gap: 6px; text-align: center; }
  .hero-caption strong { font-size: clamp(22px,5cqmin,34px); line-height: 1.1; }
  .hero-caption small { font-size: 15px; font-weight: 600; }
  .hero-caption > span { color: var(--muted); font-size: 15px; line-height: 1.4; }
  .gain { color: var(--win); font-variant-numeric: tabular-nums; }
  [data-state='lost'] .phase { color: var(--loss); background: #fb718520; }
  [data-state='won'] .phase { color: var(--win); background: #34d39920; }
  .risk-zone { width: min(500px,100%); }
  [data-risk='low'] { --risk-color:#6ee7b7; --risk-tint:#12382e; --risk-glow:#34d39924; }
  [data-risk='balanced'] { --risk-color:#c4b5fd; --risk-tint:#332151; --risk-glow:#a78bfa30; }
  [data-risk='high'] { --risk-color:#fda4af; --risk-tint:#482332; --risk-glow:#fb718524; }
  .risk-heading { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:6px; margin:0 4px 8px; color:var(--muted); }
  .risk-heading strong { color:var(--text); font-size:13px; font-weight:600; }
  .risk-heading > span { font-size:12px; }
  .risk-buttons { position:relative; isolation:isolate; overflow:hidden; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:3px; padding:4px; border:1px solid var(--line-strong); border-radius:24px; background:#0e0a19; box-shadow:inset 0 2px 8px #00000024; }
  .risk-selection { position:absolute; z-index:-1; inset:4px auto 4px 4px; width:calc((100% - 14px) / 3); border-radius:19px; background:linear-gradient(160deg,#ffffff0f,transparent 75%),var(--risk-tint); box-shadow:inset 0 1px 0 #ffffff1a,0 2px 8px #0000001f; transform:translateX(calc(var(--risk-index) * (100% + 3px))); transition:transform .35s cubic-bezier(.22,1,.36,1),background-color .25s,opacity .2s; pointer-events:none; }
  .risk-buttons button { position:relative; min-width:0; display:flex; align-items:center; justify-content:center; gap:7px; min-height:48px; padding:6px; border:0; border-radius:19px; background:transparent; color:var(--text); font:inherit; text-align:left; -webkit-tap-highlight-color:transparent; transition:background-color .2s,transform .18s,opacity .2s; }
  .risk-buttons button:hover:enabled { background:var(--risk-glow); }
  .risk-buttons button:active:enabled { transform:scale(.97); }
  .risk-buttons button:focus-visible { outline:2px solid var(--risk-color); outline-offset:-3px; }
  .risk-buttons button:disabled { opacity:.55; cursor:default; }
  .risk-copy { display:grid; gap:2px; }
  .risk-buttons button strong { font-size:13px; font-weight:600; line-height:1.2; white-space:nowrap; }
  .risk-hint { color:var(--muted); font-size:12px; line-height:1.3; transition:color .2s; }
  .risk-buttons button[aria-pressed='true'] { background:transparent; }
  .risk-buttons button[aria-pressed='true'] strong { color:var(--risk-color); }
  .risk-buttons button[aria-pressed='true'] .risk-hint { color:var(--text); }
  .risk-symbols { position:relative; display:grid; place-items:center; flex:0 0 16px; height:16px; color:var(--risk-color); }
  .risk-meter { display:flex; align-items:flex-end; gap:2px; height:14px; transition:opacity .2s,transform .2s; }
  .risk-meter > span { width:4px; height:calc(5px + var(--bar) * 4px); border-radius:2px; background:currentColor; opacity:.18; transform:scaleY(.8); transform-origin:bottom; transition:transform .25s,opacity .25s; transition-delay:calc(var(--bar) * 40ms); }
  .risk-meter > .lit { opacity:.7; }
  button[aria-pressed='true'] .risk-meter > .lit, button:hover:enabled .risk-meter > .lit { opacity:1; transform:scaleY(1); }
  .risk-check { position:absolute; inset:0; display:grid; place-items:center; width:16px; height:16px; border-radius:50%; background:var(--risk-color); color:var(--surface); opacity:0; transform:scale(.5); transition:opacity .18s,transform .25s cubic-bezier(.22,1,.36,1); }
  button[aria-pressed='true'] .risk-check { opacity:1; transform:scale(1); }
  button[aria-pressed='true'] .risk-meter { opacity:0; transform:scale(.7); }
  .risk-zone.locked .risk-selection { opacity:.6; }
  .rolling { animation: roll .35s linear infinite; }
  @keyframes roll { 50% { transform: rotate(12deg) translateY(-6px); } }
  @container (max-height: 330px) { .dice-stage { padding: 14px; gap: 6px; }.hero { grid-template-columns: auto minmax(0,1fr); align-items:center; gap:18px; }.die { --die-size:100px; }.hero-caption { justify-items:start; text-align:left; }.hero-caption > span { font-size:14px; }.risk-heading { margin-bottom:6px; } }
  @container (max-width: 340px) { .risk-symbols { display:none; } .risk-buttons button { text-align:center; } }
  @media (prefers-reduced-motion: reduce) { .rolling { animation:none; } .risk-selection,.risk-buttons button,.risk-meter,.risk-meter > span,.risk-check,.risk-hint { transition:none; } .risk-buttons button:hover:enabled,.risk-buttons button:active:enabled { transform:none; } }
</style>
