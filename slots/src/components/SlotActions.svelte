<script lang="ts">
  import Icon from './Icon.svelte';
  let { turbo, locked, bonusLocked, onturbo, onbonus }: {
    turbo: boolean; locked: boolean; bonusLocked: boolean;
    onturbo: () => void; onbonus: () => void;
  } = $props();
</script>

<div class="slot-actions" role="group" aria-label="Turbo et achat de bonus">
  <label class="turbo" class:active={turbo} class:locked title={locked ? 'Turbo verrouillé pendant la partie' : turbo ? 'Turbo activé' : 'Turbo désactivé'}>
    <Icon name="bolt" size={18} /><span>Turbo</span>
    <input type="checkbox" aria-label="Activer le turbo" checked={turbo} disabled={locked} onchange={onturbo} />
  </label>
  <button class="bonus" aria-label="Achat de bonus" aria-haspopup="dialog" disabled={bonusLocked} onclick={onbonus}>
    <span class="bonus-icon"><Icon name="star" size={18} /></span><span>Achat de bonus</span>
  </button>
</div>

<style>
  .slot-actions { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.4fr); width:min(360px,100%); justify-self:center; gap:8px; }
  .turbo,.bonus { position:relative; display:flex; align-items:center; justify-content:center; gap:8px; min-height:48px; padding:8px 12px; border:1px solid #e4d5ff42; border-radius:10px; color:#fff; background:var(--panel-background); font:inherit; font-size:14px; font-weight:500; line-height:18px; cursor:pointer; }
  .turbo { white-space:nowrap; }
  .turbo.active { color:#ddd1ff; border-color:var(--accent); background:#38264ae6; }
  .turbo:focus-within,.bonus:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
  .turbo:hover:not(.locked),.bonus:hover:enabled { border-color:var(--accent); }
  .turbo.locked,.bonus:disabled { opacity:.45; cursor:default; }
  input { position:absolute; inset:-1px; width:calc(100% + 2px); height:calc(100% + 2px); margin:0; opacity:0; cursor:inherit; }
  .bonus-icon { display:grid; flex:none; color:var(--gold); }
  .bonus { border-color:#fbbf2466; }
  .bonus > span:last-child { white-space:nowrap; }
</style>
