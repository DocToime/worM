import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ButtonHTMLAttributes } from 'react';
import { Engine } from '../core/engine';
import type { Modality, Preferences, Quality, Session } from '../core/types';
import { compactViewport, modeNames, viewportKey } from '../core/protocol';
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
// A recall pointerdown can replace the garden before its click arrives.
// Only activate a newly shown action if the press began on that action.
function ActionButton({ onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const pressedHere = useRef(false);
  return <button {...props} onPointerDown={e => { pressedHere.current = e.button === 0; }} onPointerCancel={() => { pressedHere.current = false; }} onClick={e => {
    const allowed = e.detail === 0 || pressedHere.current;
    pressedHere.current = false;
    if (allowed) onClick?.(e);
  }} />;
}
export function BasketButtons({ onSort, disabled = false, selected, hint }: { onSort: (q: Quality, m: Modality) => void; disabled?: boolean; selected?: Quality | null; hint?: Quality | null }) {
  return <div className="basket-row">{(['good', 'worm'] as const).map((q, i) => <button key={q} type="button" className={`basket-button ${selected === q ? 'basket-selected' : ''} ${hint === q ? 'basket-hint' : ''}`} disabled={disabled} onPointerDown={e => { if (e.button === 0) { e.preventDefault(); onSort(q, e.pointerType as Modality); } }} onClick={e => { if (e.detail === 0) onSort(q, 'keyboard'); }} aria-label={i ? 'Sauce, worm pepper, F or right arrow' : 'Market, good pepper, A or left arrow'}>
    <Crate sauce={!!i} /><span><strong>{i ? 'Sauce' : 'Market'}</strong><small>{i ? 'With worm' : 'No worm'}</small></span><kbd>{i ? 'F →' : '← A'}</kbd>
  </button>)}</div>;
}
export default function Game({ autoStart = false, session, prefs, onSave, onEnd, onSound }: { autoStart?: boolean; session: Session; prefs: Preferences; onSave: (s: Session) => void; onEnd: (s: Session) => void; onSound: () => void }) {
  const [, refresh] = useState(0), [replay, setReplay] = useState(-1), [showReplay, setShowReplay] = useState(false);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const callbacks = useRef({ onSave, onEnd }); callbacks.current = { onSave, onEnd };
  const engineRef = useRef<Engine | null>(null);
  if (!engineRef.current) {
    const restored = structuredClone(session);
    const previousLayout = restored.environment.layoutVersion;
    if (previousLayout !== 'compact-2' && previousLayout !== 'mixed-compact-2') {
      restored.environment.previousLayoutVersion = previousLayout ?? 'original-1';
      restored.environment.layoutVersion = restored.trials.length ? 'mixed-compact-2' : 'compact-2';
    }
    engineRef.current = new Engine(restored, () => performance.now(), () => refresh(n => n + 1), s => callbacks.current.onSave(s));
    if (previousLayout !== restored.environment.layoutVersion) engineRef.current.record('presentation-change', { previousLayout: previousLayout ?? 'original-1', layoutVersion: restored.environment.layoutVersion, buildVersion: '1.1.0' });
  }
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
    if (autoStart && engine.phase === 'ready') engine.startNext();
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
      if (engine.phase !== 'sort' || !['a', 'f', 'arrowleft', 'arrowright'].includes(key)) return;
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
    setReplay(-1); setShowReplay(false); replayTimers.current.forEach(clearTimeout); replayTimers.current = [];
    engine.startNext();
  };
  const doReplay = () => {
    if (!t) return;
    setShowReplay(true);
    engine.record('replay', { guided: t.guided, afterResponse: true }); engine.save();
    replayTimers.current.forEach(clearTimeout);
    t.cells.forEach((cell, i) => { replayTimers.current.push(setTimeout(() => setReplay(cell), i * 1100)); replayTimers.current.push(setTimeout(() => setReplay(-1), i * 1100 + 850)); });
  };
  const sort = (q: Quality, m: Modality) => {
    const accepted = engine.sort(q, m);
    if (accepted && prefs.sound && session.protocol.mode !== 'assessment') tone(engine.sortFeedback === true);
  };
  useEffect(() => { if (['ready', 'interrupted', 'feedback'].includes(state.phase)) panelHeading.current?.focus({ preventScroll: true }); }, [state.phase]);
  const phaseCopy = state.phase in copy ? copy[state.phase as keyof typeof copy] : '';
  const visibleRipe = state.phase === 'cue' || (!session.protocol.centralSort && ['sort', 'sort-feedback'].includes(state.phase));
  const selected = t?.sorts.find(s => s.item === state.item)?.observed;
  const calibration = prefs.calibration?.viewport === viewportKey() ? prefs.calibration.pixelsPerCm * 16 : undefined;
  const progress = state.controller.validRounds / session.protocol.rounds;
  const isAssessment = session.protocol.mode === 'assessment';
  const smallAssessment = ['assessment', 'reconstruction'].includes(session.protocol.mode) && compactViewport();
  const sorting = ['sort', 'sort-feedback'].includes(state.phase);
  const sortOmitted = t?.sorts.find(s => s.item === state.item)?.omission;
  const phaseTitle = state.phase === 'sort-feedback' ? sortOmitted ? 'No response in time.' : isAssessment ? 'Response recorded.' : state.sortFeedback ? 'Correct.' : 'Incorrect.' : phaseCopy;
  const finishedPractice = session.protocol.mode === 'practice' && engine.willEnd && state.controller.practiceStreak >= 2;
  return <main className="game-page" data-phase={state.phase}>
    <div className="game-topline"><span className="game-mode">{modeNames[session.protocol.mode]}</span><div className="game-meta"><span>{t?.guided && session.protocol.mode !== 'practice' ? 'Guided round' : `Round ${Math.min(state.controller.validRounds + (state.phase === 'feedback' ? 0 : 1), session.protocol.rounds)} of ${session.protocol.rounds}`}</span><span>{t?.span ?? state.controller.span} plants</span></div><ActionButton className="button button-small button-outline" onClick={() => engine.interrupt('pause')} disabled={['ready', 'complete', 'interrupted'].includes(state.phase)}><Icon name="pause" size={16} /> Pause</ActionButton></div>
    <div className="session-progress" aria-label="Session progress"><span style={{ width: `${progress * 100}%` }} /></div>
    {state.phase === 'complete' ? <p role="status">Finishing session…</p> : state.phase === 'ready' ? <section className="game-intro">
      <h1 ref={panelHeading} tabIndex={-1}>Ready to play?</h1><p>Remember the plants, sort each pepper,<br />then tap the plants in order.</p>
      {session.protocol.mode === 'practice' && <p>Complete two correct rounds in a row to finish practice.</p>}
      <ActionButton className="button button-primary" onClick={start}>Start round <Icon name="arrow" /></ActionButton>
      {smallAssessment && <p className="notice">You can continue on this screen. Your viewport is saved with this visit.</p>}
      <ActionButton className="text-button" onClick={() => engine.finish()}>Finish for now</ActionButton>
    </section> : state.phase === 'interrupted' ? <section className="break-panel">
      <h1 ref={panelHeading} tabIndex={-1}>Paused</h1><p>Completed rounds are saved.<br />This round will restart with new plants.</p>
      {state.message !== 'pause' && <p className="muted">Your screen or session changed. Start again when you’re ready.</p>}
      <div className="stack-actions"><ActionButton className="button button-primary" onClick={start}>{engine.willEnd ? 'Results' : 'Restart round'} <Icon name="arrow" /></ActionButton>
        {smallAssessment && <p className="notice">You can continue on this screen. Your viewport is saved with this visit.</p>}
        {!isAssessment && <ActionButton className="button button-outline" onClick={onSound}><Icon name={prefs.sound ? 'volume' : 'mute'} /> Sound: {prefs.sound ? 'on' : 'off'}</ActionButton>}
        <details className="help-options"><summary>Help with this round</summary><ActionButton className="text-button" onClick={() => { engine.assistance(); refresh(n => n + 1); }} disabled={t?.assisted}>{t?.assisted ? 'Adult help noted' : 'Note adult help for this round'}</ActionButton></details>
        <ActionButton className="text-button" onClick={() => engine.finish()}>Finish session</ActionButton>
      </div>
    </section> : state.phase === 'feedback' ? <section className="feedback-panel">
      <h1 ref={panelHeading} tabIndex={-1}>{finishedPractice ? 'Practice complete.' : 'Round complete.'}</h1>
      {!isAssessment && <div className="feedback-measures"><span><b>{t?.score?.positionCorrect} / {t?.span}</b> memory</span><span><b>{t?.score?.sortCorrect} / {t?.span}</b> sorting</span></div>}
      {session.protocol.mode === 'practice' && !finishedPractice && <p>{state.controller.practiceStreak} of 2 correct rounds in a row.</p>}
      {state.message === 'span-increased' && <p className="notice positive">Next round: {state.controller.span} plants.</p>}
      {state.message === 'enter-guided-support' && <p className="notice">A few slower practice rounds next. They won’t count toward your score.</p>}
      {state.message === 'return-from-support' && <p className="notice positive">Ready to return to training.</p>}
      {state.message === 'support-limit' && <p className="notice">Time for a break. You can practise again next visit.</p>}
      <ActionButton className="button button-primary" onClick={start}>{engine.willEnd ? finishedPractice ? 'Continue' : 'Results' : 'Next round'} <Icon name="arrow" /></ActionButton>
      {session.protocol.mode !== 'assessment' && session.protocol.mode !== 'reconstruction' && !t?.score?.exact && <>
        <ActionButton className="text-button" onClick={doReplay}><Icon name="repeat" size={17} /> Replay order</ActionButton>
        {showReplay && <div className="replay-garden"><Garden activeCell={replay} preview /></div>}
      </>}
      <ActionButton className="text-button" onClick={() => engine.finish()}>Finish for now</ActionButton>
    </section> : t && <div className="play-area">
      <h1 className="phase-heading" aria-live="polite" aria-atomic="true">{phaseTitle}</h1>
      <div className="garden-stage"><div className="stage-surface" style={calibration ? { '--garden-size': `${calibration}px` } as CSSProperties : undefined}>
        <Garden activeCell={visibleRipe ? t.cells[state.item] : -1} quality={t.qualities[state.item]} onSelect={(cell, m) => engine.recall(cell, m)} recall={state.phase === 'recall'} />
        {session.protocol.centralSort && sorting && <div className="sorting-overlay"><div className="sorting-card"><span role="img" aria-label={t.qualities[state.item] === 'worm' ? 'Ripe yellow pepper with a worm' : 'Ripe yellow pepper without a worm'} className="sorting-pepper"><Pepper ripe quality={t.qualities[state.item]} /></span></div></div>}
        {state.phase === 'retention' && <div className="retention-overlay"><Barn /><div className="retention-count">{Math.ceil(state.remainingMs / 1000)}<small>seconds</small></div></div>}
      </div></div>
      <div className="phase-counter">{state.phase === 'recall' ? <><span role="status">{t.recalls.length} of {t.span} picked</span><span aria-label="Time remaining">{Math.ceil(state.remainingMs / 1000)}s left</span></> : state.phase === 'retention' ? <span>Wait for the garden.</span> : <span>Pepper {state.item + 1} of {t.span}</span>}</div>
      <BasketButtons onSort={sort} disabled={state.phase !== 'sort' || !!selected} selected={sorting ? selected : null} hint={!isAssessment && state.phase === 'sort-feedback' && state.sortFeedback === false && !sortOmitted ? t.qualities[state.item] : null} />
    </div>}
  </main>;
}
