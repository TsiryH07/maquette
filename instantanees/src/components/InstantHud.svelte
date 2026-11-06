<script lang="ts">
  import { fly } from 'svelte/transition';
  import config from '../game.config';
  import HudStats from '../../../src/lib/HudStats.svelte';
  import PanelMenu from '../../../src/lib/PanelMenu.svelte';
  import { formatDecimal, formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import { risks, type Risk, type Scenario } from '../game/scenarios';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';
  import '../game/hud.css';
  let { scenario, layout, amount = $bindable(config.bet), risk, payout, onaction, onmenu }: { scenario: Scenario; layout: LayoutType; amount?: number; risk: Risk; payout: number; onaction: () => void; onmenu: () => void } = $props();
  let auto = $state(false);
  let rounds = $state('10');
  const roundOptions = ['10', '25', '50'];
  let betSheet: ReturnType<typeof Sheet>;
  let autoSheet: ReturnType<typeof Sheet>;
  const locked = $derived(scenario === 'playing');
  const index = $derived(config.betAmountOptions.indexOf(amount));
  const potential = $derived(Math.round(amount * risks[risk].factor * 100) / 100);
  const resultValue = $derived(scenario === 'won' ? payout : scenario === 'lost' ? 0 : null);
  const action = $derived(locked ? 'Lancer en cours' : scenario === 'ready' ? 'Jouer' : 'Rejouer');
  let lastWin = $state<number | null>(null);
  $effect(() => { if (scenario === 'won') lastWin = payout; else if (scenario === 'lost') lastWin = 0; });

  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let direction = $state(1);
  const quickIndex = $derived(config.quickBetAmounts.indexOf(amount));
  let indicatorIndex = $state(0);
  $effect(() => { if (quickIndex >= 0) indicatorIndex = quickIndex; });
  function chooseAmount(value: number) {
    if (value === amount) return;
    direction = value > amount ? 1 : -1;
    amount = value;
  }

</script>

<section class="hud" data-layout={layout} aria-label="Commandes des jeux instantanés">
  <PanelMenu onopen={onmenu} />
  {#if layout === 'portrait'}<HudStats balance={config.balance} {lastWin} />{/if}
  <div class="card tile round" data-result={scenario}>
    <span class="tile-icon" aria-hidden="true"><Icon name="coins" size={22} /></span>
    <div class="tile-text"><span class="caption">{resultValue === null ? 'Gain possible' : 'Dernier gain'}</span><p class="tile-value"><output aria-label="Gain affiché" aria-live="polite">{formatDecimal(resultValue ?? potential)}</output><small>FCFA</small></p><span class="tile-detail">{resultValue === null ? `${risks[risk].label} · ${risks[risk].hint}` : scenario === 'won' ? 'Résultat gagné' : 'Résultat sous l’objectif'}</span></div>
  </div>
  <button class="card tile auto" class:enabled={auto} aria-label="Ouvrir le jeu automatique" aria-haspopup="dialog" onclick={() => autoSheet.open()}>
    {#if layout === 'portrait'}<span class="compact-label">Auto</span>{/if}
    <span class="tile-icon" aria-hidden="true"><Icon name="repeat" size={22} /></span><span class="tile-text"><span class="caption">Jeu auto</span><span class="tile-value"><strong>{auto ? `${rounds} parties` : 'Désactivé'}</strong></span><span class="tile-detail">{auto ? 'Aperçu activé' : 'Au choix'}</span></span><span class="chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
  </button>
  <div class="card bet" class:locked={locked}>
    <div class="stepper">
      <button class="step" disabled={locked || index === 0} aria-label="Diminuer la mise" onclick={() => chooseAmount(config.betAmountOptions[index - 1])}><Icon name="minus" size={22} /></button>
      <button class="amount" aria-label="Modifier le montant de la mise" aria-haspopup="dialog" disabled={locked} onclick={() => betSheet.open()}>
        <span class="caption">{#if locked}<Icon name="lock" size={12} />Mise verrouillée{:else}Mise{/if}</span>
        <strong>{#key amount}<span class="amount-value" in:fly={{ y: direction * 10, duration: reduceMotion ? 0 : 220 }}>{formatNumber(amount)}</span>{/key}<small>FCFA</small>{#if !locked}<Icon name="chevronDown" size={14} />{/if}</strong>
      </button>
      <button class="step" disabled={locked || index === config.betAmountOptions.length - 1} aria-label="Augmenter la mise" onclick={() => chooseAmount(config.betAmountOptions[index + 1])}><Icon name="plus" size={22} /></button>
    </div>
    <div class="chips" role="group" aria-label="Montants rapides" style:--i={indicatorIndex}>
      <span class="indicator" class:hidden={quickIndex < 0} aria-hidden="true"></span>
      {#each config.quickBetAmounts as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}
    </div>
  </div>
  
  <button class="primary" data-action={locked ? 'busy' : 'bet'} disabled={locked} aria-label={action} onclick={onaction}>
    <span class="shine" aria-hidden="true"></span>
    {#key scenario}
      <span class="primary-content" in:fly={{ y: 8, duration: reduceMotion ? 0 : 220 }}>
        <span class="primary-icon" aria-hidden="true"><Icon name={locked ? 'clock' : 'play'} size={22} /></span>
        <span class="primary-text"><span class="primary-label">{action}</span></span>
      </span>
    {/key}
    {#if locked}<span class="waiting" aria-hidden="true"></span>{/if}
  </button>
</section>

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}><p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p><div class="options" role="group" aria-label="Montants de mise">{#each config.betAmountOptions as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}</div></Sheet>
<Sheet bind:this={autoSheet} title="Jeu automatique" closeLabel="Fermer le jeu automatique" {layout}>
  <label class="row"><span><strong>Jeu automatique</strong><small>Conserver la mise et le risque choisis.</small></span><input type="checkbox" aria-label="Activer le jeu automatique" bind:checked={auto} disabled={locked} /></label>
  <div class="rounds">
    <span>Nombre de parties</span>
    <div class="chips" role="group" aria-label="Nombre de parties" style:--i={roundOptions.indexOf(rounds)}>
      <span class="indicator" aria-hidden="true"></span>
      {#each roundOptions as value}
        <button class="chip" aria-label={`${value} parties`} aria-pressed={rounds === value} disabled={locked} onclick={() => rounds = value}>{value}</button>
      {/each}
    </div>
  </div>
  <p class="note">Option illustrative : aucune boucle de parties n’est lancée.</p>
</Sheet>

<style>
  .round[data-result='ready'] { --tone: var(--accent); --tint: #a78bfa1f; }
  .round[data-result='won'] { --tone: var(--win); --tint: #34d3992e; }
  .round[data-result='lost'] { --tone: var(--loss); --tint: #fb718524; }
  .rounds { display:grid; gap:8px; margin-top:18px; font-size:16px; }
  .rounds .chips { grid-template-columns:repeat(3, minmax(0, 1fr)); }
  .rounds .indicator { width:calc((100% - 12px) / 3); }
  .rounds .chip { min-height:44px; }
  @media (prefers-reduced-motion: reduce) { .rounds .chip { transition:none; } }
</style>
