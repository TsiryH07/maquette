<script lang="ts">
  import { fly } from 'svelte/transition';
  import Sheet from './Sheet.svelte';
  import '../game/hud.css';
  import config from '../game.config';
  import { formatDecimal, formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import Icon from './Icon.svelte';
  let { layout, amount, locked, win, turbo, autoRemaining, freeRemaining, onsetamount, onmodes, onspin, onstop }: {
    layout: LayoutType; amount: number; locked: boolean; win: number; turbo: boolean; autoRemaining: number; freeRemaining: number;
    onsetamount: (value:number)=>void; onmodes:()=>void; onspin:()=>void; onstop:()=>void;
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
<section class="hud" data-layout={layout} aria-label="Commandes slots">
  <div class="card tile round" data-phase={freeRemaining ? 'queued' : win ? 'cashedOut' : 'betting'}>
    <span class="tile-icon" aria-hidden="true"><Icon name={freeRemaining ? 'star' : 'coins'} size={22} /></span>
    <div class="tile-text"><span class="caption">{freeRemaining ? 'Tours gratuits' : 'Gain du tour'}</span><p class="tile-value"><output aria-label="Gain du tour" aria-live="polite">{freeRemaining ? freeRemaining : win ? formatDecimal(win) : '—'}</output>{#if freeRemaining || win}<small>{freeRemaining ? 'restants' : 'FCFA'}</small>{/if}</p><span class="tile-detail">{freeRemaining ? 'Sans nouvelle mise' : 'Résultat du tour'}</span></div>
  </div>
  <button class="card tile auto mode-entry" data-mode={freeRemaining > 0 ? 'bonus' : autoRemaining > 0 ? 'auto' : 'manual'} class:enabled={turbo || autoRemaining > 0 || freeRemaining > 0} aria-label="Ouvrir les options de jeu" aria-haspopup="dialog" onclick={onmodes}>
    <span class="tile-icon" aria-hidden="true"><Icon name={autoRemaining ? 'repeat' : freeRemaining ? 'star' : 'spin'} size={22} /></span>
    <span class="tile-text"><span class="caption">Mode de jeu</span><span class="tile-value"><strong>{autoRemaining ? `Auto · ${autoRemaining}` : freeRemaining ? 'Bonus' : 'Manuel'}</strong></span><span class="tile-detail">{autoRemaining ? 'Série en cours' : freeRemaining ? `${freeRemaining} tours gratuits` : turbo ? 'Turbo activé' : 'Un tour à la fois'}</span></span>
    <span class="chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
  </button>
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
  
  <button class="primary" data-action={autoRemaining > 0 ? 'cancel' : locked ? 'busy' : 'bet'} disabled={locked && autoRemaining === 0} aria-label={autoRemaining > 0 ? 'Arrêter le jeu automatique' : locked ? 'Rouleaux en mouvement' : freeRemaining ? 'Lancer un tour gratuit' : `Lancer pour ${formatMoney(amount)}`} onclick={autoRemaining > 0 ? onstop : onspin}>
    <span class="shine" aria-hidden="true"></span>
    {#key autoRemaining > 0 ? 'auto' : locked ? 'busy' : freeRemaining ? 'free' : 'play'}
      <span class="primary-content" in:fly={{ y: 8, duration: reduceMotion ? 0 : 220 }}>
        <span class="primary-icon" aria-hidden="true"><Icon name={autoRemaining > 0 ? 'stop' : locked ? 'clock' : 'spin'} size={22} /></span>
        <span class="primary-text"><span class="primary-label">{autoRemaining > 0 ? 'Arrêter l’auto' : locked ? 'Les rouleaux tournent' : freeRemaining ? 'Tour gratuit' : 'Lancer'}</span><span class="primary-detail">{autoRemaining > 0 ? `${autoRemaining} tours restants` : locked ? 'Un instant…' : freeRemaining ? `${freeRemaining} tours restants` : formatMoney(amount)}</span></span>
      </span>
    {/key}
    {#if locked}<span class="waiting" aria-hidden="true"></span>{/if}
  </button>
</section>

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}>
  <p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p>
  <div class="options" role="group" aria-label="Montants de mise">{#each config.betAmountOptions as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked || freeRemaining > 0} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}</div>
</Sheet>
<style>
  .primary[data-action='bet'] .primary-icon :global(svg) { fill:none; stroke-width:1.8; transform:none; }
  .mode-entry[data-mode='manual'] { --tone:#6ee7b7; --tint:#34d39914; }
  .mode-entry[data-mode='auto'] { --tone:#c4b5fd; --tint:#a78bfa24; }
  .mode-entry[data-mode='bonus'] { --tone:#fbbf24; --tint:#fbbf241a; }
  .mode-entry .tile-value strong { color:var(--tone); }
</style>
