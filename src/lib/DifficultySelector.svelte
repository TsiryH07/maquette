<script module lang="ts">
  export type DifficultyOption<Value extends string = string> = {
    value: Value;
    label: string;
    detail: string;
  };
</script>

<script lang="ts" generics="Value extends string">
  let { options, value, disabled = false, onchange }: {
    options: readonly DifficultyOption<Value>[];
    value: Value;
    disabled?: boolean;
    onchange: (value: Value) => void;
  } = $props();
</script>

<div class="difficulty-selector" role="group" aria-label="Niveaux de difficulté">
  {#each options as option, index (option.value)}
    <button type="button" data-level={index} aria-label={`${option.label} ${option.detail}`} aria-pressed={value === option.value} {disabled} onclick={() => { if (value !== option.value) onchange(option.value); }}>
      <span class="marker" aria-hidden="true">
        {#if value === option.value}
          <svg class="check" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="m6 10 3 3 5-6" fill="none" stroke="var(--surface,#171323)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        {:else}
          <span class="meter">{#each [0,1,2] as bar}<span class:lit={bar <= index} style:--bar={bar}></span>{/each}</span>
        {/if}
      </span>
      <span class="copy"><strong>{option.label}</strong><small>{option.detail}</small></span>
    </button>
  {/each}
</div>

<style>
  .difficulty-selector { container-type:inline-size; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:4px; width:100%; padding:4px; }
  button { --level-color:#6ee7b7; --level-fill:#34d39924; min-width:0; min-height:48px; display:flex; align-items:center; justify-content:center; gap:7px; padding:6px; border:0; border-radius:16px; color:var(--text,#f5f3fb); background:transparent; font:inherit; text-align:left; -webkit-tap-highlight-color:transparent; transition:background-color .2s,transform .18s,opacity .2s; }
  button[data-level='1'] { --level-color:#c4b5fd; --level-fill:#a78bfa30; }
  button[data-level='2'] { --level-color:#fda4af; --level-fill:#fb718524; }
  button[aria-pressed='true'],button:hover:enabled { background:var(--level-fill); }
  button:active:enabled { transform:scale(.97); }
  button:focus-visible { outline:2px solid var(--level-color); outline-offset:-3px; }
  button:disabled { opacity:.55; cursor:default; }
  .copy { min-width:0; display:grid; gap:3px; overflow-wrap:anywhere; }
  strong { font-size:13px; font-weight:600; line-height:1.2; }
  small { color:var(--muted,#c0b9d1); font-size:12px; line-height:1.3; }
  button[aria-pressed='true'] strong { color:var(--level-color); }
  button[aria-pressed='true'] small { color:var(--text,#f5f3fb); }
  .marker { display:grid; place-items:center; flex:0 0 16px; height:16px; color:var(--level-color); }
  .check { width:16px; height:16px; }
  .meter { display:flex; align-items:flex-end; gap:2px; height:14px; }
  .meter > span { width:4px; height:calc(5px + var(--bar) * 4px); border-radius:2px; background:currentColor; opacity:.18; }
  .meter > .lit { opacity:.7; }
  @container (max-width:340px) { .marker { display:none; } button { text-align:center; } }
  @media (prefers-reduced-motion:reduce) { button { transition:none; } button:active:enabled { transform:none; } }
</style>
