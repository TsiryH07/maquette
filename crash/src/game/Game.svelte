<script lang="ts">
  import { onMount } from 'svelte';
  import config from '../game.config';
  import CrashCanvas from '../components/CrashCanvas.svelte';
  import CrashHud from '../components/CrashHud.svelte';
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import { formatDecimal } from './format';
  import { detectLayout, type LayoutType } from './layouts';
  import { scenarios, type Scenario } from './scenarios';

  let { layout = 'auto', scenario = 'betting' }: { layout?: LayoutType | 'auto'; scenario?: Scenario } = $props();
  let host: HTMLElement;
  let menu: ReturnType<typeof Sheet>;
  let sound = $state(true);
  let detected = $state<LayoutType>('desktop');
  let currentScenario = $state<Scenario>(scenario);
  const activeLayout = $derived(layout === 'auto' ? detected : layout);
  const current = $derived(scenarios[currentScenario]);
  const tier = (value: number) => value >= 10 ? 'high' : value >= 2 ? 'mid' : 'low';

  $effect(() => { currentScenario = scenario; });

  function previewAction() {
    currentScenario = currentScenario === 'running' ? 'cashedOut' : currentScenario === 'queued' ? 'betting' : 'running';
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
    return () => { observer.disconnect(); cancelAnimationFrame(resizeFrame); };
  });
</script>

<main class="game" data-layout={activeLayout} data-scenario={currentScenario} bind:this={host}>
  <header class="topbar">
    <div class="brand">
      <span class="logo" aria-hidden="true"><Icon name="trend" size={18} /></span>
      <strong>CRASH</strong>
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
    <section class="playfield" data-phase={currentScenario} aria-label="Zone du jeu crash">
      <CrashCanvas scenario={currentScenario} />
      <ol class="history" aria-label="Dernières manches">
        {#each config.history as value}<li data-tier={tier(value)}>{formatDecimal(value)}×</li>{/each}
      </ol>
      <div class="status">
        <span class="phase">{current.phase}</span>
        <strong class="multiplier">{formatDecimal(current.multiplier)}×</strong>
        <span class="hint">{current.hint}</span>
      </div>
    </section>
    <CrashHud scenario={currentScenario} layout={activeLayout} onaction={previewAction} />
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
      <li><strong>Misez</strong>Choisissez un montant, puis appuyez sur « Miser » avant le départ.</li>
      <li><strong>Suivez la courbe</strong>Le multiplicateur monte tant que la manche dure.</li>
      <li><strong>Encaissez avant le crash</strong>Le gain est la mise multipliée par le multiplicateur.</li>
    </ol>
    <p class="note demo"><Icon name="info" size={18} />Maquette interactive : montants fictifs, aucun paiement. Les automatismes et le son sont illustratifs.</p>
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

  .content { flex: 1; min-height: 0; display: grid; grid-template-rows: minmax(180px, 1fr) auto; gap: 12px; }
  .playfield { position: relative; min-width: 0; min-height: 0; overflow: hidden; container-type: size; border: 1px solid var(--line); border-radius: 20px; background: radial-gradient(90% 70% at 50% 100%, #3b1f6b66, transparent 70%), var(--surface); transition: background 0.3s; }
  .playfield[data-phase='cashedOut'] { background: radial-gradient(90% 70% at 50% 100%, #065f4655, transparent 70%), var(--surface); }
  .playfield[data-phase='ended'] { background: radial-gradient(90% 70% at 50% 100%, #8a1c3b55, transparent 70%), var(--surface); }

  .history { position: absolute; top: 12px; left: 12px; right: 12px; z-index: 1; display: flex; gap: 6px; margin: 0; padding: 0; list-style: none; overflow: hidden; mask-image: linear-gradient(90deg, #000 75%, transparent); }
  .history li { flex: none; padding: 5px 10px; border: 1px solid var(--line); border-radius: 999px; background: #1b163099; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .history [data-tier='low'] { color: #8fb4ff; }
  .history [data-tier='mid'] { color: var(--accent); }
  .history [data-tier='high'] { color: var(--gold); }

  .status { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 12px; padding: 56px 20px 20px; text-align: center; pointer-events: none; }
  .phase { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; color: var(--accent); background: var(--accent-soft); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .phase::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  .multiplier { color: var(--text); font-size: clamp(48px, 22cqmin, 120px); font-weight: 800; line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; text-shadow: 0 8px 40px var(--bg); }
  .hint { color: var(--muted); font-size: 16px; text-shadow: 0 0 8px var(--bg), 0 0 16px var(--bg); }
  [data-phase='betting'] .multiplier, [data-phase='queued'] .multiplier { color: #d8d2ea; }
  [data-phase='queued'] .phase { color: var(--gold); background: #fbbf2420; }
  [data-phase='running'] .phase::before { animation: pulse 1.2s ease-in-out infinite; }
  [data-phase='cashedOut'] .phase { color: var(--win); background: #34d39920; }
  [data-phase='cashedOut'] .multiplier { color: var(--win); }
  [data-phase='ended'] .phase { color: var(--loss); background: #fb718520; }
  [data-phase='ended'] .multiplier { color: var(--loss); }
  @keyframes pulse { 50% { opacity: 0.3; } }
  @media (prefers-reduced-motion: reduce) { [data-phase='running'] .phase::before { animation: none; } }

  .game[data-layout='tablet'] { padding: 24px; gap: 16px; }
  .game[data-layout='tablet'] .content { gap: 16px; }
  .game[data-layout='portrait'] { padding: 12px; gap: 10px; }
  .game[data-layout='portrait'] .tag { display: none; }
  .game[data-layout='portrait'] .content { gap: 10px; }
  .game[data-layout='portrait'] .balance { gap: 8px; padding-right: 14px; }
  .game[data-layout='landscape'] { padding: 10px; gap: 8px; }
  .game[data-layout='landscape'] .content { grid-template-columns: minmax(0, 1fr) minmax(340px, 44%); grid-template-rows: minmax(0, 1fr); gap: 10px; }
  .game[data-layout='landscape'] .status { gap: 8px; padding-top: 48px; }
  .game[data-layout='landscape'] .hint { font-size: 14px; }
</style>
