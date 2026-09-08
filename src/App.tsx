import { useCallback, useEffect, useRef, useState } from 'react';
import type { Mode, Preferences, Profile, Session } from './core/types';
import { defaults, modeNames, protocolFor, viewportKey } from './core/protocol';
import { createSession } from './core/engine';
import { summarize } from './core/scoring';
import { deleteProfile, loadData, newProfile, savePreferences, saveProfile, saveSession, setActiveProfile } from './data/storage';
import { Icon, Pepper } from './components/Art';
import { Garden } from './components/Garden';
import Game from './components/Game';
import Tutorial from './components/Tutorial';
import Results, { History } from './components/Results';
import Settings from './components/Settings';

type Screen = 'home' | 'tutorial' | 'game' | 'results' | 'history' | 'settings';
export default function App() {
  const [screen, setScreen] = useState<Screen>('home'), [mode, setMode] = useState<Mode>('training');
  const [profiles, setProfiles] = useState<Profile[]>([]), [activeId, setActiveId] = useState(''), [prefs, setPrefs] = useState<Preferences>(defaults), [sessions, setSessions] = useState<Session[]>([]), [current, setCurrent] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true), [storageState, setStorageState] = useState<'saved' | 'saving' | 'error'>('saved'), [notice, setNotice] = useState('');
  const revision = useRef(0), destination = useRef<Mode>('training');
  useEffect(() => { loadData().then(data => { setProfiles(data.profiles); setActiveId(data.activeId); setPrefs(data.prefs); setSessions(data.sessions); }).catch(() => { const p = newProfile(); setProfiles([p]); setActiveId(p.id); setStorageState('error'); }).finally(() => setLoading(false)); }, []);
  useEffect(() => { document.documentElement.dataset.reducedMotion = String(prefs.reducedMotion); }, [prefs.reducedMotion]);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  const persist = useCallback((s: Session) => {
    const rev = ++revision.current; setStorageState(old => old === 'error' ? old : 'saving');
    setSessions(rows => [...rows.filter(row => row.id !== s.id), s]);
    void saveSession(s).then(() => { if (revision.current === rev) setStorageState('saved'); }).catch(() => setStorageState('error'));
  }, []);
  const updatePrefs = (p: Preferences) => { setPrefs(p); void savePreferences(p).catch(() => setStorageState('error')); };
  const profile = profiles.find(p => p.id === activeId) ?? profiles[0];
  const ownSessions = sessions.filter(s => s.participantId === activeId);
  const active = ownSessions.find(s => s.status === 'active');
  const navigate = (to: Screen) => { setNotice(''); setScreen(to); };
  const launch = (m: Mode) => {
    if (['assessment', 'reconstruction'].includes(m) && (innerWidth < 700 || innerHeight < 600)) { setNotice('Memory check-ins need a tablet or computer with a viewport of at least 700 × 600 pixels. Daily training works on this screen.'); setScreen('home'); return; }
    if (active) { setCurrent(active); setScreen('game'); return; }
    const session = createSession(activeId, protocolFor(m, prefs), {
      userAgent: navigator.userAgent, language: navigator.language,
      viewport: { width: innerWidth, height: innerHeight }, pixelRatio: devicePixelRatio,
      orientation: innerWidth > innerHeight ? 'landscape' : 'portrait',
      calibration: prefs.calibration?.viewport === viewportKey() ? prefs.calibration : null,
      sound: m === 'assessment' ? false : prefs.sound,
      reducedMotion: prefs.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches,
      inputMapping: { good: ['A', 'ArrowLeft'], worm: ['F', 'ArrowRight'], recall: 'pointerdown or focused keyboard activation' },
    });
    setCurrent(session); persist(session); setScreen('game');
  };
  const begin = () => {
    destination.current = mode;
    if (active) { setCurrent(active); setScreen('game'); return; }
    if (!profile.learned) setScreen('tutorial'); else launch(mode);
  };
  const ended = (s: Session) => {
    persist(s); setCurrent(s);
    if (s.endReason === 'practice-passed') {
      const learned = { ...profile, learned: true }; setProfiles(rows => rows.map(p => p.id === learned.id ? learned : p));
      void saveProfile(learned).catch(() => setStorageState('error'));
    }
    setScreen('results');
  };
  if (loading || !profile) return <div className="loading-screen"><Icon name="sprout" size={40} /><p>Opening your garden…</p></div>;
  const validSessions = ownSessions.filter(s => s.status !== 'active' && s.protocol.mode !== 'practice');
  const harvests = validSessions.reduce((n, s) => n + summarize(s).rounds, 0);
  const best = Math.max(0, ...validSessions.map(s => summarize(s).bestSpan ?? 0));
  return <div className="app-shell"><header className="site-header"><button className="brand" onClick={() => { if (screen !== 'game') navigate('home'); }} aria-label="WorM home"><span className="brand-icon"><Pepper ripe /></span><span>WorM<span className="brand-caption">a growing memory</span></span></button>{screen !== 'game' && <nav aria-label="Main navigation"><button className={screen === 'home' ? 'nav-active' : ''} onClick={() => navigate('home')}><Icon name="leaf" size={17} /><span>My garden</span></button><button className={screen === 'history' ? 'nav-active' : ''} onClick={() => navigate('history')}><Icon name="chart" size={17} /><span>My progress</span></button><button className={screen === 'settings' ? 'nav-active' : ''} onClick={() => navigate('settings')}><Icon name="settings" size={17} /><span>Settings</span></button></nav>}<span className="profile-chip"><span>{profile.name.slice(0, 1).toUpperCase()}</span>{profile.name}</span></header>
    {storageState === 'error' && <div className="storage-warning" role="alert">Your browser couldn’t save this visit. You can keep playing, then download your session from the results screen. Keep that backup before closing this tab.</div>}
    {screen === 'home' && <main className="home-page page-enter">
      <div className="welcome-line"><span><Icon name="sun" size={18} /> A fresh day in the garden</span><span>Take a breath. Make a little progress.</span></div>
      <section className="home-hero"><div className="hero-copy"><span className="eyebrow">A mindful workout for your working memory</span><h1>A little garden.<br />A <em>growing</em> memory.</h1><p>Watch the peppers ripen. Find them a good home.<br className="desktop-break" /> Remember the little journey along the way.</p>
        <div className="mode-selector" role="group" aria-label="Session mode"><button aria-pressed={mode === 'training'} className={mode === 'training' ? 'selected' : ''} onClick={() => setMode('training')}><Icon name="sprout" size={18} /> Daily training</button><button aria-pressed={mode === 'assessment'} className={mode === 'assessment' ? 'selected' : ''} onClick={() => setMode('assessment')}><Icon name="chart" size={18} /> Memory check-in</button></div>
        <p className="mode-description">{mode === 'assessment' ? 'A consistent 15-round snapshot. The same settings every visit.' : mode === 'reconstruction' ? 'The original-style task: longer retention and gated levels.' : 'A challenge that grows with you, one harvest at a time.'}</p>
        <button className="button button-primary hero-cta" onClick={begin}>{active ? 'Return to my harvest' : 'Start my harvest'} <Icon name="arrow" /></button>
        <div className="hero-meta"><span><Icon name="clock" size={15} /> {mode === 'assessment' ? 'About 10–12 minutes' : `${prefs.rounds} rounds · up to 10 minutes`}</span><span className="tiny-dot" /><span>No rush. Just a little focus.</span></div>
        {!profile.learned && <p className="first-visit">First visit? We’ll show you around before you begin.</p>}
        {notice && <p className="notice" role="status">{notice}</p>}
      </div><div className="hero-illustration"><div className="garden-label"><span className="tiny-dot" /> THE MEMORY GARDEN <span>EST. TODAY</span></div><div className="hero-garden-frame"><Garden preview activeCell={4} /></div><div className="garden-caption"><Icon name="leaf" size={16} /><span>Good things grow with a little attention.</span><span className="caption-flourish">✳</span></div><div className="floating-note"><span>9 little plants.</span><span>So many possibilities.</span><svg viewBox="0 0 70 40" aria-hidden="true"><path d="M3 5q40 0 54 26m-15-6 17 8-4-16" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></div></div></section>
      <section className="home-stats" aria-label="Your garden at a glance"><div><span className="stat-icon"><Icon name="sun" /></span><span><strong>{validSessions.length || 'Your first'} <small>{validSessions.length ? 'visits' : 'visit awaits'}</small></strong><p>A few moments, just for you</p></span></div><div><span className="stat-icon"><Icon name="leaf" /></span><span><strong>{harvests || '—'} <small>harvests completed</small></strong><p>Every round is a little practice</p></span></div><div><span className="stat-icon"><Icon name="sprout" /></span><span><strong>{best || '—'} <small>plants remembered</small></strong><p>Your longest perfect sequence</p></span></div></section>
      <section className="how-section"><div className="how-heading"><div><span className="eyebrow">Simple to learn. Room to grow.</span><h2>Your harvest, in three little steps.</h2></div><button className="text-button" onClick={() => { destination.current = mode; navigate('tutorial'); }}>Show me how <Icon name="arrow" size={18} /></button></div><div className="steps-grid"><article><span className="step-number">01</span><div><h3>Watch it ripen.</h3><p>A pepper turns yellow. Remember its place in the garden.</p></div><span className="step-art"><Pepper ripe /></span></article><article><span className="step-number">02</span><div><h3>Give it a good home.</h3><p>Fresh peppers go to market. Wormy ones become sauce.</p></div><span className="step-art"><Pepper ripe quality="worm" /></span></article><article><span className="step-number">03</span><div><h3>Remember the order.</h3><p>After a short pause, pick the plants in the order they ripened.</p></div><span className="step-grid">{Array.from({ length: 9 }, (_, i) => <i key={i} />)}</span></article></div></section>
      <div className="home-bottom"><span><Icon name="leaf" size={17} /> Nothing wasted. A little something gained.</span><details className="advanced-mode"><summary>Looking for the original-style task?</summary><p>Fifteen-second retention, no worms at level one, and progression after 3 of 5 successful rounds.</p><button className="text-button" onClick={() => { setMode('reconstruction'); destination.current = 'reconstruction'; if (profile.learned) launch('reconstruction'); else setScreen('tutorial'); }}>Start original-style protocol →</button></details></div>
    </main>}
    {screen === 'tutorial' && <Tutorial onPractice={() => launch('practice')} onBack={() => navigate('home')} />}
    {screen === 'game' && current && <Game key={current.id} session={current} prefs={prefs} onSave={persist} onEnd={ended} onSound={() => updatePrefs({ ...prefs, sound: !prefs.sound })} />}
    {screen === 'results' && current && <Results session={current} profile={profile} onHome={() => navigate('home')} practicePassed={current.endReason === 'practice-passed'} onAgain={() => launch(current.protocol.mode === 'practice' ? current.endReason === 'practice-passed' ? destination.current : 'practice' : current.protocol.mode)} />}
    {screen === 'history' && <History sessions={sessions} profile={profile} onView={s => { setCurrent(s); navigate('results'); }} onStart={() => navigate('home')} />}
    {screen === 'settings' && <Settings prefs={prefs} profiles={profiles} activeId={activeId} onPrefs={updatePrefs} onClose={() => navigate('home')} onProfile={id => { setActiveId(id); setCurrent(null); void setActiveProfile(id).catch(() => setStorageState('error')); }} onAdd={name => { const p = newProfile(name); setProfiles(rows => [...rows, p]); setActiveId(p.id); setCurrent(null); void Promise.all([saveProfile(p), setActiveProfile(p.id)]).catch(() => setStorageState('error')); }} onRename={name => { const p = { ...profile, name }; setProfiles(rows => rows.map(row => row.id === p.id ? p : row)); void saveProfile(p).catch(() => setStorageState('error')); }} onDelete={id => { void deleteProfile(id).then(async () => { let remaining = profiles.filter(p => p.id !== id); if (!remaining.length) { const fresh = newProfile(); await saveProfile(fresh); remaining = [fresh]; } setProfiles(remaining); setSessions(rows => rows.filter(s => s.participantId !== id)); setActiveId(remaining[0].id); setCurrent(null); await setActiveProfile(remaining[0].id); setNotice('Gardener and associated local sessions deleted. This cannot be undone.'); setScreen('home'); }).catch(() => setStorageState('error')); }} />}
    <footer className="site-footer"><span>Made for a little everyday growth.</span><span className={`save-indicator ${storageState}`}><span className="tiny-dot" />{storageState === 'saved' ? 'Saved on this device' : storageState === 'saving' ? 'Saving your garden…' : 'Not saved · export a backup'}</span><span>WorM · The memory garden</span></footer>
  </div>;
}
