# WorM — Working Memory Serious Game
## Reverse-engineering specification for implementation

**Document status:** reconstruction spec (no public playable build exists)  
**Audience:** developers implementing or approximating the research game  
**Version:** 1.0  
**Date:** 2026-09-08  

This document reconstructs **WorM** (also written **Worm** in some EMPOWER materials) from published papers, project deliverables, consortium pages, and a public gameplay explainer. It is intended as a build spec, not as a claim that every timing constant below was published to millisecond precision.

Where sources disagree, the conflict is called out and a **recommended default** is given.

---

## 1. What WorM is (and is not)

| Attribute | Value |
|---|---|
| Full name | WorM (Working Memory game) |
| Product type | Child-focused **serious game** for **assessment + training** of working memory |
| Domain | Visuospatial working memory / updating; complex-span (Corsi-like + concurrent sort) |
| Theme | Eco-farm / food-waste reduction: harvest ripe yellow peppers, sort worm vs good |
| Target users | Children with neurodevelopmental disorders (NDDs); also piloted with typically developing children in some EMPOWER materials. Study 3 sample: N = 23 children with NDDs, mean age 10.78 (SD 1.65), 69.6% male, Romania + Portugal |
| Play mode | Single-player |
| Distribution | **Not** a public consumer app. Built for the EU Horizon Europe **EMPOWER** platform and research pilots. No store listing, no public play URL found. |
| Hardware in studies | Touch-screen tablet primary; also mouse/keyboard on computer |
| Parent platform | EMPOWER learning platform (executive functions + emotion regulation games, shared EcoFarm world) |

WorM is **both**:

1. an **assessment** instrument (span, sort accuracy, RTs, longest correct sequence), and  
2. an **adaptive trainer** (difficulty follows performance; a training/remediation path after repeated errors).

It is **not** the unrelated AI benchmark also called “WorM”, and not a commercial farm/idle game.

---

## 2. Canonical sources (read these first)

### 2.1 Primary scientific paper (must-read)

Ferreira, P., David, C., Costescu, C., Vera, L., Herrera, G., Lopes, S., Stilwell, D., Ferreira, A., Domingues, D., Brito, J., Campos, J., Paiva, A. M., Veiga Simão, A. M., Heldal, I., Stefanut, T., Rosan, A., & Trindade, F. (2025). Neurodevelopmental disorders: assessing and training working memory. *BMC Psychology, 13*, 1163.

- DOI: https://doi.org/10.1186/s40359-025-02912-9  
- PMC full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC12539114/  
- Springer PDF: https://link.springer.com/content/pdf/10.1186/s40359-025-02912-9.pdf  
- PubMed: https://pubmed.ncbi.nlm.nih.gov/41121405/  
- HTML full text: https://bmcpsychology.biomedcentral.com/articles/10.1186/s40359-025-02912-9  

Open access under **CC BY 4.0**.

**Figure 1 caption (paper):**  
“Instructions for players with examples of a ripe pepper, a pepper with a worm and a green pepper to choose from and then sort in the correct order of appearance.”

Supplementary materials (interview scripts / reflection sheet):

- https://media.springernature.com/original/springer-static/esm/art%3A10.1186%2Fs40359-025-02912-9/MediaObjects/40359_2025_2912_MOESM1_ESM.pdf  
- https://media.springernature.com/original/springer-static/esm/art%3A10.1186%2Fs40359-025-02912-9/MediaObjects/40359_2025_2912_MOESM2_ESM.pdf  
- https://media.springernature.com/original/springer-static/esm/art%3A10.1186%2Fs40359-025-02912-9/MediaObjects/40359_2025_2912_MOESM3_ESM.pdf  

Author response to reviewers (useful extra mechanics wording):  
https://static-content.springer.com/openpeerreview/art%3A10.1186%2Fs40359-025-02912-9/40359_2025_2912_AuthorComment_V5.pdf  

### 2.2 EMPOWER project (parent system)

- Project site: https://project-empower.eu/  
- CORDIS factsheet: https://cordis.europa.eu/project/id/101060918  
- Grant: Horizon Europe **101060918**, “EMPOWER. Design and evaluation of technological support tools to empower stakeholders in digital education”  
- Coordinator: Universitat de València (IRTIC)  
- Call: HORIZON-CL2-2021-TRANSFORMATIONS-01  

Public game-design write-up from IRTIC / UV (very clear two-task description):  
https://www.uv.es/uvweb/university-research-institute-robotics-information-communication-technologies/en/departments-news/sustained-attention-memory-training-two-nine-games-will-comprise-empower-application-1285923268336/Novetat.html?id=1286315131939  

Official explainer video (same text as the UV page):  
https://www.youtube.com/watch?v=IHK4uaepA8U  
Title: *Empower App Working Memory Game* (uploaded 2023-05-08)

### 2.3 Project deliverables (mechanics + measures)

Public EMPOWER deliverables on Zenodo (record 18404064 and siblings) include:

| ID | Title | Why it matters for WorM |
|---|---|---|
| D2.1 | Common framework for game development | Full game template: name, construct, stimuli, procedure, screenshots appendix |
| D2.3 | Conceptual development protocol of platform games | Maps WorM → computerized Corsi (Macizo, Soriano & Paredes, 2016) + updating (Miyake et al., 2000) |
| D3.2 | Platform features and abilities | EcoFarm as shared world; 9 games; prototype cycles |
| D3.6 | Final platform release | Deployment packages (local + remote), teacher tablet app, wearable HR app — **not public play** |
| D6.2 | Results of the validation study | Cleanest one-page task + telemetry list |

D2.1 excerpt (verbatim from public text):

> The task of the child is to pick up the yellow peppers as they ripe, while considering the order. They tap the peppers. Also, they will have to sort the good from the bad peppers, by clicking on the left key for the good peppers that go into the crate and then to the market and the right key for the peppers with a worm, that need to be salvaged, cut and cleaned. These peppers will get into pepper sauce or pickled peppers.  
> 9 pepper plants are in the vegetable garden (the lot is 16X16 cm). The peppers change colors from green to yellow (1 second), gradually, one by one in a random order. The pepper turns from green to yellow and back to the color from the start. The child sorts the peppers by clicking on the left and right keys.

D6.2 excerpt (verbatim sense):

> A type of concurrent span (complex) task in which in between the items to remember, the peppers that ripen (turn from green to yellow) in a garden with 3 rows and 3 columns, the child has to sort into two categories (peppers with worm and peppers without worm). After the sequence ends, the child responds by indicating the peppers in order.

### 2.4 Standardized-task ancestors (for fidelity)

Implementers should know the cognitive tasks WorM is gamifying:

- **Corsi Block-Tapping Test** (visuospatial span; sequential location recall). Computerized reference cited in D2.3: Macizo, Soriano & Paredes (2016).  
- **Complex span / concurrent processing** (encoding is interrupted by a secondary decision so the child cannot rehearse the path by staring).  
- **Working-memory updating** — Morris & Jones (1990); Carretti et al. (2010); Miyake et al. (2000) unity/diversity of EFs.  
- Comparison instrument in the paper: **CHEXI** working-memory subscale (Thorell & Nyberg), 9 teacher-rated items, Likert 1–5.

### 2.5 Related EMPOWER EcoFarm games (shared art direction)

Do not implement these, but keep visual language consistent if shipping inside a suite:

| Game | Construct |
|---|---|
| Mushroom Hunters | Sustained attention |
| ReFlex / Reflex — Going to the Farmers Market | Cognitive flexibility (WCST-like) |
| REStroop / ReStroop | Inhibitory control |
| BEeHOLD | Delay of gratification |
| Emotifest variants (Cornhole, Spin The Wheel, EggPyramid, EMOeggi) | Emotion naming / intensity / understanding / regulation |

Shared world: **EcoFarm** — ecological / anti-waste framing across all EF games (D3.2).

---

## 3. Design intent (why the dual task exists)

WorM is not “tap yellow things.” It is a **complex visuospatial span**:

1. **Storage + serial order:** remember *which plants* ripened and *in which order* (Corsi-like).  
2. **Concurrent processing / updating:** while the sequence is unfolding, classify each ripe pepper as **market-good** vs **worm-salvage**. The secondary task occupies attention so the sequence cannot be passively rehearsed on-screen.  
3. **Ecological meaning:** nothing is thrown away. Good peppers go to the market crate; wormy peppers are cut, cleaned, and turned into sauce or pickles.

Paper wording:

> Children must sort ripe peppers from those that are not and those that have a worm so none are wasted. While doing this, they have a concurrent task. Also, they need to remember the sequence of locations from which they are supposed to pick up the ripe peppers.

UV / video wording splits this into two scored tasks:

- Task A — sort ripe peppers into the correct basket (worm vs good) **while** tracking ripening order.  
- Task B — after the sequence, **select the same plants in the ripening order**.

**Implement both. Score both.**

---

## 4. Player fantasy and copy

### 4.1 Framing

> This is a lot from the farmer’s veggie garden. On this lot the farmer planted yellow peppers. They are about to ripe and the farmer needs to pick them up as they ripe, so no peppers will be wasted and there will [be] less weight for the pepper plant.

Tone: warm, concrete, non-punitive, short sentences. Study 1 experts required captivating interest, customization, short duration, rewards, feedback, and **clear instructions** with the right images and sound.

### 4.2 Pepper taxonomy (three visual states)

| State | Meaning | Player action during encoding | Destination |
|---|---|---|---|
| Green pepper on plant | Not ripe / baseline | None (ignore) | Stays on plant |
| Yellow pepper, no worm | Ripe, good | Classify **LEFT** = market | Crate → market |
| Yellow pepper + visible worm | Ripe, damaged | Classify **RIGHT** = salvage | Cut/clean → sauce or pickles |

Green is a distractor and the default plant state. Only yellow (ripe) items enter the to-be-remembered sequence.

### 4.3 Instruction screen (required)

Show three example images before the first real trial (matches paper Fig. 1):

1. ripe yellow pepper  
2. yellow pepper with a worm  
3. green (unripe) pepper  

Plus a one-line order instruction: “Watch the order they turn yellow. After the barn door, pick them in that same order.”

Suggested key legend on the instruction card:

- Left / A / left basket icon → good pepper → market crate  
- Right / F / right basket icon → worm pepper → salvage basket  

Experts in Study 2 asked for **pictures of peppers on baskets** and richer visual feedback.

---

## 5. Scene layout

### 5.1 Garden

- **Always 9 plants**, never more, never fewer.  
- Arrangement: **3 rows × 3 columns** (D6.2).  
- Physical size cited for the research lot: **16 × 16 cm** on the tablet surface. Treat this as the interactive garden area, not the whole screen.  
- Each plant bears **exactly one pepper** at a time.  
- Plants are spatially distinct enough for a child to point/tap without ambiguity (Corsi requirement).

Recommended plant IDs for logs:

```
0 1 2
3 4 5
6 7 8
```

Row-major, top-left origin. Store both ID and (row, col).

### 5.2 Other scene elements

| Element | Role |
|---|---|
| Garden plot / soil / eco-farm backdrop | Theme, not interactive |
| Left basket / crate | Good peppers → market |
| Right basket | Worm peppers → salvage / sauce |
| Barn door overlay | Retention interval / delay after encoding (~15 s) |
| Farmer or mascot (optional) | Instructions, praise; keep non-distracting |
| HUD | level, trial x/5, muted score if assessment mode |

Do not clutter the 3×3 grid with decorations that look like peppers.

### 5.3 Art notes from stakeholder studies

Study 1–2 design requirements to treat as product constraints:

- Captivating but **not overstimulating** (NDD-friendly).  
- Multiple colours used *functionally* (ripe vs unripe vs worm vs feedback), not decoratively.  
- Immediate **interactive visual feedback** for correct and incorrect sorting.  
- Images preferred over long text.  
- Sound effects present but interruptible / volume-controllable.  
- Short sessions.  
- Customization mentioned by experts (avatar, farm details) — nice-to-have, not required for cognitive validity.

---

## 6. Core trial loop (implement this state machine)

A **trial** = one sequence of length *k* plus the child’s two response streams.

```
SETUP
  choose k from current level
  sample k distinct plant indices, uniformly, without replacement
  for each of the k items, independently assign quality:
      Level 1 recommended: all GOOD (no worms)   [paper / reviewer response]
      Levels 2–3: mix of GOOD and WORM           [see §8]
  reset plants to GREEN

ENCODE  (for i in 1..k)
  plant[seq[i]] : GREEN → YELLOW (± worm sprite) over 1.0 s
  wait for sort response (left = good, right = worm)
      log RT_sort, accuracy_sort
      play feedback (visual ± audio)
  plant[seq[i]] returns to GREEN
      “The pepper turns from green to yellow and back to the color from the start.”

POST-ENCODE DELAY
  green plants remain visible 500 ms
  show barn door for 15 s
  (optional: very light idle farm animation; no extra memory cues)

RECALL
  garden reappears, all plants GREEN, no yellow leftover cue
  child taps / clicks k plants in remembered order
  accept exactly k selections (or a confirm button after k)
  log sequence, item-level correctness, RT per tap, total recall RT

SCORE + FEEDBACK
  compute trial correctness (see §9)
  show short visual outcome (crates filling, sauce jar, etc.)
  increment trial counter; maybe adapt level

NEXT TRIAL or END SESSION
```

### 6.1 Why the yellow flash is transient

If yellow stayed on the plant, recall would become a perception task (“which ones are still yellow?”). Returning to green forces **memory of locations and order**. This is the Corsi property. Do not leave ripened peppers yellow during recall.

### 6.2 Concurrent sort sits *between* memory items

D6.2: the sort happens **in between the items to remember**. That is the processing component of a complex span.

**Recommended default for encoding item i:**

1. Highlight / ripen plant `seq[i]` for 1000 ms.  
2. Keep the ripe appearance visible until the child sorts **or** a sort timeout fires.  
3. Apply sort feedback (~300–600 ms).  
4. Revert that plant to green.  
5. Brief ISI (recommended **250–500 ms**, not published — see §15).  
6. Next item.

If you skip the sort-wait and auto-advance at 1 s, children who are slower than 1 s will miss classifications. Study 2 asked whether **response time was adequate**; log it and consider an adaptive sort window.

### 6.3 Barn door

Paper: after the sequence, plants with green peppers remain **500 ms**, then a **barn door for 15 s**, then the garden returns for ordered picking.

Treat 15 s as a filled retention interval. Do not show the sequence during this time. A closed barn door is thematically “peppers went to the barn / wait for picking.”

**Assessment vs training:** 15 s is long for a child session of many trials. Keep it for research-faithful mode; offer a shorter delay (e.g. 3–5 s) only as an explicit “practice / young child” option, and flag it in the log.

---

## 7. Input

### 7.1 Two input channels

| Channel | Action | Device |
|---|---|---|
| Sort | Binary classification of the *currently ripe* pepper | Keyboard left/right; suggested keys **A** (good) and **F** (worm); on-screen basket hit-targets; optional left/right tap zones |
| Recall | Ordered selection of plants | Touch tap on plant; mouse click on plant |

Do **not** use the same gesture for sort and recall. The original design separates “which crate?” (keys / baskets) from “which plant in which order?” (taps).

Tablet-only build: draw two large baskets under the grid for sorting, and keep plant taps exclusive to the recall phase. Disable plant taps during encoding so a child cannot “pre-collect.”

### 7.2 Pointer vs keys

Sources mention both:

- “They tap the peppers.”  
- “clicking on the left key … and the right key”  
- UV: “select … with the mouse”  
- Studies: “touch screen tablet”

Support:

- **Tablet:** baskets for sort, plant taps for recall.  
- **Desktop:** A/F or Left/Right Arrow for sort, mouse for recall.  
- Show the active mapping on-screen at all times (Study 2: “using images, keyboard keys, multiple colors, or the phase of the trial”).

### 7.3 Illegal actions

| Phase | Ignore / block |
|---|---|
| Encoding | Taps on plants; sort before any pepper has ripened; double-sort |
| Delay | All garden input |
| Recall | Sort keys; selecting the same plant twice in one trial (unless you explicitly allow repeats — **do not**; sequences are distinct plants) |
| Any | Input on decorative sprites |

If the child taps a plant during encoding, do not treat it as recall and do not treat it as a sort.

---

## 8. Levels, trials, adaptivity

### 8.1 Published level table (Study 3 / paper)

| Level | Sequence length *k* | Trials | Cognitive framing | Worms |
|---|---|---|---|---|
| 1 | 2 peppers | 5 | Introductory, minimal load | No worms (recommended; author-response wording) |
| 2 | 3 peppers | 5 | Intermediate | Worms present |
| 3 | 4 peppers | 5 | Advanced | Worms present |

Paper discussion also says sequences of **2–7** exist in the broader design space. Study 3 only analysed levels 1–3 (2, 3, 4).

**Recommendation:**

- Ship **assessment protocol** exactly as Study 3: 3 levels × 5 trials, k ∈ {2,3,4}.  
- Ship **training protocol** that can continue to k = 5, 6, 7 after the child is stable at 4, matching the “2–7” remark. Cap at 7 (Corsi convention; 9 cells exist but span-7 is already hard).

### 8.2 Advancement rule (published)

> Level change occurs when children answer 3 out of 5 correctly from the previous sequence.

So: after 5 trials at length *k*, if `correct_trials >= 3`, promote to *k+1*.  

What “correct trial” means is defined in §9. Use the **strict** definition for promotion (sequence order correct **and** sorts correct), and also log a **lenient** sequence-only flag so researchers can re-score.

### 8.3 Demotion / training path (published)

- Training session / support if **3 consecutive mistakes**.  
- Difficulty “adjusts dynamically based on performance.”  
- Game is “calibrated according to each child’s needs during gameplay.”

**Recommended training-mode policy** (only the 3-in-a-row trigger is published; the rest is an implementation default):

| Event | Action |
|---|---|
| 3/5 correct at end of block | Increase *k* by 1 (max 7) |
| 0–2/5 correct at end of block | Repeat same *k*, or decrease *k* by 1 if *k* > 2 |
| 3 consecutive incorrect trials | Enter **guided training trial**: shorter delay, slower ripen (e.g. 1.5–2.0 s), on-screen replay of the just-shown path after response, extra feedback. Do not count guided trials toward assessment span. |
| 3 consecutive correct in training | Return to standard timing at current *k* |

### 8.4 Sequence generation rules

- Sample *k* **distinct** cells from 9.  
- Uniform random order (UV: “completely random”).  
- Avoid pathological paths if you want child-friendly UX (optional, not published): no identical sequence twice in a row; optionally reject sequences that are a perfect row or column for Level 1 only.  
- Seed the RNG per session and store the seed so a trial is replayable.

### 8.5 Worm schedule

Published signal: worms appear in levels 2–3, not level 1.

**Recommended default mix** (not published — document in code as a constant):

| Level | P(worm) per ripe item |
|---|---|
| 1 | 0.00 |
| 2 | 0.40 |
| 3 | 0.50 |

Guarantee at least one good and (from level 2) at least one worm when *k* ≥ 2 and P > 0, so the child cannot adopt a one-button strategy.

The paper’s IRT analysis treats items such as “Correct Pepper Classification with Incorrect Sorting” as distinct task types, so **sort errors must be possible and logged separately** from order errors.

---

## 9. Scoring and telemetry

### 9.1 What a “correct trial” is

Author response:

> A correct trial is one in which the child recalls the yellow peppers in the correct order. Concurrently, the child must sort the items that have ripened, based on whether they have a worm or not. Subsequently, the answering accuracy is recorded.

D6.2 measure names to implement as fields:

| Field | Meaning |
|---|---|
| Correct Pepper Sort | Count / rate of correct worm-vs-good decisions |
| Incorrect Pepper Sort | Complementary sort errors (wrong crate, timeout) |
| Correct Order Recall | Entire sequence reproduced in order |
| Wrong order Correct recall | All plants correct as a *set* but permutation wrong (optional derived flag) |
| Longest Sequence | Longest *k* with at least one fully correct recall (classic span) |
| Mean RT | Mean response time across scored responses |
| RT Error | RT on incorrect responses |
| RT Correct | RT on correct responses |
| Total time required | Session duration |
| Total number of trials | Count |

Paper also mentions:

- number of correct pepper classifications  
- correct selection / sorting  
- longest sorted sequence of correct peppers  
- number of correct responses considering difficulty level  

### 9.2 Recommended trial-level schema

Log one JSON/row per trial.

```json
{
  "session_id": "uuid",
  "participant_id": "pseudonym",
  "game": "WorM",
  "mode": "assessment | training | guided",
  "level": 2,
  "k": 3,
  "trial_index": 3,
  "rng_seed": 174221,
  "sequence_plant_ids": [0, 4, 8],
  "sequence_quality": ["good", "worm", "good"],
  "sort_responses": [
    {"i": 0, "expected": "good", "observed": "good", "rt_ms": 812, "timeout": false}
  ],
  "n_sort_correct": 3,
  "sort_all_correct": true,
  "recall_plant_ids": [0, 4, 8],
  "recall_item_correct": [true, true, true],
  "recall_order_correct": true,
  "recall_set_correct": true,
  "recall_rt_ms_per_tap": [540, 610, 480],
  "recall_total_rt_ms": 1630,
  "trial_correct_strict": true,
  "trial_correct_span_only": true,
  "delay_ms": 15000,
  "ripen_ms": 1000,
  "post_sequence_green_ms": 500,
  "timestamp_iso": "2026-09-08T19:00:00Z"
}
```

`trial_correct_strict` = `recall_order_correct && sort_all_correct`  
`trial_correct_span_only` = `recall_order_correct`  

Use **strict** for in-game stars / crates. Store both for analysis. The paper’s IRT items distinguish classification-with-correct-sorting from classification-with-incorrect-sorting, so collapsing them in the raw log would destroy comparability.

### 9.3 Session summary (researcher / teacher view)

- Trials attempted / correct (strict and span-only)  
- Sort accuracy overall and by level  
- Span estimate: max *k* with ≥3/5 strict-correct (primary), plus max *k* with ≥1 perfect recall  
- Mean RT correct vs error for sort and for recall  
- Total session time  
- Number of guided-training trials  

Paper Study 3 reliability (for context, not a runtime target):

- WorM Person Separation Reliability 0.84  
- Item Separation Reliability 0.97  
- Cronbach’s alpha 0.73  
- Difficulty range about **1.58 to −2.17** logits, wider than CHEXI  

Hardest observed item class: **Correct Pepper Classification with Incorrect Sorting in Level 1** (1.58 logit).  
Easiest observed: **Correct Pepper Classification in Level 3** (−2.17 logit).

That odd pattern (some L1 items harder than L3) is exactly why you must log **error type**, not only level.

### 9.4 Timing of RT

UV / video: “the response time is controlled in each trial (calculated after the mean response time for the game).”

Read this as: the platform **records** RT every trial and may use running mean RT as a derived metric (and possibly as a timeout basis).  

**Recommended timeouts** (not published; label as config):

- Sort timeout: `max(2500 ms, 2.5 × running_mean_sort_rt)` with a floor of 2500 ms on the first trials  
- Recall timeout: 15–20 s for the whole sequence, or 5 s per remaining tap  

On timeout, mark the pending response incorrect and continue so the child is never stuck.

---

## 10. Feedback, rewards, session UX

### 10.1 Feedback (Study 2 requirement)

Immediate, visual, phase-aware:

| Event | Feedback |
|---|---|
| Correct sort | Pepper flies to the correct basket; short positive SFX; basket highlight |
| Incorrect sort | Pepper eases back or goes to the wrong basket then corrects; gentle negative SFX; flash the correct basket |
| Correct full recall | Crates close, farm celebration, optional coin/star, farmer nod |
| Incorrect recall | Show the correct order as a brief replay **only in training / guided mode**. In pure assessment, a neutral “next harvest” is safer to avoid teaching the item |
| Level up | Short title card: “The plants are growing stronger / more peppers are ripening” |

Keep error feedback **non-shaming**. Experts wanted reinforcement, not red-X punishment.

### 10.2 Rewards

Not fully specified. Implement a light EcoFarm economy that does not contaminate assessment:

- Assessment block: no variable rewards mid-block (avoid changing motivation mid-IRT). One end-of-block harvest summary is enough.  
- Training block: stars, jars of sauce, market crates, a simple farm meter (“food saved”).  

Do not gate the next cognitive trial on a long reward animation. Study 1 insisted on **short duration**.

### 10.3 Session length

Not numerically published for a full training course. Study 2 participants played about **10 minutes** on tablet during the expert review.

**Recommended defaults:**

- Assessment sitting: 15 trials (5+5+5) plus instructions ≈ 8–12 minutes including 15 s delays.  
- Training sitting: 10–15 minutes or 15–25 trials, whichever first.  
- Hard cap: 20 minutes unless a teacher overrides.

### 10.4 Roles around the child

Study 3: child played **individually with a teacher present**.  

Build:

- Child-facing game (kiosk / tablet).  
- Optional teacher tablet app exists in D3.6 (`Teacher app.apk`) for the full EMPOWER platform — out of scope unless you are rebuilding the suite.  
- A discreet pause / skip / end-session control for the adult.

### 10.5 Languages

Pilots: **Portuguese** and **Romanian** (plus English consortium materials). Keep all strings in a locale table.

---

## 11. Suggested screen flow

1. Splash / EcoFarm title “WorM”  
2. Optional avatar / name (customization request from Study 1)  
3. Instruction screen with the three pepper examples + basket legend + one practice encoding of k = 2 with on-rails hints  
4. Practice trial (ungraded)  
5. Assessment or Training choice (researcher setting; children should not see this)  
6. Level 1 block (5 trials, k = 2)  
7. Micro-feedback  
8. Level 2 / 3 as adaptivity allows  
9. End card: “You helped the farm. Good peppers went to market. Wormy peppers became sauce.”  
10. Silent write of session JSON / CSV  

---

## 12. Technical recommendations (not from the original binary)

No public engine, repo, or APK for WorM itself was found. D3.6 describes EMPOWER as a packaged desktop/tablet application plus optional local server (`EmpowerDBService`) and a remote-server variant. IRTIC (Valencia) implemented the software; ISCTE and UBB specified the exercises.

For a clean-room rebuild:

| Layer | Suggestion |
|---|---|
| Engine | Unity or Godot 2D (tablet + desktop). Keep the garden in world-cm so the 16×16 cm lot can be calibrated on device DPI. |
| Aspect | Landscape tablet. 3×3 must remain square. |
| Input | Unity Input System or Godot actions: `SortGood`, `SortWorm`, `SelectPlant`. |
| Data | Append-only trial log; never overwrite. Export CSV + JSON. |
| Accessibility | Large hit targets (≥ 2 cm), colour **and** icon (worm sprite, not colour-only), scalable UI, reduce-motion flag, mute. |
| Privacy | No cloud by default. Pseudonymous IDs. EMPOWER study data were stored at the Donders Institute repository and shared on request. |
| Determinism | Seeded RNG, fixed timestep for ripen animation (1000 ms). |

Calibrate the garden so that on a typical 10–11″ tablet the 3×3 lot is close to 16×16 cm. If the device is larger, letterbox; do not stretch spacing so far that Corsi-like spatial memory becomes trivially easy.

---

## 13. Acceptance tests (dev checklist)

A build is faithful enough to analyse when all of the following pass.

1. Garden is always 9 plants in 3×3.  
2. Ripe animation is green → yellow in **1.0 s**, then back to green.  
3. Only yellow (ripe) plants belong to the memory sequence.  
4. Encoding order is random and uses distinct plants.  
5. Child must binary-sort each ripe pepper (except Level 1 if worms are disabled — still collect a sort response or auto-mark good).  
6. Left = good/market, right = worm/salvage.  
7. After the last item: 500 ms green hold + 15 s barn door (assessment timing).  
8. Recall requires tapping plants in order; yellow cues are gone.  
9. Level 1 = 2 items × 5 trials; Level 2 = 3×5; Level 3 = 4×5.  
10. Promotion uses 3/5 correct.  
11. Three consecutive errors enter a guided/training path.  
12. Logs include sort accuracy, order accuracy, longest span, and RTs.  
13. Instructions show ripe / worm / green examples before play.  
14. Session stays short; reward animations cannot block input for seconds at a time.  
15. Works on tablet touch and on mouse + A/F keys.

---

## 14. Known gaps and recommended defaults

These were **not** fully specified in public text. Treat them as config, not lore.

| Gap | Recommended default | Rationale |
|---|---|---|
| ISI between encoding items | 400 ms after sort feedback | Typical computerized Corsi / complex-span |
| Sort-key debounce | 200 ms | Avoid double-fire |
| Whether Level 1 collects a sort response | Yes, but every item is “good”; still require LEFT | Keeps motor mapping stable; matches “incorrect sorting in level 1” IRT item |
| Exact P(worm) | 0 / 0.40 / 0.50 by level | See §8.5 |
| Recall confirm button vs auto-submit at k taps | Auto-submit at k taps + 300 ms | Faster for children |
| May the same plant ripen twice in one sequence? | No | Classic Corsi |
| 15 s barn-door content | Static door + faint ambient audio | No new to-be-remembered items |
| Voice-over | Optional, locale-specific, skippable | Study 1 wanted clear instructions + sound |
| Adaptive RT timeout | On, using running mean | UV text says RT is “controlled” |
| Multi-session curriculum | 3–5 sittings/week, 10–15 min, 4–8 weeks | Generic WM-training hygiene; not published for WorM specifically |
| Exact Unity/Godot scene graph of the original | Unknown | Clean-room rebuild |

If a stakeholder later obtains the original APK or D3.6 package, diff timings against this spec and replace defaults.

---

## 15. Cognitive validity notes for implementers

Do not “improve” these away:

1. **Transient cues.** Permanent yellow markers destroy the memory demand.  
2. **Concurrent sort.** Removing the sort turns the game into simple Corsi and changes the construct (and the IRT items).  
3. **Random locations.** Fixed paths allow chunking and leak the test.  
4. **Short instructions, long doing.** Experts rejected text walls.  
5. **Error-type logging.** “Wrong crate but right order” is a different item from “right crates but wrong order.”  
6. **No commercial dark patterns.** This is a clinical-educational instrument.

Optional scientifically honest extensions (label as extensions):

- Backward recall variant  
- k = 5–7 training only  
- Spoken letter span cousin (not in the original farm theme)  
- Eye-tracking hooks (EMPOWER meetings discussed eye-trackers; not part of published WorM scoring)

---

## 16. Minimal asset list

**Plants / produce**

- Pepper plant × 9 (same rig, slight pose variation allowed)  
- Pepper_green  
- Pepper_yellow_good  
- Pepper_yellow_worm (worm must be readable at a glance, including for colour-blind users)  
- Ripen animation 1000 ms  
- Unripen / reset  

**Farm furniture**

- Soil lot 3×3  
- Left market crate  
- Right salvage basket / cutting board / sauce jar  
- Barn door closed / opening  
- Distant eco-farm backdrop  

**UI**

- Instruction card (3 examples)  
- Key/basket legend  
- Trial progress (dots 1–5)  
- Level badge  
- End-of-block harvest summary  
- Pause for teacher  

**Audio**

- Soft ripen “pop”  
- Correct sort  
- Incorrect sort  
- Recall complete  
- Ambient farm, looped, low gain  
- Optional 2–3 sentence VO for instructions (PT, RO, EN)

**Do not** use horror-worm imagery. The worm is a produce defect, not a monster. The game is for children with NDDs.

---

## 17. Reference implementation sketch (logic only)

```text
function runTrial(k, allowWorms):
  seq = sampleDistinct(range(0,9), k)
  qual = [allowWorms && rand() < P_WORM ? WORM : GOOD for _ in seq]
  for i, plant in enumerate(seq):
      animateRipen(plant, qual[i], 1000ms)
      resp, rt = waitSort(timeout)
      logSort(i, expected=qual[i], resp, rt)
      feedbackSort(resp == qual[i], qual[i])
      animateUnripen(plant)
      wait(ISI)
  wait(500ms)
  showBarnDoor(15000ms)
  hideBarnDoor()
  taps, rts = waitRecall(k, timeout)
  logRecall(seq, taps, rts)
  strict = (taps == seq) and allSortsCorrect
  return strict
```

Promotion after each block of 5:

```text
if count(strict in last 5) >= 3: k = min(k+1, K_MAX)
else if threeConsecutiveFails: enterGuidedTraining()
else: k = max(k-1, 2)   # only if you enable demotion
```

---

## 18. Legal / ethics for a rebuild

- Paper and many EMPOWER reports are CC BY 4.0 or public deliverables — **cite them**.  
- Art, characters, and any leaked APK assets are **not** automatically reusable. Redraw.  
- This is a tool used with minors with NDDs: informed consent, teacher presence, no ad network, no external analytics SDK, local-first logs.  
- Do not present a clone as “the official EMPOWER assessment” unless the consortium licenses it. Call it a **research-faithful reimplementation**.  
- CHEXI is a separate instrument with its own copyright; do not bundle CHEXI items into the game client.

---

## 19. Source index (clickable)

### WorM / EMPOWER

- https://doi.org/10.1186/s40359-025-02912-9  
- https://pmc.ncbi.nlm.nih.gov/articles/PMC12539114/  
- https://bmcpsychology.biomedcentral.com/articles/10.1186/s40359-025-02912-9  
- https://pubmed.ncbi.nlm.nih.gov/41121405/  
- https://link.springer.com/content/pdf/10.1186/s40359-025-02912-9.pdf  
- https://project-empower.eu/  
- https://cordis.europa.eu/project/id/101060918  
- https://www.uv.es/uvweb/university-research-institute-robotics-information-communication-technologies/en/departments-news/sustained-attention-memory-training-two-nine-games-will-comprise-empower-application-1285923268336/Novetat.html?id=1286315131939  
- https://www.youtube.com/watch?v=IHK4uaepA8U  
- https://ciencia.iscte-iul.pt/publications/neurodevelopmental-disorders-assessing-and-training-working-memory/115332  
- https://ciencia.iscte-iul.pt/publications/common-framework-for-game-development---empower-platfrom-d21/117587  
- https://zenodo.org/records/18404064  

### Construct background (not the game, but the task family)

- Corsi block-tapping test (visuospatial span)  
- Macizo, P., Soriano, M. F., & Paredes, N. (2016). computerized Corsi — cited by EMPOWER D2.3 as the standardized ancestor  
- Miyake, A., et al. (2000). The unity and diversity of executive functions.  
- Morris, N., & Jones, D. M. (1990). Memory updating in working memory.  
- Thorell / CHEXI — Childhood Executive Functioning Inventory WM subscale  

### Do not confuse with

- ZhangLab “WorM” AI working-memory benchmark (NeurIPS / GitHub ZhangLab-DeepNeuroCogLab/WorM)  
- Commercial *Worms* / *Wizard of Wor* / farm-idle titles  

---

## 20. One-paragraph brief for the sprint ticket

Implement **WorM**, an EcoFarm dual-task working-memory game: a 3×3 garden of 9 single-pepper plants. On each trial *k* plants (2 / 3 / 4 in assessment; up to 7 in training) ripen green→yellow for 1 s in random order and revert to green. During encoding the child sorts each ripe pepper — left/good to market, right/worm to salvage. After 500 ms + a 15 s barn-door delay they tap the plants in ripening order. Score sort accuracy, serial-order recall, longest span, and RTs. Advance when 3/5 trials are correct; drop into guided training after 3 consecutive errors. No public original build exists; follow BMC Psychology 2025, EMPOWER D2.1/D6.2, and the IRTIC explainer.

---

*End of specification.*
