<script lang="ts">
  import { page } from '$app/state';
  import Game from '../../game/Game.svelte';
  import { scenarios, type Scenario } from '../../game/scenarios';

  const scenario = $derived.by(() => {
    const value = page.url.searchParams.get('scenario');
    return value && Object.hasOwn(scenarios, value) ? value as Scenario : 'ready';
  });
</script>

<svelte:head><title>Maquette Slots — écran</title></svelte:head>
<Game {scenario} />
