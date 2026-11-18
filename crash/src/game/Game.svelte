<script lang="ts">
  import { onMount } from 'svelte';
  import SceneBackdrop from '../../../src/lib/SceneBackdrop.svelte';
  import StudioLogo from '../../../src/lib/StudioLogo.svelte';
  import '../../../src/lib/scene.css';
  import config from '../game.config';
  import CrashCanvas from '../components/CrashCanvas.svelte';
  import CrashHud from '../components/CrashHud.svelte';
  import Icon from '../components/Icon.svelte';
  import GameMenu from '../../../src/lib/GameMenu.svelte';
  import type { CrashAutoPlan } from '../../../src/lib/CrashAutoModal.svelte';
  import { formatDecimal } from './format';
  import { detectLayout, type LayoutType } from './layouts';
  import { scenarios, type Scenario } from './scenarios';

  let { layout = 'auto', scenario = 'betting' }: { layout?: LayoutType | 'auto'; scenario?: Scenario } = $props();
  let host: HTMLElement;
  let menu: ReturnType<typeof GameMenu>;
  let detected = $state<LayoutType>('desktop');
  let currentScenario = $state<Scenario>(scenario);
  const activeLayout = $derived(layout === 'auto' ? detected : layout);
  const current = $derived(scenarios[currentScenario]);
  const tier = (value: number) => value >= 10 ? 'high' : value >= 2 ? 'mid' : 'low';

  $effect(() => { currentScenario = scenario; });

  function previewAction() {
    if (autoPlan || roundCrash !== null) {
      // Jeu automatique : ENCAISSER pendant la manche, « Arrêter » entre deux manches.
      if (currentScenario === 'running') {
        const value = flightValue();
        settle(value >= roundCrash! ? null : Math.floor(value * 100) / 100);
      } else stopAuto();
      return;
    }
    liveMultiplier = null;
    autoNotice = null;
    currentScenario = currentScenario === 'running' ? 'cashedOut' : currentScenario === 'queued' ? 'betting' : 'running';
  }

  /*
   * Jeu automatique simulé (maquette) : chaque manche mise la même somme, encaisse à la cible si elle est
   * atteinte avant le crash, et la série s'arrête au bout des tours choisis, à l'objectif de gain
   * (take profit) ou à la limite de perte (stop loss). Points de crash fixes : la démo est reproductible.
   */
  const CRASH_POINTS = [1.42, 3.1, 1.05, 2.6, 7.8, 1.18, 2.05, 1.66, 12.4, 1.31, 4.25, 1.02, 2.9, 1.88, 5.6];
  const GROWTH = Math.LN2 / 1.1; // ×2 en 1,1 s, comme une courbe de crash.
  let crashCursor = 0;
  let autoPlan = $state<(CrashAutoPlan & { bet: number }) | null>(null);
  let stopRequested = $state(false);
  let autoPlayed = $state(0);
  let sessionNet = $state(0);
  let lastDelta = $state(0);
  let walletNet = $state(0);
  let liveMultiplier = $state<number | null>(null);
  let roundCrash = $state<number | null>(null);
  let roundStart = 0;
  let autoNotice = $state<string | null>(null);
  let history = $state([...config.history]);
  let timer = 0;
  let frame = 0;
  const balance = $derived(Math.round((config.balance + walletNet) * 100) / 100);
  const autoActive = $derived(autoPlan !== null && !stopRequested);
  const autoLeft = $derived(autoPlan === null ? '' : autoPlan.rounds === Infinity ? '∞ tours'
    : `${autoPlan.rounds - autoPlayed} tour${autoPlan.rounds - autoPlayed > 1 ? 's' : ''}`);
  const signed = (value: number) => `${value < 0 ? '−' : '+'}${formatDecimal(Math.abs(value))} FCFA`;
  const progress = $derived(liveMultiplier === null ? undefined : 0.12 + 0.88 * Math.min(1, Math.log(liveMultiplier) / Math.log(10)));
  // Message de la série : tour en cours (ou dernier tour réglé), son résultat et le bilan.
  const autoHint = $derived.by(() => {
    if (!autoPlan) return null;
    const settled = currentScenario === 'cashedOut' || currentScenario === 'ended';
    const round = `Tour ${settled ? autoPlayed : autoPlayed + 1}${autoPlan.rounds === Infinity ? '' : `/${autoPlan.rounds}`}`;
    const detail = currentScenario === 'cashedOut' ? `encaissé, ${signed(lastDelta)}`
      : currentScenario === 'ended' ? 'crash, mise perdue'
      : autoPlan.cashout ? `encaissement auto à ${formatDecimal(autoPlan.target)}×` : 'encaissez avant le crash';
    return `${round} · ${detail} · bilan ${signed(sessionNet)}`;
  });
  const hint = $derived(autoHint ?? autoNotice ?? current.hint);

  function clearTimers() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  }

  /** Multiplicateur de la manche en vol, d'après le temps écoulé (même si l'onglet ralentit l'animation). */
  const flightValue = () => Math.exp((GROWTH * (performance.now() - roundStart)) / 1000);

  function startAuto(plan: CrashAutoPlan, bet: number) {
    if (roundCrash !== null) return; // AUTO n'est pas accessible pendant une manche.
    clearTimers();
    autoPlan = { ...plan, bet };
    stopRequested = false;
    autoPlayed = 0;
    sessionNet = 0;
    autoNotice = null;
    nextRound();
  }

  function nextRound() {
    if (!autoPlan) return;
    if (balance < autoPlan.bet) return finish(`Solde insuffisant : jeu automatique arrêté, bilan ${signed(sessionNet)}.`);
    currentScenario = 'queued';
    liveMultiplier = 1;
    timer = window.setTimeout(launch, 700);
  }

  function launch() {
    const plan = autoPlan;
    if (!plan) return;
    const crashAt = CRASH_POINTS[crashCursor++ % CRASH_POINTS.length];
    const wins = plan.cashout && plan.target <= crashAt;
    const stopAt = wins ? plan.target : crashAt;
    roundStart = performance.now();
    roundCrash = crashAt;
    currentScenario = 'running';
    // La fin de manche suit l'horloge ; l'animation ne fait qu'afficher la montée.
    timer = window.setTimeout(() => settle(wins ? plan.target : null), (Math.log(stopAt) / GROWTH) * 1000);
    const tick = () => {
      liveMultiplier = Math.min(flightValue(), stopAt);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  /** Fin de manche : `cashedAt` est le multiplicateur encaissé, ou null au crash. */
  function settle(cashedAt: number | null) {
    const crashAt = roundCrash;
    if (!autoPlan || crashAt === null) return;
    clearTimers();
    const bet = autoPlan.bet;
    const delta = cashedAt === null ? -bet : Math.round(bet * cashedAt * 100) / 100 - bet;
    lastDelta = Math.round(delta * 100) / 100;
    sessionNet = Math.round((sessionNet + delta) * 100) / 100;
    walletNet = Math.round((walletNet + delta) * 100) / 100;
    autoPlayed += 1;
    roundCrash = null;
    liveMultiplier = cashedAt ?? crashAt;
    currentScenario = cashedAt === null ? 'ended' : 'cashedOut';
    history = [crashAt, ...history].slice(0, config.history.length);

    if (sessionNet >= autoPlan.takeProfit) return finish(`Objectif de gain atteint : ${signed(sessionNet)}. Jeu automatique arrêté.`);
    if (-sessionNet >= autoPlan.stopLoss) return finish(`Limite de perte atteinte : ${signed(sessionNet)}. Jeu automatique arrêté.`);
    if (autoPlayed >= autoPlan.rounds) return finish(`Série terminée : ${autoPlayed} tours, bilan ${signed(sessionNet)}.`);
    if (stopRequested) return finish(`Jeu automatique arrêté après ${autoPlayed} tour${autoPlayed > 1 ? 's' : ''}, bilan ${signed(sessionNet)}.`);
    timer = window.setTimeout(nextRound, 1100);
  }

  function finish(notice: string) {
    clearTimers();
    autoPlan = null;
    stopRequested = false;
    autoNotice = notice;
  }

  /** AUTO ou « Arrêter » entre deux manches : la série s'arrête ; une manche en vol irait d'abord à son terme. */
  function stopAuto() {
    if (!autoPlan) return;
    if (roundCrash !== null) {
      stopRequested = true;
      return;
    }
    if (currentScenario === 'queued') {
      currentScenario = 'betting';
      liveMultiplier = null;
    }
    finish(`Jeu automatique arrêté après ${autoPlayed} tour${autoPlayed > 1 ? 's' : ''}, bilan ${signed(sessionNet)}.`);
  }

  onMount(() => {
    let resizeFrame = 0;
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        detected = detectLayout(entry.contentRect.width, entry.contentRect.height);
      });
    });
    observer.observe(host);
    return () => { observer.disconnect(); cancelAnimationFrame(resizeFrame); clearTimers(); };
  });
</script>

<main class="game immersive" data-layout={activeLayout} data-scenario={currentScenario} bind:this={host}>
  <SceneBackdrop family="crash" />
  <div class="crash-scene"><CrashCanvas scenario={currentScenario} {progress} /></div>
  <header class="topbar">
    <div class="brand" role="img" aria-label="Logo du jeu Crash">
      <span class="logo" aria-hidden="true"><Icon name="trend" size={18} /></span>
      <strong>CRASH</strong>
    </div>
    <div class="account">
      <p class="balance">
        <span class="balance-icon" aria-hidden="true"><Icon name="wallet" size={18} /></span>
        <span class="balance-text"><span class="balance-caption">Solde</span><span class="balance-value"><strong>{formatDecimal(balance)}</strong><small>FCFA</small></span></span>
      </p>
      <StudioLogo />
    </div>
  </header>

  <div class="content">
    <section class="playfield" data-phase={currentScenario} aria-label="Zone du jeu crash">
      <ol class="history" aria-label="Dernières manches">
        {#each history as value, index (index)}<li data-tier={tier(value)}>{formatDecimal(value)}×</li>{/each}
      </ol>
      <div class="status">
        <strong class="multiplier">{formatDecimal(liveMultiplier ?? current.multiplier)}×</strong>
        <p class="hint instruction" aria-live="polite">{hint}</p>
      </div>
    </section>
    <CrashHud scenario={currentScenario} layout={activeLayout} {balance} multiplier={liveMultiplier ?? undefined} {history} autoRunning={autoActive} {autoLeft}
      onaction={previewAction} onmenu={() => menu.open()} onautostart={startAuto} onautostop={stopAuto} />
  </div>

  <!-- Menu du jeu (≡) : même menu qu'africa-tower — SON, PARAMÈTRES, INFO et TABLEAU DES GAINS. -->
  <GameMenu bind:this={menu}>
    {#snippet rules()}
      <section>
        <h2>Le principe</h2>
        <p>Choisissez votre mise, puis appuyez sur JOUER. Le multiplicateur part de ×1,00 et grimpe tant que la courbe vole.</p>
        <p>La courbe peut s’arrêter à tout moment&nbsp;: c’est le crash.</p>
      </section>
      <section>
        <h2>Comment gagner</h2>
        <p>Appuyez sur ENCAISSER avant le crash&nbsp;: vous gagnez votre mise multipliée par le multiplicateur affiché.</p>
        <p>Si le crash arrive avant, la mise est perdue.</p>
      </section>
      <section>
        <h2>Le jeu automatique</h2>
        <p>AUTO ouvre le jeu automatique&nbsp;: choisissez le nombre de tours et, si vous le souhaitez, le multiplicateur auquel chaque manche est encaissée, puis appuyez sur ACTIVER.</p>
        <p>Dans AVANCÉ, fixez un objectif de gain et une limite de perte&nbsp;: comme en trading, la série s’arrête dès que le bilan atteint l’un des deux.</p>
        <p>Pendant une manche, ENCAISSER reste disponible. Entre deux manches, appuyez sur AUTO ou sur ARRÊTER pour mettre fin à la série.</p>
      </section>
      <section>
        <h2>La maquette</h2>
        <p>Montants fictifs&nbsp;: aucun compte, aucune mise réelle, aucun paiement.</p>
      </section>
    {/snippet}
    {#snippet payTable()}
      <p class="pt-mode">Gain = mise × multiplicateur</p>
      <p class="pt-intro">Le gain est votre mise multipliée par le multiplicateur au moment où vous encaissez. Exemples pour 100&nbsp;FCFA misés&nbsp;:</p>
      <div class="pt-ladder">
        {#each [1.5, 2, 3, 5, 10, 25] as factor, index (factor)}
          {#if index > 0}<div class="pt-chevron"><svg viewBox="0 0 10 16" aria-hidden="true"><path d="M0 0 L10 8 L0 16 Z" /></svg></div>{/if}
          <div class="pt-step"><span class="pt-index">×{formatDecimal(factor)}</span><span class="pt-mult">{formatDecimal(100 * factor)} FCFA</span></div>
        {/each}
      </div>
    {/snippet}
  </GameMenu>
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
  .account { display: flex; align-items: center; gap: 8px; }
  .balance { display: flex; align-items: center; gap: 10px; height: 48px; margin: 0; padding: 4px 16px 4px 4px; border: 1px solid #fbbf2426; border-radius: 999px; background: linear-gradient(135deg, #fbbf2414, transparent 60%), var(--surface-2); white-space: nowrap; }
  .balance-icon { display: grid; place-items: center; flex: none; width: 38px; height: 38px; border-radius: 50%; color: var(--gold); background: #fbbf2424; }
  .balance-text { display: grid; line-height: 1.15; }
  .balance-caption { color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .balance-value { display: flex; align-items: baseline; gap: 4px; }
  .balance-value strong { font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .balance-value small { color: var(--muted); font-size: 12px; font-weight: 600; }

  .content { flex: 1; min-height: 0; display: grid; grid-template-rows: minmax(180px, 1fr) auto; gap: 12px; }
  .playfield { position: relative; min-width: 0; min-height: 0; overflow: hidden; container-type: size; border: 1px solid var(--line); border-radius: 20px; background: radial-gradient(90% 70% at 50% 100%, #3b1f6b66, transparent 70%), var(--surface); transition: background 0.3s; }

  .history { position: absolute; top: 12px; left: 12px; right: 12px; z-index: 1; display: flex; gap: 6px; margin: 0; padding: 0; list-style: none; overflow: hidden; mask-image: linear-gradient(90deg, #000 75%, transparent); }
  .history li { flex: none; padding: 5px 10px; border: 1px solid var(--line); border-radius: 999px; background: #1b163099; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .history [data-tier='low'] { color: #8fb4ff; }
  .history [data-tier='mid'] { color: var(--accent); }
  .history [data-tier='high'] { color: var(--gold); }

  .status { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 12px; padding: 56px 20px 20px; text-align: center; pointer-events: none; }
  .multiplier { color: var(--text); font-size: clamp(48px, 22cqmin, 120px); font-weight: 800; line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; text-shadow: 0 8px 40px var(--bg); }
  [data-phase='betting'] .multiplier, [data-phase='queued'] .multiplier { color: #d8d2ea; }
  [data-phase='cashedOut'] .multiplier { color: var(--win); }
  [data-phase='ended'] .multiplier { color: var(--loss); }

  .game[data-layout='tablet'] { padding: 24px; gap: 16px; }
  .game[data-layout='tablet'] .content { gap: 16px; }
  .game[data-layout='portrait'] { padding: 12px; gap: 10px; }
  .game[data-layout='portrait'] .content { gap: 10px; }
  .game[data-layout='portrait'] .balance { gap: 8px; padding-right: 14px; }
  .game[data-layout='landscape'] { padding: 10px; gap: 8px; }
  .game[data-layout='landscape'] .content { grid-template-rows:minmax(0,1fr) auto; gap:8px; }
  .game[data-layout='landscape'] .status { gap: 8px; padding-top: 48px; }
</style>
