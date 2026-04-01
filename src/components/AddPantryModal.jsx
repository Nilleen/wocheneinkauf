import { useState } from 'react';
import { useT } from '../LangContext.jsx';

export default function AddPantryModal({ onAdd, onClose }) {
  const t = useT();
  const [name, setName] = useState("");
  const [qty,  setQty]  = useState("");
  const [unit, setUnit] = useState("g");

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sup" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontWeight: "normal", fontSize: 18, color: "var(--tx)", marginBottom: 16 }}>{t('add_pantry_title')}</h2>
        <input placeholder={t('pantry_name_placeholder')} value={name} onChange={e => setName(e.target.value)} maxLength={80}
          style={{ width: "100%", padding: "10px 14px", fontSize: 14, marginBottom: 10, borderRadius: 10 }}/>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input placeholder={t('qty_placeholder')} value={qty} onChange={e => setQty(e.target.value)} type="number"
            style={{ flex: 1, padding: "10px 10px", fontSize: 14, borderRadius: 10 }}/>
          <select value={unit} onChange={e => setUnit(e.target.value)}
            style={{ flex: 1, padding: "10px 10px", fontSize: 13, borderRadius: 10 }}>
            {["g","kg","ml","l","Stück","EL","TL","Pck"].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={onClose}
            style={{ flex: 1, padding: 13, borderRadius: 12, border: "1.5px solid var(--bdr)", background: "var(--sur)", color: "var(--tx2)", fontSize: 14 }}>{t('btn_cancel')}</button>
          <button className="btn"
            onClick={() => { if (name.trim()) { onAdd({ name: name.trim(), qty: qty ? parseFloat(qty) : null, unit, lastUpdated: Date.now() }); onClose(); } }}
            style={{ flex: 1, padding: 13, borderRadius: 12, background: "var(--ac)", color: "#fff", fontSize: 14, fontWeight: "bold" }}>{t('btn_add_item')}</button>
        </div>
      </div>
    </div>
  );
}
