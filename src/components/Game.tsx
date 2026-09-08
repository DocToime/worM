import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Engine } from '../core/engine';
import type { Modality, Preferences, Quality, Session } from '../core/types';
import { modeNames, viewportKey } from '../core/protocol';
import { copy } from '../copy';
import { Barn, Crate, Icon, Pepper } from './Art';
import { Garden } from './Garden';

let audioContext: AudioContext | null = null;
function tone(correct: boolean) {
  try {
    audioContext ??= new AudioContext();
    void audioContext.resume();
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = correct ? 523 : 330;
    gain.gain.setValueAtTime(0.05, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + 0.17);
  } catch { /* Audio is optional; game timing is independent. */ }
}
export function BasketButtons({ onSort, disabled = false, selected, hint }: { onSort: (q: Quality, m: Modality) => void; disabled?: boolean; selected?: Quality | null; hint?: Quality | null }) {
  return <div className="basket-row">{(['good', 'worm'] as const).map((q, i) => <button key={q} type="button" className={`basket-button ${selected === q ? 'basket-selected' : ''} ${hint === q ? 'basket-hint' : ''}`} aria-disabled={disabled} onPointerDown={e => { if (e.button === 0) { e.preventDefault(); onSort(q, e.pointerType as Modality); } }} onClick={e => { if (e.detail === 0) onSort(q, 'keyboard'); }} aria-label={i ? 'Sauce, worm pepper, F or right arrow' : 'Market, good pepper, A or left arrow'}>
    <Crate sauce={!!i} /><span><strong>{i ? 'Make sauce' : 'To market'}</strong><small>{i ? 'A little worm? Still useful.' : 'Ripe, fresh & worm-free.'}</small></span><kbd>{i ? 'F →' : '← A'}</kbd>
  </button>)}</div>;
}
export default function Game({ session, prefs, onSave, onEnd, onSound }: { session: Session; prefs: Preferences; onSave: (s: Session) => void; onEnd: (s: Session) => void; onSound: () => void }) {
  const [, refresh] = useState(0), [replay, setReplay] = useState(-1);
  const callbacks = useRef({ onSave, onEnd }); callbacks.current = { onSave, onEnd };
  const engineRef = useRef<Engine | null>(null);
  if (!engineRef.current) engineRef.current = new Engine(structuredClone(session), () => performance.now(), () => refresh(n => n + 1), s => callbacks.current.onSave(s));
  const engine = engineRef.current, state = engine.snapshot(), t = state.trial;
  const ended = useRef(false), prefsRef = useRef(prefs); prefsRef.current = prefs;
  const replayTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useLayoutEffect(() => {
    if (!engine.isActive) return;
    const rect = document.querySelector('[data-testid="garden"]')?.getBoundingClientRect();
    const geometry = rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
    if (geometry) engine.session.environment.gardenRect = geometry;
    engine.record('render-commit', { phase: state.phase, item: state.item, viewport: viewportKey(), gardenRect: geometry });
    engine.save();
  }, [engine, state.phase, state.item, t?.id]);
  const previousSound = useRef(prefs.sound);
  useEffect(() => {
    if (previousSound.current !== prefs.sound) {
      engine.record('setting-change', { name: 'sound', value: prefs.sound, effective: engine.session.protocol.mode !== 'assessment' && prefs.sound });
      engine.save(); previousSound.current = prefs.sound;
    }
  }, [engine, prefs.sound]);
  useEffect(() => {
    engine.save();
    let raf = 0, lastPaint = 0;
    const frame = (now: number) => {
      engine.tick();
      if (now - lastPaint >= 100) { refresh(n => n + 1); lastPaint = now; }
      if (engine.phase === 'complete' && !ended.current) { ended.current = true; callbacks.current.onEnd(structuredClone(engine.session)); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const held = new Set<string>();
    const keydown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'escape') { engine.interrupt('pause'); return; }
      if (!['a', 'f', 'arrowleft', 'arrowright'].includes(key)) return;
      e.preventDefault();
      const repeated = e.repeat || held.has(key); held.add(key);
      const accepted = engine.sort(key === 'a' || key === 'arrowleft' ? 'good' : 'worm', 'keyboard', repeated);
      if (accepted && prefsRef.current.sound && engine.session.protocol.mode !== 'assessment') tone(engine.sortFeedback === true);
    };
    const keyup = (e: KeyboardEvent) => held.delete(e.key.toLowerCase());
    const visibility = () => { if (document.hidden) { held.clear(); if (engine.isActive) engine.interrupt('tab-hidden'); } };
    const blur = () => { held.clear(); if (engine.isActive) engine.interrupt('window-blur'); };
    const resize = () => { if (engine.isActive) engine.interrupt('viewport-changed'); };
    const unload = () => { if (engine.isActive) engine.interrupt('page-exit'); };
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup);
    document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', blur);
    window.addEventListener('resize', resize); window.addEventListener('pagehide', unload);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', blur); window.removeEventListener('resize', resize); window.removeEventListener('pagehide', unload); replayTimers.current.forEach(clearTimeout); };
  }, [engine]);
  const start = () => {
    if (['assessment', 'reconstruction'].includes(session.protocol.mode) && (innerWidth < 700 || innerHeight < 600)) return;
    setReplay(-1); replayTimers.current.forEach(clearTimeout); replayTimers.current = [];
    engine.startNext();
  };
  const doReplay = () => {
    if (!t) return;
    engine.record('replay', { guided: t.guided, afterResponse: true }); engine.save();
    replayTimers.current.forEach(clearTimeout);
    t.cells.forEach((cell, i) => { replayTimers.current.push(setTimeout(() => setReplay(cell), i * 1100)); replayTimers.current.push(setTimeout(() => setReplay(-1), i * 1100 + 850)); });
  };
  const sort = (q: Quality, m: Modality) => {
    const accepted = engine.sort(q, m);
    if (accepted && prefs.sound && session.protocol.mode !== 'assessment') tone(engine.sortFeedback === true);
  };
  const phaseCopy = state.phase in copy ? copy[state.phase as keyof typeof copy] : null;
  const visibleRipe = state.phase === 'cue' || (!session.protocol.centralSort && ['sort', 'sort-feedback'].includes(state.phase));
  const selected = t?.sorts.find(s => s.item === state.item)?.observed;
  const calibration = prefs.calibration?.viewport === viewportKey() ? prefs.calibration.pixelsPerCm * 16 : undefined;
  const progress = state.controller.validRounds / session.protocol.rounds;
  const isAssessment = session.protocol.mode === 'assessment';
  const smallAssessment = ['assessment', 'reconstruction'].includes(session.protocol.mode) && (innerWidth < 700 || innerHeight < 600);
  return <main className="game-page page-enter" data-phase={state.phase}>
    <div className="game-topline"><span className="eyebrow"><Icon name="sprout" /> {modeNames[session.protocol.mode]}</span><div className="game-actions"><button className="icon-button" aria-label={prefs.sound ? 'Mute sound' : 'Enable sound'} onClick={onSound}><Icon name={prefs.sound ? 'volume' : 'mute'} /></button><button className="button button-small button-outline" onClick={() => engine.interrupt('pause')} disabled={state.phase === 'ready'}><Icon name="pause" size={16} /> Pause</button></div></div>
    <div className="session-progress"><span style={{ width: `${progress * 100}%` }} /></div>
    <div className="game-meta"><span>{t?.guided ? 'Guided round' : `Round ${Math.min(state.controller.validRounds + (state.phase === 'feedback' ? 0 : 1), session.protocol.rounds)} of ${session.protocol.rounds}`}</span><span><b>{t?.span ?? state.controller.span}</b> plants to remember</span></div>
    {state.phase === 'ready' ? <div className="game-intro"><span className="pill">A little focus. A fresh start.</span><h1>Ready for your harvest?</h1><p>Watch the places. Sort the peppers.<br />Then pick the plants in the same order.</p><Garden preview /><button className="button button-primary" onClick={start} disabled={smallAssessment}>Let’s begin <Icon name="arrow" /></button>{smallAssessment && <p className="notice">For this check-in, use a tablet or computer with a viewport of at least 700 × 600 pixels.</p>}<button className="text-button" onClick={() => engine.finish()}>Finish for now</button></div> : state.phase === 'interrupted' ? <section className="break-panel"><span className="round-icon"><Icon name="pause" size={28} /></span><span className="eyebrow">Take your time</span><h1>A little breathing room.</h1><p>Your completed rounds are saved as you go.<br />We’ll begin the next round with a fresh sequence.</p>{state.message !== 'pause' && <p className="muted">{state.message === 'reload' ? 'Welcome back to your garden.' : 'The round was interrupted so its timing stays fair.'}</p>}<div className="stack-actions"><button className="button button-primary" onClick={start} disabled={smallAssessment}>{engine.willEnd ? 'See my harvest' : 'Continue with fresh peppers'} <Icon name="arrow" /></button>{smallAssessment && <p className="notice">Use a viewport of at least 700 × 600 pixels to continue.</p>}<button className="button button-outline" onClick={() => { engine.assistance(); refresh(n => n + 1); }} disabled={t?.assisted}>{t?.assisted ? 'Adult help noted' : 'Note adult help for this round'}</button><button className="text-button" onClick={() => engine.finish()}>Finish session</button></div></section> : state.phase === 'feedback' ? <section className="feedback-panel">
      <span className="round-icon"><Icon name={t?.score?.strict ? 'sprout' : 'leaf'} size={30} /></span>
      <span className="eyebrow">{t?.guided ? 'Growing with a little guidance' : `Harvest ${t?.scheduledIndex}`}</span>
      <h1>{isAssessment ? 'Round complete.' : t?.score?.strict ? 'A lovely little harvest.' : 'Every harvest is practice.'}</h1>
      <p>{isAssessment ? 'Take a breath before the next sequence.' : t?.score?.exact ? 'You remembered every plant in order.' : 'Let’s give your memory another fresh start.'}</p>
      {!isAssessment && <div className="feedback-measures"><span><b>{t?.score?.positionCorrect} / {t?.span}</b> places in order</span><span><b>{t?.score?.sortCorrect} / {t?.span}</b> peppers sorted</span></div>}
      {state.message === 'span-increased' && <p className="notice positive">Your garden is growing: {state.controller.span} plants next round.</p>}
      {state.message === 'enter-guided-support' && <p className="notice">Let’s slow things down for a few guided rounds. These stay separate from your training score.</p>}
      {state.message === 'return-from-support' && <p className="notice positive">Three guided harvests in a row. Ready to return to your training.</p>}
      {state.message === 'support-limit' && <p className="notice">A good moment for a break. Your next visit can start with guided practice.</p>}
      {session.protocol.mode !== 'assessment' && session.protocol.mode !== 'reconstruction' && !t?.score?.exact && <><div className="replay-garden"><Garden activeCell={replay} preview /></div><button className="text-button" onClick={doReplay}><Icon name="repeat" size={17} /> Show me the order again</button></>}
      <button className="button button-primary" onClick={start}>{engine.willEnd ? 'See my harvest' : 'Next harvest'} <Icon name="arrow" /></button><button className="text-button" onClick={() => engine.finish()}>Finish for now</button>
    </section> : <>
      <div className="phase-heading"><span className="eyebrow">{state.phase === 'recall' ? '03 / Remember' : state.phase === 'retention' ? 'A quiet pause' : state.phase === 'sort' || state.phase === 'sort-feedback' ? '02 / Sort' : '01 / Watch'}</span><h1>{phaseCopy?.title}</h1><p>{phaseCopy?.detail}</p></div>
      <div className="garden-stage">
        <Garden activeCell={visibleRipe ? t!.cells[state.item] : -1} quality={t?.qualities[state.item]} onSelect={(cell, m) => engine.recall(cell, m)} recall={state.phase === 'recall'} size={calibration} />
        {session.protocol.centralSort && ['sort', 'sort-feedback'].includes(state.phase) && <div className="sorting-overlay"><div className="sorting-card"><span className="eyebrow">This pepper goes to…</span><span role="img" aria-label={t!.qualities[state.item] === 'worm' ? 'Ripe yellow pepper with a worm' : 'Ripe yellow pepper without a worm'} className="sorting-pepper"><Pepper ripe quality={t!.qualities[state.item]} /></span><span className="sort-status">{selected ? isAssessment ? 'Response recorded' : state.sortFeedback ? 'That’s the right basket!' : `This one can ${t!.qualities[state.item] === 'worm' ? 'become sauce' : 'go to market'}.` : 'Choose a basket below'}</span></div></div>}
        {state.phase === 'retention' && <div className="retention-overlay"><Barn /><div className="retention-count">{Math.ceil(state.remainingMs / 1000)}<small>seconds</small></div><span>Keep the order growing.</span></div>}
      </div>
      <div className="phase-counter" aria-live="polite">{state.phase === 'recall' ? <><div className="response-dots">{Array.from({ length: t!.span }, (_, i) => <span key={i} className={i < t!.recalls.length ? 'filled' : ''} />)}</div><span>{t!.recalls.length} of {t!.span} plants picked · {Math.ceil(state.remainingMs / 1000)}s left</span></> : state.phase === 'retention' ? <span>No picking just yet.</span> : <span>Pepper {state.item + 1} of {t!.span}</span>}</div>
      <BasketButtons onSort={sort} disabled={state.phase !== 'sort' || !!selected} selected={selected} hint={!isAssessment && state.phase === 'sort-feedback' && state.sortFeedback === false ? t!.qualities[state.item] : null} />
      <p className="game-footnote">{state.phase === 'recall' ? 'Pick directly in the garden. The baskets can rest.' : 'Use the baskets, or press A / F on your keyboard.'}</p>
    </>}
  </main>;
}
