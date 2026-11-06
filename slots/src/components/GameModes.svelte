<script module lang="ts">
  let count = 0;
</script>

<script lang="ts">
  import Sheet from './Sheet.svelte';
  import Icon from './Icon.svelte';
  import { formatMoney } from '../game/format';
  import type { LayoutType } from '../game/layouts';

  type Mode = 'manual' | 'auto' | 'bonus';
  const modes: Mode[] = ['manual', 'auto', 'bonus'];
  const labels = { manual:'Manuel', auto:'Auto', bonus:'Gratuits' };
  const titles = { manual:'Un tour à la fois', auto:'Les tours s’enchaînent', bonus:'5 tours gratuits' };
  const icons = { manual:'play', auto:'repeat', bonus:'star' } as const;
  let { layout, amount, busy, autoRemaining, freeRemaining, onauto, onbonus, onstop }: {
    layout: LayoutType; amount: number; busy: boolean; autoRemaining: number; freeRemaining: number;
    onauto: (rounds: number) => void; onbonus: () => void; onstop: () => void;
  } = $props();
  const id = `game-modes-${++count}`;
  let sheet: ReturnType<typeof Sheet>;
  let view = $state<Mode>('manual');
  let rounds = $state(3);
  const roundOptions = [3, 5, 10];
  const current = $derived<Mode>(freeRemaining > 0 ? 'bonus' : autoRemaining > 0 ? 'auto' : 'manual');
  const blocked = $derived(view === 'manual' ? freeRemaining > 0 : view === 'auto' ? autoRemaining === 0 && (busy || freeRemaining > 0) : freeRemaining === 0 && (busy || autoRemaining > 0));
  const action = $derived(view === 'manual' ? autoRemaining > 0 ? 'Revenir au mode manuel' : 'Revenir au jeu' : view === 'auto' ? autoRemaining > 0 ? 'Arrêter la série' : `Lancer ${rounds} tours` : freeRemaining > 0 ? 'Continuer les tours gratuits' : 'Commencer les 5 tours');

  export function open(selected: Mode = current) { view = selected; sheet.open(); }
  function apply() {
    if (blocked) return;
    sheet.close();
    if (view === 'manual' || (view === 'auto' && autoRemaining > 0)) { if (autoRemaining > 0) onstop(); }
    else if (view === 'auto') onauto(rounds);
    else if (freeRemaining === 0) onbonus();
  }
  function navigate(event: KeyboardEvent, index: number) {
    const key = event.key;
    if (!['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End'].includes(key)) return;
    event.preventDefault();
    const next = key === 'Home' ? 0 : key === 'End' ? 2 : (index + (key === 'ArrowRight' || key === 'ArrowDown' ? 1 : 2)) % 3;
    view = modes[next];
    const tabs = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[next].focus();
  }
</script>

<Sheet bind:this={sheet} title="Modes de jeu" closeLabel="Fermer les modes de jeu" {layout} showDone={false} wideOnLandscape>
  <div class="mode-workspace" data-layout={layout} data-mode={view}>
    <p class="current-mode"><span class="status-dot" aria-hidden="true"></span>Mode actuel : <strong>{current === 'bonus' ? 'Tours gratuits' : labels[current]}</strong></p>
    <div class="mode-grid">
      <div class="mode-tabs" role="tablist" aria-label="Choisir un mode de jeu" aria-orientation={layout === 'landscape' ? 'vertical' : 'horizontal'} style:--mode-index={modes.indexOf(view)}>
        <span class="tab-selection" aria-hidden="true"></span>
        {#each modes as mode, index}
          <button role="tab" id={`${id}-${mode}`} aria-controls={`${id}-panel`} aria-selected={view === mode} tabindex={view === mode ? 0 : -1} onclick={() => view = mode} onkeydown={event => navigate(event, index)}><Icon name={icons[mode]} size={19} /><span>{labels[mode]}</span></button>
        {/each}
      </div>

      <div class="mode-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${view}`} tabindex="0">
        {#key view}
          <div class="panel-content">
            <div class="panel-heading"><span class="panel-icon" aria-hidden="true"><Icon name={icons[view]} size={23} /></span><div><h3>{titles[view]}</h3><p>{view === 'manual' ? 'Vous décidez quand lancer.' : view === 'auto' ? autoRemaining > 0 ? 'Votre série est en cours.' : 'Choisissez la longueur de votre série.' : 'Un bonus de démonstration, sans nouvelle mise.'}</p></div></div>
            {#if view === 'manual'}
              <div class="manual-preview" aria-hidden="true"><span class="preview-play"><Icon name="play" size={18} /></span><span>Un appui</span><span class="preview-arrow"><Icon name="arrow" size={18} /></span><strong>Un tour</strong></div>
              <div class="mode-receipt"><span>Mise par tour</span><strong>{formatMoney(amount)}</strong></div>
            {:else if view === 'auto'}
              {#if autoRemaining > 0}
                <div class="running-series"><strong>{autoRemaining}</strong><span>tours restants</span><Icon name="repeat" size={26} /></div>
              {:else}
                <div class="round-options" role="group" aria-label="Nombre de tours automatiques" style:--round-index={roundOptions.indexOf(rounds)}>
                  <span class="round-selection" aria-hidden="true"></span>
                  {#each roundOptions as value}<button aria-label={`${value} tours`} aria-pressed={rounds === value} disabled={blocked} onclick={() => rounds = value}>{value} tours</button>{/each}
                </div>
              {/if}
              <div class="mode-receipt"><span>{autoRemaining > 0 ? 'Mise par tour' : `${rounds} × ${formatMoney(amount)}`}</span><strong>{formatMoney(autoRemaining > 0 ? amount : amount * rounds)}</strong></div>
            {:else}
              <div class="bonus-preview"><strong>{freeRemaining > 0 ? freeRemaining : 5}</strong><span>{freeRemaining > 0 ? 'tours restants' : 'tours à essayer'}<small>À lancer un par un</small></span><Icon name="star" size={26} /></div>
              <div class="mode-receipt"><span>Nouvelle mise</span><strong>0 FCFA</strong></div>
            {/if}
            {#if blocked}<p class="mode-help">{freeRemaining > 0 ? 'Terminez les tours gratuits pour changer de mode.' : 'Attendez la fin du tour ou arrêtez la série.'}</p>{:else if autoRemaining > 0}<p class="mode-help">L’arrêt laisse le tour en cours se terminer.</p>{/if}
          </div>
        {/key}
      </div>

      <div class="mode-confirm"><button class="mode-action" class:stop={view === 'auto' && autoRemaining > 0} disabled={blocked} onclick={apply}><Icon name={view === 'auto' && autoRemaining > 0 ? 'stop' : view === 'manual' ? 'check' : icons[view]} size={19} /><span>{action}</span></button></div>
    </div>
  </div>
</Sheet>

<style>
  .mode-workspace { --mode-color:#6ee7b7; --mode-tint:#34d3991a; }
  .mode-workspace[data-mode='auto'] { --mode-color:#c4b5fd; --mode-tint:#a78bfa24; }
  .mode-workspace[data-mode='bonus'] { --mode-color:#fbbf24; --mode-tint:#fbbf241a; }
  .current-mode { display:flex; align-items:center; gap:6px; margin:4px 0 16px; color:var(--muted); font-size:12px; }
  .current-mode strong { color:var(--text); font-weight:600; }
  .status-dot { width:6px; height:6px; margin-right:2px; border-radius:50%; background:var(--win); }
  .mode-grid { display:grid; grid-template-areas:'tabs' 'panel' 'confirm'; gap:14px; }
  .mode-tabs { position:relative; isolation:isolate; overflow:hidden; grid-area:tabs; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:4px; padding:4px; border:1px solid var(--line); border-radius:16px; background:#0b0813; }
  .tab-selection { position:absolute; z-index:-1; top:4px; bottom:4px; left:4px; width:calc((100% - 16px) / 3); border-radius:12px; background:var(--mode-tint); box-shadow:inset 0 0 0 1px var(--mode-color); transform:translateX(calc(var(--mode-index) * (100% + 4px))); transition:transform .3s cubic-bezier(.22,1,.36,1),background-color .25s; }
  .mode-tabs button { display:flex; align-items:center; justify-content:center; gap:7px; min-width:0; min-height:52px; padding:8px 4px; border:0; border-radius:12px; color:var(--muted); background:transparent; font:inherit; font-size:13px; font-weight:600; transition:color .2s,background-color .2s; }
  .mode-tabs button[aria-selected='true'] { color:var(--mode-color); }
  .mode-tabs button:hover { color:var(--text); background:#ffffff05; }
  .mode-tabs button:focus-visible { outline:2px solid var(--mode-color); outline-offset:-3px; }
  .mode-panel { grid-area:panel; min-width:0; min-height:184px; padding:16px; border:1px solid var(--line); border-radius:18px; background:var(--surface-2); }
  .panel-content { min-width:0; display:grid; grid-template-columns:minmax(0,1fr); gap:16px; animation:panel-enter .18s ease-out; }
  .panel-heading { display:flex; align-items:center; gap:12px; }
  .panel-heading > div { min-width:0; flex:1; }
  .panel-icon { display:grid; place-items:center; flex:0 0 42px; height:42px; border-radius:13px; color:var(--mode-color); background:var(--mode-tint); }
  .panel-heading h3 { margin:0; color:var(--text); font-size:17px; line-height:1.2; font-weight:700; }
  .panel-heading p { margin:5px 0 0; color:var(--muted); font-size:12px; line-height:1.4; }
  .manual-preview { display:flex; align-items:center; justify-content:center; gap:9px; min-height:44px; color:var(--muted); font-size:13px; }
  .preview-play { display:grid; place-items:center; width:32px; height:32px; border-radius:50%; color:#052e1a; background:var(--win); }
  .manual-preview strong { color:var(--mode-color); font-weight:600; }
  .preview-arrow { display:grid; color:var(--muted); }
  .mode-receipt { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px; padding-top:12px; border-top:1px solid var(--line); color:var(--muted); font-size:13px; }
  .mode-receipt strong { color:var(--text); font-weight:700; font-size:16px; font-variant-numeric:tabular-nums; }
  .round-options { position:relative; isolation:isolate; overflow:hidden; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:3px; padding:3px; border-radius:12px; background:#0e0a19; }
  .round-selection { position:absolute; z-index:-1; top:3px; bottom:3px; left:3px; width:calc((100% - 12px) / 3); border-radius:9px; background:#a78bfa38; transform:translateX(calc(var(--round-index) * (100% + 3px))); transition:transform .3s cubic-bezier(.22,1,.36,1); }
  .round-options button { min-width:0; min-height:44px; border:0; border-radius:9px; color:var(--muted); background:transparent; font:inherit; font-size:13px; font-weight:600; }
  .round-options button[aria-pressed='true'] { color:#ede5ff; }
  .round-options button:hover:enabled { background:#ffffff05; }
  .bonus-preview,.running-series { display:flex; align-items:center; gap:12px; min-height:44px; color:var(--mode-color); }
  .bonus-preview > strong,.running-series > strong { font-size:36px; font-weight:800; font-variant-numeric:tabular-nums; line-height:1; }
  .bonus-preview > span,.running-series > span { flex:1; min-width:0; color:var(--text); font-size:14px; }
  .bonus-preview small { display:block; margin-top:4px; color:var(--muted); font-size:12px; }
  .mode-help { margin:0; color:var(--muted); font-size:12px; line-height:1.4; }
  .mode-confirm { grid-area:confirm; display:flex; align-items:center; min-width:0; }
  .mode-action { display:flex; align-items:center; justify-content:center; gap:9px; width:100%; min-height:52px; padding:12px; border:0; border-radius:14px; color:#052e1a; background:linear-gradient(180deg,#ffffff2e,transparent 70%),#34d399; box-shadow:inset 0 1px 0 #ffffff40; font:inherit; font-size:15px; font-weight:700; transition:filter .2s,transform .15s; }
  [data-mode='bonus'] .mode-action { color:#3a2700; background:linear-gradient(180deg,#ffffff2e,transparent 70%),#fbbf24; }
  .mode-action.stop { color:white; background:#be123c; }
  .mode-action:hover:enabled { filter:brightness(1.07); }
  .mode-action:active:enabled { transform:scale(.98); }
  .mode-action:disabled { cursor:default; }
  @keyframes panel-enter { from { opacity:.3; transform:translateY(4px); } to { opacity:1; transform:none; } }
  [data-layout='landscape'] .current-mode { display:none; }
  [data-layout='landscape'] .mode-grid { grid-template-areas:'tabs panel' 'confirm confirm'; grid-template-columns:1fr 2fr; gap:12px 18px; margin-top:12px; }
  [data-layout='landscape'] .mode-tabs { grid-template-columns:1fr; grid-template-rows:repeat(3,minmax(0,1fr)); }
  [data-layout='landscape'] .mode-tabs button { justify-content:flex-start; padding-left:12px; min-height:44px; }
  [data-layout='landscape'] .tab-selection { top:4px; bottom:auto; left:4px; right:4px; width:auto; height:calc((100% - 16px) / 3); transform:translateY(calc(var(--mode-index) * (100% + 4px))); }
  [data-layout='landscape'] .mode-panel { min-height:164px; padding:12px; }
  [data-layout='landscape'] .panel-content { gap:10px; }
  [data-layout='landscape'] .panel-icon { flex-basis:34px; height:34px; border-radius:10px; }
  [data-layout='landscape'] .panel-heading { gap:9px; }
  [data-layout='landscape'] .panel-heading h3 { font-size:16px; }
  [data-layout='landscape'] .mode-receipt { padding-top:8px; }
  @media (max-width:359px) { .mode-tabs button { flex-direction:column; gap:4px; } .mode-panel { padding:12px; } .panel-heading h3 { font-size:16px; } }
  @media (prefers-reduced-motion:reduce) { .tab-selection,.mode-tabs button,.round-selection,.mode-action { transition:none; } .panel-content { animation:none; } .mode-action:active:enabled { transform:none; } }
</style>
