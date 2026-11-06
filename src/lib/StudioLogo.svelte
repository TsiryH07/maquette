<script lang="ts">
  import studioLogo from './assets/studio_logo.webp';
</script>

<div class="studio-logo" role="img" aria-label="Studio Baobab">
  <img src={studioLogo} alt="" width="36" height="36" />
  <span aria-hidden="true">BAOBAB<small>STUDIO</small></span>
</div>

<style>
  .studio-logo { display:flex; flex:none; align-items:center; gap:6px; color:#f5f3fb; }
  img { display:block; flex:none; width:36px; height:36px; object-fit:contain; }
  span { display:grid; gap:3px; font-size:11px; font-weight:600; letter-spacing:.06em; }
  small { color:#c0b9d1; font-size:8px; font-weight:400; letter-spacing:.18em; }
</style>
