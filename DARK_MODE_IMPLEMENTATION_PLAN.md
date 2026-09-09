# WorM — dark mode implementation plan

Version: 1.1 · 10 September 2026

This is an implementation plan only. Do not treat it as shipped behaviour until the delivery record in §17 is filled in.

**1.1 review** (after deciding the header sun/moon is in). Changes from 1.0 are listed in §2; the rest of the document is the revised plan.

## 1. Product outcome and scope

Add a user-controlled dark garden chrome so WorM can be read comfortably in low light, without changing the experimental stimulus, timing, scoring, or persistence rules.

The light theme stays the designed product: warm ivory paper, pine type, sage panels. Dark mode is the same garden journal after dusk — deep forest night, warm ivory-green type — not a generic near-black / acid-green skin, and not an inverted seed-packet.

### In scope

- Header sun/moon control on every screen, including active play.
- Settings: **Match device**, **Light**, **Dark** (the only way back to following the OS).
- Resolved theme applied to app chrome (home, play, tutorial, results, history, settings, loading, notices).
- Preference persisted with the existing IndexedDB settings record, plus a `localStorage` mirror so a returning dark preference does not flash ivory.
- `theme-color` kept in step with the resolved theme.
- Tests and screenshots for the header, Settings, persistence, system preference, and main screens in both themes.

### Out of scope

- Per-profile themes (preferences are already device-wide, like sound and reduced motion).
- Recolouring peppers, plants, worms, crates, barn, ripe halo, or garden soil. Those are protocol stimuli.
- Mixing theme into protocol hashes, session `environment`, check-in trend matching, or interruption rules.
- Recording theme changes in the engine event log (unlike sound, theme is not task-relevant).
- Scheduled night switching beyond `prefers-color-scheme`.
- Changing `apple-mobile-web-app-status-bar-style` (see §2).
- A second custom palette, high-contrast theme, or forced-colors redesign.

## 2. What 1.0 got wrong

These are the corrections. Later sections already incorporate them.

1. **Default `'system'` was the wrong first-run.** WorM is a designed ivory journal and a memory task. A dark-OS first visit that suddenly paints dusk is a product change, not a courtesy. **Default `'light'`.** The moon is one tap; Match device is there for people who want the OS. First paint then matches today’s CSS with no boot-script work.
2. **Header sun/moon is in**, and that decides the split: the header is a binary light ↔ dark override; Settings is where **Match device** lives. Do not cycle three states with two icons.
3. **The toggle must work during play without pausing.** Pause **invalidates the round**. Someone who starts a sitting, finds the screen too bright, and opens Pause to hit a theme control has just thrown away that attempt. The sun/moon therefore lives in the header on the playing screen too, not only next to Settings / the pause Sound button.
4. **Do not invert `--pine` into a sage CTA.** That is the generic dark-mode template. The brand stamp and primary buttons stay dark forest green with ivory labels in both themes; lift the green only enough to separate the button from dusk `--paper`. Recolour paper, ink, muted, lines, and panels — not the seed-packet.
5. **`--panel` cannot collapse two light colours.** `#eff2e6` (sage wash) and `#fcfbf6` (near-paper sheet) are different steps. Split `--panel` and `--sheet` or cards go flat.
6. **Do not set `document.documentElement.style.colorScheme` in JS.** That fights CSS. Set `data-theme` in JS; let `html[data-theme='dark'] { color-scheme: dark }` do the rest.
7. **Do not record `environment.theme`.** Sound and reduced motion belong on the sitting because they can change the task. Theme does not. Adding it later is one line if an analysis ever needs it.
8. **Do not change `apple-mobile-web-app-status-bar-style` to `black-translucent`.** That draws the web content under the status bar and can eat the 80px/102px header. Leave `default`. Update only the `theme-color` meta.
9. **Reuse of `.mode-selector` in Settings is fine visually, but the home control is `inline-flex` for two options.** Appearance needs three full-width segments. Share the look with a modifier (`.mode-selector.appearance-selector`) rather than stretching the home widget.
10. **Boot-script fallback for junk values must match IndexedDB coerce.** 1.0’s script treated unknown strings as light; `loadData` would then coerce to `system` and possibly flip to dusk. Treat unknown as `'light'` everywhere now that that is the default — or as `'system'` in both. Pick one: **unknown → `'light'`** (same as missing).
11. **“Pixel-identical tokenisation screenshots” overclaimed.** There is no committed computed-style golden. Tokenise, grep leftover chrome hex, and do a visual light-theme pass. Do not invent a screenshot CI gate for this.

## 3. Decisions

| Topic | Decision | Why |
|---|---|---|
| Preference | `theme: 'system' \| 'light' \| 'dark'` | Settings still needs Match device. The header cannot express three states honestly. |
| Default | `'light'` | Preserves today’s garden on first visit. Opt-in dusk. |
| Header control | Icon-only sun/moon. Shows the **current resolved** theme. Click writes the **opposite explicit** `'light'` or `'dark'`. | Standard override. Settings is the way back to system. |
| Header placement | Right cluster with the profile chip, **including `.playing`**. Icon-only, 44px hit target off-play; match existing playing header control height on play. | Must be reachable without Pause. Nav already hides during play; this button does not. |
| Settings control | Three-way Match device / Light / Dark | Recovers system following after a header click. |
| CSS | Custom properties on `:root`, overridden on `html[data-theme='dark']` | Same pattern as `data-reduced-motion`. |
| First paint | Inline boot script only if `localStorage['worm-theme']` is `'dark'` or `'system'` that resolves dark | Missing key → do nothing → ivory CSS, no flash. |
| Stimulus art | Unchanged SVG / soil hex | Protocol cues. |
| Mid-session change | Allowed; not an interruption | Chrome only. Resize still interrupts. |
| Session records | No `environment.theme` | Not task-relevant. |
| Storage schema | No IndexedDB version bump | `{ ...defaults, ...prefs }` fills `theme`. |
| Motion | Instant. No colour transitions | Reduced-motion already kills transitions; a fade during play looks like a glitch. |
| Pine / CTA | Stay dark green + ivory label in both themes | Distinctive; avoids pale sage pills. |
| Apple status bar | Unchanged `default` | `black-translucent` is a layout bug waiting to happen. |

### Rejected alternatives

- **Checkbox “Dark garden” only.** Cannot follow the OS after a header override.
- **Header cycles light → dark → system.** Two icons, three states; “what is system supposed to look like?”
- **Header only on non-play screens; theme on the pause panel like Sound.** Pause invalidates the round.
- **`--pine` becomes sage in dark mode.** Generic, and the brand mark washes out.
- **`filter: invert()` / `color-scheme` alone.** Breaks stimuli or leaves the page ivory.
- **React context / theme library.** One CSS file.
- **`black-translucent` status bar.** Safe-area / header overlap.

## 4. Preference model

### Type

In `src/core/types.ts`:

```ts
export type ThemePreference = 'system' | 'light' | 'dark';

export interface Preferences {
  sound: boolean;
  reducedMotion: boolean;
  theme: ThemePreference;
  rounds: number;
  startSpan: number;
  delayMs: number;
  calibration: { pixelsPerCm: number; viewport: string } | null;
}
```

`defaults` in `src/core/protocol.ts`: `theme: 'light'`. `protocolFor()` ignores theme. Theme never enters `hashConfig` inputs.

Put `resolveTheme` and `coerceTheme` next to `defaults` so App, Settings, and tests share them. Inject `systemDark` so Vitest does not need `matchMedia`:

```ts
export function coerceTheme(value: unknown): ThemePreference {
  return value === 'system' || value === 'dark' || value === 'light' ? value : 'light';
}

export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): 'light' | 'dark' {
  if (preference === 'system') return systemDark ? 'dark' : 'light';
  return preference;
}

export function oppositeTheme(resolved: 'light' | 'dark'): ThemePreference {
  return resolved === 'dark' ? 'light' : 'dark';
}
```

Never call `matchMedia` inside `resolveTheme` — the default-argument version in 1.0 would throw in Node if a test touched it.

### Apply to the DOM

Only the resolved value goes on `html`:

```ts
document.documentElement.dataset.theme = resolved; // 'light' | 'dark'
```

Do not also set `style.colorScheme`. CSS:

```css
html { color-scheme: light; }
html[data-theme='dark'] { color-scheme: dark; }
```

When resolved is `'light'`, set `data-theme="light"` explicitly (not removing the attribute). Then `[data-theme='dark']` is a clean switch and the boot script / React stay in one form.

Mirror the **preference** (`'system' | 'light' | 'dark'`) to `localStorage['worm-theme']` inside `updatePrefs` and once after `loadData`, so the boot script and IndexedDB cannot drift. Catch quota / private-mode errors.

### Boot script

First item in `<head>` after charset/viewport. Synchronous, no imports. **No-op when the key is missing or `'light'`** so first visits and explicit light skip work.

```html
<script>
  (function () {
    var pref = null;
    try { pref = localStorage.getItem('worm-theme'); } catch (e) {}
    if (pref !== 'dark' && pref !== 'system' && pref !== 'light') return;
    var dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    if (!dark) return;
    document.documentElement.dataset.theme = 'dark';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#161c18');
  })();
</script>
```

After React loads IndexedDB, IndexedDB wins and the mirror is rewritten.

### System-preference listener

One effect, always subscribed:

```ts
useEffect(() => {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    const resolved = resolveTheme(coerceTheme(prefs.theme), mq.matches);
    document.documentElement.dataset.theme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#161c18' : '#244c3c');
  };
  apply();
  mq.addEventListener('change', apply);
  return () => mq.removeEventListener('change', apply);
}, [prefs.theme]);
```

When preference is explicit light/dark, OS changes still fire `apply` and resolve to the same value. Cheaper than adding/removing the listener. Do not persist OS changes.

`addEventListener` on `MediaQueryList` is current; if a target browser lacks it, `mq.addListener(apply)` is the fallback — only add if a real-device check needs it, not speculatively.

### Load merge

`loadData()` already spreads defaults. Coerce anyway:

```ts
prefs: { ...defaults, ...prefs, theme: coerceTheme(prefs?.theme) }
```

Old records without `theme` become `'light'`.

## 5. Header sun/moon

### Placement

In `App.tsx`, keep three header flex children so mobile wrap is unchanged:

```text
[ brand ] [ nav (hidden while playing) ] [ .header-end : theme button + profile chip ]
```

`.header-end` is `display: flex; align-items: center; gap: …`. On `max-width: 650px` it stays on the first row with the wordmark; nav remains `order: 3`.

Visible on **home, tutorial, results, history, settings, and game**. The playing header already shows brand + chip; the moon sits beside the chip.

### Behaviour

- Icon = **current resolved** theme: sun when ivory, moon when dusk. (`Icon` already has `sun`; add a `moon` path in the same stroke style.)
- `aria-hidden` on the SVG; accessible name on the button:
  - resolved light → `aria-label="Switch to dusk garden"`
  - resolved dark → `aria-label="Switch to ivory garden"`
- `aria-pressed={resolved === 'dark'}`
- Click: `updatePrefs({ ...prefs, theme: oppositeTheme(resolved) })`. This **exits `system`**.
- No live region. The change is the user’s click and is visually immediate.

### Copy in Settings

One line under the three-way: “The sun and moon at the top switch ivory and dusk. Choose Match device to follow this phone again.”

### Playing layout

`.playing .theme-toggle` must not grow the 54px / 44px / 40px headers. Icon-only, padding to match `.playing .brand` tightness. Do not hide the profile chip to make room until a real overflow shows up at 360×640; if it does, hide the chip **name** (keep the initial disc) rather than the theme button.

Do not put a second theme control on the pause panel. Sound stays there because sound is session-task; theme is global chrome.

### Keyboard

The button is in tab order with the header. No shortcut (Escape is already pause).

## 6. Visual direction

Keep Georgia headings and Arial controls. Dark mode only remaps chrome tokens.

### Named tokens

Light values are today’s colours. Dark values are dusk paper, not inverted pine.

| Token | Light (today) | Dark (dusk) | Used for |
|---|---|---|---|
| `--paper` | `#f8f7f1` | `#161c18` | Page background |
| `--ink` | `#294636` | `#e4eadc` | Body text |
| `--pine` | `#294e3c` | `#294e3c` (same) | Brand stamp fill. **Do not lighten.** |
| `--pine-ink` | `#fffef7` | `#fffef7` | Label on pine fill |
| `--cta` | `#294e3c` | `#355a46` | Primary button fill; lift in dusk just enough to edge against `--paper` |
| `--cta-hover` | `#365f49` | `#3f6a51` | Primary hover |
| `--muted` | `#5d6c57` | `#9aab90` | Secondary text |
| `--line` | `#dce2d3` | `#334338` | Hairlines |
| `--panel` | `#e9edde` / `#eff2e6` / `#eaf0e1` | `#243028` | Sage wash: nav active, stats, trend, illustration frame |
| `--sheet` | `#fcfbf6` / `#fcfcf6` / `#fffef9` | `#1c2420` | Near-paper cards, inputs, selected chip |
| `--shadow` | `#273d2918` | `#00000040` | Selected mode chip |
| `--accent` | `#a55b25` | `#e0a36a` | Focus rings |
| `--danger` | `#994b3e` / `#914733` | `#e08b7a` | Delete |
| `--notice-*` | straw | darker straw on forest | Warnings |
| `--positive-*` | sage wash | darker sage wash | Positive notices |
| `--save-ok` | `#6c844e` | `#8fad78` | Saved-dot |
| `--save-err` | `#8e3827` | `#e08b7a` | Save error |

Primary buttons: `background: var(--cta); color: var(--pine-ink)`. Brand icon: `background: var(--pine)` in **both** themes so the rotated stamp stays the same dark green on ivory and on dusk.

Focus rings stay 3px `--accent`.

### Do not tokenise (stimulus)

Leave as literal hex:

- `.garden` soil, border, inner shadow, dirt dots
- `.plant-cell` soil wash and recall hover/active
- `.guided-number` yellow disc
- Ripe halo in `Plant`
- All fills/strokes in `Pepper`, `Plant`, `Crate`, `Barn`

Sorting / retention **overlay cards** may use `--sheet` / `--panel` so they do not glare; the pepper, barn, and crate drawings stay literal.

Baskets: keep Market and Sauce **different** (cool sage vs warm earth) in dusk. Do not grey both. Tokenise those two fills separately (`--basket-market`, `--basket-sauce`) rather than forcing them onto `--panel`.

### Copy

- Settings strong label: **Garden brightness**
- **Match device** — “Follow this device’s light or dark setting.”
- **Light** — “Ivory garden journal.”
- **Dark** — “Dusk garden. The peppers stay the same.”
- Header names as in §5. Do not say OLED, accessibility, or validation.

## 7. CSS work

### 7.1 Tokenise light first

1. Expand `:root` with the light tokens.
2. Replace chrome hex with `var(--token)`.
3. Grep `#` in `styles.css`; allowlist only garden / stimulus selectors.
4. Visual check of home / play / settings in light — not a new screenshot golden.

### 7.2 Dark override

One block that **reassigns tokens** on `html[data-theme='dark']`. Do not duplicate component rules. `:root` already uses the variables for `color` / `background`, so the dark block does not need to repeat those properties.

```css
html { color-scheme: light; }
html[data-theme='dark'] {
  color-scheme: dark;
  --paper: #161c18;
  --ink: #e4eadc;
  /* … */
}
```

### 7.3 Special cases

- **`accent-color`** on checkboxes and the calibration range → `--cta` or `--pine`.
- **`.theme-toggle`**: transparent, like nav buttons; 44×44 off-play; no persistent selected fill (the icon change is the state). `:focus-visible` uses the global 3px ring.
- **`.header-end`**: flex, shrink-0, gap aligned with header.
- **Hero illustration**: `--panel`, garden inside unchanged.
- **Reduced motion**: unchanged; theme adds no animation.

### 7.4 PWA / browser chrome

| Surface | Light | Dark |
|---|---|---|
| `<meta name="theme-color">` | `#244c3c` in HTML default | Boot script + App effect set `#161c18` |
| `apple-mobile-web-app-status-bar-style` | `default` | **leave it** |
| Vite PWA `theme_color` / `background_color` | ivory/pine splash | **leave the manifest** |

Installed splash stays the designed garden. Runtime `theme-color` follows the resolved theme after load / boot.

## 8. Application wiring

### `src/App.tsx`

- Resolve/apply effect as in §4.
- `updatePrefs` writes IndexedDB (already) and `localStorage['worm-theme']`.
- Header sun/moon as in §5.
- Do **not** add `theme` to `createSession` environment.
- After `loadData`, prefs already include `theme`; the apply effect runs.

### `src/components/Settings.tsx`

Rename **Sound & movement** → **Sound, movement & appearance**. After the two checkboxes, the three-way full-width selector (not a `toggle-row`). Do not put sun/moon icons on the segments unless they still fit at 390px; text-only segments plus the header icons is enough.

### `src/components/Art.tsx`

Add `moon` next to `sun`. **No stimulus recolour.**

### `src/data/storage.ts`

Coerce `theme` on load. No schema bump.

### `src/data/export.ts` / `src/copy.ts` / engine / scoring

No change. Do not add a `setting-change` theme event in `Game.tsx`.

### `src/components/Game.tsx`

No new props. Header owns theme, including during play.

## 9. Accessibility

- Header: `aria-label` describes the **action**, `aria-pressed` reflects dusk-on.
- Settings: `role="group"` + `aria-pressed` on each segment, same as home mode.
- Contrast: `--ink` on `--paper`; ivory on `--cta`. If 13px `--muted` fails on dusk paper, lighten `--muted` or darken `--paper` — do not add a third grey.
- Theme does not replace reduced motion, sound, or keyboard paths.
- No live region on toggle.

## 10. Scientific / protocol constraints

- Pepper green/yellow, worm pink, ripe halo, soil, 3×3 geometry unchanged.
- `protocolFor`, `hashConfig`, scoring, adaptation, engine timing untouched.
- Results trend matcher unchanged (no theme key).
- Theme change during an active trial does **not** interrupt. Viewport resize still does.
- `layoutVersion` stays `'compact-2'`.

## 11. File-level change list

| File | Change |
|---|---|
| `DARK_MODE_IMPLEMENTATION_PLAN.md` | This plan. |
| `index.html` | Boot script; default `theme-color` stays light pine. |
| `src/core/types.ts` | `ThemePreference`; `Preferences.theme`. |
| `src/core/protocol.ts` | `defaults.theme = 'light'`; `coerceTheme`, `resolveTheme`, `oppositeTheme`. |
| `src/App.tsx` | Apply effect; `header-end` sun/moon; localStorage in `updatePrefs`. |
| `src/components/Settings.tsx` | Appearance three-way; section title; one line about the header. |
| `src/components/Art.tsx` | `moon` icon only. |
| `src/styles.css` | Tokens; dark block; `.header-end`, `.theme-toggle`, appearance selector. |
| `src/data/storage.ts` | `coerceTheme` on load. |
| `tests/core.test.ts` | `resolveTheme` / `coerceTheme` / `protocolFor` ignores theme. |
| `tests/browser.spec.ts` | Header, Settings, persist, system, screenshots. |
| `README.md` | Settings paragraph: garden brightness + header sun/moon. |
| `IMPLEMENTATION_PLAN.md` §16 / §18 | Pointer, same style as the PWA note. |
| `vite.config.ts` | **No change.** |
| `src/core/engine.ts`, `Game.tsx` environment | **No change.** |

## 12. Implementation order

1. Tokenise light CSS; grep leftover chrome hex; visual light pass.
2. Types, defaults `'light'`, helpers, boot script, App apply effect (still no dark tokens — forcing `data-theme=dark` should look broken/partial; that is expected until step 3).
3. Dark token block. Walk home, tutorial, play (cue / sort / barn / recall / feedback / pause), results, history, settings, loading, storage warning, **and the playing header with the moon**.
4. Header sun/moon + Settings three-way + localStorage in `updatePrefs`.
5. Tests.
6. README / plan delivery notes. Do not bump `BUILD_VERSION` unless this is its own release.

No `ThemeProvider`. Do not reformat `Settings.tsx` or wrap `styles.css`.

## 13. Verification

### Manual

Desktop (~1240) and phone (390×844), plus playing 360×640 and short landscape 844×390:

- Header sun visible on ivory; click → dusk, moon, `data-theme="dark"`; reload persists `'dark'`.
- Settings → Match device, OS dark → dusk without a header click; header then shows moon.
- Header click while Match device is selected → preference becomes explicit opposite; flipping the OS no longer changes the page.
- Active play: moon still tappable; round is **not** interrupted; garden soil/peppers unchanged.
- Pause panel has no extra theme control.
- Storage warning and loading screen in dusk.
- `theme-color` meta in DevTools; skip status-bar experiments.

### Automated

`tests/core.test.ts`:

- `coerceTheme` unknown / missing → `'light'`.
- `resolveTheme('system', true) === 'dark'`, `('light', true) === 'light'`.
- `protocolFor('training', { ...defaults, theme: 'dark' })` equals `protocolFor('training')`.

`tests/browser.spec.ts`:

1. Click header (label `/dusk/i`), expect `html[data-theme=dark]`, reload persists, `localStorage['worm-theme'] === 'dark'`.
2. `emulateMedia({ colorScheme: 'dark' })`, set Light in Settings, reload, still `data-theme="light"`.
3. Match device + emulate dark/light → `data-theme` follows without reload.
4. During a seeded playing session, click the header theme button; phase stays `cue`/`sort`/etc.; trial count does not jump.
5. Screenshots: `home-dark.png`, `game-dark.png`, `settings-dark.png`. Garden soil hex matches light screenshots.
6. Existing reduced-motion assertion still passes.

Do not add theme to the playability viewport matrix.

### Contrast checklist

- 13px muted footer on `--paper`
- Outline button on `--paper`
- Settings input text
- Notices / storage warning
- Both basket labels
- Danger delete
- Ivory on `--cta` (primary and brand stamp)

## 14. Risks

| Risk | Mitigation |
|---|---|
| Playing header overflow at 360px | Icon-only; if needed, chip name hides before the moon does. Check 360×640. |
| Accidental theme tap during recall | Instant chrome-only change; garden unchanged; 44px target but placed with the chip, not over the garden. |
| User stuck off-system after header click | Settings copy + Match device. |
| Missed hex | Grep allowlist. |
| FOUC | Boot no-op for missing/`light`; set `data-theme` + meta only when resolving dark. |
| `localStorage` blocked | `try/catch`; ivory then IndexedDB. |
| Two-tab drift | Last writer wins. No `storage` event sync. |
| Stimulus retint | No `Art.tsx` fill edits; soil allowlist. |
| Safari status bar | Do not touch the meta that controls it. |

## 15. Explicit non-goals

- Dark SVG plants
- Theme in CSV or `environment`
- `BUILD_VERSION` bump for chrome
- Prefers-contrast / forced-colors
- Per-gardener theme
- Colour transitions
- Pause-panel duplicate control
- `black-translucent` status bar

## 16. Technical references

- Reduced-motion: `dataset.reducedMotion` + `html[data-reduced-motion=true]`
- Pause invalidates: `Game.tsx` interrupt; do not copy the Sound-on-pause pattern for theme
- [MDN `prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [MDN `color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
- [MDN `theme-color`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta/name/theme-color)

No new dependency.

## 17. Acceptance criteria

1. Header sun/moon on every screen including play; click toggles ivory ↔ dusk and persists as explicit `'light'` / `'dark'`.
2. Settings offers Match device / Light / Dark; Match device restores OS following.
3. First visit (no stored preference) is ivory, including on a dark OS.
4. Returning dark preference does not flash ivory.
5. Play theme toggle does not interrupt or pause the round.
6. Chrome is readable in dusk; brand stamp and primary buttons stay dark green; garden stimuli unchanged.
7. Protocol hashes, scores, and trend matching unchanged.
8. `npm test`, `npm run build`, and `npm run test:browser` pass.
9. README mentions the header and Settings appearance control.

## 18. Delivery record

Implemented 10 September 2026.

- Light chrome tokenised; garden soil / plant-cell / halo / SVG fills left literal.
- Header sun/moon + Settings Match device / Light / Dark; default `'light'`.
- Unit tests, `tests/browser.spec.ts`, and production build passed. Playability viewport suite run at ship.
- Visual pass: ivory home unchanged in character; dusk is forest night with the pine stamp kept dark green. Dark `--surface` lifted to `#2c362e` so the selected appearance chip reads against the track.
- Playing-header moon did not break 320–1440 fit checks.
