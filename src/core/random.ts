import type { Protocol, Quality } from './types';
// mulberry32-v1. Fisher–Yates v1. Never use this stream for decoration.
export function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function trialSeed(seed: number, attempt: number) { return (seed ^ Math.imul(attempt + 1, 0x9e3779b9)) >>> 0; }
export function generate(seed: number, span: number, protocol: Protocol) {
  if (!Number.isInteger(span) || span < 2 || span > 7) throw new Error('Span must be an integer from 2 to 7');
  const rng = random(seed), cells = Array.from({ length: 9 }, (_, i) => i);
  for (let i = 8; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const p = protocol.mode === 'reconstruction' ? span === 2 ? 0 : span === 3 ? 0.4 : 0.5 : 0.5;
  return { cells: cells.slice(0, span), qualities: Array.from({ length: span }, (): Quality => rng() < p ? 'worm' : 'good') };
}
