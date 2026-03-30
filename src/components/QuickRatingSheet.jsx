import { useState } from 'react';
import { StarRating } from './SmallComponents.jsx';
import { showToast } from '../toast.js';

export default function QuickRatingSheet({ recipe, profile, onSetRating, onSetNote, onClose }) {
  const rating = profile?.ratings?.[recipe.key] || 0;
  const note   = profile?.notes?.[recipe.key] || "";
  const [localNote, setLocalNote] = useState(note);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sup" style={{ padding: "20px 20px 28px" }} onClick={e => e.stopPropagation()}>
        <div className="drag-handle"/>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>{recipe.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: "bold", color: "var(--tx)", marginBottom: 6 }}>{recipe.name}</div>
            <StarRating value={rating} size={22}
              onChange={v => { onSetRating(recipe.key, v); showToast("⭐ Bewertung gespeichert"); }}/>
          </div>
        </div>
        <textarea className="note-ta" rows={3} placeholder="Persönliche Notiz…" value={localNote}
          onChange={e => setLocalNote(e.target.value)}
          onBlur={() => onSetNote(recipe.key, localNote)}
          style={{ width: "100%", marginBottom: 12 }}/>
        <button className="btn" onClick={onClose}
          style={{ width: "100%", padding: 12, borderRadius: 12, background: "var(--ac)", color: "#fff", fontSize: 14, fontWeight: "bold" }}>Fertig</button>
      </div>
    </div>
  );
}
