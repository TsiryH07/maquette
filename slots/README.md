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

- Changer la mise avec `−`, `+` ou les montants rapides.
- Lancer les cinq rouleaux. La mise se verrouille pendant le mouvement.
- Voir une ligne gagnante et son montant ; ce montant reste affiché si l'on prépare une autre mise.
- Ouvrir la carte **Mode de jeu** : les onglets **Manuel**, **Auto** et **Gratuits** restent dans une seule fenêtre. Le texte **Mode actuel** indique ce qui est réellement actif. Consulter un onglet ne lance rien.
- Dans **Manuel**, retrouver le principe « un appui = un tour », puis revenir au jeu. Pendant l'auto, **Revenir au mode manuel** arrête les prochains tours ; le tour en cours se termine.
- Dans **Auto**, choisir 3, 5 ou 10 tours, vérifier le total des mises et appuyer sur **Lancer**. Le bouton principal **Arrêter l’auto** permet d'interrompre la série. Le menu s'ouvre toujours pendant la série et permet aussi de l'arrêter.
- Dans **Gratuits**, appuyer sur **Commencer les 5 tours**. Chaque tour se lance avec **Tour gratuit**, sans nouvelle mise ; le compteur diminue et la mise reste verrouillée. Le bouton **Continuer les tours gratuits** referme simplement le menu si le bonus est déjà actif.
- L'interrupteur **Turbo**, présent une seule fois sous les onglets, s'applique aux trois modes. Il est verrouillé pendant un lancer ou une série automatique.
- Ouvrir les paramètres pour les règles et la table de démonstration.

La séquence est **fixe et illustrative** : un gain à ×2,50, un tour sans gain, puis un gain à ×1,20. Le tableau des symboles sert de maquette ; il ne définit pas les probabilités ou les règles d'un vrai jeu. Aucun hasard, aucun compte et aucun paiement. Le solde de présentation reste fixe. L'auto est borné et n'accepte pas une mise supérieure au solde fictif.

Le panneau reprend les dimensions et les animations du Crash : changement de mise animé, reflet au survol et indicateur d'attente pendant le mouvement des rouleaux. La nouvelle fenêtre de modes possède une sélection glissante, une transition douce entre ses panneaux et une couleur par mode : menthe, violet et or. Les onglets se parcourent aussi avec les flèches du clavier, Début et Fin. Les réglages « mouvement réduit » sont respectés.

Les cinq scénarios de l'atelier sont : prêt à jouer, rouleaux en mouvement, tour gagnant, tour sans gain et tours gratuits.

## Fichiers utiles

- `src/game/Game.svelte` : assemblage, états et parcours de démonstration.
- `src/components/SlotBoard.svelte` : cinq rouleaux de trois symboles.
- `src/components/SlotSymbol.svelte` : symboles SVG.
- `src/components/SlotsHud.svelte` : mise, gain, turbo, auto, bonus et lancer.
- `src/components/GameModes.svelte` : fenêtre commune des trois modes, choix des tours et vitesse.
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
