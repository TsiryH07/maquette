<script lang="ts">
  import { onMount } from 'svelte';
  import SceneBackdrop from '$lib/SceneBackdrop.svelte';
  import CasinoControlDock, { type Difficulty, type PlayDetail } from '$lib/CasinoControlDock.svelte';

  // Aperçu du dock commun : montants fictifs, aucun serveur de jeu.
  let balance = $state(10000);
  let bet = $state(400);
  let difficulty = $state<Difficulty>('Normal');
  let isAuto = $state(false);
  let isTurbo = $state(false);
  // Téléphone tenu debout : disposition portrait du dock.
  let portrait = $state(false);
  onMount(() => {
    const update = () => (portrait = innerWidth / innerHeight <= 0.8);
    update();
    addEventListener('resize', update);
    return () => removeEventListener('resize', update);
  });
  let isPlaying = $state(false);
  let message = $state('Réglez la mise, puis appuyez sur JOUER.');
  const fcfa = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;

  function play({ bet: stake }: PlayDetail) {
    if (isPlaying) return;
    if (stake > balance) { message = 'Solde insuffisant.'; isAuto = false; return; }
    isPlaying = true;
    balance -= stake;
    message = `Partie en cours… mise de ${fcfa(stake)} (${difficulty})`;
    setTimeout(() => {
      const gain = Math.random() < 0.5 ? stake * 2 : 0;
      balance += gain;
      isPlaying = false;
      message = gain ? `Gagné : +${fcfa(gain)}` : 'Perdu, rejouez !';
      // En mode Auto, la partie suivante repart toute seule.
      if (isAuto) setTimeout(() => { if (isAuto) play({ bet, difficulty, isAuto }); }, isTurbo ? 250 : 700);
    }, isTurbo ? 400 : 1200);
  }
</script>

<svelte:head><title>Aperçu — barre de commandes commune</title></svelte:head>

<main class="dock-preview">
  <SceneBackdrop family="crash" />
  <p class="message" aria-live="polite">{message}</p>
  <CasinoControlDock gameType="dice" {portrait} {balance} bind:bet bind:difficulty bind:isAuto bind:isTurbo {isPlaying}
    onplay={play}
    onmenu={() => (message = 'Menu ouvert')}
    ontoggleauto={on => { if (on && !isPlaying) play({ bet, difficulty, isAuto }); }} />
</main>

<style>
  .dock-preview { position: relative; height: 100dvh; overflow: hidden; background: #0b1020; }
  .message { position: absolute; inset: 38% 0 auto; margin: 0; padding: 0 16px; color: #e9e5f7; font: 600 clamp(14px, 2vw, 20px) system-ui, sans-serif; text-align: center; text-shadow: 0 2px 10px #000a; }
</style>
