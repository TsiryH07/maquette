# Maquette des jeux instantanés

Cette maquette reprend le design actuel du Crash et l'adapte à un exemple de **dés à résultat immédiat** : solde en haut, objectif et dé au centre, puis gain, jeu automatique, mise et grand bouton vert.

## Ouvrir l'atelier

Depuis `D:\Tsiry\baobab\maquette\instantanees` :

```powershell
npm install
npm run dev
```

Ouvrir **http://localhost:3051**. Pour fermer le serveur : `Ctrl + C`.

## Ce que l'on peut faire

1. Choisir un risque : **Prudent** (2 ou plus), **Équilibré** (4 ou plus), **Audacieux** (un 6).
2. Régler la mise avec `−`, `+`, les montants rapides ou la fenêtre de choix.
3. Appuyer sur **Jouer**. Le lancer dure brièvement, puis le résultat s'affiche.
4. Utiliser **Rejouer** pour regarder le résultat suivant.

Les commandes sont bloquées pendant le lancer. Après le résultat, les nouvelles mises n'altèrent pas le gain déjà affiché. Les centimes sont conservés.

Les cartes et les animations du panneau reprennent celles du Crash : le chiffre de la mise arrive en glissant, la pastille violette suit le montant rapide choisi et le bouton principal possède le même reflet et les mêmes transitions. L'attente du lancer utilise la même barre animée. Les réglages « mouvement réduit » du navigateur sont respectés. Le test navigateur enregistre un aperçu dans `reports/animations.webm`.

Les démonstrations alternent volontairement un résultat gagnant puis un résultat sans gain. Il n'y a aucun hasard réel, compte, serveur de jeu ou paiement. Le solde reste fictif. Les objectifs et facteurs servent à présenter les états visuels ; ils ne constituent pas une configuration mathématique de production. Le jeu automatique est une option illustrative et ne lance aucune boucle.

## Les écrans

L'atelier propose ordinateur (1440×900), tablette (900×900), mobile portrait (390×844) et mobile paysage (844×390). Chaque aperçu possède réellement ces dimensions. Le lien « Ouvrir l'écran seul » permet de voir la maquette à la taille de la fenêtre.

La liste « Moment de la partie » propose : prêt à jouer, lancer en cours, résultat gagnant et résultat sans gain.

## Storybook et vérifications

```powershell
npm run storybook
npm run check
npm run build
npm run build-storybook
npm run test:browser
```

Storybook est disponible à **http://localhost:6051** sous « Maquettes / Instantanés ». La version construite se regarde avec `npm run preview` à **http://localhost:4051**.

Si Chromium manque : `npx playwright install chromium`. Le test navigateur démarre son serveur sur 3081 (ou 4081 avec `--preview`), vérifie les quatre écrans et les interactions, puis s'arrête. Les captures sont enregistrées dans `reports/`.

## Fichiers principaux

- `src/game/Game.svelte` : assemblage, solde, paramètres et parcours de démonstration.
- `src/components/DiceStage.svelte` : dé, objectif et choix du risque, dessinés en HTML/CSS.
- `../src/lib/DifficultySelector.svelte` : sélecteur de difficulté commun avec Révélation, à trois niveaux, verrouillé pendant le lancer.
- `src/components/InstantHud.svelte` : gain, mise, jouer et options automatiques.
- `src/components/Sheet.svelte` : fenêtres, dont le panneau du bas sur mobile.
- `src/game/scenarios.ts` : vues et exemples des risques.
- `src/game.config.ts` : solde et mises fictifs.
- `src/stories/Instant.stories.ts` : exemples Storybook.

L'environnement conserve les versions du SDK : Svelte 5, SvelteKit 2, TypeScript, Vite 6, PixiJS 8 disponible pour les futurs rendus et Storybook 9. Aucun fichier du Crash ou du SDK n'est modifié.
