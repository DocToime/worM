# WorM — browser implementation plan

Version: 1.0 · 8 September 2026

## 1. Product outcome and scope

Build a complete, locally runnable browser working-memory training game based on the two documents in this folder. The central experience is an inviting, quiet vegetable garden: remember the locations of ripening peppers, sort each pepper for market or sauce, wait behind the barn doors, then reproduce the order. Training is the product's purpose; improvement is the owner's hypothesis. The interface should support that purpose without repeatedly interrupting play with commentary about validation.

The first release includes a polished responsive application, onboarding with actual comprehension checks, adaptive training, a repeatable assessment, a separately identified reconstruction protocol, guided support, local participant profiles, persistent session history, useful performance summaries, JSON/CSV export, accessibility settings, interruption recovery, deterministic stimuli, auditable timing, and automated checks. It is a functioning application, not a mock-up. No account, API key, remote database, subscription, or paid asset is required.

Audience assumption pending feedback: mixed ages, including children playing with adult support. Use short, concrete copy, generous controls, original friendly art, and an uncluttered game surface. Do not collect age, diagnosis, email, or full name. A locally chosen nickname is sufficient. English is the first shipped language; centralise player instructions for future translations.

### Deliverables

- This implementation plan, written before application code.
- Vite + React + TypeScript source, checked dependency lockfile, run/build/test scripts.
- Pure generator, scorer, and adaptation modules independent of the interface.
- A monotonic-clock trial controller and append-only session event records.
- Original SVG farm, plant, pepper, worm, crate, jar, and barn illustrations.
- Complete home, how-to-play, active game, settings, results, and history screens.
- IndexedDB persistence with visible failure states and downloadable backups.
- Unit tests for scientifically material rules and browser tests for actual workflows.
- README documenting operation, decisions, data semantics, supported use, and remaining extensions.

## 2. Review decisions and requirement provenance

The supplied documents are the design inputs; retain them unchanged. “Specified” below means specified by the supplied reconstruction, not verified against an original executable. “Review” means a deliberate change recommended by the supplied review. “Product” identifies an implementation choice.

| Requirement | Origin | Implementation decision / acceptance criterion |
|---|---|---|
| Nine plants in a regular 3×3 square | Spec §§5–6 | Exactly nine stable, identical plant targets in every trial. IDs 0–8, row-major. |
| One pepper per plant | Spec §5 | Each target contains one green or ripe pepper, with an optional unmistakable worm. |
| Transient ripe location | Spec §6 | The spatial cue disappears before the next item; all plants are green in scored recall. |
| Concurrent binary sorting | Spec §§3,7 | Every target requires a real response, including no-worm reconstruction level 1. |
| Market left, sauce right | Spec §7 | Pointer baskets, A/F, and left/right arrows; consistent mapping in all modes. |
| Distinct uniformly sampled targets | Spec §8; review §7 | Seeded Fisher–Yates; do not filter rows, diagonals, or easy shapes. |
| Category randomness | Review §7 | Independent Bernoulli categories; do not force a final item to supply a missing category. |
| Sorting after spatial cue | Review §5 | Assessment uses a fixed 1 s location cue then a central classification cue for 2.5 s. |
| Fixed assessment exposure | Review §5 | Early sort responses do not shorten the processing interval. |
| Reconstruction response-dependent exposure | Spec §6 | Separate protocol retains the ripe location until response or timeout. |
| Fifteen-second retention | Spec §6 | Assessment/reconstruction: 15 s, after a 500 ms all-green hold. |
| Shorter training retention | Spec §6; product | Default 5 s; explicitly selectable 3/5/15 s before starting. Logged in immutable config. |
| Fixed 15-round assessment vs gating | Review §4 | All three blocks of five are administered at k=2,3,4; no gating or remediation. |
| Reconstruction gate | Spec §8; product | Five trials per k; 3/5 strict success advances; otherwise finish. k≤4. |
| Training k=2…7 | Spec §8 | Start at a chosen span; five-trial blocks, three strict successes promote. |
| Three consecutive failures | Spec §8; review §6 | Interrupt training progression with separate guided support; never blend guided scores into standard results. |
| Repeat recall selections | Review §7 | Assessment/training permit repetitions so those errors can be observed. Reconstruction disallows repeats. |
| Selection feedback | Review §7 | Brief neutral acknowledgement and generic count; no persistent path or numbers in scored recall. |
| Separate memory/processing | Review §6 | Exact order, position/set accuracy, sorting, omissions, RTs, and dual-task success stored separately. |
| Technical invalidity | Review §8 | Hiding tab, resizing, explicit pause, reload, and major frame gaps invalidate the active trial; fresh replacement on return. |
| Timing audit | Review §§8,10 | Planned deadline, actual transition callback, onset, eligibility, response timestamps, and frame gaps retained. |
| Local structured records | Review §10 | IndexedDB, versioned schema, session checkpoints; no silent “saved” indicator on failure. |
| Original assets | Spec §18; review §12 | Hand-authored scalable vector illustrations; no copied project assets. |
| No claims interruptions | User instruction | Training-oriented product copy; technical distinctions live in settings, records, and documentation. |

## 3. Visual and interaction design

### Visual direction

Create a garden journal aesthetic: warm ivory background, deep pine-green typography, sage panels, muted terracotta accents, yellow peppers, and a restrained earth palette. A compact brand mark and wordmark sit at the top. Use a system sans-serif for controls and a locally available serif stack for large editorial headings; no network font requests. Rounded panels, fine borders, soft shadows, and generous space make the app friendly without excessive animation. Custom SVG is appropriate because stimulus geometry must remain crisp and consistent at every size.

Home has a small seasonal/garden label, an expressive headline, one prominent start action, a garden illustration preview, a compact mode selector, and a small set of genuine local statistics. Empty history shows an intentional empty state rather than invented numbers. The training card explains the three actions in one sentence. A lower “How your harvest works” strip illustrates watch, sort, and remember.

The game is visually quieter: top row with mode, round, span, and pause; a phase instruction; the square garden; two large basket buttons; and a discreet phase-progress footer. Reduce moving ornament during timed phases. The retention overlay covers the entire garden and prevents interaction. Feedback occurs between trials with a clear next action; no long mandatory celebration.

### Responsive rules

- Desktop: centred max-width shell; home uses editorial copy beside the garden; active game stays centred.
- Tablet landscape: garden and phase instructions remain visible without narrow hit targets.
- Phone: stacked home, full-width controls, square grid, wrapped top bar, no horizontal scroll.
- Normal garden target: approximately 420–520 CSS pixels, bounded by available width and height.
- Minimum actionable control height: 44 CSS px; garden targets substantially larger where possible.
- Assessment start requires at least 700×600 CSS px; smaller screens can use training and practice.
- Record actual garden rectangle and viewport; never equate CSS centimetres with physical measurement.
- Optional ruler calibration: adjust a line until it measures 5 cm, derive pixels/cm, request a 16 cm garden, and report if the viewport cannot fit it. Invalidate calibration after viewport/pixel-ratio change.

### Accessibility

- Pepper ripeness has a visible halo/spark marker as well as green/yellow colour.
- The worm has a thick, friendly pink body and visible face.
- Basket labels include text, pepper pictures, and keyboard mappings.
- Use native buttons, labels, semantic headings, keyboard focus rings, and accessible dialog semantics.
- Honour prefers-reduced-motion; offer explicit reduced motion and sound controls.
- Sound starts only after a user action, uses short generated tones, and never provides an assessment-only category cue.
- All nine targets can receive standard keyboard focus; log keyboard activation as its own modality.
- Keep instructions available before a session, and make pause/end reachable throughout.
- Scored recall never reveals correctness per tap. Tutorial/guided feedback is clearly separate.

## 4. Application architecture

Use React for navigation and declarative UI, TypeScript for explicit data contracts, and Vite for development/build. Native SVG and CSS provide art. IndexedDB provides durable local structured storage. Use Vitest for pure logic and deterministic engine tests, Playwright for browser interaction. Avoid a large game engine, cloud dependency, state framework, component library, and third-party analytics.

Planned modules:

```text
src/
  main.tsx                 application bootstrap
  App.tsx                  screens, navigation, session lifecycle
  styles.css               design tokens and responsive styling
  components/Art.tsx       original reusable SVG art
  components/Garden.tsx    stable 3×3 stimulus display
  components/Game.tsx      controller binding, inputs, phase UI
  components/Settings.tsx profile and preference controls
  components/Results.tsx  summaries, history, matched trends
  core/types.ts           immutable protocol and data contracts
  core/protocol.ts        defaults, versioning, configuration hash
  core/random.ts          seeded streams and realised stimuli
  core/scoring.ts         pure trial/session scoring and RT summaries
  core/adaptation.ts      pure progression decisions
  core/engine.ts          phase machine, monotonic deadlines, event log
  data/storage.ts         IndexedDB profiles/session checkpoints
  data/export.ts          lossless JSON and analysis-ready CSV
  copy.ts                 reusable player-facing instruction strings
tests/
  core.test.ts            generation, scoring, controller invariants
  engine.test.ts          fake-clock phases, races, interruption
  browser.spec.ts         onboarding, play, recovery, export, layout
```

The final file boundaries may be simplified where that improves maintainability. The key boundary is non-negotiable: scoring, stimuli, and controller logic cannot depend on React, CSS, or animation completion events.

## 5. Immutable protocols

Each session stores the complete resolved config, protocol ID/version, generator/scoring/asset/build versions, and a stable config hash. Settings changes apply to the next session. Export must contain the actual config, not only its hash. All timing values are integer milliseconds.

| Parameter | Practice | Training | Assessment | Reconstruction |
|---|---:|---:|---:|---:|
| Initial sequence length | 2 | chosen 2–7, default 2 | 2 | 2 |
| Maximum span | 2 | 7 | 4 | 4 |
| Scheduled scored trials | 0 | chosen 5/10/15/20 | 15 | up to 15 |
| Trials per block | n/a | 5 | 5 | 5 |
| Spatial cue | 1500 | 1000 | 1000 | 1000 |
| Sorting window | 5000 | 3500 | 2500 | 3500 |
| Sorting display | central | central | central | ripe plant |
| Advance early after sort | yes | yes | no | yes |
| Neutral between-item interval | 400 | 400 | 400 | 400 |
| Feedback hold | 400 | 400 | neutral, fixed interval | 400 |
| All-green post hold | 500 | 500 | 500 | 500 |
| Barn retention | 3000 | chosen 3000/5000/15000 | 15000 | 15000 |
| Recall deadline | 30000 | 20000 | 20000 | 20000 |
| Worm probability | 0.5 | 0.5 | 0.5 at all spans | 0 at k2, 0.4 at k3, 0.5 at k4 |
| Repeat recall allowed | yes | yes | yes | no |
| Help during scored trials | unscored | invalidates standard score | invalidates score | invalidates score |
| End rule | 2 consecutive successes or 6 attempts | round/time cap or support cap | 15 valid rounds or time cap | gate fails, k4 block ends, or time cap |

No running mean changes assessment deadlines. Training adapts span only; chosen timing remains stable outside explicitly guided rounds. All modes have a 20-minute active-session cap checked between rounds. Training defaults to a ten-minute cap; practice to five minutes. Paused elapsed time counts toward the total sitting budget. An in-progress round can finish before the cap takes effect at its boundary.

## 6. Comprehension and onboarding

1. Introduce the three pepper states with large illustrations. Green stays on the plant; ripe goes to market; worm pepper becomes sauce. Briefly explain the order task.
2. Sorting-only check: show a good and a worm pepper centrally; require the appropriate basket for each. Incorrect choices receive a gentle explanation and can be retried.
3. Recall-only check: demonstrate a two-location path, reset all plants, and ask for the same two locations. Repeat demonstration after a failed attempt.
4. Combined practice: run the real engine at span 2 and shorter delay. Require two consecutive strict successes within six completed practice rounds. Persist practice separately.
5. On success record comprehension for the local profile and return to the selected training/assessment entry. On failure offer another practice session; do not record a low assessment result.
6. Previously successful profiles can start directly and always revisit instructions. Practice achievement is not a score or adaptation input.

## 7. Trial engine and timing

### State graph

```text
ready → cue → sort → sort-feedback → interval
            ↑                           |
            └──────── next item ────────┘
last item → green-hold → retention → recall → feedback
feedback → next round / guided support / session complete
active phase → interrupted → fresh replacement / session end
```

Each phase has an observed software onset and an absolute deadline calculated from its phase anchor. A single requestAnimationFrame loop calls the engine with performance.now(). Transitions compare the current monotonic time to the deadline. Fixed assessment sorting continues until the same deadline whether a response is immediate, slow, or missing. UI renders are notifications from the engine, not the source of timing. Do not chain setTimeout calls to run experimental phases.

On each frame, retain the previous frame timestamp. Log gaps above 100 ms. A gap over 1000 ms during an active task invalidates the round as a technical interruption rather than cascading multiple unobserved cues. Record planned and observed transition times and lateness. These timestamps are software estimates, not measured physical display onsets.

Spatial cues show the target ripe immediately with a redundant halo. Decorative reveal motion may run within the exposure but cannot gate category identity. In standard protocols the garden resets and a central pepper supplies the sorting stimulus. Reconstruction keeps the target ripe while waiting for the classification. During the retention interval only closed barn doors and a neutral countdown appear. Recall displays nine identical green plants and a generic response counter.

At a sort deadline, record an omission with null RT and the deadline; never fabricate a response. At recall deadline, preserve the partial response list, score missing positions as omissions for a completed behavioural trial, and proceed to feedback. An interrupted partial trial has no valid behavioural score and does not consume a scheduled round.

### Normalised input

- Use pointerdown for basket and garden responses. Do not also attach a normal pointer click path that double-submits touch input.
- Keyboard activation on focused buttons is accepted through click events with detail=0; direct A/F and arrow keys use keydown.
- Reject KeyboardEvent.repeat and track held keys until keyup. Clear held keys after focus loss.
- Only one sort per item is accepted; later responses are logged with rejection reason.
- Sort eligibility begins at the central cue in standard modes; reconstruction begins after its initial one-second cue.
- Recall accepts exactly k responses. Input outside the active phase is rejected and recorded.
- Reconstruction rejects repeated cells; other modes permit them.
- A short 120 ms recall debounce guards accidental double delivery without leaving selection cues; rejected events remain observable.
- Store modality, action, target, event time, acceptance, and reason. Record target geometry at session/trial start.

## 8. Generation and reproducibility

Generate a session seed with crypto.getRandomValues. Derive each trial seed from the session seed and monotonically increasing attempt number. Use a documented 32-bit PRNG with a deterministic Fisher–Yates shuffle of cells 0–8. Take the first k entries. Draw each quality independently using the protocol's probability. Record actual sequence and qualities as well as seeds, because future code changes may alter generation.

All retries use a new attempt number and seed. Interrupted trials remain in the session and replacements do not silently overwrite them. Do not reject straight paths, patterns, all-good trials, or all-worm trials. Decorative art uses no experimental random stream. A block may happen to be imbalanced; exports retain the realised categories for analysis.

## 9. Scoring definitions

Pure functions receive realised stimuli and response arrays and return reproducible results.

- Exact serial recall: response length equals k and every response equals the corresponding target.
- Position accuracy: matching positions / k; an omitted position is incorrect.
- Set correctness: exactly k submitted cells, no repeated cells, and the same membership as the target, regardless of order.
- Wrong order, correct set: set correctness true and exact serial recall false.
- Intrusions: responses not present anywhere in the target.
- Repetitions: response occurrences beyond the first occurrence of the same cell.
- Transpositions: submitted target cells occupying incorrect serial positions.
- Recall omissions: k minus submitted response count.
- Sort correct: observed category matches expected category and is not omitted.
- Sort wrong: observed, incorrect category.
- Sort omission: no observed response; RT remains null.
- Sorting accuracy denominator: all k sorting opportunities, including omissions.
- Exact-recall denominator: completed eligible rounds, including behavioural timeouts.
- Strict dual-task success: exact serial recall and all k sorts correct.
- Longest perfect recall: maximum k with at least one exact recall; show as a descriptive best, not a normative score.
- Mastered span: maximum k from a complete block of five eligible rounds with at least three strict successes.
- Recall initiation: first recall timestamp minus recall onset.
- Recall continuation: each later timestamp minus preceding accepted recall timestamp.
- Sort RT: response minus sort eligibility; summarise correct and incorrect observed responses separately with count, mean, median and interquartile range.
- Never pool sorting and recall RT into a single processing-speed score.

Guided, practice, interrupted, technical-failure, and assisted trials are excluded from standard summaries. Preserve their records and counts. Assessments stopped early have a partial/completed status and display completed/planned rounds; unadministered trials have no fabricated response rows.

## 10. Adaptation and stopping precedence

### Training

Use strict dual-task success to honour the reconstruction's 3/5 rule while displaying memory and sorting separately. Maintain a block of standard trial outcomes at a single span and a consecutive-failure count.

1. Save the completed trial before choosing another round.
2. If the selected round count or time cap is reached, finish the session.
3. Otherwise, three consecutive strict failures enter guided support immediately. Reduce span by one (minimum 2), clear the incomplete block, and reset the standard failure streak. Log discarded evidence window and reason.
4. Guided rounds have slower 1500 ms cues, a 5000 ms sort window, 3000 ms retention, and optional correct-path replay after response. They do not increment the standard round count.
5. Three consecutive guided strict successes return to standard timing at the reduced span with an empty block. Six guided attempts without meeting the criterion end the session with a practice recommendation.
6. At a complete standard block of five, three or more strict successes promote by one up to seven. Otherwise reduce by one down to two. Reset block and failure streak.
7. No promotion and demotion can occur for the same decision. Help takes precedence over a block decision; session cap takes precedence over help.

### Assessment

Five valid completed rounds at span 2, then five at span 3, then five at span 4, regardless of success. No help or adaptive timing enters scored rounds. Interruption replacements keep the same scheduled index/span. After ten interruptions end with an incomplete status so an unstable device cannot produce an endless assessment.

### Reconstruction

Five valid rounds at each span. Promote only for at least three strict successes; stop at the first failed block or after span 4. Preserve source-level category schedule and constrained recall rule. No guided support inside this score. This is explicitly a reconstruction configuration with documented defaults.

## 11. Interruption, assistance, and recovery

- Pause while waiting between rounds can simply open a break panel; active trial pause invalidates the current attempt.
- document.visibilitychange to hidden, window blur, orientation/size change, and a severe frame gap interrupt an active trial.
- The pause panel explains that the next round starts with new peppers. It offers continue, mark adult help, and finish session.
- Adult help is an event and excludes the affected attempt; do not convert an assisted success into assessment evidence.
- Continue always generates a fresh trial at the same scheduled index. Never restore a partially memorised sequence as a scored continuation.
- Every phase transition/checkpoint schedules local persistence; accepted responses/events remain in the latest session snapshot.
- On reload, find an active local session, preserve completed records, mark any open attempt interrupted with reason reload, and show a resume-or-finish card.
- If the browser crashes between checkpoints, only the most recent committed checkpoint is guaranteed. Record recovery and do not invent missing responses.
- Export is available from results and history even for partial sessions.

## 12. Storage and data contracts

IndexedDB database `worm-garden`, schema version 1, stores profiles, preferences, and sessions. Profiles have a random ID, nickname, creation time, and comprehension flag. The active profile ID is a local preference. Never combine one profile's progress with another's. Deleting a profile deletes its associated session records in one transaction after an explicit in-app confirmation.

Session record contains:

```text
schemaVersion, id, participantId, startedAt, endedAt, status, endReason
seed, protocol, protocolHash, buildVersion, assetVersion, scoringVersion
environment { userAgent, language, viewport, pixelRatio, orientation,
              gardenRect, calibration, inputMapping, sound, reducedMotion }
controller { span, blockOutcomes, failureStreak, guided, guidedStreak,
             guidedAttempts, validRounds, attemptIndex }
trials[] { id, attempt, scheduledIndex, seed, span, guided, assisted,
           targetCells, qualities, status, startedAtMs, endedAtMs,
           sortResponses[], recallResponses[], score, interruptionReason }
events[] { seq, trialId, atMs, type, data }
```

Each sort response stores item index, expected/observed category, eligibility time, deadline, actual response time, RT or null, modality, and omission flag. Recall records store cell, timestamp, cumulative elapsed time, and inter-response interval. Events contain monotonically increasing sequence IDs so ordering can be recovered even where timestamps are equal.

Writes are serialised to avoid an older snapshot overwriting a newer one. The UI says “Saved on this device” only after transaction completion. On storage errors, keep the in-memory session, show a persistent warning, and keep export usable. Do not show a successful persistence state when IndexedDB is unavailable. No network sync is implied.

JSON exports include full sessions, settings, and event records in a versioned wrapper. CSV exports one row per trial with participant/session/protocol identifiers, complete target/response arrays encoded as JSON cells, span, quality flags, raw RT arrays, and derived score columns. Escape quotes/newlines and guard spreadsheet formula prefixes in free-text identifiers. Missing RTs export blank/null, not zero. Download via a Blob/object URL, then revoke it.

Import accepts only a versioned WorM export after schema checks, refuses malformed records, and merges sessions by ID without duplicating them. Backup restore never executes imported text. This can be deferred if it would compromise export/recovery correctness; record any deferral in the final delivery notes.

## 13. Results and history

End-of-session copy thanks the player for the harvest. Display separate exact-order and sorting percentages, best recalled span, round count, and duration. Include an optional detailed table with strict success, omissions, interruptions, guided rounds, and response-time summaries. Show blank/em dash when there are no eligible data, never a fictitious zero performance score.

History filters by local profile and mode. A small SVG chart may show assessment exact recall across completed sessions with identical protocol hashes and compatible recorded viewport/input conditions. Training history should group by protocol, span and delay for comparisons; do not draw a single upward “improvement” line by mixing easier guided sessions into harder standard sessions. Include accessible textual values beside any chart.

Session detail exposes protocol and span-level breakdown, data export, and completion quality. Data management offers export all for the active profile and deletion with exact scope described. Do not build leaderboards, brain ages, or generic cognitive percentiles.

## 14. Verification plan

### Pure logic checks

- Same seed/config generates the same targets and qualities.
- Every generated target has k unique valid cells; lengths 2–7 respected.
- A broad deterministic sample visits all cells and permits simple paths and homogeneous categories.
- Exact/set/position scoring distinguishes perfect order, permutation, intrusion, repetition, and partial omission.
- Timeout sorting has null RT, counts in the denominator, and does not enter RT averages.
- Zero eligible rounds yields null summary proportions.
- Guided/interrupted/assisted results never contaminate standard summaries.
- Three-of-five promotion, demotion, span caps, immediate support precedence, guided return/cap, assessment fixed schedule, and reconstruction gate.
- CSV quote/formula handling and JSON round-trip shape.

### Deterministic controller checks

Inject time/environment so tests advance directly across deadlines without sleeping. Verify cue eligibility, fixed assessment processing despite early answers, last-item green hold, full retention duration, recall timeout, duplicate sorting rejection, phase-inappropriate input, repeated recall semantics, exact-k auto-submit, fresh sequence after interruption, and no extra scheduled round consumed by interruption. Confirm frame-gap invalidation and event ordering.

### Browser checks

- Home renders nine preview plants with working navigation and no console errors.
- Settings persist profile and selected preferences through reload.
- Tutorial requires actual correct responses and opens a real combined practice.
- Complete a correct training round with pointer/keyboard actions; inspect saved separate scores.
- Complete an assessment with accelerated browser clock and confirm 15 valid rounds and spans 2/3/4.
- Pause/hide/reload during a trial and verify a fresh replacement plus retained interrupted record.
- Download JSON/CSV and verify content from the browser, not just utility output.
- Exercise empty history and history after a saved session.
- Check at desktop, tablet, and phone widths for overflow and usable controls.
- Inspect screenshots of home, active cue, sorting, retention, recall, and results.
- Run production build and preview smoke test. Document real-device checks that cannot be performed in this environment.

## 15. Implementation order

1. Write this plan and resolve protocol conflicts explicitly.
2. Bootstrap project and pin available dependencies; create types and protocol definitions.
3. Implement deterministic generation, scoring, adaptation, and their tests.
4. Implement controller, event recording, input guards, and fake-clock tests.
5. Implement IndexedDB persistence and safe exports.
6. Draw original SVG assets and establish the responsive visual shell.
7. Implement onboarding, full game phase UI, training/support, and results.
8. Add settings, profiles, history, calibration, recovery, and data controls.
9. Run browser workflows, inspect screenshots, fix discovered problems, and re-run affected checks.
10. Write README and a delivery/verification section here; provide the local run command and precise remaining limitations.

## 16. Deliberate extension boundary

Independent cognitive batteries, controlled-study allocation, remote authenticated backup, teacher dashboards, Portuguese/Romanian translation, speech instructions, native store packaging, and an elaborate reward economy remain future extensions. Optional Home Screen install and offline reload shipped in 1.2.0; they must not displace correctness of the main trial loop. Do not invent clinical thresholds or a normative scoring model.

## 17. Technical references checked

The supplied spec and review contain the domain sources and remain the primary design record. Browser implementation references checked during planning: [Vite getting started](https://vite.dev/guide/), [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), and [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). Use the monotonic animation-frame clock for phase scheduling, and transactional local records for recovery; do not depend on remote requests during play.

## 18. Delivery record

Implementation and verification results will be appended after the build is exercised. Any departures from this plan will be explicit here and in the README.

PWA/offline (1.2.0): production-only Workbox precache, `registerType: 'prompt'` so a sitting is not swapped mid-round, Settings install/persist copy, and `displayMode` recorded on new sessions. Vite `base` remains `./`. GitHub Pages MIME type uses `manifest.json`. See `PWA_OFFLINE_IMPLEMENTATION_PLAN.md`.
