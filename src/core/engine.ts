import type { GameEvent, Modality, Phase, Protocol, Quality, Session, Snapshot, Trial } from './types';
import { BUILD_VERSION, hashConfig } from './protocol';
import { advance, initialController } from './adaptation';
import { generate, trialSeed } from './random';
import { scoreTrial } from './scoring';

export function createSession(participantId: string, protocol: Protocol, environment: Record<string, unknown>, seed = crypto.getRandomValues(new Uint32Array(1))[0]): Session {
  return {
    schemaVersion: 1, id: crypto.randomUUID(), participantId, startedAt: new Date().toISOString(), endedAt: null,
    status: 'active', endReason: null, seed, protocol: structuredClone(protocol), protocolHash: hashConfig(protocol),
    buildVersion: BUILD_VERSION, assetVersion: 'svg-1', scoringVersion: '1.0.0', environment,
    controller: initialController(protocol), trials: [], events: [], elapsedMs: 0,
  };
}
const activePhases: Phase[] = ['cue', 'sort', 'sort-feedback', 'interval', 'green-hold', 'retention', 'recall'];
export class Engine {
  phase: Phase = 'ready';
  item = 0;
  deadline = Infinity;
  onset = 0;
  sortFeedback: boolean | null = null;
  message = '';
  private previousFrame: number | null = null;
  private recallStart = 0;
  private lastRecall = -Infinity;
  private runOrigin: number;
  private offset: number;
  private endPending = false;
  private notify: () => void;
  private checkpoint: (session: Session) => void;
  constructor(public session: Session, private now: () => number = () => performance.now(), notify = () => {}, checkpoint = (_s: Session) => {}) {
    this.notify = notify; this.checkpoint = checkpoint;
    this.runOrigin = this.now(); this.offset = session.elapsedMs;
    if (session.status !== 'active') { this.phase = 'complete'; return; }
    if (session.trials.length) {
      this.phase = 'interrupted';
      const trial = this.trial;
      if (trial?.status === 'active') { trial.status = 'interrupted'; trial.interruptionReason = 'reload'; trial.endedAtMs = this.time(); session.controller.interruptions++; }
      this.record('recovery', { reason: 'reload', freshTrialRequired: true });
      this.message = 'Your completed rounds are safe. Start with a fresh sequence.';
      // A completed feedback checkpoint may already have hit the terminal controller state.
      const c = session.controller, p = session.protocol;
      this.endPending = c.validRounds >= p.rounds || (p.mode === 'practice' && c.practiceStreak >= 2) || (c.guided && c.guidedAttempts >= 6) || session.endReason !== null;
    }
  }
  get trial(): Trial | null { return this.session.trials.at(-1) ?? null; }
  get isActive() { return activePhases.includes(this.phase); }
  time() { return this.offset + this.now() - this.runOrigin; }
  snapshot(): Snapshot {
    return { phase: this.phase, item: this.item, remainingMs: Math.max(0, this.deadline - this.time()), trial: this.trial,
      sortFeedback: this.sortFeedback, controller: this.session.controller, message: this.message, session: this.session };
  }
  record(type: string, data: Record<string, unknown> = {}) {
    const event: GameEvent = { seq: this.session.events.length + 1, trialId: this.trial?.id ?? null, atMs: this.time(), type, data };
    this.session.events.push(event);
  }
  save() { this.session.elapsedMs = this.time(); this.checkpoint(structuredClone(this.session)); }
  private enter(phase: Phase, duration = Infinity, plannedAt = this.time()) {
    this.phase = phase; this.onset = this.time(); this.deadline = plannedAt + duration;
    this.record('phase', { phase, item: this.item, plannedAtMs: plannedAt, observedAtMs: this.onset, deadlineMs: Number.isFinite(this.deadline) ? this.deadline : null, lateMs: Math.max(0, this.onset - plannedAt) });
    this.save(); this.notify();
  }
  private duration(key: 'cueMs' | 'sortMs' | 'delayMs') {
    if (this.session.controller.guided) return { cueMs: 1500, sortMs: 5000, delayMs: 3000 }[key];
    return this.session.protocol[key];
  }
  startNext() {
    if (!['ready', 'feedback', 'interrupted'].includes(this.phase)) return;
    if (this.endPending) { this.finish(this.session.endReason ?? 'rounds-complete'); return; }
    if (this.time() >= this.session.protocol.maxMinutes * 60000) { this.finish('time-limit'); return; }
    if (this.session.controller.interruptions >= 10) { this.finish('interruption-limit'); return; }
    const c = this.session.controller, seed = trialSeed(this.session.seed, c.attemptIndex);
    const stimuli = generate(seed, c.span, this.session.protocol);
    this.session.trials.push({
      id: crypto.randomUUID(), attempt: c.attemptIndex++, scheduledIndex: c.validRounds + 1,
      seed, span: c.span, guided: c.guided || this.session.protocol.mode === 'practice', assisted: false,
      ...stimuli, status: 'active', startedAtMs: this.time(), endedAtMs: null, sorts: [], recalls: [], score: null,
    });
    this.item = 0; this.lastRecall = -Infinity; this.sortFeedback = null; this.previousFrame = null;
    this.record('trial-start', { seed, cells: stimuli.cells, qualities: stimuli.qualities, generator: 'mulberry32-fisher-yates-v1' });
    this.enter('cue', this.duration('cueMs'));
  }
  tick() {
    const at = this.time();
    if (this.previousFrame !== null && this.isActive) {
      const gap = at - this.previousFrame;
      if (gap > 100) this.record('frame-gap', { gapMs: gap });
      if (gap > 1000) { this.previousFrame = at; this.interrupt('frame-gap'); return; }
    }
    this.previousFrame = at;
    if (at < this.deadline || !this.isActive) return;
    const planned = this.deadline, p = this.session.protocol;
    switch (this.phase) {
      case 'cue': this.enter('sort', this.duration('sortMs'), planned); break;
      case 'sort':
        if (!this.trial!.sorts.some(s => s.item === this.item)) this.omitSort();
        this.enter('sort-feedback', p.feedbackMs, planned); break;
      case 'sort-feedback':
        this.sortFeedback = null;
        this.enter(this.item + 1 < this.trial!.span ? 'interval' : 'green-hold', this.item + 1 < this.trial!.span ? p.intervalMs : p.greenMs, planned); break;
      case 'interval': this.item++; this.enter('cue', this.duration('cueMs'), planned); break;
      case 'green-hold': this.enter('retention', this.duration('delayMs'), planned); break;
      case 'retention': this.recallStart = at; this.enter('recall', p.recallMs, planned); break;
      case 'recall': this.completeTrial(); break;
    }
  }
  sort(quality: Quality, modality: Modality, repeated = false) {
    const at = this.time();
    const reason = repeated ? 'held-key' : this.phase !== 'sort' ? 'wrong-phase' : at >= this.deadline ? 'after-deadline' : this.trial!.sorts.some(s => s.item === this.item) ? 'already-sorted' : null;
    this.record('input', { action: 'sort', quality, modality, accepted: !reason, reason });
    if (reason) return false;
    const expected = this.trial!.qualities[this.item];
    this.trial!.sorts.push({ item: this.item, expected, observed: quality, eligibleAt: this.onset, deadline: this.deadline, at, rtMs: at - this.onset, modality, omission: false });
    this.sortFeedback = quality === expected;
    if (this.session.protocol.fixedSort) { this.save(); this.notify(); }
    else this.enter('sort-feedback', this.session.protocol.feedbackMs);
    return true;
  }
  private omitSort() {
    this.trial!.sorts.push({ item: this.item, expected: this.trial!.qualities[this.item], observed: null, eligibleAt: this.onset, deadline: this.deadline, at: null, rtMs: null, modality: null, omission: true });
    this.sortFeedback = false; this.record('sort-omission', { item: this.item, deadlineMs: this.deadline });
  }
  recall(cell: number, modality: Modality) {
    const at = this.time(), t = this.trial;
    const reason = !Number.isInteger(cell) || cell < 0 || cell > 8 ? 'invalid-cell' : this.phase !== 'recall' ? 'wrong-phase' : at >= this.deadline ? 'after-deadline' : at - this.lastRecall < 120 ? 'debounce' : !this.session.protocol.allowRepeats && t!.recalls.some(r => r.cell === cell) ? 'repeat-cell' : null;
    this.record('input', { action: 'recall', cell, modality, accepted: !reason, reason });
    if (reason) return false;
    t!.recalls.push({ cell, at, elapsedMs: at - this.recallStart, intervalMs: at - (t!.recalls.at(-1)?.at ?? this.recallStart), modality });
    this.lastRecall = at;
    if (t!.recalls.length === t!.span) this.completeTrial();
    else { this.save(); this.notify(); }
    return true;
  }
  private completeTrial() {
    const t = this.trial!;
    t.status = 'completed'; t.endedAtMs = this.time(); t.score = scoreTrial(t);
    const before = structuredClone(this.session.controller);
    const result = advance(before, t.score.strict, this.session.protocol);
    this.session.controller = result.controller; this.message = result.reason;
    this.endPending = result.end;
    if (result.end) this.session.endReason = result.reason;
    this.record('trial-complete', { score: t.score });
    this.record('adaptation', { before, after: result.controller, reason: result.reason });
    this.enter('feedback');
  }
  interrupt(reason: string, assisted = false) {
    if (this.phase === 'complete' || this.phase === 'interrupted' || this.phase === 'ready') return;
    const t = this.trial;
    if (t?.status === 'active') {
      t.status = 'interrupted'; t.interruptionReason = reason; t.assisted = assisted; t.endedAtMs = this.time();
      this.session.controller.interruptions++;
    }
    this.record('interruption', { reason, assisted });
    this.message = reason; this.enter('interrupted');
  }
  assistance() {
    if (this.trial?.status === 'interrupted') { this.trial.assisted = true; this.record('assistance', { adultHelp: true }); this.save(); this.notify(); }
    else this.interrupt('adult-help', true);
  }
  finish(reason = 'ended-by-player') {
    if (this.session.status !== 'active') return;
    if (this.endPending && reason === 'ended-by-player') reason = this.session.endReason ?? 'rounds-complete';
    if (this.trial?.status === 'active') {
      this.trial.status = 'interrupted'; this.trial.interruptionReason = reason; this.trial.endedAtMs = this.time();
    }
    this.session.endReason = reason;
    this.session.status = ['rounds-complete', 'practice-passed', 'gate-not-passed'].includes(reason) ? 'completed' : 'partial';
    this.session.endedAt = new Date().toISOString();
    this.record('session-end', { reason }); this.enter('complete');
  }
  get willEnd() { return this.endPending; }
}
