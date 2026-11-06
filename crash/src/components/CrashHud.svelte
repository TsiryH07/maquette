<script lang="ts">
  import config from '../game.config';
  import HudStats from '../../../src/lib/HudStats.svelte';
  import PanelMenu from '../../../src/lib/PanelMenu.svelte';
  import { formatDecimal, formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import { scenarios, type Scenario } from '../game/scenarios';
  import { fly } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  let { scenario = 'betting', layout = 'desktop', onaction, onmenu }: {
    scenario?: Scenario;
    layout?: LayoutType;
    onaction?: () => void;
    onmenu: () => void;
  } = $props();

  const steps = config.betAmountOptions;
  const roundLabels: Record<Scenario, string> = {
    betting: 'Gain de la manche',
    queued: 'Mise en attente',
    running: 'Gain potentiel',
    cashedOut: 'Encaissé',
    ended: 'Mise perdue',
  };
  const roundIcons = { betting: 'coins', queued: 'clock', running: 'trend', cashedOut: 'check', ended: 'fall' } as const;
  let amount = $state(config.bet);
  let autoBet = $state(false);
  let autoCashout = $state(false);
  let cashoutTarget = $state(2);
  let betSheet: ReturnType<typeof Sheet>;
  let autoSheet: ReturnType<typeof Sheet>;
  const locked = $derived(scenario === 'running' || scenario === 'queued');
  const canCashout = $derived(scenario === 'running');
  const index = $derived(steps.indexOf(amount));
  // Sens du dernier changement : le chiffre arrive par le bas quand la mise augmente.
  let direction = $state(1);
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // La pastille violette glisse vers le montant rapide choisi et garde sa place
  // (masquée) quand la mise n'en fait pas partie, par exemple 10 ou 50.
  const quickIndex = $derived(config.quickBetAmounts.indexOf(amount));
  let indicatorIndex = $state(0);
  $effect(() => { if (quickIndex >= 0) indicatorIndex = quickIndex; });

  function setAmount(value: number) {
    if (value === amount) return;
    direction = value > amount ? 1 : -1;
    amount = value;
  }
  // Le gain garde les centimes : 10 FCFA à ×2,35 donnent 23,50 FCFA.
  const payout = $derived(Math.round(amount * scenarios[scenario].multiplier * 100) / 100);
  let settledAmount = $state(0);
  let lastWin = $state<number | null>(null);
  let settledBet = $state(0);
  let previousScenario: Scenario | undefined;
  $effect(() => {
    if (scenario !== previousScenario) {
      if (scenario === 'cashedOut') { settledAmount = payout; lastWin = payout; }
      if (scenario === 'ended') { settledAmount = amount; lastWin = 0; }
      settledBet = amount;
      previousScenario = scenario;
    }
  });
  // Avant le départ, l'encaissement automatique permet d'annoncer le gain visé.
  const targetPayout = $derived(scenario === 'betting' && autoCashout ? Math.round(amount * cashoutTarget * 100) / 100 : null);
  const roundValue = $derived(scenario === 'betting' ? targetPayout : scenario === 'queued' ? amount : scenario === 'running' ? payout : settledAmount);
  const roundCaption = $derived(targetPayout === null ? roundLabels[scenario] : 'Gain visé');
  const roundDetail = $derived.by(() => {
    const multiplier = formatDecimal(scenarios[scenario].multiplier);
    if (scenario === 'running') return `${formatNumber(amount)} × ${multiplier}`;
    if (scenario === 'cashedOut') return `Bénéfice +${formatDecimal(settledAmount - settledBet)}`;
    if (scenario === 'ended') return `Crash à ×${multiplier}`;
    if (scenario === 'queued') return 'Départ à la prochaine manche';
    return targetPayout === null ? 'Mise × multiplicateur' : `Encaissement à ×${formatDecimal(cashoutTarget)}`;
  });
  const primaryIcons = { bet: 'play', cashout: 'wallet', cancel: 'close' } as const;
  const primaryAction = $derived(canCashout ? 'cashout' : scenario === 'queued' ? 'cancel' : 'bet');
  const action = $derived(canCashout ? 'Encaisser' : scenario === 'queued' ? 'Annuler' : 'Miser');
  const actionDetail = $derived(canCashout ? `${formatDecimal(payout)} FCFA` : null);
  const actionLabel = $derived(canCashout ? `Encaisser ${actionDetail}` : scenario === 'queued' ? 'Annuler la mise' : 'Miser');
  const autoEnabled = $derived(autoBet || autoCashout);
  const autoValue = $derived(autoCashout ? `×${formatDecimal(cashoutTarget)}` : autoBet ? 'Activé' : 'Désactivé');

  function stepTarget(direction: number) {
    cashoutTarget = Math.min(100, Math.max(1.1, Math.round((cashoutTarget + direction * 0.1) * 10) / 10));
  }
</script>

<section class="hud" class:no-round={roundValue === null} data-layout={layout} aria-label="Commandes crash">
  <PanelMenu onopen={onmenu} />
  {#if layout === 'portrait'}<HudStats balance={config.balance} {lastWin} />{/if}
  {#if roundValue !== null}
  <div class="card tile round" data-phase={scenario} class:targeted={targetPayout !== null}>
    <span class="tile-icon" aria-hidden="true"><Icon name={roundIcons[scenario]} size={22} /></span>
    <div class="tile-text">
      <span class="caption">{roundCaption}</span>
      <p class="tile-value"><output aria-label="Montant de la manche" aria-live="polite">{formatDecimal(roundValue)}</output><small>FCFA</small></p>
      <span class="tile-detail">{roundDetail}</span>
    </div>
  </div>
  {/if}

  <button class="card tile auto" class:enabled={autoEnabled} aria-label="Ouvrir les automatismes" aria-haspopup="dialog" onclick={() => autoSheet.open()}>
    <span class="tile-icon" aria-hidden="true"><Icon name="repeat" size={22} /></span>
    {#if layout === 'portrait'}<span class="compact-label">Auto</span>{/if}
    <span class="tile-text">
      <span class="caption">{autoCashout ? 'Encaisse à' : 'Jeu auto'}</span>
      <span class="tile-value"><strong>{autoValue}</strong></span>
      <span class="flags"><span class:on={autoBet}>Pari</span><span class:on={autoCashout}>Encaisse</span></span>
    </span>
    <span class="chevron" aria-hidden="true"><Icon name="chevron" size={18} /></span>
  </button>

  <div class="card bet" class:locked>
    <div class="stepper">
      <button class="step" disabled={locked || index === 0} onclick={() => setAmount(steps[index - 1])} aria-label="Diminuer la mise"><Icon name="minus" size={22} /></button>
      <button class="amount" aria-label="Modifier le montant de la mise" aria-haspopup="dialog" disabled={locked} onclick={() => betSheet.open()}>
        <span class="caption">{#if locked}<Icon name="lock" size={12} />Mise verrouillée{:else}Mise{/if}</span>
        <strong>{#key amount}<span class="amount-value" in:fly={{ y: direction * 10, duration: reduceMotion ? 0 : 220 }}>{formatNumber(amount)}</span>{/key}<small>FCFA</small>{#if !locked}<Icon name="chevronDown" size={14} />{/if}</strong>
      </button>
      <button class="step" disabled={locked || index === steps.length - 1} onclick={() => setAmount(steps[index + 1])} aria-label="Augmenter la mise"><Icon name="plus" size={22} /></button>
    </div>
    <div class="chips" role="group" aria-label="Montants rapides" style:--i={indicatorIndex}>
      <span class="indicator" class:hidden={quickIndex < 0} aria-hidden="true"></span>
      {#each config.quickBetAmounts as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => setAmount(value)}>{formatNumber(value)}</button>{/each}
    </div>
  </div>

  <button class="primary" data-action={primaryAction} onclick={() => onaction?.()} aria-label={actionLabel} title={action}>
    <span class="shine" aria-hidden="true"></span>
    {#key primaryAction}
      <span class="primary-content" in:fly={{ y: 8, duration: reduceMotion ? 0 : 220 }}>
        <span class="primary-icon" aria-hidden="true"><Icon name={primaryIcons[primaryAction]} size={22} /></span>
        <span class="primary-text">
          <span class="primary-label">{action}</span>
          {#if actionDetail}<span class="primary-detail">{actionDetail}</span>{/if}
        </span>
      </span>
    {/key}
    {#if primaryAction === 'cancel'}<span class="waiting" aria-hidden="true"></span>{/if}
  </button>
</section>

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
  .hud { min-width: 0; min-height: 0; display: grid; grid-template-columns: minmax(170px, 0.9fr) minmax(170px, 0.8fr) minmax(300px, 1.4fr) minmax(220px, 1.1fr); grid-template-areas: 'round automatic bet primary'; gap: 12px; padding: 12px; border: 1px solid var(--line); border-radius: 20px; background: var(--surface); }
  .card { border: 1px solid var(--line); border-radius: 14px; background: var(--surface-2); }
  .caption { color: var(--muted); font-size: 13px; font-weight: 600; }
  button:disabled { opacity: 0.4; }

  /* Cartes d'information (manche, auto) : la teinte (--tone, --tint) suit leur état. */
  .tile { --tone: var(--muted); --tint: #ffffff0a; min-width: 0; display: flex; align-items: center; gap: 14px; padding: 12px 16px; overflow: hidden; color: var(--text); text-align: left; border-color: var(--tint); background: linear-gradient(135deg, var(--tint), transparent 65%), var(--surface-2); transition: background-color 0.3s, border-color 0.3s; }
  .tile-icon { display: grid; place-items: center; flex: none; width: 44px; height: 44px; border-radius: 12px; color: var(--tone); background: var(--tint); }
  .tile-text { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .tile-value { display: flex; align-items: baseline; gap: 6px; margin: 2px 0 0; white-space: nowrap; }
  .tile-value output { color: var(--text); font-size: 26px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .tile-value small { color: var(--muted); font-size: 13px; font-weight: 600; }
  .tile-detail { overflow: hidden; color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }

  .round { grid-area: round; }
  .round[data-phase='queued'] { --tone: var(--gold); --tint: #fbbf241f; }
  .round[data-phase='running'] { --tone: var(--win); --tint: #34d3991a; }
  .round[data-phase='cashedOut'] { --tone: var(--win); --tint: #34d3992e; }
  .round[data-phase='ended'] { --tone: var(--loss); --tint: #fb718524; }
  .round.targeted { --tone: var(--accent); --tint: #a78bfa1f; }
  .round:not([data-phase='betting']) output, .round.targeted output { color: var(--tone); }
  .round[data-phase='cashedOut'] .tile-detail { color: var(--win); }

  /* Carte de mise : montant avec − / +, puis sélecteur segmenté des montants rapides. */
  .bet { grid-area: bet; min-width: 0; display: grid; gap: 8px; padding: 8px; }
  .stepper { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 8px; }
  .step { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 1px solid var(--line); border-radius: 50%; color: var(--text); background: var(--surface-3); transition: background-color 0.15s, transform 0.1s; }
  .step:hover:enabled { border-color: var(--line-strong); background: #352c55; }
  .step:active:enabled { transform: scale(0.94); }
  .amount { display: grid; justify-items: center; gap: 2px; min-width: 0; min-height: 44px; padding: 2px 8px; border: 0; border-radius: 10px; color: var(--text); background: transparent; }
  .amount:hover:enabled { background: #ffffff08; }
  .amount:disabled { opacity: 1; cursor: default; }
  .amount .caption { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; line-height: 1.2; }
  .amount strong { display: inline-flex; align-items: baseline; gap: 5px; font-size: 22px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .amount strong :global(svg) { align-self: center; color: var(--muted); }
  .amount small { color: var(--muted); font-size: 13px; font-weight: 600; }
  .bet.locked .amount .caption { color: var(--gold); }
  .chips { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3px; padding: 3px; border: 1px solid var(--line); border-radius: 12px; background: #0e0a19; }
  /* Pastille unique qui glisse sous les boutons : largeur d'une colonne, décalée de --i colonnes (3 px d'écart). */
  .indicator { position: absolute; top: 3px; bottom: 3px; left: 3px; width: calc((100% - 15px) / 4); border-radius: 9px; background: linear-gradient(180deg, #8b5cf6, #6d28d9); box-shadow: 0 4px 12px -4px #7c3aed99, inset 0 1px 0 #ffffff33; transform: translateX(calc(var(--i) * (100% + 3px))); transition: transform 0.35s cubic-bezier(0.3, 1.3, 0.5, 1), opacity 0.2s; }
  .indicator.hidden { opacity: 0; }
  .bet.locked .indicator { opacity: 0.4; }
  .chips .chip { position: relative; min-height: 38px; border: 0; border-radius: 9px; color: var(--muted); background: transparent; transition: background-color 0.15s, color 0.25s; }
  .chips .chip:hover:enabled:not([aria-pressed='true']) { color: var(--text); background: #ffffff0a; }
  .chips .chip[aria-pressed='true'] { color: #fff; }
  .amount-value { display: inline-block; }
  @media (prefers-reduced-motion: reduce) { .indicator { transition: none; } }
  .options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
  .chip { min-height: 40px; padding: 4px; border: 1px solid var(--line-strong); border-radius: 10px; color: var(--text); background: transparent; font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .chip:hover:enabled:not([aria-pressed='true']) { background: var(--surface-3); }
  .chip[aria-pressed='true'] { border-color: var(--accent); color: #e9e2ff; background: var(--accent-soft); }

  .auto { grid-area: automatic; min-height: 0; font: inherit; }
  .auto.enabled { --tone: var(--accent); --tint: #a78bfa1f; border-color: #a78bfa66; }
  .auto:hover { border-color: var(--line-strong); background: linear-gradient(135deg, var(--tint), transparent 65%), var(--surface-3); }
  .auto.enabled:hover { border-color: var(--accent); }
  .auto .tile-value strong { color: var(--muted); font-size: 22px; font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; }
  .auto.enabled .tile-value strong { color: var(--tone); }
  .flags { display: flex; flex-wrap: wrap; gap: 4px 10px; color: var(--muted); font-size: 13px; }
  .flags span { display: inline-flex; align-items: center; gap: 5px; opacity: 0.6; }
  .flags span::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .flags .on { color: var(--accent); opacity: 1; }
  .chevron { flex: none; display: grid; color: var(--muted); transition: transform 0.15s; }
  .auto:hover .chevron { color: var(--text); transform: translateX(2px); }

  /* Bouton principal : la couleur de fond (--glow) passe en fondu d'une action à l'autre,
     le dégradé clair posé dessus reste le même. */
  .primary { --glow: #22c55e; position: relative; grid-area: primary; display: grid; place-content: center; min-height: 64px; padding: 8px 16px; overflow: hidden; border: 0; border-radius: 14px; color: #052e1a; background-color: var(--glow); background-image: linear-gradient(180deg, #ffffff47, #ffffff00 55%, #0000001f); box-shadow: 0 10px 28px -10px var(--glow), inset 0 1px 0 #ffffff66; transition: background-color 0.3s, color 0.3s, box-shadow 0.3s, filter 0.15s, transform 0.12s; }
  .primary:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .primary:active { filter: brightness(0.97); transform: translateY(1px) scale(0.98); }
  .primary[data-action='cashout'] { --glow: #f59e0b; color: #3a2200; animation: glow 1.6s ease-in-out infinite; }
  .primary[data-action='cancel'] { --glow: #e11d48; color: #fff; }
  .primary-content { position: relative; display: flex; align-items: center; gap: 12px; }
  .primary-icon { display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 50%; background: #00000021; }
  .primary[data-action='cancel'] .primary-icon { background: #ffffff2e; }
  .primary[data-action='bet'] .primary-icon :global(svg) { fill: currentColor; stroke-width: 0; transform: translateX(1px); }
  .primary-text { display: grid; gap: 2px; text-align: left; }
  .primary-label { font-size: 22px; font-weight: 800; line-height: 1.1; }
  .primary-detail { font-size: 14px; font-weight: 600; opacity: 0.8; font-variant-numeric: tabular-nums; white-space: nowrap; }
  /* Reflet qui traverse le bouton au survol, et régulièrement pendant « Encaisser ». */
  .shine { position: absolute; top: 0; bottom: 0; left: -60%; width: 40%; background: linear-gradient(100deg, transparent, #ffffff59, transparent); transform: skewX(-20deg); pointer-events: none; }
  .primary:hover .shine { animation: shine 0.7s ease-out; }
  .primary[data-action='cashout'] .shine { animation: shine 2.4s ease-in-out infinite; }
  /* Barre d'attente du départ, pendant « Annuler ». */
  .waiting { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; overflow: hidden; background: #ffffff33; }
  .waiting::after { content: ''; position: absolute; inset: 0; width: 40%; border-radius: 2px; background: #fff; animation: waiting 1.4s ease-in-out infinite; }
  @keyframes shine { from { left: -60%; } 60%, to { left: 130%; } }
  @keyframes glow { 50% { box-shadow: 0 10px 36px -6px var(--glow), 0 0 0 4px #f59e0b40, inset 0 1px 0 #ffffff66; } }
  @keyframes waiting { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
  @media (prefers-reduced-motion: reduce) {
    .primary, .primary .shine, .primary:hover .shine { animation: none; }
    .waiting::after { width: 100%; opacity: 0.5; animation: none; }
  }

  .hud[data-layout='tablet'] { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-areas: 'round primary primary' 'automatic bet bet'; }
  .hud[data-layout='tablet'] .primary { min-height: 72px; }

  .hud[data-layout='portrait'], .hud[data-layout='landscape'] { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-areas: 'round automatic' 'bet bet' 'primary primary'; gap: 8px; padding: 10px; border-radius: 18px; }
  .hud[data-layout='portrait'] { grid-template-areas: 'primary primary' 'bet bet' 'round automatic'; }
  .hud[data-layout='portrait'] .tile, .hud[data-layout='landscape'] .tile { min-height: 64px; gap: 8px; padding: 10px 12px; }
  .hud[data-layout='portrait'] .tile-icon, .hud[data-layout='landscape'] .tile-icon { display: none; }
  .hud[data-layout='portrait'] .tile-value output, .hud[data-layout='landscape'] .tile-value output { font-size: 22px; }
  .hud[data-layout='portrait'] .auto .tile-value strong, .hud[data-layout='landscape'] .auto .tile-value strong { font-size: 20px; }
  .hud[data-layout='portrait'] .flags, .hud[data-layout='landscape'] .flags { gap: 4px 8px; font-size: 12px; }
  .hud[data-layout='portrait'] .chip { min-height: 44px; }
  .hud[data-layout='landscape'] { grid-template-rows: minmax(64px, 1fr) auto minmax(56px, 1fr); }
  .hud[data-layout='landscape'] .primary { min-height: 56px; }

  .selected { margin: 0 0 16px; color: var(--muted); font-size: 15px; }
  .selected strong { margin-left: 4px; color: var(--text); font-size: 18px; }
  .options .chip { min-height: 48px; font-size: 16px; }
  .target { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
  .target output { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .target.inactive output { color: var(--muted); }
</style>
