<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import SceneBackdrop from '../../../src/lib/SceneBackdrop.svelte';
  import StudioLogo from '../../../src/lib/StudioLogo.svelte';
  import '../../../src/lib/scene.css';
  import config from '../game.config';
  import SlotBoard from '../components/SlotBoard.svelte';
  import SlotsHud from '../components/SlotsHud.svelte';
  import Icon from '../components/Icon.svelte';
  import GameMenu from '../../../src/lib/GameMenu.svelte';
  import SlotSymbol from '../components/SlotSymbol.svelte';
  import AutoSpinModal from '../../../src/lib/AutoSpinModal.svelte';
  import { formatDecimal, formatMoney } from './format';
  import { detectLayout, type LayoutType } from './layouts';
  import { scenarios, type Scenario } from './scenarios';
  import './shell.css';

  let { layout = 'auto', scenario = 'ready' }: { layout?: LayoutType | 'auto'; scenario?: Scenario } = $props();
  let host: HTMLElement;
  let menu: ReturnType<typeof GameMenu>;
  let autoModal: ReturnType<typeof AutoSpinModal>;
  let amount = $state(config.bet);
  let lastWin = $state(0);
  let resultFactor = $state(2.5);
  let turbo = $state(false);
  let autoRemaining = $state(0);
  // Limites du menu AVANCÉ (en FCFA) et perte cumulée de la série.
  let autoLossLimit = Infinity;
  let autoWinLimit = Infinity;
  let autoLoss = 0;
  let freeRemaining = $state(0);
  let phase = $state<Scenario>(scenario);
  let detected = $state<LayoutType>('desktop');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let nextTimer: ReturnType<typeof setTimeout> | undefined;
  let spinIndex = 0;
  const activeLayout = $derived(layout === 'auto' ? detected : layout);
  const current = $derived(scenarios[phase]);
  const busy = $derived(phase === 'spinning');
  const choicesLocked = $derived(busy || autoRemaining > 0);

  function stopAuto() { autoRemaining = 0; clearTimeout(nextTimer); }
  function stopTimers() { clearTimeout(timer); clearTimeout(nextTimer); }
  $effect(() => {
    const selected = scenario;
    untrack(() => {
      stopTimers();
      autoRemaining = 0;
      phase = selected;
      freeRemaining = selected === 'freeSpins' ? 5 : 0;
      lastWin = selected === 'win' ? amount * 2.5 : 0;
      resultFactor = 2.5;
    });
  });

  function spin() {
    if (busy) return;
    if (amount > config.balance && !freeRemaining) { stopAuto(); return; }
    const roundBet = amount;
    const isFree = freeRemaining > 0;
    const factor = [2.5, 0, 1.2][spinIndex++ % 3];
    phase = 'spinning';
    timer = setTimeout(() => {
      lastWin = Math.round(roundBet * factor * 100) / 100;
      resultFactor = factor;
      phase = factor ? 'win' : 'noWin';
      if (isFree) freeRemaining = Math.max(0, freeRemaining - 1);
      if (autoRemaining > 0) {
        autoRemaining--;
        // Arrêt anticipé : limite de perte atteinte, ou un gain au moins égal à la limite de gain unique.
        autoLoss += (isFree ? 0 : roundBet) - lastWin;
        if (autoLoss >= autoLossLimit || lastWin >= autoWinLimit) autoRemaining = 0;
        if (autoRemaining > 0) nextTimer = setTimeout(spin, turbo ? 180 : 600);
      }
    }, turbo ? 240 : 1000);
  }

  // LANCER L'AUTO-SPIN : tours (Infinity pour ∞), limites en multiples de la mise (stateBet du web-sdk).
  function startAuto(rounds: number, lossLimit = Infinity, singleWinLimit = Infinity) {
    if (busy || freeRemaining || autoRemaining) return;
    autoLossLimit = amount * lossLimit;
    autoWinLimit = amount * singleWinLimit;
    autoLoss = 0;
    autoRemaining = rounds;
    spin();
  }
  onMount(() => {
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => detected = detectLayout(entry.contentRect.width, entry.contentRect.height));
    });
    observer.observe(host);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  });
  onDestroy(stopTimers);
</script>

<main class="game immersive" data-layout={activeLayout} data-scenario={phase} bind:this={host}>
  <SceneBackdrop family="slots" />
  <header class="topbar">
    <div class="brand" role="img" aria-label="Logo du jeu Slots"><span class="logo" aria-hidden="true"><Icon name="star" size={18}/></span><strong>SLOTS</strong></div>
    <div class="account"><p class="balance"><span class="balance-icon" aria-hidden="true"><Icon name="wallet" size={18}/></span><span class="balance-text"><span class="balance-caption">Solde fictif</span><span class="balance-value"><strong>{formatDecimal(config.balance)}</strong><small>FCFA</small></span></span></p><StudioLogo /></div>
  </header>

  <div class="content">
    <section class="playfield" data-phase={phase} aria-label="Zone du jeu slots">
      <div class="stage-top"><p class="hint instruction" aria-live="polite">{current.hint}</p></div>
      <div class="board-area"><SlotBoard scenario={phase} {turbo} winningSymbol={resultFactor === 1.2 ? 2 : 0}/></div>
      <div class="result" aria-live="polite">{#if phase === 'win'}<strong>+{formatMoney(lastWin)}</strong>{:else if phase === 'freeSpins'}<strong>{freeRemaining} tours gratuits</strong>{/if}</div>
    </section>
    <div class="controls-dock">
      <SlotsHud layout={activeLayout} {amount} locked={choicesLocked} bind:turbo {autoRemaining} {freeRemaining}
        onsetamount={(value) => { if (!choicesLocked && !freeRemaining) amount = value; }}
        onauto={() => autoModal.open()} onspin={spin} onstop={stopAuto} onmenu={() => menu.open()}/>
    </div>
  </div>

  <!-- Menu du jeu (≡) : même menu qu'africa-tower — SON, PARAMÈTRES, INFO et TABLEAU DES GAINS. -->
  <GameMenu bind:this={menu}>
    {#snippet rules()}
      <section>
        <h2>Le principe</h2>
        <p>Choisissez la mise, puis appuyez sur JOUER&nbsp;: les cinq rouleaux tournent puis s’arrêtent.</p>
      </section>
      <section>
        <h2>Comment gagner</h2>
        <p>Trois symboles identiques sur la ligne du milieu, en partant de la gauche, donnent un gain&nbsp;: la mise est multipliée par la valeur du symbole.</p>
      </section>
      <section>
        <h2>Les modes</h2>
        <p>AUTO lance 3, 5 ou 10 tours à la suite. L’onglet GRATUITS lance 5 tours gratuits. TURBO accélère les rouleaux.</p>
      </section>
      <section>
        <h2>La maquette</h2>
        <p>Solde fixe, aucun compte, aucune mise réelle, aucun paiement. Les sons sont illustratifs.</p>
      </section>
    {/snippet}
    {#snippet payTable()}
      <p class="pt-mode">Table des gains</p>
      <p class="pt-intro">Trois symboles identiques sur la ligne du milieu, en partant de la gauche&nbsp;:</p>
      <div class="pt-ladder">
        {#each [{ symbol: 0, name: 'Gemme', factor: 2.5 }, { symbol: 2, name: 'Anneau', factor: 1.2 }] as row (row.symbol)}
          <div class="pt-step">
            <span class="pay-symbols" aria-hidden="true">{#each [0, 1, 2] as copy (copy)}<span class="pay-symbol"><SlotSymbol symbol={row.symbol} /></span>{/each}</span>
            <span class="pt-index">{row.name} ×3</span><span class="pt-mult">×{formatDecimal(row.factor)}</span>
          </div>
        {/each}
      </div>
      <p class="pt-intro">Démonstration&nbsp;: la maquette alterne un gain ×2,50, un tour sans gain, puis un gain ×1,20.</p>
    {/snippet}
  </GameMenu>

  <!-- AUTO : fenêtre TOURS AUTO du web-sdk, avec le menu AVANCÉ (limites de perte et de gain unique) des slots. -->
  <AutoSpinModal bind:this={autoModal} advanced landscape={activeLayout === 'landscape'} disabled={amount > config.balance} onstart={startAuto} />
</main>

<style>
  /* Table des gains : les trois symboles de la ligne gagnante. */
  .pay-symbols { display:flex; gap:4px; margin-bottom:6px; }
  .pay-symbol { display:grid; width:34px; height:34px; }
  .content { flex:1; min-height:0; display:grid; grid-template-rows:minmax(180px,1fr) auto; gap:12px; }
  .controls-dock { display:grid; gap:8px; width:100%; max-width:1280px; min-width:0; justify-self:center; }
  .playfield { position:relative; min-width:0; min-height:0; overflow:hidden; container-type:size; border:1px solid var(--line); border-radius:20px; background:radial-gradient(90% 70% at 50% 100%,#3b1f6b66,transparent 70%),var(--surface); }
  .stage-top { position:absolute; top:16px; left:20px; right:20px; }
  .board-area { position:absolute; inset:64px 32px 72px; display:grid; align-items:center; }
  .result { position:absolute; left:16px; right:16px; bottom:18px; display:grid; justify-items:center; gap:5px; text-align:center; }
  .result strong { color:var(--win); font-size:26px; font-weight:800; font-variant-numeric:tabular-nums; }
  [data-phase='freeSpins'] .result strong { color:var(--gold); }
  .game[data-layout='portrait'] { padding:12px; gap:10px; }
  .game[data-layout='portrait'] .content { gap:10px; }
  .game[data-layout='portrait'] .board-area { inset:58px 12px 82px; }
  .game[data-layout='portrait'] .stage-top { left:12px; right:12px; top:12px; gap:8px; }
  .game[data-layout='portrait'] .result strong { font-size:22px; }
  .game[data-layout='landscape'] .content { grid-template-rows:minmax(0,1fr) auto; gap:8px; }
  .game[data-layout='landscape'] .controls-dock { align-self:end; }
  .game[data-layout='landscape'] .board-area { inset:36px 12px 36px; }
  /* Écran court : la largeur des rouleaux suit la hauteur disponible pour garder des cases presque carrées. */
  .game[data-layout='landscape'] .board-area :global(.reels) { width:min(100%, calc((100cqh - 72px) * 1.8)); height:100%; min-height:0; }
  .game[data-layout='landscape'] .result { bottom:12px; }
  .game[data-layout='landscape'] .stage-top { left:12px; right:12px; top:10px; }
  .game[data-layout='landscape'] .result strong { font-size:20px; }
</style>
