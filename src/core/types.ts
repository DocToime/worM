export type Mode = 'training' | 'assessment' | 'reconstruction' | 'practice';
export type Quality = 'good' | 'worm';
export type Modality = 'mouse' | 'touch' | 'pen' | 'keyboard';
export type Phase = 'ready' | 'cue' | 'sort' | 'sort-feedback' | 'interval' | 'green-hold' | 'retention' | 'recall' | 'feedback' | 'interrupted' | 'complete';
export interface Protocol {
  id: string; version: string; mode: Mode; startSpan: number; maxSpan: number;
  rounds: number; cueMs: number; sortMs: number; feedbackMs: number; intervalMs: number;
  greenMs: number; delayMs: number; recallMs: number; maxMinutes: number;
  fixedSort: boolean; centralSort: boolean; allowRepeats: boolean;
}
export type ThemePreference = 'system' | 'light' | 'dark';
export interface Preferences {
  sound: boolean; reducedMotion: boolean; theme: ThemePreference; rounds: number; startSpan: number; delayMs: number;
  calibration: { pixelsPerCm: number; viewport: string } | null;
}
export interface Profile { id: string; name: string; createdAt: string; learned: boolean }
export interface SortResponse {
  item: number; expected: Quality; observed: Quality | null; eligibleAt: number;
  deadline: number; at: number | null; rtMs: number | null; modality: Modality | null; omission: boolean;
}
export interface RecallResponse { cell: number; at: number; elapsedMs: number; intervalMs: number; modality: Modality }
export interface Score {
  exact: boolean; setCorrect: boolean; wrongOrderCorrectSet: boolean; positions: boolean[];
  positionCorrect: number; sortCorrect: number; sortWrong: number; sortOmissions: number;
  strict: boolean; intrusions: number; repetitions: number; transpositions: number; recallOmissions: number;
}
export interface Trial {
  id: string; attempt: number; scheduledIndex: number; seed: number; span: number;
  guided: boolean; assisted: boolean; cells: number[]; qualities: Quality[];
  status: 'active' | 'completed' | 'interrupted'; startedAtMs: number; endedAtMs: number | null;
  sorts: SortResponse[]; recalls: RecallResponse[]; score: Score | null; interruptionReason?: string;
}
export interface GameEvent { seq: number; trialId: string | null; atMs: number; type: string; data: Record<string, unknown> }
export interface Controller {
  span: number; block: boolean[]; failureStreak: number; guided: boolean;
  guidedStreak: number; guidedAttempts: number; validRounds: number; attemptIndex: number;
  practiceStreak: number; interruptions: number;
}
export interface Session {
  schemaVersion: 1; id: string; participantId: string; startedAt: string; endedAt: string | null;
  status: 'active' | 'completed' | 'partial'; endReason: string | null;
  seed: number; protocol: Protocol; protocolHash: string; buildVersion: string; assetVersion: string; scoringVersion: string;
  environment: Record<string, unknown>; controller: Controller; trials: Trial[]; events: GameEvent[];
  elapsedMs: number;
}
export interface Snapshot {
  phase: Phase; item: number; remainingMs: number; trial: Trial | null;
  sortFeedback: boolean | null; controller: Controller; message: string; session: Session;
}
