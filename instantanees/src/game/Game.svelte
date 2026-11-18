<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import SceneBackdrop from '../../../src/lib/SceneBackdrop.svelte';
  import StudioLogo from '../../../src/lib/StudioLogo.svelte';
  import '../../../src/lib/scene.css';
  import config from '../game.config';
  import InstantHud from '../components/InstantHud.svelte';
  import DiceStage from '../components/DiceStage.svelte';
  import Icon from '../components/Icon.svelte';
  import GameMenu from '../../../src/lib/GameMenu.svelte';
  import { formatDecimal } from './format';
  import { detectLayout, type LayoutType } from './layouts';
  import { risks, riskTypes, type Risk, type Scenario } from './scenarios';
  import './theme.css';
  let { layout = 'auto', scenario = 'ready' }: { layout?: LayoutType | 'auto'; scenario?: Scenario } = $props();
  let host: HTMLElement;
  let menu: ReturnType<typeof GameMenu>;
  let detected = $state<LayoutType>('desktop');
  let phase = $state<Scenario>(scenario);
  let amount = $state(config.bet);
  let risk = $state<Risk>('balanced');
  let resultFace = $state(5);
  let resultBet = $state(config.bet);
  let resultRisk = $state<Risk>('balanced');
  // Turbo : lancer plus court et dé qui roule plus vite.
  let turbo = $state(false);
  let previous: Scenario | undefined;
  let turn = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Jeu automatique : parties restant à jouer (celle en cours comprise) et pause avant la suivante.
  let autoRemaining = $state(0);
  let autoTimer: ReturnType<typeof setTimeout> | undefined;
  const activeLayout = $derived(layout === 'auto' ? detected : layout);
  const payout = $derived(phase === 'won' ? Math.round(resultBet * risks[resultRisk].factor * 100) / 100 : 0);
  $effect(() => {
    if (previous !== scenario) {
      clearTimeout(timer); clearTimeout(autoTimer); autoRemaining = 0; phase = scenario; resultBet = amount; resultRisk = risk;
      resultFace = scenario === 'lost' ? 1 : Math.max(5,risks[risk].min); previous = scenario;
    }
  });
  function play() {
    if (phase === 'playing') return;
    resultBet = amount; resultRisk = risk; phase = 'playing';
    timer = setTimeout(() => {
      const wins = turn++ % 2 === 0;
      resultFace = wins ? Math.max(5,risks[resultRisk].min) : 1;
      phase = wins ? 'won' : 'lost';
      if (autoRemaining > 0) {
        autoRemaining -= 1;
        if (autoRemaining > 0) autoTimer = setTimeout(play, turbo ? 350 : 900);
      }
    }, turbo ? 250 : 650);
  }
  // « Activer » : lance la série tout de suite ; « Arrêter » : la partie en cours se termine, aucune autre ne suit.
  function startAuto(count: number) {
    if (phase === 'playing' || count <= 0) return;
    autoRemaining = count;
    play();
  }
  function stopAuto() {
    autoRemaining = 0;
    clearTimeout(autoTimer);
  }
  onDestroy(() => { clearTimeout(timer); clearTimeout(autoTimer); });
  onMount(() => {
    let resizeFrame = 0;
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => detected = detectLayout(entry.contentRect.width,entry.contentRect.height));
    });
    observer.observe(host);
    return () => { observer.disconnect(); cancelAnimationFrame(resizeFrame); };
  });
</script>

<main class="game immersive" data-layout={activeLayout} data-scenario={phase} bind:this={host}>
  <SceneBackdrop family="instantanees" />
  <header class="topbar">
    <div class="brand" role="img" aria-label="Logo du jeu Dés">
      <span class="logo" aria-hidden="true"><Icon name="coins" size={18} /></span>
      <strong>DÉS</strong>
    </div>
    <div class="account">
      <p class="balance">
        <span class="balance-icon" aria-hidden="true"><Icon name="wallet" size={18} /></span>
        <span class="balance-text"><span class="balance-caption">Solde</span><span class="balance-value"><strong>{formatDecimal(config.balance)}</strong><small>FCFA</small></span></span>
      </p>
      <StudioLogo />
    </div>
  </header>


  <div class="content">
    <section class="stage" aria-label="Zone du jeu de dés"><DiceStage scenario={phase} playedRisk={resultRisk} face={resultFace} {payout} {turbo} /></section>
    <InstantHud scenario={phase} layout={activeLayout} bind:amount bind:risk bind:turbo {autoRemaining} onaction={play} onautostart={startAuto} onautostop={stopAuto} onmenu={() => menu.open()} />
  </div>
  <!-- Menu du jeu (≡) : même menu qu'africa-tower — SON, PARAMÈTRES, INFO et TABLEAU DES GAINS. -->
  <GameMenu bind:this={menu}>
    {#snippet rules()}
      <section>
        <h2>Le principe</h2>
        <p>Choisissez un risque et une mise, puis appuyez sur JOUER&nbsp;: le dé est lancé une fois.</p>
      </section>
      <section>
        <h2>Comment gagner</h2>
        <p>Vous gagnez si le dé atteint l’objectif du risque choisi&nbsp;: votre mise est alors multipliée par le gain de ce risque.</p>
      </section>
      <section>
        <h2>Les risques</h2>
        <p>Plus l’objectif est difficile, plus le gain est élevé.</p>
        <ul>
          {#each riskTypes as value (value)}
            <li><strong>{risks[value].label}</strong> — {risks[value].hint}, gain ×{formatDecimal(risks[value].factor)}</li>
          {/each}
        </ul>
      </section>
      <section>
        <h2>Auto et turbo</h2>
        <p>AUTO enchaîne 10, 25 ou 50 parties avec la même mise et le même risque&nbsp;; ARRÊTER interrompt la série. TURBO accélère le lancer.</p>
      </section>
      <section>
        <h2>La maquette</h2>
        <p>Démonstration déterministe&nbsp;: un résultat gagnant puis un résultat sans gain. Aucun paiement ni tirage réel.</p>
      </section>
    {/snippet}
    {#snippet payTable()}
      <p class="pt-mode">Risque&nbsp;: <strong>{risks[risk].label}</strong></p>
      <p class="pt-intro">Si le dé atteint l’objectif, la mise est multipliée par le gain du risque choisi.</p>
      <div class="pt-ladder">
        {#each riskTypes as value (value)}
          <div class="pt-step" class:pt-next={value === risk}><span class="pt-index">{risks[value].label} · {risks[value].hint}</span><span class="pt-mult">×{formatDecimal(risks[value].factor)}</span></div>
        {/each}
      </div>
    {/snippet}
  </GameMenu>
</main>
