import type { Score, Session, Trial } from './types';
export function scoreTrial(t: Pick<Trial, 'cells' | 'qualities' | 'sorts' | 'recalls'>): Score {
  const answers = t.recalls.map(r => r.cell), k = t.cells.length;
  const positions = t.cells.map((cell, i) => answers[i] === cell);
  const exact = answers.length === k && positions.every(Boolean);
  const setCorrect = answers.length === k && new Set(answers).size === k && answers.every(c => t.cells.includes(c));
  const sortCorrect = t.qualities.filter((quality, i) => t.sorts.find(s => s.item === i)?.observed === quality).length;
  const sortWrong = t.sorts.filter(s => s.observed !== null && s.observed !== s.expected).length;
  return {
    exact, setCorrect, wrongOrderCorrectSet: setCorrect && !exact, positions,
    positionCorrect: positions.filter(Boolean).length, sortCorrect, sortWrong, sortOmissions: k - sortCorrect - sortWrong,
    strict: exact && sortCorrect === k,
    intrusions: answers.filter(c => !t.cells.includes(c)).length,
    repetitions: answers.length - new Set(answers).size,
    transpositions: answers.filter((c, i) => t.cells.includes(c) && c !== t.cells[i]).length,
    recallOmissions: Math.max(0, k - answers.length),
  };
}
export const eligible = (t: Trial) => t.status === 'completed' && !t.guided && !t.assisted && t.score !== null;
export function distribution(values: number[]) {
  if (!values.length) return { n: 0, mean: null, median: null, iqr: null };
  const sorted = [...values].sort((a, b) => a - b);
  const q = (p: number) => { const n = (sorted.length - 1) * p, lo = Math.floor(n); return sorted[lo] + (sorted[Math.ceil(n)] - sorted[lo]) * (n - lo); };
  return { n: values.length, mean: values.reduce((a, b) => a + b, 0) / values.length, median: q(0.5), iqr: q(0.75) - q(0.25) };
}
export function summarize(session: Session) {
  const trials = session.protocol.mode === 'practice' ? [] : session.trials.filter(eligible);
  const k = trials.reduce((n, t) => n + t.span, 0);
  const sortRTs = (correct: boolean) => trials.flatMap(t => t.sorts.filter(r => r.rtMs !== null && (r.observed === r.expected) === correct).map(r => r.rtMs!));
  let masteredSpan: number | null = null;
  let block: Trial[] = [];
  for (const t of session.trials) {
    if (t.guided) { block = []; continue; }
    if (!eligible(t) || session.protocol.mode === 'practice') continue;
    if (block.length && (block[0].span !== t.span || t.scheduledIndex !== block[block.length - 1].scheduledIndex + 1)) block = [];
    block.push(t);
    if (block.length === 5) { if (block.filter(r => r.score!.strict).length >= 3) masteredSpan = Math.max(masteredSpan ?? 0, t.span); block = []; }
  }
  return {
    rounds: trials.length,
    exact: trials.length ? trials.filter(t => t.score!.exact).length / trials.length : null,
    strict: trials.length ? trials.filter(t => t.score!.strict).length / trials.length : null,
    sorting: k ? trials.reduce((n, t) => n + t.score!.sortCorrect, 0) / k : null,
    positions: k ? trials.reduce((n, t) => n + t.score!.positionCorrect, 0) / k : null,
    bestSpan: trials.some(t => t.score!.exact) ? Math.max(...trials.filter(t => t.score!.exact).map(t => t.span)) : null,
    masteredSpan,
    interruptions: session.trials.filter(t => t.status === 'interrupted').length,
    guided: session.trials.filter(t => t.guided && t.status === 'completed').length,
    sortOmissions: trials.reduce((n, t) => n + t.score!.sortOmissions, 0),
    recallOmissions: trials.reduce((n, t) => n + t.score!.recallOmissions, 0),
    sortCorrectRT: distribution(sortRTs(true)), sortWrongRT: distribution(sortRTs(false)),
    recallInitiation: distribution(trials.flatMap(t => t.recalls.length ? [t.recalls[0].elapsedMs] : [])),
    recallContinuation: distribution(trials.flatMap(t => t.recalls.slice(1).map(r => r.intervalMs))),
    bySpan: Array.from({ length: 6 }, (_, i) => i + 2).map(span => {
      const rows = trials.filter(t => t.span === span);
      return { span, rounds: rows.length, exact: rows.filter(t => t.score!.exact).length, sorts: rows.reduce((n, t) => n + t.score!.sortCorrect, 0), opportunities: rows.length * span };
    }).filter(row => row.rounds),
  };
}
export const percent = (n: number | null) => n === null ? '—' : `${Math.round(n * 100)}%`;
