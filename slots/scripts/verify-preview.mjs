import { verifyMotion } from './verify-motion.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const production = process.argv.includes('--preview');
const port = production ? 4083 : 3083;
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...(production ? ['preview'] : []), '--host','127.0.0.1','--port',String(port),'--strictPort'], { windowsHide:true,stdio:['ignore','pipe','pipe'] });
let logs='';
server.stdout.on('data',chunk=>logs+=chunk);server.stderr.on('data',chunk=>logs+=chunk);
let browser;
try {
  let ready=false;
  for(let attempt=0;attempt<120;attempt++){
    if(server.exitCode!==null)throw Error(logs);
    try {ready=(await fetch(url)).ok;}catch{}
    if(ready)break;await delay(500);
  }
  assert(ready,logs);
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.getByRole('heading',{name:'Atelier de préparation'}).waitFor();
  await mkdir('reports',{recursive:true});
  for(const [label,layout,width,height] of [['Ordinateur','desktop',1440,900],['Tablette','tablet',900,900],['Mobile portrait','portrait',390,844],['Mobile paysage','landscape',844,390]]){
    await page.getByRole('button',{name:label,exact:true}).click();
    const frame=page.frameLocator('iframe');
    await frame.locator(`main[data-layout="${layout}"]`).waitFor();
    await frame.locator('.reels').waitFor();
    await frame.getByRole('checkbox',{name:'Activer le turbo',exact:true}).waitFor();
    await frame.getByRole('button',{name:'Achat de bonus',exact:true}).waitFor();
    assert.deepEqual(await frame.locator('body').evaluate(()=>({width:innerWidth,height:innerHeight,x:document.documentElement.scrollWidth>innerWidth,y:document.documentElement.scrollHeight>innerHeight})),{width,height,x:false,y:false});
    const a=await frame.locator('.primary').boundingBox(),b=await page.locator('iframe').boundingBox();
    assert(a.y>=b.y && a.y+a.height<=b.y+b.height+1,'Bouton principal entièrement visible');
    await page.locator('iframe').screenshot({path:`reports/${layout}.png`});
    console.log(`OK ${layout} ${width}×${height}`);
  }
  for (const scenario of ['win','freeSpins','ready']) {
    await page.getByRole('combobox',{name:'Moment de la partie'}).selectOption(scenario);
    const frame=page.frameLocator('iframe');
    await frame.locator(`main[data-scenario="${scenario}"]`).waitFor();
    const dock=await frame.locator('.controls-dock').evaluate(dock=>{
      const bounds=dock.getBoundingClientRect(),actions=dock.querySelector('.slot-actions').getBoundingClientRect(),hud=dock.querySelector('.hud').getBoundingClientRect();
      return bounds.top>=0&&bounds.bottom<=innerHeight&&bounds.left>=0&&bounds.right<=innerWidth&&Math.abs(hud.top-actions.bottom-8)<1&&document.documentElement.scrollHeight<=innerHeight;
    });
    assert(dock,`Paysage ${scenario} : accès directs au-dessus du panneau, sans débordement.`);
  }
  await page.getByRole('button',{name:'Mobile portrait',exact:true}).click();
  const frame=page.frameLocator('iframe');
  await frame.getByRole('button',{name:'Augmenter la mise',exact:true}).click();
  await frame.locator('.amount-value').filter({hasText:/^20$/}).waitFor();
  await frame.getByRole('button',{name:'Lancer',exact:true}).waitFor();
  await frame.getByRole('button',{name:'Modifier le montant de la mise',exact:true}).click();
  await frame.getByRole('group',{name:'Montants de mise'}).getByRole('button',{name:'500 FCFA',exact:true}).click();
  await frame.getByRole('button',{name:'Terminé',exact:true}).click();
  await frame.getByRole('checkbox',{name:'Activer le turbo',exact:true}).check();
  assert(await frame.getByRole('checkbox',{name:'Activer le turbo',exact:true}).isChecked());
  await frame.getByRole('button',{name:'Configurer le jeu automatique',exact:true}).click();
  assert.equal(await frame.getByRole('tab',{name:'Auto',exact:true}).getAttribute('aria-selected'),'true');
  await frame.getByRole('tab',{name:'Manuel',exact:true}).click();
  await frame.getByRole('button',{name:'Revenir au jeu',exact:true}).click();
  await frame.getByRole('button',{name:'Lancer',exact:true}).click();
  await frame.locator('main[data-scenario="spinning"]').waitFor();
  assert(await frame.getByRole('button',{name:'Augmenter la mise',exact:true}).isDisabled());
  assert(await frame.getByRole('checkbox',{name:'Activer le turbo',exact:true}).isDisabled());
  assert(await frame.getByRole('button',{name:'Achat de bonus',exact:true}).isDisabled());
  await frame.locator('main[data-scenario="win"]').waitFor();
  await frame.locator('.result').getByText('+1 250 FCFA',{exact:true}).waitFor();
  await frame.getByRole('button',{name:'Augmenter la mise',exact:true}).click();
  await frame.locator('.result').getByText('+1 250 FCFA',{exact:true}).waitFor();
  await page.locator('iframe').screenshot({path:'reports/result.png'});
  await frame.getByRole('checkbox',{name:'Activer le turbo',exact:true}).uncheck();
  await frame.getByRole('button',{name:'Configurer le jeu automatique',exact:true}).click();
  await frame.getByRole('tab',{name:'Auto',exact:true}).click();
  assert.equal(await frame.getByRole('dialog').count(),1,'Tous les modes utilisent la même fenêtre.');
  assert.equal(await frame.locator('.slot-actions input[type="checkbox"]').count(),1,'Un seul réglage de vitesse, en accès direct.');
  assert.equal(await frame.getByRole('dialog').getByRole('checkbox',{name:'Activer le turbo',exact:true}).count(),0,'Pas de doublon Turbo dans la fenêtre Auto.');
  assert.equal(await frame.locator('.hud .auto-button').getAttribute('data-mode'),'manual','Consulter Auto ne lance pas de série.');
  await page.locator('iframe').screenshot({path:'reports/options.png'});
  await frame.getByRole('button',{name:'Lancer 3 tours',exact:true}).click();
  await frame.getByRole('button',{name:'Arrêter le jeu automatique',exact:true}).waitFor();
  assert(await frame.getByRole('checkbox',{name:'Activer le turbo',exact:true}).isDisabled(),'La vitesse est verrouillée pendant la série.');
  await frame.getByRole('button',{name:'Configurer le jeu automatique',exact:true}).click();
  await frame.getByRole('dialog',{name:'Modes de jeu',exact:true}).waitFor();
  assert.equal(await frame.locator('.primary').getAttribute('data-action'),'cancel','Ouvrir le menu ne doit pas arrêter la série.');
  await frame.getByRole('button',{name:'Fermer les modes de jeu',exact:true}).click();
  await frame.locator('.primary[data-action="bet"]:enabled').waitFor({timeout:10000});
  await frame.locator('main:not([data-scenario="spinning"])').waitFor();
  await frame.getByRole('button',{name:'Configurer le jeu automatique',exact:true}).click();
  await frame.getByRole('tab',{name:'Auto',exact:true}).click();
  await frame.getByRole('button',{name:'Lancer 3 tours',exact:true}).click();
  await frame.getByRole('button',{name:'Arrêter le jeu automatique',exact:true}).click();
  await frame.getByRole('button',{name:'Configurer le jeu automatique',exact:true}).waitFor();
  await frame.locator('main:not([data-scenario="spinning"])').waitFor();
  await frame.getByRole('button',{name:'Achat de bonus',exact:true}).click();
  assert.equal(await frame.getByRole('tab',{name:'Gratuits',exact:true}).getAttribute('aria-selected'),'true','Achat de bonus ouvre directement le bonus existant.');
  assert.equal(await frame.locator('main[data-scenario="freeSpins"]').count(),0,'Ouvrir le bonus ne le lance pas.');
  await frame.getByRole('button',{name:'Commencer les 5 tours',exact:true}).click();
  await frame.locator('main[data-scenario="freeSpins"]').waitFor();
  assert(await frame.getByRole('button',{name:'Augmenter la mise',exact:true}).isDisabled());
  assert(await frame.getByRole('button',{name:'Achat de bonus',exact:true}).isDisabled(),'Pas de second bonus pendant les tours gratuits.');
  await frame.getByRole('button',{name:'Lancer un tour gratuit',exact:true}).click();
  await frame.locator('main:not([data-scenario="spinning"])').waitFor();
  await frame.getByRole('button',{name:'Lancer un tour gratuit',exact:true}).waitFor();
  await frame.getByRole('button',{name:'Ouvrir le menu',exact:true}).click();
  await frame.getByRole('dialog',{name:'Paramètres et règles'}).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await frame.getByRole('dialog').isVisible(),false);
  await verifyMotion(browser, url);
  assert.deepEqual(errors,[]);
  console.log('OK mise, turbo, lancer, gain figé, auto/arrêt, tours gratuits et fenêtres.');
} finally {await browser?.close();server.kill();}
