<script lang="ts">
  import '../game/hud.css';
  import config, { difficulties, type Difficulty } from '../game.config';
  import { formatDecimal, formatMoney, formatNumber } from '../game/format';
  import type { LayoutType } from '../game/layouts';
  import type { Scenario } from '../game/scenarios';
  import Sheet from './Sheet.svelte';
  import CasinoControlDock from '../../../src/lib/CasinoControlDock.svelte';

  let { amount, difficulty, phase, payout, revealed, layout, turbo = $bindable(false), onamount, ondifficulty, onprimary, onmenu, oncontinue }: {
    amount: number; difficulty: Difficulty; phase: Scenario; payout: number;
    revealed: number; layout: LayoutType;
    /** Turbo : accélère la révélation des cases. */
    turbo?: boolean;
    onamount: (value: number) => void; ondifficulty: (value: Difficulty) => void; onprimary: () => void; oncontinue?: () => void;
    onmenu: () => void;
  } = $props();
  let betSheet: ReturnType<typeof Sheet>;
  const difficultyTypes = Object.keys(difficulties) as Difficulty[];
  const difficultyOptions = difficultyTypes.map(value => ({ value, label:difficulties[value].label, detail:`${difficulties[value].traps.length} piège${difficulties[value].traps.length > 1 ? 's' : ''}` }));
  const locked = $derived(phase === 'playing');
  const difficultyLabels = difficultyTypes.map(value => difficulties[value].label);
  // Liste déroulante du dock : chaque niveau affiche son nombre de pièges.
  const difficultyHints = Object.fromEntries(difficultyOptions.map(option => [option.label, option.detail]));
  function chooseDifficultyLabel(label: string) { const next = difficultyTypes.find(value => difficulties[value].label === label); if (next) ondifficulty(next); }
  function chooseAmount(value: number) {
    if (value !== amount) onamount(value);
  }

</script>

<!-- Tous les formats, portrait compris : dock commun (disposition de poulet-banane en portrait). -->
<CasinoControlDock portrait={layout === 'portrait'} floating={false} balance={config.balance} bet={amount} onchangebet={chooseAmount}
  betOptions={config.betAmountOptions} onbetclick={() => betSheet.open()} showAuto={false} bind:isTurbo={turbo}
  difficulties={difficultyLabels} difficulty={difficulties[difficulty].label} {difficultyHints} onchangedifficulty={chooseDifficultyLabel}
  gameType="reveal" currentWinAmount={payout} canCashout={revealed > 0} oncashout={onprimary} {oncontinue}
  isPlaying={locked} playLabel={locked ? 'Encaisser' : 'Jouer'} playDetail={locked && revealed > 0 ? `${formatDecimal(payout)} FCFA` : undefined}
  playAction={locked ? 'cashout' : 'bet'} playDisabled={locked && revealed === 0}
  playAriaLabel={phase === 'playing' ? `Encaisser ${formatDecimal(payout)} FCFA` : 'Jouer'} onplay={onprimary} {onmenu} />

<Sheet bind:this={betSheet} title="Choisir la mise" closeLabel="Fermer le choix de mise" {layout}><p class="selected">Mise actuelle <strong>{formatMoney(amount)}</strong></p><div class="options" role="group" aria-label="Montants de mise">{#each config.betAmountOptions as value}<button class="chip" aria-label={formatMoney(value)} aria-pressed={amount === value} disabled={locked} onclick={() => chooseAmount(value)}>{formatNumber(value)}</button>{/each}</div></Sheet>

<style>
  .selected { color: var(--muted); font-size: 15px; line-height: 1.5; }
  .selected strong { color: var(--text); }
</style>
