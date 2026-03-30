import { useState, useEffect } from 'react';
import { PROTEINS } from '../constants.js';
import { weekShort } from '../utils.js';
import { haptic } from '../utils.js';
import { useT } from '../LangContext.jsx';

export function QtyBox({ value, placeholder, color, onChange }) {
  const [ed, setEd] = useState(false);
  if (ed) return (
    <input autoFocus value={value} onChange={e => onChange(e.target.value)}
      onBlur={() => setEd(false)}
      onKeyDown={e => e.key === "Enter" && setEd(false)}
      style={{ width: 62, fontSize: 12, padding: "3px 5px", borderRadius: 6, textAlign: "center", border: `1.5px solid ${color}` }}/>
  );
  return (
    <div className={`qb${value ? " has" : ""}`} style={value ? { borderColor: color } : {}}
      onClick={e => { e.stopPropagation(); setEd(true); }}>
      {value || placeholder}
    </div>
  );
}

export function EditInline({ value, style, onSave }) {
  const [ed, setEd] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  if (ed) return (
    <input autoFocus value={v}
      onChange={e => setV(e.target.value)}
      onBlur={() => { setEd(false); if (v.trim() && v !== value) onSave(v.trim()); else setV(value); }}
      onKeyDown={e => e.key === "Enter" && e.target.blur()}
      style={{ ...style, border: "1.5px solid var(--ac)", borderRadius: 6, padding: "2px 6px", background: "var(--sur)", color: "var(--tx)", outline: "none", fontFamily: "inherit", flex: 1 }}/>
  );
  return (
    <span style={{ ...style, cursor: "text", display: "flex", alignItems: "center", gap: 4, flex: 1 }}
      onClick={() => { setV(value); setEd(true); }}>
      {value} <span style={{ fontSize: "0.65em", opacity: .4 }}>✏️</span>
    </span>
  );
}

export function ProteinTag({ type }) {
  const t = useT();
  const p = PROTEINS[type]; if (!p) return null;
  return <span className="ptag" style={{ background: p.color }}>{p.emoji} {t('protein_' + type)}</span>;
}

export function StarRating({ value, onChange, size = 16 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className="star"
          style={{ fontSize: size, color: s <= (hover || value) ? "#f0a500" : "var(--bdr)" }}
          onPointerEnter={() => setHover(s)}
          onPointerLeave={() => setHover(0)}
          onClick={() => { onChange && onChange(s); haptic(8); }}>★</span>
      ))}
    </div>
  );
}

export function WeekChip({ wid }) {
  return <span className="week-chip">{weekShort(wid)}</span>;
}

export function SkeletonCards() {
  return (
    <div style={{ padding: "12px 12px 20px", maxWidth: 660, margin: "0 auto" }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="skel-card">
          <div className="skel-img shimmer"/>
          <div className="skel-body">
            <div className="skel-line shimmer"/>
            <div className="skel-line skel-short shimmer"/>
            <div className="skel-line shimmer" style={{ height: 30, borderRadius: 8, marginTop: 4 }}/>
          </div>
        </div>
      ))}
    </div>
  );
}
