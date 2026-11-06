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
async function verifyDifficulty(scope, label) {
  const selector = scope.getByRole('group',{name:'Niveaux de difficulté',exact:true});
  assert.equal(await selector.count(),1,`${label} : un seul sélecteur de difficulté.`);
  assert.equal(await selector.locator('button[aria-pressed="true"]').count(),1,`${label} : un seul niveau sélectionné.`);
  const readable = await selector.evaluate(group => [...group.querySelectorAll('button')].every(button => {
    const box = button.getBoundingClientRect();
    return box.width >= 44 && box.height >= 44 && box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight &&
      [...button.querySelectorAll('strong,small')].every(text => {
        const range = document.createRange(); range.selectNodeContents(text);
        return [...range.getClientRects()].every(rect => rect.left >= box.left && rect.right <= box.right && rect.top >= box.top && rect.bottom <= box.bottom);
      });
  }));
  assert(readable,`${label} : trois niveaux lisibles et accessibles au toucher.`);
}
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
  const clipped = await scope.locator('.hud').evaluate(hud => {
    return [...hud.querySelectorAll('.tile-detail,.primary-label,.primary-detail')].filter(element => {
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
      await frame().locator('.primary').waitFor();
      await verifyInstruction(frame(),`${family[1]} ${layout}`);
      await frame().getByRole('img',{name:'Studio Baobab',exact:true}).waitFor();
      await frame().locator('.studio-logo img').evaluate(img => img.decode());
      const identity = await frame().locator('main').evaluate(main => {
        const game = main.querySelector('.brand').getBoundingClientRect(), studio = main.querySelector('.studio-logo').getBoundingClientRect();
        const hud = main.querySelector('.hud').getBoundingClientRect(), menu = main.querySelector('.panel-menu').getBoundingClientRect();
        const controls = [...main.querySelectorAll('.hud .step,.hud .amount,.hud .primary,.hud .auto')].map(button => button.getBoundingClientRect());
        const hit = document.elementFromPoint(menu.x + menu.width/2,menu.y + menu.height/2), button = main.querySelector('.panel-menu');
        return {
          corners:game.left >= 0 && game.left < innerWidth/2 && studio.right <= innerWidth && studio.left > innerWidth/2 && game.bottom < innerHeight/3 && studio.bottom < innerHeight/3,
          menuInside:menu.left >= hud.left && menu.right <= hud.left + 68 && menu.bottom <= hud.bottom && menu.y + menu.height/2 >= hud.y + hud.height/2,
          menuAccessible:menu.width >= 44 && menu.height >= 44 && (hit === button || button.contains(hit)),
          distinct:controls.every(rect => menu.right <= rect.left || rect.right <= menu.left || menu.bottom <= rect.top || rect.bottom <= menu.top),
          headerButtons:main.querySelectorAll('.topbar button').length,
        };
      });
      assert(identity.corners && identity.menuInside && identity.menuAccessible && identity.distinct && identity.headerButtons === 0, `${family[1]} ${layout} : logos aux deux coins et menu dégagé dans le panneau. ${JSON.stringify(identity)}`);
      assert.equal(await frame().locator('.brand .tag').count(),0,'Aucun badge Démo dans le jeu.');
      if (family[0] !== 'instantanees') assert.equal(await frame().locator('.hud > .round').count(),0,'Aucun bloc de gain vide avant la manche.');
      if (family[0] === 'instantanees' || family[0] === 'revelation') {
        if (family[0] === 'revelation') await frame().getByRole('button',{name:'Choisir la difficulté',exact:true}).click();
        await verifyDifficulty(frame(),`${family[1]} ${layout}`);
        if (family[0] === 'revelation') await page.keyboard.press('Escape');
      }
      if (family[0] === 'slots') {
        await frame().getByRole('checkbox',{name:'Activer le turbo',exact:true}).waitFor();
        await frame().getByRole('button',{name:'Achat de bonus',exact:true}).waitFor();
        const direct = await frame().locator('.slot-actions').evaluate(actions => {
          const reels = document.querySelector('.reels').getBoundingClientRect();
          const hud = document.querySelector('.hud').getBoundingClientRect();
          return [...actions.querySelectorAll('input,button')].every(control => {
            const rect = control.getBoundingClientRect(), hit = document.elementFromPoint(rect.x + rect.width/2,rect.y + rect.height/2);
            const separate = rect.right <= reels.left || reels.right <= rect.left || rect.bottom <= reels.top || reels.bottom <= rect.top;
            return rect.width >= 48 && rect.height >= 48 && rect.left >= hud.left && rect.right <= hud.right && rect.top >= 0 && Math.abs(hud.top - rect.bottom - 8) < 1 && separate && (control === hit || control.contains(hit));
          });
        });
        assert(direct,`Slots ${layout} : Turbo et Achat de bonus visibles juste au-dessus du panneau et dégagés des rouleaux.`);
      }
      const scene = await frame().locator('main').evaluate(main => {
        const bounds = element => {
          const {x,y,width,height} = element.getBoundingClientRect();
          return [x,y,width,height];
        };
        const stage = main.querySelector('.playfield, .stage');
        const backdrop = main.querySelector('.scene-backdrop');
        const hud = main.querySelector('.hud');
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
        const compact = await frame().locator('.hud').evaluate(hud => {
          const stats = hud.querySelector('.portrait-stats').getBoundingClientRect();
          const controls = ['.bet','.primary','.auto'].map(selector => hud.querySelector(selector).getBoundingClientRect());
          const primary = controls[1];
          const style = getComputedStyle(hud.querySelector('.primary'));
          return {
            ratio:hud.getBoundingClientRect().height / innerHeight,
            twoRows:controls.every(rect => rect.top >= stats.bottom && Math.abs(rect.top + rect.height / 2 - (primary.top + primary.height / 2)) < 1),
            touchTargets:[...hud.querySelectorAll('.panel-menu,.step,.amount,.primary,.auto')].every(button => {
              const rect = button.getBoundingClientRect(); return rect.width >= 44 && rect.height >= 44;
            }),
            round:primary.width === primary.height && style.borderRadius === '50%',
            singleBalance:getComputedStyle(document.querySelector('.topbar .balance')).display === 'none',
          };
        });
        assert(Math.abs(compact.ratio - .15) < .01, `${family[1]} : panneau proche de 15 % (${compact.ratio})`);
        assert(compact.twoRows && compact.touchTargets && compact.round && compact.singleBalance, `${family[1]} : deux lignes et commandes tactiles`);
      }
      await frame().locator('.hud').evaluate(async hud => {
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
  await frame().locator('.primary').click();
  await frame().locator('main[data-scenario="running"]').waitFor();
  await frame().locator('.primary').click();
  await frame().locator('main[data-scenario="cashedOut"]').waitFor();
  await frame().getByLabel('Dernier gain',{exact:true}).filter({hasText:'23,50'}).waitFor();
  await frame().locator('.primary').click();
  await frame().locator('main[data-scenario="running"]').waitFor();
  assert.match(await frame().getByLabel('Dernier gain',{exact:true}).textContent(),/23,50/);
  await chooseFamily(...families[1]);
  await frame().getByRole('group',{name:'Niveaux de difficulté'}).getByRole('button',{name:'Audacieux Un 6',exact:true}).click();
  await frame().locator('.primary').click();
  await frame().locator('main[data-scenario="won"]').waitFor();
  await frame().getByLabel('Dé : 6',{exact:true}).waitFor();
  await frame().getByLabel('Dernier gain',{exact:true}).filter({hasText:'56,00'}).waitFor();
  await frame().locator('.primary').click();
  await frame().locator('main[data-scenario="playing"]').waitFor();
  assert.equal(await frame().locator('.difficulty-selector button:disabled').count(),3,'Les trois niveaux sont verrouillés pendant le lancer.');
  assert.match(await frame().getByLabel('Dernier gain',{exact:true}).textContent(),/56,00/);
  await frame().locator('main[data-scenario="lost"]').waitFor();
  await frame().getByLabel('Dernier gain',{exact:true}).filter({hasText:'0,00'}).waitFor();
  await chooseFamily(...families[2]);
  await frame().getByRole('button',{name:'Choisir la difficulté',exact:true}).click();
  await frame().getByRole('button',{name:/^Expert/}).click();
  await frame().getByRole('button',{name:'Terminé',exact:true}).click();
  await frame().locator('.primary').click();
  await frame().locator('main[data-scenario="playing"]').waitFor();
  assert.equal(await frame().locator('.difficulty-selector button:disabled').count(),3,'Les trois niveaux sont verrouillés pendant la révélation.');
  await frame().getByRole('button',{name:'Révéler la case 1',exact:true}).click();
  await frame().locator('.primary:enabled').click();
  await frame().locator('main[data-scenario="cashedOut"]').waitFor();
  await chooseFamily(...families[3]);
  await frame().getByRole('checkbox',{name:'Activer le turbo',exact:true}).check();
  await frame().getByRole('button',{name:'Configurer le jeu automatique',exact:true}).click();
  assert.equal(await frame().getByRole('tab',{name:'Auto',exact:true}).getAttribute('aria-selected'),'true','Le bouton Auto ouvre directement ses réglages.');
  await frame().getByRole('button',{name:'Lancer 3 tours',exact:true}).click();
  await frame().getByRole('button',{name:'Arrêter le jeu automatique',exact:true}).click();
  await frame().locator('.primary[data-action="bet"]:enabled').waitFor();
  await frame().getByRole('button',{name:'Achat de bonus',exact:true}).click();
  assert.equal(await frame().getByRole('tab',{name:'Gratuits',exact:true}).getAttribute('aria-selected'),'true');
  await frame().getByRole('button',{name:'Commencer les 5 tours',exact:true}).click();
  await frame().getByRole('button',{name:'Lancer un tour gratuit',exact:true}).click();
  await frame().locator('.primary:enabled').waitFor();
  console.log('OK interactions : encaisser, risque, difficulté, modes Slots et arrêt Auto.');

  await chooseFamily(...families[1]);
  await page.getByRole('combobox',{name:'Moment de la partie'}).selectOption('lost');
  await frame().locator('main[data-scenario="lost"]').waitFor();
  await frame().getByRole('button',{name:'Modifier le montant de la mise',exact:true}).click();
  await frame().getByRole('group',{name:'Montants de mise'}).getByRole('button',{name:'500 FCFA',exact:true}).click();
  await frame().getByRole('button',{name:'Terminé',exact:true}).click();
  await page.getByRole('button',{name:'Réinitialiser la maquette',exact:true}).click();
  await frame().locator('.amount-value').filter({hasText:/^10$/}).waitFor();
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
      const controls = await page.locator('.hud').evaluate(hud => {
        const bounds = hud.getBoundingClientRect();
        const buttons = [...hud.querySelectorAll('.panel-menu,.step,.amount,.primary,.auto')].map(button => button.getBoundingClientRect());
        return {
          height:bounds.height,
          visible:bounds.right <= innerWidth && bounds.bottom <= innerHeight,
          touchTargets:buttons.every(rect => rect.width >= 44 && rect.height >= 44),
          distinct:buttons.every((a,i) => buttons.slice(i+1).every(b => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)),
          direct:[...document.querySelectorAll('.slot-actions input,.slot-actions button')].every(control => {
            const rect = control.getBoundingClientRect(), hit = document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
            const reels = document.querySelector('.reels').getBoundingClientRect();
            const separate = rect.right <= reels.left || reels.right <= rect.left || rect.bottom <= reels.top || reels.bottom <= rect.top;
            return rect.width >= 48 && rect.height >= 48 && rect.left >= bounds.left && rect.right <= bounds.right && Math.abs(bounds.top - rect.bottom - 8) < 1 && separate && (hit === control || control.contains(hit));
          }),
          overflow:document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
          logos:[...document.querySelectorAll('.brand,.studio-logo')].every(logo => { const rect = logo.getBoundingClientRect(); return rect.x >= 0 && rect.right <= innerWidth; }),
        };
      });
      assert(Math.abs(controls.height - Math.max(112,Math.min(128,height*.15))) < 1);
      assert(controls.visible && controls.touchTargets && controls.distinct && controls.direct && controls.logos && !controls.overflow, `${id} ${width}×${height} : commandes compactes et séparées`);
    }
  }
  console.log('OK panneau portrait : 15 % sur le format de référence, deux lignes, dernier gain conservé et cibles tactiles sur petits et grands téléphones.');
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
  console.log('OK consignes et panneau : textes complets dans les quatre jeux et tous les états, en petit portrait, paysage, ordinateur et tablette.');
  await page.goto(`${url}/?famille=inconnue&format=inconnu&scenario=inconnu`);
  await frame().locator('main[data-scenario="betting"]').waitFor();
  assert.deepEqual(errors,[]);
  assert.deepEqual(failed,[]);
  console.log('OK scénarios, réinitialisation, liens directs, historique, petit écran et valeurs invalides.');
  console.log('Aucune erreur JavaScript ni ressource manquante.');
} finally { await browser?.close(); server.kill(); }
