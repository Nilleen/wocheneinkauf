import { useState } from 'react';
import { getSel } from '../utils.js';
import { useT, useLang } from '../LangContext.jsx';
import IngRow from './IngRow.jsx';

export default function ChecklistView({ recipes, ingState, sels, updateIng, setIngStatus, saveIngName }) {
  const t    = useT();
  const lang = useLang();
  const [q, setQ] = useState("");
  const lq = q.toLowerCase();
  const selRecipes = recipes.filter(r => getSel(sels, r.key).selected);

  if (selRecipes.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tx3)" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
      <div style={{ fontSize: 14, lineHeight: 1.6 }}>{t('empty_select_hint')}</div>
    </div>
  );

  const allDone = selRecipes.every(r => r.ingredients.every(i => ingState[i.id]?.status === "full"));

  return (
    <div style={{ padding: "12px 12px 20px", maxWidth: 660, margin: "0 auto" }}>
      <input className="sbar" placeholder={t('search_checklist')} value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 12 }}/>
      {allDone && (
        <div className="slide-up" style={{ textAlign: "center", padding: "16px", background: "var(--acbg)", borderRadius: 12, marginBottom: 12, border: "1px solid var(--ac)" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>✅</div>
          <div style={{ fontSize: 14, color: "var(--ac)", fontWeight: "bold" }}>{t('all_stocked_checklist')}</div>
        </div>
      )}
      {selRecipes.map(recipe => {
        const ings = recipe.ingredients.filter(i => !lq || i.name.toLowerCase().includes(lq));
        if (!ings.length) return null;
        const done = recipe.ingredients.filter(i => ingState[i.id]?.status === "full").length;
        const isRecipeDone = done === recipe.ingredients.length;
        const displayName = lang === "en" && recipe.nameEN ? recipe.nameEN : recipe.name;
        return (
          <div key={recipe.key} className={`card${isRecipeDone ? " slide-up" : ""}`}>
            <div style={{ padding: "11px 16px", background: recipe.color, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{recipe.emoji}</span>
              <span style={{ color: "#fff", fontSize: 14, flex: 1, minWidth: 0 }}>{displayName}</span>
              <span style={{ color: "rgba(255,255,255,.75)", fontSize: 12, flexShrink: 0 }}>{done}/{recipe.ingredients.length} ✅</span>
            </div>
            {ings.map(ing => (
              <IngRow key={ing.id} ing={ing} rkey={recipe.key} rcolor={recipe.color}
                ingState={ingState} sels={sels} updateIng={updateIng} setIngStatus={setIngStatus} saveIngName={saveIngName}/>
            ))}
          </div>
        );
      })}
    </div>
  );
}
