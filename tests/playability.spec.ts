import { expect, test, type Page } from '@playwright/test';
import { generate, trialSeed } from '../src/core/random';
import { protocolFor } from '../src/core/protocol';
import type { Mode } from '../src/core/types';

async function ready(page: Page, mode: Mode = 'training', calibrated = false) {
  await page.goto('/');
  await page.locator('.hero-cta').waitFor();
  await page.evaluate(async ({ mode, calibrated }) => {
    const storageUrl = '/src/data/storage.ts', engineUrl = '/src/core/engine.ts', protocolUrl = '/src/core/protocol.ts';
    const storage = await import(storageUrl);
    const { createSession } = await import(engineUrl);
    const { defaults, protocolFor, viewportKey } = await import(protocolUrl);
    const data = await storage.loadData();
    await storage.saveProfile({ ...data.profiles[0], learned: true });
    if (calibrated) await storage.savePreferences({ ...defaults, calibration: { pixelsPerCm: 37.8, viewport: viewportKey() } });
    await storage.saveSession(createSession(data.profiles[0].id, protocolFor(mode), { viewport: { width: innerWidth, height: innerHeight } }, 42));
  }, { mode, calibrated });
  await page.reload();
  await page.locator('.hero-cta').waitFor();
  await page.clock.install();
  await page.locator('.hero-cta').click();
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'ready');
}
async function fits(page: Page, selector: string) {
  const dimensions = await page.locator(selector).evaluate(el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height, viewportWidth: innerWidth, viewportHeight: innerHeight, scroll: scrollY };
  });
  expect(dimensions.scroll, selector).toBe(0);
  expect(dimensions.top, selector).toBeGreaterThanOrEqual(0);
  expect(dimensions.left, selector).toBeGreaterThanOrEqual(0);
  expect(dimensions.bottom, selector).toBeLessThanOrEqual(dimensions.viewportHeight + 1);
  expect(dimensions.right, selector).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  return dimensions;
}
async function phase(page: Page, target: string) {
  const steps: Record<string, number> = { cue: 1000, sort: 3500, 'sort-feedback': 400, interval: 400, 'green-hold': 500, retention: 5000, recall: 20000 };
  for (let i = 0; i < 20; i++) {
    const current = await page.locator('.game-page').getAttribute('data-phase');
    if (current === target) return;
    await page.clock.runFor((steps[current ?? ''] ?? 100) + 32);
  }
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', target);
}

for (const [width, height] of [[320,568],[360,640],[375,667],[390,844],[412,915],[667,375],[844,390],[700,600],[768,1024],[1024,768],[1280,720],[1366,768],[1440,820],[1440,821],[1440,900],[1920,1080]]) {
  test(`active play and failed feedback fit ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await ready(page);
    await page.getByRole('button', { name: 'Start round', exact: true }).click();
    const initial = await fits(page, '.game-page .garden');
    expect(initial.width).toBeGreaterThanOrEqual(180);
    await fits(page, '.game-topline');
    for (const target of ['sort', 'retention', 'recall']) {
      await phase(page, target);
      const rect = await fits(page, '.game-page .garden');
      expect(rect.top).toBeCloseTo(initial.top, 0);
      expect(rect.width).toBeCloseTo(initial.width, 0);
      await fits(page, '.basket-row');
      if (target === 'sort') await fits(page, '.sorting-pepper');
    }
    await phase(page, 'feedback');
    await expect(page.locator('.replay-garden')).toHaveCount(0);
    await fits(page, '.feedback-panel > .button');
    await page.getByRole('button', { name: 'Next round', exact: true }).click();
    await fits(page, '.game-page .garden');
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
    if ([375,390,844,1366,1440].includes(width)) await page.screenshot({ path: `test-results/compact-${width}x${height}.png` });
  });
}
for (const mode of ['training', 'assessment', 'reconstruction', 'practice'] as const) {
  test(`leaving an empty ${mode} session is safe`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await ready(page, mode);
    await page.getByRole('button', { name: 'Finish for now', exact: true }).click();
    await page.clock.runFor(100);
    await expect(page.locator('.hero-cta')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
for (const [width, height] of [[375,667],[700,600],[1366,768],[1440,900],[844,390]]) {
  test(`calibration respects available height at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await ready(page, width === 700 ? 'assessment' : 'training', true);
    await page.getByRole('button', { name: 'Start round', exact: true }).click();
    await page.clock.runFor(1032);
    await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'sort');
    await fits(page, '.garden');
    await fits(page, '.basket-row');
    await fits(page, '.sorting-pepper');
  });
}

test('phone home fits its primary flow and warns before a small-screen check-in', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await page.locator('.hero-cta').waitFor();
  await fits(page, '.hero-cta');
  await expect(page.getByRole('button', { name: 'Memory check-in', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Memory check-in', exact: true }).click();
  await expect(page.locator('#screen-hint')).toBeVisible();
  await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sort the peppers.' })).toBeVisible();
});

test('phone check-in records viewport and can start a round', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await page.evaluate(async () => {
    const url = '/src/data/storage.ts';
    const storage = await import(url);
    const data = await storage.loadData();
    await storage.saveProfile({ ...data.profiles[0], learned: true });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Memory check-in', exact: true }).click();
  await expect(page.locator('#screen-hint')).toBeVisible();
  await page.getByRole('button', { name: 'Start check-in', exact: true }).click();
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'cue');
  const environment = await page.evaluate(async () => {
    const url = '/src/data/storage.ts';
    const storage = await import(url);
    return (await storage.listSessions())[0].environment;
  });
  expect(environment.viewport).toEqual({ width: 360, height: 640 });
});

test('keyboard recall uses spatial arrows, announces picks and excludes disabled controls', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Start round', exact: true }).click();
  await phase(page, 'recall');
  await expect(page.locator('[data-cell="0"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-cell="4"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('1 of 2 picked');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-cell="4"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.clock.runFor(180);
  await page.keyboard.press('Space');
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'feedback');
  await expect(page.getByRole('heading', { name: 'Round complete.' })).toBeFocused();
});

test('original-style mode returns to an explicit training selection', async ({ page }) => {
  await ready(page, 'reconstruction');
  await page.getByRole('button', { name: 'Start round', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Finish session', exact: true }).click();
  await page.clock.runFor(100);
  await page.getByRole('button', { name: 'Back to garden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Daily training', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Start training', exact: true }).click();
  await expect(page.locator('.game-mode')).toHaveText('Daily training');
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'cue');
});

test('real touch events complete a phone round without scrolling', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5174', viewport: { width: 375, height: 667 }, hasTouch: true });
  const page = await context.newPage();
  const targets = generate(trialSeed(42, 0), 2, protocolFor('training'));
  await ready(page);
  await page.getByRole('button', { name: 'Start round', exact: true }).tap();
  for (let item = 0; item < 2; item++) {
    await phase(page, 'sort');
    await fits(page, '.basket-row');
    await page.getByRole('button', { name: targets.qualities[item] === 'good' ? 'Market, good pepper, A or left arrow' : 'Sauce, worm pepper, F or right arrow' }).tap();
    if (item === 0) await phase(page, 'cue');
  }
  await phase(page, 'recall');
  for (const cell of targets.cells) { await page.clock.runFor(180); await page.locator(`[data-cell="${cell}"]`).tap(); }
  await expect(page.locator('.feedback-measures')).toHaveText('2 / 2 memory2 / 2 sorting');
  await fits(page, '.feedback-panel > .button');
  await context.close();
});

test('first-visit touch practice unlocks training and stays unscored in history', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5174', viewport: { width: 375, height: 667 }, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('.hero-cta').waitFor();
  await page.clock.install();
  await page.getByRole('button', { name: 'Start training', exact: true }).tap();
  await page.getByRole('button', { name: 'Market, good pepper, A or left arrow' }).tap();
  await page.getByRole('button', { name: 'Sauce, worm pepper, F or right arrow' }).tap();
  await page.getByRole('button', { name: 'Try remembering' }).tap();
  await page.clock.runFor(3500);
  await page.locator('[data-cell="1"]').tap();
  await page.clock.runFor(180);
  await page.locator('[data-cell="6"]').tap();
  await page.getByRole('button', { name: 'Start practice', exact: true }).tap();
  for (let round = 0; round < 2; round++) {
    for (let item = 0; item < 2; item++) {
      await phase(page, 'sort');
      const worm = (await page.locator('.sorting-pepper').getAttribute('aria-label'))!.includes('with a worm');
      await fits(page, '.basket-row');
      await page.getByRole('button', { name: worm ? 'Sauce, worm pepper, F or right arrow' : 'Market, good pepper, A or left arrow' }).tap();
      if (item === 0) await phase(page, 'cue');
    }
    await phase(page, 'recall');
    const cells: number[] = await page.evaluate(async () => {
      const url = '/src/data/storage.ts';
      const storage = await import(url);
      return (await storage.listSessions())[0].trials.at(-1).cells;
    });
    for (const cell of cells) { await page.clock.runFor(180); await page.locator(`[data-cell="${cell}"]`).tap(); }
    await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'feedback');
    await page.getByRole('button', { name: round === 0 ? 'Next round' : 'Continue', exact: true }).tap();
    await page.clock.runFor(100);
  }
  await expect(page.getByRole('heading', { name: 'Ready for your session.' })).toBeVisible();
  await page.getByRole('button', { name: 'Start session', exact: true }).tap();
  await expect(page.locator('.game-mode')).toHaveText('Daily training');
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'cue');
  await page.getByRole('button', { name: 'Pause', exact: true }).tap();
  await page.getByRole('button', { name: 'Finish session', exact: true }).tap();
  await page.clock.runFor(100);
  await page.getByRole('button', { name: 'Progress', exact: true }).tap();
  const practice = page.locator('.history-row').filter({ hasText: 'Guided practice' });
  await expect(practice).toContainText('Passed');
  await expect(practice).toContainText('unscored');
  await page.reload();
  await page.getByRole('button', { name: 'Start training', exact: true }).tap();
  await expect(page.locator('.game-mode')).toHaveText('Daily training');
  expect(errors).toEqual([]);
  await context.close();
});
