# Environnement de maquette Crash

Cet atelier permet de préparer les quatre écrans de la famille Crash. L'écran affiché est une proposition visuelle à faire valider avant l'intégration dans les jeux.

## Ouvrir l'atelier

Dans le terminal, à partir du dossier `D:\Tsiry\baobab` :

```powershell
cd maquette/crash
npm run dev
```

Puis ouvrir **http://localhost:3050** dans le navigateur. Garder le terminal ouvert. Pour arrêter l'atelier, appuyer sur **Ctrl + C** dans ce terminal.

Si les dépendances ne sont pas encore installées, lancer d'abord `npm install` dans ce dossier.

## Ce qu'on peut regarder

- Ordinateur : 1440 × 900 pixels.
- Tablette : 900 × 900 pixels.
- Mobile portrait : 390 × 844 pixels.
- Mobile paysage : 844 × 390 pixels.

Les boutons en haut changent le format de l'aperçu. La liste « Moment de la partie » propose cinq vues : mises ouvertes, mise en attente, partie en cours, gain encaissé et crash avec mise perdue.

L'écran est affiché dans une fenêtre qui possède réellement la taille choisie. Il est réduit à l'affichage si nécessaire pour tenir dans l'atelier. Les valeurs proposées peuvent être modifiées dans `src/game/layouts.ts`.

Le lien « Ouvrir l'écran seul » enlève les commandes de l'atelier : la maquette s'adapte alors à la taille de la fenêtre du navigateur.

L'écran se lit de haut en bas :

- **La barre du haut** montre le logo du jeu à gauche, le logo du studio à droite et le solde fictif sur les grands écrans. Le menu ≡ (son et règles) est dans le dock de commandes : rond à gauche, ou au-dessus de la barre, en haut à gauche, en portrait.
- **La zone du jeu** montre les multiplicateurs des dernières manches, l'étape de la partie (« Mises ouvertes », « En cours », « Encaissé », « Crash »), le grand multiplicateur et la courbe dessinée avec PixiJS. Les couleurs suivent l'étape : violet en vol, vert après un encaissement, rouge au crash.
- **Le dock** (`../src/lib/CasinoControlDock.svelte`, commun aux quatre jeux) regroupe le solde, la mise, « Auto » et le bouton principal. En portrait, il prend la disposition de Poulet Banane : ☰ et AUTO (creusé autour de JOUER) au-dessus de la barre, JOUER rond centré sur son bord haut, SOLDE et MISE (encadrée par − et +) dans la barre.

Le bouton principal affiche « JOUER » pour lancer, comme dans tous les jeux, ou « Annuler » pour une mise en attente. Pendant la manche, « Encaisser » conserve le montant du gain à encaisser. Le bouton est vert pour jouer, ambre pour encaisser et rouge pour annuler une mise en attente. Le bloc de la manche affiche « Gain potentiel » pendant la manche, « Encaissé » après un encaissement et « Mise perdue » après un crash. Pendant la manche, le dock ne garde que le menu et un grand bouton doré « Encaisser » avec le gain ; en portrait, ce bouton remplit la barre, qui garde sa hauteur.

Le parcours visuel est le suivant : choisir une mise, cliquer sur « JOUER », puis « Encaisser ». Le montant affiché correspond à la mise multipliée par le multiplicateur de la vue, au centime près. La mise est verrouillée pendant la manche et redevient modifiable après son règlement.

La mise commence à 10 FCFA, avec les raccourcis 100, 200, 500 et 1 000. Un clic sur le montant ouvre tous les montants possibles (de 10 à 1 000). Par exemple, une mise de 100 FCFA à ×2,35 permet de représenter un encaissement de 235,00 FCFA. Un gain encaissé reste affiché même si l'on prépare une autre mise.

La vue « Mise en attente » montre l'annulation possible avant le départ. La vue « Crash · mise perdue » montre la perte de la mise. Ces vues se choisissent dans l'atelier : en dehors du jeu automatique, le prototype ne simule ni compte à rebours, ni hasard, ni manches en temps réel. Le clic sur « Miser » passe directement à la vue de manche en cours ; le clic sur « Encaisser » passe à la vue de gain encaissé.

En portrait, la rangée du haut garde quatre boutons de la même forme, comme les autres jeux : **☰**, **SON** (même bascule que dans le menu ≡), **AUTO** et **HISTORIQUE**, qui ouvre la liste des 7 dernières manches. Une manche par ligne, de la plus récente à la plus ancienne, avec son rang écrit à gauche (« Dernière », « Avant-dernière », « 3ᵉ avant »…) et son multiplicateur à droite, aux couleurs des pastilles au-dessus de la courbe ; la dernière manche est mise en avant. La liste garde les mêmes proportions dans tous les formats, avec un plancher de taille pour rester lisible sur les petits écrans. Sur ordinateur, tablette et en paysage, **HISTORIQUE** est posé au-dessus d'**AUTO** dans la pile d'options, du même rectangle arrondi et de la même largeur ; la liste s'ouvre au-dessus de la pile, alignée sur son bord droit.

Le bouton « Auto » ouvre la fenêtre **Jeu automatique** (`../src/lib/CrashAutoModal.svelte`), aux couleurs et avec les contrôles du panneau d'**avia-djo** :

- **Nombre de tours** : 5, 10, 25, 50, 100 ou ∞ ;
- **Encaissement auto** : case et cible [−] 2,00× [+] (pas de 0,10, de 1,01× à 100×), comme « Encaiss. auto » d'avia-djo ;
- **Avancé**, façon trading : **objectif de gain** (take profit) et **limite de perte** (stop loss), chacun avec sa case et son montant en FCFA ; la série s'arrête dès que le bilan de la série atteint l'un des deux ;
- un récapitulatif (mise par tour, somme engagée au plus) et **ACTIVER**, qui ferme la fenêtre et lance la série.

Pendant la série, AUTO est allumé en or et la mise est verrouillée. Les manches sont simulées : la courbe monte, la manche est encaissée à la cible si elle l'atteint avant le crash, sinon la mise est perdue. Les points de crash suivent une liste fixe pour que la démonstration soit reproductible. Pendant une manche, JOUER reste ENCAISSER (encaissement manuel possible) ; entre deux manches, il devient « Arrêter » avec les tours restants. Pendant la manche, en portrait, le ☰ descend dans la barre à côté d'ENCAISSER, à la même hauteur, plutôt que de rester seul au-dessus. Entre deux manches, AUTO ou « Arrêter » met fin à la série. Le message sous le multiplicateur suit la série (tour, bilan, cible), puis indique pourquoi elle s'est arrêtée : tours épuisés, objectif de gain, limite de perte ou arrêt manuel. Le solde et l'historique des manches suivent les résultats de la série.

Le son est illustratif. Les montants et les résultats sont fictifs : aucun compte, aucune connexion au serveur de jeux, aucun paiement.

## Ressemblance avec le Web SDK

Les versions principales sont alignées sur le projet existant : Svelte 5.20.5, SvelteKit 2.17.3, Vite 6.2.0 et PixiJS 8.8.1. Storybook 9.0.15 est disponible comme dans l'outillage du SDK.

La structure reprend les dossiers `src/routes`, `src/game`, `src/components`, `src/stories` et `static/assets`, ainsi que `game.config.ts`.

L'atelier est autonome. Il ne dépend pas de l'installation du monorepo ni d'une session de jeu. Il utilise npm, disponible sur cette machine, et son propre `package-lock.json`. Le SDK utilise pnpm. Les bibliothèques internes du SDK ne sont pas copiées ou importées ici pour le moment : l'intégration des véritables composants pourra suivre la validation visuelle.

Les quatre noms de formats, la détection du format et les dimensions standard de référence viennent de `packages/utils-layout/src/createLayout.svelte.ts` dans le SDK.

## Où travailler ensuite ?

```text
crash/
├── .storybook/                 Réglages de Storybook
├── scripts/verify-preview.mjs   Vérification de l'aperçu dans un navigateur
├── src/
│   ├── components/
│   │   ├── CrashCanvas.svelte   Grille et courbe PixiJS
│   │   ├── CrashHud.svelte      Branchement du dock commun et fenêtres Mise / Auto
│   │   └── Sheet.svelte         Fenêtre commune (mise, auto, menu)
│   ├── game/
│   │   ├── Game.svelte          Barre du haut, zone du jeu, menu et couleurs de l'écran
│   │   ├── format.ts            Affichage des montants en français
│   │   ├── layouts.ts           Formats et tailles des écrans
│   │   └── scenarios.ts         Les cinq moments de la partie
│   ├── routes/
│   │   ├── +page.svelte         Atelier avec les boutons de prévisualisation
│   │   └── scene/+page.svelte   Maquette seule
│   ├── stories/                Exemples à ouvrir dans Storybook
│   ├── game.config.ts          Montants fictifs de présentation
│   └── styles.css              Apparence commune
└── static/assets/              Futures images et icônes
```

Pour modifier l'apparence, regarder `src/components/CrashHud.svelte` pour les commandes et `src/game/Game.svelte` pour la barre du haut et la zone du jeu. Les couleurs communes (fond, cartes, violet, vert, rouge) sont réunies au début du style de `Game.svelte`, sous `.game`. Les fichiers du Web SDK restent des références en lecture.

## Storybook

Storybook est un catalogue pour regarder les écrans et leurs variantes séparément.

```powershell
npm run storybook
```

Ouvrir **http://localhost:6050**. Les exemples se trouvent sous « Maquettes / Crash ». Chaque exemple de format ouvre les dimensions correspondantes. La barre de Storybook permet aussi de choisir le format pour les autres exemples.

## Vérifications

```powershell
npm run check
npm run build
npm run build-storybook
npm run test:browser
```

Si Chromium manque pour la vérification automatique : `npx playwright install chromium`.

`npm run test:browser` démarre puis arrête son propre serveur et vérifie les quatre formats, le rendu PixiJS, les changements de scénario et l'absence de débordement. Les captures sont enregistrées dans `reports/`.

Pour vérifier la version construite : `npm run test:browser -- --preview` après `npm run build`.

Pour regarder manuellement la version construite : `npm run preview`, puis **http://localhost:4050**.

## Références techniques

- [Structure d'un projet SvelteKit](https://svelte.dev/docs/kit/project-structure)
- [Application PixiJS 8](https://pixijs.com/8.x/guides/components/application)
- [Storybook pour SvelteKit](https://storybook.js.org/docs/get-started/frameworks/sveltekit)
