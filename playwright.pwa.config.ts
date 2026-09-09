import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'pwa.spec.ts', timeout: 120000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4175', headless: true, actionTimeout: 15000, viewport: { width: 1440, height: 1000 } },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
