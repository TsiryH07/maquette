<script lang="ts">
  import { fly } from 'svelte/transition';
  import Sheet from './Sheet.svelte';
  import '../game/hud.css';
  import config from '../game.config';
  import HudStats from '../../../src/lib/HudStats.svelte';
  import PanelMenu from '../../../src/lib/PanelMenu.svelte';
  import { formatDecimal, formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import Icon from './Icon.svelte';
  let { layout, amount, locked, win, turbo, autoRemaining, freeRemaining, onsetamount, onmodes, onspin, onstop, onmenu }: {
    layout: LayoutType; amount: number; locked: boolean; win: number; turbo: boolean; autoRemaining: number; freeRemaining: number;
    onsetamount: (value:number)=>void; onmodes:()=>void; onspin:()=>void; onstop:()=>void;
    onmenu:()=>void;
  } = $props();
  const index = $derived(config.betAmountOptions.indexOf(amount));
  let betSheet: ReturnType<typeof Sheet>;

  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let direction = $state(1);
  const quickIndex = $derived(config.quickBetAmounts.indexOf(amount));
  let indicatorIndex = $state(0);
  $effect(() => { if (quickIndex >= 0) indicatorIndex = quickIndex; });
  function chooseAmount(value: number) {
    if (value === amount) return;
    direction = value > amount ? 1 : -1;
    onsetamount(value);
  }

</script>
<section class="hud slot-controls" class:no-round={!freeRemaining && !win} data-layout={layout} aria-label="Commandes slots">
  <PanelMenu onopen={onmenu} />
  {#if layout === 'portrait'}<HudStats balance={config.balance} lastWin={win} />{/if}
  {#if freeRemaining > 0 || win > 0}
  <div class="card tile round" data-phase={freeRemaining ? 'queued' : win ? 'cashedOut' : 'betting'}>
    <span class="tile-icon" aria-hidden="true"><Icon name={freeRemaining ? 'star' : 'coins'} size={22} /></span>
    <div class="tile-text"><span class="caption">{freeRemaining ? 'Tours gratuits' : 'Gain du tour'}</span><p class="tile-value"><output aria-label="Gain du tour" aria-live="polite">{freeRemaining ? freeRemaining : formatDecimal(win)}</output><small>{freeRemaining ? 'restants' : 'FCFA'}</small></p><span class="tile-detail">{freeRemaining ? 'Sans nouvelle mise' : 'Résultat du tour'}</span></div>
  </div>
  {/if}
  <div class="card bet" class:locked={locked || freeRemaining > 0}>
    <div class="stepper">
      <button class="step" disabled={locked || freeRemaining > 0 || index === 0} aria-label="Diminuer la mise" onclick={() => chooseAmount(config.betAmountOptions[index - 1])}><Icon name="minus" size={22} /></button>
      <button class="amount" aria-label="Modifier le montant de la mise" aria-haspopup="dialog" disabled={locked || freeRemaining > 0} onclick={() => betSheet.open()}>
        <span class="caption">{#if locked || freeRemaining > 0}<Icon name="lock" size={12} />Mise verrouillée{:else}Mise{/if}</span>
        <strong>{#key amount}<span class="amount-value" in:fly={{ y: direction * 10, duration: reduceMotion ? 0 : 220 }}>{formatNumber(amount)}</span>{/key}<small>FCFA</small>{#if !locked || freeRemaining > 0}<Icon name="chevronDown" size={14} />{/if}</strong>
      </button>
      <button class="step" disabled={locked || freeRemaining > 0 || index === config.betAmountOptions.length - 1} aria-label="Augmenter la mise" onclick={() => chooseAmount(config.betAmountOptions[index + 1])}><Icon name="plus" size={22} /></button>
    </div>
    <div class="chips" role="group" aria-label="Montants rapides" style:--i={indicatorIndex}>
      <span class="indicator" class:hidden={quickIndex < 0} aria-hidden="true"></span>
      {#each config.quickBetAmounts as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked || freeRemaining > 0} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}
    </div>
  </div>
  
  <button class="primary" data-action={autoRemaining > 0 ? 'cancel' : locked ? 'busy' : 'bet'} disabled={locked && autoRemaining === 0} aria-label={autoRemaining > 0 ? 'Arrêter le jeu automatique' : locked ? 'Rouleaux en mouvement' : freeRemaining ? 'Lancer un tour gratuit' : 'Lancer'} onclick={autoRemaining > 0 ? onstop : onspin}>
    <span class="shine" aria-hidden="true"></span>
    {#key autoRemaining > 0 ? 'auto' : locked ? 'busy' : freeRemaining ? 'free' : 'play'}
      <span class="primary-content" in:fly={{ y: 8, duration: reduceMotion ? 0 : 220 }}>
        <span class="primary-icon" aria-hidden="true"><Icon name={autoRemaining > 0 ? 'stop' : locked ? 'clock' : 'spin'} size={22} /></span>
        <span class="primary-text"><span class="primary-label">{autoRemaining > 0 ? 'Arrêter l’auto' : locked ? 'En cours' : freeRemaining ? 'Tour gratuit' : 'Lancer'}</span>{#if autoRemaining > 0 || freeRemaining > 0}<span class="primary-detail">{autoRemaining > 0 ? `${autoRemaining} tours restants` : `${freeRemaining} tours restants`}</span>{/if}</span>
      </span>
    {/key}
    {#if locked}<span class="waiting" aria-hidden="true"></span>{/if}
  </button>
  <button class="auto auto-button" data-mode={freeRemaining > 0 ? 'bonus' : autoRemaining > 0 ? 'auto' : 'manual'} class:enabled={autoRemaining > 0} aria-label="Configurer le jeu automatique" title={turbo ? 'Configurer le jeu automatique · Turbo activé' : 'Configurer le jeu automatique'} aria-haspopup="dialog" onclick={onmodes}>
    <Icon name="repeat" size={22} />
    <span class="compact-label">Auto</span>
    {#if autoRemaining > 0 || freeRemaining > 0}<small aria-label={autoRemaining > 0 ? `${autoRemaining} tours automatiques restants` : `${freeRemaining} tours gratuits restants`} title={autoRemaining > 0 ? `${autoRemaining} tours automatiques restants` : `${freeRemaining} tours gratuits restants`}>{layout === 'portrait' ? autoRemaining || freeRemaining : autoRemaining > 0 ? `${autoRemaining} tours` : `${freeRemaining} gratuits`}</small>{/if}
  </button>
</section>

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}>
  <p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p>
  <div class="options" role="group" aria-label="Montants de mise">{#each config.betAmountOptions as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked || freeRemaining > 0} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}</div>
</Sheet>
<style>
  .primary[data-action='bet'] .primary-icon :global(svg) { fill:none; stroke-width:1.8; transform:none; }
  .auto-button { grid-area:automatic; justify-self:center; align-self:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; width:76px; min-height:60px; padding:4px; border:0; border-radius:12px; color:var(--muted); background:transparent; }
  .auto-button:hover { color:var(--text); background:#ffffff08; }
  .auto-button.enabled { color:var(--accent); }
  .compact-label { font-size:12px; font-weight:600; }
  .auto-button small { order:2; font-size:10px; line-height:12px; color:var(--accent); }
</style>
