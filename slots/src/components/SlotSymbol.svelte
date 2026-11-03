<script lang="ts">
  let { symbol = 0 }: { symbol?: number } = $props();
  const colors = ['#b69aff', '#f7c65e', '#63d9c2', '#83b3ff', '#f394b3'];
</script>

<svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
  <defs><linearGradient id={`symbol-${symbol}`} x1="20" y1="8" x2="60" y2="74" gradientUnits="userSpaceOnUse"><stop stop-color="white" stop-opacity=".8"/><stop offset=".35" stop-color={colors[symbol]} /><stop offset="1" stop-color={colors[symbol]} stop-opacity=".6"/></linearGradient></defs>
  {#if symbol === 0}
    <path d="m40 7 27 20-8 33-19 14-19-14-8-33L40 7Z" fill={`url(#symbol-${symbol})`} stroke="#d9c8ff" stroke-width="2"/><path d="m13 27 27 9 27-9M40 7v29m-19 24 19-24 19 24m-19-24v38" stroke="#6f4ca5" stroke-opacity=".55" stroke-width="2"/>
  {:else if symbol === 1}
    <path d="m40 7 9 21 23 3-17 16 4 24-19-12-19 12 4-24L8 31l23-3 9-21Z" fill={`url(#symbol-${symbol})`} stroke="#ffe5a4" stroke-width="2"/><path d="M40 7v36l19 28-19-12-19 12 19-28L8 31l32 12 32-12" stroke="#ac7a27" stroke-opacity=".5" stroke-width="2"/>
  {:else if symbol === 2}
    <circle cx="40" cy="40" r="28" stroke={`url(#symbol-${symbol})`} stroke-width="14"/><circle cx="40" cy="40" r="17" stroke="#b6fff1" stroke-width="2"/><path d="M20 25a26 26 0 0 1 34-8" stroke="white" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
  {:else if symbol === 3}
    <path d="m40 9 28 15v32L40 72 12 56V24L40 9Z" fill={`url(#symbol-${symbol})`} stroke="#c6e0ff" stroke-width="2"/><path d="m12 24 28 16 28-16M40 40v32M40 9v31" stroke="#375c98" stroke-opacity=".6" stroke-width="2"/>
  {:else}
    <path d="M18 13h44v12L41 66H24l24-39H18V13Z" fill={`url(#symbol-${symbol})`} stroke="#ffd5e2" stroke-width="2"/>
  {/if}
</svg>

<style>svg { width: 100%; max-height: 100%; display: block; filter: drop-shadow(0 5px 6px #0005); }</style>
