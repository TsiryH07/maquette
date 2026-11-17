<script module lang="ts">
  /** Niveaux proposés par défaut dans le menu « Difficulté ». */
  export type Difficulty = 'Facile' | 'Normal' | 'Difficile' | 'Expert';
  export const DIFFICULTIES: readonly Difficulty[] = ['Facile', 'Normal', 'Difficile', 'Expert'];
  /** Rôle et couleur du gros bouton : vert (bet), ambre (cashout), rouge (cancel), violet (busy). */
  export type PlayAction = 'bet' | 'cashout' | 'cancel' | 'busy';
  /** Type de jeu : décide de la barre affichée pendant une manche. */
  export type GameType = 'crash' | 'reveal' | 'slots' | 'dice';
  /** Ce que reçoit `onplay` au clic sur le gros bouton. */
  export type PlayDetail<D extends string = Difficulty> = { bet: number; difficulty: D; isAuto: boolean };
  // Identifiants uniques pour les dégradés et découpes SVG de la barre portrait.
  let nextId = 0;
</script>

<script lang="ts" generics="D extends string = Difficulty">
  /*
   * CasinoControlDock — barre de commandes en deux modules : compte (menu + solde) | jeu
   * (difficulté, Auto et Turbo, mise, bouton principal). Ordinateur, tablette et mobile paysage. Svelte 5.
   *
   *   <CasinoControlDock {balance} bind:bet bind:difficulty bind:isAuto {isPlaying}
   *     onplay={({ bet, difficulty, isAuto }) => …} onmenu={() => …} />
   *
   * Dans un jeu existant, les fenêtres du jeu peuvent remplacer les menus intégrés :
   * onbetclick (liste des mises), onautoclick (réglages Auto). La difficulté est toujours une liste déroulante.
   * Placement : avec `floating` (par défaut), le dock flotte en bas du premier parent positionné.
   * Taille : tout découle de l'unité --u ; la variable CSS --dock-scale (1 par défaut) agrandit
   * ou réduit l'ensemble, --dock-bottom règle la marge basse.
   */
  import { tick } from 'svelte';

  type Props = {
    balance?: number;
    bet?: number;
    minBet?: number;
    maxBet?: number;
    betStep?: number;
    /** Montants autorisés : − et + passent d'un montant au suivant (remplace minBet, maxBet et betStep). */
    betOptions?: readonly number[];
    /** Verrouille la mise et la difficulté sans animer le bouton (ex. tours gratuits). */
    betLocked?: boolean;
    currency?: string;
    difficulty?: D;
    /** Niveaux du menu. Une liste vide masque la pilule Difficulté. */
    difficulties?: readonly D[];
    /** Précision affichée sous chaque niveau de la liste (ex. « 3 pièges »). */
    difficultyHints?: Partial<Record<D, string>>;
    isAuto?: boolean;
    /** false : pas de bouton AUTO (jeu sans mode automatique). */
    showAuto?: boolean;
    /** Turbo : accélère les animations du jeu. */
    isTurbo?: boolean;
    /** false : pas de bouton TURBO (jeu sans animation à accélérer). */
    showTurbo?: boolean;
    /** Verrouille seulement TURBO (ex. pendant une série automatique). */
    turboLocked?: boolean;
    isPlaying?: boolean;
    disabled?: boolean;
    /** Pendant une manche (isPlaying) : crash → menu + ENCAISSER ; reveal → menu + ENCAISSER + JOUER (oncontinue) ;
        slots et dice gardent la barre complète. */
    gameType?: GameType;
    /** Gain affiché sur ENCAISSER pendant la manche. */
    currentWinAmount?: number;
    /** false : ENCAISSER désactivé (ex. aucune case révélée). */
    canCashout?: boolean;
    /** Texte du gros bouton, par exemple « Encaisser » pendant une manche de Crash. */
    playLabel?: string;
    /** Petite ligne sous le libellé, par exemple le montant à encaisser. */
    playDetail?: string;
    playAction?: PlayAction;
    /** Désactive seulement le gros bouton. */
    playDisabled?: boolean;
    /** Nom lu par les lecteurs d'écran, s'il doit différer du texte affiché. */
    playAriaLabel?: string;
    /** true : posé en bas du parent positionné ; false : dans le flux normal de la page. */
    floating?: boolean;
    /** Format téléphone tenu debout : barre de poulet-banane (JOUER au centre, SOLDE et MISE) ; au-dessus, ☰ et difficulté côté SOLDE, AUTO et TURBO côté MISE ; la difficulté et AUTO épousent le rond de JOUER. */
    portrait?: boolean;
    onplay?: (detail: PlayDetail<D>) => void;
    onmenu?: () => void;
    ontoggleauto?: (isAuto: boolean) => void;
    onturbo?: (isTurbo: boolean) => void;
    oncashout?: () => void;
    /** Révélation : clic sur JOUER pendant la manche (ex. révéler une case). */
    oncontinue?: () => void;
    onchangedifficulty?: (difficulty: D) => void;
    onchangebet?: (bet: number) => void;
    /** Si fourni, AUTO ouvre les réglages du jeu au lieu de basculer directement. */
    onautoclick?: () => void;
    /** Si fourni, toucher le montant de la mise ouvre la liste du jeu. */
    onbetclick?: () => void;
  };

  let {
    balance = 10000,
    bet = $bindable(400),
    minBet = 10,
    maxBet = 50000,
    betStep = 50,
    betOptions,
    betLocked = false,
    currency = 'FCFA',
    difficulty = $bindable('Normal' as D),
    difficulties = DIFFICULTIES as unknown as readonly D[],
    difficultyHints = {},
    isAuto = $bindable(false),
    showAuto = true,
    isTurbo = $bindable(false),
    showTurbo = true,
    turboLocked = false,
    isPlaying = false,
    disabled = false,
    gameType = 'crash',
    currentWinAmount = 0,
    canCashout = true,
    playLabel = 'Jouer',
    playDetail,
    playAction = 'bet',
    playDisabled = false,
    playAriaLabel,
    floating = true,
    portrait = false,
    onplay,
    onmenu,
    ontoggleauto,
    onturbo,
    oncashout,
    oncontinue,
    onchangedifficulty,
    onchangebet,
    onautoclick,
    onbetclick,
  }: Props = $props();

  const money = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
  // Espace insécable normale (au lieu de l'espace fine) : « 10 000,00 » comme sur la référence.
  const wideSpace = (text: string) => text.replace(/ /g, ' ');
  const formatMoney = (value: number) => wideSpace(money.format(value));
  const formatBet = (value: number) => wideSpace(amount.format(value));

  // Pendant une manche (ou des tours gratuits), la mise et la difficulté sont verrouillées.
  const locked = $derived(disabled || isPlaying || betLocked);
  // La mise ne dépasse ni le plafond du jeu ni le solde disponible.
  const ceiling = $derived(Math.max(minBet, Math.min(maxBet, balance)));
  const stepSize = $derived(betStep > 0 ? betStep : 1);
  const amounts = $derived(betOptions?.length ? [...betOptions].sort((a, b) => a - b) : null);

  function nextBet(direction: 1 | -1): number | undefined {
    if (amounts) {
      return direction > 0
        ? amounts.find((value) => value > bet && value <= balance)
        : [...amounts].reverse().find((value) => value < bet);
    }
    // Sans liste, les paliers restent alignés sur le pas : 10 → 50 → 100…, et 400 → 350.
    const target = direction > 0
      ? (Math.floor(bet / stepSize) + 1) * stepSize
      : (Math.ceil(bet / stepSize) - 1) * stepSize;
    const next = Math.min(ceiling, Math.max(minBet, target));
    return next === bet ? undefined : next;
  }
  const canDecrease = $derived(!locked && nextBet(-1) !== undefined);
  const canIncrease = $derived(!locked && nextBet(1) !== undefined);

  function changeBet(direction: 1 | -1) {
    const next = nextBet(direction);
    if (locked || next === undefined) return;
    bet = next;
    onchangebet?.(next);
  }

  const showDifficulty = $derived(difficulties.length > 0);
  // Les libellés longs (« Encaisser », « Nouvelle partie ») rétrécissent pour rester dans le bouton.
  const longestWord = $derived(Math.max(...playLabel.split(/\s+/).map((word) => word.length)));
  const playTextScale = $derived(longestWord > 6 ? Math.max(0.62, 6 / longestWord) : 1);
  // Le triangle ▶ accompagne seulement un libellé court d'un mot (Jouer, Miser, Lancer…).
  const showPlayIcon = $derived(playAction === 'bet' && !/\s/.test(playLabel.trim()));
  const playName = $derived(playAriaLabel ?? (playDetail ? `${playLabel} ${playDetail}` : playLabel));

  // Le jeu automatique reste réglable pendant une manche, pour pouvoir l'arrêter.
  function autoClick() {
    if (disabled) return;
    if (onautoclick) return onautoclick();
    isAuto = !isAuto;
    ontoggleauto?.(isAuto);
  }

  // Le turbo se règle entre deux manches (verrouillé pendant un lancer).
  const turboDisabled = $derived(disabled || isPlaying || turboLocked);
  function turboClick() {
    if (turboDisabled) return;
    isTurbo = !isTurbo;
    onturbo?.(isTurbo);
  }

  let menuOpen = $state(false);
  let menuList = $state<HTMLDivElement>();
  let difficultyBox = $state<HTMLDivElement>();
  let difficultyButton = $state<HTMLButtonElement>();

  async function difficultyClick() {
    menuOpen = !menuOpen;
    if (!menuOpen) return;
    await tick();
    menuList?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
  }

  function chooseDifficulty(level: D) {
    menuOpen = false;
    difficultyButton?.focus();
    if (level === difficulty) return;
    difficulty = level;
    onchangedifficulty?.(level);
  }

  function moveFocus(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...(menuList?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  }

  // Le menu se ferme au clic extérieur, avec Échap, ou quand une manche commence.
  $effect(() => {
    if (!menuOpen) return;
    const outside = (event: PointerEvent) => { if (!difficultyBox?.contains(event.target as Node)) menuOpen = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { menuOpen = false; difficultyButton?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  });
  $effect(() => { if (locked) menuOpen = false; });

  // ── Portrait : géométrie de poulet-banane, en unités de son cadre de 1080 de large ──
  // Barre de 1004 (93 %) qui ne contient que SOLDE et MISE ; JOUER de 240 centré sur son bord haut, dans un collier
  // de rayon 128 qui fait partie de la barre. La rangée de 123 posée au-dessus l'entoure : ☰ puis la difficulté
  // côté SOLDE, AUTO puis TURBO côté MISE. La difficulté, AUTO et les cartes sont creusées en arc de rayon 136
  // autour de JOUER, sur toute leur hauteur ; − et + encadrent la mise, comme sur ordinateur.
  const uid = `dock-${++nextId}`;
  const PB = { barW: 1004, pad: 14, cards: 160, ring: 128, creux: 136, corner: 26, mid: 6, stepper: 84, betLeft: 508, row: 123, rowGap: 10, gap: 16 };
  // Pendant une manche de crash ou de révélation, la mise, le solde et les options disparaissent.
  const liveMode = $derived(isPlaying && (gameType === 'crash' || gameType === 'reveal') ? gameType : null);
  // En crash, pendant la manche, JOUER s'efface : la barre perd son collier et ENCAISSER prend toute la place.
  const hasCircle = $derived(liveMode !== 'crash');
  const pg = $derived.by(() => {
    const cx = PB.barW / 2, W = PB.barW, c = PB.corner, r = hasCircle ? PB.ring : 0;
    const playCy = 0, cardsTop = PB.pad, H = cardsTop + PB.cards + PB.pad;
    const arc = (dy: number) => Math.sqrt(Math.max(0, PB.creux ** 2 - dy ** 2));
    // Rangée du dessus : centre de JOUER vu depuis son bord haut ; écart au centre en haut (inner) et à mi-hauteur (mid).
    // La difficulté et AUTO s'arrêtent sur l'arc ; leur contenu se centre dans la partie visible.
    // TURBO a la même largeur visible qu'AUTO.
    const tabCy = playCy + PB.rowGap + PB.row;
    const inner = arc(tabCy), midArc = arc(tabCy - PB.row / 2);
    const turboW = (W - (cx + midArc) - PB.gap) / 2;
    // Le texte du SOLDE reste dégagé du creux à la hauteur du libellé.
    const cardPad = Math.max(16, arc(cardsTop + PB.cards * 0.3 - playCy) - PB.mid + 12);
    // − commence juste après le creux, à mi-hauteur de la carte MISE.
    const stepDy = cardsTop + PB.cards / 2 - playCy, stepR = PB.creux + PB.stepper / 2;
    const stepPad = cx + Math.sqrt(stepR ** 2 - stepDy ** 2) - PB.stepper / 2 - PB.betLeft + 4;
    // Contour de la barre : rectangle arrondi et collier circulaire autour de JOUER (contourBarre de poulet-banane).
    const dxTop = playCy < r ? Math.sqrt(r * r - playCy ** 2) : 0;
    const dxBottom = H - playCy < r ? Math.sqrt(r * r - (H - playCy) ** 2) : 0;
    const top = `M ${c} 0` + (dxTop ? ` L ${cx - dxTop} 0 A ${r} ${r} 0 0 1 ${cx + dxTop} 0` : '') + ` L ${W - c} 0`;
    const path = top + ` A ${c} ${c} 0 0 1 ${W} ${c} L ${W} ${H - c} A ${c} ${c} 0 0 1 ${W - c} ${H}`
      + (dxBottom ? ` L ${cx + dxBottom} ${H} A ${r} ${r} 0 0 1 ${cx - dxBottom} ${H}` : '')
      + ` L ${c} ${H} A ${c} ${c} 0 0 1 0 ${H - c} L 0 ${c} A ${c} ${c} 0 0 1 ${c} 0 Z`;
    const frameTop = Math.min(0, playCy - r) - 3, frameBottom = Math.max(H, playCy + r) + 3;
    return { playCy, cardsTop, H, cardPad, stepPad, tabCy, inner, midArc, turboW, path, top, frameTop, frameH: frameBottom - frameTop };
  });

  function cashout() {
    if (disabled || !canCashout) return;
    if (oncashout) oncashout();
    else onplay?.({ bet, difficulty, isAuto });
  }

  function play() {
    if (disabled || playDisabled) return;
    menuOpen = false;
    onplay?.({ bet, difficulty, isAuto });
  }
</script>

{#snippet betValue()}
  <span class="card-label">Mise&nbsp;:</span>
  {#key bet}<span class="card-value bet-value">{formatBet(bet)}</span>{/key}
  <span class="currency-sub">{currency}</span>
{/snippet}

{#snippet menuButton()}
  <button type="button" class="menu-btn" aria-label="Ouvrir le menu" aria-haspopup="dialog" title="Menu" {disabled} onclick={() => onmenu?.()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
  </button>
{/snippet}

{#snippet difficultyControl(caption: boolean)}
  <div class="difficulty" bind:this={difficultyBox}>
    <button bind:this={difficultyButton} type="button" class="pill difficulty-pill"
      aria-haspopup="menu" aria-expanded={menuOpen}
      aria-label="Difficulté : {difficulty}" disabled={locked} onclick={difficultyClick}>
      {#if caption}<span class="pill-caption">Difficulté&nbsp;:</span>{/if}
      <span class="pill-value">{difficulty}<svg class="pill-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span>
    </button>
    {#if menuOpen}
      <div class="difficulty-menu" role="menu" tabindex="-1" aria-label="Choisir la difficulté" bind:this={menuList} onkeydown={moveFocus}>
        {#each difficulties as level (level)}
          <button type="button" class="difficulty-option" role="menuitemradio" aria-checked={level === difficulty} onclick={() => chooseDifficulty(level)}>
            <span class="option-text">{level}{#if difficultyHints[level]}<small>{difficultyHints[level]}</small>{/if}</span>
            <svg class="option-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet autoButton(solo: boolean)}
  <button type="button" class="mode-btn auto-btn" class:solo class:auto-on={isAuto}
    aria-pressed={onautoclick ? undefined : isAuto} aria-haspopup={onautoclick ? 'dialog' : undefined}
    aria-label={onautoclick ? `Ouvrir le jeu automatique${isAuto ? ' (activé)' : ''}` : 'Jeu automatique'}
    title={isAuto ? 'Jeu automatique activé' : 'Jeu automatique'} {disabled} onclick={autoClick}>
    <svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" /></svg>
  </button>
{/snippet}

{#snippet turboButton(solo: boolean)}
  <button type="button" class="mode-btn turbo-btn" class:solo class:turbo-on={isTurbo} aria-pressed={isTurbo} aria-label="Turbo"
    title={isTurbo ? 'Turbo activé : animations accélérées' : 'Turbo : accélérer les animations'} disabled={turboDisabled} onclick={turboClick}>
    <svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
  </button>
{/snippet}

{#snippet continueButton()}
  <!-- Pendant la manche (révélation) : même pierre verte, au même endroit, mais une flèche « suivant » à la place de JOUER,
       pour ne pas la confondre avec une nouvelle mise. Elle révèle une case au hasard (oncontinue) ; vert = continuer, or = encaisser. -->
  <button type="button" class="master-play-btn continue-btn" data-action="bet" data-state="idle" aria-label="Révéler une case au hasard"
    title="Révéler une case au hasard" {disabled} onclick={() => oncontinue?.()}>
    <span class="play-gloss" aria-hidden="true"></span>
    <span class="play-text"><svg class="continue-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12h14M12.5 5.5 19 12l-6.5 6.5" /></svg></span>
  </button>
{/snippet}

{#snippet playButton()}
  <button type="button" class="master-play-btn" data-action={playAction} data-state={isPlaying ? 'playing' : 'idle'}
    aria-label={playName} aria-busy={isPlaying} disabled={disabled || playDisabled} style:--play-text-scale={playTextScale} onclick={play}>
    <span class="play-gloss" aria-hidden="true"></span>
    <span class="play-text">
      <span class="play-label">{playLabel}{#if showPlayIcon}<svg class="play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.6v14.8L19.5 12Z" /></svg>{/if}</span>
      {#if playDetail}<span class="play-detail">{playDetail}</span>{/if}
    </span>
  </button>
{/snippet}

<div class="casino-dock-wrapper" class:floating class:portrait>
  {#if liveMode && !portrait}
  <!-- En jeu : crash → menu + ENCAISSER au centre ; reveal → menu + ENCAISSER + JOUER (continuer). -->
  <section class="dock dock-live" data-mode={liveMode} aria-label="Commandes de la manche">
    <div class="dock-pod live-pod">
      <span class="pod-frame" aria-hidden="true"></span>
      {@render menuButton()}
      <button type="button" class="cashout-btn-hero" class:cashout-btn={liveMode === 'reveal'} disabled={disabled || !canCashout}
        aria-label="Encaisser {formatMoney(currentWinAmount)} {currency}" onclick={cashout}>
        <span class="hero-label">Encaisser</span>
        <span class="hero-amount">{formatMoney(currentWinAmount)} {currency}</span>
      </button>
      {#if liveMode === 'reveal'}
        {@render continueButton()}
      {/if}
    </div>
  </section>
  {:else if portrait}
  <!-- Portrait (téléphone) : barre de poulet-banane (JOUER au centre, SOLDE et MISE) ; au-dessus, ☰ et la difficulté
       côté SOLDE, AUTO et TURBO côte à côte côté MISE. La difficulté et AUTO épousent le rond de JOUER. -->
  <section class="dock dock-portrait" data-mode={liveMode ?? undefined} aria-label={liveMode ? 'Commandes de la manche' : 'Commandes du jeu'}
    style:--play-cy={pg.playCy} style:--cards-top={pg.cardsTop} style:--bar-h={pg.H} style:--card-pad={pg.cardPad} style:--step-pad={pg.stepPad}
    style:--tab-cy={pg.tabCy} style:--inner={pg.inner} style:--mid-arc={pg.midArc} style:--turbo-w={pg.turboW}>
    <div class="p-tabs">
      {@render menuButton()}
      {#if !liveMode}
        {#if showDifficulty}<div class="p-difficulty">{@render difficultyControl(true)}</div>{/if}
        {#if showAuto}
          <button type="button" class="p-tab p-auto" class:auto-on={isAuto}
            aria-pressed={onautoclick ? undefined : isAuto} aria-haspopup={onautoclick ? 'dialog' : undefined}
            aria-label={onautoclick ? `Ouvrir le jeu automatique${isAuto ? ' (activé)' : ''}` : 'Jeu automatique'}
            title={isAuto ? 'Jeu automatique activé' : 'Jeu automatique'} {disabled} onclick={autoClick}>
            <svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" /></svg>
          </button>
        {/if}
        {#if showTurbo}
          <button type="button" class="p-tab p-turbo turbo-btn" class:turbo-on={isTurbo} aria-pressed={isTurbo} aria-label="Turbo"
            title={isTurbo ? 'Turbo activé : animations accélérées' : 'Turbo : accélérer les animations'} disabled={turboDisabled} onclick={turboClick}>
            <svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
          </button>
        {/if}
      {/if}
    </div>
    <div class="p-bar">
      <svg class="p-frame" viewBox="-2 {pg.frameTop} {PB.barW + 4} {pg.frameH}" preserveAspectRatio="none" aria-hidden="true"
        style:top="calc({pg.frameTop} * var(--p))" style:height="calc({pg.frameH} * var(--p))">
        <defs>
          <clipPath id="{uid}-clip"><path d={pg.path} /></clipPath>
          <linearGradient id="{uid}-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241f3d" /><stop offset="0.6" stop-color="#161229" /><stop offset="1" stop-color="#0e0a1f" /></linearGradient>
        </defs>
        <path d={pg.path} fill="url(#{uid}-fill)" />
        <path d={pg.top} fill="none" stroke="#00f2fe" stroke-width="3.5" vector-effect="non-scaling-stroke" clip-path="url(#{uid}-clip)" />
        <path d={pg.path} fill="none" stroke="#4a3b75" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      </svg>
      {#if liveMode}
        <!-- En jeu : ENCAISSER doré occupe tout l'intérieur de la barre (creusé autour de JOUER en révélation). -->
        <button type="button" class="cashout-btn-hero p-hero" class:around-play={hasCircle} disabled={disabled || !canCashout}
          aria-label="Encaisser {formatMoney(currentWinAmount)} {currency}" onclick={cashout}>
          <span class="hero-label">Encaisser</span>
          <span class="hero-amount">{formatMoney(currentWinAmount)} {currency}</span>
        </button>
      {:else}
      <div class="glass-card p-card p-balance">
        <span class="card-label">Solde · {currency}</span>
        <span class="card-value" aria-live="polite">{formatMoney(balance)}</span>
      </div>
      <div class="glass-card p-card p-bet" class:bet-locked={locked}>
        <button type="button" class="stepper-btn minus" aria-label="Diminuer la mise" disabled={!canDecrease} onclick={() => changeBet(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
        </button>
        {#if onbetclick}
          <button type="button" class="bet-display bet-open" aria-label="Modifier le montant de la mise" aria-haspopup="dialog" disabled={locked} onclick={onbetclick}>{@render betValue()}</button>
        {:else}
          <div class="bet-display" aria-live="polite">{@render betValue()}</div>
        {/if}
        <button type="button" class="stepper-btn plus" aria-label="Augmenter la mise" disabled={!canIncrease} onclick={() => changeBet(1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12" /></svg>
        </button>
      </div>
      {/if}
      {#if !liveMode}{@render playButton()}{:else if liveMode === 'reveal'}{@render continueButton()}{/if}
    </div>
  </section>
  {:else}
  <section class="dock" aria-label="Commandes du jeu">
    <!-- Module gauche : compte -->
    <div class="dock-pod account-pod">
      <span class="pod-frame" aria-hidden="true"></span>
      {@render menuButton()}
      <div class="glass-card balance-card">
        <span class="card-label">Solde · {currency}</span>
        <span class="card-value" aria-live="polite">{formatMoney(balance)}</span>
      </div>
    </div>

    <!-- Module droit : jeu -->
    <div class="dock-pod action-pod">
      <span class="pod-frame" aria-hidden="true"></span>
      {#if showAuto || showTurbo || showDifficulty}
        <!-- Difficulté sur toute la largeur en haut ; AUTO et TURBO côte à côte en dessous. -->
        <div class="options-stack" class:compact={showDifficulty}>
          {#if showDifficulty}
            {@render difficultyControl(true)}
          {/if}
          {#if showAuto}{@render autoButton(!showTurbo)}{/if}
          {#if showTurbo}{@render turboButton(!showAuto)}{/if}
        </div>
      {/if}

      <div class="glass-card bet-card" class:bet-locked={locked}>
        <button type="button" class="stepper-btn minus" aria-label="Diminuer la mise" disabled={!canDecrease} onclick={() => changeBet(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
        </button>
        {#if onbetclick}
          <button type="button" class="bet-display bet-open" aria-label="Modifier le montant de la mise" aria-haspopup="dialog" disabled={locked} onclick={onbetclick}>{@render betValue()}</button>
        {:else}
          <div class="bet-display" aria-live="polite">{@render betValue()}</div>
        {/if}
        <button type="button" class="stepper-btn plus" aria-label="Augmenter la mise" disabled={!canIncrease} onclick={() => changeBet(1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12" /></svg>
        </button>
      </div>

      {@render playButton()}
    </div>
  </section>
  {/if}
</div>

<style>
  /* ── Conteneur : centré en bas, la zone vide laisse passer les clics vers le jeu ── */
  .casino-dock-wrapper {
    container-type: inline-size;
    display: flex;
    justify-content: center;
    width: 100%;
    padding-inline: 12px;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }
  .casino-dock-wrapper.floating {
    position: absolute;
    left: 0;
    right: 0;
    bottom: var(--dock-bottom, clamp(10px, 3vh, 28px));
    z-index: 10;
  }

  /* Toutes les tailles découlent de --u : 1 px sur grand écran (≥ 1334 px),
     0,82 px sur tablette et mobile paysage, avec une transition continue entre les deux. */
  .dock {
    --u: calc(clamp(0.82px, 0.075cqi, 1px) * var(--dock-scale, 1));
    --play: calc(86 * var(--u));
    --menu: calc(54 * var(--u));
    --pod-h: calc(72 * var(--u));
    --pad: calc(6 * var(--u));
    --stepper: calc(34 * var(--u));
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(10 * var(--u));
    width: fit-content;
    max-width: min(960px, 100%);
    min-height: var(--play);
    padding-left: calc(var(--menu) / 2 + 2px);
    padding-right: calc(var(--play) / 2 + 2px);
    white-space: nowrap;
    pointer-events: auto;
    animation: dock-swap 0.25s ease-out;
  }
  /* Passage barre complète ↔ barre de manche : fondu et léger agrandissement. */
  @keyframes dock-swap { from { opacity: 0; transform: scale(0.98); } }
  @container (max-width: 600px) {
    .dock { --u: calc(clamp(0.62px, 0.137cqi, 0.82px) * var(--dock-scale, 1)); }
  }

  /* ── Châssis métallique des deux modules ──
     Le bouton menu est centré sur le bord gauche du module compte, le bouton JOUER sur le bord droit
     du module jeu. Chaque cadre y est creusé d'un demi-cercle qui laisse un espace (--ring-gap)
     tout autour du bouton : aucun cadre ne touche plus les boutons ronds. */
  .dock-pod {
    --ring-gap: calc(6 * var(--u));
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: stretch;
    gap: var(--pad);
    height: var(--pod-h);
    padding: var(--pad);
    border-radius: calc(20 * var(--u));
  }
  .account-pod {
    --notch-x: 0%;
    --notch-r: calc(var(--menu) / 2 + var(--ring-gap));
    /* Carte Solde : arc de rayon --card-r (même écart --pad que le cadre), centré sur le bouton menu.
       Son bord droit commence là où l'arc rejoint le haut et le bas de la carte (60 u de haut) :
       √(39² − 30²) ≈ 24,9 u. */
    --card-r: calc(var(--notch-r) + var(--pad));
    --card-inset: calc(24.9 * var(--u));
    padding-left: var(--card-inset);
  }
  .action-pod {
    --notch-x: 100%;
    --notch-r: calc(var(--play) / 2 + var(--ring-gap));
    /* Carte Mise : même principe autour du bouton JOUER, √(55² − 30²) ≈ 46,1 u. */
    --card-r: calc(var(--notch-r) + var(--pad));
    --card-inset: calc(46.1 * var(--u));
    padding-right: var(--card-inset);
  }
  /* Le calque porte l'ombre ; son pseudo-élément porte le cadre, découpé par le masque. */
  .pod-frame {
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.7));
    pointer-events: none;
  }
  .pod-frame::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      radial-gradient(circle at var(--notch-x) 50%, transparent calc(var(--notch-r) - 0.5px), #4a3b75 var(--notch-r), #4a3b75 calc(var(--notch-r) + 1.5px), transparent calc(var(--notch-r) + 2px)),
      radial-gradient(circle at var(--notch2-x, -999px) 50%, transparent calc(var(--notch2-r, 0px) - 0.5px), #4a3b75 var(--notch2-r, 0px), #4a3b75 calc(var(--notch2-r, 0px) + 1.5px), transparent calc(var(--notch2-r, 0px) + 2px)),
      linear-gradient(180deg, #241f3d 0%, #161229 60%, #0e0a1f 100%);
    /* Bordure 1,5 px #4a3b75, liseré néon cyan en haut, léger reflet en bas. */
    box-shadow: inset 0 0 0 1.5px #4a3b75, inset 0 3px 0 #00f2fe, inset 0 -1px 0 rgba(255, 255, 255, 0.04);
    /* Deux creux possibles : --notch (toujours) et --notch2 (absent par défaut, rayon 0). */
    -webkit-mask:
      radial-gradient(circle at var(--notch-x) 50%, transparent calc(var(--notch-r) - 0.5px), #000 var(--notch-r)),
      radial-gradient(circle at var(--notch2-x, -999px) 50%, transparent calc(var(--notch2-r, 0px) - 0.5px), #000 var(--notch2-r, 0px));
    -webkit-mask-composite: source-in;
    mask:
      radial-gradient(circle at var(--notch-x) 50%, transparent calc(var(--notch-r) - 0.5px), #000 var(--notch-r)),
      radial-gradient(circle at var(--notch2-x, -999px) 50%, transparent calc(var(--notch2-r, 0px) - 0.5px), #000 var(--notch2-r, 0px));
    mask-composite: intersect;
  }

  /* ── Bouton menu circulaire ── */
  .menu-btn {
    position: absolute;
    top: 50%;
    left: calc(var(--menu) / -2);
    z-index: 2;
    display: grid;
    place-items: center;
    width: var(--menu);
    height: var(--menu);
    min-height: 0;
    padding: 0;
    border: calc(3 * var(--u)) solid #3b3459;
    border-radius: 50%;
    color: #fff;
    background: radial-gradient(circle at 50% 30%, #2d2749 0%, #1a1631 58%, #100d21 100%);
    box-shadow: 0 0 0 1.5px #5c4f88, inset 0 1.5px 0 rgba(255, 255, 255, 0.14), 0 6px 16px rgba(0, 0, 0, 0.65);
    transform: translateY(-50%);
    transition: transform 0.12s ease, filter 0.2s ease, box-shadow 0.2s ease;
  }
  .menu-btn svg { width: 46%; height: 46%; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.6)); }
  .menu-btn:hover:enabled { filter: brightness(1.15); box-shadow: 0 0 0 1.5px #8b7bc4, inset 0 1.5px 0 rgba(255, 255, 255, 0.18), 0 6px 16px rgba(0, 0, 0, 0.65), 0 0 14px rgba(0, 242, 254, 0.25); }
  .menu-btn:active:enabled { transform: translateY(-50%) scale(0.94); }
  .menu-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Cartes vitrées encastrées (solde et mise) ── */
  .glass-card {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: calc(14 * var(--u));
    background: linear-gradient(135deg, rgba(46, 35, 78, 0.6) 0%, rgba(20, 15, 38, 0.8) 100%);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  /* Lueur violette qui monte du bas de la vitre. */
  .glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background: radial-gradient(ellipse 90% 85% at 50% 120%, rgba(139, 92, 246, 0.6), rgba(109, 40, 217, 0.18) 55%, transparent 75%);
    pointer-events: none;
  }
  /* Reflet de la vitre : bande blanche très légère à 45°. */
  .glass-card::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(45deg, transparent 38%, rgba(255, 255, 255, 0.09) 47%, rgba(255, 255, 255, 0.03) 53%, transparent 62%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 40%);
    pointer-events: none;
  }

  /* ── Typographie ── */
  .card-label {
    color: #a79fc2;
    font-size: max(9px, calc(10 * var(--u)));
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .card-value {
    color: #fff;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: calc(24 * var(--u));
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.28), 0 1px 2px rgba(0, 0, 0, 0.6);
  }

  .balance-card {
    display: grid;
    place-content: center;
    justify-items: center;
    gap: calc(4 * var(--u));
    min-width: calc(180 * var(--u));
    /* 18 u + 14 u de creux à gauche : le texte reste centré dans la partie visible. */
    padding-inline: calc(32 * var(--u)) calc(18 * var(--u));
  }

  /* Côté creusé en demi-cercle des cartes Solde et Mise, concentrique au creux du cadre,
     avec un liseré violet qui suit l'arc. */
  .balance-card { --arc-x: calc(-1 * var(--card-inset)); }
  .bet-card { --arc-x: calc(100% + var(--card-inset)); }
  .balance-card, .bet-card {
    background:
      radial-gradient(circle at var(--arc-x) 50%, transparent calc(var(--card-r) - 0.5px), rgba(139, 92, 246, 0.45) var(--card-r), rgba(139, 92, 246, 0.45) calc(var(--card-r) + 1px), transparent calc(var(--card-r) + 1.5px)),
      linear-gradient(135deg, rgba(46, 35, 78, 0.6) 0%, rgba(20, 15, 38, 0.8) 100%);
    background-origin: border-box;
    -webkit-mask: radial-gradient(circle at var(--arc-x) 50%, transparent calc(var(--card-r) - 0.5px), #000 var(--card-r));
    mask: radial-gradient(circle at var(--arc-x) 50%, transparent calc(var(--card-r) - 0.5px), #000 var(--card-r));
  }

  /* ── Pile d'options : difficulté sur toute la largeur en haut, AUTO et TURBO côte à côte en bas.
     Sans difficulté, AUTO et TURBO occupent toute la hauteur ; un bouton seul occupe toute la largeur. ── */
  .options-stack {
    --mode-size: calc(44 * var(--u));
    position: relative;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: var(--mode-size);
    align-items: center;
    gap: calc(6 * var(--u));
  }
  .options-stack.compact {
    --mode-size: calc(28 * var(--u));
    width: calc(100 * var(--u));
    grid-auto-flow: row;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 1fr;
    align-items: stretch;
    gap: calc(4 * var(--u));
  }
  /* Le menu se place par rapport à toute la pile, pour ne pas couvrir AUTO et TURBO. */
  .difficulty { grid-column: 1 / -1; min-height: 0; }
  .options-stack.compact .mode-btn.solo { grid-column: 1 / -1; }
  .pill {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 0 calc(8 * var(--u));
    border: 1px solid #4a4466;
    border-radius: 999px;
    color: #fff;
    background: linear-gradient(180deg, #221d3a 0%, #15122a 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 2px 5px rgba(0, 0, 0, 0.45);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  }
  .pill:hover:enabled { border-color: #7a6fa6; filter: brightness(1.12); }
  .pill:disabled { opacity: 0.45; cursor: not-allowed; }
  /* AUTO et TURBO : boutons ronds, symbole seul (le nom est lu par les lecteurs d'écran et s'affiche au survol). */
  .mode-btn { width: var(--mode-size); height: var(--mode-size); justify-self: center; align-self: center; }
  .options-stack.compact .mode-btn { border-width: calc(2 * var(--u)); }
  /* Activé : AUTO s'éclaire en cyan, TURBO en or avec l'éclair rempli. */
  .auto-btn.auto-on { border-color: #0e5f6e; color: #67f5ff; box-shadow: 0 0 0 1.5px #00f2fe, inset 0 1.5px 0 rgba(255, 255, 255, 0.14), 0 0 14px rgba(0, 242, 254, 0.45); }
  .turbo-btn.turbo-on { border-color: #6b4e0f; color: #fcd34d; box-shadow: 0 0 0 1.5px #fbbf24, inset 0 1.5px 0 rgba(255, 255, 255, 0.14), 0 0 14px rgba(251, 191, 36, 0.45); }
  .turbo-btn.turbo-on .mode-icon { fill: currentColor; }
  .difficulty-pill { flex-direction: column; gap: calc(1 * var(--u)); line-height: 1.05; }
  .pill-caption { color: #d4cdea; font-size: max(8px, calc(9.5 * var(--u))); font-weight: 500; }
  .pill-value { display: inline-flex; align-items: center; gap: calc(2 * var(--u)); color: #fff; font-size: max(9px, calc(11 * var(--u))); font-weight: 600; }
  .pill-chevron { width: calc(11 * var(--u)); height: calc(11 * var(--u)); fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.2s ease; }
  .difficulty-pill[aria-expanded='true'] .pill-chevron { transform: rotate(180deg); }

  /* Liste déroulante des difficultés : elle s'ouvre vers le haut, au-dessus du dock. */
  .difficulty-menu {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    z-index: 20;
    display: grid;
    gap: 2px;
    min-width: calc(140 * var(--u));
    padding: 5px;
    border: 1.5px solid #4a3b75;
    border-radius: 14px;
    background: linear-gradient(180deg, #241f3d 0%, #161229 100%);
    box-shadow: inset 0 1.5px 0 #00f2fe, 0 12px 28px rgba(0, 0, 0, 0.75);
    transform: translateX(-50%);
    animation: menu-in 0.16s ease-out;
  }
  .difficulty-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 38px;
    padding: 4px 12px;
    border: 0;
    border-radius: 10px;
    color: #e9e5f7;
    background: transparent;
    font: 600 13px system-ui, -apple-system, sans-serif;
    text-align: left;
  }
  .option-text { display: grid; gap: 1px; }
  .option-text small { color: #a79fc2; font-size: 11px; font-weight: 500; }
  .difficulty-option:hover, .difficulty-option:focus-visible { color: #fff; background: rgba(139, 92, 246, 0.18); outline-offset: -2px; }
  .difficulty-option[aria-checked='true'] { color: #fff; background: rgba(139, 92, 246, 0.28); }
  .option-check { width: 14px; height: 14px; fill: none; stroke: #00f2fe; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
  .difficulty-option[aria-checked='true'] .option-check { opacity: 1; }
  @keyframes menu-in { from { opacity: 0; transform: translate(-50%, 6px); } }

  /* ── Carte de mise avec steppers ── */
  .bet-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(6 * var(--u));
    min-width: calc(186 * var(--u));
    /* 9 u + 9 u de creux à droite, pour que le + reste à distance de l'arc. */
    padding-inline: calc(9 * var(--u)) calc(18 * var(--u));
  }
  .bet-display { display: grid; justify-items: center; gap: calc(3 * var(--u)); min-width: calc(64 * var(--u)); }
  /* Montant cliquable : ouvre la liste des mises du jeu. */
  .bet-open {
    position: relative;
    z-index: 2;
    min-height: 0;
    padding: calc(4 * var(--u)) calc(6 * var(--u));
    border: 0;
    border-radius: calc(10 * var(--u));
    color: inherit;
    background: transparent;
    font: inherit;
    transition: background-color 0.2s ease;
  }
  .bet-open:hover:enabled { background: rgba(255, 255, 255, 0.06); }
  .bet-open:disabled { opacity: 1; cursor: default; }
  .bet-card.bet-locked .card-label { color: #fbbf24; }
  .bet-value { display: inline-block; animation: bet-tick 0.22s ease-out; }
  .currency-sub { color: #b9a8e8; font-size: max(8px, calc(9.5 * var(--u))); font-weight: 600; line-height: 1; letter-spacing: 0.8px; }
  @keyframes bet-tick { from { opacity: 0.6; transform: scale(1.14); } }
  /* −, +, AUTO et TURBO : même cercle que le bouton menu — un anneau, un disque noir, puis le symbole blanc. */
  .stepper-btn, .mode-btn {
    position: relative;
    z-index: 2;
    display: grid;
    flex: none;
    place-items: center;
    min-height: 0;
    padding: 0;
    border: calc(2.5 * var(--u)) solid #3b3459;
    border-radius: 50%;
    color: #fff;
    background: radial-gradient(circle at 50% 30%, #2d2749 0%, #1a1631 58%, #100d21 100%);
    box-shadow: 0 0 0 1.5px #5c4f88, inset 0 1.5px 0 rgba(255, 255, 255, 0.14), 0 4px 10px rgba(0, 0, 0, 0.6);
    transition: transform 0.12s ease, filter 0.2s ease, box-shadow 0.2s ease;
  }
  .stepper-btn { width: var(--stepper); height: var(--stepper); }
  .stepper-btn svg, .mode-icon { width: 46%; height: 46%; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.6)); }
  .stepper-btn:hover:enabled, .mode-btn:hover:enabled { filter: brightness(1.2); }
  .stepper-btn:active:enabled, .mode-btn:active:enabled { transform: scale(0.92); }
  .stepper-btn:disabled, .mode-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Bouton maître : lunette violette, anneau or, dôme en pierre précieuse ──
     La pierre change selon l'action : émeraude (jouer), ambre (encaisser), rubis (annuler), améthyste (en cours). */
  .master-play-btn {
    --gem-light: #4ade80;
    --gem-mid: #16a34a;
    --gem-dark: #14532d;
    --glow: rgba(34, 197, 94, 0.65);
    --glow-strong: rgba(34, 197, 94, 0.9);
    position: absolute;
    top: 50%;
    right: calc(var(--play) / -2);
    z-index: 3;
    display: grid;
    place-items: center;
    width: var(--play);
    height: var(--play);
    min-width: var(--play);
    min-height: 0;
    padding: 0;
    overflow: hidden;
    border: calc(4 * var(--u)) solid transparent;
    border-radius: 50%;
    color: #fff;
    background:
      radial-gradient(circle at 35% 30%, var(--gem-light) 0%, var(--gem-mid) 60%, var(--gem-dark) 100%) padding-box,
      linear-gradient(150deg, #c9adff 0%, #8b5cf6 25%, #6b3ba7 50%, #3e1c74 80%, #6b3ba7 100%) border-box;
    box-shadow:
      inset 0 0 0 calc(3 * var(--u)) #d4af37,
      inset 0 0 0 calc(4.5 * var(--u)) rgba(70, 45, 0, 0.55),
      inset 0 2px 3px rgba(255, 255, 255, 0.4),
      0 0 0 calc(2.5 * var(--u)) #4c2a85,
      0 0 0 calc(3.5 * var(--u)) #1e0d3d,
      0 6px 14px rgba(0, 0, 0, 0.55);
    filter: drop-shadow(0 0 16px var(--glow));
    transform: translateY(-50%);
    transition: transform 0.12s ease, filter 0.2s ease;
  }
  .master-play-btn[data-action='cashout'] { --gem-light: #fde68a; --gem-mid: #f59e0b; --gem-dark: #92400e; --glow: rgba(245, 158, 11, 0.65); --glow-strong: rgba(245, 158, 11, 0.95); }
  .master-play-btn[data-action='cancel'] { --gem-light: #fda4af; --gem-mid: #e11d48; --gem-dark: #7f1d1d; --glow: rgba(225, 29, 72, 0.6); --glow-strong: rgba(225, 29, 72, 0.9); }
  .master-play-btn[data-action='busy'] { --gem-light: #c4b5fd; --gem-mid: #7c3aed; --gem-dark: #3b0764; --glow: rgba(139, 92, 246, 0.6); --glow-strong: rgba(139, 92, 246, 0.9); }
  .master-play-btn:hover:enabled { filter: drop-shadow(0 0 20px var(--glow-strong)) brightness(1.06); }
  .master-play-btn:active:enabled { transform: translateY(-50%) scale(0.95); }
  .master-play-btn[data-state='playing']:enabled,
  .master-play-btn[data-action='busy'] { animation: play-pulse 1.1s ease-in-out infinite; }
  .master-play-btn:disabled { opacity: 1; cursor: not-allowed; filter: grayscale(0.75) brightness(0.7); }
  .master-play-btn[data-action='busy']:disabled { cursor: progress; filter: drop-shadow(0 0 16px var(--glow)); }
  .play-gloss {
    position: absolute;
    top: 8%;
    left: 16%;
    width: 68%;
    height: 42%;
    border-radius: 50%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.18) 55%, transparent 100%);
    opacity: 0.8;
    pointer-events: none;
  }
  .play-text {
    position: relative;
    display: grid;
    justify-items: center;
    gap: calc(1 * var(--u));
    max-width: 80%;
    line-height: 1.05;
    text-align: center;
    white-space: normal;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.45);
  }
  .play-label {
    display: inline-flex;
    align-items: center;
    gap: calc(2 * var(--u));
    font-size: calc(14 * var(--u) * var(--play-text-scale, 1));
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .play-detail { font-size: max(8px, calc(9.5 * var(--u))); font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; opacity: 0.92; }
  .play-icon { flex: none; width: calc(15 * var(--u)); height: calc(15 * var(--u)); fill: currentColor; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45)); }
  /* Flèche « suivant » de la révélation en cours : grande, épaisse, elle avance un peu au survol. */
  .continue-icon {
    width: calc(40 * var(--u));
    height: calc(40 * var(--u));
    fill: none;
    stroke: currentColor;
    stroke-width: 3.2;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
    transition: transform 0.2s ease;
  }
  .continue-btn:hover:enabled .continue-icon, .continue-btn:focus-visible .continue-icon { transform: translateX(calc(4 * var(--u))); }
  @keyframes play-pulse { 50% { filter: drop-shadow(0 0 26px var(--glow-strong)) brightness(1.08); } }

  /* ── Barre de manche (crash, reveal) ── */
  .dock-live { padding-right: calc(var(--menu) / 2 + 2px); }
  .live-pod {
    --notch-x: 0%;
    --notch-r: calc(var(--menu) / 2 + var(--ring-gap));
    height: calc(84 * var(--u));
    align-items: center;
    gap: calc(10 * var(--u));
    padding-left: calc(var(--notch-r) + var(--pad));
    padding-right: calc(var(--pad) + 2 * var(--u));
  }
  /* Crash : marges égales pour que ENCAISSER soit exactement au milieu de la barre. */
  .dock-live[data-mode='crash'] .live-pod { padding-right: calc(var(--notch-r) + var(--pad)); }
  /* Révélation : JOUER est centré sur le bord droit du cadre, dans son propre creux. */
  .dock-live[data-mode='reveal'] { padding-right: calc(var(--play) / 2 + 2px); }
  .dock-live[data-mode='reveal'] .live-pod {
    --notch2-x: 100%;
    --notch2-r: calc(var(--play) / 2 + var(--ring-gap));
    padding-right: calc(var(--notch2-r) + var(--pad));
  }
  .cashout-btn-hero {
    position: relative;
    z-index: 1;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: calc(3 * var(--u));
    /* Largeur visée 380 u (le dock s'ajuste à son contenu) ; il rétrécit jusqu'à 220 u si l'écran manque de place. */
    flex: 0 1 auto;
    width: calc(380 * var(--u));
    min-width: calc(220 * var(--u));
    height: calc(72 * var(--u));
    min-height: 0;
    padding: 0 calc(24 * var(--u));
    border: calc(3 * var(--u)) solid #ffe082;
    border-radius: calc(36 * var(--u));
    color: #111;
    background: linear-gradient(135deg, #ffb800 0%, #ff8800 50%, #e65100 100%);
    box-shadow: 0 0 30px rgba(255, 140, 0, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.45), inset 0 -3px 6px rgba(120, 40, 0, 0.35);
    animation: hero-pulse 1s ease-in-out infinite alternate;
    transition: filter 0.2s ease;
  }
  .hero-label { color: #111; font-size: max(10px, calc(12 * var(--u))); font-weight: 800; line-height: 1; letter-spacing: 2px; text-transform: uppercase; }
  .hero-amount { color: #fff; font-size: calc(22 * var(--u)); font-weight: 900; line-height: 1.05; font-variant-numeric: tabular-nums; white-space: nowrap; text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45), 0 2px 6px rgba(120, 40, 0, 0.6); }
  .cashout-btn-hero:hover:enabled { filter: brightness(1.07); }
  .cashout-btn-hero:active:enabled { filter: brightness(0.94); }
  .cashout-btn-hero:disabled { opacity: 1; cursor: not-allowed; animation: none; filter: grayscale(0.75) brightness(0.65); box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.25); }
  /* Pulsation douce continue, pour attirer l'œil sur l'encaissement. */
  @keyframes hero-pulse {
    from { transform: scale(1); box-shadow: 0 0 20px rgba(255, 140, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.45), inset 0 -3px 6px rgba(120, 40, 0, 0.35); }
    to { transform: scale(1.03); box-shadow: 0 0 36px rgba(255, 140, 0, 0.85), inset 0 2px 0 rgba(255, 255, 255, 0.45), inset 0 -3px 6px rgba(120, 40, 0, 0.35); }
  }

  .dock :focus-visible { outline: 2px solid #00f2fe; outline-offset: 3px; }

  /* ── Portrait (téléphone) : géométrie de poulet-banane. --p = une unité de son cadre de 1080 de large ;
     --u est calé pour que JOUER (240 unités) garde les proportions du dock ordinateur (86 u). ── */
  .casino-dock-wrapper.portrait { padding-inline: 0; }
  .dock.dock-portrait {
    --p: calc(100cqi / 1080);
    --u: calc(240 * var(--p) / 86);
    --play: calc(240 * var(--p));
    /* ☰ rond de l'ordinateur à la hauteur de la rangée (123, soit 44 u comme AUTO et TURBO sur ordinateur) ; − et + 30 u. */
    --menu: calc(123 * var(--p));
    --stepper: calc(84 * var(--p));
    display: grid;
    justify-content: center;
    justify-items: center;
    width: 100%;
    max-width: none;
    min-height: 0;
    padding: 0 0 calc(20 * var(--p));
    gap: 0;
  }
  /* Rangée au-dessus de la barre (123 de haut) : ☰ et difficulté à gauche (côté SOLDE), AUTO et TURBO à droite (côté MISE). */
  .p-tabs { position: relative; width: calc(1004 * var(--p)); height: var(--menu); margin-bottom: calc(10 * var(--p)); }
  .dock-portrait .menu-btn { top: 0; left: 0; border-width: calc(2.5 * var(--u)); transform: none; }
  .dock-portrait .menu-btn:active:enabled { transform: scale(0.94); }
  /* Difficulté, AUTO et TURBO : même matière que les boutons ronds de l'ordinateur (anneau, disque sombre, symbole blanc). */
  .p-tab, .p-difficulty .difficulty-pill {
    position: absolute;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 0;
    padding: 0;
    border: 1.5px solid #5c4f88;
    border-radius: calc(26 * var(--p));
    color: #fff;
    background: radial-gradient(circle at 50% 30%, #2d2749 0%, #1a1631 58%, #100d21 100%);
    box-shadow: inset 0 0 0 calc(2.5 * var(--u)) #3b3459, inset 0 calc(4 * var(--u)) 0 rgba(255, 255, 255, 0.1), 0 4px 10px rgba(0, 0, 0, 0.6);
    transition: transform 0.12s ease, filter 0.2s ease;
  }
  .p-tab:hover:enabled { filter: brightness(1.2); }
  .p-tab:active:enabled { transform: scale(0.96); }
  .p-tab:disabled { opacity: 0.35; cursor: not-allowed; }
  .p-tab .mode-icon { width: calc(56 * var(--p)); height: calc(56 * var(--p)); }
  /* Bord tourné vers JOUER : creusé sur toute la hauteur en arc de rayon 136, concentrique à JOUER, avec son liseré. */
  .p-auto, .p-difficulty .difficulty-pill {
    --cy: calc(var(--tab-cy) * var(--p));
    background:
      radial-gradient(circle at var(--cx) var(--cy), transparent calc(136 * var(--p) - 0.5px), #5c4f88 calc(136 * var(--p)), #5c4f88 calc(136 * var(--p) + 1.5px), #3b3459 calc(136 * var(--p) + 1.5px), #3b3459 calc(136 * var(--p) + 1.5px + 2.5 * var(--u)), transparent calc(136 * var(--p) + 2px + 2.5 * var(--u))),
      radial-gradient(circle at 50% 30%, #2d2749 0%, #1a1631 58%, #100d21 100%);
    background-origin: border-box;
    -webkit-mask: radial-gradient(circle at var(--cx) var(--cy), transparent calc(136 * var(--p) - 0.5px), #000 calc(136 * var(--p)));
    mask: radial-gradient(circle at var(--cx) var(--cy), transparent calc(136 * var(--p) - 0.5px), #000 calc(136 * var(--p)));
  }
  /* AUTO : de l'arc jusqu'à TURBO ; même largeur visible que TURBO. */
  .p-auto {
    --cx: calc(var(--inner) * -1 * var(--p));
    left: calc((502 + var(--inner)) * var(--p));
    right: calc((var(--turbo-w) + 16) * var(--p));
    padding-left: calc((var(--mid-arc) - var(--inner)) * var(--p));
  }
  .p-auto.auto-on { border-color: #00f2fe; color: #67f5ff; }
  .p-turbo { right: 0; width: calc(var(--turbo-w) * var(--p)); }
  /* Difficulté : de ☰ jusqu'à l'arc. */
  .p-difficulty { position: absolute; top: 0; left: calc((123 + 16) * var(--p)); width: calc((502 - var(--inner) - 139) * var(--p)); height: 100%; }
  .p-difficulty .difficulty { position: relative; height: 100%; }
  .p-difficulty .difficulty-pill {
    --cx: calc(363 * var(--p));
    left: 0;
    width: 100%;
    padding: 0 calc((var(--mid-arc) - var(--inner)) * var(--p)) 0 calc(12 * var(--p));
  }
  .p-difficulty .difficulty-pill:hover:enabled { border-color: #8b7bc4; filter: brightness(1.2); }
  /* Le menu s'ouvre au-dessus de la liste, aligné sur son bord gauche. */
  .p-difficulty .difficulty-menu { left: 0; right: auto; min-width: 100%; transform: none; animation-name: menu-in-up; }
  @keyframes menu-in-up { from { opacity: 0; transform: translateY(6px); } }

  /* Barre : rectangle arrondi + collier autour de JOUER, dessinés en SVG. */
  .p-bar { position: relative; width: calc(1004 * var(--p)); height: calc(var(--bar-h) * var(--p)); }
  .p-frame { position: absolute; left: calc(-2 * var(--p)); width: calc(1008 * var(--p)); overflow: visible; filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.7)); pointer-events: none; }

  /* SOLDE et MISE : 476 × 160 chacune, côté tourné vers JOUER creusé en arc (rayon 136). */
  .p-card {
    --cy: calc((var(--play-cy) - var(--cards-top)) * var(--p));
    position: absolute;
    top: calc(var(--cards-top) * var(--p));
    width: calc(476 * var(--p));
    height: calc(160 * var(--p));
    border-radius: calc(18 * var(--p));
    background:
      radial-gradient(circle at var(--cx) var(--cy), transparent calc(136 * var(--p) - 0.5px), rgba(139, 92, 246, 0.45) calc(136 * var(--p)), rgba(139, 92, 246, 0.45) calc(136 * var(--p) + 1px), transparent calc(136 * var(--p) + 1.5px)),
      linear-gradient(135deg, rgba(46, 35, 78, 0.6) 0%, rgba(20, 15, 38, 0.8) 100%);
    background-origin: border-box;
    -webkit-mask: radial-gradient(circle at var(--cx) var(--cy), transparent calc(136 * var(--p) - 0.5px), #000 calc(136 * var(--p)));
    mask: radial-gradient(circle at var(--cx) var(--cy), transparent calc(136 * var(--p) - 0.5px), #000 calc(136 * var(--p)));
  }
  .p-balance {
    --cx: calc(482 * var(--p));
    left: calc(20 * var(--p));
    display: grid;
    align-content: center;
    justify-items: center;
    gap: calc(8 * var(--p));
    padding: 0 calc(var(--card-pad) * var(--p)) 0 calc(16 * var(--p));
  }
  /* MISE : − à gauche (juste après le creux), montant, + à droite, comme sur ordinateur. */
  .p-bet {
    --cx: calc(-6 * var(--p));
    left: calc(508 * var(--p));
    display: flex;
    align-items: center;
    gap: calc(4 * var(--p));
    padding: 0 calc(10 * var(--p)) 0 calc(var(--step-pad) * var(--p));
  }
  /* Le montant prend toute la place entre − et + : « 1 000 » tient même sur un écran de 320 px. */
  .p-bet .bet-display { flex: 1; min-width: 0; padding-inline: 0; }
  .p-bet .card-value { font-size: max(12px, calc(44 * var(--p))); }
  .p-bet.bet-locked .card-label { color: #fbbf24; }

  /* JOUER : centré sur le bord haut de la barre, au milieu de la rangée du dessus. */
  .dock-portrait .master-play-btn { top: calc(var(--play-cy) * var(--p)); right: auto; left: 50%; transform: translate(-50%, -50%); }
  .dock-portrait .master-play-btn:active:enabled { transform: translate(-50%, -50%) scale(0.95); }

  /* En jeu (crash, révélation) : ENCAISSER remplit l'intérieur de la barre, même hauteur qu'avant la mise.
     En révélation il est creusé autour de JOUER (rayon 136) et ses deux textes encadrent JOUER. */
  .dock-portrait .p-hero {
    --cx: calc(482 * var(--p));
    --cy: calc((var(--play-cy) - 14) * var(--p));
    position: absolute;
    top: calc(14 * var(--p));
    left: calc(20 * var(--p));
    width: calc(964 * var(--p));
    min-width: 0;
    height: calc((var(--bar-h) - 28) * var(--p));
    padding: 0 calc(24 * var(--p));
    gap: calc(6 * var(--p));
    border-width: max(1.5px, calc(5 * var(--p)));
    border-radius: calc(18 * var(--p));
  }
  .dock-portrait .p-hero .hero-label { font-size: max(11px, calc(32 * var(--p))); }
  .dock-portrait .p-hero .hero-amount { font-size: max(16px, calc(60 * var(--p))); }
  .dock-portrait .p-hero.around-play {
    grid-template-columns: minmax(0, 1fr) calc(290 * var(--p)) minmax(0, 1fr);
    place-content: stretch;
    align-items: center;
    background:
      radial-gradient(circle at var(--cx) var(--cy), transparent calc(136 * var(--p) - 0.5px), #ffe082 calc(136 * var(--p)), #ffe082 calc(141 * var(--p)), transparent calc(141 * var(--p) + 0.5px)),
      linear-gradient(135deg, #ffb800 0%, #ff8800 50%, #e65100 100%);
    background-origin: border-box;
    -webkit-mask: radial-gradient(circle at var(--cx) var(--cy), transparent calc(136 * var(--p) - 0.5px), #000 calc(136 * var(--p)));
    mask: radial-gradient(circle at var(--cx) var(--cy), transparent calc(136 * var(--p) - 0.5px), #000 calc(136 * var(--p)));
  }
  .dock-portrait .p-hero.around-play .hero-label { grid-column: 1; }
  .dock-portrait .p-hero.around-play .hero-amount { grid-column: 3; white-space: normal; text-align: center; }

  @media (prefers-reduced-motion: reduce) {
    .dock, .bet-value, .difficulty-menu, .master-play-btn, .cashout-btn-hero { animation: none !important; }
    .menu-btn, .pill, .pill-chevron, .stepper-btn, .mode-btn, .master-play-btn, .bet-open, .continue-icon { transition: none; }
  }
</style>
