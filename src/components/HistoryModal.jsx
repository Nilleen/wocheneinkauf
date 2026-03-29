import { weekLabel } from '../utils.js';

export default function HistoryModal({ history, onClose }) {
  const entries = Object.entries(history || {}).sort((a, b) => b[0].localeCompare(a[0]));
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sup" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px", borderBottom: "1px solid var(--bdr)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontWeight: "normal", fontSize: 18, color: "var(--tx)" }}>📚 Wochenhistorie</h2>
          <button className="btn" onClick={onClose} style={{ fontSize: 22, color: "var(--tx3)", background: "none" }}>✕</button>
        </div>
        {entries.length === 0
          ? <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--tx3)", fontSize: 14 }}>Noch keine Historie.</div>
          : entries.map(([key, snap]) => {
              const label   = weekLabel(key) || new Date(parseInt(key)).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
              const meta    = snap?.meta || {};
              const sels    = snap?.selections || {};
              const state   = snap?.state || {};
              const selKeys = Object.keys(sels).filter(k => sels[k]?.selected);
              const vals    = Object.values(state);
              const done    = vals.filter(s => s?.status === "full").length;
              return (
                <div key={key} className="hist-row">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 14, fontWeight: "bold", color: "var(--tx)" }}>{meta.label || label}</div>
                    <span style={{ fontSize: 11, color: "var(--tx3)" }}>{done}/{vals.length} ✅</span>
                  </div>
                  {selKeys.length > 0 && <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 3 }}>{selKeys.length} Rezept{selKeys.length > 1 ? "e" : ""} geplant</div>}
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
