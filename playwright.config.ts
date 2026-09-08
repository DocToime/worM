import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', timeout: 120000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5174', headless: true, actionTimeout: 10000, viewport: { width: 1440, height: 1000 } },
  webServer: { command: 'npm run dev -- --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: true },
});
