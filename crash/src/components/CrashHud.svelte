<script lang="ts">
  import config from '../game.config';
  import { formatDecimal, formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import { scenarios, type Scenario } from '../game/scenarios';
  import Sheet from './Sheet.svelte';
  import CasinoControlDock from '../../../src/lib/CasinoControlDock.svelte';
  import CrashAutoModal, { type CrashAutoPlan } from '../../../src/lib/CrashAutoModal.svelte';
  import type { HistoryEntry } from '../../../src/lib/CasinoControlDock.svelte';

  let { scenario = 'betting', layout = 'desktop', balance = config.balance, multiplier, history = config.history, autoRunning = false, autoLeft = '',
    onaction, onmenu, onautostart, onautostop }: {
    scenario?: Scenario;
    layout?: LayoutType;
    balance?: number;
    /** Multiplicateur affiché (manche simulée du jeu automatique) ; sinon celui du scénario. */
    multiplier?: number;
    /** Multiplicateurs des dernières manches, la plus récente en premier (bouton HISTORIQUE du portrait). */
    history?: readonly number[];
    autoRunning?: boolean;
    /** Tours restants de la série (« 7 tours », « ∞ tours »). */
    autoLeft?: string;
    onaction?: () => void;
    onmenu: () => void;
    onautostart: (plan: CrashAutoPlan, bet: number) => void;
    onautostop: () => void;
  } = $props();

  const steps = config.betAmountOptions;
  let amount = $state(config.bet);
  let betSheet: ReturnType<typeof Sheet>;
  let autoModal: ReturnType<typeof CrashAutoModal>;
  // Même étagement de couleurs que les pastilles au-dessus de la courbe.
  const rounds = $derived<HistoryEntry[]>(history.map((value) => ({
    label: `${formatDecimal(value)}×`,
    tier: value >= 10 ? 'high' : value >= 2 ? 'mid' : 'low',
  })));
  const locked = $derived(scenario === 'running' || scenario === 'queued' || autoRunning);
  const canCashout = $derived(scenario === 'running');

  function setAmount(value: number) {
    if (value !== amount) amount = value;
  }
  // Le gain garde les centimes : 10 FCFA à ×2,35 donnent 23,50 FCFA.
  const payout = $derived(Math.round(amount * (multiplier ?? scenarios[scenario].multiplier) * 100) / 100);
  // Jeu automatique : pendant la manche JOUER reste ENCAISSER ; entre deux manches il devient « Arrêter ».
  const stopsAuto = $derived(autoRunning && !canCashout);
  const primaryAction = $derived(canCashout ? 'cashout' : stopsAuto || scenario === 'queued' ? 'cancel' : 'bet');
  const action = $derived(canCashout ? 'Encaisser' : stopsAuto ? 'Arrêter' : scenario === 'queued' ? 'Annuler' : 'Miser');
  const actionDetail = $derived(canCashout ? `${formatDecimal(payout)} FCFA` : stopsAuto ? autoLeft : null);
  const actionLabel = $derived(canCashout ? `Encaisser ${actionDetail}` : stopsAuto ? `Arrêter le jeu automatique, encore ${autoLeft}` : scenario === 'queued' ? 'Annuler la mise' : 'Miser');
</script>

<!-- Tous les formats, portrait compris : dock commun (disposition de poulet-banane en portrait). -->
<CasinoControlDock portrait={layout === 'portrait'} floating={false} {balance} bind:bet={amount} betOptions={steps}
  onbetclick={() => betSheet.open()} difficulties={[]} isAuto={autoRunning} onautoclick={() => (autoRunning ? onautostop() : autoModal.open())}
  autoAriaLabel={autoRunning ? 'Arrêter le jeu automatique' : undefined} showTurbo={false}
  history={rounds} historyTitle="Dernières manches"
  gameType="crash" isPlaying={scenario === 'running'} betLocked={scenario === 'queued' || autoRunning} currentWinAmount={payout} oncashout={() => onaction?.()}
  playLabel={primaryAction === 'bet' ? 'Jouer' : action} playDetail={actionDetail ?? undefined} playAction={primaryAction}
  playAriaLabel={primaryAction === 'bet' ? 'Jouer' : actionLabel} onplay={() => onaction?.()} {onmenu} />

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}>
  <p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p>
  <div class="options" role="group" aria-label="Montants de mise">
    {#each steps as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => setAmount(value)}>{formatNumber(value)}</button>{/each}
  </div>
</Sheet>

<!-- AUTO : nombre de tours, encaissement auto (cible d'avia-djo), AVANCÉ (objectif de gain / limite de perte) et ACTIVER. -->
<CrashAutoModal bind:this={autoModal} bet={amount} onstart={(plan) => onautostart(plan, amount)} />

<style>
  button:disabled { opacity: 0.4; }

  .options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  .chip { min-height: 40px; padding: 4px; border: 1px solid var(--line-strong); border-radius: 10px; color: var(--text); background: transparent; font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .chip:hover:enabled:not([aria-pressed='true']) { background: var(--surface-3); }
  .chip[aria-pressed='true'] { border-color: var(--accent); color: #e9e2ff; background: var(--accent-soft); }

  .selected { margin: 0 0 16px; color: var(--muted); font-size: 15px; }
  .selected strong { margin-left: 4px; color: var(--text); font-size: 18px; }
  .options .chip { min-height: 48px; font-size: 16px; }
</style>
