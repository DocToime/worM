import { describe, expect, it } from 'vitest';
import { generate, trialSeed } from '../src/core/random';
import { defaults, coerceTheme, hashConfig, oppositeTheme, protocolFor, resolveTheme } from '../src/core/protocol';
import { advance, initialController } from '../src/core/adaptation';
import { createSession } from '../src/core/engine';
import { distribution, scoreTrial, summarize } from '../src/core/scoring';
import { csvCell, toCSV } from '../src/data/export';
import type { Protocol, Trial } from '../src/core/types';
const training = protocolFor('training');
function trial(cells = [0, 4, 8], answers = cells): Trial {
  const t: Trial = { id: 'test', attempt: 0, scheduledIndex: 1, seed: 1, span: cells.length, guided: false, assisted: false, cells, qualities: cells.map(() => 'good'), status: 'completed', startedAtMs: 0, endedAtMs: 10000, sorts: cells.map((_, item) => ({ item, expected: 'good', observed: 'good', eligibleAt: 0, deadline: 2500, at: 500, rtMs: 500, modality: 'mouse', omission: false })), recalls: answers.map((cell, i) => ({ cell, at: 1000 + i * 500, elapsedMs: 1000 + i * 500, intervalMs: i ? 500 : 1000, modality: 'mouse' })), score: null };
  t.score = scoreTrial(t); return t;
}
describe('seeded stimuli', () => {
  it('reproduces actual sequences for the same seed', () => expect(generate(12345, 4, training)).toEqual(generate(12345, 4, training)));
  it('samples distinct valid cells at every supported span and preserves homogeneous categories', () => {
    const visited = new Set<number>(); let allGood = false, allWorm = false, simplePath = false;
    for (let seed = 0; seed < 600; seed++) for (let k = 2; k <= 7; k++) {
      const s = generate(seed, k, training); expect(s.cells).toHaveLength(k); expect(new Set(s.cells).size).toBe(k);
      s.cells.forEach(c => { expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThan(9); visited.add(c); });
      allGood ||= s.qualities.every(q => q === 'good'); allWorm ||= s.qualities.every(q => q === 'worm');
      simplePath ||= k === 3 && s.cells.join(',') === '0,1,2';
    }
    expect(visited.size).toBe(9); expect(allGood && allWorm && simplePath).toBe(true);
  });
  it('has no worms only in reconstruction level one', () => { const p = protocolFor('reconstruction'); for (let n = 0; n < 20; n++) expect(generate(n, 2, p).qualities).toEqual(['good', 'good']); });
  it('rejects invalid spans and creates independent attempt seeds', () => { expect(() => generate(1, 8, training)).toThrow(); expect(new Set(Array.from({ length: 100 }, (_, i) => trialSeed(42, i))).size).toBe(100); });
  it('keeps assessment config independent of training settings', () => expect(protocolFor('assessment', { ...defaults, rounds: 5, startSpan: 7, delayMs: 3000 })).toEqual(protocolFor('assessment')));
  it('hashes all resolved task settings', () => { expect(hashConfig(training)).toBe(hashConfig(structuredClone(training))); expect(hashConfig({ ...training, delayMs: 3000 })).not.toBe(hashConfig(training)); });
  it('treats garden brightness as chrome, not protocol', () => {
    expect(coerceTheme(undefined)).toBe('light'); expect(coerceTheme('Dark')).toBe('light'); expect(coerceTheme('system')).toBe('system');
    expect(resolveTheme('system', true)).toBe('dark'); expect(resolveTheme('light', true)).toBe('light'); expect(oppositeTheme('dark')).toBe('light');
    expect(protocolFor('training', { ...defaults, theme: 'dark' })).toEqual(protocolFor('training'));
  });
});
describe('reproducible scores', () => {
  it('separates strict from perfect recall with a sorting error', () => { const t = trial(); t.sorts[0].observed = 'worm'; const score = scoreTrial(t); expect(score.exact).toBe(true); expect(score.strict).toBe(false); expect(score.sortCorrect).toBe(2); expect(score.sortWrong).toBe(1); });
  it('distinguishes a permutation from lost locations', () => { const s = trial([0, 4, 8], [8, 4, 0]).score!; expect(s.setCorrect).toBe(true); expect(s.exact).toBe(false); expect(s.wrongOrderCorrectSet).toBe(true); expect(s.positionCorrect).toBe(1); expect(s.transpositions).toBe(2); });
  it('records repetitions, intrusions and omissions', () => { const s = trial([0, 4, 8, 3], [0, 0, 7]).score!; expect(s.repetitions).toBe(1); expect(s.intrusions).toBe(1); expect(s.recallOmissions).toBe(1); expect(s.setCorrect).toBe(false); });
  it('counts sorting timeouts without inventing RTs', () => { const t = trial(); Object.assign(t.sorts[0], { observed: null, at: null, rtMs: null, omission: true }); t.score = scoreTrial(t); const s = createSession('p', training, {}, 1); s.trials = [t]; const summary = summarize(s); expect(summary.sorting).toBe(2 / 3); expect(summary.sortOmissions).toBe(1); expect(summary.sortCorrectRT.n).toBe(2); expect(summary.sortWrongRT.n).toBe(0); });
  it('excludes interruptions, guidance and assistance', () => { const s = createSession('p', training, {}, 1); s.trials = [{ ...trial(), guided: true }, { ...trial(), status: 'interrupted' }, { ...trial(), assisted: true }]; expect(summarize(s).rounds).toBe(0); expect(summarize(s).exact).toBeNull(); expect(summarize(s).bestSpan).toBeNull(); });
  it('keeps practice out of standard scores', () => { const s = createSession('p', protocolFor('practice'), {}, 1); s.trials = [trial()]; expect(summarize(s).rounds).toBe(0); });
  it('summarises medians and spread without mutating inputs', () => { const values = [400, 100, 200, 300]; expect(distribution(values)).toEqual({ n: 4, mean: 250, median: 250, iqr: 150 }); expect(values[0]).toBe(400); expect(distribution([]).median).toBeNull(); });
});
describe('adaptation and stopping', () => {
  function run(outcomes: boolean[], p: Protocol = training) { let c = initialController(p); let result = { controller: c, reason: '', end: false }; for (const success of outcomes) { result = advance(c, success, p); c = result.controller; } return result; }
  it('promotes after three of five strict successes', () => { const result = run([true, false, true, false, true]); expect(result.controller.span).toBe(3); expect(result.reason).toBe('span-increased'); });
  it('reduces load after a failed block without an earlier support trigger', () => { const result = run([false, true, false, true, false], { ...training, startSpan: 4 }); expect(result.controller.span).toBe(3); });
  it('enters support on the third consecutive failure and clears the evidence window', () => { const r = run([false, false, false], { ...training, startSpan: 4 }); expect(r.controller.guided).toBe(true); expect(r.controller.span).toBe(3); expect(r.controller.block).toEqual([]); expect(r.controller.validRounds).toBe(3); });
  it('exits support after three consecutive guided successes without adding scored rounds', () => { const r = run([false, false, false, true, true, true]); expect(r.controller.guided).toBe(false); expect(r.controller.validRounds).toBe(3); expect(r.reason).toBe('return-from-support'); });
  it('ends after six guided attempts without criterion', () => expect(run([false, false, false, true, false, true, false, true, false]).end).toBe(true));
  it('caps span at seven', () => expect(run([true, true, true, true, true], { ...training, startSpan: 7 }).controller.span).toBe(7));
  it('gives round cap precedence over guidance', () => { const r = run([true, true, false, false, false], { ...training, rounds: 5 }); expect(r.reason).toBe('rounds-complete'); expect(r.controller.guided).toBe(false); });
  it('runs assessment spans 2,3,4 regardless of performance', () => { const p = protocolFor('assessment'); let c = initialController(p); const spans: number[] = []; for (let i = 0; i < 15; i++) { spans.push(c.span); const result = advance(c, false, p); c = result.controller; expect(result.end).toBe(i === 14); } expect(spans).toEqual([...Array(5).fill(2), ...Array(5).fill(3), ...Array(5).fill(4)]); expect(c.guided).toBe(false); });
  it('stops the reconstruction at a failed gate', () => expect(run([true, false, false, true, false], protocolFor('reconstruction')).reason).toBe('gate-not-passed'));
  it('requires two consecutive successes in practice', () => { const p = protocolFor('practice'); expect(run([true, false, true], p).end).toBe(false); expect(run([true, false, true, true], p).reason).toBe('practice-passed'); expect(run(Array(6).fill(false), p).reason).toBe('practice-needs-more'); });
});
describe('export', () => {
  it('quotes CSV cells, arrays and formulas', () => { expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"'); expect(csvCell('=1+1')).toBe('"\'=1+1"'); expect(csvCell(null)).toBe('""'); expect(csvCell([1, 2])).toBe('"[1,2]"'); });
  it('exports actual responses and separate scores', () => { const s = createSession('p', training, {}, 1); s.trials = [trial()]; const csv = toCSV([s]); expect(csv).toContain('"exact_order"'); expect(csv).toContain('"[0,4,8]"'); expect(csv).toContain('"sort_omissions"'); expect(csv.split('\r\n')).toHaveLength(2); });
});
