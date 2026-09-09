import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Plant } from './Art';
import type { Modality, Quality } from '../core/types';

export function Garden({ activeCell = -1, quality = 'good', onSelect, recall = false, preview = false, guidedCells, size }: {
  activeCell?: number; quality?: Quality; onSelect?: (cell: number, modality: Modality) => void;
  recall?: boolean; preview?: boolean; guidedCells?: number[]; size?: number;
}) {
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedCell, setFocusedCell] = useState(0);
  useEffect(() => {
    if (recall) { setFocusedCell(0); cells.current[0]?.focus({ preventScroll: true }); }
  }, [recall]);
  return <div className={`garden ${preview ? 'garden-preview' : ''} ${recall ? 'garden-recall' : ''}`} style={size ? { '--garden-size': `${size}px` } as CSSProperties : undefined} role="group" aria-label="Garden with nine pepper plants" data-testid="garden">
    {Array.from({ length: 9 }, (_, i) => <button type="button" key={i} ref={el => { cells.current[i] = el; }} className="plant-cell" data-cell={i} data-ripe={activeCell === i}
      aria-label={`Plant, row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}${activeCell === i ? ', ripe' : ''}`}
      disabled={!recall} tabIndex={recall && focusedCell === i ? 0 : -1}
      onFocus={() => setFocusedCell(i)}
      onKeyDown={e => {
        if (e.repeat && ['Enter', ' '].includes(e.key)) { e.preventDefault(); return; }
        const row = Math.floor(i / 3), column = i % 3;
        const next = { ArrowLeft: row * 3 + Math.max(0, column - 1), ArrowRight: row * 3 + Math.min(2, column + 1), ArrowUp: Math.max(0, row - 1) * 3 + column, ArrowDown: Math.min(2, row + 1) * 3 + column }[e.key];
        if (next !== undefined) { e.preventDefault(); e.stopPropagation(); setFocusedCell(next); cells.current[next]?.focus({ preventScroll: true }); }
      }}
      onPointerDown={e => { if (e.button === 0 && recall) { e.preventDefault(); setFocusedCell(i); e.currentTarget.focus({ preventScroll: true }); onSelect?.(i, e.pointerType as Modality); } }}
      onClick={e => { if (e.detail === 0 && recall) onSelect?.(i, 'keyboard'); }}>
      <Plant ripe={activeCell === i} quality={quality} />
      {guidedCells?.includes(i) && <span className="guided-number">{guidedCells.indexOf(i) + 1}</span>}
    </button>)}
  </div>;
}
