import type { Controller, Protocol } from './types';
export function initialController(p: Protocol): Controller {
  return { span: p.startSpan, block: [], failureStreak: 0, guided: false, guidedStreak: 0, guidedAttempts: 0, validRounds: 0, attemptIndex: 0, practiceStreak: 0, interruptions: 0 };
}
export function advance(before: Controller, success: boolean, p: Protocol): { controller: Controller; reason: string; end: boolean } {
  const c = { ...before, block: [...before.block] };
  if (p.mode === 'practice') {
    c.validRounds++; c.practiceStreak = success ? c.practiceStreak + 1 : 0;
    const passed = c.practiceStreak >= 2;
    return { controller: c, reason: passed ? 'practice-passed' : c.validRounds >= 6 ? 'practice-needs-more' : 'practice-continue', end: passed || c.validRounds >= 6 };
  }
  if (c.guided) {
    c.guidedAttempts++; c.guidedStreak = success ? c.guidedStreak + 1 : 0;
    if (c.guidedStreak >= 3) { c.guided = false; c.guidedAttempts = 0; c.guidedStreak = 0; return { controller: c, reason: 'return-from-support', end: false }; }
    return { controller: c, reason: c.guidedAttempts >= 6 ? 'support-limit' : 'guided-continue', end: c.guidedAttempts >= 6 };
  }
  c.validRounds++; c.block.push(success); c.failureStreak = success ? 0 : c.failureStreak + 1;
  if (c.validRounds >= p.rounds) return { controller: c, reason: 'rounds-complete', end: true };
  if (p.mode === 'assessment') {
    c.span = 2 + Math.floor(c.validRounds / 5);
    if (c.block.length === 5) c.block = [];
    return { controller: c, reason: 'fixed-schedule', end: false };
  }
  if (p.mode === 'training' && c.failureStreak >= 3) {
    c.span = Math.max(2, c.span - 1); c.guided = true; c.guidedAttempts = 0; c.guidedStreak = 0; c.block = []; c.failureStreak = 0;
    return { controller: c, reason: 'enter-guided-support', end: false };
  }
  if (c.block.length === 5) {
    const pass = c.block.filter(Boolean).length >= 3;
    c.block = []; c.failureStreak = 0;
    if (p.mode === 'reconstruction' && (!pass || c.span >= p.maxSpan)) return { controller: c, reason: pass ? 'rounds-complete' : 'gate-not-passed', end: true };
    c.span = pass ? Math.min(p.maxSpan, c.span + 1) : Math.max(2, c.span - 1);
    return { controller: c, reason: pass ? 'span-increased' : 'span-reduced', end: false };
  }
  return { controller: c, reason: 'continue-block', end: false };
}
