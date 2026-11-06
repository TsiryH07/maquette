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
    await page.locator('.amount-value').filter({hasText:'20'}).waitFor();
    // Les montants rapides restent visibles en paysage, le portrait garde deux lignes.
    await page.setViewportSize({ width: 844, height: 390 });
    await page.locator('.hud .chips button').first().waitFor();
    await page.locator('.hud .chips button').first().click();
    const motion = await page.locator('.hud .chips').evaluate(async chips => {
      const indicator = chips.querySelector('.indicator');
      const target = chips.querySelectorAll('button')[2];
      const start = indicator.getBoundingClientRect().left;
      target.click();
      const positions = [];
      for (let frame = 0; frame < 14; frame++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        positions.push(indicator.getBoundingClientRect().left);
      }
      await new Promise(resolve => setTimeout(resolve, 400));
      return { start, positions, end: indicator.getBoundingClientRect().left, target: target.getBoundingClientRect().left };
    });
    assert(Math.abs(motion.end - motion.start) > 10, 'La sélection doit changer de position.');
    assert(motion.positions.some(value => value > motion.start + 1 && value < motion.end - 1), 'La sélection doit glisser entre les montants.');
    assert(Math.abs(motion.end - motion.target) < 1, 'La sélection doit arriver sous le montant choisi.');
    await page.locator('.primary').hover();
    await page.waitForFunction(() => document.querySelector('.primary .shine').getAnimations().some(animation => animation.playState === 'running'));
    await page.mouse.move(0, 0);
    await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url + '/scene');
    await page.getByRole('button', { name: 'Augmenter la mise', exact: true }).click();
    const running = await page.locator('.hud').evaluate(hud => hud.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length);
    assert.equal(running, 0, 'Le mode mouvement réduit doit supprimer les animations du panneau.');
    assert.deepEqual(errors, []);
    console.log('OK glissement de la sélection, reflet du bouton et mode mouvement réduit.');
  } finally {
    await context.close();
    await video.saveAs('reports/animations.webm');
  }
}
