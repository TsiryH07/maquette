# Maquette Révélation

Cet atelier reprend le design actuel du Crash : fond violet sombre, solde et paramètres en haut, grande zone de jeu, cartes de commande et action principale verte. Il présente une famille différente : on révèle des cases, puis on choisit d'encaisser.

## Ouvrir

Depuis `D:\Tsiry\baobab` :

```powershell
cd maquette/revelation
npm run dev
```

Ouvrir **http://localhost:3052**. Si nécessaire, installer d'abord avec `npm install`. Arrêter avec **Ctrl + C**.

## Essayer la maquette

1. Choisir une mise avec `−`, `+` ou un montant rapide.
2. Choisir la difficulté : Calme (1 piège), Normal (3 pièges) ou Expert (5 pièges).
3. Appuyer sur **Commencer**.
4. Choisir une case. Un trésor augmente le gain ; un piège termine la manche.
5. Après un trésor, appuyer sur **Encaisser** pour conserver le résultat affiché.

La mise et la difficulté sont bloquées pendant la partie. Le gain encaissé reste identique si l'on prépare ensuite une autre mise.

Les cartes et les animations du panneau reprennent celles du Crash : chiffre de mise animé, sélection violette glissante, reflet sur le bouton et transitions de son contenu. Le bouton Encaisser reprend aussi la teinte et la pulsation du Crash. Les réglages « mouvement réduit » du navigateur sont respectés. Le test navigateur enregistre un aperçu dans `reports/animations.webm`.

La grille est fixe pour présenter le parcours. La case 4 contient un piège dans les trois niveaux ; les cases 1 et 2 sont des trésors. Les multiplicateurs sont des valeurs de présentation, sans calcul de probabilités de production. Il n'y a ni hasard, ni paiement, ni compte réel. Le solde reste fictif. Aucun appel au serveur de jeux.

## Quatre écrans et variantes

L'atelier propose ordinateur, tablette, mobile portrait et mobile paysage. La liste « Moment de la partie » permet de regarder avant la partie, une révélation en cours, un gain encaissé ou un piège découvert. Le lien « Ouvrir l'écran seul » adapte la maquette à la fenêtre du navigateur.

Storybook : `npm run storybook`, puis **http://localhost:6052**. Les vues sont dans **Maquettes / Révélation**.

## Fichiers utiles

- `src/game/Game.svelte` : grille, déroulement de la démonstration et disposition des écrans.
- `src/components/RevealHud.svelte` : gain, difficulté, mise et action principale.
- `src/game.config.ts` : montants, pièges et multiplicateurs fictifs.
- `src/game/scenarios.ts` : vues à sélectionner dans l'atelier.
- `src/components/Sheet.svelte` : fenêtres de choix et de paramètres.

Même environnement local que Crash : Svelte 5, SvelteKit, TypeScript, Vite et Storybook. Les images des cases sont des icônes SVG, avec des boutons accessibles au clavier. Aucun fichier du SDK ni du Crash n'est modifié.

## Vérifier

```powershell
npm run check
npm run build
npm run build-storybook
npm run test:browser
```

Le test démarre puis arrête son propre serveur sur le port 3082. Il vérifie les quatre formats, le choix de difficulté, les révélations, les pièges, l'encaissement et la conservation du gain. Les captures sont dans `reports/`. Si Chromium manque : `npx playwright install chromium`.

Pour vérifier la version construite : `npm run test:browser -- --preview`. Pour l'ouvrir manuellement : `npm run preview`, puis **http://localhost:4052**.
