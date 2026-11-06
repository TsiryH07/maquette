<script lang="ts">
  import SlotSymbol from './SlotSymbol.svelte';
  import type { Scenario } from '../game/scenarios';
  let { scenario = 'ready', turbo = false, winningSymbol = 0 }: { scenario?: Scenario; turbo?: boolean; winningSymbol?: number } = $props();
  const columns = [[1,0,2],[3,1,4],[4,2,1],[2,3,0],[0,4,3]];
</script>

<div class="reels" class:spinning={scenario === 'spinning'} class:turbo class:won={scenario === 'win'} aria-label="Cinq rouleaux de trois symboles">
  {#each columns as symbols, col}
    <div class="reel" style:--col={col}>{#each symbols as symbol, row}<div class="cell" class:winning={scenario === 'win' && row === 1 && col < 3}><div class="symbol"><SlotSymbol symbol={scenario === 'win' && row === 1 && col < 3 ? winningSymbol : symbol} /></div></div>{/each}</div>
  {/each}
  {#if scenario === 'win'}<div class="payline" aria-hidden="true"><span>1</span></div>{/if}
</div>

<style>
  .reels { position: relative; width: min(860px, 100%); height: min(100%, 360px); min-height: min(150px, 100%); margin: 0 auto; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; padding: 10px; }
  .reel { min-width: 0; min-height: 0; display: grid; grid-template-rows: repeat(3,minmax(0,1fr)); gap: 4px; overflow: hidden; padding: 4px; background: linear-gradient(180deg,transparent,#140d233d 50%,transparent); }
  .cell { min-height: 0; display: grid; place-items: center; border: 1px solid transparent; border-radius: 10px; }
  .symbol { width: min(64%, 90px); height: 80%; display: grid; align-items: center; }
  .winning { border-color: #fbd66888; background: #fbbf241a; box-shadow: inset 0 0 24px #fbbf2412; }
  .payline { position: absolute; top: 50%; left: -4px; right: 41%; height: 1px; background: #fbd66888; pointer-events: none; }
  .payline span { position: absolute; top: -11px; left: -8px; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: #fbd668; color: #352111; font-size: 12px; font-weight: 800; }
  .spinning .symbol { animation: reel 280ms linear infinite; animation-delay: calc(var(--col) * -60ms); filter: blur(2px); opacity: .8; }
  .turbo.spinning .symbol { animation-duration: 120ms; }
  @keyframes reel { from { transform: translateY(-50%); } to { transform: translateY(50%); } }
  @container (max-width: 600px) { .reels { gap: 4px; padding: 6px; } .reel { padding: 2px; gap: 2px; } .symbol { width: 84%; } }
  @media(prefers-reduced-motion:reduce) { .spinning .symbol { animation: none; filter: none; } }
</style>
