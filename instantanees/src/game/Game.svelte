<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import config from '../game.config';
  import InstantHud from '../components/InstantHud.svelte';
  import DiceStage from '../components/DiceStage.svelte';
  import Icon from '../components/Icon.svelte';
  import Sheet from '../components/Sheet.svelte';
  import { formatDecimal } from './format';
  import { detectLayout, type LayoutType } from './layouts';
  import { risks, type Risk, type Scenario } from './scenarios';
  import './theme.css';
  let { layout = 'auto', scenario = 'ready' }: { layout?: LayoutType | 'auto'; scenario?: Scenario } = $props();
  let host: HTMLElement;
  let menu: ReturnType<typeof Sheet>;
  let sound = $state(true);
  let detected = $state<LayoutType>('desktop');
  let phase = $state<Scenario>(scenario);
  let amount = $state(config.bet);
  let risk = $state<Risk>('balanced');
  let resultFace = $state(5);
  let resultBet = $state(config.bet);
  let resultRisk = $state<Risk>('balanced');
  let previous: Scenario | undefined;
  let turn = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const activeLayout = $derived(layout === 'auto' ? detected : layout);
  const payout = $derived(phase === 'won' ? Math.round(resultBet * risks[resultRisk].factor * 100) / 100 : 0);
  $effect(() => {
    if (previous !== scenario) {
      clearTimeout(timer); phase = scenario; resultBet = amount; resultRisk = risk;
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
    },650);
  }
  onDestroy(() => clearTimeout(timer));
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

<main class="game" data-layout={activeLayout} data-scenario={phase} bind:this={host}>
  <header class="topbar">
    <div class="brand">
      <span class="logo" aria-hidden="true"><Icon name="coins" size={18} /></span>
      <strong>DÉS</strong>
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
    <section class="stage" aria-label="Zone du jeu de dés"><DiceStage scenario={phase} bind:risk playedRisk={resultRisk} face={resultFace} {payout} /></section>
    <InstantHud scenario={phase} layout={activeLayout} bind:amount {risk} {payout} onaction={play} />
  </div>
  <Sheet bind:this={menu} title="Menu du jeu" closeLabel="Fermer le menu" layout={activeLayout}>
    <label class="row"><span><strong>Son</strong><small>Option visuelle de la maquette.</small></span><input type="checkbox" aria-label="Son" bind:checked={sound} /></label>
    <h3 class="section-title">Comment jouer</h3>
    <ol><li>Choisissez un niveau de risque.</li><li>Réglez la mise, puis appuyez sur « Jouer ».</li><li>Le résultat du dé indique immédiatement le gain.</li></ol>
    <p class="note">Démonstration déterministe : un résultat gagnant puis un résultat sans gain. Aucun paiement ni tirage réel. Le solde ne change pas.</p>
  </Sheet>
</main>
