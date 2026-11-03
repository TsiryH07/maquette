<script lang="ts">
  import { page } from '$app/state';
  import Game from '$crash/game/Game.svelte';
  import { scenarios, type Scenario } from '$crash/game/scenarios';
  const scenario = $derived.by(() => {
    const value = page.url.searchParams.get('scenario');
    return value && Object.hasOwn(scenarios, value) ? value as Scenario : 'betting';
  });
</script>

<svelte:head><title>Maquette Crash — écran</title></svelte:head>
<Game {scenario} />
