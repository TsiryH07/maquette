# Un seul atelier pour les quatre maquettes

Crash, Instantanés, Révélation et Slots sont réunis dans **un même projet**, avec **une seule adresse** et **une seule commande de démarrage**.

Ouvrir un terminal dans `D:\Tsiry\baobab\maquette`, puis lancer :

```powershell
npm install
npm run dev
```

Ouvrir **http://localhost:3040**. L'installation est déjà faite sur cette machine ; les prochaines fois, `npm run dev` suffit.

1. Cliquer sur **Crash**, **Instantanés**, **Révélation** ou **Slots** pour changer de maquette.
2. Choisir **Ordinateur**, **Tablette**, **Mobile portrait** ou **Mobile paysage**.
3. Choisir un **moment de la partie** pour regarder un état précis.
4. Essayer les boutons directement dans l'aperçu.
5. Utiliser **Réinitialiser** pour recommencer ou **Ouvrir l'écran seul** pour une vue sans les commandes de l'atelier.

Garder le terminal ouvert. Pour arrêter, appuyer sur **Ctrl + C**. Un seul serveur suffit pour les quatre familles. Les choix sont conservés dans l'adresse : copier le lien permet de retrouver la famille, le format et le scénario sélectionnés. Les flèches Précédent et Suivant du navigateur fonctionnent aussi. Changer de famille démarre un nouvel aperçu.

Les sources restent dans `crash/src`, `instantanees/src`, `revelation/src` et `slots/src`. L'atelier les utilise directement : les modifications des maquettes apparaissent au même endroit. Aucun code n'a été déplacé dans le Web SDK.

| Famille | Guide détaillé | Écran seul |
| --- | --- | --- |
| Crash | [Guide Crash](crash/README.md) | http://localhost:3040/scene/crash |
| Instantanés | [Guide Instantanés](instantanees/README.md) | http://localhost:3040/scene/instantanees |
| Révélation | [Guide Révélation](revelation/README.md) | http://localhost:3040/scene/revelation |
| Slots | [Guide Slots](slots/README.md) | http://localhost:3040/scene/slots |

Pour vérifier l'atelier : `npm run check`, `npm run test:browser`, puis `npm run build`. Pour vérifier l'export compilé : `npm run test:browser -- --preview`. L'export se trouve dans `build` et se regarde avec `npm run preview` à l'adresse http://localhost:4040.

Le **Storybook commun** regroupe les quatre familles : `npm run storybook`, puis http://localhost:6040. `npm run build-storybook` construit son catalogue.

Les anciennes commandes `dev:crash`, `dev:instantanees`, `dev:revelation`, `dev:slots` et `storybook:*` restent disponibles pour travailler sur un ancien atelier séparément. Elles utilisent les dépendances du sous-dossier concerné et ne sont pas nécessaires à l'atelier commun.

Ce sont des **maquettes locales avec des montants fictifs**. Les résultats servent à présenter les écrans ; aucun paiement ni serveur de jeu n'est utilisé. Le Web SDK de production reste une référence en lecture.

Pour reconnaître chaque famille :

- **Crash** : suivre le multiplicateur et encaisser avant le crash.
- **Instantanés** : choisir sa mise et ses options, lancer les dés, puis regarder le résultat.
- **Révélation** : commencer une manche, découvrir des cases et choisir quand encaisser.
- **Slots** : choisir sa mise, lancer les rouleaux, regarder les gains et essayer les modes turbo ou automatique.

# Mon guide pour dessiner les interfaces des jeux

## 1. Ce que je dois faire

Je dois dessiner à quoi les commandes des jeux devraient ressembler sur plusieurs écrans.

Une **maquette**, c'est un dessin du futur écran. Imagine le plan d'une maison avant sa construction : ici, on place les boutons et les textes avant de fabriquer l'interface.

Je n'ai pas besoin de savoir coder. Pour cette première étape, les boutons du dessin n'ont pas besoin de fonctionner.

Mon travail : **4 familles de jeux × 4 formats d'écran = 16 dessins principaux**.

Le dossier `maquette` contient mon travail de préparation. Je n'ai rien à changer dans le code des jeux, ni dans le fichier `tsconfig.json` ouvert dans mon éditeur.

## 2. Les quatre familles de jeux

Une famille regroupe des jeux qui se jouent de façon ressemblante.

| Famille | Pour comprendre | Exemple à regarder |
| --- | --- | --- |
| Slots | On lance les rouleaux et on regarde les symboles obtenus. | Au Chantier |
| Crash | Un multiplicateur monte. Le joueur peut encaisser avant l'arrêt. | Avia Djo |
| Révélation | On découvre des éléments petit à petit et on peut encaisser selon le jeu. | Africa Tower |
| Instantanés | On choisit ses options, on lance une partie et on obtient un résultat. | Plinko |

Ces jeux sont des exemples pour commencer. Je prépare une proposition par famille, sans redessiner tous les jeux du catalogue.

## 3. Les quatre formats d'écran

Je dois prévoir où vont les commandes quand la forme de l'écran change.

| Format | À quoi cela ressemble |
| --- | --- |
| Ordinateur | Un grand rectangle horizontal. |
| Tablette | Un écran plus proche d'un carré. |
| Mobile portrait | Un téléphone tenu debout. |
| Mobile paysage | Un téléphone tourné sur le côté. |

Sur un téléphone, je peux déplacer les commandes ou les mettre sur plusieurs lignes. Je ne dois pas simplement tout réduire jusqu'à ce que les textes deviennent minuscules.

## 4. Ce que je dessine sur chaque écran

Le **HUD**, c'est le nom donné aux commandes et aux informations autour du jeu : les boutons, le solde, la mise et le menu.

Pour commencer, je dessine :

- Une grande zone appelée « Zone du jeu ». Elle réserve la place des rouleaux, de la grille ou de l'animation. Je n'ai pas besoin de refaire les illustrations du jeu.
- Le solde : l'argent disponible, par exemple « Solde : 1 000 FC ».
- La mise : le montant choisi pour une partie, par exemple « Mise : 100 FC ».
- Les commandes pour changer la mise, comme `−` et `+`.
- Le bouton principal : lancer, jouer ou miser selon la famille.
- Le bouton du menu et l'accès au son, aux réglages et aux règles.
- Les commandes particulières de la famille, décrites ci-dessous.

Les montants sont des exemples pour le dessin. Je garde la même monnaie sur mes maquettes.

### Pour les slots

Je prévois la place du solde, de la mise, des gains, du bouton pour lancer, du turbo, du jeu automatique et de l'achat de bonus. Je montre aussi où apparaît le compteur de tours gratuits quand il est utilisé.

### Pour le crash

Je prévois la place du multiplicateur, du solde, de la mise, des boutons de montants rapides et du pari automatique. Le bouton principal peut afficher « Miser », « Annuler » ou « Encaisser » selon le moment de la partie.

Avia Djo possède aussi un réglage de retrait automatique : je le prends en compte si je pars de cet exemple.

### Pour la révélation

Je prévois la place du solde, de la mise, du multiplicateur et des commandes pour commencer, révéler ou encaisser, selon le jeu. Je réserve aussi la place du choix de difficulté lorsqu'il existe.

### Pour les jeux instantanés

Je prévois la place du solde, de la mise, du bouton « Jouer » et des options du jeu. Pour Plinko, je regarde notamment le choix de difficulté. Je représente le jeu automatique si l'exemple choisi le propose.

Toutes ces commandes ne sont pas forcément visibles au même moment. Par exemple, « Miser » peut être remplacé par « Encaisser ». Je dessine des variantes pour expliquer ce changement.

## 5. Comment commencer, concrètement

### Étape 1 — Regarder les exemples

J'ouvre un jeu de chaque famille, si j'ai accès à ses écrans. Sinon, je demande à la personne qui m'a confié le travail les liens ou des captures des quatre jeux.

Je peux garder ces images dans un sous-dossier `references` de `maquette`.

Une capture sert à comprendre l'existant. Ma maquette montre la présentation que je propose.

### Étape 2 — Choisir mon outil de dessin

J'utilise un outil de dessin que je connais, ou du papier pour le premier brouillon. Je dois pouvoir dessiner des rectangles, écrire du texte et déplacer des éléments.

Si mon outil utilise le mot « cadre » ou « plan de travail », cela veut simplement dire : une page qui représente un écran.

### Étape 3 — Faire un seul premier dessin

Je commence par **Slots — Ordinateur**.

1. Je dessine le grand rectangle de l'écran.
2. Je place la zone du jeu.
3. Je place le solde et la mise.
4. Je place le bouton pour lancer et les autres commandes.
5. Je place le menu.
6. Je vérifie que je comprends tout sans explication.

Au début, des rectangles gris et des textes suffisent. Ensuite, je choisis les couleurs, la forme des boutons et les icônes pour montrer l'apparence souhaitée.

### Étape 4 — Adapter cette famille aux trois autres écrans

Je prépare les versions tablette, mobile portrait et mobile paysage.

Je déplace les commandes pour qu'elles restent lisibles et faciles à toucher. Je garde les mêmes symboles, les mêmes couleurs et les mêmes mots pour les mêmes actions.

### Étape 5 — Passer aux autres familles

Je répète le travail pour le crash, la révélation et les jeux instantanés. Je réutilise l'apparence des commandes communes, puis j'ajoute les commandes propres à chaque famille.

## 6. Ma liste des 16 dessins

Je donne ces noms aux pages de mon outil ou aux images exportées.

| Famille | Ordinateur | Tablette | Mobile portrait | Mobile paysage |
| --- | --- | --- | --- | --- |
| Slots | slots-ordinateur | slots-tablette | slots-mobile-portrait | slots-mobile-paysage |
| Crash | crash-ordinateur | crash-tablette | crash-mobile-portrait | crash-mobile-paysage |
| Révélation | revelation-ordinateur | revelation-tablette | revelation-mobile-portrait | revelation-mobile-paysage |
| Instantanés | instant-ordinateur | instant-tablette | instant-mobile-portrait | instant-mobile-paysage |

- [ ] Les 4 dessins des slots sont prêts.
- [ ] Les 4 dessins du crash sont prêts.
- [ ] Les 4 dessins de révélation sont prêts.
- [ ] Les 4 dessins des jeux instantanés sont prêts.

## 7. Les petits dessins supplémentaires

Un seul dessin ne montre pas ce qui se passe quand on ouvre un menu. J'ajoute donc les variantes utiles :

- Le menu ouvert, avec son, réglages, règles et fermeture.
- Le choix de difficulté ouvert, pour les jeux concernés.
- Un bouton désactivé, pour montrer qu'on ne peut pas l'utiliser.
- Le bouton principal pendant la partie, par exemple « Encaisser » pour le crash.

Je peux copier une maquette et changer seulement la partie concernée. Je n'ai pas besoin d'ajouter toutes ces variantes aux 16 écrans dès le premier brouillon.

## 8. Comment savoir si mon dessin est clair

- [ ] Je vois tout de suite le bouton principal.
- [ ] Je distingue facilement le solde et la mise.
- [ ] Les textes restent lisibles sur le téléphone.
- [ ] Les boutons sont assez grands et espacés pour être touchés avec un doigt.
- [ ] Rien ne se chevauche et aucune commande ne sort de l'écran.
- [ ] La zone du jeu garde assez de place.
- [ ] Le menu et les listes peuvent s'ouvrir sans cacher les commandes nécessaires.
- [ ] Les commandes communes se ressemblent d'une famille à l'autre.
- [ ] Les commandes particulières de chaque famille sont présentes.

## 9. Ce que je donne à la personne qui m'a confié le travail

Je prépare les 16 vues principales, les variantes utiles et un lien vers le dessin modifiable si mon outil le permet. Je peux aussi exporter des images dans un sous-dossier `exports` de `maquette`.

J'ajoute quelques phrases simples, par exemple :

> Sur mobile portrait, j'ai mis les commandes sur deux lignes pour garder de grands boutons. Le bouton principal reste facile à trouver. Le menu contient les options utilisées moins souvent.

Je fais valider les maquettes avant de commencer leur intégration dans le code.

## 10. Où sont les références dans le projet ?

Cette partie sert à retrouver les éléments avec une personne qui sait lire le code. Je n'ai pas besoin de comprendre ces fichiers pour dessiner.

| Ce que je cherche | Fichier de référence |
| --- | --- |
| Les commandes communes des slots | [UIDefault.svelte](../poulet_baobab/web-sdk/packages/contexts/slot/pixi-ui/src/components/UIDefault.svelte) |
| Les composants de la famille crash | [crash/pixi-ui](../poulet_baobab/web-sdk/packages/contexts/crash/pixi-ui/index.ts) |
| Les composants de la famille révélation | [reveal/pixi-ui](../poulet_baobab/web-sdk/packages/contexts/reveal/pixi-ui/index.ts) |
| Les composants des jeux instantanés | [instant/pixi-ui](../poulet_baobab/web-sdk/packages/contexts/instant/pixi-ui/index.ts) |
| Les boutons et informations communs aux familles | [ui-pixi-shared](../poulet_baobab/web-sdk/packages/shared/components-ui-pixi-shared/index.ts) |
| Les fenêtres de règles, mise et réglages | [Modals.svelte](../poulet_baobab/web-sdk/packages/components-ui-html/src/components/Modals.svelte) |
| Le panneau particulier d'Avia Djo | [CrashBetPanelLocal.svelte](../poulet_baobab/web-sdk/apps/avia-djo/src/game/CrashBetPanelLocal.svelte) |
| Le bouton principal de Plinko | [ButtonPrimary.svelte](../poulet_baobab/web-sdk/apps/plinko/src/game/ButtonPrimary.svelte) |
| Le choix de difficulté de Plinko | [SelectorDifficulte.svelte](../poulet_baobab/web-sdk/apps/plinko/src/game/SelectorDifficulte.svelte) |
| Le choix de difficulté d'Africa Tower | [DifficultyDropdown.svelte](../poulet_baobab/web-sdk/apps/africa-tower/src/game/DifficultyDropdown.svelte) |

Les fichiers `components-pixi`, `components-layout`, `ui-shell` et `ui-tokens` aident à construire et placer l'interface. Mon dessin doit montrer l'écran complet que verra le joueur.
