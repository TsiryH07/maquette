<script lang="ts">
  let { onopen }: { onopen: () => void } = $props();
</script>

<button class="panel-menu" aria-label="Ouvrir le menu" aria-haspopup="dialog" title="Menu du jeu" onclick={onopen}>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
</button>

<style>
  .panel-menu { position:absolute; left:12px; bottom:12px; z-index:2; display:grid; place-items:center; width:44px; height:44px; min-height:44px; padding:0; border:0; border-radius:10px; background:transparent; color:var(--muted); }
  .panel-menu:hover { color:var(--text); background:#ffffff0a; }
  .panel-menu:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
</style>
