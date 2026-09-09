// Reproduce: start Vite on port 5174, then node review/audit.mjs.
// Uses isolated browser contexts and synthetic profiles; does not change app code.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('review/evidence', { recursive: true });
const browser = await chromium.launch();
const results = { viewports: [], checks: {}, errors: [] };
const sizes = [[320,568],[360,640],[375,667],[390,844],[412,915],[667,375],[844,390],[700,600],[768,1024],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080]];
async function open(width, height, touch = false) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch });
  const page = await context.newPage();
  const screenshot = page.screenshot.bind(page);
  page.screenshot = options => screenshot({ ...options, animations: 'disabled' });
  page.on('pageerror', error => results.errors.push(error.message));
  await page.goto('http://127.0.0.1:5174/');
  await page.locator('.hero-cta').waitFor();
  return { context, page };
}
async function measure(page) {
  return page.evaluate(() => {
    const rect = selector => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), width: Math.round(r.width), height: Math.round(r.height), inViewport: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth };
    };
    return {
      width: innerWidth, height: innerHeight, pageHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
      scrollY, words: document.body.innerText.trim().split(/\s+/).length,
      cta: rect('.hero-cta'), garden: rect('.game-page .garden'), baskets: rect('.game-page .basket-row'),
      sortCard: rect('.sorting-card'), next: rect('.feedback-panel > .button'),
      heading: rect('.phase-heading'), tutorialAction: rect('.tutorial-page > .button'),
      resultsActions: rect('.result-actions'), footer: rect('.site-footer'),
    };
  });
}
async function seed(page, mode = 'training', calibration = false) {
  await page.evaluate(async ({ mode, calibration }) => {
    const storage = await import('/src/data/storage.ts');
    const { createSession } = await import('/src/core/engine.ts');
    const { defaults, protocolFor, viewportKey } = await import('/src/core/protocol.ts');
    const data = await storage.loadData();
    await storage.saveProfile({ ...data.profiles[0], learned: true });
    if (calibration) await storage.savePreferences({ ...defaults, calibration: { pixelsPerCm: 37.8, viewport: viewportKey() } });
    await storage.saveSession(createSession(data.profiles[0].id, protocolFor(mode), { viewport: { width: innerWidth, height: innerHeight }, pixelRatio: devicePixelRatio }, 42));
  }, { mode, calibration });
  await page.reload();
  await page.locator('.hero-cta').waitFor();
  await page.clock.install();
  await page.getByRole('button', { name: 'Return to my harvest' }).click();
}
async function phase(page, target) {
  for (let i = 0; i < 400; i++) {
    const current = await page.locator('.game-page').getAttribute('data-phase');
    if (current === target) return;
    if (current === 'interrupted' || current === 'feedback') throw new Error(`Expected ${target}, found ${current}`);
    await page.clock.runFor(100);
  }
  throw new Error(`Never reached ${target}`);
}
for (const [width, height] of sizes) {
  const { page, context } = await open(width, height, width < 500);
  const row = { viewport: `${width}x${height}`, home: await measure(page) };
  if ([375,390,1366].includes(width)) await page.screenshot({ path: `review/evidence/home-${width}x${height}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Start my harvest' }).click();
  row.tutorial = await measure(page);
  await page.goto('http://127.0.0.1:5174/');
  await seed(page);
  row.ready = await measure(page);
  await page.getByRole('button', { name: 'Let’s begin' }).click();
  await page.evaluate(() => scrollTo(0, 0));
  row.cue = await measure(page);
  await phase(page, 'sort');
  row.sort = await measure(page);
  if ([375,390,700,1366,844].includes(width)) await page.screenshot({ path: `review/evidence/sort-${width}x${height}.png` });
  await phase(page, 'retention');
  row.retention = await measure(page);
  await phase(page, 'recall');
  row.recall = await measure(page);
  await page.clock.runFor(20200);
  row.failedFeedback = await measure(page);
  if ([375,390,1366].includes(width)) await page.screenshot({ path: `review/evidence/failed-feedback-${width}x${height}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Finish for now', exact: true }).click();
  await page.clock.runFor(100);
  row.results = await measure(page);
  if (width === 390) await page.screenshot({ path: 'review/evidence/results-390x844.png', fullPage: true });
  results.viewports.push(row);
  await context.close();
  console.log(`Measured ${row.viewport}`);
}

// Complete first-visit phone onboarding with real touch input, then attempt check-in.
{
  const { page, context } = await open(390, 844, true);
  await page.clock.install();
  await page.getByRole('button', { name: 'Memory check-in', exact: true }).tap();
  await page.getByRole('button', { name: 'Start my harvest' }).tap();
  const headings = [await page.locator('h1').innerText()];
  await page.getByRole('button', { name: 'Try sorting' }).tap();
  await page.getByRole('button', { name: 'Market, good pepper, A or left arrow' }).tap();
  await page.getByRole('button', { name: 'Sauce, worm pepper, F or right arrow' }).tap();
  await page.getByRole('button', { name: 'Try remembering' }).tap();
  await page.clock.runFor(3500);
  await page.locator('[data-cell="1"]').tap();
  await page.clock.runFor(180);
  await page.locator('[data-cell="6"]').tap();
  await page.getByRole('button', { name: 'Start combined practice' }).tap();
  headings.push(await page.locator('h1').innerText());
  await page.getByRole('button', { name: 'Let’s begin' }).tap();
  for (let round = 0; round < 2; round++) {
    for (let item = 0; item < 2; item++) {
      await phase(page, 'sort');
      const worm = (await page.locator('.sorting-pepper').getAttribute('aria-label')).includes('with a worm');
      await page.getByRole('button', { name: worm ? 'Sauce, worm pepper, F or right arrow' : 'Market, good pepper, A or left arrow' }).tap();
      if (item === 0) await phase(page, 'cue');
    }
    await phase(page, 'recall');
    // Deterministic answer read is only for the automation; no hooks added to app.
    const cells = await page.evaluate(async () => {
      const s = await import('/src/data/storage.ts');
      return (await s.listSessions())[0].trials.at(-1).cells;
    });
    for (const cell of cells) { await page.clock.runFor(180); await page.locator(`[data-cell="${cell}"]`).tap(); }
    await page.getByRole('button', { name: round === 0 ? 'Next harvest' : 'See my harvest', exact: true }).tap();
    await page.clock.runFor(100);
  }
  headings.push(await page.locator('h1').innerText());
  await page.getByRole('button', { name: 'Start my session' }).tap();
  results.checks.phoneCheckIn = { headings, finalScreen: await page.locator('h1').innerText(), notice: await page.locator('.notice').innerText() };
  await page.screenshot({ path: 'review/evidence/late-phone-checkin-rejection.png', fullPage: true });
  await context.close();
}
// Focus continuity and response delivery for a keyboard-only player.
{
  const { page, context } = await open(1366, 768);
  await seed(page);
  await page.getByRole('button', { name: 'Let’s begin' }).focus();
  await page.keyboard.press('Enter');
  const focused = () => page.evaluate(() => ({ tag: document.activeElement.tagName, text: document.activeElement.getAttribute('aria-label') || document.activeElement.innerText.slice(0,80) }));
  const afterStart = await focused();
  await phase(page, 'recall');
  const atRecall = await focused();
  const tabs = [];
  for (let i=0; i<13; i++) { await page.keyboard.press('Tab'); tabs.push(await focused()); }
  results.checks.keyboard = { afterStart, atRecall, tabs };
  await context.close();
}
// Saved calibration can override the height-aware CSS garden limit.
{
  const { page, context } = await open(1366, 768);
  await seed(page, 'training', true);
  await page.getByRole('button', { name: 'Let’s begin' }).click();
  await page.evaluate(() => scrollTo(0, 0));
  results.checks.calibrated = await measure(page);
  await page.screenshot({ path: 'review/evidence/calibrated-1366x768.png' });
  await context.close();
}
await browser.close();
await writeFile('review/evidence/measurements.json', JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results.checks, null, 2));
console.log(`Browser errors: ${results.errors.length}`);
