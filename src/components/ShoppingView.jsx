import { useState, useMemo } from 'react';
import { AISLES } from '../constants.js';
import { getSel, needAmt, normIngName, normShop, expandIngredient, haptic } from '../utils.js';
import { showToast } from '../toast.js';
import { useT, useLang } from '../LangContext.jsx';
import SwipeItem from './SwipeItem.jsx';
import { combineAmts } from '../utils.js';

export default function ShoppingView({ recipes, ingState, sels, onShare, setIngStatus, pantryInventory }) {
  const t    = useT();
  const lang = useLang();
  const [sv,           setSv]          = useState("combined");
  const [q,            setQ]           = useState("");
  const [checkedIds,   setCheckedIds]  = useState({});
  const [hideChecked,  setHideChecked] = useState(false);
  const lq = q.toLowerCase();
  const selRecipes = recipes.filter(r => getSel(sels, r.key).selected);

  const allMissing = useMemo(() => {
    const map = {};
    selRecipes.forEach(r => r.ingredients.forEach(ing => {
      if (ingState[ing.id]?.status === "full") return;
      const pInv = pantryInventory[normIngName(ing.name)]; if (pInv?.qty) return;
      const expanded = expandIngredient(ing);
      expanded.forEach(eing => {
        const display = normShop(eing.name);
        const key     = normIngName(eing.name);
        if (!map[key]) { map[key] = { name: display, orig: eing.name, ids: [ing.id], amounts: [], recs: [], aisle: ing.aisle || "other", status: "none" }; }
        else {
          if (display.length < map[key].name.length) { map[key].name = display; map[key].orig = eing.name; }
          map[key].ids.push(ing.id);
        }
        map[key].amounts.push(needAmt(ing, r.key, sels));
        map[key].recs.push(r.emoji + " " + (lang === "en" && r.nameEN ? r.nameEN : r.name));
        if (ingState[ing.id]?.status === "partial") map[key].status = "partial";
      });
    }));
    return Object.values(map)
      .filter(i => !lq || i.name.toLowerCase().includes(lq) || i.orig.toLowerCase().includes(lq))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selRecipes, ingState, sels, lq, lang]);

  const byAisle = useMemo(() => {
    const g = {};
    allMissing.forEach(i => { const a = i.aisle || "other"; if (!g[a]) g[a] = []; g[a].push(i); });
    return Object.entries(g).sort((a, b) => (AISLES[a[0]]?.order || 99) - (AISLES[b[0]]?.order || 99));
  }, [allMissing]);

  const markItem = (item) => {
    const itemKey = normIngName(item.name);
    const isChecked = !!checkedIds[itemKey];
    if (!isChecked) { setCheckedIds(c => ({ ...c, [itemKey]: true })); haptic(12); showToast(t('toast_item_checked')); }
    else { setCheckedIds(c => { const n = { ...c }; delete n[itemKey]; return n; }); }
  };
  const confirmPurchases = () => {
    Object.keys(checkedIds).forEach(itemKey => {
      const item = allMissing.find(i => normIngName(i.name) === itemKey);
      if (item) item.ids.forEach(id => setIngStatus(id, "full"));
    });
    setCheckedIds({}); showToast(t('toast_shopping_done')); haptic([10, 50, 10]);
  };
  const clearChecked = () => setCheckedIds({});
  const checkedCount = Object.keys(checkedIds).length;

  if (selRecipes.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tx3)" }}>
      <div style={{ fontSize: 40 }}>🛒</div>
      <div style={{ marginTop: 12 }}>{t('empty_no_recipes')}</div>
    </div>
  );
  if (allMissing.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ac)" }}>
      <div style={{ fontSize: 56 }}>🎉</div>
      <h2 style={{ fontWeight: "normal", marginTop: 14, color: "var(--tx)" }}>{t('all_stocked')}</h2>
    </div>
  );

  return (
    <div style={{ padding: "12px 12px 20px", maxWidth: 660, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <input className="sbar" style={{ marginBottom: 0, flex: 1 }} placeholder={t('search_shopping')} value={q} onChange={e => setQ(e.target.value)}/>
        <button className="btn" onClick={onShare} style={{ padding: "9px 14px", borderRadius: 10, background: "var(--ac)", color: "#fff", fontSize: 13, fontWeight: "bold", flexShrink: 0 }}>📤</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ padding: "5px 10px", background: "var(--acbg)", borderRadius: 8, border: "1px solid var(--bdr)", fontSize: 11, color: "var(--ac)", flex: 1 }}>
          {t('hint_shopping')}
        </div>
        {checkedCount > 0 && <>
          <button className="btn" onClick={() => setHideChecked(h => !h)}
            style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, background: "var(--sur2)", border: "1px solid var(--bdr)", color: "var(--tx2)" }}>
            {hideChecked ? t('btn_show_all') : t('btn_hide_checked')}
          </button>
          <button className="btn" onClick={confirmPurchases}
            style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, background: "var(--ac)", color: "#fff", fontWeight: "bold" }}>
            {t('btn_confirm', { count: checkedCount })}
          </button>
          <button className="btn" onClick={clearChecked}
            style={{ fontSize: 12, padding: "5px 10px", borderRadius: 8, background: "var(--sur2)", border: "1px solid var(--bdr)", color: "var(--tx3)" }}>✕</button>
        </>}
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "var(--sur)", borderRadius: 12, padding: 5, border: "1px solid var(--bdr)" }}>
        {[["combined", t('view_combined')], ["by-recipe", t('view_by_recipe')]].map(([v, l]) => (
          <button key={v} className="btn" onClick={() => setSv(v)}
            style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 13, background: sv === v ? "var(--ac)" : "transparent", color: sv === v ? "#fff" : "var(--tx2)", fontWeight: sv === v ? "bold" : "normal" }}>
            {l}
          </button>
        ))}
      </div>

      {sv === "combined" && (
        <div className="card">
          {byAisle.map(([aisle, items]) => (
            <div key={aisle}>
              <div className="aisle-h">{t('aisle_' + aisle) || AISLES[aisle]?.label || aisle}</div>
              {items.filter(item => !hideChecked || !checkedIds[normIngName(item.name)]).map(item => {
                const itemKey  = normIngName(item.name);
                const isChecked = !!checkedIds[itemKey];
                const combined  = combineAmts(item.amounts);
                const multi     = item.amounts.length > 1;
                return (
                  <SwipeItem key={itemKey} onSwipeLeft={() => { item.ids.forEach(id => setIngStatus(id, "full")); showToast(t('toast_marked_available')); }}>
                    <div onClick={() => markItem(item)}
                      style={{ display: "flex", alignItems: "center", padding: "11px 16px", gap: 12, background: isChecked ? "var(--acbg)" : "var(--sur)", cursor: "pointer", transition: "background .15s" }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{isChecked ? "✅" : item.status === "partial" ? "⚠️" : "⬜"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: isChecked ? "var(--tx3)" : "var(--tx)", textDecoration: isChecked ? "line-through" : "none", wordBreak: "break-word" }}>{item.name}</div>
                        {multi && <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 1 }}>{item.recs.join(" · ")}</div>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: "var(--tx)" }}>{combined}</div>
                        {multi && <div style={{ fontSize: 10, color: "var(--tx3)" }}>{item.amounts.join(" + ")}</div>}
                      </div>
                    </div>
                  </SwipeItem>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {sv === "by-recipe" && selRecipes.map(recipe => {
        const missing = recipe.ingredients.filter(i => ingState[i.id]?.status !== "full" && (!lq || i.name.toLowerCase().includes(lq)));
        if (!missing.length) return null;
        const displayName = lang === "en" && recipe.nameEN ? recipe.nameEN : recipe.name;
        return (
          <div key={recipe.key} className="card">
            <div style={{ padding: "10px 16px", background: recipe.color + "22", borderBottom: "1px solid var(--bdr)", display: "flex", gap: 8, alignItems: "center" }}>
              <span>{recipe.emoji}</span>
              <span style={{ fontSize: 13, color: recipe.color, fontWeight: "bold" }}>{displayName}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--tx3)" }}>{missing.length} {t('items_count', { count: '' }).replace('{count} ', '')}</span>
            </div>
            {missing.map((ing, i) => {
              const s    = ingState[ing.id] || {};
              const need = needAmt(ing, recipe.key, sels);
              return (
                <div key={ing.id} style={{ display: "flex", alignItems: "center", padding: "11px 16px", gap: 10, borderBottom: i < missing.length - 1 ? "1px solid var(--bdr2)" : "none" }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{s.status === "partial" ? "⚠️" : "❌"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--tx)", wordBreak: "break-word" }}>{normShop(ing.name)}</div>
                    {normShop(ing.name) !== ing.name && <div style={{ fontSize: 10, color: "var(--tx3)" }}>orig: {ing.name}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: "bold", color: "var(--tx)" }}>{need}</div>
                    {s.status === "partial" && s.have && <div style={{ fontSize: 11, color: "var(--wn)" }}>{lang === "en" ? "Have" : "Hab"}: {s.have}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
