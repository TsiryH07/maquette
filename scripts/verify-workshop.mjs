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
          // Portrait : rond ☰ en haut à gauche, au-dessus de la barre ; ailleurs, rond ☰ à gauche du dock.
          menuInside:layout === 'portrait'
            ? menu.left >= hud.left && menu.right <= hud.left + 68 && Math.abs(menu.top - hud.top) < 1
            : menu.left >= hud.left && menu.right <= hud.left + 68 && menu.bottom <= hud.bottom && menu.y + menu.height/2 >= hud.y + hud.height/2 - 1,
          // En portrait, les ronds gardent les proportions de l'ordinateur par rapport à JOUER (≈ 42 px sur 390 px) : pas de minimum de 44 px.
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
        // Bouton TURBO du dock dans tous les formats ; seul l'achat de bonus reste sur le décor.
        await frame().locator('.dock').getByRole('button',{name:'Turbo',exact:true}).waitFor();
        await frame().getByRole('button',{name:'Achat de bonus',exact:true}).waitFor();
        const direct = await frame().locator('.slot-actions').evaluate((actions, layout) => {
          const reels = document.querySelector('.reels').getBoundingClientRect();
          const hud = document.querySelector('.dock').getBoundingClientRect();
          return [...actions.querySelectorAll('button')].every(control => {
            const rect = control.getBoundingClientRect(), hit = document.elementFromPoint(rect.x + rect.width/2,rect.y + rect.height/2);
            const separate = rect.right <= reels.left || reels.right <= rect.left || rect.bottom <= reels.top || reels.bottom <= rect.top;
            // En paysage, bouton-icône à gauche du dock ; ailleurs, juste au-dessus du dock.
            const placed = layout === 'landscape'
              ? rect.right <= hud.left && rect.top >= hud.top - 1 && rect.bottom <= hud.bottom + 1
              : rect.left >= hud.left && rect.right <= hud.right && Math.abs(hud.top - rect.bottom - 8) < 1;
            return rect.width >= 48 && rect.height >= 48 && rect.top >= 0 && placed && separate && (control === hit || control.contains(hit));
          });
        }, layout);
        assert(direct,`Slots ${layout} : Achat de bonus visible près du dock et dégagé des rouleaux.`);
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
        // JOUER centré sur le bord haut de la barre ; au-dessus, ☰ et la difficulté côté SOLDE, AUTO et TURBO (symbole seul) côté MISE,
        // la difficulté et AUTO creusés autour de JOUER ; − et + encadrent la mise.
        const portrait = await frame().locator('.dock-portrait').evaluate(dock => {
          const box = selector => dock.querySelector(selector).getBoundingClientRect(), center = rect => rect.left + rect.width / 2;
          const all = dock.getBoundingClientRect(), bar = box('.p-bar'), play = box('.master-play-btn'), menu = box('.menu-btn'), balance = box('.p-balance'), bet = box('.p-bet');
          return {
            bar:Math.abs(bar.width / all.width - .93) < .01 && Math.abs(center(bar) - center(all)) < 1,
            play:Math.abs(center(play) - center(bar)) < 1 && Math.abs(play.top + play.height / 2 - bar.top) < 1 && Math.abs(play.width - play.height) < 1 && getComputedStyle(dock.querySelector('.master-play-btn')).borderRadius === '50%',
            tabs:menu.bottom <= bar.top && Math.abs(menu.left - bar.left) < 1,
            cards:balance.right <= center(bar) && bet.left >= center(bar) && Math.abs(balance.top - bet.top) < 1,
            tabsRow:[...dock.querySelectorAll('.p-tabs .menu-btn, .p-tabs .p-tab, .p-difficulty .difficulty-pill')].every(tab => { const rect = tab.getBoundingClientRect(); return rect.bottom <= bar.top && rect.top >= all.top - 1; }),
            sides:[...dock.querySelectorAll('.p-difficulty')].every(slot => slot.getBoundingClientRect().right <= center(bar)) &&
              [...dock.querySelectorAll('.p-auto, .p-turbo')].every(tab => tab.getBoundingClientRect().left >= center(bar)),
            iconOnly:[...dock.querySelectorAll('.p-auto, .p-turbo')].every(tab => tab.textContent.trim() === ''),
            steppers:(() => { const minus = box('.p-bet .stepper-btn.minus'), plus = box('.p-bet .stepper-btn.plus'), amount = box('.p-bet .bet-display'); return minus.right <= amount.left && amount.right <= plus.left; })(),
            singleBalance:getComputedStyle(document.querySelector('.topbar .balance')).display === 'none',
          };
        });
        assert(Object.values(portrait).every(Boolean), `${family[1]} : barre portrait de poulet-banane. ${JSON.stringify(portrait)}`);
      }
      await frame().locator('.dock').evaluate(async hud => {
        const animations = hud.getAnimations({subtree:true}).filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime));
        await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await page.locator('iframe').screenshot({path:`reports/${family[0]}-${layout}.png`});
    }
    if (family[0] === 'crash') await frame().locator('[data-pixi-ready="true"]').waitFor({timeout:30000});
    await frame().getByRole('button',{name:'Ouvrir le menu',exact:true}).click();
    await frame().getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await frame().getByRole('dialog').waitFor({state:'hidden'});
    assert(await frame().getByRole('button',{name:'Ouvrir le menu',exact:true}).evaluate(button => button === document.activeElement),'Le focus revient au menu après fermeture.');
    console.log(`OK ${family[1]} : 4 formats sur le même serveur.`);
  }
  await page.getByRole('navigation',{name:'Format d’écran'}).getByRole('button',{name:'Mobile portrait',exact:true}).click();
  await chooseFamily(...families[0]);
  await frame().locator('.master-play-btn').click();
  await frame().locator('main[data-scenario="running"]').waitFor();
  // En jeu, ENCAISSER doré remplit la barre portrait, à la place de JOUER, du solde et de la mise.
  assert.equal(await frame().locator('.dock-portrait .master-play-btn').count(),0,'Crash en jeu : JOUER laisse la place à ENCAISSER.');
  await frame().getByRole('button',{name:/^Encaisser/}).click();
  await frame().locator('main[data-scenario="cashedOut"]').waitFor();
  assert.equal(await frame().getByLabel('Dernier gain',{exact:true}).count(),0,'Le panneau portrait n’affiche plus le dernier gain.');
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
  await frame().getByRole('button',{name:'Révéler la case 1',exact:true}).click();
  await frame().locator('.cashout-btn-hero:enabled').click();
  await frame().locator('main[data-scenario="cashedOut"]').waitFor();
  await chooseFamily(...families[3]);
  await frame().locator('.dock').getByRole('button',{name:'Turbo',exact:true}).click();
  assert.equal(await frame().locator('.dock').getByRole('button',{name:'Turbo',exact:true}).getAttribute('aria-pressed'),'true','Turbo activé depuis le dock.');
  await frame().getByRole('button',{name:'Ouvrir le jeu automatique',exact:true}).click();
  assert.equal(await frame().getByRole('tab',{name:'Auto',exact:true}).getAttribute('aria-selected'),'true','Le bouton Auto ouvre directement ses réglages.');
  await frame().getByRole('button',{name:'Lancer 3 tours',exact:true}).click();
  await frame().getByRole('button',{name:'Arrêter le jeu automatique',exact:true}).click();
  await frame().locator('.master-play-btn[data-action="bet"]:enabled').waitFor();
  await frame().getByRole('button',{name:'Achat de bonus',exact:true}).click();
  assert.equal(await frame().getByRole('tab',{name:'Gratuits',exact:true}).getAttribute('aria-selected'),'true');
  await frame().getByRole('button',{name:'Commencer les 5 tours',exact:true}).click();
  await frame().getByRole('button',{name:'Jouer un tour gratuit',exact:true}).click();
  await frame().locator('.master-play-btn:enabled').waitFor();
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
          direct:[...document.querySelectorAll('.slot-actions button')].every(control => {
            const rect = control.getBoundingClientRect(), hit = document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
            const reels = document.querySelector('.reels').getBoundingClientRect();
            const separate = rect.right <= reels.left || reels.right <= rect.left || rect.bottom <= reels.top || reels.bottom <= rect.top;
            return rect.width >= 48 && rect.height >= 48 && rect.left >= bounds.left && rect.right <= bounds.right && Math.abs(bounds.top - rect.bottom - 8) < 1 && separate && (hit === control || control.contains(hit));
          }),
          overflow:document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
          logos:[...document.querySelectorAll('.brand,.studio-logo')].every(logo => { const rect = logo.getBoundingClientRect(); return rect.x >= 0 && rect.right <= innerWidth; }),
        };
      });
      assert(Math.abs(controls.ratio - .93) < .01, `${id} ${width}×${height} : barre de 93 % (${controls.ratio})`);
      assert(controls.visible && controls.reachable && controls.play && controls.direct && controls.logos && !controls.overflow, `${id} ${width}×${height} : barre portrait visible, commandes séparées. ${JSON.stringify(controls)}`);
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
