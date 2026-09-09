import { expect, test, type Page } from '@playwright/test';
import { generate, trialSeed } from '../src/core/random';
import { protocolFor } from '../src/core/protocol';
import type { Mode, Protocol } from '../src/core/types';

async function seedSession(page: Page, mode: Mode, rounds?: number) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little garden. A growing memory.' })).toBeVisible();
  const id = await page.evaluate(async ({ mode, rounds }) => {
    const storageUrl = '/src/data/storage.ts', engineUrl = '/src/core/engine.ts', protocolUrl = '/src/core/protocol.ts';
    const storage = await import(storageUrl), engine = await import(engineUrl), protocols = await import(protocolUrl);
    const data = await storage.loadData(), profile = { ...data.profiles[0], learned: true };
    await storage.saveProfile(profile);
    const p = protocols.protocolFor(mode, { ...protocols.defaults, rounds: rounds ?? 10 });
    const session = engine.createSession(profile.id, p, { viewport: { width: innerWidth, height: innerHeight }, pixelRatio: devicePixelRatio }, 42);
    await storage.saveSession(session); return session.id;
  }, { mode, rounds });
  await page.reload();
  await page.clock.install();
  await page.locator('.hero-cta').click();
  await page.getByRole('button', { name: 'Start round' }).click();
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'cue');
  return id;
}
async function waitPhase(page: Page, target: string, p: Protocol) {
  for (let i = 0; i < 30; i++) {
    const phase = await page.locator('.game-page').getAttribute('data-phase');
    if (phase === target) return;
    if (phase === 'interrupted') {
      const reasons = await page.evaluate(async () => { const url = '/src/data/storage.ts'; const storage = await import(url); return (await storage.listSessions()).flatMap((s: { events: { type: string }[] }) => s.events.filter(e => e.type === 'interruption')); });
      throw new Error(`Unexpected interruption waiting for ${target}: ${JSON.stringify(reasons)}`);
    }
    const ms: Record<string, number> = { cue: p.cueMs, sort: p.sortMs, 'sort-feedback': p.feedbackMs, interval: p.intervalMs, 'green-hold': p.greenMs, retention: p.delayMs, recall: p.recallMs };
    await page.clock.runFor((ms[phase ?? ''] ?? 100) + 32);
  }
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', target);
}
async function playRound(page: Page, p: Protocol, attempt: number, span: number, screenshots = false) {
  const targets = generate(trialSeed(42, attempt), span, p);
  if (screenshots) await page.screenshot({ path: 'test-results/game-cue.png' });
  for (let item = 0; item < span; item++) {
    await waitPhase(page, 'sort', p);
    if (screenshots && item === 0) await page.screenshot({ path: 'test-results/game-sort.png' });
    await page.keyboard.press(targets.qualities[item] === 'good' ? 'a' : 'f');
    if (p.fixedSort) await page.clock.runFor(p.sortMs + 32);
    if (item + 1 < span) await waitPhase(page, 'cue', p);
  }
  await waitPhase(page, 'retention', p);
  if (screenshots) await page.screenshot({ path: 'test-results/game-retention.png' });
  await waitPhase(page, 'recall', p);
  expect(await page.locator('.plant-cell[data-ripe=true]').count()).toBe(0);
  if (screenshots) await page.screenshot({ path: 'test-results/game-recall.png' });
  for (const cell of targets.cells) { await page.clock.runFor(180); await page.locator(`[data-cell="${cell}"]`).click(); }
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'feedback');
}
async function readSession(page: Page, id: string) {
  return page.evaluate(async id => { const url = '/src/data/storage.ts'; const storage = await import(url); return (await storage.listSessions()).find((s: { id: string }) => s.id === id); }, id);
}
test('home, profile settings, mobile layout and empty history', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little garden. A growing memory.' })).toBeVisible();
  await expect(page.locator('.plant-cell')).toHaveCount(9);
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByRole('heading', { name: 'No sessions yet.' })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Nickname', { exact: true }).fill('Rowan');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByLabel('Reduce movement').check();
  await page.reload();
  await expect(page.locator('.profile-chip')).toContainText('Rowan');
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Memory check-in', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Memory check-in', exact: true }).click();
  await expect(page.locator('#screen-hint')).toBeVisible();
  expect(errors).toEqual([]);
});
test('tutorial checks both categories and a real recall before combined practice', async ({ page }) => {
  await page.goto('/'); await page.clock.install();
  await page.getByRole('button', { name: 'Start training' }).click();
  await page.getByRole('button', { name: 'Sauce, worm pepper, F or right arrow' }).click();
  await expect(page.getByText('No worm: choose Market.')).toBeVisible();
  await page.keyboard.press('a'); await page.keyboard.press('f');
  await page.getByRole('button', { name: 'Try remembering' }).click();
  await page.clock.runFor(3500);
  await page.locator('[data-cell="1"]').click(); await page.clock.runFor(200); await page.locator('[data-cell="6"]').click();
  await page.getByRole('button', { name: 'Start practice' }).click();
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'cue');
  await expect(page.getByText('Guided practice', { exact: true })).toBeVisible();
});
test('complete training saves separate scores, history and downloadable backups', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const id = await seedSession(page, 'training', 5), p = { ...protocolFor('training'), rounds: 5 };
  for (let round = 0; round < 5; round++) {
    await playRound(page, p, round, 2, round === 0);
    await page.getByRole('button', { name: round === 4 ? 'Results' : 'Next round', exact: true }).click();
    if (round === 4) await page.clock.runFor(50);
  }
  await expect(page.getByRole('heading', { name: 'Your results' })).toBeVisible();
  await expect(page.locator('.result-stats')).toContainText('100%');
  await page.screenshot({ path: 'test-results/results.png', fullPage: true });
  await expect.poll(async () => (await readSession(page, id))?.status).toBe('completed');
  const saved = await readSession(page, id);
  expect(saved.trials).toHaveLength(5); expect(saved.trials.every((t: { score: { strict: boolean } }) => t.score.strict)).toBe(true);
  await page.getByText('Download session', { exact: true }).click();
  const jsonWait = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download JSON' }).click(); const json = await jsonWait; expect(json.suggestedFilename()).toMatch(/\.json$/);
  const stream = await json.createReadStream(); let content = ''; stream!.setEncoding('utf8'); for await (const chunk of stream!) content += chunk; const exported = JSON.parse(content); expect(exported.sessions[0].trials).toHaveLength(5); expect(exported.sessions[0].events.length).toBeGreaterThan(50);
  const csvWait = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download CSV' }).click(); expect((await csvWait).suggestedFilename()).toMatch(/\.csv$/);
  await page.getByRole('button', { name: 'Progress' }).click(); await expect(page.locator('.history-row')).toHaveCount(1);
  await page.reload(); await page.getByRole('button', { name: 'Progress' }).click(); await expect(page.locator('.history-row')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('assessment administers all fifteen rounds at spans two, three and four', async ({ page }) => {
  test.setTimeout(180000);
  const id = await seedSession(page, 'assessment'), p = protocolFor('assessment');
  for (let round = 0; round < 15; round++) {
    await playRound(page, p, round, 2 + Math.floor(round / 5));
    await page.getByRole('button', { name: round === 14 ? 'Results' : 'Next round', exact: true }).click();
    if (round === 14) await page.clock.runFor(50);
  }
  await expect(page.getByRole('heading', { name: 'Your results' })).toBeVisible();
  await expect.poll(async () => (await readSession(page, id))?.status).toBe('completed');
  const saved = await readSession(page, id); expect(saved.trials.map((t: { span: number }) => t.span)).toEqual([...Array(5).fill(2), ...Array(5).fill(3), ...Array(5).fill(4)]);
  expect(saved.trials.every((t: { score: { strict: boolean } }) => t.score.strict)).toBe(true);
});
test('pause, adult help and reload preserve invalid attempts and resume fresh', async ({ page }) => {
  const errors: string[] = []; page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  const id = await seedSession(page, 'training');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.locator('.help-options summary').click();
  await page.getByRole('button', { name: 'Note adult help for this round' }).click();
  await page.getByRole('button', { name: 'Restart round' }).click();
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'cue');
  await expect.poll(async () => (await readSession(page, id))?.trials.length).toBe(2);
  await page.reload();
  await page.locator('.hero-cta').click();
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Restart round' }).click();
  await expect.poll(async () => (await readSession(page, id))?.trials.length).toBe(3);
  const s = await readSession(page, id); expect(s.trials[0].assisted).toBe(true); expect(s.trials[0].status).toBe('interrupted'); expect(s.trials[1].status).toBe('interrupted'); expect(s.trials[2].scheduledIndex).toBe(1); expect(s.trials[0].seed).not.toBe(s.trials[2].seed);
  expect(errors.filter(error => !error.includes('favicon'))).toEqual([]);
});
test('phone layout and settings delete only the chosen profile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedSession(page, 'training', 5);
  await page.screenshot({ path: 'test-results/game-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Finish session', exact: true }).click(); await page.clock.runFor(50);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Add a gardener', { exact: true }).fill('Second gardener'); await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Delete this gardener and their sessions…' }).click(); await page.getByRole('button', { name: 'Delete gardener & sessions', exact: true }).click();
  await expect(page.locator('.profile-chip')).toContainText('Gardener');
  await page.getByRole('button', { name: 'Progress' }).click(); await expect(page.locator('.history-row')).toHaveCount(1);
});
