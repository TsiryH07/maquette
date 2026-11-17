<script lang="ts">
  import config from '../game.config';
  import { formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import { risks, riskTypes, type Risk, type Scenario } from '../game/scenarios';
  import Sheet from './Sheet.svelte';
  import CasinoControlDock from '../../../src/lib/CasinoControlDock.svelte';
  import '../game/hud.css';
  let { scenario, layout, amount = $bindable(config.bet), risk = $bindable<Risk>('balanced'), turbo = $bindable(false), onaction, onmenu }: { scenario: Scenario; layout: LayoutType; amount?: number; risk?: Risk; turbo?: boolean; onaction: () => void; onmenu: () => void } = $props();
  // Niveaux affichés dans la pilule Difficulté du dock, avec leur objectif dans le menu.
  const riskLabels = riskTypes.map(value => risks[value].label);
  const riskHints = Object.fromEntries(riskTypes.map(value => [risks[value].label, risks[value].hint]));
  function chooseRisk(label: string) { const next = riskTypes.find(value => risks[value].label === label); if (next) risk = next; }
  let auto = $state(false);
  let rounds = $state('10');
  const roundOptions = ['10', '25', '50'];
  let betSheet: ReturnType<typeof Sheet>;
  let autoSheet: ReturnType<typeof Sheet>;
  const locked = $derived(scenario === 'playing');
  const action = $derived(locked ? 'Lancer en cours' : scenario === 'ready' ? 'Jouer' : 'Rejouer');
  function chooseAmount(value: number) {
    if (value !== amount) amount = value;
  }

</script>

<!-- Tous les formats, portrait compris : dock commun (disposition de poulet-banane en portrait). -->
<CasinoControlDock portrait={layout === 'portrait'} floating={false} balance={config.balance} bind:bet={amount} betOptions={config.betAmountOptions}
  onbetclick={() => betSheet.open()} difficulties={riskLabels} difficulty={risks[risk].label} difficultyHints={riskHints} onchangedifficulty={chooseRisk}
  isAuto={auto} onautoclick={() => autoSheet.open()} bind:isTurbo={turbo}
  gameType="dice" isPlaying={locked} playLabel={locked ? 'En cours' : 'Jouer'}
  playAction={locked ? 'busy' : 'bet'} playDisabled={locked} playAriaLabel={locked ? action : 'Jouer'} onplay={() => onaction()} {onmenu} />

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
  .rounds { display:grid; gap:8px; margin-top:18px; font-size:16px; }
  .rounds .chips { grid-template-columns:repeat(3, minmax(0, 1fr)); }
  .rounds .indicator { width:calc((100% - 12px) / 3); }
  .rounds .chip { min-height:44px; }
  @media (prefers-reduced-motion: reduce) { .rounds .chip { transition:none; } }
</style>
