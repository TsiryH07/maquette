<script lang="ts">
  import { page } from '$app/state';
  import Game from '$revelation/game/Game.svelte';
  import { scenarios, type Scenario } from '$revelation/game/scenarios';
  const scenario = $derived.by(() => {
    const value = page.url.searchParams.get('scenario');
    return value && Object.hasOwn(scenarios, value) ? value as Scenario : 'ready';
  });
</script>

<svelte:head><title>Maquette Révélation — écran</title></svelte:head>
<Game {scenario} />
