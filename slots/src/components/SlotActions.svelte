<script lang="ts">
  import Icon from './Icon.svelte';
  // Turbo est dans le dock, dans tous les formats : il ne reste ici que l'achat de bonus.
  let { bonusLocked, onbonus }: { bonusLocked: boolean; onbonus: () => void } = $props();
</script>

<div class="slot-actions" role="group" aria-label="Achat de bonus">
  <button class="bonus" aria-label="Achat de bonus" aria-haspopup="dialog" disabled={bonusLocked} onclick={onbonus}>
    <span class="bonus-icon"><Icon name="star" size={18} /></span><span>Achat de bonus</span>
  </button>
</div>

<style>
  .slot-actions { display:grid; grid-template-columns:minmax(0,1fr); width:min(220px,100%); justify-self:center; gap:8px; }
  .bonus { position:relative; display:flex; align-items:center; justify-content:center; gap:8px; min-height:48px; padding:8px 12px; border:1px solid #e4d5ff42; border-radius:10px; color:#fff; background:var(--panel-background); font:inherit; font-size:14px; font-weight:500; line-height:18px; cursor:pointer; }
  .bonus:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .bonus:hover:enabled { border-color:var(--accent); }
  .bonus:disabled { opacity:.45; cursor:default; }
  .bonus-icon { display:grid; flex:none; color:var(--gold); }
  .bonus { border-color:#fbbf2466; }
  .bonus > span:last-child { white-space:nowrap; }
</style>
