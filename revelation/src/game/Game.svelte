<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import config, { difficulties, type Difficulty } from '../game.config';
  import RevealHud from '../components/RevealHud.svelte';
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import { formatDecimal } from './format';
  import { detectLayout, type LayoutType } from './layouts';
  import { scenarios, type Scenario } from './scenarios';

  let { layout = 'auto', scenario = 'ready' }: { layout?: LayoutType | 'auto'; scenario?: Scenario } = $props();
  let host: HTMLElement;
  let menu: ReturnType<typeof Sheet>;
  let sound = $state(true);
  let detected = $state<LayoutType>('desktop');
  let currentScenario = $state<Scenario>('ready');
  let amount = $state(config.bet);
  let difficulty = $state<Difficulty>('normal');
  let roundDifficulty = $state<Difficulty>('normal');
  let roundBet = $state(config.bet);
  let revealed = $state<number[]>([]);
  let settledPayout = $state(0);
  const activeLayout = $derived(layout === 'auto' ? detected : layout);
  const current = $derived(scenarios[currentScenario]);
  const round = $derived(difficulties[currentScenario === 'ready' ? difficulty : roundDifficulty]);
  const traps = $derived(round.traps as readonly number[]);
  const totalSafe = $derived(16 - traps.length);
  const safeCount = $derived(revealed.filter(value => !traps.includes(value)).length);
  const multiplier = $derived(round.multipliers[Math.min(safeCount, round.multipliers.length - 1)] ?? 1);
  const payout = $derived(currentScenario === 'cashedOut' ? settledPayout : currentScenario === 'lost' ? roundBet : currentScenario === 'ready' || safeCount === 0 ? 0 : Math.round(roundBet * multiplier * 100) / 100);

  function applyScenario(value: Scenario) {
    currentScenario = value;
    roundDifficulty = difficulty;
    roundBet = amount;
    revealed = value === 'ready' ? [] : value === 'lost' ? [0, 3] : value === 'cashedOut' ? [0, 1] : [0];
    settledPayout = value === 'cashedOut' ? Math.round(roundBet * (round.multipliers[2] ?? 1) * 100) / 100 : 0;
  }
  $effect(() => { const value = scenario; untrack(() => applyScenario(value)); });

  function primaryAction() {
    if (currentScenario === 'ready') {
      roundBet = amount;
      roundDifficulty = difficulty;
      revealed = [];
      settledPayout = 0;
      currentScenario = 'playing';
    } else if (currentScenario === 'playing' && safeCount > 0) {
      settledPayout = payout;
      currentScenario = 'cashedOut';
    } else if (currentScenario !== 'playing') {
      revealed = [];
      currentScenario = 'ready';
    }
  }
  function reveal(index: number) {
    if (currentScenario !== 'playing' || revealed.includes(index)) return;
    revealed = [...revealed, index];
    if (traps.includes(index)) currentScenario = 'lost';
    else if (safeCount === totalSafe) {
      settledPayout = Math.round(roundBet * multiplier * 100) / 100;
      currentScenario = 'cashedOut';
    }
  }
  onMount(() => {
    let resizeFrame = 0;
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => detected = detectLayout(entry.contentRect.width, entry.contentRect.height));
    });
    observer.observe(host);
    return () => { observer.disconnect(); cancelAnimationFrame(resizeFrame); };
  });
</script>

<main class="game" data-layout={activeLayout} data-scenario={currentScenario} bind:this={host}>
  <header class="topbar">
    <div class="brand">
      <span class="logo" aria-hidden="true"><Icon name="gem" size={18} /></span>
      <strong>RÉVÉLATION</strong>
      <span class="tag">Démo · montants fictifs</span>
    </div>
    <div class="account">
      <p class="balance">
        <span class="balance-icon" aria-hidden="true"><Icon name="wallet" size={18} /></span>
        <span class="balance-text"><span class="balance-caption">Solde</span><span class="balance-value"><strong>{formatDecimal(config.balance)}</strong><small>FCFA</small></span></span>
      </p>
      <button class="settings" aria-label="Ouvrir le menu" title="Paramètres et règles" onclick={() => menu.open()}><Icon name="gear" size={22} /></button>
    </div>
  </header>


  <div class="content">
    <section class="playfield" data-phase={currentScenario} aria-label="Grille de révélation">
      <div class="board-heading"><span class="phase">{current.phase}</span><div class="board-title"><h1>Pierres du destin</h1><span class="multiplier">×{formatDecimal(multiplier)}</span></div><p class="hint">{current.hint}</p></div>
      <div class="grid" role="group" aria-label="Cases de la grille">
        {#each Array.from({ length: 16 }, (_, index) => index) as index}
          {@const shown = revealed.includes(index) || (currentScenario === 'lost' && traps.includes(index))}
          {@const danger = shown && traps.includes(index)}
          <button class="cell" class:revealed={shown} class:danger class:safe={shown && !danger} disabled={currentScenario !== 'playing' || revealed.includes(index)} aria-label={shown ? 'Case ' + (index + 1) + (danger ? ' : piège' : ' : trésor') : 'Révéler la case ' + (index + 1)} onclick={() => reveal(index)}>
            <span class="cell-symbol"><Icon name={shown ? danger ? 'mine' : 'gem' : 'gem'} size={32} /></span>
            {#if !shown}<span class="cell-number">{index + 1}</span>{/if}
          </button>
        {/each}
      </div>
      <div class="board-footer"><span><Icon name="gem" size={16} />{safeCount} / {totalSafe} trésors</span><span><Icon name="shield" size={16} />{traps.length} piège{traps.length > 1 ? 's' : ''}</span><small>Grille fixe · démo</small></div>
    </section>
    <RevealHud {amount} {difficulty} phase={currentScenario} {payout} {multiplier} revealed={safeCount} {totalSafe} layout={activeLayout} onamount={(value) => amount = value} ondifficulty={(value) => difficulty = value} onprimary={primaryAction} />
  </div>
  <Sheet bind:this={menu} title="Menu du jeu" closeLabel="Fermer le menu" layout={activeLayout}>
    <h3 class="section-title">Réglages</h3>
    <label class="row setting">
      <span class="setting-icon" class:off={!sound} aria-hidden="true"><Icon name={sound ? 'sound' : 'mute'} /></span>
      <span class="setting-text"><strong>Son</strong><small>{sound ? 'Effets sonores et musique activés' : 'Son coupé'}</small></span>
      <input type="checkbox" aria-label="Son" bind:checked={sound} />
    </label>
    <h3 class="section-title">Comment jouer</h3>
    <ol class="how">
      <li><strong>Préparez la partie</strong>Choisissez une mise et une difficulté, puis commencez.</li>
      <li><strong>Révélez une case</strong>Un trésor augmente le gain ; un piège termine la manche.</li>
      <li><strong>Encaissez quand vous voulez</strong>Après un trésor, vous pouvez conserver le montant affiché.</li>
    </ol>
    <p class="note demo"><Icon name="info" size={18} />Maquette interactive : montants fictifs, aucun paiement. La grille est fixe pour la démonstration et le son est illustratif.</p>
  </Sheet>
</main>

<style>
  .game {
    --bg: #0a0713;
    --surface: #130f20;
    --surface-2: #1b1630;
    --surface-3: #282042;
    --line: #ffffff12;
    --line-strong: #ffffff24;
    --text: #f5f3fb;
    --muted: #a39cba;
    --accent: #a78bfa;
    --accent-soft: #a78bfa24;
    --win: #34d399;
    --loss: #fb7185;
    --gold: #fbbf24;
    height: 100dvh; min-height: 320px; padding: 16px; display: flex; flex-direction: column; gap: 12px;
    color: var(--text);
    background: radial-gradient(100% 60% at 50% -10%, #2b1950, transparent 70%), var(--bg);
    font-family: Inter, 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif;
  }
  .game :global(:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }

  .topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .logo { display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: 10px; color: #fff; background: linear-gradient(135deg, #a78bfa, #6d28d9); }
  .brand strong { font-size: 18px; font-weight: 800; letter-spacing: 0.08em; }
  .tag { padding: 4px 10px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); background: var(--surface-2); font-size: 13px; white-space: nowrap; }
  .account { display: flex; align-items: center; gap: 8px; }
  .balance { display: flex; align-items: center; gap: 10px; height: 48px; margin: 0; padding: 4px 16px 4px 4px; border: 1px solid #fbbf2426; border-radius: 999px; background: linear-gradient(135deg, #fbbf2414, transparent 60%), var(--surface-2); white-space: nowrap; }
  .balance-icon { display: grid; place-items: center; flex: none; width: 38px; height: 38px; border-radius: 50%; color: var(--gold); background: #fbbf2424; }
  .balance-text { display: grid; line-height: 1.15; }
  .balance-caption { color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .balance-value { display: flex; align-items: baseline; gap: 4px; }
  .balance-value strong { font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .balance-value small { color: var(--muted); font-size: 12px; font-weight: 600; }
  .settings { display: grid; place-items: center; width: 48px; height: 48px; padding: 0; border: 1px solid var(--line); border-radius: 50%; color: var(--muted); background: var(--surface-2); transition: color 0.2s, background-color 0.2s, border-color 0.2s; }
  .settings :global(svg) { transition: transform 0.5s cubic-bezier(0.3, 1.3, 0.5, 1); }
  .settings:hover { color: var(--text); border-color: var(--line-strong); background: var(--surface-3); }
  .settings:hover :global(svg) { transform: rotate(60deg); }

  /* Fenêtre du menu : sections, ligne de réglage avec icône, étapes numérotées. */
  .game .section-title { margin: 16px 0 4px; color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .game .row.setting { justify-content: flex-start; gap: 14px; }
  .setting-icon { display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 12px; color: var(--accent); background: var(--accent-soft); transition: color 0.2s, background-color 0.2s; }
  .setting-icon.off { color: var(--muted); background: var(--surface-3); }
  .setting-text { flex: 1; }
  .game .how { display: grid; gap: 14px; margin: 8px 0 0; padding: 0; list-style: none; counter-reset: step; }
  .game .how li { counter-increment: step; display: grid; grid-template-columns: 28px 1fr; gap: 2px 12px; margin: 0; color: var(--muted); font-size: 14px; line-height: 1.45; }
  .how li::before { content: counter(step); grid-row: span 2; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; color: var(--accent); background: var(--accent-soft); font-size: 14px; font-weight: 700; }
  .how strong { color: var(--text); font-size: 15px; font-weight: 600; }
  .game .note.demo { display: flex; align-items: flex-start; gap: 10px; margin-top: 20px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface-2); }
  .demo :global(svg) { flex: none; margin-top: 1px; color: var(--accent); }


  .content { flex: 1; min-height: 0; display: grid; grid-template-rows: minmax(220px,1fr) auto; gap: 12px; }
  .playfield { position: relative; min-width: 0; min-height: 0; overflow: hidden; container-type: size; display: grid; grid-template-rows: auto minmax(0,1fr) auto; justify-items: center; gap: 16px; padding: 24px; border: 1px solid var(--line); border-radius: 20px; background: radial-gradient(70% 85% at 50% 50%,#4c287644,transparent 75%),var(--surface); }
  .playfield[data-phase='cashedOut'] { background: radial-gradient(70% 85% at 50% 50%,#065f4633,transparent 75%),var(--surface); }
  .playfield[data-phase='lost'] { background: radial-gradient(70% 85% at 50% 50%,#8a1c3b33,transparent 75%),var(--surface); }
  .board-heading { width: min(100%,440px); text-align: center; }
  .phase { display: inline-flex; padding: 5px 10px; border-radius: 999px; color: var(--accent); background: var(--accent-soft); font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
  .board-title { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
  h1 { margin: 0; color: var(--text); font-size: 26px; letter-spacing: -.6px; }
  .multiplier { color: var(--accent); font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .hint { color: var(--muted); font-size: 15px; margin: 8px 0 0; line-height: 1.4; }
  [data-phase='cashedOut'] .phase, [data-phase='cashedOut'] .multiplier { color: var(--win); }
  [data-phase='lost'] .phase { color: var(--loss); background: #fb718524; }
  .grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); grid-template-rows: repeat(4,minmax(0,1fr)); width: min(72cqmin,400px); aspect-ratio: 1; gap: 10px; align-self: center; }
  .cell { position: relative; display: grid; place-items: center; min-width: 0; min-height: 0; padding: 0; border: 1px solid #59467d; border-radius: 16px; color: #8d78ad; background: linear-gradient(145deg,#39274f,#21182f); box-shadow: inset 0 1px 0 #ffffff0d,0 6px 14px #0002; transition: transform .15s,background-color .2s,border-color .2s; }
  .cell:disabled { cursor: default; opacity: 1; }
  .cell:hover:enabled { transform: translateY(-3px); border-color: #c1a3ff; color: #d3bfff; background: linear-gradient(145deg,#51366d,#2d1b42); }
  .cell-number { position: absolute; bottom: 7px; font-size: 11px; font-weight: 700; opacity: .6; }
  .cell-symbol { display: grid; place-items: center; }
  .cell:not(.revealed) .cell-symbol { opacity: .45; }
  .cell.safe { color: #a5f5d3; border-color: #34d39988; background: linear-gradient(145deg,#1f624c,#14382c); box-shadow: 0 0 20px #34d39916,inset 0 1px 0 #fff2; }
  .cell.danger { color: #ffc0cd; border-color: #fb718588; background: linear-gradient(145deg,#733148,#421e30); }
  .board-footer { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px; width: 100%; color: var(--muted); font-size: 14px; }
  .board-footer > span { display: inline-flex; align-items: center; gap: 6px; }
  .board-footer small { padding: 4px 8px; border: 1px solid var(--line); border-radius: 6px; font-size: 12px; }
  .game[data-layout='tablet'] { padding: 24px; }
  .game[data-layout='portrait'] { padding: 12px; gap: 10px; }
  .game[data-layout='portrait'] .tag { display: none; }
  .game[data-layout='portrait'] .content { gap: 10px; }
  .game[data-layout='portrait'] .brand strong { font-size: 15px; letter-spacing: .02em; }
  .game[data-layout='portrait'] .logo { display: none; }
  .game[data-layout='portrait'] .balance { gap: 6px; padding-right: 10px; }
  .game[data-layout='portrait'] .balance-icon { display: none; }
  .game[data-layout='portrait'] .balance { padding-left: 12px; }
  .game[data-layout='portrait'] .playfield { padding: 16px 12px; gap: 10px; }
  .game[data-layout='portrait'] h1 { font-size: 22px; }
  .game[data-layout='portrait'] .grid { width: min(73cqmin,330px); gap: 8px; }
  .game[data-layout='portrait'] .board-footer { gap: 10px; font-size: 13px; }
  .game[data-layout='portrait'] .board-footer small { display: none; }
  .game[data-layout='landscape'] { padding: 10px; gap: 8px; }
  .game[data-layout='landscape'] .content { grid-template-columns: minmax(0,1fr) minmax(340px,44%); grid-template-rows: minmax(0,1fr); gap: 10px; }
  .game[data-layout='landscape'] .playfield { padding: 12px; gap: 8px; }
  .game[data-layout='landscape'] .phase { display: none; }
  .game[data-layout='landscape'] .board-title { margin-top: 0; gap: 8px; }
  .game[data-layout='landscape'] h1 { font-size: 20px; }
  .game[data-layout='landscape'] .multiplier { font-size: 20px; }
  .game[data-layout='landscape'] .hint { margin-top: 4px; font-size: 13px; }
  .game[data-layout='landscape'] .grid { width: min(70cqmin,250px); gap: 6px; }
  .game[data-layout='landscape'] .cell { border-radius: 10px; }
  .game[data-layout='landscape'] .cell :global(svg) { width: 24px; height: 24px; }
  .game[data-layout='landscape'] .cell-number { bottom: 3px; font-size: 10px; }
  .game[data-layout='landscape'] .board-footer { font-size: 12px; gap: 10px; }
  .game[data-layout='landscape'] .board-footer small { display: none; }
  @media (prefers-reduced-motion: reduce) { .cell { transition: none; } }
</style>
