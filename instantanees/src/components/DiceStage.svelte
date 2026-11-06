<script lang="ts">
  import { scenarios, risks, riskTypes, type Scenario, type Risk } from '../game/scenarios';
  import { formatDecimal } from '../game/format';
  import DifficultySelector from '../../../src/lib/DifficultySelector.svelte';
  let { scenario, risk = $bindable<Risk>('balanced'), playedRisk = 'balanced', face = 5, payout = 0 }: { scenario: Scenario; risk?: Risk; playedRisk?: Risk; face?: number; payout?: number } = $props();
  const pips: Record<number, number[]> = { 1: [4], 2: [0,8], 3: [0,4,8], 4: [0,2,6,8], 5: [0,2,4,6,8], 6: [0,2,3,5,6,8] };
  const result = $derived(scenario === 'won' || scenario === 'lost');
  const difficultyOptions = riskTypes.map(value => ({ value, label:risks[value].label, detail:risks[value].hint }));
</script>

<div class="dice-stage" data-state={scenario}>
  <p class="hint instruction" aria-live="polite">{result ? `${scenario === 'won' ? 'Objectif atteint' : 'Objectif manqué'} : ${risks[playedRisk].hint.toLowerCase()}.` : scenarios[scenario].hint}</p>
  <div class="hero">
    <div class="die" class:rolling={scenario === 'playing'} aria-label={result ? `Dé : ${face}` : 'Dé prêt à lancer'}>
      {#each Array(9) as _, i}<span class="pip" class:visible={pips[result ? face : 5].includes(i)}></span>{/each}
    </div>
    {#if scenario === 'won'}<div class="hero-caption" aria-live="polite"><strong class="gain">+{formatDecimal(payout)} <small>FCFA</small></strong></div>{/if}
  </div>
  <div class="risk-zone">
    <DifficultySelector options={difficultyOptions} value={risk} disabled={scenario === 'playing'} onchange={(value) => risk = value} />
  </div>
</div>

<style>
  .dice-stage { height: 100%; display: grid; grid-template-rows: auto minmax(0,1fr) auto; justify-items: center; padding: 22px; gap: 12px; }
  .hero { display: grid; place-content: center; justify-items: center; gap: 22px; min-height: 0; }
  .die { --die-size: clamp(104px, 28cqmin, 190px); width: var(--die-size); aspect-ratio: 1; display: grid; grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(3,1fr); gap: calc(var(--die-size) * .08); padding: calc(var(--die-size) * .18); border-radius: 22%; background: linear-gradient(135deg,#fff,#d9d0f6); box-shadow: 0 18px 55px #6d28d94d,inset 0 2px 0 #fff,inset -5px -7px 0 #b5a5d733; transform: rotate(-8deg); }
  .pip { width: 100%; aspect-ratio: 1; align-self: center; border-radius: 50%; background: #35215b; opacity: 0; box-shadow: inset 0 2px 2px #0004; }
  .pip.visible { opacity: 1; }
  .hero-caption { display: grid; justify-items: center; gap: 6px; text-align: center; }
  .hero-caption strong { font-size: clamp(22px,5cqmin,34px); line-height: 1.1; }
  .hero-caption small { font-size: 15px; font-weight: 600; }
  .gain { color: var(--win); font-variant-numeric: tabular-nums; }
  .risk-zone { width: min(500px,100%); }
  .rolling { animation: roll .35s linear infinite; }
  @keyframes roll { 50% { transform: rotate(12deg) translateY(-6px); } }
  @container (max-height: 330px) { .dice-stage { padding: 14px; gap: 6px; }.hero { grid-template-columns: auto minmax(0,1fr); align-items:center; gap:18px; }.die { --die-size:100px; }.hero-caption { justify-items:start; text-align:left; } }
  @media (prefers-reduced-motion: reduce) { .rolling { animation:none; } }
</style>
