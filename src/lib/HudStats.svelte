<script lang="ts">
  let { balance, lastWin }: { balance: number; lastWin: number | null } = $props();
  const format = (value: number) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<div class="portrait-stats">
  <div class="balance-stat"><span>Solde fictif</span><strong>{format(balance)} <small>FCFA</small></strong></div>
  <div><span>Dernier gain</span><output aria-label="Dernier gain" aria-live="polite">{lastWin === null ? '—' : format(lastWin)}{#if lastWin !== null} <small>FCFA</small>{/if}</output></div>
</div>

<style>
  .portrait-stats { grid-area:stats; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); align-items:center; gap:12px; padding:0 4px; min-width:0; }
  .portrait-stats > div { display:grid; gap:2px; min-width:0; }
  .portrait-stats > div:last-child { text-align:right; }
  span { color:var(--muted); font-size:10px; line-height:1.2; }
  strong,output { color:var(--text); font-size:15px; font-weight:750; line-height:1.2; font-variant-numeric:tabular-nums; white-space:nowrap; }
  output { color:var(--win); }
  small { color:var(--muted); font-size:10px; font-weight:500; }
  .balance-stat > span { color:#d1d5db; font-size:11px; font-weight:400; line-height:14px; }
  .balance-stat > strong { color:#fff; font-size:22px; font-weight:400; line-height:24px; }
  .balance-stat small { color:#d1d5db; font-size:12px; font-weight:400; }
  @media (max-height:840px) {
    .balance-stat { gap:0; }
    .balance-stat > span { font-size:11px; line-height:12px; }
    .balance-stat > strong { font-size:20px; line-height:20px; }
  }
</style>
