<script lang="ts">
  import config from '../game.config';
  import { formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import { risks, riskTypes, type Risk, type Scenario } from '../game/scenarios';
  import Sheet from './Sheet.svelte';
  import CasinoControlDock from '../../../src/lib/CasinoControlDock.svelte';
  import AutoSpinModal from '../../../src/lib/AutoSpinModal.svelte';
  import '../game/hud.css';
  let { scenario, layout, amount = $bindable(config.bet), risk = $bindable<Risk>('balanced'), turbo = $bindable(false), autoRemaining = 0, onaction, onautostart, onautostop, onmenu }: {
    scenario: Scenario; layout: LayoutType; amount?: number; risk?: Risk; turbo?: boolean;
    /** Parties automatiques restant à jouer, celle en cours comprise (0 : pas de série). */
    autoRemaining?: number;
    onaction: () => void; onautostart: (count: number) => void; onautostop: () => void; onmenu: () => void;
  } = $props();
  // Niveaux affichés dans la pilule Difficulté du dock, avec leur objectif dans le menu.
  const riskLabels = riskTypes.map(value => risks[value].label);
  const riskHints = Object.fromEntries(riskTypes.map(value => [risks[value].label, risks[value].hint]));
  function chooseRisk(label: string) { const next = riskTypes.find(value => risks[value].label === label); if (next) risk = next; }
  let betSheet: ReturnType<typeof Sheet>;
  let autoModal: ReturnType<typeof AutoSpinModal>;
  const locked = $derived(scenario === 'playing');
  const action = $derived(locked ? 'Lancer en cours' : scenario === 'ready' ? 'Jouer' : 'Rejouer');
  // Série automatique : JOUER devient « Arrêter », la mise et le risque restent ceux du départ.
  const autoRunning = $derived(autoRemaining > 0);
  const partiesLeft = $derived(autoRemaining === Infinity ? '∞ tours' : `${autoRemaining} tour${autoRemaining > 1 ? 's' : ''}`);
  function chooseAmount(value: number) {
    if (value !== amount) amount = value;
  }

</script>

<!-- Tous les formats, portrait compris : dock commun (disposition de poulet-banane en portrait). -->
<CasinoControlDock portrait={layout === 'portrait'} floating={false} balance={config.balance} bind:bet={amount} betOptions={config.betAmountOptions}
  onbetclick={() => betSheet.open()} difficulties={riskLabels} difficulty={risks[risk].label} difficultyHints={riskHints} onchangedifficulty={chooseRisk}
  isAuto={autoRunning} onautoclick={() => (autoRunning ? onautostop() : autoModal.open())} autoAriaLabel={autoRunning ? 'Arrêter les tours auto' : undefined} bind:isTurbo={turbo} betLocked={autoRunning}
  gameType="dice" isPlaying={locked} playLabel={autoRunning ? 'Arrêter' : locked ? 'En cours' : 'Jouer'}
  playDetail={autoRunning ? partiesLeft : undefined}
  playAction={autoRunning ? 'cancel' : locked ? 'busy' : 'bet'} playDisabled={locked && !autoRunning}
  playAriaLabel={autoRunning ? `Arrêter le jeu automatique, encore ${partiesLeft}` : locked ? action : 'Jouer'}
  onplay={() => (autoRunning ? onautostop() : onaction())} {onmenu} />

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}><p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p><div class="options" role="group" aria-label="Montants de mise">{#each config.betAmountOptions as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}</div></Sheet>
<!-- AUTO : fenêtre TOURS AUTO du web-sdk (sans menu AVANCÉ, comme des-destin) ; pendant la série, AUTO l'arrête. -->
<AutoSpinModal bind:this={autoModal} landscape={layout === 'landscape'} onstart={(rounds) => onautostart(rounds)} />
