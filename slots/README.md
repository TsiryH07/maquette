# Maquette Slots

Cette famille reprend le design du Crash : fond violet sombre, solde et paramètres en haut, commandes regroupées, grand bouton vert et fenêtres adaptées au téléphone. Les rouleaux, le gain, le turbo, les tours automatiques et le bonus sont propres aux slots.

## Ouvrir

Depuis `D:\Tsiry\baobab\maquette\slots`, lancer :

```powershell
npm install
npm run dev
```

Ouvrir **http://localhost:3053**. Choisir ordinateur, tablette, mobile portrait ou mobile paysage dans l'atelier. Le lien « Ouvrir l'écran seul » montre la maquette sans les commandes de l'atelier.

## Ce que l'on peut essayer

- Changer la mise avec `−`, `+` ou en touchant le montant.
- Lancer les cinq rouleaux. La mise se verrouille pendant le mouvement.
- Voir une ligne gagnante et son montant ; ce montant reste affiché si l'on prépare une autre mise.
- Le bouton **AUTO** ouvre la fenêtre **TOURS AUTO** du web-sdk (`../src/lib/AutoSpinModal.svelte`, reprise de `ModalAutoSpin`) : **NOMBRE DE TOURS** (10, 25, 50, 75, 100, 250, 500, 1000 ou ∞ ; pas de 1000 en paysage), le menu **AVANCÉ ▼** des slots avec **LIMITE DE PERTE** et **LIMITE DE GAIN UNIQUE** (5× à 100× la mise, ou ∞), puis **LANCER L'AUTO-SPIN**. La série s'arrête d'elle-même quand la perte cumulée atteint la limite ou qu'un gain atteint la limite de gain unique.
- Pendant la série, **JOUER** devient **Arrêter** avec les tours restants, et un appui sur **AUTO** arrête aussi la série (comme le bouton AUTO du web-sdk) ; le tour en cours se termine.
- Les tours gratuits de démonstration se voient avec « Moment de la partie : Tours gratuits » dans l'atelier ; chaque tour se lance avec **Jouer**, sans nouvelle mise.
- En portrait, la rangée du haut garde quatre boutons : ☰, **SON** (même bascule que dans le menu ≡), AUTO et TURBO.
- **Turbo** est le bouton TURBO du dock : à côté d'AUTO dans tous les formats (en portrait, AUTO et TURBO côte à côte au-dessus de la MISE, AUTO creusé autour de JOUER). Il s'applique aux trois modes et se verrouille pendant un lancer ou une série automatique. Le réglage n'est plus dupliqué dans la fenêtre Auto.
- Il n'y a plus de bouton **Achat de bonus** sur le décor.
- Pendant une série automatique, le bouton **AUTO** s'allume en or, comme **TURBO** quand il est activé.
- Ouvrir les paramètres pour les règles et la table de démonstration.

La séquence est **fixe et illustrative** : un gain à ×2,50, un tour sans gain, puis un gain à ×1,20. Le tableau des symboles sert de maquette ; il ne définit pas les probabilités ou les règles d'un vrai jeu. Aucun hasard, aucun compte et aucun paiement. Le solde de présentation reste fixe. L'auto est borné et n'accepte pas une mise supérieure au solde fictif.

Les commandes sont celles du dock commun aux quatre jeux : changement de mise animé et bouton JOUER qui pulse pendant le mouvement des rouleaux. La nouvelle fenêtre de modes possède une sélection glissante, une transition douce entre ses panneaux et une couleur par mode : menthe, violet et or. Les onglets se parcourent aussi avec les flèches du clavier, Début et Fin. Les réglages « mouvement réduit » sont respectés.

Les cinq scénarios de l'atelier sont : prêt à jouer, rouleaux en mouvement, tour gagnant, tour sans gain et tours gratuits.

## Fichiers utiles

- `src/game/Game.svelte` : assemblage, états et parcours de démonstration.
- `src/components/SlotBoard.svelte` : cinq rouleaux de trois symboles.
- `src/components/SlotSymbol.svelte` : symboles SVG.
- `src/components/SlotsHud.svelte` : branchement du dock commun (mise, auto, turbo, lancer).
- `src/game.config.ts` : montants fictifs.
- `src/game/scenarios.ts` : variantes de présentation.
- `src/stories/Slots.stories.ts` : catalogue Storybook.

Les bibliothèques internes du Web SDK sont des références en lecture ; cet atelier est autonome et ne modifie aucun jeu.

## Vérifier et construire

```powershell
npm run check
npm run build
npm run build-storybook
npm run test:browser
```

Les captures sont enregistrées dans `reports/`. Le test ouvre et ferme son propre serveur au port 3083 (4083 avec `--preview`). Chromium peut être installé si nécessaire avec `npx playwright install chromium`.

Storybook : `npm run storybook`, puis **http://localhost:6053**. Aperçu construit : `npm run preview`, puis **http://localhost:4053**.
