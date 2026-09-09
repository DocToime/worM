// Stable stills and a focused check at the advertised assessment minimum.
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const checks = {};
for (const [width, height] of [[375,667],[390,844],[1366,768],[1440,900],[700,600]]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5174/');
  await page.locator('.hero-cta').waitFor();
  if (width !== 700) await page.screenshot({ path: `review/evidence/home-${width}x${height}.png`, fullPage: true, animations: 'disabled' });
  if ([1440,700].includes(width)) {
    await page.evaluate(async () => {
      const s = await import('/src/data/storage.ts');
      const d = await s.loadData();
      await s.saveProfile({ ...d.profiles[0], learned: true });
    });
    await page.reload();
    await page.locator('.hero-cta').waitFor();
    await page.clock.install();
    if (width === 700) await page.getByRole('button', { name: 'Memory check-in', exact: true }).click();
    await page.locator('.hero-cta').click();
    await page.getByRole('button', { name: 'Let’s begin' }).click();
    await page.clock.runFor(1100);
    await page.evaluate(() => scrollTo(0,0));
    checks[`${width}x${height}`] = await page.evaluate(() => {
      const r = document.querySelector('.basket-row').getBoundingClientRect();
      return { mode: document.querySelector('.game-topline > .eyebrow').innerText, phase: document.querySelector('.game-page').dataset.phase, baskets: { top: r.top, bottom: r.bottom }, viewportHeight: innerHeight };
    });
    await page.screenshot({ path: `review/evidence/${width === 700 ? 'assessment' : 'sort'}-${width}x${height}.png`, animations: 'disabled' });
  }
  await context.close();
}
await browser.close();
await writeFile('review/evidence/minimum-assessment.json', JSON.stringify(checks, null, 2) + '\n');
console.log(JSON.stringify(checks, null, 2));
