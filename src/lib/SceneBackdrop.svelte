<script lang="ts">
  let { family }: { family: 'crash' | 'instantanees' | 'revelation' | 'slots' } = $props();
  // Un décor vectoriel local : aucune image ni connexion au SDK nécessaire.
  const stars = Array.from({ length: 42 }, (_, i) => ({
    x: (i * 137 + 31) % 1600,
    y: (i * 83 + 47) % 480,
    radius: i % 6 === 0 ? 2 : 1,
  }));
</script>

<div class="scene-backdrop" data-family={family} aria-hidden="true">
  <div class="sky-glow"></div>
  <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
    <g class="stars">{#each stars as star}<circle cx={star.x} cy={star.y} r={star.radius} fill="currentColor" />{/each}</g>
    <circle class="moon-halo" cx="1200" cy="240" r="118" />
    <circle class="moon-halo" cx="1200" cy="240" r="85" />
    <circle class="moon" cx="1200" cy="240" r="54" />
    <path class="ridge far" d="M0 580 140 470 260 540 460 365 650 530 810 420 1010 560 1190 455 1360 535 1500 410 1600 465V1000H0Z" />
    <path class="ridge middle" d="M0 665Q170 520 340 650T690 620Q860 510 1040 650T1420 590L1600 670V1000H0Z" />
    <path class="ridge near" d="M0 785Q240 670 470 795T940 760Q1170 645 1390 775L1600 715V1000H0Z" />
    {#if family === 'revelation'}
      <g class="crystals"><path d="m145 665 18-128 43-45 29 104-26 82Z"/><path d="m1315 680 22-160 47-56 35 132-40 102Z"/><path d="m1255 699 3-86 30-31 29 86-20 35Z"/></g>
    {:else if family === 'crash'}
      <g class="orbit"><ellipse cx="800" cy="490" rx="740" ry="235" transform="rotate(-20 800 490)"/><ellipse cx="800" cy="490" rx="900" ry="340" transform="rotate(-20 800 490)"/></g>
    {:else}
      <g class="palms">
        <path d="M130 805q34-100 21-214l13-3q21 109-7 219Zm15-213q-77-51-129-18 70-8 127 31Zm10-2q-12-90-84-93 49 28 73 98Zm7 5q48-75 111-47-66 7-99 56Zm-1-6q32-54 2-103 4 58-15 104Z"/>
        <path d="M1460 760q-28-83-18-175l-11-2q-17 90 6 179Zm-12-175q63-42 106-15-58-6-104 26Zm-8-2q10-74 69-77-40 24-60 81Zm-6 4q-40-61-92-39 55 6 82 47Zm0-6q-27-44-2-84-3 48 12 86Z"/>
      </g>
    {/if}
  </svg>
  <div class="scene-shade"></div>
</div>

<style>
  .scene-backdrop { --sky:#14132e; --light:#8a63e2; --far:#39335e; --middle:#282442; --near:#17172c; --moon:#d0bdff; position:absolute; inset:0; overflow:hidden; pointer-events:none; background:var(--sky); }
  [data-family='crash'] { --sky:#0b172b; --light:#4f76cc; --far:#283b63; --middle:#1d2d4c; --near:#111e34; --moon:#b5d6ff; }
  [data-family='revelation'] { --sky:#0b2026; --light:#378b81; --far:#285454; --middle:#1a3c3c; --near:#10292e; --moon:#b3ead7; }
  [data-family='slots'] { --sky:#28152e; --light:#be6b83; --far:#643d62; --middle:#432c4e; --near:#251d36; --moon:#ffdaab; }
  .sky-glow { position:absolute; inset:0; background:radial-gradient(ellipse at 72% 32%,color-mix(in srgb,var(--light) 55%,transparent),transparent 65%),linear-gradient(0deg,var(--light),transparent 65%); }
  svg { position:absolute; width:100%; height:100%; }
  .stars { color:var(--moon); opacity:.55; }
  .moon-halo { fill:var(--moon); opacity:.04; }
  .moon { fill:var(--moon); opacity:.8; }
  .far { fill:var(--far); }
  .middle { fill:var(--middle); }
  .near { fill:var(--near); }
  .palms { fill:var(--near); }
  .crystals { fill:#70cdb8; opacity:.2; stroke:#acffe6; stroke-width:2; }
  .orbit { fill:none; stroke:#95b7ff; stroke-width:1; opacity:.12; }
  .scene-shade { position:absolute; inset:0; background:linear-gradient(180deg,#06071170,transparent 24%,transparent 62%,#06071180),radial-gradient(ellipse at 50% 40%,transparent 25%,#06071145); }
</style>
