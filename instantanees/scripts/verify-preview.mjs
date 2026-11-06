import { verifyMotion } from './verify-motion.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const port = process.argv.includes('--preview') ? 4081 : 3081;
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...(process.argv.includes('--preview') ? ['preview'] : []), '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { windowsHide: true, stdio: ['ignore','pipe','pipe'] });
let logs = '';
server.stdout.on('data', chunk => logs += chunk);
server.stderr.on('data', chunk => logs += chunk);
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(logs);
    try { ready = (await fetch(url)).ok; } catch { /* démarrage */ }
    if (ready) break;
    await delay(500);
  }
  assert(ready, logs);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.getByRole('heading', { name: 'Atelier de préparation' }).waitFor();
  await mkdir('reports', { recursive: true });
  for (const [label, layout, width, height] of [['Ordinateur','desktop',1440,900],['Tablette','tablet',900,900],['Mobile portrait','portrait',390,844],['Mobile paysage','landscape',844,390]]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    const scene = page.frameLocator('iframe');
    await scene.locator(`main[data-layout="${layout}"]`).waitFor();
    await scene.locator('.die').waitFor();
    const dimensions = await scene.locator('body').evaluate(() => ({ width: innerWidth, height: innerHeight, overflowX: document.documentElement.scrollWidth > innerWidth, overflowY: document.documentElement.scrollHeight > innerHeight }));
    assert.deepEqual(dimensions, { width, height, overflowX: false, overflowY: false });
    const primary = await scene.locator('.primary').boundingBox();
    const frame = await page.locator('iframe').boundingBox();
    assert(primary.y >= frame.y && primary.y + primary.height <= frame.y + frame.height + 1);
    await page.locator('iframe').screenshot({ path: `reports/${layout}.png` });
    console.log(`OK ${label} : ${width}×${height}, aucun débordement.`);
  }

  await page.getByRole('button', { name: 'Mobile portrait', exact: true }).click();
  const scene = page.frameLocator('iframe');
  await scene.getByRole('button', { name: 'Augmenter la mise' }).click();
  await scene.locator('.amount-value').filter({ hasText: /^20$/ }).waitFor();
  await scene.getByRole('button', { name: 'Jouer', exact: true }).waitFor();
  await scene.getByRole('button', { name: 'Modifier le montant de la mise', exact: true }).click();
  await scene.getByRole('group', { name: 'Montants de mise' }).getByRole('button', { name: '100 FCFA', exact: true }).click();
  await scene.getByRole('button', { name: 'Terminé', exact: true }).click();
  await scene.getByRole('group', { name: 'Niveaux de difficulté' }).getByRole('button', { name: 'Prudent 2 ou plus', exact: true }).click();
  assert.equal((await scene.getByLabel('Gain affiché', { exact: true }).textContent()).trim(), '115,00');
  await scene.getByRole('group', { name: 'Niveaux de difficulté' }).getByRole('button', { name: 'Audacieux Un 6', exact: true }).click();
  assert.equal((await scene.getByLabel('Gain affiché', { exact: true }).textContent()).trim(), '560,00');
  await scene.getByRole('button', { name: 'Jouer', exact: true }).click();
  await scene.locator('main[data-scenario="playing"]').waitFor();
  assert(await scene.getByRole('button', { name: 'Augmenter la mise' }).isDisabled());
  await scene.locator('main[data-scenario="won"]').waitFor();
  await scene.getByLabel('Dé : 6', { exact: true }).waitFor();
  assert.equal((await scene.getByLabel('Gain affiché', { exact: true }).textContent()).trim(), '560,00');
  await page.locator('iframe').screenshot({ path: 'reports/result.png' });
  await scene.getByRole('button', { name: 'Augmenter la mise' }).click();
  assert.equal((await scene.getByLabel('Gain affiché', { exact: true }).textContent()).trim(), '560,00');
  await scene.getByRole('button', { name: 'Ouvrir le jeu automatique', exact: true }).click();
  await scene.getByRole('dialog', { name: 'Jeu automatique' }).waitFor();
  await scene.getByRole('checkbox', { name: 'Activer le jeu automatique', exact: true }).check();
  await scene.getByRole('group', { name: 'Nombre de parties' }).getByRole('button', { name: '25 parties', exact: true }).click();
  await scene.getByRole('group', { name: 'Nombre de parties' }).locator('.indicator').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
  await page.locator('iframe').screenshot({ path: 'reports/options.png' });
  await scene.getByRole('button', { name: 'Terminé', exact: true }).click();
  await scene.getByRole('button', { name: 'Modifier le montant de la mise', exact: true }).click();
  await scene.getByRole('group', { name: 'Montants de mise' }).getByRole('button', { name: '10 FCFA', exact: true }).click();
  await scene.getByRole('button', { name: 'Terminé', exact: true }).click();
  await scene.locator('.amount-value').filter({ hasText: /^10$/ }).waitFor();
  await scene.getByRole('button', { name: 'Rejouer', exact: true }).click();
  await scene.locator('main[data-scenario="lost"]').waitFor();
  assert.equal((await scene.getByLabel('Gain affiché', { exact: true }).textContent()).trim(), '0,00');
  await scene.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await scene.getByRole('dialog', { name: 'Menu du jeu' }).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await scene.getByRole('dialog').isVisible(), false);
  await page.goto(`${url}/scene?scenario=won`);
  await page.locator('main[data-scenario="won"]').waitFor();
  await verifyMotion(browser, url);
  assert.deepEqual(errors, []);
  console.log('OK risque, gains à décimales, résultat figé, lancer, résultat sans gain, choix de mise et fenêtres. Aucune erreur JavaScript.');
} finally {
  await browser?.close();
  server.kill();
}
