<script lang="ts">
  const paths = {
    trend:'M3 17l6-6 4 4 8-8M14 7h7v7',
    dice:'M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01',
    gem:'M6 3h12l4 6-10 12L2 9l4-6ZM2 9h20M6 3l6 18 6-18M6 3l6 6 6-6',
    slots:'M4 4h16v16H4zM9 4v16M15 4v16M6 10h1m4 3h2m4-4h1',
    external:'M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5',
    reset:'M3 11a9 9 0 1 1 3 8M3 4v7h7',
    desktop:'M3 4h18v13H3zM8 21h8m-4-4v4',
    tablet:'M6 2h12a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM12 18h.01',
    portrait:'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM11 18h2',
    landscape:'M2 8V6h20v12H2V8Zm16 3v2',
  };
  let { name, size = 20 }: { name:keyof typeof paths; size?:number } = $props();
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
