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

- **La barre du haut** montre le nom du jeu, le solde fictif (1 000,00 FCFA) et le bouton du menu (son et règles).
- **La zone du jeu** montre les multiplicateurs des dernières manches, l'étape de la partie (« Mises ouvertes », « En cours », « Encaissé », « Crash »), le grand multiplicateur et la courbe dessinée avec PixiJS. Les couleurs suivent l'étape : violet en vol, vert après un encaissement, rouge au crash.
- **Le panneau** regroupe quatre blocs : le montant de la manche, la mise, « Auto » et le bouton principal.

Le bouton principal est large et affiche toujours le montant concerné. Il est vert pour « Miser », ambre pour « Encaisser » pendant la manche et rouge pour « Annuler » une mise en attente. Le bloc de la manche affiche « Gain potentiel » pendant la manche, « Encaissé » après un encaissement et « Mise perdue » après un crash. Sur ordinateur, les blocs sont alignés sur une ligne ; sur tablette et sur mobile, le bouton principal passe en bas, sur toute la largeur, pour être facile à toucher.

Le parcours visuel est le suivant : choisir une mise, cliquer sur « Miser », puis « Encaisser ». Le montant affiché correspond à la mise multipliée par le multiplicateur de la vue, au centime près. La mise est verrouillée pendant la manche et redevient modifiable après son règlement.

La mise commence à 10 FCFA, avec les raccourcis 100, 200, 500 et 1 000. Un clic sur le montant ouvre tous les montants possibles (de 10 à 1 000). Par exemple, une mise de 100 FCFA à ×2,35 permet de représenter un encaissement de 235,00 FCFA. Un gain encaissé reste affiché même si l'on prépare une autre mise.

La vue « Mise en attente » montre l'annulation possible avant le départ. La vue « Crash · mise perdue » montre la perte de la mise. Ces vues se choisissent dans l'atelier : le prototype ne simule ni compte à rebours, ni hasard, ni manches en temps réel. Le clic sur « Miser » passe directement à la vue de manche en cours ; le clic sur « Encaisser » passe à la vue de gain encaissé.

Le bouton « Auto » ouvre le pari automatique et l'encaissement automatique à un multiplicateur choisi ; il résume ensuite le réglage actif (par exemple « Encaisse à ×2,00 »). Sur mobile portrait, les fenêtres s'ouvrent depuis le bas de l'écran. Les automatismes et le son sont illustratifs. Les montants et les résultats sont fictifs : aucun compte, aucune connexion au serveur de jeux, aucun paiement. Le solde de présentation ne change pas.

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
│   │   ├── CrashHud.svelte      Panneau de commandes et fenêtres Mise / Auto
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
