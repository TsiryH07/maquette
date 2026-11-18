<script lang="ts">
  /*
   * Fenêtre « TOURS AUTO » du web-sdk (components-ui-html/ModalAutoSpin.svelte et ses blocs) :
   * NOMBRE DE TOURS (10 … 1000 et ∞, 1000 retiré en paysage), puis, si `advanced`, le menu AVANCÉ
   * (LIMITE DE PERTE et LIMITE DE GAIN UNIQUE, en multiples de la mise), et LANCER L'AUTO-SPIN.
   * Les jeux instantanés et à révélation du web-sdk n'ont pas le menu AVANCÉ (autoSpinsAdvancedEnabled = false),
   * les slots l'ont.
   */
  import { slide } from 'svelte/transition';
  import SdkPopup from './SdkPopup.svelte';

  const INFINITY_MARK = '∞';
  const ROUNDS = ['10', '25', '50', '75', '100', '250', '500', '1000', INFINITY_MARK] as const;
  const LIMITS = ['5×', '10×', '25×', '50×', '100×', INFINITY_MARK] as const;
  type Rounds = (typeof ROUNDS)[number];
  type Limit = (typeof LIMITS)[number];
  const toNumber = (text: string) => (text === INFINITY_MARK ? Infinity : parseInt(text, 10));

  let { advanced = false, landscape = false, disabled = false, onstart }: {
    /** Menu AVANCÉ (limites de perte et de gain unique), comme les slots du web-sdk. */
    advanced?: boolean;
    /** Paysage : pas d'option 1000, comme dans le web-sdk. */
    landscape?: boolean;
    /** Mise impossible (solde insuffisant) : LANCER L'AUTO-SPIN désactivé. */
    disabled?: boolean;
    /** Tours (Infinity pour ∞), puis limites de perte et de gain unique en multiples de la mise (Infinity : sans limite). */
    onstart: (rounds: number, lossLimit: number, singleWinLimit: number) => void;
  } = $props();

  let isOpen = $state(false);
  let rounds = $state<Rounds>('10');
  let lossLimit = $state<Limit>(INFINITY_MARK);
  let winLimit = $state<Limit>(INFINITY_MARK);
  let advancedOpen = $state(false);
  const options = $derived(landscape ? ROUNDS.filter(value => value !== '1000') : ROUNDS);

  export function open() { isOpen = true; }
  export function close() { isOpen = false; }
  function start() {
    if (disabled) return;
    isOpen = false;
    onstart(toNumber(rounds), toNumber(lossLimit), toNumber(winLimit));
  }

  // Le contenu est réduit s'il ne tient pas dans l'écran (même calcul que ModalAutoSpin : hauteur − 250).
  let content = $state<HTMLDivElement>();
  let scale = $state(1);
  $effect(() => {
    if (!content) return;
    const node = content;
    const measure = () => {
      const width = node.offsetWidth, height = node.offsetHeight;
      scale = Math.min(1, width ? innerWidth / width : 1, height ? (innerHeight - 250) / height : 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    addEventListener('resize', measure);
    return () => { observer.disconnect(); removeEventListener('resize', measure); };
  });
</script>

{#snippet grid(values: readonly string[], selected: string, choose: (value: string) => void, mini: boolean, group: string)}
  <div class="as-options-wrap">
    <div class="as-grid" class:as-mini-size={mini} role="group" aria-label={group}>
      {#each values as value (value)}
        <button type="button" class="as-option" aria-pressed={value === selected} onclick={() => choose(value)}>
          <span class="as-rectangle" class:as-chosen={value === selected}></span>
          <span class="as-button-content"><span class:as-infinity={value === INFINITY_MARK}>{value}</span></span>
        </button>
      {/each}
    </div>
  </div>
{/snippet}

{#if isOpen}
  <SdkPopup label="Tours auto" onclose={close}>
    <div class="as-wrap" class:as-scaled={scale < 1}>
      <div class="as-content" bind:this={content} style:transform="scale({scale})">
        <div class="as-title">Tours auto</div>
        <div class="as-scrollable">
          <div class="as-subtitle">Nombre de tours</div>
          {@render grid(options, rounds, (value) => (rounds = value as Rounds), false, 'Nombre de tours')}
          {#if advanced}
            <label class="as-toggle">
              <span class="as-toggle-content" class:as-toggled={advancedOpen}>Avancé</span>
              <input type="checkbox" checked={advancedOpen} onchange={() => (advancedOpen = !advancedOpen)} />
            </label>
            {#if advancedOpen}
              <div class="as-advanced" transition:slide={{ duration: 100 }}>
                <span class="as-limit-title">Limite de perte</span>
                {@render grid(LIMITS, lossLimit, (value) => (lossLimit = value as Limit), true, 'Limite de perte')}
                <span class="as-limit-title">Limite de gain unique</span>
                {@render grid(LIMITS, winLimit, (value) => (winLimit = value as Limit), true, 'Limite de gain unique')}
              </div>
            {/if}
          {/if}
        </div>
        <div class="as-button-wrap">
          <button type="button" class="as-start" {disabled} onclick={start}>
            <span class="as-rectangle as-start-rectangle"></span>
            <span class="as-button-content"><span>Lancer l'auto-spin</span></span>
          </button>
        </div>
      </div>
    </div>
  </SdkPopup>
{/if}

<style>
  .as-wrap { display: flex; justify-content: center; }
  .as-content { display: flex; flex-direction: column; align-items: center; gap: 1rem; transform-origin: center center; text-transform: uppercase; }
  .as-title { text-align: center; }
  .as-scrollable { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }
  /* OptionsGrid : 3 colonnes (4 sur écran court), rectangles noirs, celui choisi cerclé de blanc. */
  .as-options-wrap { min-width: 20rem; }
  @media (orientation: portrait) and (min-width: 320px) and (max-width: 370px) { .as-options-wrap { min-width: 17rem; } }
  @media (orientation: landscape) and (min-height: 255px) and (max-height: 480px) { .as-options-wrap { min-width: 23rem; } }
  .as-grid { display: grid; grid-template-columns: repeat(3, 1fr); place-content: center; gap: 0.75rem; }
  @media (max-height: 480px) { .as-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (max-width: 500px), (max-height: 500px) { .as-grid.as-mini-size { grid-template-columns: repeat(auto-fit, minmax(20px, 1fr)); } }
  .as-option, .as-start {
    position: relative;
    display: inline-flex;
    justify-content: center;
    width: 100%;
    min-height: 0;
    padding: 0;
    border: 0;
    border-color: transparent;
    color: #fff;
    background: transparent;
    font-family: 'Montserrat', system-ui, sans-serif;
    font-weight: bold;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .as-option[aria-pressed='true'] { background: transparent; }
  .as-rectangle { display: block; width: 100%; height: 2rem; box-sizing: border-box; border: 2px solid #000; border-radius: 10px; background: #000; }
  .as-rectangle.as-chosen { border-color: #fff; }
  .as-start-rectangle { height: 3rem; border: 0; }
  .as-button-content { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1rem; white-space: nowrap; }
  .as-infinity { margin-top: 0.3rem; font-size: 1.5rem; line-height: 1rem; }
  .as-button-wrap { display: flex; justify-content: center; width: 100%; }
  .as-start:disabled { opacity: 0.55; cursor: default; }
  /* DropdownToggle « AVANCÉ ▼ / ▲ » et cadre blanc des limites. */
  .as-toggle { position: relative; display: inline-block; color: #fff; cursor: pointer; }
  .as-toggle input { position: absolute; width: 0; height: 0; opacity: 0; }
  .as-toggle-content { font-weight: bold; white-space: nowrap; }
  .as-toggle-content::after { content: '▼'; margin-left: 0.5rem; color: #fff; vertical-align: middle; }
  .as-toggle-content.as-toggled::after { content: '▲'; vertical-align: top; }
  .as-toggle:focus-within .as-toggle-content { outline: 2px solid #fff; outline-offset: 4px; border-radius: 4px; }
  .as-advanced { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.5rem; border: 2px solid #fff; border-radius: 10px; }
  .as-limit-title { line-height: 1.4rem; }
  .as-option:focus-visible, .as-start:focus-visible { outline: 2px solid #ffd166; outline-offset: 3px; border-radius: 10px; }
</style>
