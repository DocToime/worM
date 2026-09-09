// Capture the implemented interface. Accepts a deployment URL for a live smoke test.
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.argv[2] || 'http://127.0.0.1:5174/';
const label = url.startsWith('http://127.') ? 'implemented' : 'deployed';
await mkdir(`review/${label}`, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const [width, height] of [[375,667],[390,844],[844,390],[700,600],[1440,900]]) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 500 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('.hero-cta').waitFor();
  const home = await page.evaluate(() => ({ words: document.body.innerText.trim().split(/\s+/).length, height: document.documentElement.scrollHeight }));
  if (width === 390 || width === 1440) await page.screenshot({ path: `review/${label}/home-${width}x${height}.png`, fullPage: true });
  // Native IndexedDB works on the production bundle too; all data is confined
  // to this disposable test context, never an existing player's browser.
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('worm-garden', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('profiles', 'readwrite'), store = tx.objectStore('profiles');
      const rows = store.getAll();
      rows.onsuccess = () => rows.result.forEach(profile => store.put({ ...profile, learned: true }));
      tx.oncomplete = () => { db.close(); resolve(null); };
      tx.onerror = () => reject(tx.error);
    };
  }));
  await page.reload();
  await page.locator('.hero-cta').waitFor();
  await page.clock.install();
  if (width === 700) await page.getByRole('button', { name: 'Memory check-in', exact: true }).click();
  await page.locator('.hero-cta').click();
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'cue');
  await page.clock.runFor(1032);
  await expect(page.locator('.game-page')).toHaveAttribute('data-phase', 'sort');
  const play = await page.evaluate(() => {
    const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width }; };
    return { scrollY, height: document.documentElement.scrollHeight, garden: rect('.garden'), buttons: rect('.basket-row'), pause: rect('.game-topline > button') };
  });
  expect(play.scrollY).toBe(0);
  expect(play.height).toBeLessThanOrEqual(height + 1);
  for (const r of [play.garden, play.buttons, play.pause]) {
    expect(r.top).toBeGreaterThanOrEqual(0); expect(r.bottom).toBeLessThanOrEqual(height + 1);
    expect(r.left).toBeGreaterThanOrEqual(0); expect(r.right).toBeLessThanOrEqual(width + 1);
  }
  await page.screenshot({ path: `review/${label}/sort-${width}x${height}.png` });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Paused', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Finish session', exact: true }).click();
  await page.clock.runFor(100);
  await expect(page.getByRole('heading', { name: 'Your results', exact: true })).toBeVisible();
  if (width === 390) await page.screenshot({ path: `review/${label}/results-390x844.png`, fullPage: true });
  expect(errors).toEqual([]);
  results.push({ viewport: `${width}x${height}`, home, play, errors });
  await context.close();
}
await browser.close();
await writeFile(`review/${label}/measurements.json`, JSON.stringify({ url, results }, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
