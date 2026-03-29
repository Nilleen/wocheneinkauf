import { useState } from 'react';
import { getSel, needAmt, weekShort } from '../utils.js';

export default function ClaudeModal({ recipes, ingState, sels, onClose }) {
  const [copied, setCopied] = useState(false);
  const selRecipes = recipes.filter(r => getSel(sels, r.key).selected);
  const missing = [];
  selRecipes.forEach(r => {
    r.ingredients.forEach(ing => {
      const s = ingState[ing.id] || {};
      if (s.status !== "full") missing.push(`- ${ing.name} (${needAmt(ing, r.key, sels)}) [${r.name}]`);
    });
  });
  const ctx = `Hallo! Ich nutze unsere Meal-Prep App für diese Woche.\n\nAusgewählte Rezepte:\n${selRecipes.map(r => `- ${r.name} (${getSel(sels, r.key).servings}P)`).join("\n")}\n\nFehlende Zutaten:\n${missing.join("\n")}\n\nWas möchtest du ändern oder wissen?`;

  const copy = async () => {
    await navigator.clipboard.writeText(ctx);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sup" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid var(--bdr)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontWeight: "normal", fontSize: 18, color: "var(--tx)" }}>🤖 Claude öffnen</h2>
          <button className="btn" onClick={onClose} style={{ fontSize: 22, color: "var(--tx3)", background: "none" }}>✕</button>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 14, color: "var(--tx2)", lineHeight: 1.6, marginBottom: 14 }}>Kontext kopieren und in Claude einfügen um Rezepte zu aktualisieren oder Zutaten anzupassen.</p>
          <div style={{ background: "var(--sur2)", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "var(--tx2)", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 14, maxHeight: 200, overflow: "auto", border: "1px solid var(--bdr)" }}>{ctx}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={copy}
              style={{ flex: 1, padding: 13, borderRadius: 12, background: copied ? "var(--ac)" : "var(--sur2)", border: `1px solid ${copied ? "var(--ac)" : "var(--bdr)"}`, color: copied ? "#fff" : "var(--tx)", fontSize: 14 }}>
              {copied ? "✅ Kopiert!" : "📋 Kontext kopieren"}
            </button>
            <button className="btn" onClick={() => window.open("https://claude.ai", "_blank")}
              style={{ flex: 1, padding: 13, borderRadius: 12, background: "var(--hd)", color: "#fff", fontSize: 14, fontWeight: "bold" }}>Claude öffnen →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
