<script lang="ts">
  import config from '../game.config';
  import { formatDecimal, formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import { scenarios, type Scenario } from '../game/scenarios';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';
  import CasinoControlDock from '../../../src/lib/CasinoControlDock.svelte';

  let { scenario = 'betting', layout = 'desktop', onaction, onmenu }: {
    scenario?: Scenario;
    layout?: LayoutType;
    onaction?: () => void;
    onmenu: () => void;
  } = $props();

  const steps = config.betAmountOptions;
  let amount = $state(config.bet);
  let autoBet = $state(false);
  let autoCashout = $state(false);
  let cashoutTarget = $state(2);
  let betSheet: ReturnType<typeof Sheet>;
  let autoSheet: ReturnType<typeof Sheet>;
  const locked = $derived(scenario === 'running' || scenario === 'queued');
  const canCashout = $derived(scenario === 'running');

  function setAmount(value: number) {
    if (value !== amount) amount = value;
  }
  // Le gain garde les centimes : 10 FCFA à ×2,35 donnent 23,50 FCFA.
  const payout = $derived(Math.round(amount * scenarios[scenario].multiplier * 100) / 100);
  const primaryAction = $derived(canCashout ? 'cashout' : scenario === 'queued' ? 'cancel' : 'bet');
  const action = $derived(canCashout ? 'Encaisser' : scenario === 'queued' ? 'Annuler' : 'Miser');
  const actionDetail = $derived(canCashout ? `${formatDecimal(payout)} FCFA` : null);
  const actionLabel = $derived(canCashout ? `Encaisser ${actionDetail}` : scenario === 'queued' ? 'Annuler la mise' : 'Miser');
  const autoEnabled = $derived(autoBet || autoCashout);

  function stepTarget(direction: number) {
    cashoutTarget = Math.min(100, Math.max(1.1, Math.round((cashoutTarget + direction * 0.1) * 10) / 10));
  }
</script>

<!-- Tous les formats, portrait compris : dock commun (disposition de poulet-banane en portrait). -->
<CasinoControlDock portrait={layout === 'portrait'} floating={false} balance={config.balance} bind:bet={amount} betOptions={steps}
  onbetclick={() => betSheet.open()} difficulties={[]} isAuto={autoEnabled} onautoclick={() => autoSheet.open()} showTurbo={false}
  gameType="crash" isPlaying={scenario === 'running'} betLocked={scenario === 'queued'} currentWinAmount={payout} oncashout={() => onaction?.()}
  playLabel={primaryAction === 'bet' ? 'Jouer' : action} playDetail={actionDetail ?? undefined} playAction={primaryAction}
  playAriaLabel={primaryAction === 'bet' ? 'Jouer' : actionLabel} onplay={() => onaction?.()} {onmenu} />

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}>
  <p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p>
  <div class="options" role="group" aria-label="Montants de mise">
    {#each steps as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => setAmount(value)}>{formatNumber(value)}</button>{/each}
  </div>
</Sheet>

<Sheet bind:this={autoSheet} title="Jeu automatique" closeLabel="Fermer les automatismes" {layout}>
  <label class="row"><span><strong>Encaissement automatique</strong><small>Encaisse dès que le multiplicateur atteint la cible.</small></span><input type="checkbox" aria-label="Encaissement automatique" bind:checked={autoCashout} disabled={locked} /></label>
  <div class="target" class:inactive={!autoCashout}>
    <button class="step" disabled={locked || !autoCashout || cashoutTarget <= 1.1} onclick={() => stepTarget(-1)} aria-label="Diminuer le multiplicateur automatique"><Icon name="minus" /></button>
    <output aria-label="Multiplicateur d’encaissement automatique" aria-live="polite">×{formatDecimal(cashoutTarget)}</output>
    <button class="step" disabled={locked || !autoCashout || cashoutTarget >= 100} onclick={() => stepTarget(1)} aria-label="Augmenter le multiplicateur automatique"><Icon name="plus" /></button>
  </div>
  <label class="row"><span><strong>Pari automatique</strong><small>Replace la même mise à chaque manche.</small></span><input type="checkbox" aria-label="Pari automatique" bind:checked={autoBet} disabled={locked} /></label>
  <p class="note">Options illustratives dans cette maquette.</p>
</Sheet>

<style>
  button:disabled { opacity: 0.4; }

  .step { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 1px solid var(--line); border-radius: 50%; color: var(--text); background: var(--surface-3); transition: background-color 0.15s, transform 0.1s; }
  .step:hover:enabled { border-color: var(--line-strong); background: #352c55; }
  .step:active:enabled { transform: scale(0.94); }

  .options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  .chip { min-height: 40px; padding: 4px; border: 1px solid var(--line-strong); border-radius: 10px; color: var(--text); background: transparent; font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .chip:hover:enabled:not([aria-pressed='true']) { background: var(--surface-3); }
  .chip[aria-pressed='true'] { border-color: var(--accent); color: #e9e2ff; background: var(--accent-soft); }

  .selected { margin: 0 0 16px; color: var(--muted); font-size: 15px; }
  .selected strong { margin-left: 4px; color: var(--text); font-size: 18px; }
  .options .chip { min-height: 48px; font-size: 16px; }
  .target { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
  .target output { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .target.inactive output { color: var(--muted); }
</style>
