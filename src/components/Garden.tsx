import { Plant } from './Art';
import type { Modality, Quality } from '../core/types';
export function Garden({ activeCell = -1, quality = 'good', onSelect, recall = false, preview = false, guidedCells, size }: {
  activeCell?: number; quality?: Quality; onSelect?: (cell: number, modality: Modality) => void;
  recall?: boolean; preview?: boolean; guidedCells?: number[]; size?: number;
}) {
  return <div className={`garden ${preview ? 'garden-preview' : ''} ${recall ? 'garden-recall' : ''}`} style={size ? { width: `min(100%, ${size}px)` } : undefined} role="group" aria-label="Garden with nine pepper plants" data-testid="garden">
    {Array.from({ length: 9 }, (_, i) => <button type="button" key={i} className="plant-cell" data-cell={i} data-ripe={activeCell === i} aria-label={`Plant, row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}${activeCell === i ? ', ripe' : ''}`} tabIndex={preview ? -1 : 0} aria-disabled={!recall && !preview} onPointerDown={e => { if (e.button === 0) { e.preventDefault(); onSelect?.(i, e.pointerType as Modality); } }} onClick={e => { if (e.detail === 0) onSelect?.(i, 'keyboard'); }}>
      <Plant ripe={activeCell === i} quality={quality} />
      {guidedCells?.includes(i) && <span className="guided-number">{guidedCells.indexOf(i) + 1}</span>}
    </button>)}
  </div>;
}
