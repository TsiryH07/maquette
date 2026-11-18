<script lang="ts">
  /*
   * Menu du jeu, repris d'africa-tower (web-sdk : LayoutShell « modalScrim » + ButtonMenuClose,
   * ButtonSoundSwitch, ButtonSettings, ButtonGameRules, ButtonPayTable, et components-ui-html :
   * Popup, ModalSettings, ModalGameRules, ModalPayTable).
   * ≡ ouvre un voile noir à 50 % et une colonne de ronds qui monte depuis le ≡ : ✕ à la place exacte du ≡,
   * puis SON, PARAMÈTRES, INFO (règles du jeu) et TABLEAU DES GAINS. SON bascule le son ; les trois autres
   * ouvrent chacun leur fenêtre plein écran (fond flouté, × en haut à droite, Échap ou clic à côté pour fermer),
   * le menu restant ouvert derrière.
   */
  import { onDestroy, tick, type Snippet } from 'svelte';
  import { sound } from './sound.svelte';

  let { rules, payTable }: {
    /** Contenu de la fenêtre INFO : sections titrées des règles du jeu. */
    rules: Snippet;
    /** Contenu de la fenêtre TABLEAU DES GAINS. */
    payTable: Snippet;
  } = $props();

  type Modal = 'settings' | 'gameRules' | 'payTable';
  let menuOpen = $state(false);
  let modal = $state<Modal | null>(null);
  // Volumes partagés avec le bouton SON du dock (src/lib/sound.svelte.ts).
  const soundOn = $derived(sound.on);

  let probe: HTMLSpanElement;
  let closeButton = $state<HTMLButtonElement>();
  let trigger: HTMLElement | null = null;
  // Colonne posée sur le ≡ : centre, taille du ≡, diamètre des ronds, écarts (proportions d'africa-tower).
  // Place, taille et forme exactes du ≡ : le ✕ le recouvre à l'identique (rond sur ordinateur, rectangle en portrait).
  let anchor = $state({ x: 0, y: 0, size: 54, width: 54, height: 54, radius: '50%' });
  const diameter = $derived(Math.max(40, anchor.size * 0.75));
  // Portrait d'africa-tower : 1er écart 190 et pas 210 pour des ronds de 112,5 ; resserrés si l'écran est court.
  const pitch = $derived(Math.min(diameter * 1.87, Math.max(diameter * 1.15, (anchor.y - 12 - diameter / 2) / 3.9)));
  const topGap = $derived(Math.min(diameter * 1.69, pitch * 0.9));

  function place() {
    trigger = probe?.closest('main')?.querySelector<HTMLElement>('.dock .menu-btn') ?? null;
    const rect = trigger?.getBoundingClientRect();
    // Les ronds du menu gardent le diamètre du plus petit côté du ≡ ; le ✕, lui, reprend sa taille et sa forme.
    if (rect) anchor = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      size: Math.min(rect.width, rect.height),
      width: rect.width,
      height: rect.height,
      radius: trigger ? getComputedStyle(trigger).borderRadius : '50%',
    };
  }
  export function open() {
    place();
    modal = null;
    menuOpen = true;
    addEventListener('resize', place);
    tick().then(() => closeButton?.focus());
  }
  export function close() {
    menuOpen = false;
    modal = null;
    removeEventListener('resize', place);
    trigger?.focus();
  }
  onDestroy(() => removeEventListener('resize', place));

  function toggleSound() { sound.toggle(); }
  function show(next: Modal) { modal = next; }
  function hide() { modal = null; }
  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !menuOpen) return;
    event.preventDefault();
    if (modal) hide(); else close();
  }

  // Icônes du web-sdk (components-ui-pixi-shared), dessinées en blanc.
  const icons = {
    soundOn: '<svg viewBox="-0.5 0 25 25" fill="none"><path d="M12.5493 4.50005C11.3193 4.04005 8.70926 5.49996 6.54926 7.40996H4.94922C3.88835 7.40996 2.87093 7.83145 2.12079 8.58159C1.37064 9.33174 0.949219 10.3491 0.949219 11.41V13.41C0.949219 14.4708 1.37064 15.4883 2.12079 16.2385C2.87093 16.9886 3.88835 17.41 4.94922 17.41H6.54926C8.65926 19.35 11.2693 20.78 12.5493 20.33C14.6493 19.55 14.9992 15.33 14.9992 12.41C14.9992 9.48996 14.6493 5.28005 12.5493 4.50005Z" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.6602 6.71997C22.1593 8.22011 23.0015 10.2542 23.0015 12.375C23.0015 14.4958 22.1593 16.5299 20.6602 18.03" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5391 15.95C19.4764 15.0123 20.003 13.7407 20.003 12.4149C20.003 11.0891 19.4764 9.81764 18.5391 8.88" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    soundOff: '<svg viewBox="-0.5 0 25 25" fill="none"><path d="M10.9395 17.72C12.9395 19.5 15.3895 20.72 16.5495 20.33C18.6495 19.55 18.9995 15.3299 18.9995 12.4099C18.9995 11.5999 18.9995 10.68 18.8895 9.77002" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.1292 6.28008C18.0012 5.89129 17.795 5.53273 17.5233 5.22661C17.2516 4.9205 16.9201 4.67327 16.5493 4.50005C15.3193 4.04005 12.7093 5.49996 10.5493 7.40996H8.94922C7.88835 7.40996 6.87093 7.83145 6.12079 8.58159C5.37064 9.33174 4.94922 10.3491 4.94922 11.41V13.41C4.9489 14.1811 5.17151 14.936 5.59021 15.5835C6.00892 16.2311 6.60585 16.7438 7.3092 17.06" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2.42004L2 22.42" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224ZM12.5 15C14.1695 15 15.5228 13.6569 15.5228 12C15.5228 10.3431 14.1695 9 12.5 9C10.8305 9 9.47716 10.3431 9.47716 12C9.47716 13.6569 10.8305 15 12.5 15Z" fill="#fff"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="7" r="1.5"/><rect x="10.5" y="10" width="3" height="10" rx="1.5"/></svg>',
    payTable: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 4L9 20M15 4L15 20M3 9H21M3 15H21M6.2 20H17.8C18.9201 20 19.4802 20 19.908 19.782C20.2843 19.5903 20.5903 19.2843 20.782 18.908C21 18.4802 21 17.9201 21 16.8V7.2C21 6.0799 21 5.51984 20.782 5.09202C20.5903 4.71569 20.2843 4.40973 19.908 4.21799C19.4802 4 18.9201 4 17.8 4H6.2C5.07989 4 4.51984 4 4.09202 4.21799C3.71569 4.40973 3.40973 4.71569 3.21799 5.09202C3 5.51984 3 6.07989 3 7.2V16.8C3 17.9201 3 18.4802 3.21799 18.908C3.40973 19.2843 3.71569 19.5903 4.09202 19.782C4.51984 20 5.07989 20 6.2 20Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  // Ordre de la pile d'africa-tower, du bas vers le haut, au-dessus du ✕.
  const items = $derived([
    { id: 'sound', label: soundOn ? 'Son activé' : 'Son désactivé', icon: soundOn ? icons.soundOn : icons.soundOff, onclick: toggleSound, pressed: soundOn },
    { id: 'settings', label: 'Paramètres', icon: icons.settings, onclick: () => show('settings') },
    { id: 'gameRules', label: 'Info', aria: 'Info : règles du jeu', icon: icons.info, onclick: () => show('gameRules') },
    { id: 'payTable', label: 'Tableau des gains', icon: icons.payTable, onclick: () => show('payTable') },
  ]);
  const volumes = [
    { label: 'Volume principal', get: () => sound.master, set: (value: number) => (sound.master = value) },
    { label: 'Volume musique', get: () => sound.music, set: (value: number) => (sound.music = value) },
    { label: 'Volume effets sonores', get: () => sound.effects, set: (value: number) => (sound.effects = value) },
  ];
</script>

<svelte:window {onkeydown} />
<span class="gm-probe" bind:this={probe} hidden></span>

{#if menuOpen}
  <!-- Voile du menu : un clic à côté referme (africa-tower : scrim 0,5, onpointerup → menuOpen = false). -->
  <div class="gm-menu" role="dialog" aria-modal="true" aria-label="Menu du jeu"
    style:--d="{diameter}px" style:--size="{anchor.size}px"
    style:--close-w="{anchor.width}px" style:--close-h="{anchor.height}px" style:--close-radius={anchor.radius}>
    <button type="button" class="gm-scrim" tabindex="-1" aria-label="Fermer le menu" onclick={close}></button>
    <div class="gm-column" style:left="{anchor.x}px" style:top="{anchor.y}px">
      <button bind:this={closeButton} type="button" class="gm-close" aria-label="Fermer le menu" onclick={close}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      {#each items as item, index (item.id)}
        <button type="button" class="gm-item" style:--y="{-(topGap + pitch * index)}px"
          aria-label={item.aria ?? item.label} aria-pressed={item.pressed} aria-haspopup={item.id === 'sound' ? undefined : 'dialog'}
          onclick={item.onclick}>
          <span class="gm-circle" aria-hidden="true">{@html item.icon}</span>
          <span class="gm-label">{item.label}</span>
        </button>
      {/each}
    </div>
  </div>

  {#if modal}
    <!-- Fenêtre d'une section (components-shared/Popup) : fond flouté, × en haut à droite, clic à côté pour fermer. -->
    <div class="gm-popup" role="dialog" aria-modal="true"
      aria-label={modal === 'settings' ? 'Paramètres' : modal === 'gameRules' ? 'Règles du jeu' : 'Tableau des gains'}>
      <div class="gm-blur"></div>
      <button type="button" class="gm-outside" tabindex="-1" aria-label="Fermer" onclick={hide}></button>
      <button type="button" class="gm-x" aria-label="Fermer" onclick={hide}>×</button>
      <div class="gm-content" class:settings={modal === 'settings'}>
        {#if modal === 'settings'}
          <div class="gm-title">Paramètres</div>
          <div class="gm-volumes">
            {#each volumes as volume (volume.label)}
              <div class="gm-volume">
                <span>{volume.label}</span>
                <div class="gm-volume-row">
                  <button type="button" class="gm-mute" aria-label="{volume.label} : {volume.get() > 0 ? 'couper' : 'remettre'}"
                    onclick={() => volume.set(volume.get() === 0 ? 50 : 0)}>{@html volume.get() > 0 ? icons.soundOn : icons.soundOff}</button>
                  <input type="range" min="0" max="100" aria-label={volume.label} value={volume.get()}
                    oninput={(event) => volume.set(Number((event.currentTarget as HTMLInputElement).value))} />
                  <span class="gm-value">{volume.get()}</span>
                </div>
              </div>
            {/each}
          </div>
        {:else if modal === 'gameRules'}
          <div class="gm-scroll">{@render rules()}</div>
        {:else}
          <div class="gm-scroll">{@render payTable()}</div>
        {/if}
      </div>
    </div>
  {/if}
{/if}

<style>
  /* ── Menu : voile noir à 50 %, colonne de ronds posée sur le ≡ ── */
  .gm-menu { position: fixed; inset: 0; z-index: 1000; }
  .gm-scrim { position: absolute; inset: 0; width: 100%; height: 100%; min-height: 0; padding: 0; border: 0; border-radius: 0; background: rgba(0, 0, 0, 0.5); cursor: pointer; }
  .gm-column { position: absolute; width: 0; height: 0; }
  /* ✕ : exactement le bouton ≡ du dock — sa taille et sa forme (rond sur ordinateur, rectangle en portrait), à sa place. */
  .gm-close {
    position: absolute;
    left: 0;
    top: 0;
    display: grid;
    place-items: center;
    width: var(--close-w);
    height: var(--close-h);
    min-height: 0;
    padding: 0;
    border: calc(var(--size) * 0.055) solid #3b3459;
    border-radius: var(--close-radius);
    color: #fff;
    background: radial-gradient(circle at 50% 30%, #2d2749 0%, #1a1631 58%, #100d21 100%);
    box-shadow: 0 0 0 1.5px #5c4f88, inset 0 1.5px 0 rgba(255, 255, 255, 0.14), 0 6px 16px rgba(0, 0, 0, 0.65);
    transform: translate(-50%, -50%);
    transition: transform 0.12s ease;
  }
  .gm-close svg { width: calc(var(--size) * 0.46); height: calc(var(--size) * 0.46); fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; }
  .gm-close:hover { transform: translate(-50%, -50%) scale(1.05); }
  .gm-close:active { transform: translate(-50%, -50%) scale(0.95); }
  /* Un rond noir cerclé de blanc (UiButton du web-sdk : bord 7 % du diamètre, blanc à 80 %), libellé à droite. */
  .gm-item {
    position: absolute;
    left: calc(var(--d) / -2);
    top: calc(var(--y) - var(--d) / 2);
    display: flex;
    align-items: center;
    gap: calc(var(--d) * 0.55);
    height: var(--d);
    min-height: 0;
    padding: 0;
    border: 0;
    color: #fff;
    background: none;
    white-space: nowrap;
    transition: transform 0.12s ease;
    transform-origin: calc(var(--d) / 2) 50%;
  }
  .gm-item:hover { transform: scale(1.05); }
  .gm-item:active { transform: scale(0.95); }
  .gm-circle {
    display: grid;
    place-items: center;
    flex: none;
    width: var(--d);
    height: var(--d);
    box-sizing: border-box;
    border: calc(var(--d) * 0.07) solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    background: #000;
  }
  .gm-circle :global(svg) { width: 60%; height: 60%; }
  .gm-label { font-family: 'Montserrat', system-ui, sans-serif; font-size: 18px; font-weight: 700; text-transform: uppercase; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6); }
  .gm-item:focus-visible, .gm-close:focus-visible { outline: 2px solid #ffd166; outline-offset: 4px; }

  /* ── Fenêtre d'une section (Popup du web-sdk) ── */
  .gm-popup {
    position: fixed;
    inset: 0;
    z-index: 1010;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: 'Montserrat', system-ui, sans-serif;
    font-weight: bold;
    letter-spacing: 0.1em;
    animation: gm-in 0.3s ease-out;
  }
  .gm-blur { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); }
  .gm-outside { position: absolute; inset: 0; z-index: 2; width: 100%; height: 100%; min-height: 0; padding: 0; border: 0; border-radius: 0; background: transparent; cursor: pointer; }
  .gm-x {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 4;
    width: 3rem;
    height: 3rem;
    min-height: 0;
    padding: 0;
    border: 0;
    color: #fff;
    background: transparent;
    font-size: 3rem;
    font-weight: 900;
    line-height: 0;
    cursor: pointer;
  }
  .gm-content {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: min(720px, calc(100vw - 2rem));
    max-height: 90vh;
    overflow: hidden;
    text-align: center;
  }
  .gm-content.settings { width: auto; }
  .gm-scroll { width: 100%; min-height: 0; overflow-y: auto; padding: 0.25rem 1.25rem 1.25rem; box-sizing: border-box; }
  .gm-title { text-align: center; text-transform: uppercase; }
  /* Paramètres (ModalSettings + ModalSettingsSound) : trois volumes, coupure, réglette dorée, valeur. */
  .gm-volumes { display: flex; flex-direction: column; gap: 1rem; width: min(480px, calc(100vw - 2rem)); }
  @media (max-width: 479px) { .gm-volumes { width: calc(100vw - 2rem); } }
  .gm-volume { display: flex; flex-direction: column; text-transform: uppercase; }
  .gm-volume-row { display: flex; gap: 0.5rem; }
  .gm-mute { display: flex; align-items: center; justify-content: center; width: 15%; min-height: 0; padding: 0; border: 0; background: transparent; cursor: pointer; }
  .gm-mute :global(svg) { width: 28px; height: 28px; }
  .gm-volume-row input { width: 70%; accent-color: gold; }
  .gm-value { display: flex; align-items: center; justify-content: center; width: 15%; }
  @keyframes gm-in { from { opacity: 0; filter: blur(6px); } }
  @media (prefers-reduced-motion: reduce) { .gm-popup { animation: none; } .gm-item, .gm-close { transition: none; } }

  /* ── Contenus des fenêtres (GameRulesContent / PayTableContent d'africa-tower) ── */
  .gm-scroll :global(section) { margin-bottom: 1.5rem; }
  .gm-scroll :global(h2) { margin: 0 0 0.5rem; padding-bottom: 0.3rem; border-bottom: 1px solid rgba(233, 30, 140, 0.35); color: #ffd166; font-size: 1.1rem; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
  .gm-scroll :global(p) { margin: 0 0 0.4rem; color: #eef0f6; font-size: 1rem; line-height: 1.6; }
  .gm-scroll :global(ul) { margin: 0.25rem 0 0.4rem; padding: 0; color: #eef0f6; font-size: 1rem; line-height: 1.6; list-style: none; }
  .gm-scroll :global(.pt-mode) { margin-bottom: 0.5rem; color: #ffd166; font-size: 1.05rem; font-weight: 800; text-transform: uppercase; }
  .gm-scroll :global(.pt-intro) { margin-bottom: 1.25rem; color: #eef1f8; }
  .gm-scroll :global(.pt-ladder) { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.35rem; }
  .gm-scroll :global(.pt-chevron) { display: flex; align-items: center; flex: 0 0 auto; }
  .gm-scroll :global(.pt-chevron svg) { width: 0.6rem; height: 1rem; fill: #6b7899; }
  .gm-scroll :global(.pt-chevron.achieved svg) { fill: #3fd97f; }
  .gm-scroll :global(.pt-step) { display: flex; flex-direction: column; align-items: center; min-width: 5rem; padding: 0.5rem 0.7rem; border: 2px solid #3a4d7a; border-radius: 10px; background: rgba(255, 255, 255, 0.06); }
  .gm-scroll :global(.pt-index) { color: #8894b0; font-size: 1rem; letter-spacing: 0.5px; text-transform: uppercase; }
  .gm-scroll :global(.pt-mult) { color: #8894b0; font-size: 1.15rem; font-weight: 800; }
  .gm-scroll :global(.pt-step.pt-achieved) { border-color: #3fd97f; background: rgba(63, 217, 127, 0.14); }
  .gm-scroll :global(.pt-step.pt-achieved .pt-mult) { color: #3fd97f; }
  .gm-scroll :global(.pt-step.pt-next) { border-color: #ffd166; box-shadow: 0 0 0 1px rgba(255, 209, 102, 0.3); }
  .gm-scroll :global(.pt-step.pt-next .pt-mult) { color: #ffd166; }
</style>
