<script lang="ts">
  import Sheet from './Sheet.svelte';
  import CasinoControlDock from '../../../src/lib/CasinoControlDock.svelte';
  import '../game/hud.css';
  import config from '../game.config';
  import { formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  let { layout, amount, locked, turbo = $bindable(false), autoRemaining, freeRemaining, onsetamount, onauto, onspin, onstop, onmenu }: {
    layout: LayoutType; amount: number; locked: boolean; turbo?: boolean; autoRemaining: number; freeRemaining: number;
    onsetamount: (value:number)=>void; onauto:()=>void; onspin:()=>void; onstop:()=>void;
    onmenu:()=>void;
  } = $props();
  let betSheet: ReturnType<typeof Sheet>;
  function chooseAmount(value: number) {
    if (value !== amount) onsetamount(value);
  }
  // Tours restants de la série (∞ : jusqu'à l'arrêt).
  const toursLeft = $derived(autoRemaining === Infinity ? '∞ tours' : `${autoRemaining} tour${autoRemaining > 1 ? 's' : ''}`);

</script>
<!-- Tous les formats, portrait compris : dock commun (disposition de poulet-banane en portrait). -->
<CasinoControlDock portrait={layout === 'portrait'} floating={false} balance={config.balance} bet={amount} onchangebet={chooseAmount}
  betOptions={config.betAmountOptions} onbetclick={() => betSheet.open()} betLocked={freeRemaining > 0}
  difficulties={[]} isAuto={autoRemaining > 0} onautoclick={autoRemaining > 0 ? onstop : onauto} autoAriaLabel={autoRemaining > 0 ? 'Arrêter les tours auto' : undefined} bind:isTurbo={turbo} turboLocked={locked} gameType="slots" isPlaying={locked}
  playLabel={autoRemaining > 0 ? 'Arrêter' : locked ? 'En cours' : 'Jouer'}
  playDetail={autoRemaining > 0 ? toursLeft : freeRemaining > 0 ? `${freeRemaining} gratuits` : undefined}
  playAction={autoRemaining > 0 ? 'cancel' : locked ? 'busy' : 'bet'} playDisabled={locked && autoRemaining === 0}
  playAriaLabel={autoRemaining > 0 ? 'Arrêter le jeu automatique' : locked ? 'Rouleaux en mouvement' : freeRemaining ? 'Jouer un tour gratuit' : 'Jouer'}
  onplay={autoRemaining > 0 ? onstop : onspin} {onmenu} />

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}>
  <p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p>
  <div class="options" role="group" aria-label="Montants de mise">{#each config.betAmountOptions as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked || freeRemaining > 0} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}</div>
</Sheet>
