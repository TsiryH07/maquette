<script lang="ts">
  /*
   * Fenêtre plein écran du web-sdk (components-shared/Popup.svelte) : fond noir à 50 % flouté, contenu centré,
   * × en haut à droite ; Échap ou un clic à côté referme. Les 300 premières millisecondes, les clics sont ignorés
   * (le clic qui ouvre la fenêtre ne la referme pas aussitôt).
   */
  import { onMount, type Snippet } from 'svelte';
  import { blur } from 'svelte/transition';

  let { label, onclose, children }: { label: string; onclose: () => void; children: Snippet } = $props();
  let ready = $state(false);
  let closeButton: HTMLButtonElement;
  onMount(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton?.focus();
    const timer = setTimeout(() => (ready = true), 300);
    return () => { clearTimeout(timer); previous?.focus?.(); };
  });
  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); onclose(); }
  }
</script>

<svelte:window {onkeydown} />
<div class="pop-up-wrap" class:disabled={!ready} role="dialog" aria-modal="true" aria-label={label}>
  <div class="blur-layer"></div>
  <div class="top-layer" in:blur={{ duration: 300, opacity: 0 }}>
    <button type="button" class="click-to-close-layer" tabindex="-1" aria-label="Fermer" onclick={onclose}></button>
    <div class="close-button-wrap">
      <button bind:this={closeButton} type="button" class="close-button" aria-label="Fermer" onclick={onclose}>×</button>
    </div>
    <div class="popup-content">{@render children()}</div>
  </div>
</div>

<style>
  .pop-up-wrap {
    position: fixed;
    inset: 0;
    z-index: 1020;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: 'Montserrat', system-ui, sans-serif;
    font-weight: bold;
    letter-spacing: 0.1em;
    touch-action: manipulation;
  }
  .pop-up-wrap.disabled { pointer-events: none; }
  .blur-layer { position: absolute; inset: 0; background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); }
  .top-layer { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; }
  .click-to-close-layer { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; min-height: 0; padding: 0; border: 0; border-radius: 0; background: transparent; cursor: pointer; }
  .close-button-wrap { position: absolute; top: 0; right: 0; z-index: 101; }
  .close-button { width: 3rem; height: 3rem; min-height: 0; padding: 0; border: 0; color: #fff; background: transparent; font-size: 3rem; font-weight: 900; line-height: 0; cursor: pointer; }
  .popup-content { position: relative; z-index: 100; display: flex; flex-direction: column; align-items: center; max-width: 100%; max-height: 100%; }
</style>
