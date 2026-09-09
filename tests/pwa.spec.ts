import { expect, test } from '@playwright/test';

test('production preview reloads home while offline', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little garden. A growing memory.' })).toBeVisible();
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toBe('http://127.0.0.1:4175/');
  expect(scope).not.toBe('https://doctoime.github.io/');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'A little garden. A growing memory.' })).toBeVisible();
  expect(errors.filter(error => !error.includes('favicon'))).toEqual([]);
});
