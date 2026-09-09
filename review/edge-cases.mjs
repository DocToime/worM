import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const evidence = {};
evidence.errors = [];
async function setup(width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  page.on('pageerror', error => evidence.errors.push(error.message));
  const screenshot = page.screenshot.bind(page);
  page.screenshot = options => screenshot({ ...options, animations: 'disabled' });
  await page.goto('http://127.0.0.1:5174/');
  await page.locator('.hero-cta').waitFor();
  await page.evaluate(async () => {
    const s = await import('/src/data/storage.ts');
    const data = await s.loadData();
    await s.saveProfile({ ...data.profiles[0], learned: true });
  });
  await page.reload();
  await page.locator('.hero-cta').waitFor();
  await page.clock.install();
  return { page, context };
}
async function geometry(page) {
  return page.evaluate(() => ({
    scrollY, height: innerHeight, focused: document.activeElement.tagName,
    elements: [...document.querySelectorAll('.game-topline,.game-meta,.garden,.phase-heading,.basket-row,.feedback-panel > .button')].map(el => {
      const r = el.getBoundingClientRect();
      return { class: el.className, top: r.top, bottom: r.bottom };
    }),
  }));
}
{
  const { page, context } = await setup(375, 667);
  await page.locator('.hero-cta').click();
  evidence.readyBeforeClick = await geometry(page);
  await page.getByRole('button', { name: 'Let’s begin' }).click();
  evidence.firstCueAfterClick = await geometry(page);
  await page.screenshot({ path: 'review/evidence/first-cue-after-start-375x667.png' });
  await page.clock.runFor(1000);
  await page.getByRole('button', { name: 'Market, good pepper, A or left arrow' }).click();
  evidence.afterAutoScrollToSort = await geometry(page);
  await page.clock.runFor(800);
  evidence.nextCueAfterSort = await geometry(page);
  await page.screenshot({ path: 'review/evidence/next-cue-after-sort-375x667.png' });
  await context.close();
}
{
  const { page, context } = await setup(1366, 768);
  await page.locator('.advanced-mode summary').click();
  await page.getByRole('button', { name: 'Start original-style protocol' }).click();
  await page.getByRole('button', { name: 'Finish for now', exact: true }).click();
  await page.clock.runFor(100);
  evidence.finishBeforeFirstRound = { bodyText: await page.locator('body').innerText(), errors: [...evidence.errors] };
  await page.screenshot({ path: 'review/evidence/finish-before-start-crash.png' });
  await page.reload();
  await page.locator('.hero-cta').waitFor();
  await page.locator('.advanced-mode summary').click();
  await page.getByRole('button', { name: 'Start original-style protocol' }).click();
  await page.getByRole('button', { name: 'Let’s begin' }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Finish session', exact: true }).click();
  await page.clock.runFor(100);
  await page.getByRole('button', { name: 'Back to my garden', exact: true }).click();
  evidence.modeAfterOriginal = await page.evaluate(() => ({ description: document.querySelector('.mode-description').innerText, modes: [...document.querySelectorAll('.mode-selector button')].map(e => ({ text: e.innerText, pressed: e.getAttribute('aria-pressed') })), meta: document.querySelector('.hero-meta').innerText }));
  await page.locator('.hero-cta').click();
  evidence.modeStarted = await page.locator('.game-topline > .eyebrow').innerText();
  await page.getByRole('button', { name: 'Let’s begin' }).click();
  const styles = await page.evaluate(() => ['.phase-heading p', '.game-meta', '.basket-button small', '.game-footnote'].map(selector => { const e = document.querySelector(selector), s = getComputedStyle(e); return { selector, color: s.color, fontSize: s.fontSize, bodyBackground: getComputedStyle(document.documentElement).backgroundColor }; }));
  evidence.textStyles = styles;
  // No actual device/browser zoom: explicitly emulate a CSS viewport resize.
  await page.setViewportSize({ width: 700, height: 599 });
  evidence.resize = { phase: await page.locator('.game-page').getAttribute('data-phase'), message: await page.locator('.break-panel').innerText() };
  await context.close();
}
await browser.close();
await writeFile('review/evidence/edge-cases.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
