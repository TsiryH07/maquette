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
      await page.locator('iframe').screenshot({path:`reports/${family[0]}-${layout}.png`});
    }
    if (family[0] === 'crash') await frame().locator('[data-pixi-ready="true"]').waitFor({timeout:30000});
    console.log(`OK ${family[1]} : 4 formats sur le même serveur.`);
  }
  await page.getByRole('navigation',{name:'Format d’écran'}).getByRole('button',{name:'Mobile portrait',exact:true}).click();
  await chooseFamily(...families[0]);
  await frame().locator('.primary').click();
  await frame().locator('main[data-scenario="running"]').waitFor();
  await frame().locator('.primary').click();
  await frame().locator('main[data-scenario="cashedOut"]').waitFor();
  await chooseFamily(...families[1]);
  await frame().getByRole('group',{name:'Niveau de risque'}).getByRole('button',{name:'Audacieux Un 6',exact:true}).click();
  await frame().locator('.primary').click();
  await frame().locator('main[data-scenario="won"]').waitFor();
  await frame().getByLabel('Dé : 6',{exact:true}).waitFor();
  await chooseFamily(...families[2]);
  await frame().getByRole('button',{name:'Choisir la difficulté',exact:true}).click();
  await frame().getByRole('button',{name:/^Expert/}).click();
  await frame().getByRole('button',{name:'Terminé',exact:true}).click();
  await frame().locator('.primary').click();
  await frame().getByRole('button',{name:'Révéler la case 1',exact:true}).click();
  await frame().locator('.primary:enabled').click();
  await frame().locator('main[data-scenario="cashedOut"]').waitFor();
  await chooseFamily(...families[3]);
  await frame().getByRole('button',{name:'Ouvrir les options de jeu',exact:true}).click();
  await frame().getByRole('tab',{name:'Auto',exact:true}).click();
  await frame().getByRole('checkbox',{name:'Activer le turbo',exact:true}).check();
  await frame().getByRole('button',{name:'Lancer 3 tours',exact:true}).click();
  await frame().getByRole('button',{name:'Arrêter le jeu automatique',exact:true}).click();
  await frame().locator('.primary[data-action="bet"]:enabled').waitFor();
  await frame().getByRole('button',{name:'Ouvrir les options de jeu',exact:true}).click();
  await frame().getByRole('tab',{name:'Gratuits',exact:true}).click();
  await frame().getByRole('button',{name:'Commencer les 5 tours',exact:true}).click();
  await frame().getByRole('button',{name:'Lancer un tour gratuit',exact:true}).click();
  await frame().locator('.primary:enabled').waitFor();
  console.log('OK interactions : encaisser, risque, difficulté, modes Slots et arrêt Auto.');

  await chooseFamily(...families[1]);
  await page.getByRole('combobox',{name:'Moment de la partie'}).selectOption('lost');
  await frame().locator('main[data-scenario="lost"]').waitFor();
  await frame().getByRole('group',{name:'Montants rapides'}).getByRole('button',{name:'500 FCFA',exact:true}).click();
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
  await page.goto(`${url}/?famille=inconnue&format=inconnu&scenario=inconnu`);
  await frame().locator('main[data-scenario="betting"]').waitFor();
  assert.deepEqual(errors,[]);
  assert.deepEqual(failed,[]);
  console.log('OK scénarios, réinitialisation, liens directs, historique, petit écran et valeurs invalides.');
  console.log('Aucune erreur JavaScript ni ressource manquante.');
} finally { await browser?.close(); server.kill(); }
