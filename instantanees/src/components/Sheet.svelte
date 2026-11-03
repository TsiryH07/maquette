<script module lang="ts">
  let count = 0;
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { LayoutType } from '../game/layouts';
  import Icon from './Icon.svelte';

  let { title, closeLabel, layout = 'desktop', children }: {
    title: string;
    closeLabel: string;
    layout?: LayoutType;
    children: Snippet;
  } = $props();

  const id = `sheet-${++count}`;
  let dialog: HTMLDialogElement;

  export const open = () => dialog.showModal();
  export const close = () => dialog.close();
</script>

<!-- Un clic sur le fond referme la fenêtre ; Échap reste géré par le navigateur. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog class="sheet" data-layout={layout} aria-labelledby={id} bind:this={dialog} onclick={(event) => event.target === dialog && close()}>
  <div class="inner">
    <div class="heading">
      <h2 {id}>{title}</h2>
      <button class="close" aria-label={closeLabel} onclick={close}><Icon name="close" /></button>
    </div>
    {@render children()}
    <button class="done" onclick={close}>Terminé</button>
  </div>
</dialog>

<style>
  .sheet { width: min(420px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); padding: 0; color: var(--text); background: var(--surface); border: 1px solid var(--line-strong); border-radius: 20px; box-shadow: 0 24px 60px -12px #000000b3; font-family: inherit; }
  .sheet::backdrop { background: #05030acc; backdrop-filter: blur(4px); }
  .sheet[data-layout='portrait'] { width: 100%; max-width: none; margin: auto 0 0; border-width: 1px 0 0; border-radius: 20px 20px 0 0; }
  .inner { padding: 20px; }
  .heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
  h2 { margin: 0; font-size: 20px; font-weight: 700; }
  .close { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%; color: var(--muted); background: var(--surface-2); }
  .close:hover { color: var(--text); background: var(--surface-3); }
  .done { width: 100%; min-height: 48px; margin-top: 20px; border: 0; border-radius: 12px; color: #1a0f33; background: var(--accent); font-size: 16px; font-weight: 700; }
  .done:hover { filter: brightness(1.08); }

  /* Contenu commun des fenêtres : lignes à interrupteur, textes d'aide et règles. */
  .sheet :global(.row) { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; padding: 10px 0; border-bottom: 1px solid var(--line); cursor: pointer; }
  .sheet :global(.row > span) { display: grid; gap: 2px; }
  .sheet :global(.row strong) { font-size: 16px; font-weight: 600; }
  .sheet :global(.row small) { color: var(--muted); font-size: 14px; line-height: 1.4; }
  .sheet :global(input[type='checkbox']) { appearance: none; -webkit-appearance: none; position: relative; flex: 0 0 48px; width: 48px; height: 28px; margin: 0; border: 1px solid var(--line-strong); border-radius: 999px; background: var(--surface-3); cursor: pointer; transition: background-color 0.2s; }
  .sheet :global(input[type='checkbox']::after) { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #cfc8e6; transition: transform 0.2s; }
  .sheet :global(input[type='checkbox']:checked) { border-color: var(--accent); background: var(--accent); }
  .sheet :global(input[type='checkbox']:checked::after) { background: #fff; transform: translateX(20px); }
  .sheet :global(input:disabled) { opacity: 0.4; cursor: default; }
  .sheet :global(.note) { margin: 16px 0 0; color: var(--muted); font-size: 14px; line-height: 1.5; }
  .sheet :global(h3) { margin: 20px 0 8px; font-size: 16px; }
  .sheet :global(ol) { margin: 0; padding-left: 20px; color: var(--muted); font-size: 15px; line-height: 1.6; }
  .sheet :global(li + li) { margin-top: 6px; }
</style>
