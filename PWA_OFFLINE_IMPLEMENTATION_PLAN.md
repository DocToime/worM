# WorM — PWA and offline gameplay plan

Version: 1.1 · 9 September 2026  
Status: implemented in 1.2.0.

## Revision

v1.0 over-specified the work. The scientific constraint is real; the custom worker, dual Vite bases, home-screen install CTA, offline footer, two-build CI test, and `environment.pwa` flag were not. This revision is what I would actually implement.

Material changes from v1.0:

1. **Keep `base: './'`.** Dual production/dev bases was the largest unforced risk. Relative URLs already make one `dist/` work for preview and GitHub Pages. Inspect Workbox keys after the first build; switch to `/worM/` only if they are wrong.
2. **Use `generateSW` + `registerType: 'prompt'`.** A custom `src/sw.ts` does not add safety. `skipWaiting: false` already pins a sitting. Inspect `dist/sw.js` before merge. Fall back to `injectManifest` only if the plugin forces `skipWaiting`.
3. **`skipWaiting: false` is the integrity mechanism.** An “Update now” control on home is optional UX, not a new component. Do not call `updateSW()` during play. Closing the last WorM tab and reopening is a correct apply path.
4. **Install lives in Settings**, not on home. Home already has one primary action.
5. **Drop the offline footer.** `navigator.onLine` is a poor signal and mixes persistence copy with network copy.
6. **Do not call `storage.persist()` on first IndexedDB open.** Firefox may prompt. Request persistence from Settings or after standalone install.
7. **Record `displayMode` only.** Drop `environment.pwa` (false on first visit until control is claimed). Do not add display mode to trend matching; viewport already splits standalone vs tab if chrome changes the garden size.
8. **Manifest file: `manifest.json`.** GitHub Pages has historically served `.webmanifest` with a useless MIME type, which blocks installability.
9. **CI tests: offline home reload + no SW on the dev server.** Do not seed production rounds via `/src/data/storage.ts` (those URLs do not exist in `dist/`). Do not require a two-build update test in CI.
10. **`clientsClaim: true` with `skipWaiting: false`.** First visit can become controlled after activate without letting a *waiting* worker steal an in-progress sitting.

---

## 0. How hard is this?

**Easy, if we stay on this narrower path. A few hours of implementation plus a device-check pass.**

WorM is already a self-contained static app. After the first HTTPS load it does not fetch fonts, images, APIs, or audio files. Art is inline SVG. Sound is generated with `AudioContext`. Profiles and sessions already live in IndexedDB. GitHub Pages already serves the production build over HTTPS at `https://doctoime.github.io/worM/`.

What is missing is a web app manifest, PNG icons, and a production-only service worker that precaches `dist/`. The scientific constraint — do not swap code during a sitting — is satisfied by **not** using `autoUpdate` / `skipWaiting`. That is a config choice, not a custom runtime.

| Piece | Difficulty | Why |
|---|---|---|
| Web app manifest + icons | Easy, slightly tedious | Need real PNG icons; SVG favicon is not enough to install |
| Precaching the production build | Easy | Tiny asset graph: HTML, JS, CSS, favicon, icons |
| Offline reload of the SPA | Easy | No runtime network; Workbox precache is sufficient |
| “Add to Home Screen” | Easy on Android, fiddly on iOS | Chrome has `beforeinstallprompt`; iOS is a manual Share-sheet flow |
| GitHub Pages project-site paths | Moderate, now smaller | Keep relative `base`; confirm SW scope is `/worM/`, never `/` |
| No mid-session code swap | Easy with the right defaults | `registerType: 'prompt'` leaves the new worker waiting |
| IndexedDB while offline | Already done | Same origin, same database |
| Durable storage against eviction | Easy to request, not guaranteed | Best-effort, especially on iOS |
| Automated tests | Moderate | Production-preview offline reload; must not poison Playwright’s Vite server |
| Real-device QA | Required, not automatable here | iOS Safari, Android Chrome, installed vs browser tab |

Do **not** build a native wrapper (Capacitor, Cordova, Tauri, Play/App Store) for this goal. A PWA is the correct next step. Native packaging remains the later extension named in `IMPLEMENTATION_PLAN.md` §16.

---

## 1. Product outcome

After this work:

1. A visitor who has opened the live site once, waited until the worker is ready, and reloaded can reopen it with the network off and play a full sitting: home, tutorial, training, check-in, original-style protocol, results, journal, settings, export.
2. Android Chrome and Chromium desktop can install WorM as a standalone window from Settings. iOS Safari can add it to the Home Screen via the documented Share flow.
3. Local gardeners, preferences, and session records keep working offline because they already use IndexedDB on this origin.
4. A sitting never silently receives a new build while its tab/window is open. A waiting worker applies after the last client is gone, or if the player confirms an update **while not playing**.
5. Existing scoring, timing, recovery, and Playwright coverage keep their current meaning. PWA work must not change the trial engine.

Success is “playable garden with no network after first install,” not “app-store product.”

---

## 2. Current facts this plan is based on

These are already true in the tree. The implementation must not assume otherwise.

- Vite 6 + React 19 + TypeScript. Production scripts: `npm run build`, `npm run preview`.
- `vite.config.ts` sets `base: './'` (relative URLs). That currently lets the same `dist/` work from `vite preview` and from GitHub Pages. **Keep this unless Workbox emits broken cache keys.**
- Deployed at `https://doctoime.github.io/worM/` via `.github/workflows/pages.yml`. Pages requires HTTPS, which service workers need.
- `index.html` already has `theme-color` `#244c3c` and a description. Favicon is `public/favicon.svg`.
- No manifest, no service worker, no `apple-touch-icon`.
- Runtime assets: bundled JS/CSS, inline SVG in `src/components/Art.tsx`, system font stacks in `src/styles.css`, generated tones in `src/components/Game.tsx`. Zero `fetch()` in application code.
- Persistence: IndexedDB database `worm-garden`, schema version 1, stores `profiles`, `sessions`, `preferences`. Writes are serialised. Recovery already treats reload as an interruption of the open attempt.
- Each session already records `buildVersion`, `assetVersion`, `scoringVersion`, and `protocolHash`. Current values: build `1.1.0`, assets `svg-1`, scoring `1.0.0`.
- `createSession` takes `environment` from `App.tsx`. Extra metadata belongs there, not in `engine.ts`.
- Check-in trends in `Results.tsx` match on `protocolHash`, `layoutVersion`, `viewport`, `pixelRatio`, `userAgent`, `calibration`, and observed modalities. They do **not** iterate unknown environment keys. Adding `displayMode` will not by itself drop old check-ins from the chart. A standalone window that changes measured viewport *will* split trends, which is correct.
- Design review requirement: “Pin code, assets and protocol for the session; defer service-worker updates until between sessions.”
- README already states: the app runs without network requests during a session once loaded; offline reload/install is not included.
- Playwright uses the Vite **dev** server on port 5174 and dynamic-imports `/src/data/storage.ts`. A production service worker must not be registered on that server. Those `/src/...` URLs do not exist in `dist/`.

---

## 3. Non-goals

Leave these out of this slice:

- Accounts, cloud backup, sync, or moving IndexedDB between devices.
- Changing protocols, scoring, timing, or onboarding.
- Native store packaging, push notifications, background sync, periodic updates.
- Caching third-party origins. There should be none.
- A custom offline game engine or “download pack.” The production `dist/` **is** the pack.
- Auto-applying updates (`registerType: 'autoUpdate'`).
- Registering a service worker at the GitHub user-pages root (`/`). Scope must stay under `/worM/`.
- Adding display mode to the trend matcher.
- A dedicated update-bar component, offline footer, home install button, icon-generation script, or custom service-worker source file.
- `BroadcastChannel` coordination across tabs. Two tabs already race IndexedDB; that is out of scope.
- Promising Firefox or Safari desktop install chrome. Offline tab play is enough there.

---

## 4. Recommended architecture

Keep the game as a static SPA. Add two thin layers around it:

```text
Browser
  ├─ Web app manifest          install metadata, icons, standalone display
  ├─ Generated service worker  precache dist/; skipWaiting false
  ├─ Tiny production register  virtual:pwa-register, DEV no-op
  ├─ Existing React app        unchanged trial loop
  └─ Existing IndexedDB        unchanged schema
```

**Library choice:** [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/), pin a release that lists Vite 6 support.

```ts
VitePWA({
  registerType: 'prompt',
  injectRegister: false,
  strategies: 'generateSW',
  includeAssets: ['favicon.svg', 'icons/*'],
  manifestFilename: 'manifest.json',
  manifest: { /* §7 */ },
  workbox: {
    skipWaiting: false,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    navigateFallback: 'index.html',
    globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
  },
  devOptions: { enabled: false },
})
```

Why `generateSW`, not a custom worker:

- The asset graph is tiny and fully known at build time.
- `registerType: 'prompt'` is documented to leave `skipWaiting` off. That is the sitting-pin.
- `injectManifest` is extra TypeScript, extra message protocol, and extra review surface for no extra safety.
- Inspect generated `dist/sw.js` before merge. If that file contains `skipWaiting: true` / `self.skipWaiting()` on install, abandon `generateSW` and switch to `injectManifest`. Do not ship it.

Why not `autoUpdate`: it forces `skipWaiting` and `clientsClaim` together so a new worker can take control of open pages. Forbidden.

Why `clientsClaim: true` with `skipWaiting: false`:

- First visit: there is no old worker. The new worker activates and may claim the page. Same bytes; no sitting is being rewritten.
- Later visit with a waiting worker: it cannot activate until skipWaiting or until it has no clients. An open sitting keeps the old worker.
- Override `workbox.clientsClaim` explicitly so a plugin default of `false` does not leave “open once, go offline, forget to reload” as a surprise. Still document that the first precache completes after `navigator.serviceWorker.ready`.

Why not a native shell: extra stores and update channels. The constraint is pinning a sitting, not distributing through Apple/Google.

### 4.1 Service-worker policy

| Event | Required behaviour |
|---|---|
| First visit online | Register worker. Precache `index.html`, hashed JS/CSS, favicon, icons, manifest. Page may become controlled after activate. |
| Later visit, network off | Serve precache. IndexedDB reads/writes locally. Play as today. |
| New deploy while a tab is open | New worker installs and **waits**. Current sitting keeps the old bytes. No reload. |
| Player on home, not in `screen === 'game'` | Optional: “A garden update is ready” with a text button that calls `updateSW()`. |
| Player in tutorial or game | No prompt. Do not call `updateSW()`. |
| Last WorM tab/window closed, then reopened | Waiting worker may activate. This is a correct apply path. |
| Navigation requests | `navigateFallback: 'index.html'` for same-origin navigations under the app path. There is no client-side router today; this still covers `/worM/` vs `/worM/index.html`. |
| Runtime caching | None. Precache only. |
| Rollback | If a shipped worker is broken, a hotfix may use the plugin `selfDestroying` flag. Not part of the happy path. |

The React app already knows `screen` and whether a session is `status === 'active'`. If an update button exists, it is disabled when `screen === 'game'` **or** `current?.status === 'active'`. Do not scrape the DOM.

### 4.2 What “offline gameplay” does and does not mean

**Does mean**

- Cold start with airplane mode after a successful first visit and worker `ready`.
- Complete a sitting, save it, export JSON/CSV (download is local).
- Switch gardeners, change settings, resume a recovered sitting.

**Does not mean**

- First-ever visit with no network (nothing is cached yet).
- Surviving iOS deleting site data under storage pressure.
- Cross-device continuity. IndexedDB is origin + browser profile scoped, installed or not.
- Opening `dist/index.html` as a `file:` URL.
- On older iOS, Safari tabs and Home Screen icons being the same data store. If they diverge, the player will see an empty garden in one and not the other. Document it; do not invent sync.

---

## 5. GitHub Pages path rules

Origin: `https://doctoime.github.io`. The app lives at `/worM/`. The worker must never register with scope `/`.

**Default: keep Vite `base: './'`.**

Relative script URLs in `index.html` already resolve correctly from `https://doctoime.github.io/worM/` and from `vite preview`. A service worker emitted as `./sw.js` and registered from that page has default scope `/worM/`. Manifest `start_url` and `scope` of `./` resolve against the manifest URL to `/worM/`.

After the first production build, open `dist/sw.js` and confirm precache keys. Acceptable: `./assets/index-….js`, `assets/index-….js`, or `/worM/assets/index-….js`. **Reject and do not deploy** keys with `//worM` or scope `/`.

Only if that inspection fails, then — and only then — switch production to `base: '/worM/'` via an env flag and preview at `http://127.0.0.1:4173/worM/`. Do not start there. It splits local preview, Pages, and tests into two HTML shapes for a problem we may not have.

Keep `touch dist/.nojekyll`.

---

## 6. Files to add or change

Keep the diff surgical. No engine/scoring edits.

### 6.1 New files

| File | Role |
|---|---|
| `public/icons/icon-192.png` | Android/Chrome install |
| `public/icons/icon-512.png` | High-res install / splash |
| `public/icons/icon-maskable-192.png` | Pepper inset ~20% for Android crop |
| `public/icons/icon-maskable-512.png` | Same, 512 |
| `public/icons/apple-touch-icon.png` | 180×180, opaque, for iOS Home Screen |
| `src/pwa.ts` | Production-only `registerSW`; exposes `{ needRefresh, update }` |
| `tests/pwa.spec.ts` | Production-build offline home reload; asserts no SW on port 5174 if included in the default project |

Commit the PNGs. Do not add `sharp` or a generator unless icon export is painful by hand.

### 6.2 Existing files

| File | Change |
|---|---|
| `package.json` | Pin `vite-plugin-pwa`. Optional `test:pwa` script. Bump version to `1.2.0` when this ships. |
| `vite.config.ts` | Add `VitePWA({…})` as in §4. Leave `base: './'`. Plugin stays loaded so the virtual module exists, but `devOptions.enabled: false` and `pwa.ts` no-ops in DEV. |
| `index.html` | `link rel="manifest" href="./manifest.json"`, `apple-touch-icon`, `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style` = `default`. Keep existing theme-color. |
| `src/main.tsx` | `if (import.meta.env.PROD) void import('./pwa');` after React boots. Never import PWA code from `engine.ts`. |
| `src/App.tsx` | Optional home-only update text button when `needRefresh` and not playing. Pass `displayMode` into `createSession` environment. No new chrome on the game surface. |
| `src/components/Settings.tsx` | “Install and offline” paragraph: Android/Chrome install button if `beforeinstallprompt` was captured; iOS Share → Add to Home Screen; install is not a backup; optional “Keep garden data” that calls `persist()`. |
| `src/core/protocol.ts` | Bump `BUILD_VERSION` to `1.2.0` when shipping. |
| `README.md` | Install, offline, update-by-reopen, iOS eviction / storage-partition caveats. |
| `IMPLEMENTATION_PLAN.md` §16 / §18 | When shipping, record that this extension is no longer deferred. Do that in the implementation PR. |

No changes to `src/core/scoring.ts`, `adaptation.ts`, `random.ts`, `engine.ts`, or garden art. `Game.tsx` still hardcodes `buildVersion: '1.1.0'` in one presentation-change event; do not fold a drive-by cleanup into this PR unless the version bump makes that line obviously stale *and* the edit is one identifier swap to `BUILD_VERSION`.

Do **not** add `src/sw.ts` or `src/components/UpdateBar.tsx`.

---

## 7. Manifest specification

Keep copy in the existing voice. Do not add clinical claims.

```text
name:             WorM — The memory garden
short_name:       WorM
description:      A little garden. A growing memory. Practise spatial memory with WorM's mindful pepper harvest.
start_url:        ./
scope:            ./
id:               https://doctoime.github.io/worM/
display:          standalone
orientation:      any
background_color: #f8f7f1
theme_color:      #244c3c
lang:             en
```

Icons: 192 and 512 PNG with `purpose: "any"`, plus matching maskable 192/512. Do not list the SVG favicon as the only install icon.

`display: standalone` is correct. Do not use `fullscreen` or `window-controls-overlay`.

Omit `categories` and `prefer_related_applications`; they do not help this product.

Filename **must** be `manifest.json` (plugin `manifestFilename`) so GitHub Pages serves a JSON MIME type. Link it from `index.html` explicitly if the plugin does not.

If a build with relative `start_url` fails Chrome’s installability check, set `start_url`/`scope` to `/worM/` at that point. Do not pre-empt that.

---

## 8. Icons

Source: `public/favicon.svg` (pine `#244c3c`, pepper `#efc355`, stem `#b9d39e`).

- Opaque background. iOS does not reliably honour transparency on Home Screen icons.
- Maskable variants: full-bleed pine square, pepper inset in the safe zone.
- 180×180 Apple touch icon: no alpha.
- Keep files small. These are rasterisations of vector art, not new branding.

Maskable icons are polish. A build with only `any` 192/512 plus the Apple touch icon is still shippable if time is short.

---

## 9. Registration module

`src/pwa.ts` should stay tiny.

- Import `registerSW` from `virtual:pwa-register`.
- Call it only when `import.meta.env.PROD && 'serviceWorker' in navigator`.
- `immediate: true` is acceptable (checks for a waiting worker). Do not pass a callback that reloads the page automatically.
- Export a setter the app can subscribe to: `needRefresh`, and `update()` which calls the plugin’s `updateSW()` **only if the app has said it is safe**.
- `injectRegister: false` so HTML does not also inject a register script.
- Do not register in DEV. Playwright on port 5174 must see `navigator.serviceWorker.getRegistrations()` empty.

If `update()` is ever called during `screen === 'game'`, that is a bug. Prefer passing a boolean from `App.tsx` over reading CSS classes.

Reload after a confirmed update: the plugin’s `updateSW(true)` already skip-waits and reloads. That reload is why it is forbidden during a sitting (the engine treats reload as an interruption). Between sessions, it is the same as opening the site again.

---

## 10. Application UI

Stay inside the garden-journal look. No toast library.

### 10.1 Update notice (optional)

If `needRefresh` and `screen !== 'game'` and no `status === 'active'` session, a single text button near the storage warning is enough: “A garden update is ready.” Clicking it updates.

No “Later” state machine. If they ignore it, the waiting worker still applies when they fully close WorM.

Hide it during play. Do not log engine events during timed phases.

### 10.2 Install — Settings only

Home keeps one primary action. Do not put “Add to Home Screen” on the hero.

- Capture `beforeinstallprompt` at the window, stash it, use it from a Settings button. Hide that button in standalone, or if the event never fires.
- iOS: no `beforeinstallprompt`. One short Settings paragraph: Share → Add to Home Screen. Do not UA-sniff beyond “the install event never came.” Do not nag on home.
- Never auto-open an install modal on first visit.

### 10.3 Persistent storage — Settings, not boot

Do not call `navigator.storage.persist()` from `loadData()`. Firefox may show a permission dialog on a quiet first visit.

From Settings: a text button “Ask this browser to keep garden data” that calls `persist()` and then `persisted()`, and reports the boolean in one sentence. If already standalone, calling `persist()` once after install is reasonable and usually silent in Chrome.

Keep the existing “Saved on this device” footer unchanged. That sentence already does not mean durability.

Do not change the IndexedDB schema.

---

## 11. Session environment metadata

In `App.tsx` `launch()`, add to the object already passed into `createSession`:

```text
displayMode: matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone
  ? 'standalone'
  : matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui'
  : matchMedia('(display-mode: fullscreen)').matches ? 'fullscreen'
  : 'browser'
```

Do not add `pwa: true/false`. `serviceWorker.controller` is null on the first visit even when a worker is installing, so the flag would lie.

Do not add `displayMode` to the `chartRows` filter in `Results.tsx`. Viewport/pixel-ratio matching already splits sittings whose usable garden size changed. Standalone vs tab that happens to share a viewport can still trend together; that is acceptable for v1. Exports will still carry `displayMode` for later analysis.

Do not bump `schemaVersion`.

---

## 12. Implementation order

### Step 1 — Icons and manifest

- Add PNGs and Apple tags.
- Configure `VitePWA` with the options in §4, still with a worker (installability needs both).
- **Exit:** `dist/manifest.json` and icons exist; `base` is still `./`.

### Step 2 — Production-only registration and precache inspection

- Add `src/pwa.ts`. Dynamic-import from `main.tsx` in PROD only.
- `npm run build && npm run preview`. Confirm `dist/sw.js` has `skipWaiting` false (or no install-time `skipWaiting()`), precache keys are clean, scope is not `/`.
- DevTools → Application: first load, wait until worker is activated, Offline, reload, home renders.
- **Exit:** airplane-mode reload works on preview. `npm run dev` has no worker. `npm test` unchanged.

### Step 3 — Settings copy and optional update button

- Settings: install paragraph, iOS instructions, persist button.
- Optional home update text button, gated on not playing.
- `displayMode` on new sessions.
- **Exit:** game surface unchanged during cue/sort/retention/recall.

### Step 4 — Tests and docs

- `tests/pwa.spec.ts` against `vite preview` of `dist/`.
- README. Version `1.2.0`.
- **Exit:** unit tests green; existing Playwright suite still on port 5174 with no SW.

### Step 5 — Device check before merge to `main`

`main` deploys Pages. Do not merge on CI alone.

| Device class | Check |
|---|---|
| Android Chrome | Install from Settings, open standalone, airplane mode, complete one training round, export JSON |
| iOS Safari | Add to Home Screen, airplane mode, complete one round, confirm data after closing the tab. Note if Home Screen and Safari diverge. |
| Desktop Chrome | Install as window, offline reload, start a round, confirm a waiting worker (simulated by a second local build) does not interrupt |
| Desktop Safari | Offline tab play; do not require install chrome |

If iOS Home Screen loses data after a few days, document it. Do not invent a sync feature in this slice.

---

## 13. Tests

### 13.1 Do not break the existing suite

- Vitest must not import `virtual:pwa-register` from engine/storage modules.
- `tests/browser.spec.ts` and `tests/playability.spec.ts` keep `webServer: npm run dev`.
- If any default-project test sees a service worker on `127.0.0.1:5174`, fail it. A one-liner in `tests/browser.spec.ts` (or the PWA spec targeting that origin) is enough.

### 13.2 Production-preview spec

Second Playwright project:

```text
command: npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
baseURL: http://127.0.0.1:4173/
```

Because `base` is `./`, preview is still `/`, not `/worM/`. If Step 2 forced `base: '/worM/'`, change `baseURL` accordingly.

Cases that earn their keep:

1. **Worker ready, then offline reload.** Visit `/`, wait for `navigator.serviceWorker.ready`, `context.setOffline(true)`, reload, heading “A little garden. A growing memory.” is visible. No console errors.
2. **Scope.** `registration.scope` is this origin’s app directory (`http://127.0.0.1:4173/` locally; `/worM/` on Pages). Never `https://doctoime.github.io/`.
3. **Dev server stays clean.** Against port 5174, `getRegistrations()` is `[]`.

Cases that do **not** earn CI complexity:

- Playing a seeded round offline by importing `/src/data/storage.ts`. That module URL is a Vite-dev convention. Drive a round on a device, or not at all in CI.
- Export-while-offline. Blob downloads do not need a network; a device check is enough.
- Two sequential production builds proving skipWaiting. Inspect `dist/sw.js` in the build assertion instead. Manually confirm deferral once on desktop Chrome.

Do not add test-only hooks to the engine.

### 13.3 Build assertions

A tiny Node check after `vite build` (`scripts/check-pwa.mjs` or an inline `node -e` in CI):

- `dist/manifest.json` exists.
- `dist/sw.js` exists and does not contain an install-time skipWaiting of a new waiting worker (`skipWaiting:!0` / `self.skipWaiting()` in the install handler). Exact grep should be written against the actual generated file, not guessed in this plan.
- Precache list includes `index.html`, hashed JS/CSS, and icons, and does not include `//worM`.
- `dist/index.html` does not double-register (no extra `registerSW` script tag if `injectRegister: false`).

Run it in `.github/workflows/pages.yml` after `npm run build`. Do not change the Pages `base` in that workflow unless Step 2 required it.

---

## 14. Risks and explicit decisions

| Risk | Decision |
|---|---|
| Mid-session worker activation | Forbidden. `registerType: 'prompt'`, never `autoUpdate`. Confirm generated SW. |
| Relative `base: './'` + bad Workbox keys | Keep `./` first. Switch to `/worM/` only after a broken build is observed. |
| GitHub Pages MIME type for `.webmanifest` | Use `manifest.json`. |
| Worker on Vite dev server | `devOptions.enabled: false`; register only in `import.meta.env.PROD`. |
| `storage.persist()` permission dialog | Settings or post-install only, not `loadData()`. |
| iOS storage eviction | Document. No cloud fallback. |
| iOS Home Screen vs Safari data partition | Document. Same-origin is not a guarantee on older iOS. |
| Installed PWA and Chrome tab share IndexedDB | Intended on Chromium. Mention in Settings. |
| Custom domain later | New origin, empty database. Separate migration. |
| `clientsClaim` on first install | Allowed. Same bytes. |
| Lighthouse PWA score | Smoke only. Not scientific evidence. |
| `navigator.onLine` footer | Do not add. |
| Multiple tabs | Out of scope. A waiting worker already waits while any client exists. |
| Firefox/Safari install UI | Not required. Offline tab play is. |

---

## 15. Copy and accessibility

- Existing tokens only. No new animation.
- Optional update control: `role="status"` plus a button. No `alert()` / `confirm()`.
- No new sounds.
- English only. Settings paragraph is enough; do not grow `copy.ts` for a sentence used once.

---

## 16. Versioning and analysis impact

When this ships:

- `package.json` version and `BUILD_VERSION`: `1.2.0`.
- `assetVersion` stays `svg-1`. Icons are chrome, not stimuli.
- `scoringVersion` stays `1.0.0`.
- New sessions may include `environment.displayMode`. Trend matching does not read that key. No README special case is required for old check-ins.

A sitting that started on 1.1.0 bytes must finish on 1.1.0 bytes.

---

## 17. Documentation updates (when implementing)

README additions, in the existing tone:

- How to install (Android Chrome / desktop Chromium from Settings; iOS Share → Add to Home Screen).
- Offline: first visit needs network; after the worker is ready, later visits do not.
- Data still lives in this browser profile/origin. Installing is not a backup.
- Updates wait until WorM is fully closed, or until you confirm on a non-play screen.
- `file:` URLs remain unsupported.
- Production PWA preview: `npm run build && npm run preview` (still `/` while `base` is `./`).
- iOS may evict data, and older iOS may not share storage between Safari and the Home Screen icon.

Do not claim the PWA is a validated medical device, an EMPOWER executable, or equivalent across every phone.

---

## 18. Effort and staffing

| Work | Estimate |
|---|---|
| Icons + manifest + HTML tags | 1–2 hours |
| Plugin config + `src/pwa.ts` + precache inspection | 1–2 hours |
| Settings install/persist copy; optional update button; `displayMode` | 1–2 hours |
| Production Playwright spec + CI grep | 1–2 hours |
| README | 30 minutes |
| Real-device pass and fixes | half a day, calendar-bound |

A single developer who already knows this repo should land a reviewable PR in well under a day of coding, then device-QA before merge to `main`.

---

## 19. Acceptance checklist

Ship only when all of these are true:

- [ ] Production `dist/` contains `manifest.json`, `sw.js`, and the PNG icons.
- [ ] Generated `sw.js` does not auto `skipWaiting` on install of a waiting worker.
- [ ] Precache keys have no `//worM`; worker scope is the app directory, not `/`.
- [ ] After one online visit and `serviceWorker.ready`, a reload with the network disabled shows home and can complete a sitting (device or preview).
- [ ] IndexedDB gardeners/sessions survive that offline sitting.
- [ ] JSON/CSV download still works (Blob, no network).
- [ ] `npm test` and existing Playwright specs pass without a service worker on port 5174.
- [ ] Production-preview spec: offline home reload passes in CI.
- [ ] No new network origins appear in the production bundle.
- [ ] Game chrome during cue/sort/retention/recall is unchanged.
- [ ] Android install path works on at least one device; iOS Add-to-Home-Screen path is documented and smoke-tested.
- [ ] README states iOS eviction / possible storage partition, and that install ≠ backup.

---

## 20. Suggested PR shape

One PR. Do not mix this with backup import, translation, or a teacher dashboard.

---

## 21. Fallback if generateSW is unsafe

If the pinned plugin emits `skipWaiting` despite `registerType: 'prompt'` and `workbox.skipWaiting: false`, switch that PR to `strategies: 'injectManifest'` with a short `src/sw.ts` that precaches, uses `navigateFallback`, and skip-waits **only** on an explicit `SKIP_WAITING` message. Do not take that path speculatively.

There is no honest “just add a cache header” substitute. GitHub Pages cache headers will not make a cold reload work offline, and they will not provide a Home Screen icon.

---

## 22. Immediate next action when implementation starts

1. Pin `vite-plugin-pwa` (Vite 6 compatible).
2. Add icons from `public/favicon.svg`.
3. Configure `generateSW` + `prompt` + `manifest.json`; keep `base: './'`.
4. Register only in production; inspect `dist/sw.js`.
5. Settings copy for install/offline/persist.
6. Production-preview offline reload test.
7. Device-check Android Chrome and iOS Safari before merging to `main`.
