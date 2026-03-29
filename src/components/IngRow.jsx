import { useState } from 'react';
import { SE } from '../constants.js';
import { needAmt, computeAutoStatus, haptic } from '../utils.js';
import { QtyBox, EditInline } from './SmallComponents.jsx';

export default function IngRow({ ing, rkey, rcolor, ingState, sels, updateIng, setIngStatus, saveIngName }) {
  const [showNote, setShowNote] = useState(false);
  const s    = ingState[ing.id] || {};
  const need = needAmt(ing, rkey, sels);
  const rowCls = `ing-row${s.status === "full" ? " done" : s.status === "partial" ? " part" : ""}`;

  const onHaveChange = v => {
    updateIng(ing.id, "have", v);
    const auto = computeAutoStatus(v, need);
    if (auto !== null) setIngStatus(ing.id, auto);
  };
  const onFullTap = () => {
    setIngStatus(ing.id, "full");
    if (!(s.have || "").trim()) updateIng(ing.id, "have", need);
    haptic(12);
  };
  const onNoneTap = () => {
    setIngStatus(ing.id, "none");
    if ((s.have || "").trim() === need.trim()) updateIng(ing.id, "have", "");
  };

  return (
    <div className={rowCls}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <EditInline value={ing.name}
          style={{ fontSize: 14, color: s.status === "full" ? "var(--tx3)" : "var(--tx)", textDecoration: s.status === "full" ? "line-through" : "none" }}
          onSave={v => saveIngName(rkey, ing.id, v)}/>
        <button className="btn" onClick={() => setShowNote(n => !n)}
          style={{ fontSize: 13, color: s.note ? "var(--wn)" : "var(--tx3)", background: "none", padding: "0 2px", flexShrink: 0 }}>
          {s.note ? "📝" : "💬"}
        </button>
      </div>
      {(showNote || s.note) && (
        <textarea className="note-ta" placeholder="Notiz…" value={s.note || ""} rows={2}
          onChange={e => updateIng(ing.id, "note", e.target.value)}/>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 10, color: "var(--tx3)" }}>Benötigt</span>
        <div className="qb has" style={{ borderColor: rcolor, cursor: "default", fontSize: 12 }}>{need}</div>
        <span style={{ fontSize: 10, color: "var(--tx3)" }}>Vorhanden</span>
        <QtyBox value={s.have || ""} placeholder="—" color={rcolor} onChange={onHaveChange}/>
        <div style={{ display: "flex", gap: 3 }}>
          <button className={`stb${s.status === "none" ? " on" : ""}`} onClick={onNoneTap}
            style={s.status === "none" ? { borderColor: rcolor, background: "#fff0f0" } : {}}>{SE.none}</button>
          <button className={`stb${s.status === "partial" ? " on" : ""}`} onClick={() => setIngStatus(ing.id, "partial")}
            style={s.status === "partial" ? { borderColor: rcolor, background: "#fff8f0" } : {}}>{SE.partial}</button>
          <button className={`stb${s.status === "full" ? " on" : ""}`} onClick={onFullTap}
            style={s.status === "full" ? { borderColor: rcolor, background: "var(--acbg)" } : {}}>{SE.full}</button>
        </div>
      </div>
    </div>
  );
}
