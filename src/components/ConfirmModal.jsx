export default function ConfirmModal({ emoji, title, body, confirmLabel, confirmColor, extra, onConfirm, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="sheet sup" style={{ padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
          <h2 style={{ fontWeight: "normal", color: "var(--tx)", marginBottom: 8 }}>{title}</h2>
          <p style={{ color: "var(--tx2)", fontSize: 14, lineHeight: 1.6 }}>{body}</p>
          {extra}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={onCancel}
            style={{ flex: 1, padding: 13, borderRadius: 12, border: "1.5px solid var(--bdr)", background: "var(--sur)", color: "var(--tx2)", fontSize: 14 }}>Abbrechen</button>
          <button className="btn" onClick={onConfirm}
            style={{ flex: 1, padding: 13, borderRadius: 12, background: confirmColor || "var(--dan)", color: "#fff", fontSize: 14, fontWeight: "bold" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
