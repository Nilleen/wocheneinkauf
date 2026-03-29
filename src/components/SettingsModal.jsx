import { useState } from 'react';
import HistoryModal from './HistoryModal.jsx';

export default function SettingsModal({ darkMode, onDarkMode, history, onClose }) {
  const [showH, setShowH] = useState(false);
  if (showH) return <HistoryModal history={history} onClose={() => setShowH(false)}/>;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sup" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px", borderBottom: "1px solid var(--bdr)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontWeight: "normal", fontSize: 18, color: "var(--tx)" }}>⚙️ Einstellungen</h2>
          <button className="btn" onClick={onClose} style={{ fontSize: 22, color: "var(--tx3)", background: "none" }}>✕</button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, color: "var(--tx3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Darstellung</div>
          {[["auto","🌗 System"],["light","☀️ Hell"],["dark","🌙 Dunkel"]].map(([m, l]) => (
            <button key={m} className="btn" onClick={() => onDarkMode(m)}
              style={{ padding: "12px 16px", borderRadius: 12, textAlign: "left", fontSize: 14, background: darkMode === m ? "var(--acbg)" : "var(--sur)", color: darkMode === m ? "var(--ac)" : "var(--tx)", border: `1.5px solid ${darkMode === m ? "var(--ac)" : "var(--bdr)"}` }}>
              {l}{darkMode === m && <span style={{ float: "right" }}>✓</span>}
            </button>
          ))}
          <div style={{ fontSize: 11, color: "var(--tx3)", letterSpacing: 1, textTransform: "uppercase", margin: "12px 0 4px" }}>Daten</div>
          <button className="btn" onClick={() => setShowH(true)}
            style={{ padding: "12px 16px", borderRadius: 12, textAlign: "left", fontSize: 14, background: "var(--sur)", color: "var(--tx)", border: "1.5px solid var(--bdr)" }}>
            📚 Wochenhistorie ({Object.keys(history || {}).length} Wochen)
          </button>
          <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 8 }}>Meal Prep App v2.0 · Firebase Realtime DB</div>
        </div>
      </div>
    </div>
  );
}
