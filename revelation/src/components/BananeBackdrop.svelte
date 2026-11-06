<script lang="ts">
  import savane from '../assets/banane/savane-portrait.webp';
</script>

<div class="scene-backdrop banane-backdrop" aria-hidden="true">
  <img src={savane} alt="" fetchpriority="high" />
</div>

<style>
  .banane-backdrop { position:absolute; inset:0; overflow:hidden; pointer-events:none; background:#23132f; }
  img { width:100%; height:100%; object-fit:cover; }
  .banane-backdrop::after { content:''; position:absolute; inset:0; background:linear-gradient(#110b2559,#160c2d99 42%,#0c0718cc); }
</style>
