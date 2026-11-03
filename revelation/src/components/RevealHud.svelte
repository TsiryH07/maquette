<script lang="ts">
  import { fly } from 'svelte/transition';
  import '../game/hud.css';
  import config, { difficulties, type Difficulty } from '../game.config';
  import { formatDecimal, formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import type { Scenario } from '../game/scenarios';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  let { amount, difficulty, phase, payout, multiplier, revealed, totalSafe, layout, onamount, ondifficulty, onprimary }: {
    amount: number; difficulty: Difficulty; phase: Scenario; payout: number; multiplier: number;
    revealed: number; totalSafe: number; layout: LayoutType;
    onamount: (value: number) => void; ondifficulty: (value: Difficulty) => void; onprimary: () => void;
  } = $props();
  let betSheet: ReturnType<typeof Sheet>;
  let difficultySheet: ReturnType<typeof Sheet>;
  const difficultyTypes = Object.keys(difficulties) as Difficulty[];
  const locked = $derived(phase === 'playing');
  const betIndex = $derived(config.betAmountOptions.indexOf(amount));
  const action = $derived(phase === 'ready' ? 'Commencer' : phase === 'playing' ? 'Encaisser' : phase === 'lost' ? 'Réessayer' : 'Nouvelle partie');
  const gainTitle = $derived(phase === 'ready' ? 'Gain de la manche' : phase === 'playing' ? 'À encaisser' : phase === 'lost' ? 'Mise perdue' : 'Encaissé');

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

<section class="hud" data-layout={layout} aria-label="Commandes révélation">
  <div class="card tile round" data-phase={phase === 'ready' ? 'betting' : phase === 'playing' ? 'running' : phase === 'lost' ? 'ended' : 'cashedOut'}>
    <span class="tile-icon" aria-hidden="true"><Icon name={phase === 'lost' ? 'fall' : phase === 'cashedOut' ? 'check' : 'coins'} size={22} /></span>
    <div class="tile-text"><span class="caption">{gainTitle}</span><p class="tile-value"><output aria-label="Gain de la manche" aria-live="polite">{phase === 'ready' ? '—' : formatDecimal(payout)}</output>{#if phase !== 'ready'}<small>FCFA</small>{/if}</p><span class="tile-detail">{phase === 'ready' ? 'Révélez, puis encaissez' : `${revealed} / ${totalSafe} trésors · ×${formatDecimal(multiplier)}`}</span></div>
  </div>
  <button class="card tile auto risk" data-difficulty={difficulty} aria-label="Choisir la difficulté" aria-haspopup="dialog" disabled={locked} onclick={() => difficultySheet.open()}>
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
  
  <button class="primary" data-action={locked && revealed > 0 ? 'cashout' : 'bet'} disabled={locked && revealed === 0} aria-label={phase === 'ready' ? `Commencer ${formatMoney(amount)}` : phase === 'playing' ? `Encaisser ${formatDecimal(payout)} FCFA` : action} onclick={onprimary}>
    <span class="shine" aria-hidden="true"></span>
    {#key phase}
      <span class="primary-content" in:fly={{ y: 8, duration: reduceMotion ? 0 : 220 }}>
        <span class="primary-icon" aria-hidden="true"><Icon name={locked ? 'wallet' : 'play'} size={22} /></span>
        <span class="primary-text"><span class="primary-label">{action}</span><span class="primary-detail">{locked ? revealed === 0 ? 'Révélez d’abord une case' : `${formatDecimal(payout)} FCFA` : phase === 'ready' ? formatMoney(amount) : 'Revenir à la grille'}</span></span>
      </span>
    {/key}
    
  </button>
</section>

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}><p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p><div class="options" role="group" aria-label="Montants de mise">{#each config.betAmountOptions as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}</div></Sheet>
<Sheet bind:this={difficultySheet} title="Choisir la difficulté" closeLabel="Fermer la difficulté" {layout}>
  <p class="selected difficulty-intro">Plus de pièges, plus de risque et une progression plus rapide.</p>
  <div class="difficulty-picker" data-difficulty={difficulty}>
    <div class="risk-options" role="group" aria-label="Niveaux de difficulté" style:--difficulty-index={difficultyTypes.indexOf(difficulty)}>
      <span class="difficulty-selection" aria-hidden="true"></span>
      {#each difficultyTypes as key}
        {@const item = difficulties[key]}
        <button class="risk-option" data-difficulty={key} aria-pressed={difficulty === key} disabled={locked} onclick={() => { if (difficulty !== key) ondifficulty(key); }}>
          <span class="difficulty-marker" aria-hidden="true"><span class="difficulty-symbol"><Icon name={key === 'calme' ? 'shield' : key === 'normal' ? 'gem' : 'mine'} size={17} /></span><span class="difficulty-check"><Icon name="check" size={13} /></span></span>
          <span class="difficulty-copy"><strong>{item.label}</strong><small>{item.traps.length} piège{item.traps.length > 1 ? 's' : ''}</small></span>
        </button>
      {/each}
    </div>
    <div class="difficulty-summary" aria-live="polite" aria-atomic="true">
      <span class="summary-item treasures"><span class="summary-icon"><Icon name="gem" size={20} /></span><span><strong>{16 - difficulties[difficulty].traps.length} trésors</strong><small>À découvrir</small></span></span>
      <span class="summary-item traps"><span class="summary-icon"><Icon name="mine" size={20} /></span><span><strong>{difficulties[difficulty].traps.length} piège{difficulties[difficulty].traps.length > 1 ? 's' : ''}</strong><small>À éviter</small></span></span>
    </div>
  </div>
  <p class="note difficulty-note">Ce choix s’applique à la prochaine manche. Grille fixe de démonstration.</p>
</Sheet>

<style>
  [data-difficulty='calme'] { --tone:#6ee7b7; --tint:#34d3991f; --difficulty-fill:#16372e; }
  [data-difficulty='normal'] { --tone:#c4b5fd; --tint:#a78bfa24; --difficulty-fill:#332151; }
  [data-difficulty='expert'] { --tone:#fda4af; --tint:#fb71851f; --difficulty-fill:#482332; }
  .risk .tile-value strong { color: var(--tone); }
  .risk:disabled { opacity: 1; }
  .selected { color: var(--muted); font-size: 15px; line-height: 1.5; }
  .selected strong { color: var(--text); }
  .risk-options { position:relative; isolation:isolate; overflow:hidden; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:3px; padding:4px; border:1px solid var(--line-strong); border-radius:22px; background:#0e0a19; box-shadow:inset 0 2px 8px #00000024; }
  .difficulty-selection { position:absolute; z-index:-1; inset:4px auto 4px 4px; width:calc((100% - 14px) / 3); border-radius:17px; background:linear-gradient(160deg,#ffffff0f,transparent 75%),var(--difficulty-fill); box-shadow:inset 0 1px 0 #ffffff1a; transform:translateX(calc(var(--difficulty-index) * (100% + 3px))); transition:transform .35s cubic-bezier(.22,1,.36,1),background-color .25s; pointer-events:none; }
  .risk-option { min-width:0; display:flex; align-items:center; justify-content:center; gap:7px; min-height:52px; padding:7px 5px; border:0; border-radius:17px; background:transparent; color:var(--text); font:inherit; text-align:left; -webkit-tap-highlight-color:transparent; transition:background-color .2s,transform .18s; }
  .risk-option:hover:enabled:not([aria-pressed='true']) { background:var(--tint); }
  .risk-option:active:enabled { transform:scale(.97); }
  .risk-option:focus-visible { outline:2px solid var(--tone); outline-offset:-3px; }
  .difficulty-copy { display:grid; gap:3px; }
  .risk-option strong { font-size:14px; font-weight:600; line-height:1.2; }
  .risk-option small { color:var(--muted); font-size:12px; line-height:1.2; transition:color .2s; }
  .risk-option[aria-pressed='true'] strong { color:var(--tone); }
  .risk-option[aria-pressed='true'] small { color:var(--text); }
  .difficulty-marker { position:relative; display:grid; place-items:center; flex:0 0 18px; height:18px; color:var(--tone); }
  .difficulty-symbol { display:grid; transition:opacity .18s,transform .2s; }
  .difficulty-check { position:absolute; inset:0; display:grid; place-items:center; border-radius:50%; color:var(--surface); background:var(--tone); opacity:0; transform:scale(.5); transition:opacity .18s,transform .25s cubic-bezier(.22,1,.36,1); }
  [aria-pressed='true'] .difficulty-symbol { opacity:0; transform:scale(.7); }
  [aria-pressed='true'] .difficulty-check { opacity:1; transform:scale(1); }
  .difficulty-summary { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:16px; padding:14px; border:1px solid var(--line); border-radius:16px; background:var(--surface-2); }
  .summary-item { min-width:0; display:flex; align-items:center; gap:10px; }
  .summary-item > span:last-child { display:grid; gap:3px; }
  .summary-icon { display:grid; place-items:center; flex:0 0 36px; height:36px; border-radius:11px; }
  .summary-item strong { font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; }
  .summary-item small { color:var(--muted); font-size:12px; }
  .treasures .summary-icon { color:var(--win); background:#34d3991a; }
  .traps .summary-icon { color:var(--tone); background:var(--tint); transition:color .25s,background-color .25s; }
  @media (max-width:359px) { .risk-option { gap:4px; } .risk-option strong { font-size:13px; } .difficulty-summary { padding:10px; gap:8px; } .summary-item { gap:6px; } .summary-icon { flex-basis:28px; height:32px; } }
  @media (max-height:500px) and (min-width:600px) {
    .difficulty-intro,.difficulty-note { display:none; }
    .difficulty-summary { margin-top:10px; padding:0 8px; border:0; background:transparent; }
    .summary-icon { flex-basis:24px; height:24px; border-radius:7px; }
    .summary-item small { display:none; }
  }
  @media (prefers-reduced-motion:reduce) { .difficulty-selection,.risk-option,.risk-option small,.difficulty-symbol,.difficulty-check,.traps .summary-icon { transition:none; } .risk-option:active:enabled { transform:none; } }
</style>
