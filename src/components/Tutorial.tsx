import { useEffect, useRef, useState } from 'react';
import { Garden } from './Garden';
import { BasketButtons } from './Game';
import { Icon, Pepper } from './Art';
import type { Quality } from '../core/types';
export default function Tutorial({ onPractice, onBack }: { onPractice: () => void; onBack: () => void }) {
  const [step, setStep] = useState(0), [sortIndex, setSortIndex] = useState(0), [message, setMessage] = useState(''), [active, setActive] = useState(-1), [watching, setWatching] = useState(true), [answers, setAnswers] = useState<number[]>([]), [recallPassed, setRecallPassed] = useState(false);
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
    if (q === expected) { setSortIndex(n => n + 1); setMessage(sortIndex === 0 ? 'Exactly. Now find a home for this worm pepper.' : 'Lovely. Nothing goes to waste.'); }
    else setMessage(expected === 'good' ? 'No worm here. Try the market crate on the left.' : 'A worm pepper can become sauce. Try the jar on the right.');
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (step !== 1 || e.repeat) return;
      if (['a', 'ArrowLeft', 'f', 'ArrowRight'].includes(e.key)) { e.preventDefault(); sort(['a', 'ArrowLeft'].includes(e.key) ? 'good' : 'worm'); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [step, sortIndex]);
  return <main className="tutorial-page page-enter"><button className="text-button" onClick={onBack}>← Back to the garden</button><div className="section-heading"><span className="eyebrow">A small introduction · {step + 1} of 3</span><h1>{['Meet your peppers.', 'Find the right basket.', 'Remember their places.'][step]}</h1><p>{['A good harvest starts with knowing what to pick.', 'Let’s try each kind before the memory game.', 'Watch the order. Then make the same little journey.'][step]}</p></div>
    {step === 0 && <><div className="pepper-lessons"><article><Pepper /><h3>Still growing</h3><p>Green peppers stay on the plant.</p></article><article><Pepper ripe /><h3>Ready for market</h3><p>A yellow pepper with no worm goes left.</p></article><article><Pepper ripe quality="worm" /><h3>Perfect for sauce</h3><p>A little worm? We’ll clean it and make sauce.</p></article></div><div className="notice">Remember <b>where</b> the peppers ripen and <b>in what order</b>. After the barn doors open, pick those plants in the same order.</div><button className="button button-primary" onClick={() => setStep(1)}>Try sorting <Icon name="arrow" /></button></>}
    {step === 1 && <><div className="tutorial-sort">{sortIndex < 2 ? <Pepper ripe quality={sortIndex === 0 ? 'good' : 'worm'} /> : <span className="round-icon"><Icon name="check" size={40} /></span>}</div><BasketButtons onSort={sort} disabled={sortIndex >= 2} /><p className="tutorial-message" aria-live="polite">{message || 'A fresh yellow pepper. Which basket does it need?'}</p>{sortIndex >= 2 && <button className="button button-primary" onClick={() => setStep(2)}>Try remembering <Icon name="arrow" /></button>}</>}
    {step === 2 && <><div className="tutorial-garden"><Garden activeCell={active} recall={!watching && !recallPassed} onSelect={cell => { if (watching || recallPassed || answers.length >= 2) return; const next = [...answers, cell]; setAnswers(next); if (next.length === 2) { const pass = next.every((v, i) => v === path[i]); setRecallPassed(pass); setMessage(pass ? 'You’ve got it. Let’s put sorting and remembering together.' : 'Almost. Watch the two places once more, then try again.'); } }} /></div><p className="tutorial-message" aria-live="polite">{message}</p>{recallPassed ? <button className="button button-primary" onClick={onPractice}>Start combined practice <Icon name="arrow" /></button> : !watching && <button className="button button-outline" onClick={showPath}><Icon name="repeat" /> Watch again</button>}<p className="muted small">Two successful combined practice rounds will unlock your first session.</p></>}
  </main>;
}
