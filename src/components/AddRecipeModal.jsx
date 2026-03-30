import { useState } from 'react';
import { PROTEINS, AISLES_OPT, EMOJIS } from '../constants.js';
import { useT } from '../LangContext.jsx';

export default function AddRecipeModal({ onSave, onClose }) {
  const t = useT();
  const [name,  setName]  = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [time,  setTime]  = useState("25–35 Min");
  const [diff,  setDiff]  = useState("Einfach");
  const [kcal,  setKcal]  = useState("");
  const [ptype, setPtype] = useState("vegetarian");
  const [ings,  setIngs]  = useState([{ n: "", an: "", au: "g", s: "produce" }]);
  const [step,  setStep]  = useState(0);

  const addIng  = ()       => setIngs(p => [...p, { n: "", a: "", s: "produce" }]);
  const updIng  = (i, f, v)=> setIngs(p => { const c = [...p]; c[i] = { ...c[i], [f]: v }; return c; });
  const remIng  = (i)      => setIngs(p => p.filter((_, j) => j !== i));

  const handleSave = () => {
    if (!name.trim()) return;
    const key   = "custom_" + Date.now();
    const color = PROTEINS[ptype]?.color || "#4a7c59";
    const ingMap = {};
    ings.filter(i => i.n.trim()).forEach((i, idx) => {
      const id = `${key}_${idx + 1}`;
      ingMap[id] = { name: i.n.trim(), amount: i.an.trim() ? `${i.an.trim()}${i.au}` : "nach Bedarf", aisle: i.s };
    });
    onSave({ key, order: 9999, emoji, color, name: name.trim(), description: "", time, difficulty: diff, kcal: kcal ? parseInt(kcal) : null, pantryItems: [], ingredients: ingMap, instructions: [] });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sup" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 18px 10px", borderBottom: "1px solid var(--bdr)", display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontWeight: "normal", fontSize: 17, color: "var(--tx)", flex: 1 }}>{t('add_recipe_title')}</h2>
          <button className="btn" onClick={onClose} style={{ fontSize: 22, color: "var(--tx3)", background: "none" }}>✕</button>
        </div>
        <div style={{ padding: "12px 18px 8px", borderBottom: "1px solid var(--bdr)", display: "flex", gap: 8 }}>
          {[t('tab_basics'), t('tab_ingredients_tab')].map((l, i) => (
            <button key={i} className="btn" onClick={() => setStep(i)}
              style={{ flex: 1, padding: "8px", borderRadius: 10, fontSize: 13, background: step === i ? "var(--ac)" : "var(--sur2)", color: step === i ? "#fff" : "var(--tx2)", border: `1px solid ${step === i ? "var(--ac)" : "var(--bdr)"}` }}>{l}</button>
          ))}
        </div>
        <div style={{ padding: "14px 18px", overflowY: "auto", maxHeight: "55vh" }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="fbar" style={{ gap: 6, paddingBottom: 8 }}>
                {EMOJIS.map(e => (
                  <button key={e} className="btn" onClick={() => setEmoji(e)}
                    style={{ fontSize: 20, background: emoji === e ? "var(--acbg)" : "none", border: `1px solid ${emoji === e ? "var(--ac)" : "transparent"}`, borderRadius: 8, padding: "4px 6px" }}>{e}</button>
                ))}
              </div>
              <input placeholder={t('name_placeholder')} value={name} onChange={e => setName(e.target.value)}
                style={{ padding: "10px 14px", fontSize: 14, borderRadius: 10, width: "100%" }}/>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={time} onChange={e => setTime(e.target.value)} style={{ flex: 1, padding: "10px 10px", fontSize: 13, borderRadius: 10 }}>
                  {["10–20 Min","15–25 Min","20–30 Min","25–35 Min","30–40 Min","35–45 Min"].map(tv => <option key={tv}>{tv}</option>)}
                </select>
                <select value={diff} onChange={e => setDiff(e.target.value)} style={{ flex: 1, padding: "10px 10px", fontSize: 13, borderRadius: 10 }}>
                  <option value="Einfach">{t('diff_easy')}</option><option value="Mittel">{t('diff_medium')}</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input placeholder={t('kcal_placeholder')} type="number" value={kcal} onChange={e => setKcal(e.target.value)}
                  style={{ flex: 1, padding: "10px 10px", fontSize: 13, borderRadius: 10 }}/>
                <select value={ptype} onChange={e => setPtype(e.target.value)} style={{ flex: 1, padding: "10px 10px", fontSize: 13, borderRadius: 10 }}>
                  {Object.entries(PROTEINS).map(([k, p]) => <option key={k} value={k}>{p.emoji} {p.label}</option>)}
                </select>
              </div>
            </div>
          )}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--tx3)", marginBottom: 2 }}>{t('tab_ingredients_tab')}:</div>
              {ings.map((ing, i) => (
                <div key={i} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <input placeholder={t('ingredient_placeholder')} value={ing.n} onChange={e => updIng(i, "n", e.target.value)}
                    style={{ flex: 2, padding: "8px 10px", fontSize: 13, borderRadius: 8, minWidth: 0 }}/>
                  <div style={{ display: "flex", flex: "0 0 96px", minWidth: 0 }}>
                    <input type="number" placeholder="300" value={ing.an} onChange={e => updIng(i, "an", e.target.value)}
                      style={{ flex: 1, width: 0, padding: "8px 4px", fontSize: 13, borderRadius: "8px 0 0 8px", minWidth: 0, textAlign: "center" }}/>
                    <select value={ing.au} onChange={e => updIng(i, "au", e.target.value)}
                      style={{ width: 42, padding: "8px 2px", fontSize: 11, borderRadius: "0 8px 8px 0", borderLeft: "none", textAlign: "center" }}>
                      {["g","kg","ml","l","Stück","EL","TL","Pck"].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <select value={ing.s} onChange={e => updIng(i, "s", e.target.value)}
                    style={{ flex: 1, padding: "8px 4px", fontSize: 11, borderRadius: 8, minWidth: 0 }}>
                    {AISLES_OPT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  {ings.length > 1 && (
                    <button className="btn" onClick={() => remIng(i)}
                      style={{ fontSize: 20, color: "var(--dan)", background: "none", padding: "0 3px", flexShrink: 0 }}>×</button>
                  )}
                </div>
              ))}
              <button className="btn" onClick={addIng}
                style={{ padding: "8px", borderRadius: 10, background: "var(--sur2)", border: "1px solid var(--bdr)", color: "var(--tx2)", fontSize: 13 }}>{t('btn_add_ingredient')}</button>
            </div>
          )}
        </div>
        <div style={{ padding: "10px 18px 14px", borderTop: "1px solid var(--bdr)", display: "flex", gap: 8 }}>
          <button className="btn" onClick={onClose}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid var(--bdr)", background: "var(--sur)", color: "var(--tx2)", fontSize: 14 }}>{t('btn_cancel')}</button>
          <button className="btn" onClick={handleSave}
            style={{ flex: 1, padding: 12, borderRadius: 12, background: name.trim() ? "var(--ac)" : "#aaa", color: "#fff", fontSize: 14, fontWeight: "bold" }}>{t('btn_save')}</button>
        </div>
      </div>
    </div>
  );
}
