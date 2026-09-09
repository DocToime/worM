# WorM testing and playability review

Baseline review: 9 September 2026 against commit `b7fd656`, before the interface changes. The findings and evidence below describe that original version. The fixes and verification are recorded in [IMPLEMENTED.md](IMPLEMENTED.md). This folder contains the review, repeatable browser audit scripts, screenshots and measurements.

**Recommendation: keep the garden artwork and simplify the interface substantially. Fix the blank-screen crash and viewport layout before cosmetic polishing.** The memory and sorting engine has useful test coverage, but the interface currently makes players manage scrolling, changing instructions and repeated introductions alongside the memory task.

## What was tested

| Check | Result |
| --- | --- |
| `npm test` | 41 tests passed: generation, scoring, timing, adaptation, omissions, interruptions, recovery and export logic |
| `npm run build` | TypeScript and production build passed |
| `npm run test:browser` | All 6 existing Chromium browser tests passed, including complete five-round training and fifteen-round assessment sessions |
| Additional responsive audit | 14 viewport sizes; home, tutorial introduction, ready screen, cue, sorting, retention, recall, failed feedback and partial results |
| First-visit touch journey | Completed tutorial and two successful combined-practice rounds using emulated touch; reproduced late rejection of phone check-in |
| Focused edge cases | Reproduced finish-before-start crash, hidden mode selection, calibration overflow and scroll persistence; checked keyboard focus and viewport interruption |

The additional audit deliberately exercised failures and omissions, not only perfect rounds. Main matrix: no horizontal overflow and no browser exceptions; focused edge cases: one confirmed exception. **Seven of fourteen matrix sizes had sorting controls partly or wholly outside the viewport at scroll position zero.**

These are local Chromium tests with simulated CSS viewports. They do not establish Safari/Firefox compatibility, physical touchscreen behaviour, screen-reader usability or clinical effectiveness. Timing was accelerated with Playwright's browser clock for repeatability; this is not a real-time human usability study. The production bundle was built, but the interactive audit ran against Vite's local development server.

## Fix first

### 1. P1 — “Finish for now” can crash to a blank screen

**Reproduction:** with an onboarded profile on desktop, open the original-style protocol, then choose **Finish for now** on the ready screen without starting a round. The entire app becomes blank. Chromium reports `Cannot read properties of null (reading 'span')`.

**Cause:** `Game` renders its active-play branch for the transient `complete` phase. With no trial created, the phase counter dereferences `t!.span`. Navigation to results occurs later in the animation-frame callback. This renderer is shared by all modes, so the zero-trial path needs coverage across them.

**Change:** give the complete state an explicit safe render path, and handle a session with no trials without accessing trial fields. For the player, leaving before starting should return home or show a simple “Session not started” state. Add a browser regression for this exact action and check for console/page errors as well as navigation.

Source: [Game.tsx](../src/components/Game.tsx), particularly lines 53–56 and 118–125. Evidence: [edge-cases.json](evidence/edge-cases.json), `finishBeforeFirstRound`.

### 2. P1 — Timed sorting controls require scrolling on common screens

At **375 × 667**, the garden is visible but both sorting buttons begin below the screen: their top is approximately **692 px** and bottom **788 px**. Players have only 3.5 seconds to sort in standard training. Keyboard hints are also hidden at phone widths.

At **1440 × 900**, sorting buttons run from **860–950 px**, leaving their lower section off-screen. At **700 × 600**, the app permits a memory check-in even though its buttons run from **566–639 px**. Phone landscape is substantially worse: at 844 × 390, much of the pepper itself is outside the viewport.

The app stacks the site header, mode/actions, progress bar, round metadata, large phase heading, explanation, square garden, counter, baskets, footnote and footer. Its height-based adjustment only applies below 821 px on widths above 650 px. Consequently, a taller desktop window can lose the compact layout and expose *less* of the required controls. Phone portrait has no comparable height budget.

**Change:** use a dedicated play layout constrained by available viewport height. Consolidate the top information into one small bar. Reserve room for the response controls, then size the garden from the remaining width **and height**. Keep the garden's position and dimensions stable throughout a round. Omit the global footer and decorative copy from active play.

For very short landscape windows, use a compact two-column play layout with the garden and response controls together, or explain the limitation before a timed round can begin. Do not solve overflow by simply clipping the page or shrinking targets without a usable minimum size.

Source: [styles.css](../src/styles.css), play-surface rules and final height media queries; [Game.tsx](../src/components/Game.tsx), lines 99–127. Evidence: [375 × 667](evidence/sort-375x667.png), [1440 × 900](evidence/sort-1440x900.png), [assessment at 700 × 600](evidence/assessment-700x600.png), [landscape](evidence/sort-844x390.png).

### 3. P1 — Calibration overrides the layout's height protection

At **1366 × 768**, the normal garden is approximately 323 px square and sorting buttons just fit. Saving the default ruler calibration increases the displayed garden to **420 px**, pushing buttons to **785–860 px**, wholly below the viewport.

`Garden` applies an inline width when calibration exists. That overrides the stylesheet's height-sensitive width cap. The calibration copy promises a requested garden size “when it fits”, but only horizontal fit is effectively protected here.

**Change:** treat calibration as a requested size within the same width-and-height budget as ordinary play. Display and record the actual size and any constraint. Verify both calibrated and uncalibrated layouts before accepting a screen for check-ins.

Source: [Garden.tsx](../src/components/Garden.tsx), line 7; [Game.tsx](../src/components/Game.tsx), line 96. Evidence: [calibrated laptop screenshot](evidence/calibrated-1366x768.png), `checks.calibrated` in [measurements.json](evidence/measurements.json).

### 4. P2 — Unsupported check-in is rejected after completing onboarding

**Reproduction:** new profile at 390 × 844 → select **Memory check-in** → start → complete sorting tutorial, recall tutorial and two successful combined-practice rounds → **Start my session**. Only then does the app return home and explain that a larger screen is required.

This creates an avoidable dead end after meaningful effort. The existing phone browser test explicitly accepts entry to the tutorial and stops there.

**Change:** show check-in availability on the home screen and validate the selected destination before onboarding. On a phone, a short explanation such as “Check-ins need a larger screen” should accompany the unavailable option; keep training immediately available. Use player-facing language rather than CSS-pixel requirements in the main flow.

Source: [App.tsx](../src/App.tsx), lines 33–50. Evidence: `checks.phoneCheckIn` in [measurements.json](evidence/measurements.json).

### 5. P2 — Failed rounds make continuation unnecessarily hard

On a failed round, a 230 px replay garden appears even before the player requests a replay. It pushes **Next harvest** to approximately **834–883 px** on a phone and **885–934 px** on a 1366 × 768 laptop. The extra scrolling is imposed precisely when the player is already struggling.

Also, scrolling survives game phase changes: the app only resets scroll when changing top-level screens. In the 375 × 667 input check, revealing and clicking the sorting control left the page at `scrollY = 121`; the top of the pause toolbar was then above the viewport. Playwright automatically scrolls controls into view before clicking, which can conceal this problem in passing tests.

**Change:** put a concise result and **Next round** first. Keep **Replay order** secondary and instantiate/show the replay garden only when requested. Use the same compact feedback layout for success and failure. The primary remedy for phase scroll persistence is a play surface that fits; resetting scroll on every timed phase would introduce further movement.

Source: [Game.tsx](../src/components/Game.tsx), lines 104–117; [App.tsx](../src/App.tsx), line 22. Evidence: [failed feedback on phone](evidence/failed-feedback-375x667.png), [failed feedback on laptop](evidence/failed-feedback-1366x768.png), [edge-cases.json](evidence/edge-cases.json).

### 6. P2 — Keyboard play needs clearer focus and phase behaviour

The keyboard audit found focus on `BODY` after starting and still there on entering recall. Tab can reach the plants, but all nine are individual tab stops; after them it also reaches the unavailable market and sauce buttons. Those buttons use `aria-disabled`, which does not remove them from the focus order. The engine rejects unavailable actions, so this is an interaction problem rather than accepted invalid scoring.

The global game key handler captures left/right arrows in every phase, including recall. That currently prevents those keys from being used for spatial garden navigation. The recall counter also updates an `aria-live` region every second; inspect its actual screen-reader output before claiming accessibility.

**Change:** give recall one entry point and predictable spatial keyboard navigation, with Enter/Space to select. Restrict sorting shortcuts to sorting and manage focus when controls disappear. Remove unavailable controls from the tab sequence. Announce phase changes and accepted picks concisely; keep the changing countdown outside routine live announcements. Coordinate any keyboard mapping change with the app's recorded input metadata.

Source: [Garden.tsx](../src/components/Garden.tsx), line 8; [Game.tsx](../src/components/Game.tsx), lines 23, 61–67 and 125. Evidence: `checks.keyboard` in [measurements.json](evidence/measurements.json). Screen-reader behaviour remains a follow-up device test, not a confirmed audit result.

### 7. P2 — The home screen can launch a mode that is not selected visibly

**Reproduction:** enter original-style mode, start a round, pause, finish, return home. Both visible mode buttons have `aria-pressed="false"`. The page retains original-style mode internally, displays **10 rounds · up to 10 minutes**, and starts original-style mode again when its main CTA is pressed. The protocol actually specifies 15 rounds with gating and a 20-minute cap.

**Change:** represent the active mode visibly and derive all explanatory text and duration from its resolved configuration. Alternatively, reset the ordinary home screen to training when leaving the advanced protocol. If a session is already active, explicitly identify the mode being resumed and avoid presenting a misleading mode choice.

Source: [App.tsx](../src/App.tsx), lines 69–78. Evidence: `modeAfterOriginal` and `modeStarted` in [edge-cases.json](evidence/edge-cases.json).

## Measured screen-size results

Coordinates are approximate CSS pixels, measured from the page top with the active-play page scrolled to zero. Tiny differences can occur during entrance animation. “Fits” means the entire sorting-button row is inside the viewport; it does not mean the whole page fits.

| Viewport | Home page height | Sorting buttons, top–bottom | Buttons fit? | Failed-round Next button, top–bottom |
| --- | ---: | ---: | :---: | ---: |
| 320 × 568 | 2140 | 637–733 | No | 873–922 |
| 360 × 640 | 2138 | 677–773 | No | 834–883 |
| 375 × 667 | 2153 | 692–788 | No | 834–883 |
| 390 × 844 | 2134 | 707–803 | Yes | 834–883 |
| 412 × 915 | 2103 | 727–823 | Yes | 834–883 |
| 667 × 375 | 1211 | 566–639 | No | 857–906 |
| 844 × 390 | 1154 | 566–639 | No | 857–906 |
| 700 × 600 | 1154 | 566–639 | No | 857–906 |
| 768 × 1024 | 1173 | 805–895 | Yes | 886–935 |
| 1024 × 768 | 1263 | 687–762 | Yes, narrowly | 885–934 |
| 1280 × 720 | 1330 | 639–714 | Yes, narrowly | 885–934 |
| 1366 × 768 | 1330 | 687–762 | Yes, narrowly | 885–934 |
| 1440 × 900 | 1349 | 860–950 | No | 904–953 |
| 1920 × 1080 | 1343 | 860–950 | Yes | 904–953 |

At 390 × 844, home occupies roughly **2.5 screen heights**. At 320 × 568, even the Start button is below the initial viewport. The 390 px active-play page is 921 px tall even when all response controls fit; its remaining scroll is mostly supporting material/footer. These are different problems and should be prioritised accordingly.

Full measurements also include the tutorial, retention, recall, ready screen and partial results: [measurements.json](evidence/measurements.json).

## Design and copy changes

### Keep the visual identity, reduce its demands on the player

The cream/green palette, original pepper artwork and three-by-three garden are coherent. Market and sauce are visually distinct. The successful sorting/recollection tests support preserving the core interaction, and separating sorting from memory scores is useful.

The excess comes from how often the gardening metaphor is explained. “Harvest” means a round in some places and a whole session in others. An app for working memory should be especially careful about adding reading and interpretation to the task.

**Home:** retain a small brand, a direct explanation, mode choice, duration, one primary Start/Resume button and a How to play link. Reduce or remove the large static demonstration garden on small screens. Move visit counts and longest sequence to Progress. Remove the welcome strip, repeated taglines, decorative captions and three empty first-visit statistic cards. Aim for the primary flow to fit on a 360 × 640 portrait screen without reducing readable text sizes.

**Tutorial:** keep the actual sorting and recall checks. Remove the separate decorative introduction where the same teaching can happen beside the first example. Consolidate the ready screen, practice completion screen and subsequent ready screen so players do not repeatedly confirm that they are ready. Preserve the required comprehension/practice criteria unless the protocol owner deliberately changes them. Explain errors directly, without making every correction a gardening slogan.

**Active round:** one direct instruction at a time. Use the same stage rectangle for the cue, sorting pepper, barn and recall. The sorting card currently repeats “Market or sauce?”, “No worm → market…”, “This pepper goes to…” and “Choose a basket below”; two labelled response buttons already carry most of that meaning. Reserve their space throughout the round to keep the garden fixed, but remove decorative secondary button text. Avoid retaining an emphasised previous sorting selection during recall.

**Feedback:** show “Round complete”, “Memory 2/3 · Sorting 3/3”, **Next round**, and an optional Replay order action. Encouragement can be brief and varied. Make timeouts explicit: the current generic “Pepper sorted” phase title is also used after a missed response, even though no choice was recorded.

**Results:** show two principal scores with denominators, rounds completed and a clear completion status. Use “Remembered 4 of 5 sequences” alongside a percentage. Move longest recall, timing, technical details and downloads into secondary disclosure. On 390 × 844 partial results, the primary action group currently begins at about 962 px; bring useful actions above ornamental artwork and extra metrics. Show raw internal end reasons in friendly language.

**Progress/settings:** name these screens directly. Settings scrolling is acceptable; timed-response scrolling is not. Keep basic preferences separate from advanced calibration/protocol controls. Practice history currently uses the standard summary, which deliberately excludes practice and therefore yields “—” and zero scored rounds; present practice completion as practice, not as an apparently empty scored visit. This last point is established from the rendering/scoring code, not an additional history browser assertion.

### Suggested replacements

| Current copy | Suggested copy/action |
| --- | --- |
| A fresh day in the garden / Take a breath. Make a little progress. | Remove |
| A mindful workout for your working memory | Memory game |
| A little garden. A growing memory. | Keep as a short optional brand line; do not stack more taglines around it |
| Watch the peppers ripen. Find them a good home. Remember the little journey along the way. | Remember the plants, sort each pepper, then tap the plants in order. |
| Start my harvest / Return to my harvest | Start training / Resume training; use the actual chosen mode |
| No rush. Just a little focus. | Remove; the sorting and recall tasks are timed |
| Good things grow with a little attention. / EST. TODAY | Remove |
| Watch where it ripens. + Remember this plant. You’ll pick it later. | Remember this plant. |
| This pepper goes to… / Choose a basket below | Remove; keep “Market or sauce?” |
| A little worm? Still useful. | With worm |
| Ripe, fresh & worm-free. | No worm |
| A moment in the barn. / Keep the order growing. / No picking just yet. | Remember the order. |
| Your turn to harvest. + Tap the plants in the order they ripened. | Tap the plants in order. |
| Pick directly in the garden. The baskets can rest. | Remove |
| A lovely little harvest. / Every harvest is practice. | Round complete. |
| Next harvest / See my harvest | Next round / Results |
| A little breathing room. | Paused |
| We’ll begin the next round with a fresh sequence. | This round will restart with new plants. |
| Little by little, visit by visit. | Progress |
| Another little harvest | Play again |

The measured home screen contains about 205 visible words on a phone. A reasonable design target is roughly 60–90 words including controls, moving supporting explanations behind How to play. This is a suggested editing target, not a usability result.

### Readability

Supporting text is repeatedly very small: phone basket descriptions are 8 px, desktop game metadata can be 10 px, and main phase explanations are 11–13 px. Computed instruction colour is `#818a77` against `#f8f7f1`; several other labels are paler. Screenshots confirm that instructions have much less visual weight than decorative headings.

Remove words and excess spacing first, then give essential instructions and control labels more size and contrast. Suggested starting point: 14–16 px for instructions/control text, with strong dark-green text; reserve pale colours for decoration. Test enlarged text, keyboard focus and screen readers explicitly. No formal accessibility conformance claim is made by this review.

## Proposed compact play structure

```text
WorM        Round 2/10        Pause

          Remember this plant

          ┌─────┬─────┬─────┐
          │     │     │     │
          ├─────┼─────┼─────┤
          │     │     │     │
          ├─────┼─────┼─────┤
          │     │     │     │
          └─────┴─────┴─────┘

                 1 of 3

       [ Market ]    [ Sauce ]
         No worm     With worm
```

During sorting the central pepper occupies the same stage; during retention it shows the barn; during recall the garden becomes interactive. Controls and stage stay in the same places. Sound and secondary help can live in the pause panel. Preserve the existing timing, scoring and difficulty rules while making these layout/copy changes; any deliberate task-rule changes should be reviewed separately for their effect on comparability.

## Acceptance checks for the developer

1. Leaving every ready screen before the first round produces no blank screen or browser exception.
2. At every supported size, the complete garden/stimulus, response buttons and pause action fit simultaneously during all active phases, with and without calibration. Include heights immediately below and above 820 px.
3. Assert bounding rectangles **before** Playwright clicks anything; automatic scrolling must not make a failing layout appear usable. Include a real touch-input round rather than only mouse clicks in a narrow window.
4. Advance from ready → cue → sort → recall → success/failure feedback → next round without manually repositioning the page. Keep the spatial stage fixed within a round.
5. The primary Next/Results action is visible on both successful and failed rounds before opening a replay. Include guided-support notices and final-round feedback.
6. Unsupported check-in devices receive an explanation before any tutorial effort; recheck availability after rotation or resizing. The stated minimum viewport must actually fit the check-in UI.
7. Complete sorting and a nonsequential recall with keyboard only; check focus after removed buttons, unavailable controls and phase transitions.
8. Returning from the advanced protocol shows an explicit selected mode and matching round/time metadata.
9. Check text enlargement and browser zoom, then test real iPhone Safari, Android Chrome, tablet portrait/landscape and desktop Firefox. Browser toolbar expansion, safe areas and virtual keyboards require physical-device follow-up.
10. Run the existing 47 tests again after changes to ensure layout simplification preserves scoring, fixed assessment timings, recovery and exports. Add regressions for the reproduced failures rather than relying on screenshots alone.

## Reproducing this review

Run the local server in one terminal:

```sh
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Then run these diagnostic scripts from the repository root:

```sh
node review/audit.mjs
node review/edge-cases.mjs
node review/capture.mjs
```

These original diagnostic scripts target the baseline UI at `b7fd656`; run them in a checkout of that version. For the updated interface, run `npm run test:browser`, including `tests/playability.spec.ts`. They use isolated browser contexts and synthetic local profiles. They write screenshots and JSON under `review/evidence/`. They measure and reproduce the current behaviour; they are not an acceptance suite whose exit status certifies usability. `edge-cases.mjs` intentionally records the reproduced crash and continues the audit.
