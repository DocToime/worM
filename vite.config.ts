import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      strategies: 'generateSW',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'WorM — The memory garden',
        short_name: 'WorM',
        description: "A little garden. A growing memory. Practise spatial memory with WorM's mindful pepper harvest.",
        start_url: './',
        scope: './',
        id: 'https://doctoime.github.io/worM/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f8f7f1',
        theme_color: '#244c3c',
        lang: 'en',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
});
