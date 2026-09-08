# WorM · The memory garden

Play it at [https://doctoime.github.io/worM/](https://doctoime.github.io/worM/).

A browser working-memory training game: watch peppers ripen in a 3×3 garden, sort them for market or sauce, then recall their locations in order. Includes interactive onboarding, adaptive training, fixed memory check-ins, an original-style protocol, local profiles, session history, and detailed data exports.

The design was reviewed and planned before implementation in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). The two supplied source documents are preserved unchanged.

## Run it

Requires Node.js 22.19 or a compatible recent Node release, and npm.

```bash
npm ci
npm run dev
```

Open the local address printed by Vite. To choose a specific port:

```bash
npm run dev -- --port 5174 --strictPort
```

For a production build:

```bash
npm run build
npm run preview
```

The `dist/` directory is a standalone static site. Serve it over HTTP or HTTPS; do not open `index.html` directly as a `file:` URL. An HTTPS origin is recommended for hosted use. No backend, API keys, third-party fonts, analytics, or remote assets are required. The app runs without network requests during a session once loaded. Offline reload/install support is not included.

Use the same origin and browser profile to return to your saved garden: changing the hostname, scheme, or port gives the browser a different local data store.

## Play

1. Choose **Daily training** or **Memory check-in** on the home screen.
2. On the first visit, complete a sorting check, a two-plant recall check, and combined practice. Two consecutive successful combined rounds unlock the full session.
3. Remember the location of each ripe pepper. When prompted, choose **To market** for a good pepper and **Make sauce** for a worm pepper.
4. While the barn doors are closed, hold the order in mind.
5. Tap the green plants in the order they ripened.

Sorting supports pointer/touch, **A / left arrow**, and **F / right arrow**. Recall supports pointer/touch and standard keyboard focus with Enter/Space. **Escape** or **Pause** takes a break. Pausing an active round discards that attempt from the score and starts a fresh sequence on return.

Settings include separate local gardeners, nickname, number of training rounds, starting span, retention interval, gentle sound, reduced motion, and optional ruler-based garden calibration. Memory check-ins keep their own fixed settings. Training/practice support phones; check-ins and the original-style protocol require a viewport of at least 700×600 CSS pixels.

## Protocol decisions

The original spec and its review disagree in several consequential places. The implementation exposes separate, versioned protocols instead of mixing their rules.

| Mode | Load and progression | Timing | Recall responses |
|---|---|---|---|
| Daily training | Start at chosen span 2–7; 3/5 strict successes promotes; failed block reduces load; three consecutive failures enter guided support | 1 s location cue; up to 3.5 s central sorting; chosen 3/5/15 s retention | Repetitions permitted and scored |
| Memory check-in | Exactly five rounds each at spans 2, 3, 4; no performance gating or guided assistance inside scored rounds | 1 s location cue; fixed 2.5 s central sorting even after an early answer; 15 s retention | Repetitions permitted and scored |
| Original-style protocol | Five rounds per span 2–4; at least 3/5 strict successes to advance; first failed block ends session | Location remains ripe through sorting; 15 s retention | Repeated cells rejected |
| Combined practice | Span 2; two consecutive strict successes, maximum six completed attempts | 1.5 s cues; up to 5 s sorting; 3 s retention | Unscored familiarisation |

All protocols use nine plants and uniformly shuffled distinct target locations. Standard modes use independent 50% worm probability, including span 2. The original-style protocol has no worms at span 2, then 40%/50% probabilities at spans 3/4. Homogeneous good/worm sequences and simple spatial paths are allowed; generation does not force a predictable final category.

Every pepper requires a sorting response. Between items there is a 400 ms feedback hold and 400 ms neutral interval. The last item is followed by a 500 ms green hold and the barn delay. Recall has a 20-second deadline, extended to 30 seconds for practice. Sorting timeouts and partial recall are retained as behavioural omissions; unadministered rounds are not fabricated as errors.

Guided support reduces span by one, clears the incomplete standard block, and uses slower cues, a longer sorting window, shorter retention, and optional post-response replay. Three consecutive guided successes return to standard training. Six guided attempts without that criterion finish the sitting. Guided rounds never count toward the standard score or round quota. Session round/time caps take precedence over more practice. Ten interruptions finish the session as incomplete.

The implementation uses an immediately identifiable ripe cue lasting the specified duration, rather than gradually making it identifiable during a colour fade. This gives a clear software cue onset and respects reduced-motion preferences. The original-style condition reconstructs documented mechanics with explicit implementation defaults; it is not an official EMPOWER executable.

## Scores

Results keep memory and sorting separate:

- **Order remembered:** exact ordered sequences / eligible completed rounds.
- **Peppers sorted:** correct classifications / all sorting opportunities, including omissions.
- **Places in the right position:** correct serial positions / all target positions.
- **Both tasks fully correct:** perfect serial recall and every classification correct.
- **Longest recall:** maximum span with at least one perfect serial recall.
- **Mastered span:** maximum span in a complete five-round block with at least three strict successes.
- **Sorting speed:** observed response latency from the sorting prompt/eligibility, separated for correct and incorrect responses; count, mean, median, and IQR are available in the scoring module.
- **Recall timing:** first response latency and subsequent inter-response intervals are kept separate.

The spatial cue precedes sorting eligibility; its phase event is retained so analyses can also derive elapsed time from the first spatial/category presentation. A timeout has a null observed RT, not an invented deadline-length response. Guided, practice, interrupted, and assisted attempts are excluded from standard score denominators.

The journal shows each session independently. A check-in trend appears only when there are at least two completed assessments with matching protocol configuration, viewport, pixel ratio, browser identifier, calibration, and observed input modalities. Training visits at different spans/settings are not collapsed into one mixed-difficulty progress curve.

## Data, recovery, and export

Data lives in IndexedDB database `worm-garden`, schema version 1. Stores are `profiles`, `preferences`, and `sessions`.

Each session includes the resolved protocol and hash, session/attempt seeds, actual target sequences and qualities, version identifiers, input/environment metadata, append-only ordered events, sorting and recall responses, trial status, derived scores, and adaptation decisions. Trial IDs are unique; interrupted attempts are preserved and replaced with a new attempt/seed at the same scheduled round.

Writes are serialised. “Saved on this device” means the latest session write completed, not that a remote backup exists. Browser storage can be cleared or unavailable. If a write fails, the app retains the in-memory session, displays a warning, and keeps export available.

Reload recovery retains committed completed rounds and invalidates any partially memorised attempt. The engine never resumes an old sequence halfway through. A crash can lose responses after the most recent completed write. An active session's latest checkpoint is recovered on the next visit to the same origin/profile.

Download JSON or CSV from results, or all finished sessions for the selected gardener from the journal:

- **JSON:** complete versioned record, including every event and realised stimulus. Use this for backups and detailed analysis.
- **CSV:** one row per attempt, with raw sequence/response arrays encoded as quoted JSON cells and separate score columns. Interrupted attempts retain null scores. Spreadsheet formula prefixes are escaped.

Backup import is not included in this release. Exported JSON can be archived or analysed independently; do not assume the app can restore it through a file-upload UI. Deleting a gardener removes that profile and its sessions in an IndexedDB transaction after explicit confirmation. A previously exported backup is unaffected.

## Timing and technical integrity

`Engine` is independent of React and accepts an injected monotonic clock. One animation-frame loop drives phase deadlines. The log includes intended transitions, observed software phase onsets, deadlines, latency, accepted/rejected inputs, and frame gaps. These are software estimates rather than physical display measurements. A frame gap over 1000 ms interrupts the round; gaps over 100 ms are logged.

The game handles hidden tabs, lost window focus, viewport changes, explicit pauses, adult help, and reload recovery. Inputs outside the eligible phase, keyboard repeat, duplicate sorting, and rapid duplicate recall delivery are rejected with reasons. Pointerdown and synthetic click are not both accepted for the same pointer action.

No service worker updates or network asset loads occur inside the task. Fonts use system stacks; art is original inline SVG. Browser/audio setup never controls the phase engine. Physical size calibration is optional and invalidated by a viewport/pixel-ratio change. The actual presented geometry remains relevant even when a requested 16 cm garden cannot fit.

## Project layout

```text
src/core/        protocols, seeded generator, scoring, adaptation, trial engine
src/data/        transactional storage and JSON/CSV export
src/components/ garden art, input controls, onboarding, game, results, settings
src/App.tsx     navigation, profiles, persistence status, session lifecycle
src/styles.css  original responsive design
tests/          core, fake-clock engine, and real-browser tests
```

The implementation plan contains the fuller provenance register, formulas, state machine, default values, and verification criteria. `copy.ts` centralises the repeated timed-phase instructions; other English interface text remains colocated with its component. Full translation infrastructure is a future extension.

## Verification

```bash
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Playwright uses port 5174 and reuses the matching local dev server, or starts one if needed. Its browser clock exercises the real production engine without adding test-only timing switches or answer hooks to the app. Test fixtures create deterministic sessions through the same local storage and engine modules used by the interface.

The test suite covers generation, scoring, missingness, adaptation, fixed timings, repeat/early inputs, interruption/recovery, profile isolation, onboarding, complete training and assessment sessions, downloads, history persistence, and responsive layouts. Screenshots are written under `test-results/` when the browser suite runs. That directory is generated and ignored by source control.

Real physical tablet/touchscreen timing, browser storage eviction under device pressure, and external display/input timing measurements require device testing beyond automated desktop browser checks. Cross-browser/device equivalence is not inferred from these checks.

## Source and extension boundary

Designed from [WorM_Game_Specification.md](WorM_Game_Specification.md) and [WorM_Browser_Scientific_Design_Review.md](WorM_Browser_Scientific_Design_Review.md), with task attribution to Ferreira et al. (2025), [Neurodevelopmental disorders: assessing and training working memory](https://doi.org/10.1186/s40359-025-02912-9), and the EMPOWER project described in those documents. All included game artwork is newly authored.

Browser references: [Vite](https://vite.dev/guide/), [animation-frame scheduling](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), and [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

Future extensions include backup import/cloud sync, an independent cognitive-task battery, translated/voice instructions, optional install/offline support, and a teacher dashboard. These are deliberately outside the shipped game. No public deployment, accounts, or external messages were created.
