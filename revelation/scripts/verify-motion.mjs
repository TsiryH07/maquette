import assert from 'node:assert/strict';
export async function verifyMotion(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'no-preference',
    recordVideo: { dir: 'reports/motion', size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  const video = page.video();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url + '/scene');
    await page.getByRole('button', { name: 'Augmenter la mise', exact: true }).click();
    await page.locator('.dock .bet-value').filter({hasText:'20'}).waitFor();
    // Le montant de la mise rebondit à chaque changement (dock portrait).
    const ticking = await page.evaluate(async () => {
      document.querySelector('.dock .stepper-btn.up').click();
      await new Promise(resolve => requestAnimationFrame(resolve));
      return document.querySelector('.dock .bet-value').getAnimations().some(animation => animation.playState === 'running');
    });
    assert(ticking, 'Le montant de la mise doit rebondir quand il change.');
    await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url + '/scene');
    await page.getByRole('button', { name: 'Augmenter la mise', exact: true }).click();
    const running = await page.locator('.dock').evaluate(dock => dock.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length);
    assert.equal(running, 0, 'Le mode mouvement réduit doit supprimer les animations du dock.');
    assert.deepEqual(errors, []);
    console.log('OK rebond du montant de mise et mode mouvement réduit.');
  } finally {
    await context.close();
    await video.saveAs('reports/animations.webm');
  }
}
