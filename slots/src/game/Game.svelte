<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import SceneBackdrop from '../../../src/lib/SceneBackdrop.svelte';
  import StudioLogo from '../../../src/lib/StudioLogo.svelte';
  import '../../../src/lib/scene.css';
  import config from '../game.config';
  import SlotBoard from '../components/SlotBoard.svelte';
  import SlotActions from '../components/SlotActions.svelte';
  import SlotsHud from '../components/SlotsHud.svelte';
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import GameModes from '../components/GameModes.svelte';
  import { formatDecimal, formatMoney } from './format';
  import { detectLayout, type LayoutType } from './layouts';
  import { scenarios, type Scenario } from './scenarios';
  import './shell.css';

  let { layout = 'auto', scenario = 'ready' }: { layout?: LayoutType | 'auto'; scenario?: Scenario } = $props();
  let host: HTMLElement;
  let menu: ReturnType<typeof Sheet>;
  let modes: ReturnType<typeof GameModes>;
  let sound = $state(true);
  let amount = $state(config.bet);
  let lastWin = $state(0);
  let resultFactor = $state(2.5);
  let turbo = $state(false);
  let autoRemaining = $state(0);
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
        if (autoRemaining > 0) nextTimer = setTimeout(spin, turbo ? 180 : 600);
      }
    }, turbo ? 240 : 1000);
  }

  function startAuto(rounds: number) {
    if (busy || freeRemaining || autoRemaining) return;
    autoRemaining = rounds;
    spin();
  }
  function startBonus() {
    if (busy || autoRemaining || freeRemaining) return;
    freeRemaining = 5;
    phase = 'freeSpins';
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
      <SlotActions {turbo} locked={choicesLocked} bonusLocked={choicesLocked || freeRemaining > 0} onturbo={() => { if (!choicesLocked) turbo = !turbo; }} onbonus={() => modes.open('bonus')} />
      <SlotsHud layout={activeLayout} {amount} locked={choicesLocked} win={lastWin} {turbo} {autoRemaining} {freeRemaining}
        onsetamount={(value) => { if (!choicesLocked && !freeRemaining) amount = value; }}
        onmodes={() => modes.open('auto')} onspin={spin} onstop={stopAuto} onmenu={() => menu.open()}/>
    </div>
  </div>

  <Sheet bind:this={menu} title="Paramètres et règles" closeLabel="Fermer le menu" layout={activeLayout}>
    <label class="row"><span><strong>Son</strong><small>Option visuelle de la maquette.</small></span><input type="checkbox" aria-label="Son" bind:checked={sound}/></label>
    <h3>Comment jouer</h3><ol><li>Choisissez la mise, puis appuyez sur « Lancer ».</li><li>Les cinq rouleaux s'arrêtent sur une séquence de démonstration.</li><li>Une ligne gagnante est mise en évidence et son gain reste affiché.</li></ol>
    <h3>Table des gains de démonstration</h3><p class="note">Trois gemmes alignées : ×2,50 la mise. Trois anneaux alignés : ×1,20. Le prototype alterne un gain ×2,50, un tour sans gain, puis un gain ×1,20. Ce sont des exemples visuels, pas une table de jeu réelle.</p>
    <p class="note">Solde fixe, aucun compte, aucune mise réelle, aucun paiement. Les sons sont illustratifs.</p>
  </Sheet>

  <GameModes bind:this={modes} layout={activeLayout} {amount} {busy} {autoRemaining} {freeRemaining}
    onauto={startAuto} onbonus={startBonus} onstop={stopAuto} />
</main>

<style>
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
  .game[data-layout='landscape'] .content { grid-template-columns:minmax(0,1fr) minmax(340px,44%); grid-template-rows:minmax(0,1fr); gap:10px; }
  .game[data-layout='landscape'] .controls-dock { align-self:end; }
  .game[data-layout='landscape'] :global(.slot-controls) { padding:8px; gap:6px; }
  .game[data-layout='landscape'] :global(.slot-controls > .bet) { padding:4px; }
  .game[data-layout='landscape'] .board-area { inset:64px 12px 56px; }
  .game[data-layout='landscape'] .result { bottom:12px; }
  .game[data-layout='landscape'] .stage-top { left:12px; right:12px; top:10px; }
  .game[data-layout='landscape'] .result strong { font-size:20px; }
</style>
