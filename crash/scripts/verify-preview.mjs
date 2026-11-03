import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const production = process.argv.includes('--preview');
const port = production ? 4051 : 3051;
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js', ...(production ? ['preview'] : []),
  '--host', '127.0.0.1', '--port', String(port), '--strictPort',
], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
server.stdout.on('data', (chunk) => { logs += chunk; });
server.stderr.on('data', (chunk) => { logs += chunk; });
let browser;

try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(`Le serveur s'est arrêté : ${logs}`);
    try { ready = (await fetch(url)).ok; } catch { /* attendre le serveur */ }
    if (ready) break;
    await delay(500);
  }
  assert(ready, `Le serveur n'est pas prêt : ${logs}`);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors = [];
  let checkpoint = 'ouverture';
  page.on('pageerror', (error) => errors.push(`${checkpoint} : ${error.message}`));
  await page.goto(url);
  await page.getByRole('heading', { name: 'Atelier de préparation' }).waitFor();
  await mkdir('reports', { recursive: true });
  const formats = [
    ['Ordinateur', 'desktop', 1440, 900],
    ['Tablette', 'tablet', 900, 900],
    ['Mobile portrait', 'portrait', 390, 844],
    ['Mobile paysage', 'landscape', 844, 390],
  ];

  for (const [label, layout, width, height] of formats) {
    checkpoint = label;
    await page.getByRole('button', { name: label, exact: true }).click();
    const frame = page.frameLocator('iframe');
    await frame.locator(`main[data-layout="${layout}"]`).waitFor();
    await frame.locator('[data-pixi-ready="true"]').waitFor();
    const dimensions = await frame.locator('body').evaluate(() => ({
      width: innerWidth, height: innerHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      verticalOverflow: document.documentElement.scrollHeight > innerHeight,
    }));
    assert.deepEqual(dimensions, { width, height, horizontalOverflow: false, verticalOverflow: false });
    const primaryBounds = await frame.locator('.primary').boundingBox();
    const iframeBounds = await page.locator('iframe').boundingBox();
    assert(primaryBounds.y >= iframeBounds.y && primaryBounds.y + primaryBounds.height <= iframeBounds.y + iframeBounds.height + 1, 'Le bouton principal doit rester entièrement visible.');
    await page.locator('iframe').screenshot({ path: `reports/${layout}.png` });
    await frame.locator('.hud').screenshot({ path: `reports/hud-${layout}.png` });
    console.log(`OK ${label} : ${width} × ${height}, PixiJS prêt, aucun débordement.`);
  }

  for (const scenario of ['queued', 'running', 'cashedOut', 'ended', 'betting']) {
    checkpoint = scenario;
    await page.getByRole('combobox', { name: 'Moment de la partie' }).selectOption(scenario);
    await page.frameLocator('iframe').locator(`main[data-scenario="${scenario}"]`).waitFor();
    if (scenario === 'running') {
      await page.frameLocator('iframe').getByRole('button', { name: /^Encaisser / }).waitFor();
    }
  }

  checkpoint = 'commandes interactives';
  await page.getByRole('button', { name: 'Mobile portrait', exact: true }).click();
  const hud = page.frameLocator('iframe');
  await hud.getByRole('button', { name: 'Augmenter la mise' }).click();
  await hud.getByRole('button', { name: 'Miser 20 FCFA', exact: true }).waitFor();
  await hud.getByRole('button', { name: 'Diminuer la mise' }).click();
  await hud.getByRole('group', { name: 'Montants rapides' }).getByRole('button', { name: '500 FCFA', exact: true }).click();
  await hud.getByRole('button', { name: 'Miser 500 FCFA', exact: true }).waitFor();
  await hud.getByRole('button', { name: 'Ouvrir les automatismes', exact: true }).click();
  assert(await hud.getByRole('button', { name: 'Augmenter le multiplicateur automatique' }).isDisabled());
  await hud.getByRole('checkbox', { name: 'Encaissement automatique', exact: true }).check();
  assert(await hud.getByRole('checkbox', { name: 'Encaissement automatique', exact: true }).isChecked());
  await page.locator('iframe').screenshot({ path: 'reports/automatic-enabled.png' });
  await hud.getByRole('button', { name: 'Augmenter le multiplicateur automatique' }).click();
  assert.equal(await hud.getByLabel('Multiplicateur d’encaissement automatique', { exact: true }).textContent(), '×2,10');
  await hud.getByRole('checkbox', { name: 'Pari automatique', exact: true }).check();
  await page.locator('iframe').screenshot({ path: 'reports/options.png' });
  await hud.getByRole('button', { name: 'Terminé', exact: true }).click();
  await hud.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await hud.getByRole('dialog', { name: 'Menu du jeu' }).waitFor();
  await hud.getByRole('button', { name: 'Terminé', exact: true }).click();
  await hud.getByRole('button', { name: 'Miser 500 FCFA', exact: true }).click();
  await hud.locator('main[data-scenario="running"]').waitFor();
  assert(await hud.getByRole('button', { name: 'Augmenter la mise' }).isDisabled());
  await page.locator('iframe').screenshot({ path: 'reports/running.png' });
  await hud.getByRole('button', { name: /^Encaisser / }).click();
  await hud.locator('main[data-scenario="cashedOut"]').waitFor();
  assert.equal((await hud.getByLabel('Montant de la manche', { exact: true }).textContent()).replace(/\s/g, ''), '1175,00');
  await hud.getByRole('button', { name: 'Augmenter la mise' }).click();
  assert.equal((await hud.getByLabel('Montant de la manche', { exact: true }).textContent()).replace(/\s/g, ''), '1175,00');
  await hud.getByRole('button', { name: 'Diminuer la mise' }).click();
  await page.locator('iframe').screenshot({ path: 'reports/cashed-out.png' });
  await page.getByRole('combobox', { name: 'Moment de la partie' }).selectOption('queued');
  await hud.locator('main[data-scenario="queued"]').waitFor();
  assert(await hud.getByRole('button', { name: 'Augmenter la mise' }).isDisabled());
  await hud.getByRole('button', { name: 'Annuler la mise', exact: true }).click();
  await hud.locator('main[data-scenario="betting"]').waitFor();
  await hud.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await page.keyboard.press('Escape');
  assert.equal(await hud.getByRole('dialog').isVisible(), false);
  console.log('OK mise, options, encaissement, montant encaissé conservé et annulation avant le départ.');

  checkpoint = 'atelier sur mobile';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Ordinateur', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto(`${url}/scene?scenario=running`);
  await page.locator('main[data-layout="portrait"][data-scenario="running"]').waitFor();
  await page.locator('[data-pixi-ready="true"]').waitFor();
  assert.deepEqual(errors, [], `Erreurs du navigateur : ${errors.join('\n')}`);
  console.log('OK scénarios, atelier sur mobile et accès direct à la scène. Aucune erreur JavaScript.');
} finally {
  await browser?.close();
  server.kill();
}
