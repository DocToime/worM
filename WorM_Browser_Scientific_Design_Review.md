**WorM: scientific and browser design review**  
Review date: 8 September 2026  
Basis: supplied *WorM_Game_Specification.md*, version 1.0, plus the sources linked below.

**Recommendation: build a browser prototype, but revise the measurement protocol before treating its output as an assessment of cognitive ability.** The specification is a useful reconstruction of a game. It is not yet a validated measurement specification or an evidence-based training prescription.

The most defensible initial purpose is to measure performance on a visuospatial serial-recall task with concurrent classification, and to investigate whether practice improves performance on independent working-memory measures. “Brain function” is too broad for the present task. A general brain score, diagnostic interpretation, or claim of lasting cognitive improvement would exceed what the proposed design establishes.

This review assumes that children remain the intended audience. If the intended users are adults, older adults, or a particular clinical group, the task range, instructions, accessibility requirements and validation sample must change. Recommendations below are proposed design decisions unless explicitly attributed to a source; they are not recovered properties of the original executable. No executable was supplied, so this is a design review, not software testing.

**1. What the evidence actually establishes**

The original paper reports an exploratory pilot with 23 children and one session per child. It reports internal reliability statistics, including alpha 0.73, but explicitly calls for longitudinal studies and randomised trials. Its abstract calls participants “typical”; its methods describe children with NDDs. That inconsistency should be recorded rather than silently resolved. The paper does not establish lasting training benefit. [1]

Reliability, validity and responsiveness are different requirements. Consistent differences between participants do not prove that a test measures the intended construct, that it is stable on retest, or that a score change reflects improvement. Likewise, a questionnaire and game can both have good internal reliability without agreeing with each other. Separate Rasch analyses do not, by themselves, put two instruments on an interchangeable scale.

For training, distinguish three outcomes:

| Outcome | What would demonstrate it? | What it permits you to say |
|---|---|---|
| Learning the game | Better performance on matched WorM trials | The player improved at this task |
| Near transfer | Improvement on untrained working-memory tasks beyond an appropriate control group | Some benefit generalised within the tested cognitive domain |
| Far transfer | Improvement in independent everyday, academic or broader cognitive outcomes beyond controls | Benefit generalised to those specific outcomes |

The wider evidence is mixed rather than uniformly negative. A meta-analysis in typically developing children found essentially no far-transfer effect in active-control comparisons. [2] A double-blind trial of 95 children reported working-memory gains and a short-term mathematical-reasoning benefit that was not maintained at follow-up. [3] A more recent ADHD meta-analysis reports broader benefits from computerised executive-function training, but pools different interventions and predominantly moderate- or high-risk-of-bias studies. It does not validate WorM specifically. [4]

Therefore, neither “brain training works” nor “brain training cannot work” is a sufficient product premise. The appropriate question is whether this implementation, at this dose, benefits this population on prespecified independent outcomes.

An important source omission: the EMPOWER repository lists **D6.4, Report with the results from RCT**, as well as D6.2. I verified the listing but could not retrieve the PDFs. Their results remain unassessed here. Obtain D6.4 before finalising the evidence case; establish whether its intervention isolates WorM or evaluates the entire platform. A positive result for a multi-game package would not identify WorM’s individual contribution. [5]

**2. Highest-priority changes**

| Priority | Issue in the supplied specification | Consequence | Recommended revision |
|---|---|---|---|
| Critical | Assessment, adaptive training and guided remediation share progression rules | A score depends on which help the player received | Separate and version the protocols |
| Critical | No independent outcome measures | Improvement can be entirely game-specific | Add an untrained assessment battery and control condition |
| Critical | The stimulus stays visible until sorting finishes | Response speed changes encoding time and later memory demands | Fix stimulus and processing windows within assessment |
| Critical | Strict success combines every sort with perfect recall | Sorting and sequence length mechanically affect the claimed span | Report memory and processing separately |
| High | Level 1 has no worms, later levels do | Difficulty changes in more than one dimension | Treat no-worm trials as onboarding in a redesigned protocol |
| High | Five trials determine a level | Individual estimates are very uncertain | Pilot more observations and report uncertainty |
| High | Selected plants cannot be chosen again | The interface provides exclusion information and suppresses repetition errors | Allow repeat responses, or explicitly define a constrained-response task |
| High | Browser timing, interruptions and persistence are underspecified | Technical failures can become apparent cognitive errors | Add an auditable event log and invalid-trial policy |
| Medium | All adaptive gains are presented as progress | Easier timing can masquerade as better memory | Compare only matched conditions or a validated model |
| Medium | “Research-faithful” mixes published facts and invented defaults | Users may assume equivalence with the original instrument | Maintain a requirement-by-requirement provenance register |

**3. What the task measures, and what it does not**

Remembering spatial locations in order while making another decision plausibly engages visuospatial storage, serial order, divided attention and coordination of processing with storage. Performance also depends on vision, motor control, instruction comprehension, motivation and strategy. Those influences matter particularly for a heterogeneous developmental population.

The “updating” claim needs narrowing. Appending successive locations to a list does not isolate the replacement or removal of obsolete information. If updating is an explicit target, add a separately scored variant: maintain the last three locations in a longer stream, or update the contents of specified locations. Validate that variant independently; it changes the task.

A regular 3×3 grid also provides readily named positions and familiar shapes. Players can encode “top-left, middle, bottom-right” or a diagonal. That does not make the task useless, but a visually presented task is not necessarily solved using purely visuospatial representations. Randomisation does not eliminate verbal labelling or chunking.

For broader cognitive measurement, eventually include independent measures of attention, inhibition, processing speed and another working-memory modality. Begin with a small battery rather than an arbitrary composite. A performance profile is more defensible than an unvalidated overall brain-function number.

Useful baseline tasks include a short classification-only condition and a simple spatial-recall condition with matched presentation and response demands. These help reveal whether a dual-task difficulty is accompanied by perceptual or motor difficulty. Do not simply subtract motor RT from memory RT and call the remainder “pure cognition”; that decomposition needs evidence. Difference scores also need their own reliability checks.

**4. Separate measurement from training**

Use four explicit modes:

| Mode | Purpose | Rules |
|---|---|---|
| Familiarisation | Establish comprehension and input competence | Demonstrations, practice and corrective feedback; unscored |
| Assessment | Estimate performance under a reproducible protocol | Frozen parameters; neutral feedback; no remediation inside scored blocks |
| Training | Practise at a manageable challenge | Adaptive load, encouragement and optional strategy coaching |
| Guided support | Help the player learn the task | Slower timing, cues and replay; excluded from assessment |

Choose the mode before instructions and calibration. Switching it after practice risks providing the wrong preparation.

The specification currently promises 15 assessment trials while also allowing advancement only after 3/5 successes. These are different protocols: a fixed battery presents all planned blocks, whereas a gated test may stop before the upper blocks. Define one policy, including non-passing blocks, maximum repeats, stopping and handling of unadministered items. Unadministered items are not automatically wrong.

Adaptive assessment is possible, but its selection algorithm must itself be standardised and supported by a scoring model. Adaptation does not excuse changing timings, feedback and remediation ad hoc.

For longitudinal tracking, use a stable assessment protocol with balanced alternate forms. New random sequences prevent literal reuse but do not remove practice effects or guarantee equal form difficulty. In a proper study, counterbalance forms across groups and occasions; in personal tracking, annotate protocol changes and treat early familiarisation gains cautiously.

**5. Fix the timing model**

The present proposal combines a nominal one-second ripening animation with a response-dependent visible hold, a variable feedback duration and an adaptive deadline. Consequently, two children can receive different exposure, inter-item intervals and total retention time despite being assigned the same level. A child who learns the sorting controls faster may receive less encoding time on later sessions. Apparent memory change can therefore move in either direction.

For a redesigned assessment protocol, use:

1. A fixed-duration spatial cue with a precisely defined onset.
2. A fixed processing interval. Remove the spatial cue and present the classification stimulus centrally if the aim is to separate storage from intervening processing.
3. One accepted classification response, with the remainder of that interval held constant.
4. A fixed neutral inter-item interval.
5. A fixed post-sequence interval and recall phase.

The central classification display is a proposed modification, not a claim about original WorM. For reconstruction, preserve the supported mechanics and explicitly label uncertain timing assumptions. For a new instrument, prioritise an interpretable protocol over assumed fidelity.

If timeouts are calibrated to the individual, calibrate outside the scored block and then freeze them. Record the calibration rule. Individual timing accommodations support access but do not automatically preserve between-person comparability. Avoid updating a deadline from a running mean during assessment: it creates a moving measurement condition, reacts poorly to outliers and can reward deliberate slowing.

Define RT relative to the first informative stimulus presentation. With a gradual colour transition, animation start and the moment “ripe” or “worm” becomes identifiable can differ. Record animation onset, decision-cue onset and response eligibility separately. A one-second transition is not necessarily a one-second exposure.

The barn-door interval is **unfilled** if the player merely waits. Static scenery or ambient audio is not an intervening cognitive task, and mental rehearsal remains possible. Fifteen seconds may add retention, attention and fatigue demands, but it does not selectively measure working-memory updating.

Keep the supplied 15-second interval in a reconstruction condition. In the redesigned condition, experimentally compare it with a shorter interval such as 3–5 seconds. Choose using score range, reliability, participant tolerance and construct validity. Adding a demanding task during the delay would create another protocol.

Fifteen 15-second delays alone consume 225 seconds: 3 minutes 45 seconds. That is a substantial share of an 8–12-minute session. Calculate the budget from actual timings, including onboarding and response tails; use a duration cap between trials rather than abruptly ending a trial.

**6. Revise scoring and adaptation**

Retain exact-order recall as an important outcome, but do not make the sole memory score depend on every sorting response being correct.

For illustration, suppose exact recall succeeds with probability 0.80 and each sort independently succeeds with probability 0.95. Strict success becomes:

`P(strict success) = 0.80 × 0.95^k`

That is 72.2% at k=2 and 55.9% at k=7 even if recall probability is unchanged. The independence assumption is illustrative, not an empirical model, but it exposes the scoring problem: more sorting opportunities lower the combined score by construction.

Report at least:

| Measure | Definition and use |
|---|---|
| Exact serial recall | Entire submitted sequence matches the target |
| Position accuracy | Correct cell at each serial position; retain per-trial proportions and denominators |
| Set recall | Correct membership irrespective of order; distinguish from serial accuracy |
| Error types | Transpositions, intrusions, repetitions and omissions |
| Sorting accuracy | Separate wrong-key responses and timeouts; report by category |
| Sorting speed | Median and spread of correct-response RT, with response count |
| Recall initiation | Time from recall onset to first selection |
| Recall continuation | Inter-selection intervals, separate from initiation |
| Completion quality | Interruptions, technical invalidity, assistance and valid trial count |
| Strict dual-task success | Secondary descriptive outcome, explicitly named |

Do not collapse sorting and recall into a single “mean RT”: they refer to different actions and processes. A timeout has no observed response latency; retain its deadline and an omission flag rather than entering that deadline as an ordinary RT. Fast wrong responses should not earn processing-speed credit.

Partial scores improve resolution but do not magically create independent observations. Items are nested within sequences, sessions and participants. Statistical uncertainty must respect that structure. Prespecify aggregation so that longer trials do not unintentionally dominate a pooled score.

The 3/5 rule is coarse. With three successes in five otherwise comparable independent trials, a Wilson 95% interval for the success probability is approximately 23%–88%. This is an illustration of uncertainty, not a full confidence interval for adaptive span. “Maximum span with one success” also rises with the number of opportunities, so it is unsuitable as the sole longitudinal measure.

For training, initially adapt sequence length while holding other dimensions stable. Use both recall and processing performance: recall improvement with collapsing sorting accuracy may indicate that the player has learnt to ignore the concurrent task. A candidate controller could promote after sustained recall success while sorting remains above a preregistered mastery criterion, repeat or reduce load after sustained difficulty, and offer guided support separately. Pilot the window and thresholds; there is no established universally optimal success percentage here.

Resolve precedence explicitly: does three-failure remediation happen immediately or only at block end? Does it reset the failure counter? Do guided successes count towards return? Can demotion and promotion occur together? Define the minimum, maximum and exit policy. Log each adaptive decision with its inputs and reason.

**7. Correct stimulus and response-generation problems**

**No-worm Level 1 changes the task.** It allows a constant-button strategy and removes binary discrimination. For a redesigned assessment, use it as familiarisation, then keep category structure consistent while changing memory load. If preserving the reconstruction, label that discontinuity rather than interpreting level as a single cognitive axis.

**Guaranteed category mixing contradicts independent sampling.** Sampling worm status independently and then rejecting all-good or all-worm trials produces a conditional distribution. The realised item probability can differ from the nominal probability. It also creates end-of-sequence predictability: when only good peppers have appeared, the last item may be forced to be a worm. Prefer balancing categories and response transitions across blocks without making every short sequence predictable. The supplied pseudocode does not implement its own mixture guarantee.

**Do not silently remove “easy” paths.** Rejecting straight rows or columns selectively changes the difficulty distribution. Either preserve uniform sampling or use a documented, reproducible item bank that balances path length, turns, crossings, adjacency and recognisable shapes across forms. Geometry-based matching is a starting point; empirical calibration is still needed.

**Separate unique targets from permissible responses.** A target sequence can contain distinct cells while the player remains free to repeat a cell in recall. Blocking repeated selections removes possible errors and gives information about the remaining alternatives. Prefer accepting all cell responses up to the response limit, with a brief non-informative acknowledgement and a generic count of responses. Avoid persistent numbered selection markers or a displayed path during scored recall. If constrained selection is retained for usability, name and validate that response rule.

For uniform guessing without replacement, exact recall chance is `1 / P(9,k)`: approximately 1.39% at k=2 and 0.033% at k=4. Under that same response model, correct-set chance is `1 / C(9,k)`. These are model-dependent baselines, not universal correction factors; do not compare raw percentages across lengths as though chance and difficulty were constant.

**Classify ignored actions.** Blocking invalid input is appropriate, but silently discarding every early response loses useful information about anticipation and misunderstanding. Record early keys, repeated events and off-target responses without letting them advance the trial. Do not auto-mark an unperformed Level 1 sort correct: a task the child did not perform cannot supply an observed processing score.

**8. A browser is a reasonable implementation platform**

For this modest 2D task, I would choose TypeScript with SVG or Canvas for the game and ordinary HTML controls for instructions and settings. Keep a deterministic trial engine and scoring module separate from the visual layer. A surrounding React interface is reasonable, but component rerenders should not define experimental timing.

A custom jsPsych plugin is worth considering if research trial orchestration, data export and other cognitive tasks are central. Its documentation discusses timing limitations and specialist stimulus timing options. It is not a guarantee of accuracy on the eventual build. [6] Unity or Godot browser export can work, especially with an existing team and assets, but this specification alone does not justify their additional engine and deployment complexity.

Suggested components are: immutable protocol configuration; seeded stimulus generator; explicit phase controller; input normaliser; local event recorder; pure scoring functions; adaptive controller; and a separate results view. Scoring should be reproducible from saved events without running animations.

Browser experiments can have useful timing accuracy, but device/browser combinations introduce offsets and variability. Validate the actual supported combinations rather than extrapolating laboratory benchmarks to every phone. [7]

Practical implementation requirements:

| Area | Requirement |
|---|---|
| Clock | Use a monotonic clock such as `performance.now()` for within-session intervals; wall time is metadata [8] |
| Presentation | Schedule visual changes against animation frames; retain intended times and observed callback times |
| Precision | Describe onset timestamps as software estimates; they do not establish the exact physical display onset |
| Scheduling | Use absolute phase deadlines; avoid accumulating drift through chains of relative waits |
| Assets | Preload and decode images, fonts and sound before trials; keep network operations out of stimulus timing |
| Input | Normalise pointer and keyboard input; prevent one touch generating both a pointer response and a synthetic click response |
| Keyboard | Reject auto-repeat; accept only one sorting response per item; handle held keys across transitions |
| Touch | Define pointer-down versus release consistently; record input modality and target geometry |
| Versioning | Pin code, assets and protocol for the session; defer service-worker updates until between sessions |
| Recovery | Commit completed trials locally and recover them after reload; do not resume a partly remembered trial as valid |

`requestAnimationFrame` commonly stops in background tabs. [9] An incoming call, app switch or orientation change can also interrupt the intended experience. If the garden is hidden during encoding, retention or recall, mark the trial interrupted and stop its score from silently entering assessment. On return, explain the interruption and present a fresh sequence under a predefined replacement policy. Preserve the interrupted record and reason. Arbitrary mid-trial pausing changes the cognitive interval even if the software clock is paused perfectly.

Record frame gaps and late transitions. Decide timing-quality thresholds before analysis, informed by measurements on supported devices. A JavaScript timestamp with decimal milliseconds is not evidence of sub-millisecond behavioural accuracy. If small RT differences become a central claim, validate display and input timing externally with appropriate hardware.

**9. Screen size, accessibility and usability**

`width: 16cm` does not reliably produce a physically 16-centimetre garden on a display; CSS absolute lengths have fixed relationships to CSS pixels. `devicePixelRatio` is not a reliable substitute for measured physical DPI. [10] Offer a ruler-based calibration when physical matching matters, save its result, and recheck after display or zoom changes. Record viewing distance in supervised validation if visual angle matters.

A 16-centimetre square will not fit every tablet’s short dimension once browser controls and baskets are included. Do not assume “10-inch tablet” implies compatibility. For comparable assessment, begin with a supported tablet/laptop viewport range. A smaller phone layout can be a separate training configuration until equivalence has been tested.

Use a redundant ripe-state marker as well as colour, and ensure the worm is discriminable without fine vision. Keep plant appearances consistent initially: decorative variation can make particular locations easier to name or recognise. Offer reduced motion and muted sound, but preserve and record task-relevant exposure. Do not allow optional audio to become an extra timing or category cue in only some assessment sessions.

Start with demonstrations of sorting alone, recall alone, then the combined task. Require demonstrated comprehension rather than a fixed single practice trial. If comprehension remains uncertain, report “assessment not completed” with the reason; do not label the child as having low working memory.

Allow accessible input alternatives, but do not assume they are psychometrically interchangeable. A keypad or keyboard navigation can introduce verbal labels or serial search that mouse/touch does not. Screen-reader conversion would substantially change a visual-spatial task and deserves a separately designed assessment.

Keep session rewards predictable, instructions short and encouragement independent of ability labels. A generic pause/end control should be reachable without dexterity challenges. Record adult assistance; unscripted help can change the task. Do not use age-ranked leaderboards or “brain age”.

**10. Strengthen the data specification**

The proposed trial JSON is a useful start, but summary rows cannot fully reconstruct what happened. Retain event records as well as derived trial and session summaries.

Minimum additions:

| Group | Fields or events |
|---|---|
| Provenance | Protocol ID/version, code build, asset version, scoring version, immutable configuration hash |
| Stimuli | Actual presented sequence and qualities, per-trial seed, generator algorithm/version |
| Timing | Planned and observed onsets/offsets, response eligibility, deadlines, cue onset, feedback duration |
| Responses | Event type, modality, observed response, accepted/rejected status and reason |
| Environment | Browser/OS family, viewport, pixel ratio, orientation, calibrated size, input mapping |
| Trial status | Completed, interrupted, technical failure, omission, withdrawn or guided |
| Assistance | Adult help, replay, accommodation and setting changes |
| Adaptation | Controller state before/after, evidence window, decision and reason |
| Persistence | Event sequence number, trial UUID, schema version, save/sync status |

Store both the realised stimuli and the seed. A seed alone does not reproduce trials after changes in generator code or random calls. Use separate random streams for experimental stimuli and decorative effects.

The example JSON is internally inconsistent: it shows one sorting response but claims three correct sorts. Mark such examples as abbreviated or make them schema-valid complete examples. Define whether per-tap RTs are intervals or cumulative times, how partial recall is represented, and the denominator for every score.

Use IndexedDB for local structured records and an explicit export or optional authenticated backup. Browser storage can be evicted and private-browsing data can be temporary, so “no cloud” is not a durability guarantee. [11] Distinguish saved locally from backed up. Use idempotent trial uploads so retries do not duplicate observations. Append-only event semantics should coexist with authorised data deletion.

**11. A credible route to demonstrating benefit**

First validate usability and measurement, then test training efficacy. A beautifully controlled training trial cannot rescue an outcome measure with severe floor effects or unreliable scoring.

| Stage | Work | Decision supported |
|---|---|---|
| Technical verification | Deterministic replay; scoring edge cases; input races; interruption recovery; real-device timing | Does the software administer the intended task? |
| Usability pilot | Observe representative children, including relevant accessibility needs | Do users understand and tolerate it? |
| Measurement pilot | Retest and alternate forms; independent working-memory tasks; matched input controls | Is the score reliable and interpretable? |
| Training feasibility | Pilot session length, engagement, dose and dropout | Can the intervention be delivered consistently? |
| Controlled efficacy study | Randomisation, matched active control and untrained endpoints | Does training cause benefit beyond practice and engagement? |
| Follow-up | Delayed independent assessments | Does the benefit persist? |

Measurement work should examine floor and ceiling effects, retest reliability, practice trajectories, alternate-form equivalence and associations with independent performance tasks. If estimating latent ability, investigate dimensionality and local dependence before adopting IRT. Do not import the paper’s reliability coefficients into the browser product. Age, language, device and clinical-group comparisons require evidence of appropriate measurement comparability.

The specification’s surprising IRT “difficulty” ordering should trigger a coding audit. An error-pattern variable is not automatically a cognitive challenge: a rare classification-with-error outcome can be “difficult” to endorse for reasons unrelated to greater ability. Obtain the item definitions and response coding before using those logits for an item bank. This is an analytic concern, not a conclusion that the original analysis is necessarily wrong.

For efficacy, prespecify an independent primary outcome, secondary outcomes and analysis. Use an active comparison matched as far as feasible for time, attractiveness, contact and reward. A low-memory version of the same game may be useful, but check that it remains comparably engaging. Blind outcome assessors and keep teachers/parents unaware of allocation where feasible. Analyse participants as randomised, report attrition, and avoid selecting only adherent improvers.

Assess before training, shortly afterwards and at a prespecified delayed follow-up, for example 1–3 months as a candidate design choice. Use untrained tasks with materially different stimuli and response requirements. A different farm skin alone is weak evidence of transfer. Questionnaire outcomes can complement performance tasks but should not replace them, especially when raters know who trained.

Choose sample size from the target effect, outcome reliability, attrition and clustering; school-level randomisation requires accounting for school/class effects. Treat an initial small study as feasibility work rather than assuming it can establish efficacy.

If everyday functioning is the real goal, specify it concretely: remembering multi-step instructions, completing a defined classroom routine, or another functional target. Add explicit strategy practice in those situations and test the outcome directly. If drills and strategy coaching are bundled, any efficacy claim belongs to the package unless the study separates their effects.

The proposed “3–5 sessions/week for 4–8 weeks” is an unvalidated candidate dose for this implementation. Record exposure and adherence, pilot tolerance, and distinguish a convenient schedule from an established therapeutic prescription.

For personal tracking without a trial, standardise device, settings and context, use repeated baselines, and show matched-task trends. That supports descriptive self-monitoring. It cannot reliably separate training from maturation, repeated testing, regression to the mean or changes in sleep and motivation.

**12. Claims, data governance and reuse**

For a UK deployment involving children, determine whether the Children’s Code applies and design age-appropriate privacy and data minimisation from the start. Pseudonymous records remain personal data; health-related inferences may require special-category treatment. Parental permission is not a universal substitute for determining the correct lawful basis and any additional condition. [12–14]

Specify who can see an individual’s results, how shared-device sessions are separated, retention periods, export/deletion behaviour and optional backup. Do not collect diagnoses or detailed personal histories merely because they might be useful later.

Whether the product becomes medical-device software depends on its intended purpose and claims. Assess this before presenting it as diagnosing impairment or treating a disorder; calling it a game or adding a disclaimer does not resolve the intended-purpose question. [15]

The paper is openly licensed, but a public project deliverable is not automatically licensed for unrestricted reuse. The repository’s record displays consortium copyright rather than a blanket CC BY grant. Check each document and asset separately; create original art and branding. [1,5] Prefer “WorM-inspired experimental task” unless verified implementation fidelity supports stronger wording. This is not an official EMPOWER instrument.

**13. Recommended next specification revision**

Produce a version 1.1 with these concrete changes before implementation is considered frozen:

1. Define target population, intended use and the cognitive outcomes being claimed.
2. Tag every requirement as published, inferred, proposed or unresolved, with source location and confidence.
3. Separate reconstruction, assessment, training and guided-support configurations.
4. Resolve trial count versus gating, stopping rules and remediation precedence.
5. Specify stimulus exposure, processing windows, RT origins and interruption rules exactly.
6. Separate memory, sorting and technical validity in scoring; define denominators and missingness.
7. Correct category randomisation, recall-response restrictions and incomplete examples.
8. Add a supported-device policy, physical-size calibration option and accessibility profiles.
9. Add the event schema, versioning, recovery, export and reproducible rescoring requirements.
10. Define measurement validation and independent transfer outcomes before selecting the training curriculum.

For the first build, prioritise one polished garden, clear onboarding, reproducible trials, reliable logs and separate assessment/training modes. Defer a large reward economy, sensors, AI adaptation and normative brain scores. The first useful milestone is a task whose recorded scores can be explained and reproduced; evidence of broader improvement requires the subsequent validation work.

**Sources and verification boundaries**

The attachment was read in full. Its original specification remains unchanged. The main scientific paper and current technical documentation were checked directly. The wider research below supplies context, not validation of the proposed rebuild. D6.2/D6.4 PDFs and the original executable were not available for inspection in this review. Numerical examples are calculations from stated assumptions.

1. Ferreira et al. (2025), *Neurodevelopmental disorders: assessing and training working memory*. [Full text](https://link.springer.com/article/10.1186/s40359-025-02912-9).
2. Sala & Gobet (2020), *Working memory training in typically developing children: A multilevel meta-analysis*. [PubMed](https://pubmed.ncbi.nlm.nih.gov/31939109/).
3. Jones et al. (2020), *The academic outcomes of working memory and metacognitive strategy training in children: A double-blind randomized controlled trial*. [Publisher](https://doi.org/10.1111/desc.12870).
4. Yan et al. (2026), *The effects of computerized executive function training on the youth with ADHD: A systematic review and meta-analysis*. [Publisher](https://doi.org/10.1016/j.jad.2025.120730).
5. EMPOWER consortium, public deliverables repository. [Record and file listing](https://zenodo.org/records/18404064).
6. jsPsych, [Timing accuracy](https://www.jspsych.org/latest/overview/timing-accuracy/).
7. Bridges et al. (2020), *The timing mega-study*. [Paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC7512138/).
8. MDN, [performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now).
9. MDN, [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
10. MDN, [CSS length units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length).
11. MDN, [Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
12. ICO, [Children’s Code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/).
13. ICO, [Introduction to anonymisation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/introduction-to-anonymisation/).
14. ICO, [Lawful basis and special-category data](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/annex-c-lawful-basis-for-processing/).
15. MHRA, [Crafting an intended purpose for software as a medical device](https://www.gov.uk/government/publications/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd).
