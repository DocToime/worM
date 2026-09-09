import type { Mode, Preferences, Protocol } from './types';
export const BUILD_VERSION = '1.1.0';
export const defaults: Preferences = { sound: false, reducedMotion: false, rounds: 10, startSpan: 2, delayMs: 5000, calibration: null };
export function protocolFor(mode: Mode, prefs: Preferences = defaults): Protocol {
  const common: Protocol = {
    id: `worm-${mode}`, version: '1.0.0', mode, startSpan: 2, maxSpan: 7,
    rounds: prefs.rounds, cueMs: 1000, sortMs: 3500, feedbackMs: 400,
    intervalMs: 400, greenMs: 500, delayMs: prefs.delayMs, recallMs: 20000,
    maxMinutes: 10, fixedSort: false, centralSort: true, allowRepeats: true,
  };
  if (mode === 'assessment') return { ...common, maxSpan: 4, rounds: 15, sortMs: 2500, delayMs: 15000, fixedSort: true, maxMinutes: 20 };
  if (mode === 'reconstruction') return { ...common, maxSpan: 4, rounds: 15, delayMs: 15000, centralSort: false, allowRepeats: false, maxMinutes: 20 };
  if (mode === 'practice') return { ...common, maxSpan: 2, rounds: 6, cueMs: 1500, sortMs: 5000, delayMs: 3000, recallMs: 30000, maxMinutes: 5 };
  return { ...common, startSpan: prefs.startSpan };
}
export function hashConfig(value: unknown): string {
  const str = JSON.stringify(value);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
}
export function viewportKey() { return `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`; }
export const modeNames: Record<Mode, string> = { training: 'Daily training', assessment: 'Memory check-in', practice: 'Guided practice', reconstruction: 'Original-style protocol' };
