import { existsSync, readFileSync } from 'node:fs';

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync('dist/manifest.json')) fail('missing dist/manifest.json');
if (!existsSync('dist/sw.js')) fail('missing dist/sw.js');
if (!existsSync('dist/icons/icon-192.png')) fail('missing dist/icons/icon-192.png');
if (!existsSync('dist/icons/apple-touch-icon.png')) fail('missing dist/icons/apple-touch-icon.png');

const sw = readFileSync('dist/sw.js', 'utf8');
const html = readFileSync('dist/index.html', 'utf8');
const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));

if (sw.includes('//worM')) fail('sw.js contains //worM cache keys');
if (!/index\.html/.test(sw)) fail('sw.js does not precache index.html');
if (/addEventListener\(['"]install['"][\s\S]{0,500}skipWaiting\(/.test(sw)) fail('sw.js calls skipWaiting during install');
if (html.includes('registerSW.js') || /<script[^>]+src="[^"]*registerSW/.test(html)) fail('index.html injects an extra service-worker register script');
if (!manifest.icons?.length) fail('manifest.json has no icons');

console.log('pwa dist check ok');
