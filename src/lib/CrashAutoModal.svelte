<script module lang="ts">
  /** Réglages d'une série automatique du Crash (Infinity : sans limite / tours illimités). */
  export type CrashAutoPlan = { rounds: number; cashout: boolean; target: number; takeProfit: number; stopLoss: number };
</script>

<script lang="ts">
  /*
   * Jeu automatique du Crash. Matière et contrôles d'avia-djo (CrashBetPanelLocal.svelte : panneau #0d1426,
   * puces #1c2440 / #2f3a5c bordées #39456b / #7b6cff, cases violettes, cible [−] 2,00× [+] au pas de 0,10
   * de 1,01× à 100×, bouton vert #21a45a → #35c46f), dans la fenêtre plein écran du web-sdk :
   * nombre de tours, encaissement automatique, menu AVANCÉ façon trading (objectif de gain = take profit,
   * limite de perte = stop loss) et ACTIVER pour lancer la série.
   */
  import { slide } from 'svelte/transition';
  import SdkPopup from './SdkPopup.svelte';

  let { bet, onstart }: {
    /** Mise par tour, pour le récapitulatif. */
    bet: number;
    onstart: (plan: CrashAutoPlan) => void;
  } = $props();

  const ROUNDS = [5, 10, 25, 50, 100, Infinity];
  const AMOUNTS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  let isOpen = $state(false);
  let rounds = $state(10);
  let cashout = $state(true);
  let target = $state(2);
  let advanced = $state(false);
  let takeProfitOn = $state(false);
  let takeProfit = $state(100);
  let stopLossOn = $state(false);
  let stopLoss = $state(50);

  export function open() { isOpen = true; }
  export function close() { isOpen = false; }
  function activate() {
    isOpen = false;
    onstart({ rounds, cashout, target, takeProfit: takeProfitOn ? takeProfit : Infinity, stopLoss: stopLossOn ? stopLoss : Infinity });
  }

  // crashActions.setAutoCashoutTarget / stepAutoCashoutTarget d'avia-djo.
  const setTarget = (value: number) => (target = Math.min(100, Math.max(1.01, Math.round(value * 100) / 100)));
  function stepTarget(direction: 1 | -1) {
    const cents = Math.round(target * 100);
    if (cents % 10 !== 0) {
      setTarget((direction > 0 ? Math.ceil(cents / 10) * 10 : Math.floor(cents / 10) * 10) / 100);
      return;
    }
    setTarget(target + direction * 0.1);
  }
  const stepAmount = (value: number, direction: 1 | -1) => {
    const index = AMOUNTS.indexOf(value);
    return AMOUNTS[Math.min(AMOUNTS.length - 1, Math.max(0, index + direction))];
  };
  const formatMultiplier = (value: number) => `${value.toFixed(2).replace('.', ',')}×`;
  const formatAmount = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
  const roundsLabel = (value: number) => (value === Infinity ? '∞' : String(value));
  const engaged = $derived(rounds === Infinity ? null : bet * rounds);
</script>

{#snippet checkbox(checked: boolean, label: string, onchange: () => void)}
  <button type="button" class="ca-check" class:ca-checked={checked} role="checkbox" aria-checked={checked} aria-label={label} onclick={onchange}>
    {#if checked}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5L10 17.5L19 7" /></svg>{/if}
  </button>
{/snippet}

{#snippet stepper(value: string, enabled: boolean, name: string, onstep: (direction: 1 | -1) => void)}
  <div class="ca-field" class:ca-off={!enabled}>
    <button type="button" class="ca-step" aria-label="Diminuer : {name}" disabled={!enabled} onclick={() => onstep(-1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12H18" /></svg>
    </button>
    <output aria-label={name}>{value}</output>
    <button type="button" class="ca-step" aria-label="Augmenter : {name}" disabled={!enabled} onclick={() => onstep(1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V19M5 12H19" /></svg>
    </button>
  </div>
{/snippet}

{#if isOpen}
  <SdkPopup label="Jeu automatique" onclose={close}>
    <div class="ca-panel">
      <div class="ca-title">Jeu automatique</div>

      <div class="ca-body">
      <section class="ca-section ca-rounds">
        <span class="ca-caption">Nombre de tours</span>
        <div class="ca-chips" role="group" aria-label="Nombre de tours">
          {#each ROUNDS as value (value)}
            <button type="button" class="ca-chip" class:ca-active={rounds === value} aria-pressed={rounds === value}
              aria-label={value === Infinity ? 'Tours illimités' : `${value} tours`} onclick={() => (rounds = value)}>{roundsLabel(value)}</button>
          {/each}
        </div>
      </section>

      <section class="ca-section ca-cashout">
        <div class="ca-line">
          <span class="ca-label">Encaissement auto</span>
          {@render checkbox(cashout, 'Encaissement automatique', () => (cashout = !cashout))}
        </div>
        {@render stepper(formatMultiplier(target), cashout, "Cible d'encaissement automatique", stepTarget)}
        <p class="ca-hint">{cashout ? `Chaque manche est encaissée dès ${formatMultiplier(target)}.` : 'Sans encaissement auto, encaissez vous-même pendant la manche.'}</p>
      </section>

      <section class="ca-section ca-more">
        <button type="button" class="ca-toggle" aria-expanded={advanced} onclick={() => (advanced = !advanced)}>
          Avancé <span aria-hidden="true">{advanced ? '▲' : '▼'}</span>
        </button>
        {#if advanced}
          <div class="ca-advanced" transition:slide={{ duration: 120 }}>
            <p class="ca-hint">Comme en trading&nbsp;: la série s'arrête dès que le gain total atteint votre objectif, ou que la perte totale atteint votre limite.</p>
            <div class="ca-line">
              <span class="ca-label">Objectif de gain <small>(take profit)</small></span>
              {@render checkbox(takeProfitOn, 'Arrêter quand le gain atteint l’objectif', () => (takeProfitOn = !takeProfitOn))}
            </div>
            {@render stepper(formatAmount(takeProfit), takeProfitOn, 'Objectif de gain', (direction) => (takeProfit = stepAmount(takeProfit, direction)))}
            <div class="ca-line">
              <span class="ca-label">Limite de perte <small>(stop loss)</small></span>
              {@render checkbox(stopLossOn, 'Arrêter quand la perte atteint la limite', () => (stopLossOn = !stopLossOn))}
            </div>
            {@render stepper(formatAmount(stopLoss), stopLossOn, 'Limite de perte', (direction) => (stopLoss = stepAmount(stopLoss, direction)))}
          </div>
        {/if}
      </section>
      </div>

      <div class="ca-footer">
      <p class="ca-summary">
        Mise par tour <strong>{formatAmount(bet)}</strong>
        {#if engaged !== null}· {rounds} tours = <strong>{formatAmount(engaged)}</strong> engagés au plus{:else}· tours illimités, jusqu'à l'arrêt{/if}
      </p>
      <button type="button" class="ca-activate" onclick={activate}>Activer</button>
      </div>
    </div>
  </SdkPopup>
{/if}

<style>
  /* Panneau d'avia-djo : fond #0d1426, bord #1e2845. */
  .ca-panel {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 14px;
    width: min(440px, calc(100vw - 2rem));
    max-height: calc(100dvh - 4rem);
    padding: 20px;
    box-sizing: border-box;
    border: 1px solid #1e2845;
    border-radius: 18px;
    background: linear-gradient(180deg, #111a31 0%, #0d1426 100%);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
    font-family: 'Montserrat', system-ui, sans-serif;
    letter-spacing: 0;
  }
  .ca-title { color: #fff; font-size: 18px; font-weight: 800; letter-spacing: 0.08em; text-align: center; text-transform: uppercase; }
  /* Seul le corps défile : le récapitulatif et ACTIVER restent toujours visibles. */
  .ca-body { display: grid; align-content: start; gap: 14px; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #39456b transparent; }
  .ca-section { display: grid; align-content: start; gap: 10px; padding-top: 14px; border-top: 1px solid #1e2845; }
  .ca-footer { display: grid; gap: 12px; padding-top: 14px; border-top: 1px solid #1e2845; }
  .ca-caption, .ca-toggle { color: #8a93b5; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  /* Puces des tours : celles des montants d'avia-djo. */
  .ca-chips { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
  @media (max-width: 400px) { .ca-chips { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  .ca-chip { min-height: 0; height: 40px; padding: 0; border: 1.5px solid #39456b; border-radius: 11px; color: #8a93b5; background: #1c2440; font: 700 15px 'Montserrat', system-ui, sans-serif; cursor: pointer; transition: border-color 0.15s, color 0.15s, background-color 0.15s; }
  .ca-chip:hover { color: #fff; }
  .ca-chip.ca-active { border-color: #7b6cff; color: #fff; background: #2f3a5c; }
  .ca-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ca-label { color: #e6e9f5; font-size: 15px; font-weight: 700; }
  .ca-label small { color: #8a93b5; font-size: 12px; font-weight: 600; }
  /* Cadre de la valeur : #1c2440 bordé #3d4a72 ; boutons − / + #38477a bordés #6478b8, symboles #cfd5ec. */
  .ca-field { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 52px; padding: 0 6px; box-sizing: border-box; border: 2px solid #3d4a72; border-radius: 12px; background: #1c2440; }
  .ca-field output { color: #fff; font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .ca-field.ca-off output, .ca-field.ca-off .ca-step { opacity: 0.4; }
  .ca-step { display: grid; place-items: center; flex: none; width: 38px; height: 38px; min-height: 0; padding: 0; border: 2px solid #6478b8; border-radius: 11px; background: #38477a; cursor: pointer; transition: transform 0.1s; }
  .ca-step svg { width: 22px; height: 22px; fill: none; stroke: #cfd5ec; stroke-width: 2.5; stroke-linecap: round; }
  .ca-step:active:enabled { transform: scale(0.92); }
  .ca-step:disabled { cursor: default; }
  /* Case d'avia-djo : #1c2440 bordée #39456b ; cochée #7b6cff avec la coche blanche. */
  .ca-check { display: grid; place-items: center; flex: none; width: 36px; height: 36px; min-height: 0; padding: 0; border: 1.5px solid #39456b; border-radius: 10px; background: #1c2440; cursor: pointer; transition: transform 0.1s; }
  .ca-check.ca-checked { border-color: #7b6cff; background: #7b6cff; }
  .ca-check svg { width: 84%; height: 84%; fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .ca-check:active { transform: scale(0.92); }
  .ca-hint { margin: 0; color: #8a93b5; font-size: 13px; font-weight: 500; line-height: 1.45; }
  .ca-toggle { display: flex; align-items: center; gap: 8px; width: fit-content; min-height: 0; padding: 0; border: 0; background: none; cursor: pointer; }
  .ca-toggle:hover { color: #e6e9f5; }
  .ca-advanced { display: grid; gap: 10px; padding: 14px; border: 1px solid #39456b; border-radius: 14px; background: rgba(28, 36, 64, 0.45); }
  .ca-summary { margin: 0; color: #8a93b5; font-size: 13px; font-weight: 600; line-height: 1.5; text-align: center; }
  .ca-summary strong { color: #e6e9f5; }
  /* ACTIVER : vert du bouton de mise d'avia-djo. */
  .ca-activate { min-height: 0; height: 52px; padding: 0; border: 0; border-radius: 14px; color: #fff; background: linear-gradient(180deg, #35c46f 0%, #21a45a 100%); box-shadow: 0 6px 18px rgba(33, 164, 90, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25); font: 800 17px 'Montserrat', system-ui, sans-serif; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: filter 0.15s, transform 0.1s; }
  .ca-activate:hover { filter: brightness(1.08); }
  .ca-activate:active { transform: scale(0.98); }
  .ca-chip:focus-visible, .ca-step:focus-visible, .ca-check:focus-visible, .ca-toggle:focus-visible, .ca-activate:focus-visible { outline: 2px solid #ffd166; outline-offset: 3px; }
  /* Paysage (téléphone couché) : deux colonnes, AVANCÉ à droite, ACTIVER à côté du récapitulatif. */
  @media (max-height: 500px) and (min-width: 600px) {
    .ca-panel { width: min(780px, calc(100vw - 2rem)); max-height: calc(100dvh - 1.5rem); gap: 10px; padding: 14px 18px; }
    .ca-title { font-size: 16px; }
    .ca-body { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: auto 1fr; grid-template-areas: 'rounds more' 'cashout more'; column-gap: 18px; row-gap: 10px; }
    /* Les libellés « take profit » / « stop loss » suffisent : l'explication est cachée pour tout voir sans défiler. */
    .ca-advanced > .ca-hint { display: none; }
    .ca-rounds { grid-area: rounds; }
    .ca-cashout { grid-area: cashout; }
    .ca-more { grid-area: more; }
    .ca-section { gap: 8px; padding-top: 10px; }
    .ca-chips { gap: 6px; }
    .ca-chip { height: 34px; font-size: 14px; }
    .ca-field { height: 44px; }
    .ca-step { width: 32px; height: 32px; }
    .ca-check { width: 32px; height: 32px; }
    .ca-advanced { gap: 8px; padding: 10px 12px; }
    .ca-hint { font-size: 12px; }
    .ca-footer { grid-template-columns: minmax(0, 1fr) 220px; align-items: center; gap: 16px; padding-top: 10px; }
    .ca-summary { text-align: left; }
    .ca-activate { height: 46px; }
  }
  @media (prefers-reduced-motion: reduce) { .ca-chip, .ca-step, .ca-check, .ca-activate { transition: none; } }
</style>
