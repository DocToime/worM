import { useCallback, useEffect, useRef, useState } from 'react';
import type { Mode, Preferences, Profile, Session } from './core/types';
import { compactViewport, defaults, modeNames, oppositeTheme, protocolFor, resolveTheme, storedTheme, THEME_COLOR_DARK, THEME_COLOR_LIGHT, viewportKey } from './core/protocol';
import { createSession } from './core/engine';
import { deleteProfile, loadData, newProfile, savePreferences, saveProfile, saveSession, setActiveProfile } from './data/storage';
import { Icon, Pepper } from './components/Art';
import { Garden } from './components/Garden';
import Game from './components/Game';
import Tutorial from './components/Tutorial';
import Results, { History } from './components/Results';
import Settings from './components/Settings';

type Screen = 'home' | 'tutorial' | 'game' | 'results' | 'history' | 'settings';
type InstallPrompt = Event & { prompt: () => Promise<void> };
function displayMode() {
  if (matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)) return 'standalone';
  if (matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
  if (matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
  return 'browser';
}
export default function App() {
  const [screen, setScreen] = useState<Screen>('home'), [mode, setMode] = useState<Mode>('training');
  const [profiles, setProfiles] = useState<Profile[]>([]), [activeId, setActiveId] = useState(''), [prefs, setPrefs] = useState<Preferences>(() => ({ ...defaults, theme: storedTheme() })), [sessions, setSessions] = useState<Session[]>([]), [current, setCurrent] = useState<Session | null>(null);
  const [autoStart, setAutoStart] = useState(false);
  const [compactScreen, setCompactScreen] = useState(compactViewport());
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const [loading, setLoading] = useState(true), [storageState, setStorageState] = useState<'saved' | 'saving' | 'error'>('saved'), [notice, setNotice] = useState('');
  const [needRefresh, setNeedRefresh] = useState(false), [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  useEffect(() => { const resize = () => setCompactScreen(compactViewport()); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
  useEffect(() => {
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    let cancelled = false, unsub = () => {};
    void import('./pwa').then(mod => { if (!cancelled) unsub = mod.subscribeNeedRefresh(setNeedRefresh); });
    return () => { cancelled = true; unsub(); };
  }, []);
  const revision = useRef(0), destination = useRef<Mode>('training');
  useEffect(() => { loadData().then(data => { setProfiles(data.profiles); setActiveId(data.activeId); setPrefs(data.prefs); try { localStorage.setItem('worm-theme', data.prefs.theme); } catch { /* private mode */ } setSessions(data.sessions); }).catch(() => { const p = newProfile(); setProfiles([p]); setActiveId(p.id); setStorageState('error'); }).finally(() => setLoading(false)); }, []);
  useEffect(() => { document.documentElement.dataset.reducedMotion = String(prefs.reducedMotion); }, [prefs.reducedMotion]);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      setSystemDark(mq.matches);
      const resolved = resolveTheme(prefs.theme, mq.matches);
      document.documentElement.dataset.theme = resolved;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', resolved === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT);
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [prefs.theme]);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  const persist = useCallback((s: Session) => {
    const rev = ++revision.current; setStorageState(old => old === 'error' ? old : 'saving');
    setSessions(rows => [...rows.filter(row => row.id !== s.id), s]);
    void saveSession(s).then(() => { if (revision.current === rev) setStorageState('saved'); }).catch(() => setStorageState('error'));
  }, []);
  const updatePrefs = (p: Preferences) => { setPrefs(p); try { localStorage.setItem('worm-theme', p.theme); } catch { /* private mode */ } void savePreferences(p).catch(() => setStorageState('error')); };
  const profile = profiles.find(p => p.id === activeId) ?? profiles[0];
  const ownSessions = sessions.filter(s => s.participantId === activeId);
  const active = ownSessions.find(s => s.status === 'active');
  const navigate = (to: Screen) => { setNotice(''); if (to === 'home') setMode('training'); setScreen(to); };
  const launch = (m: Mode, startImmediately = true) => {
    if (active) { setAutoStart(false); setCurrent(active); setScreen('game'); return; }
    const session = createSession(activeId, protocolFor(m, prefs), {
      userAgent: navigator.userAgent, language: navigator.language,
      viewport: { width: innerWidth, height: innerHeight }, pixelRatio: devicePixelRatio,
      orientation: innerWidth > innerHeight ? 'landscape' : 'portrait',
      calibration: prefs.calibration?.viewport === viewportKey() ? prefs.calibration : null,
      sound: m === 'assessment' ? false : prefs.sound,
      reducedMotion: prefs.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches,
      layoutVersion: 'compact-2', displayMode: displayMode(),
      inputMapping: { good: ['A', 'ArrowLeft'], worm: ['F', 'ArrowRight'], recall: 'pointerdown or arrow-key navigation with Enter/Space' },
    });
    setAutoStart(startImmediately); setCurrent(session); persist(session); setScreen('game');
  };
  const begin = (selected: Mode = mode) => {
    destination.current = selected;
    if (active) { setAutoStart(false); setCurrent(active); setScreen('game'); return; }
    if (!profile.learned) setScreen('tutorial'); else launch(selected);
  };
  const ended = (s: Session) => {
    persist(s); setCurrent(s);
    if (s.endReason === 'practice-passed') {
      const learned = { ...profile, learned: true }; setProfiles(rows => rows.map(p => p.id === learned.id ? learned : p));
      void saveProfile(learned).catch(() => setStorageState('error'));
    }
    if (!s.trials.length) { navigate('home'); return; }
    setScreen('results');
  };
  if (loading || !profile) return <div className="loading-screen"><Icon name="sprout" size={40} /><p>Opening your garden…</p></div>;
  const displayedMode = active?.protocol.mode ?? mode;
  const selectedProtocol = active?.protocol ?? protocolFor(displayedMode, prefs);
  const startLabel = active ? `Resume ${modeNames[displayedMode].toLowerCase()}` : mode === 'assessment' ? 'Start check-in' : 'Start training';
  const resolvedTheme = resolveTheme(prefs.theme, systemDark);
  return <div className={`app-shell ${screen === 'game' ? 'playing' : ''}`}>
    <header className="site-header">
      <button className="brand" disabled={screen === 'game'} onClick={() => navigate('home')} aria-label="WorM home"><span className="brand-icon"><Pepper ripe /></span><span>WorM</span></button>
      {screen !== 'game' && <nav aria-label="Main navigation">
        <button className={screen === 'home' ? 'nav-active' : ''} onClick={() => navigate('home')}><Icon name="leaf" size={17} /><span>Play</span></button>
        <button className={screen === 'history' ? 'nav-active' : ''} onClick={() => navigate('history')}><Icon name="chart" size={17} /><span>Progress</span></button>
        <button className={screen === 'settings' ? 'nav-active' : ''} onClick={() => navigate('settings')}><Icon name="settings" size={17} /><span>Settings</span></button>
      </nav>}
      <div className="header-end">
        <button type="button" className="theme-toggle" aria-pressed={resolvedTheme === 'dark'} aria-label={resolvedTheme === 'dark' ? 'Switch to ivory garden' : 'Switch to dusk garden'} onClick={() => updatePrefs({ ...prefs, theme: oppositeTheme(resolvedTheme) })}><Icon name={resolvedTheme === 'dark' ? 'moon' : 'sun'} size={18} /></button>
        <span className="profile-chip" title={profile.name}><span>{profile.name.slice(0, 1).toUpperCase()}</span>{profile.name}</span>
      </div>
    </header>
    {storageState === 'error' && <div className="storage-warning" role="alert">Not saved. Keep this tab open and download your session from Results.</div>}
    {needRefresh && screen !== 'game' && !active && <div className="storage-warning" role="status">A garden update is ready. <button className="text-button" onClick={() => { void import('./pwa').then(mod => mod.applyPwaUpdate()); }}>Update now</button></div>}
    {screen === 'home' && <main className="home-page page-enter">
      <section className="home-hero">
        <div className="hero-copy"><span className="eyebrow">The memory garden</span><h1>A little garden.<br />A <em>growing</em> memory.</h1>
          <p>Remember the plants, sort each pepper,<br className="desktop-break" /> then tap the plants in order.</p>
          {active ? <p className="resume-note">Continue your {modeNames[displayedMode].toLowerCase()} session.</p> : <>
            <div className="mode-selector" role="group" aria-label="Session mode">
              <button aria-pressed={mode === 'training'} className={mode === 'training' ? 'selected' : ''} onClick={() => setMode('training')}><Icon name="sprout" size={18} /> Daily training</button>
              <button aria-pressed={mode === 'assessment'} aria-describedby={mode === 'assessment' && compactScreen ? 'screen-hint' : undefined} className={mode === 'assessment' ? 'selected' : ''} onClick={() => setMode('assessment')}><Icon name="chart" size={18} /> Memory check-in</button>
            </div>
            {mode === 'assessment' && compactScreen && <p className="screen-hint" id="screen-hint">You can continue on this screen. This visit is saved with your screen size and isn’t mixed with larger-screen scores.</p>}
          </>}
          <p className="mode-description">{displayedMode === 'assessment' ? 'Fixed difficulty for comparing visits.' : displayedMode === 'reconstruction' ? 'Original-style rules with gated levels.' : displayedMode === 'practice' ? 'Practise sorting and remembering.' : 'Difficulty adjusts as you play.'}</p>
          <button className="button button-primary hero-cta" onClick={() => begin()}>{startLabel}<Icon name="arrow" /></button>
          <p className="hero-meta"><Icon name="clock" size={15} /> {selectedProtocol.rounds} rounds · up to {selectedProtocol.maxMinutes} minutes</p>
          {!profile.learned && !active && <p className="first-visit">First time? Start with a short practice.</p>}
          {!active && <button className="text-button" onClick={() => { destination.current = 'training'; navigate('tutorial'); }}>How to play <Icon name="arrow" size={16} /></button>}
          {notice && <p className="notice" role="status">{notice}</p>}
        </div>
        <div className="hero-illustration" aria-hidden="true"><Garden preview activeCell={4} /></div>
      </section>
      {!active && <details className="advanced-mode"><summary>Original-style protocol</summary><p>Up to 15 rounds · up to 20 minutes. A 15-second delay and progression after 3 of 5 successful rounds.</p><button className="text-button" onClick={() => begin('reconstruction')}>Start original-style protocol <Icon name="arrow" size={16} /></button>{compactScreen && <p className="screen-hint">You can continue on this screen. This visit is saved with your screen size and isn’t mixed with larger-screen scores.</p>}</details>}
    </main>}
    {screen === 'tutorial' && <Tutorial onPractice={() => launch('practice')} onBack={() => navigate('home')} />}
    {screen === 'game' && current && <Game autoStart={autoStart} key={current.id} session={current} prefs={prefs} onSave={persist} onEnd={ended} onSound={() => updatePrefs({ ...prefs, sound: !prefs.sound })} />}
    {screen === 'results' && current && <Results session={current} profile={profile} onHome={() => navigate('home')} practicePassed={current.endReason === 'practice-passed'} onAgain={() => launch(current.protocol.mode === 'practice' ? current.endReason === 'practice-passed' ? destination.current : 'practice' : current.protocol.mode)} />}
    {screen === 'history' && <History sessions={sessions} profile={profile} onView={s => { destination.current = 'training'; setCurrent(s); navigate('results'); }} onStart={() => navigate('home')} />}
    {screen === 'settings' && <Settings prefs={prefs} profiles={profiles} activeId={activeId} installPrompt={installPrompt} onInstall={() => setInstallPrompt(null)} onPrefs={updatePrefs} onClose={() => navigate('home')} onProfile={id => { setActiveId(id); setCurrent(null); void setActiveProfile(id).catch(() => setStorageState('error')); }} onAdd={name => { const p = newProfile(name); setProfiles(rows => [...rows, p]); setActiveId(p.id); setCurrent(null); void Promise.all([saveProfile(p), setActiveProfile(p.id)]).catch(() => setStorageState('error')); }} onRename={name => { const p = { ...profile, name }; setProfiles(rows => rows.map(row => row.id === p.id ? p : row)); void saveProfile(p).catch(() => setStorageState('error')); }} onDelete={id => { void deleteProfile(id).then(async () => { let remaining = profiles.filter(p => p.id !== id); if (!remaining.length) { const fresh = newProfile(); await saveProfile(fresh); remaining = [fresh]; } setProfiles(remaining); setSessions(rows => rows.filter(s => s.participantId !== id)); setActiveId(remaining[0].id); setCurrent(null); await setActiveProfile(remaining[0].id); setNotice('Gardener and associated local sessions deleted. This cannot be undone.'); setScreen('home'); }).catch(() => setStorageState('error')); }} />}
    {screen !== 'game' && <footer className="site-footer"><span className={`save-indicator ${storageState}`}><span className="tiny-dot" />{storageState === 'saved' ? 'Saved on this device' : storageState === 'saving' ? 'Saving…' : 'Not saved · export a backup'}</span><span>WorM · The memory garden</span></footer>}
  </div>;
}
