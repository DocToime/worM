import { describe, expect, it } from 'vitest';
import { createSession, Engine } from '../src/core/engine';
import { protocolFor } from '../src/core/protocol';
import type { Mode, Phase, Session } from '../src/core/types';
function setup(mode: Mode = 'assessment') {
  let clock = 0;
  const checkpoints: Session[] = [];
  const e = new Engine(createSession('p', protocolFor(mode), {}, 42), () => clock, () => {}, s => checkpoints.push(s));
  const move = (ms: number) => { const end = clock + ms; while (clock < end) { clock = Math.min(clock + 20, end); e.tick(); } };
  const phase = (p: Phase) => { let n = 0; while (e.phase !== p && n++ < 10000) move(20); expect(e.phase).toBe(p); };
  const recall = () => { phase('recall'); for (const cell of e.trial!.cells) { move(200); e.recall(cell, 'mouse'); } };
  return { e, move, phase, recall, checkpoints, jump: (ms: number) => { clock += ms; e.tick(); } };
}
describe('trial timing and inputs', () => {
  it('blocks early sort, wrong-phase recall, and double sorts; holds the full assessment window', () => {
    const { e, move } = setup(); e.startNext(); expect(e.phase).toBe('cue'); expect(e.sort('good', 'keyboard')).toBe(false); expect(e.recall(0, 'mouse')).toBe(false);
    move(1000); expect(e.phase).toBe('sort'); move(100); expect(e.sort(e.trial!.qualities[0], 'keyboard')).toBe(true); expect(e.sort('good', 'keyboard')).toBe(false);
    move(2399); expect(e.phase).toBe('sort'); move(1); expect(e.phase).toBe('sort-feedback');
    expect(e.trial!.sorts).toHaveLength(1); expect(e.trial!.sorts[0].rtMs).toBe(100);
  });
  it('records omission with a null latency', () => { const { e, move } = setup(); e.startNext(); move(3500); expect(e.trial!.sorts[0].omission).toBe(true); expect(e.trial!.sorts[0].rtMs).toBeNull(); });
  it('anchors fixed deadlines to their planned schedule after a late frame', () => { const { e, move, jump } = setup(); e.startNext(); move(980); jump(37); expect(e.phase).toBe('sort'); expect(e.onset).toBe(1017); expect(e.deadline).toBe(3500); });
  it('uses the full green hold and retention before recall', () => { const { e, move, phase } = setup(); e.startNext(); phase('green-hold'); move(499); expect(e.phase).toBe('green-hold'); move(1); expect(e.phase).toBe('retention'); move(14999); expect(e.phase).toBe('retention'); move(1); expect(e.phase).toBe('recall'); });
  it('auto-submits exactly k taps and counts repeated assessment responses', () => { const { e, move, phase } = setup(); e.startNext(); phase('recall'); expect(e.recall(e.trial!.cells[0], 'touch')).toBe(true); expect(e.recall(8, 'touch')).toBe(false); move(200); expect(e.recall(e.trial!.cells[0], 'touch')).toBe(true); expect(e.phase).toBe('feedback'); expect(e.trial!.score!.repetitions).toBe(1); expect(e.recall(2, 'touch')).toBe(false); });
  it('rejects repeat cells in reconstruction', () => { const { e, move, phase } = setup('reconstruction'); e.startNext(); phase('recall'); e.recall(e.trial!.cells[0], 'mouse'); move(200); expect(e.recall(e.trial!.cells[0], 'mouse')).toBe(false); expect(e.phase).toBe('recall'); });
  it('preserves partial recall at timeout', () => { const { e, move, phase } = setup(); e.startNext(); phase('recall'); e.recall(e.trial!.cells[0], 'mouse'); move(20000); expect(e.phase).toBe('feedback'); expect(e.trial!.score!.recallOmissions).toBe(1); expect(e.trial!.score!.positionCorrect).toBe(1); });
  it('rejects held keys and records their reason', () => { const { e, phase } = setup(); e.startNext(); phase('sort'); expect(e.sort('good', 'keyboard', true)).toBe(false); expect(e.session.events.at(-1)?.data.reason).toBe('held-key'); });
});
describe('interruption and recovery', () => {
  it('replaces interrupted attempts without consuming a scheduled trial', () => { const { e, move } = setup(); e.startNext(); const seed = e.trial!.seed; move(200); e.interrupt('tab-hidden'); expect(e.trial!.status).toBe('interrupted'); e.startNext(); expect(e.trial!.seed).not.toBe(seed); expect(e.trial!.scheduledIndex).toBe(1); expect(e.session.trials).toHaveLength(2); expect(e.session.controller.validRounds).toBe(0); });
  it('marks adult assistance and excludes the attempt', () => { const { e } = setup(); e.startNext(); e.assistance(); expect(e.trial!.assisted).toBe(true); expect(e.trial!.status).toBe('interrupted'); expect(e.trial!.score).toBeNull(); });
  it('invalidates a severe frame gap instead of skipping unseen cues', () => { const { e, move, jump } = setup(); e.startNext(); move(20); jump(1500); expect(e.phase).toBe('interrupted'); expect(e.trial!.interruptionReason).toBe('frame-gap'); });
  it('recovers a committed active attempt with a fresh trial', () => { const { e, move, checkpoints } = setup(); e.startNext(); move(1000); const restored = new Engine(structuredClone(checkpoints.at(-1)!), () => 5000); expect(restored.phase).toBe('interrupted'); expect(restored.trial!.interruptionReason).toBe('reload'); restored.startNext(); expect(restored.trial!.scheduledIndex).toBe(1); expect(restored.session.trials[0].status).toBe('interrupted'); });
  it('records events in append order and immutable checkpoints', () => { const { e, move, checkpoints } = setup(); e.startNext(); const first = checkpoints[0]; move(1000); e.sort('good', 'mouse'); expect(first.trials[0].sorts).toHaveLength(0); expect(e.session.events.map(event => event.seq)).toEqual(e.session.events.map((_, i) => i + 1)); });
  it('stops repeated interruptions at the declared limit', () => { const { e } = setup(); for (let i = 0; i < 10; i++) { e.startNext(); e.interrupt('pause'); } e.startNext(); expect(e.phase).toBe('complete'); expect(e.session.endReason).toBe('interruption-limit'); });
  it('does not repeat a terminal round after a reload on its feedback screen', () => { const { e, phase, move, checkpoints } = setup('practice'); for (let round = 0; round < 2; round++) { e.startNext(); for (let i = 0; i < 2; i++) { phase('sort'); e.sort(e.trial!.qualities[i], 'mouse'); move(800); } phase('recall'); for (const cell of e.trial!.cells) { move(200); e.recall(cell, 'mouse'); } } expect(e.willEnd).toBe(true); const restored = new Engine(structuredClone(checkpoints.at(-1)!), () => 90000); restored.startNext(); expect(restored.phase).toBe('complete'); expect(restored.session.endReason).toBe('practice-passed'); });
  it('honours completed criteria when Finish is pressed on terminal feedback', () => { const session = createSession('p', protocolFor('training'), {}, 1); session.controller.validRounds = session.protocol.rounds; session.endReason = 'rounds-complete'; session.trials = [{ id: 't', attempt: 0, scheduledIndex: 10, seed: 0, span: 2, guided: false, assisted: false, cells: [0, 1], qualities: ['good', 'good'], status: 'completed', startedAtMs: 0, endedAtMs: 100, sorts: [], recalls: [], score: null }]; const e = new Engine(session, () => 0); e.finish(); expect(e.session.status).toBe('completed'); expect(e.session.endReason).toBe('rounds-complete'); });
});
