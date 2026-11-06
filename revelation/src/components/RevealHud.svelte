<script lang="ts">
  import { fly } from 'svelte/transition';
  import '../game/hud.css';
  import config, { difficulties, type Difficulty } from '../game.config';
  import HudStats from '../../../src/lib/HudStats.svelte';
  import PanelMenu from '../../../src/lib/PanelMenu.svelte';
  import DifficultySelector from '../../../src/lib/DifficultySelector.svelte';
  import { formatDecimal, formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import type { Scenario } from '../game/scenarios';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  let { amount, difficulty, phase, payout, multiplier, revealed, totalSafe, layout, onamount, ondifficulty, onprimary, onmenu }: {
    amount: number; difficulty: Difficulty; phase: Scenario; payout: number; multiplier: number;
    revealed: number; totalSafe: number; layout: LayoutType;
    onamount: (value: number) => void; ondifficulty: (value: Difficulty) => void; onprimary: () => void;
    onmenu: () => void;
  } = $props();
  let betSheet: ReturnType<typeof Sheet>;
  let difficultySheet: ReturnType<typeof Sheet>;
  const difficultyTypes = Object.keys(difficulties) as Difficulty[];
  const difficultyOptions = difficultyTypes.map(value => ({ value, label:difficulties[value].label, detail:`${difficulties[value].traps.length} piège${difficulties[value].traps.length > 1 ? 's' : ''}` }));
  const locked = $derived(phase === 'playing');
  const betIndex = $derived(config.betAmountOptions.indexOf(amount));
  const action = $derived(phase === 'ready' ? 'Commencer' : phase === 'playing' ? 'Encaisser' : phase === 'lost' ? 'Réessayer' : 'Nouvelle partie');
  const gainTitle = $derived(phase === 'ready' ? 'Gain de la manche' : phase === 'playing' ? 'À encaisser' : phase === 'lost' ? 'Mise perdue' : 'Encaissé');
  let lastWin = $state<number | null>(null);
  $effect(() => { if (phase === 'cashedOut') lastWin = payout; else if (phase === 'lost') lastWin = 0; });

  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let direction = $state(1);
  const quickIndex = $derived(config.quickBetAmounts.indexOf(amount));
  let indicatorIndex = $state(0);
  $effect(() => { if (quickIndex >= 0) indicatorIndex = quickIndex; });
  function chooseAmount(value: number) {
    if (value === amount) return;
    direction = value > amount ? 1 : -1;
    onamount(value);
  }

</script>

<section class="hud" class:no-round={phase === 'ready'} data-layout={layout} aria-label="Commandes révélation">
  <PanelMenu onopen={onmenu} />
  {#if layout === 'portrait'}<HudStats balance={config.balance} {lastWin} />{/if}
  {#if phase !== 'ready'}
  <div class="card tile round" data-phase={phase === 'playing' ? 'running' : phase === 'lost' ? 'ended' : 'cashedOut'}>
    <span class="tile-icon" aria-hidden="true"><Icon name={phase === 'lost' ? 'fall' : phase === 'cashedOut' ? 'check' : 'coins'} size={22} /></span>
    <div class="tile-text"><span class="caption">{gainTitle}</span><p class="tile-value"><output aria-label="Gain de la manche" aria-live="polite">{formatDecimal(payout)}</output><small>FCFA</small></p><span class="tile-detail">{revealed} / {totalSafe} trésors · ×{formatDecimal(multiplier)}</span></div>
  </div>
  {/if}
  <button class="card tile auto risk" data-difficulty={difficulty} aria-label="Choisir la difficulté" aria-haspopup="dialog" disabled={locked} onclick={() => difficultySheet.open()}>
    {#if layout === 'portrait'}<span class="compact-label">{difficulties[difficulty].label}</span>{/if}
    <span class="tile-icon" aria-hidden="true"><Icon name="shield" size={22} /></span>
    <span class="tile-text"><span class="caption">{locked ? 'Difficulté verrouillée' : phase === 'cashedOut' || phase === 'lost' ? 'Prochaine partie' : 'Difficulté'}</span><span class="tile-value">{#key difficulty}<strong in:fly={{ y: 5, duration: reduceMotion ? 0 : 180 }}>{difficulties[difficulty].label}</strong>{/key}</span><span class="tile-detail">{difficulties[difficulty].traps.length} piège{difficulties[difficulty].traps.length > 1 ? 's' : ''} · 16 cases</span></span>
    <span class="chevron" aria-hidden="true"><Icon name={locked ? 'lock' : 'chevron'} size={18} /></span>
  </button>
  <div class="card bet" class:locked={locked}>
    <div class="stepper">
      <button class="step" disabled={locked || betIndex === 0} aria-label="Diminuer la mise" onclick={() => chooseAmount(config.betAmountOptions[betIndex - 1])}><Icon name="minus" size={22} /></button>
      <button class="amount" aria-label="Modifier le montant de la mise" aria-haspopup="dialog" disabled={locked} onclick={() => betSheet.open()}>
        <span class="caption">{#if locked}<Icon name="lock" size={12} />Mise verrouillée{:else}Mise{/if}</span>
        <strong>{#key amount}<span class="amount-value" in:fly={{ y: direction * 10, duration: reduceMotion ? 0 : 220 }}>{formatNumber(amount)}</span>{/key}<small>FCFA</small>{#if !locked}<Icon name="chevronDown" size={14} />{/if}</strong>
      </button>
      <button class="step" disabled={locked || betIndex === config.betAmountOptions.length - 1} aria-label="Augmenter la mise" onclick={() => chooseAmount(config.betAmountOptions[betIndex + 1])}><Icon name="plus" size={22} /></button>
    </div>
    <div class="chips" role="group" aria-label="Montants rapides" style:--i={indicatorIndex}>
      <span class="indicator" class:hidden={quickIndex < 0} aria-hidden="true"></span>
      {#each config.quickBetAmounts as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}
    </div>
  </div>
  
  <button class="primary" data-action={locked && revealed > 0 ? 'cashout' : 'bet'} disabled={locked && revealed === 0} aria-label={phase === 'playing' ? `Encaisser ${formatDecimal(payout)} FCFA` : action} onclick={onprimary}>
    <span class="shine" aria-hidden="true"></span>
    {#key phase}
      <span class="primary-content" in:fly={{ y: 8, duration: reduceMotion ? 0 : 220 }}>
        <span class="primary-icon" aria-hidden="true"><Icon name={locked ? 'wallet' : 'play'} size={22} /></span>
        <span class="primary-text"><span class="primary-label">{action}</span>{#if phase !== 'ready'}<span class="primary-detail">{locked ? revealed === 0 ? 'Révélez d’abord une case' : `${formatDecimal(payout)} FCFA` : 'Revenir à la grille'}</span>{/if}</span>
      </span>
    {/key}
    
  </button>
</section>

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}><p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p><div class="options" role="group" aria-label="Montants de mise">{#each config.betAmountOptions as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}</div></Sheet>
<Sheet bind:this={difficultySheet} title="Choisir la difficulté" closeLabel="Fermer la difficulté" {layout}>
  <p class="selected difficulty-intro">Plus de pièges, plus de risque et une progression plus rapide.</p>
  <div class="difficulty-picker" data-difficulty={difficulty}>
    <DifficultySelector options={difficultyOptions} value={difficulty} disabled={locked} onchange={ondifficulty} />
    <div class="difficulty-summary" aria-live="polite" aria-atomic="true">
      <span class="summary-item treasures"><span class="summary-icon"><Icon name="gem" size={20} /></span><span><strong>{16 - difficulties[difficulty].traps.length} trésors</strong><small>À découvrir</small></span></span>
      <span class="summary-item traps"><span class="summary-icon"><Icon name="mine" size={20} /></span><span><strong>{difficulties[difficulty].traps.length} piège{difficulties[difficulty].traps.length > 1 ? 's' : ''}</strong><small>À éviter</small></span></span>
    </div>
  </div>
  <p class="note difficulty-note">Ce choix s’applique à la prochaine manche. Grille fixe de démonstration.</p>
</Sheet>

<style>
  [data-difficulty='calme'] { --tone:#6ee7b7; --tint:#34d3991f; }
  [data-difficulty='normal'] { --tone:#c4b5fd; --tint:#a78bfa24; }
  [data-difficulty='expert'] { --tone:#fda4af; --tint:#fb71851f; }
  .risk .tile-value strong { color: var(--tone); }
  .risk:disabled { opacity: 1; }
  .selected { color: var(--muted); font-size: 15px; line-height: 1.5; }
  .selected strong { color: var(--text); }
  .difficulty-summary { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:16px; padding:14px; border:1px solid var(--line); border-radius:16px; background:var(--surface-2); }
  .summary-item { min-width:0; display:flex; align-items:center; gap:10px; }
  .summary-item > span:last-child { display:grid; gap:3px; }
  .summary-icon { display:grid; place-items:center; flex:0 0 36px; height:36px; border-radius:11px; }
  .summary-item strong { font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; }
  .summary-item small { color:var(--muted); font-size:12px; }
  .treasures .summary-icon { color:var(--win); background:#34d3991a; }
  .traps .summary-icon { color:var(--tone); background:var(--tint); transition:color .25s,background-color .25s; }
  @media (max-width:359px) { .difficulty-summary { padding:10px; gap:8px; } .summary-item { gap:6px; } .summary-icon { flex-basis:28px; height:32px; } }
  @media (max-height:500px) and (min-width:600px) {
    .difficulty-intro,.difficulty-note { display:none; }
    .difficulty-summary { margin-top:10px; padding:0 8px; border:0; background:transparent; }
    .summary-icon { flex-basis:24px; height:24px; border-radius:7px; }
    .summary-item small { display:none; }
  }
  @media (prefers-reduced-motion:reduce) { .traps .summary-icon { transition:none; } }
</style>
