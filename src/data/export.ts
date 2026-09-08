import type { Profile, Session } from '../core/types';
export function csvCell(value: unknown) {
  let str = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[=+@\-\t\r]/.test(str)) str = `'${str}`;
  return `"${str.replaceAll('"', '""')}"`;
}
export function toCSV(sessions: Session[]) {
  const headers = ['session_id', 'participant_id', 'protocol_id', 'protocol_version', 'protocol_hash', 'session_status', 'trial_id', 'attempt', 'scheduled_round', 'seed', 'span', 'guided', 'assisted', 'status', 'interruption_reason', 'delay_ms', 'cells', 'qualities', 'sort_responses', 'recall_responses', 'exact_order', 'correct_set', 'strict_success', 'positions_correct', 'sort_correct', 'sort_wrong', 'sort_omissions', 'recall_omissions', 'intrusions', 'repetitions', 'transpositions'];
  const rows = sessions.flatMap(s => s.trials.map(t => [s.id, s.participantId, s.protocol.id, s.protocol.version, s.protocolHash, s.status, t.id, t.attempt, t.scheduledIndex, t.seed, t.span, t.guided, t.assisted, t.status, t.interruptionReason, t.guided ? 3000 : s.protocol.delayMs, t.cells, t.qualities, t.sorts, t.recalls, t.score?.exact, t.score?.setCorrect, t.score?.strict, t.score?.positionCorrect, t.score?.sortCorrect, t.score?.sortWrong, t.score?.sortOmissions, t.score?.recallOmissions, t.score?.intrusions, t.score?.repetitions, t.score?.transpositions]));
  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function download(sessions: Session[], format: 'json' | 'csv', profiles: Profile[] = []) {
  const content = format === 'json' ? JSON.stringify({ format: 'worm-garden-export', schemaVersion: 1, exportedAt: new Date().toISOString(), profiles, sessions }, null, 2) : toCSV(sessions);
  const url = URL.createObjectURL(new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `worm-harvest-${new Date().toISOString().slice(0, 10)}.${format}`;
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
