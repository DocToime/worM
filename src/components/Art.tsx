import { useId } from 'react';
import type { Quality } from '../core/types';
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    leaf: <><path d="M19 4C8 2 2 8 6 15c7 5 14-1 13-11Z" /><path d="m5 20 9-11" /></>,
    chart: <><path d="M4 4v16h16M8 15l4-5 4 2 4-7" /></>,
    settings: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" /><circle cx="15" cy="17" r="3" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
    moon: <path d="M20 15a8 8 0 1 1-8-11 6.5 6.5 0 0 0 8 11Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
    check: <path d="m5 12 5 5L20 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    pause: <path d="M8 5v14M16 5v14" />,
    volume: <><path d="m4 9 4 0 5-4v14l-5-4H4ZM17 8q5 4 0 8" /></>,
    mute: <><path d="m4 9 4 0 5-4v14l-5-4H4ZM17 9l5 6m0-6-5 6" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.1" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></>,
    home: <><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8" /></>,
    repeat: <><path d="M20 8a8 8 0 1 0 0 8M20 3v6h-6" /></>,
    sprout: <><path d="M12 21V10M12 14C3 14 3 7 3 7s9-2 9 7ZM12 10c0-7 9-7 9-7s0 9-9 9" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.leaf}</svg>;
}
export function Pepper({ ripe = false, quality = 'good', className = '' }: { ripe?: boolean; quality?: Quality; className?: string }) {
  const id = useId().replaceAll(':', '');
  return <svg className={className} viewBox="0 0 100 110" fill="none" aria-hidden="true">
    <defs><linearGradient id={id} x1="22" y1="35" x2="79" y2="101" gradientUnits="userSpaceOnUse"><stop stopColor={ripe ? '#f9d96f' : '#8fac62'} /><stop offset="1" stopColor={ripe ? '#e6a92f' : '#527d49'} /></linearGradient></defs>
    <path d="M48 35C23 16 11 42 18 71c4 17 11 28 23 24 7-2 9-2 16 0 14 3 25-16 28-36 4-28-18-39-37-24Z" fill={`url(#${id})`} stroke={ripe ? '#cc952c' : '#466d3d'} strokeWidth="2" />
    <path d="M45 40c-6 14-8 31-2 48M58 40c7 15 8 33 2 48" stroke={ripe ? '#d3a33d' : '#456e3c'} strokeWidth="2" opacity=".45" />
    <path d="M30 44c-4 5-4 13-3 18" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".35" />
    <path d="M48 35c-3-15 5-24 16-24" stroke="#3d653d" strokeWidth="7" strokeLinecap="round" />
    <path d="m34 31 14 2 14-2-9 9-7-3-9 3Z" fill="#42683b" />
    {ripe && quality === 'worm' && <g><ellipse cx="73" cy="60" rx="9" ry="8" fill="#a36e2e" /><path d="M73 62c17 8 23-1 16-10s-6-14 1-18" stroke="#ae6567" strokeWidth="13" strokeLinecap="round" /><path d="M73 60c17 8 23-1 16-10s-6-14 1-18" stroke="#e8a1a1" strokeWidth="10" strokeLinecap="round" /><circle cx="89" cy="32" r="8" fill="#ecb1ad" /><circle cx="87" cy="30" r="1.4" fill="#493e35" /><circle cx="93" cy="30" r="1.4" fill="#493e35" /><path d="M88 34q2 3 4 0" stroke="#88534d" strokeWidth="1.2" /></g>}
  </svg>;
}
export function Plant({ ripe = false, quality = 'good', halo = true }: { ripe?: boolean; quality?: Quality; halo?: boolean }) {
  return <svg viewBox="0 0 150 160" className={`plant-art ${ripe ? 'ripe' : ''}`} aria-hidden="true">
    {ripe && halo && <><circle cx="75" cy="80" r="61" fill="#f5d974" opacity=".25" /><path d="m121 25 2 7 7 2-7 2-2 7-2-7-7-2 7-2ZM22 58l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#ffe899" /></>}
    <ellipse cx="75" cy="141" rx="38" ry="9" fill="#624b31" opacity=".2" />
    <path d="M75 138V35" fill="none" stroke="#47653a" strokeWidth="5" strokeLinecap="round" />
    <path d="M73 102C39 106 22 85 28 70c24-3 42 10 45 32Z" fill="#6a8b4f" /><path d="M76 82c35 1 53-20 47-36-26-1-42 12-47 36Z" fill="#6f9455" />
    <path d="M75 57C51 62 35 44 42 31c21-1 33 12 33 26Z" fill="#7b9b60" /><path d="M78 49c-3-26 12-39 24-33 3 21-9 30-24 33Z" fill="#84a468" />
    <path d="m75 105-37-25m39 1 36-25M75 59 49 38" fill="none" stroke="#527444" strokeWidth="1.5" />
    <svg x="40" y="50" width="79" height="87" viewBox="0 0 100 110"><Pepper ripe={ripe} quality={quality} /></svg>
  </svg>;
}
export function Crate({ sauce = false }: { sauce?: boolean }) {
  return <svg viewBox="0 0 120 100" className="crate-art" aria-hidden="true">
    {sauce ? <><rect x="33" y="26" width="55" height="62" rx="12" fill="#c8754b" /><rect x="30" y="18" width="61" height="14" rx="5" fill="#7e9270" /><path d="M40 23h41" stroke="#a6b894" strokeWidth="2" /><rect x="39" y="43" width="43" height="30" rx="5" fill="#fff1cc" /><path d="M60 49c-12-8-17 16-6 19h10c12-7 7-26-4-19Z" fill="#e6b644" /><path d="M60 50v-7" stroke="#507345" strokeWidth="3" /><path d="M38 35v43" stroke="#edb496" strokeWidth="3" opacity=".5" /></> : <><svg x="15" y="-4" width="55" height="65"><Pepper ripe /></svg><svg x="54" y="-3" width="48" height="60"><Pepper ripe /></svg><path d="M15 47h91l-8 41H23Z" fill="#b18459" /><path d="M17 50h86M20 65h81M23 81h77" stroke="#dab487" strokeWidth="10" /><path d="M30 46v42M89 46v42" stroke="#a2774f" strokeWidth="6" /><path d="M49 58h23" stroke="#80613f" strokeWidth="5" strokeLinecap="round" /></>}
  </svg>;
}
export function Barn() {
  return <svg className="barn-art" viewBox="0 0 300 260" aria-hidden="true"><path d="m28 95 122-76 122 76v147H28Z" fill="#b67556" /><path d="m18 98 132-83 132 83" fill="none" stroke="#eed9b7" strokeWidth="12" strokeLinejoin="round" /><path d="M66 116h168v126H66Z" fill="#935b45" stroke="#efd5ad" strokeWidth="7" /><path d="M150 118v124M69 122l77 116m83-116-75 116" stroke="#e5bd94" strokeWidth="6" /><path d="M84 121v104M106 121v77m89-77v78m23-78v104" stroke="#a66a4e" strokeWidth="2" /><rect x="127" y="61" width="46" height="31" rx="2" fill="#f0d4a5" /><path d="M150 61v31" stroke="#ad7754" strokeWidth="4" /><circle cx="139" cy="174" r="3" fill="#f4dfbd" /><circle cx="161" cy="174" r="3" fill="#f4dfbd" /></svg>;
}
