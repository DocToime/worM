import { useEffect, useRef, useState } from 'react';
import { Garden } from './Garden';
import { BasketButtons } from './Game';
import { Icon, Pepper } from './Art';
import type { Quality } from '../core/types';
export default function Tutorial({ onPractice, onBack }: { onPractice: () => void; onBack: () => void }) {
  const [step, setStep] = useState(1), [sortIndex, setSortIndex] = useState(0), [message, setMessage] = useState(''), [active, setActive] = useState(-1), [watching, setWatching] = useState(true), [answers, setAnswers] = useState<number[]>([]), [recallPassed, setRecallPassed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const path = [1, 6];
  const showPath = () => {
    timers.current.forEach(clearTimeout); setAnswers([]); setRecallPassed(false); setWatching(true); setMessage('Watch these two plants.'); setActive(path[0]);
    timers.current = [setTimeout(() => setActive(-1), 1200), setTimeout(() => setActive(path[1]), 1700), setTimeout(() => setActive(-1), 2900), setTimeout(() => { setWatching(false); setMessage('Your turn. Pick the same two plants in order.'); }, 3400)];
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { if (step === 2) showPath(); }, [step]);
  const sort = (q: Quality) => {
    if (sortIndex >= 2) return;
    const expected = sortIndex === 0 ? 'good' : 'worm';
    if (q === expected) { setSortIndex(n => n + 1); setMessage(sortIndex === 0 ? 'Correct. Now sort the pepper with a worm.' : 'Both correct. Now try remembering.'); }
    else setMessage(expected === 'good' ? 'No worm: choose Market.' : 'With worm: choose Sauce.');
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (step !== 1 || e.repeat) return;
      const pressed = e.key.toLowerCase();
      if (['a', 'arrowleft', 'f', 'arrowright'].includes(pressed)) { e.preventDefault(); sort(['a', 'arrowleft'].includes(pressed) ? 'good' : 'worm'); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [step, sortIndex]);
  return <main className="tutorial-page page-enter"><button className="text-button" onClick={onBack}>← Back</button><div className="section-heading"><span className="eyebrow">How to play · {step} of 2</span><h1>{['', 'Sort the peppers.', 'Remember the plants.'][step]}</h1><p>{['', 'No worm → Market. With worm → Sauce.', 'Watch two plants, then tap them in order.'][step]}</p></div>
    {step === 1 && <><div className="tutorial-sort">{sortIndex < 2 ? <Pepper ripe quality={sortIndex === 0 ? 'good' : 'worm'} /> : <span className="round-icon"><Icon name="check" size={40} /></span>}</div><BasketButtons onSort={sort} disabled={sortIndex >= 2} /><p className="tutorial-message" aria-live="polite">{message || 'Where does this pepper go?'}</p>{sortIndex >= 2 && <button className="button button-primary" onClick={() => setStep(2)}>Try remembering <Icon name="arrow" /></button>}</>}
    {step === 2 && <><div className="tutorial-garden"><Garden activeCell={active} recall={!watching && !recallPassed} onSelect={cell => { if (watching || recallPassed || answers.length >= 2) return; const next = [...answers, cell]; setAnswers(next); if (next.length === 2) { const pass = next.every((v, i) => v === path[i]); setRecallPassed(pass); setMessage(pass ? 'Correct. Now try both tasks together.' : 'Not quite. Watch the order and try again.'); } }} /></div><p className="tutorial-message" aria-live="polite">{message}</p>{recallPassed ? <button className="button button-primary" onClick={onPractice}>Start practice <Icon name="arrow" /></button> : !watching && <button className="button button-outline" onClick={showPath}><Icon name="repeat" /> Watch again</button>}<p className="muted small">Finish two correct practice rounds in a row to start a session.</p></>}
  </main>;
}
