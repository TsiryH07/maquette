import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const preview = process.argv.includes('--preview');
const port = preview ? 4084 : 3084;
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...(preview ? ['preview'] : []), '--host','127.0.0.1','--port',String(port),'--strictPort'], { windowsHide:true, stdio:['ignore','pipe','pipe'] });
let logs = '';
server.stdout.on('data', chunk => logs += chunk);
server.stderr.on('data', chunk => logs += chunk);
let browser;
const families = [['crash','Crash','betting','CRASH'],['instantanees','Instantanés','ready','DÉS'],['revelation','Révélation','ready','RÉVÉLATION'],['slots','Slots','ready','SLOTS']];
const formats = [['desktop','Ordinateur',1440,900],['tablet','Tablette',900,900],['portrait','Mobile portrait',390,844],['landscape','Mobile paysage',844,390]];
async function verifyInstruction(scope, label) {
  assert.equal(await scope.locator('.instruction').count(),1,`${label} : une seule consigne.`);
  const readable = await scope.locator('.instruction').evaluate(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const text = range.getBoundingClientRect(), box = element.getBoundingClientRect();
    const stage = element.closest('.stage,.playfield').getBoundingClientRect();
    const style = getComputedStyle(element);
    return range.getClientRects().length === 1 && text.width > 0 && text.left >= box.left - 1 && text.right <= box.right + 1 &&
      text.top >= stage.top && text.bottom <= stage.bottom && text.left >= 0 && text.right <= innerWidth &&
      style.textOverflow !== 'ellipsis' && element.scrollWidth <= element.clientWidth + 1;
  });
  assert(readable,`${label} : consigne complète sur une ligne, sans coupure.`);
  assert.equal(await scope.locator('.playfield .phase,.stage .phase,.board-title,.risk-heading').count(),0,`${label} : aucun statut, titre ou sous-titre empilé.`);
  // Dock commun, dans tous les formats (disposition de poulet-banane en portrait).
  const clipped = await scope.locator('.dock').evaluate(hud => {
    return [...hud.querySelectorAll('.play-label,.play-detail,.card-value,.hero-label,.hero-amount,.pill-value,.p-tab span')].filter(element => {
      if (!element.getBoundingClientRect().width) return false;
      const range = document.createRange();
      range.selectNodeContents(element);
      const rects = [...range.getClientRects()];
      for (let parent = element; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
        if (style.textOverflow === 'ellipsis') return true;
        if (['hidden','clip','auto','scroll'].includes(style.overflowX) && rects.some(rect => rect.left < box.left - 1 || rect.right > box.right + 1)) return true;
        if (['hidden','clip','auto','scroll'].includes(style.overflowY) && rects.some(rect => rect.top < box.top - 1 || rect.bottom > box.bottom + 1)) return true;
      }
      return false;
    }).map(element => element.textContent);
  });
  assert.deepEqual(clipped,[],`${label} : libellés et descriptions du panneau complets.`);
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error(logs);
    try { ready = (await fetch(url)).ok; } catch {}
    if (ready) break;
    await delay(400);
  }
  assert(ready, logs);
  browser = await chromium.launch({ headless:true, args:['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport:{width:1600,height:1200} });
  const errors = [];
  const failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(url) && response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  await mkdir('reports', { recursive:true });
  await page.goto(url);
  await page.getByRole('heading', {name:'Atelier des maquettes',exact:true}).waitFor();
  const frame = () => page.frameLocator('iframe');
  async function chooseFamily(id, label, initial, brand) {
    await page.getByRole('navigation',{name:'Familles de jeux',exact:true}).getByRole('button',{name:new RegExp(label)}).click();
    await page.waitForURL(location => location.searchParams.get('famille') === id);
    await frame().locator('.brand strong').filter({hasText:new RegExp(`^${brand}$`)}).waitFor();
    await frame().locator(`main[data-scenario="${initial}"]`).waitFor();
  }
  for (const family of families) {
    await chooseFamily(...family);
    for (const [layout,label,width,height] of formats) {
      await page.getByRole('navigation',{name:'Format d’écran'}).getByRole('button',{name:label,exact:true}).click();
      await page.waitForURL(location => location.searchParams.get('format') === layout);
      await frame().locator(`main[data-layout="${layout}"]`).waitFor();
      const size = await frame().locator('body').evaluate(() => [innerWidth,innerHeight,document.documentElement.scrollWidth>innerWidth,document.documentElement.scrollHeight>innerHeight]);
      assert.deepEqual(size,[width,height,false,false]);
      await frame().locator('.master-play-btn').waitFor();
      await verifyInstruction(frame(),`${family[1]} ${layout}`);
      await frame().getByRole('img',{name:'Studio Baobab',exact:true}).waitFor();
      await frame().locator('.studio-logo img').evaluate(img => img.decode());
      const identity = await frame().locator('main').evaluate((main, layout) => {
        const game = main.querySelector('.brand').getBoundingClientRect(), studio = main.querySelector('.studio-logo').getBoundingClientRect();
        const hud = main.querySelector('.dock').getBoundingClientRect(), menu = main.querySelector('.menu-btn').getBoundingClientRect();
        const controls = [...main.querySelectorAll('.dock .stepper-btn,.dock .bet-open,.dock .pill,.dock .mode-btn,.dock .p-tab,.dock .master-play-btn')].map(button => button.getBoundingClientRect());
        const hit = document.elementFromPoint(menu.x + menu.width/2,menu.y + menu.height/2), button = main.querySelector('.menu-btn');
        return {
          corners:game.left >= 0 && game.left < innerWidth/2 && studio.right <= innerWidth && studio.left > innerWidth/2 && game.bottom < innerHeight/3 && studio.bottom < innerHeight/3,
          // Portrait : ☰ rectangulaire en haut à gauche, au-dessus de la barre ; ailleurs, rond ☰ à gauche du dock.
          menuInside:layout === 'portrait'
            ? menu.left >= hud.left && menu.right <= hud.left + 68 && Math.abs(menu.top - hud.top) < 1
            : menu.left >= hud.left && menu.right <= hud.left + 68 && menu.bottom <= hud.bottom && menu.y + menu.height/2 >= hud.y + hud.height/2 - 1,
          // En portrait, les boutons gardent les proportions de l'ordinateur par rapport à JOUER (≈ 42 px de haut sur 390 px) : pas de minimum de 44 px.
          menuAccessible:(layout === 'portrait' || (menu.width >= 44 && menu.height >= 44)) && (hit === button || button.contains(hit)),
          distinct:controls.every(rect => menu.right <= rect.left || rect.right <= menu.left || menu.bottom <= rect.top || rect.bottom <= menu.top),
          headerButtons:main.querySelectorAll('.topbar button').length,
        };
      }, layout);
      assert(identity.corners && identity.menuInside && identity.menuAccessible && identity.distinct && identity.headerButtons === 0, `${family[1]} ${layout} : logos aux deux coins et menu dégagé dans le panneau. ${JSON.stringify(identity)}`);
      assert.equal(await frame().locator('.brand .tag').count(),0,'Aucun badge Démo dans le jeu.');
      assert.equal(await frame().locator('.dock .turbo-btn').count(), family[0] === 'instantanees' || family[0] === 'slots' ? 1 : 0, `${family[1]} ${layout} : bouton TURBO seulement là où une animation peut être accélérée.`);
      if (family[0] === 'instantanees' || family[0] === 'revelation') {
        // La difficulté se choisit dans la liste déroulante du dock, la même pour tous les jeux et tous les formats.
        await frame().getByRole('button',{name:/^Difficulté :/}).click();
        const levels = frame().getByRole('menu',{name:'Choisir la difficulté'}).getByRole('menuitemradio');
        assert.equal(await levels.count(),3,`${family[1]} ${layout} : trois niveaux dans le menu du dock.`);
        assert.equal(await frame().locator('.difficulty-option[aria-checked="true"]').count(),1,`${family[1]} ${layout} : un seul niveau sélectionné.`);
        assert.equal(await frame().locator('.risk-zone').count(),0,`${family[1]} ${layout} : pas de second sélecteur dans la zone de jeu.`);
        await page.keyboard.press('Escape');
      }
      if (family[0] === 'slots') {
        // Bouton TURBO du dock dans tous les formats ; plus de bouton Achat de bonus sur le décor.
        await frame().locator('.dock').getByRole('button',{name:'Turbo',exact:true}).waitFor();
        assert.equal(await frame().getByRole('button',{name:'Achat de bonus',exact:true}).count(),0,`Slots ${layout} : pas de bouton Achat de bonus.`);
      }
      const scene = await frame().locator('main').evaluate(main => {
        const bounds = element => {
          const {x,y,width,height} = element.getBoundingClientRect();
          return [x,y,width,height];
        };
        const stage = main.querySelector('.playfield, .stage');
        const backdrop = main.querySelector('.scene-backdrop');
        const hud = main.querySelector('.dock');
        const target = main.querySelector('.grid, .die, .reels, .status');
        const a = hud.getBoundingClientRect(), b = target.getBoundingClientRect();
        return {
          background:bounds(backdrop),
          stageBorder:getComputedStyle(stage).borderTopWidth,
          stageBackground:getComputedStyle(stage).backgroundColor,
          hudVisible:a.x >= 0 && a.y >= 0 && a.right <= innerWidth + 1 && a.bottom <= innerHeight + 1,
          unobstructed:a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
          decorative:getComputedStyle(backdrop).pointerEvents,
        };
      });
      assert.deepEqual(scene, {
        background:[0,0,width,height], stageBorder:'0px', stageBackground:'rgba(0, 0, 0, 0)',
        hudVisible:true, unobstructed:true, decorative:'none',
      }, `${family[1]} ${layout} : décor plein écran et commandes dégagées`);
      if (layout === 'portrait') {
        // Disposition de poulet-banane : barre de 93 % centrée, JOUER rond au centre, SOLDE à gauche et MISE à droite ;
        // JOUER centré sur le bord haut de la barre ; au-dessus, toujours quatre boutons : ☰ et une place côté SOLDE,
        // deux places côté MISE (difficulté, AUTO, TURBO, SON ou HISTORIQUE selon le jeu, symbole seul sauf la difficulté),
        // creusés autour de JOUER ; les flèches ▲ ▼ sont dans le coin droit de la carte MISE.
        const portrait = await frame().locator('.dock-portrait').evaluate(dock => {
          const box = selector => dock.querySelector(selector).getBoundingClientRect(), center = rect => rect.left + rect.width / 2;
          const all = dock.getBoundingClientRect(), bar = box('.p-bar'), play = box('.master-play-btn'), menu = box('.menu-btn'), balance = box('.p-balance'), bet = box('.p-bet');
          return {
            bar:Math.abs(bar.width / all.width - .93) < .01 && Math.abs(center(bar) - center(all)) < 1,
            play:Math.abs(center(play) - center(bar)) < 1 && Math.abs(play.top + play.height / 2 - bar.top) < 1 && Math.abs(play.width - play.height) < 1 && getComputedStyle(dock.querySelector('.master-play-btn')).borderRadius === '50%',
            tabs:menu.bottom <= bar.top && Math.abs(menu.left - bar.left) < 1,
            cards:balance.right <= center(bar) && bet.left >= center(bar) && Math.abs(balance.top - bet.top) < 1,
            tabsRow:[...dock.querySelectorAll('.p-tabs .menu-btn, .p-tabs .p-tab, .p-difficulty .difficulty-pill')].every(tab => { const rect = tab.getBoundingClientRect(); return rect.bottom <= bar.top && rect.top >= all.top - 1; }),
            // Quatre boutons dans la rangée, quel que soit le jeu : ☰ + 3 places, de la même forme (rectangle
            // arrondi, même hauteur), le ☰ et le dernier de la même largeur, séparés par un petit écart.
            four:(() => {
              const tabs = [...dock.querySelectorAll('.p-tabs .menu-btn, .p-tabs .p-tab, .p-difficulty .difficulty-pill')];
              if (tabs.length !== 4) return false;
              const boxes = tabs.map(tab => tab.getBoundingClientRect());
              const radius = getComputedStyle(tabs[0]).borderRadius;
              return boxes.every(box => Math.abs(box.height - boxes[0].height) < 1)
                && tabs.every(tab => getComputedStyle(tab).borderRadius === radius && radius !== '50%')
                && Math.abs(boxes[0].width - boxes[3].width) < 1 && Math.abs(boxes[1].width - boxes[2].width) < 1
                && boxes[1].left - boxes[0].right < 6 && boxes[3].left - boxes[2].right < 6;
            })(),
            sides:[...dock.querySelectorAll('.p-difficulty, .p-left')].every(slot => slot.getBoundingClientRect().right <= center(bar)) &&
              [...dock.querySelectorAll('.p-auto, .p-turbo')].every(tab => tab.getBoundingClientRect().left >= center(bar)),
            iconOnly:[...dock.querySelectorAll('.p-auto, .p-turbo, .p-left')].every(tab => tab.textContent.trim() === ''),
            // MISE comme SOLDE : libellé au-dessus du montant, flèches ▲ (augmenter) au-dessus de ▼ (diminuer), à droite.
            steppers:(() => {
              const up = box('.p-bet .stepper-btn.up'), down = box('.p-bet .stepper-btn.down'), amount = box('.p-bet .bet-display');
              const label = box('.p-bet .card-label'), value = box('.p-bet .card-value');
              return up.bottom <= down.top && amount.right <= up.left && amount.right <= down.left
                && label.bottom <= value.top && Math.abs(up.width - down.width) < 1
                && value.right <= amount.right + 1 && value.left >= amount.left - 1;
            })(),
            singleBalance:getComputedStyle(document.querySelector('.topbar .balance')).display === 'none',
          };
        });
        assert(Object.values(portrait).every(Boolean), `${family[1]} : barre portrait de poulet-banane. ${JSON.stringify(portrait)}`);
      } else {
        // Ordinateur, tablette, paysage : le bord droit des flèches de mise est creusé du même arc que la carte MISE,
        // concentrique à JOUER ; les deux courbes restent donc parallèles, à l'écart qui les sépare.
        const arc = await frame().locator('.bet-arrows').evaluate(arrows => {
          const circle = element => {
            const mask = getComputedStyle(element).maskImage;
            const at = mask.match(/calc\(100% \+ ([\d.]+)px\)/), radius = mask.match(/0, 0\) ([\d.]+)px/);
            return at && radius ? {offset:parseFloat(at[1]), r:parseFloat(radius[1])} : null;
          };
          const card = arrows.closest('.bet-card'), own = circle(arrows), outer = circle(card);
          if (!own || !outer) return null;
          const gap = card.getBoundingClientRect().right - arrows.getBoundingClientRect().right;
          return {
            carved:own.r > outer.r,
            parallel:Math.abs((own.r - outer.r) - (own.offset - outer.offset)) < 0.5,
            concentric:Math.abs((own.offset - outer.offset) - gap) < 1,
          };
        });
        assert(arc && Object.values(arc).every(Boolean), `${family[1]} ${layout} : flèches de mise creusées sur la courbe de la carte. ${JSON.stringify(arc)}`);
      }
      await frame().locator('.dock').evaluate(async hud => {
        const animations = hud.getAnimations({subtree:true}).filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime));
        await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await page.locator('iframe').screenshot({path:`reports/${family[0]}-${layout}.png`});
    }
    if (family[0] === 'crash') await frame().locator('[data-pixi-ready="true"]').waitFor({timeout:30000});
    // Menu d'africa-tower : ✕ à la place du ≡, puis SON, PARAMÈTRES, INFO et TABLEAU DES GAINS ;
    // chaque section ouvre sa fenêtre, Échap referme la fenêtre puis le menu.
    await frame().getByRole('button',{name:'Ouvrir le menu',exact:true}).click();
    const menu = frame().getByRole('dialog',{name:'Menu du jeu',exact:true});
    await menu.waitFor();
    for (const name of [/^Son (activé|désactivé)$/,'Paramètres','Info : règles du jeu','Tableau des gains']) await menu.getByRole('button',{name,exact:typeof name === 'string'}).waitFor();
    // Le ✕ recouvre le ≡ à l'identique : même place, même taille et même forme (rond sur ordinateur, rectangle en portrait).
    const onMenu = await frame().locator('main').evaluate(main => {
      const trigger = main.querySelector('.dock .menu-btn'), closeButton = main.querySelector('.gm-close');
      const menuButton = trigger.getBoundingClientRect(), close = closeButton.getBoundingClientRect();
      return Math.abs(menuButton.left - close.left) < 1 && Math.abs(menuButton.top - close.top) < 1
        && Math.abs(menuButton.width - close.width) < 1 && Math.abs(menuButton.height - close.height) < 1
        && getComputedStyle(trigger).borderRadius === getComputedStyle(closeButton).borderRadius;
    });
    assert(onMenu,`${family[1]} : le ✕ du menu reprend la place, la taille et la forme du ≡.`);
    for (const [name,title] of [['Paramètres','Paramètres'],['Info : règles du jeu','Règles du jeu'],['Tableau des gains','Tableau des gains']]) {
      await menu.getByRole('button',{name,exact:true}).click();
      await frame().getByRole('dialog',{name:title,exact:true}).waitFor();
      await page.keyboard.press('Escape');
      await frame().getByRole('dialog',{name:title,exact:true}).waitFor({state:'hidden'});
      await menu.waitFor();
    }
    await page.keyboard.press('Escape');
    await menu.waitFor({state:'hidden'});
    assert(await frame().getByRole('button',{name:'Ouvrir le menu',exact:true}).evaluate(button => button === document.activeElement),'Le focus revient au menu après fermeture.');
    console.log(`OK ${family[1]} : 4 formats sur le même serveur.`);
  }
  // Ordinateur : dans le Crash, HISTORIQUE est posé au-dessus d'AUTO, de la même forme et de la même largeur.
  await page.getByRole('navigation',{name:'Format d’écran'}).getByRole('button',{name:'Ordinateur',exact:true}).click();
  await chooseFamily(...families[0]);
  const stacked = await frame().locator('.options-stack').evaluate(stack => {
    const historyButton = stack.querySelector('.history-btn'), autoButton = stack.querySelector('.auto-btn');
    const history = historyButton.getBoundingClientRect(), auto = autoButton.getBoundingClientRect();
    return history.bottom <= auto.top && Math.abs(history.width - auto.width) < 1 && Math.abs(history.height - auto.height) < 1;
  });
  assert(stacked,'Crash sur ordinateur : HISTORIQUE au-dessus d’AUTO, même forme.');
  await frame().locator('.history-btn').click();
  const deskRounds = frame().getByRole('group',{name:'Dernières manches',exact:true});
  await deskRounds.waitFor();
  assert.equal(await deskRounds.getByRole('listitem').count(),7,'HISTORIQUE sur ordinateur : les 7 dernières manches.');
  await page.keyboard.press('Escape');
  await deskRounds.waitFor({state:'hidden'});
  await page.getByRole('navigation',{name:'Format d’écran'}).getByRole('button',{name:'Mobile portrait',exact:true}).click();
  await chooseFamily(...families[0]);
  await frame().locator('.master-play-btn').click();
  await frame().locator('main[data-scenario="running"]').waitFor();
  // En jeu, ENCAISSER doré remplit la barre portrait, à la place de JOUER, du solde et de la mise.
  assert.equal(await frame().locator('.dock-portrait .master-play-btn').count(),0,'Crash en jeu : JOUER laisse la place à ENCAISSER.');
  // ☰ descend dans la même barre qu’ENCAISSER (même hauteur, à gauche), au lieu de flotter seul en haut.
  const crashLiveMenu = await frame().locator('.dock-portrait').evaluate(dock => {
    const box = selector => dock.querySelector(selector)?.getBoundingClientRect();
    const menu = box('.p-live-menu'), hero = box('.p-hero');
    return !dock.querySelector('.p-tabs') && !!menu && !!hero && Math.abs(menu.top - hero.top) < 1 && Math.abs(menu.height - hero.height) < 1 && menu.right <= hero.left;
  });
  assert(crashLiveMenu,'Crash en jeu : ☰ harmonisé dans la barre, à la même hauteur qu’ENCAISSER.');
  await frame().getByRole('button',{name:/^Encaisser/}).click();
  await frame().locator('main[data-scenario="cashedOut"]').waitFor();
  assert.equal(await frame().getByLabel('Dernier gain',{exact:true}).count(),0,'Le panneau portrait n’affiche plus le dernier gain.');
  // AUTO du Crash : nombre de tours, encaissement auto, AVANCÉ (objectif de gain / limite de perte), ACTIVER lance la série.
  await frame().getByRole('button',{name:/^Encaisser/}).click();
  await frame().locator('main[data-scenario="cashedOut"]').waitFor();
  await frame().locator('.p-auto').click();
  const crashAuto = frame().getByRole('dialog',{name:'Jeu automatique',exact:true});
  await crashAuto.waitFor();
  assert.equal(await crashAuto.getByRole('group',{name:'Nombre de tours',exact:true}).getByRole('button').count(),6,'6 choix de tours, ∞ compris.');
  await crashAuto.getByRole('button',{name:'5 tours',exact:true}).click();
  await crashAuto.getByRole('button',{name:/^Avancé/}).click();
  await crashAuto.getByRole('checkbox',{name:'Arrêter quand la perte atteint la limite',exact:true}).click();
  assert(await crashAuto.getByRole('button',{name:'Augmenter : Limite de perte',exact:true}).isEnabled(),'La limite de perte se règle une fois cochée.');
  assert(await crashAuto.getByRole('button',{name:'Augmenter : Objectif de gain',exact:true}).isDisabled(),'L’objectif de gain reste grisé tant qu’il n’est pas coché.');
  await crashAuto.getByRole('button',{name:'Activer',exact:true}).click();
  await crashAuto.waitFor({state:'hidden'});
  // Entre deux manches, AUTO est allumé en or et JOUER devient « Arrêter » (pendant la manche, seul ENCAISSER reste).
  await frame().locator('main[data-scenario="queued"]').waitFor();
  assert(await frame().locator('.p-auto').evaluate(button => button.classList.contains('auto-on')),'AUTO s’allume en or pendant la série.');
  await frame().getByRole('button',{name:/^Arrêter le jeu automatique, encore 5 tours/}).waitFor();
  await frame().locator('main[data-scenario="running"]').waitFor();
  await frame().getByText(/^Série terminée : 5 tours/).waitFor({timeout:30000});
  assert(!(await frame().locator('.p-auto').evaluate(button => button.classList.contains('auto-on'))),'AUTO s’éteint à la fin de la série.');
  // La 4e place du crash : HISTORIQUE, qui montre les 7 dernières manches (la révélation a TURBO à cette place).
  await frame().getByRole('button',{name:/^Historique :/}).click();
  const rounds = frame().getByRole('group',{name:'Dernières manches',exact:true});
  await rounds.waitFor();
  assert.equal(await rounds.getByRole('listitem').count(),7,'HISTORIQUE : les 7 dernières manches.');
  await page.keyboard.press('Escape');
  await rounds.waitFor({state:'hidden'});
  // SON : même bascule que dans le menu ≡ (volume principal partagé).
  await frame().getByRole('button',{name:'Son activé : couper le son',exact:true}).click();
  await frame().getByRole('button',{name:'Ouvrir le menu',exact:true}).click();
  await frame().getByRole('button',{name:'Son désactivé',exact:true}).click();
  await page.keyboard.press('Escape');
  await frame().getByRole('button',{name:'Son activé : couper le son',exact:true}).waitFor();
  await frame().locator('.master-play-btn').click();
  await frame().locator('main[data-scenario="running"]').waitFor();
  await chooseFamily(...families[1]);
  await frame().getByRole('button',{name:/^Difficulté :/}).click();
  await frame().getByRole('menuitemradio',{name:/^Audacieux/}).click();
  await frame().locator('.master-play-btn').click();
  await frame().locator('main[data-scenario="won"]').waitFor();
  await frame().getByLabel('Dé : 6',{exact:true}).waitFor();
  await frame().locator('.master-play-btn').click();
  await frame().locator('main[data-scenario="playing"]').waitFor();
  assert(await frame().getByRole('button',{name:/^Difficulté :/}).isDisabled(),'La difficulté est verrouillée pendant le lancer.');
  await frame().locator('main[data-scenario="lost"]').waitFor();
  await chooseFamily(...families[2]);
  await frame().getByRole('button',{name:/^Difficulté :/}).click();
  await frame().getByRole('menuitemradio',{name:/^Expert/}).click();
  await frame().locator('.master-play-btn').click();
  await frame().locator('main[data-scenario="playing"]').waitFor();
  // En jeu : la difficulté disparaît ; ENCAISSER entoure la pierre verte, qui montre une flèche (pas « JOUER ») et révèle une case au hasard.
  assert.equal(await frame().getByRole('button',{name:/^Difficulté :/}).count(),0,'La difficulté disparaît pendant la révélation.');
  const next = frame().getByRole('button',{name:'Révéler une case au hasard',exact:true});
  assert.equal(await next.count(),1,'Révélation en jeu : un seul bouton pour révéler une case au hasard.');
  assert.equal((await next.textContent()).trim(),'','Révélation en jeu : la pierre verte montre une flèche, sans le mot JOUER.');
  // ☰, ENCAISSER et la pierre verte (suivant) partagent la même barre, sans chevauchement de texte.
  const revealLiveRow = await frame().locator('.dock-portrait').evaluate(dock => {
    const box = selector => dock.querySelector(selector)?.getBoundingClientRect();
    const menu = box('.p-live-menu'), hero = box('.p-hero'), label = box('.p-hero .hero-label'), amount = box('.p-hero .hero-amount'), play = box('.master-play-btn');
    return !dock.querySelector('.p-tabs') && [menu,hero,label,amount,play].every(Boolean)
      && Math.abs(menu.top - hero.top) < 1 && Math.abs(menu.height - hero.height) < 1 && menu.right <= hero.left
      && label.right <= play.left && play.right <= amount.left;
  });
  assert(revealLiveRow,'Révélation en jeu : ☰, ENCAISSER et la pierre verte harmonisés, sans chevauchement.');
  await frame().getByRole('button',{name:'Révéler la case 1',exact:true}).click();
  await frame().locator('.cashout-btn-hero:enabled').click();
  await frame().locator('main[data-scenario="cashedOut"]').waitFor();
  await chooseFamily(...families[3]);
  await frame().locator('.dock').getByRole('button',{name:'Turbo',exact:true}).click();
  assert.equal(await frame().locator('.dock').getByRole('button',{name:'Turbo',exact:true}).getAttribute('aria-pressed'),'true','Turbo activé depuis le dock.');
  // AUTO ouvre la fenêtre TOURS AUTO du web-sdk : nombre de tours, menu AVANCÉ (slots), LANCER L'AUTO-SPIN.
  await frame().getByRole('button',{name:'Ouvrir le jeu automatique',exact:true}).click();
  const autoSpin = frame().getByRole('dialog',{name:'Tours auto',exact:true});
  await autoSpin.waitFor();
  assert.equal(await autoSpin.getByRole('group',{name:'Nombre de tours',exact:true}).getByRole('button').count(),9,'Neuf choix de tours (10 à 1000 et ∞).');
  await autoSpin.getByRole('group',{name:'Nombre de tours',exact:true}).getByRole('button',{name:'25',exact:true}).click();
  await autoSpin.getByText('Avancé',{exact:true}).click();
  await autoSpin.getByRole('group',{name:'Limite de perte',exact:true}).waitFor();
  await autoSpin.getByRole('button',{name:"Lancer l'auto-spin",exact:true}).click();
  // Pendant la série, AUTO s'allume en or, comme TURBO activé.
  assert(await frame().locator('.dock').evaluate(dock => { const auto = dock.querySelector('.auto-btn, .p-auto'), turbo = dock.querySelector('.turbo-btn'); return auto.classList.contains('auto-on') && getComputedStyle(auto).color === getComputedStyle(turbo).color; }),'AUTO activé en or, comme TURBO.');
  // Comme ButtonAutoSpin du web-sdk : pendant la série, AUTO l'arrête au lieu de rouvrir la fenêtre.
  await frame().getByRole('button',{name:'Arrêter les tours auto',exact:true}).click();
  await frame().locator('.master-play-btn[data-action="bet"]:enabled').waitFor();
  assert.equal(await frame().getByRole('dialog',{name:'Tours auto',exact:true}).count(),0,'AUTO arrête la série sans rouvrir la fenêtre.');
  console.log('OK interactions : encaisser, risque, difficulté, modes Slots et arrêt Auto.');

  await chooseFamily(...families[1]);
  await page.getByRole('combobox',{name:'Moment de la partie'}).selectOption('lost');
  await frame().locator('main[data-scenario="lost"]').waitFor();
  await frame().getByRole('button',{name:'Modifier le montant de la mise',exact:true}).click();
  await frame().getByRole('group',{name:'Montants de mise'}).getByRole('button',{name:'500 FCFA',exact:true}).click();
  await frame().getByRole('button',{name:'Terminé',exact:true}).click();
  await page.getByRole('button',{name:'Réinitialiser la maquette',exact:true}).click();
  await frame().locator('.dock .bet-value').filter({hasText:/^10$/}).waitFor();
  assert.equal(await frame().locator('main').getAttribute('data-scenario'),'lost');
  await page.goto(`${url}/?famille=slots&format=portrait&scenario=freeSpins`);
  await frame().locator('main[data-scenario="freeSpins"]').waitFor();
  await page.reload();
  await frame().locator('main[data-scenario="freeSpins"]').waitFor();
  await chooseFamily(...families[0]);
  await page.goBack();
  await frame().locator('main[data-scenario="freeSpins"]').waitFor();
  await page.goForward();
  await frame().locator('main[data-scenario="betting"]').waitFor();
  assert.equal(new URL(await page.getByRole('link',{name:'Ouvrir l’écran seul'}).getAttribute('href'),url).pathname,'/scene/crash');
  await page.screenshot({path:'reports/atelier-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  assert.equal(await page.locator('body').evaluate(() => document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'reports/atelier-mobile.png',fullPage:true});

  for (const [id,,initial,brand] of families) {
    await page.goto(`${url}/scene/${id}?scenario=inconnu`);
    await page.locator(`main[data-scenario="${initial}"]`).waitFor();
    assert.equal(await page.locator('.brand strong').textContent(),brand);
  }
  for (const [width,height] of [[320,568],[360,640],[430,932]]) {
    await page.setViewportSize({width,height});
    for (const [id] of families) {
      await page.goto(`${url}/scene/${id}`);
      await page.locator('main[data-layout="portrait"]').waitFor();
      await verifyInstruction(page,`${id} ${width}×${height}`);
      const controls = await page.locator('.dock-portrait').evaluate(dock => {
        const bounds = dock.getBoundingClientRect();
        const buttons = [...dock.querySelectorAll('button')].filter(button => button.getBoundingClientRect().width);
        return {
          ratio:dock.querySelector('.p-bar').getBoundingClientRect().width / bounds.width,
          visible:bounds.left >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight,
          // Chaque commande reçoit le toucher en son centre : aucune ne recouvre l'autre (AUTO et les cartes épousent JOUER).
          reachable:buttons.every(button => {
            const rect = button.getBoundingClientRect(), hit = document.elementFromPoint(rect.x + rect.width/2,rect.y + rect.height/2);
            return hit === button || button.contains(hit);
          }),
          play:dock.querySelector('.master-play-btn').getBoundingClientRect().width >= 64,
          overflow:document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
          logos:[...document.querySelectorAll('.brand,.studio-logo')].every(logo => { const rect = logo.getBoundingClientRect(); return rect.x >= 0 && rect.right <= innerWidth; }),
        };
      });
      assert(Math.abs(controls.ratio - .93) < .01, `${id} ${width}×${height} : barre de 93 % (${controls.ratio})`);
      assert(controls.visible && controls.reachable && controls.play && controls.logos && !controls.overflow, `${id} ${width}×${height} : barre portrait visible, commandes séparées. ${JSON.stringify(controls)}`);
    }
  }
  console.log('OK barre portrait : disposition de poulet-banane (barre de 93 %, JOUER au centre, onglets ☰ / AUTO, SOLDE et MISE) sur petits et grands téléphones.');
  const scenarioSets = {
    crash:['betting','queued','running','cashedOut','ended'],
    instantanees:['ready','playing','won','lost'],
    revelation:['ready','playing','cashedOut','lost'],
    slots:['ready','spinning','win','noWin','freeSpins'],
  };
  for (const [width,height] of [[320,568],[844,390],[1440,900],[900,900]]) {
    await page.setViewportSize({width,height});
    for (const [id,scenarios] of Object.entries(scenarioSets)) {
      for (const scenario of scenarios) {
        await page.goto(`${url}/scene/${id}?scenario=${scenario}`);
        await page.locator(`main[data-scenario="${scenario}"]`).waitFor();
        await verifyInstruction(page,`${id} ${scenario} ${width}×${height}`);
      }
    }
  }
  console.log('OK consignes et dock : textes complets dans les quatre jeux et tous les états, en petit portrait, paysage, ordinateur et tablette.');
  await page.goto(`${url}/?famille=inconnue&format=inconnu&scenario=inconnu`);
  await frame().locator('main[data-scenario="betting"]').waitFor();
  assert.deepEqual(errors,[]);
  assert.deepEqual(failed,[]);
  console.log('OK scénarios, réinitialisation, liens directs, historique, petit écran et valeurs invalides.');
  console.log('Aucune erreur JavaScript ni ressource manquante.');
} finally { await browser?.close(); server.kill(); }
