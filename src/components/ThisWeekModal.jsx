import { useState } from 'react';
import { FLAGS, DAYS } from '../constants.js';
import { getSel, weekLabel, estimateRecipePrice, haptic } from '../utils.js';
import { useT, useLang } from '../LangContext.jsx';

export default function ThisWeekModal({ recipes, sels, ingState, weekId, onServChange, onDayChange, onToggleSel, onClearAll, onClose, onOpenRecipe, onMarkCooked, profile }) {
  const t    = useT();
  const lang = useLang();
  const [tab, setTab] = useState("overview");
  const [cookConfirm, setCookConfirm] = useState(null); // recipe.key being confirmed
  const selRecipes = recipes.filter(r => getSel(sels, r.key).selected);
  const priceTotal = selRecipes.reduce((sum, r) => {
    const servings = getSel(sels, r.key).servings || 2;
    const { total } = estimateRecipePrice(r, servings);
    return sum + total;
  }, 0);
  const totalKcal  = selRecipes.reduce((s, r) => s + (r.kcal || 0) * (getSel(sels, r.key).servings || 2) / 2, 0);
  const avgKcalDay = Math.round(totalKcal / 7);
  const maxKcal    = totalKcal > 3500 ? "high" : totalKcal > 2000 ? "ok" : "low";
  const barColor   = maxKcal === "high" ? "#c07830" : maxKcal === "ok" ? "#4a7c59" : "#7a9aa0";

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sup" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "18px 20px 0", borderBottom: "1px solid var(--bdr)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontWeight: "normal", fontSize: 18, color: "var(--tx)" }}>{t('this_week_title')}</h2>
              <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 2 }}>{weekLabel(weekId)}</div>
            </div>
            {selRecipes.length > 0 && (
              <button className="btn" onClick={onClearAll}
                style={{ fontSize: 12, color: "var(--dan)", background: "none", padding: "4px 8px", border: "1px solid var(--dan)", borderRadius: 8 }}>{t('btn_clear_all')}</button>
            )}
            <button className="btn" onClick={onClose} style={{ fontSize: 22, color: "var(--tx3)", background: "none" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 0, background: "var(--sur2)", borderRadius: 10, padding: 3 }}>
            {[["overview", t('tab_overview')], ["nutrition", t('tab_nutrition')]].map(([tv, l]) => (
              <button key={tv} className="btn" onClick={() => setTab(tv)}
                style={{ flex: 1, padding: "7px 8px", borderRadius: 8, fontSize: 13, background: tab === tv ? "var(--sur)" : "transparent", color: tab === tv ? "var(--tx)" : "var(--tx2)", fontWeight: tab === tv ? "bold" : "normal", boxShadow: tab === tv ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>{l}</button>
            ))}
          </div>
        </div>

        {tab === "overview" && (
          <div style={{ paddingBottom: 8 }}>
            {selRecipes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--tx3)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 14 }}>{t('empty_week')}</div>
              </div>
            ) : (
              <>
                {selRecipes.map(recipe => {
                  const sel = getSel(sels, recipe.key);
                  const servings = sel.servings || 2;
                  const displayName = lang === "en" && recipe.nameEN ? recipe.nameEN : recipe.name;
                  return (
                    <div key={recipe.key} style={{ borderBottom: "1px solid var(--bdr2)" }}>
                      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px", gap: 12 }}>
                        <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}
                          onClick={() => { onOpenRecipe(recipe); onClose(); }}>
                          {recipe.photo
                            ? <img src={recipe.photo} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}/>
                            : <span style={{ fontSize: 26, flexShrink: 0 }}>{recipe.emoji}</span>}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 14, color: "var(--ac)", fontWeight: "bold", lineHeight: 1.3 }}>{displayName}</div>
                            <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 2 }}>
                              {FLAGS.prepCookSplit && recipe.prepMins ? `✋ ${recipe.prepMins} · 🔥 ${recipe.cookMins} Min` : `⏱ ${recipe.time}`}
                              {recipe.kcal ? ` · 🔥 ${recipe.kcal} kcal` : ""}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                          <button className="btn" onClick={() => { haptic(8); onServChange(recipe.key, Math.max(1, servings - 1)); }}
                            style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sur2)", border: "1px solid var(--bdr)", fontSize: 18, color: "var(--tx)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <span style={{ fontSize: 14, fontWeight: "bold", minWidth: 22, textAlign: "center", color: "var(--tx)" }}>{servings}</span>
                          <button className="btn" onClick={() => { haptic(8); onServChange(recipe.key, Math.min(10, servings + 1)); }}
                            style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sur2)", border: "1px solid var(--bdr)", fontSize: 18, color: "var(--tx)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          <span style={{ fontSize: 10, color: "var(--tx3)", marginRight: 2 }}>{t('portions_abbrev')}</span>
                          <button className="btn" onClick={() => onToggleSel(recipe.key)} style={{ fontSize: 18, color: "var(--dan)", background: "none", padding: "0 3px" }}>✕</button>
                          {onMarkCooked && (
                            cookConfirm === recipe.key ? (
                              <>
                                <span style={{ fontSize: 10, color: "var(--tx3)" }}>{lang === "en" ? "Deduct pantry?" : "Vorrat abziehen?"}</span>
                                <button className="btn" onClick={() => { onMarkCooked(recipe.key); setCookConfirm(null); }}
                                  style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ac)", color: "#fff", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>✓</button>
                                <button className="btn" onClick={() => setCookConfirm(null)}
                                  style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sur2)", border: "1px solid var(--bdr)", color: "var(--tx2)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                              </>
                            ) : (
                              <button className="btn" onClick={() => setCookConfirm(recipe.key)}
                                title={lang === "en" ? "Mark as cooked" : "Als gekocht markieren"}
                                style={{ padding: "6px 8px", borderRadius: 10, fontSize: 14, background: profile?.lastCooked?.[recipe.key] === weekId ? "var(--acbg)" : "var(--sur2)", border: `1px solid ${profile?.lastCooked?.[recipe.key] === weekId ? "var(--ac)" : "var(--bdr)"}`, color: profile?.lastCooked?.[recipe.key] === weekId ? "var(--ac)" : "var(--tx)", flexShrink: 0 }}>
                                {profile?.lastCooked?.[recipe.key] === weekId ? "✓🍳" : "🍳"}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      {onDayChange && (
                        <div style={{ display: "flex", gap: 4, padding: "0 20px 10px", flexWrap: "wrap" }}>
                          {DAYS.map(d => (
                            <button key={d.id} className="btn"
                              onClick={() => { haptic(8); onDayChange(recipe.key, sel.day === d.id ? null : d.id); }}
                              style={{ padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: sel.day === d.id ? "bold" : "normal", background: sel.day === d.id ? recipe.color : "var(--sur2)", color: sel.day === d.id ? "#fff" : "var(--tx3)", border: `1px solid ${sel.day === d.id ? recipe.color : "var(--bdr)"}`, minWidth: 32, textAlign: "center" }}>
                              {lang === "en" && d.labelEN ? d.labelEN : d.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {FLAGS.priceEstimates && (
                  <div style={{ padding: "12px 20px", borderTop: "1px solid var(--bdr)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--tx2)" }}>💰 {t('price_label')}</span>
                      <span style={{ fontSize: 15, fontWeight: "bold", color: "var(--ac)" }}>~€{priceTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 3 }}>{t('price_note')}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "nutrition" && (
          <div style={{ padding: "16px 20px" }}>
            {selRecipes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--tx3)" }}>{t('empty_week')}</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  {[[t('nutrition_total'), Math.round(totalKcal) + " kcal"], [t('nutrition_per_day'), avgKcalDay + " kcal"], [t('nutrition_protein'), "~" + Math.round(selRecipes.reduce((s, r) => s + (r.kcal || 0) * 0.05, 0)) + "g"]].map(([l, v]) => (
                    <div key={l} style={{ flex: 1, padding: "10px 8px", background: "var(--sur2)", borderRadius: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--tx3)", marginBottom: 4 }}>{l}</div>
                      <div style={{ fontSize: 15, fontWeight: "bold", color: "var(--tx)" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--tx3)", marginBottom: 4 }}>
                    <span>{t('nutrition_energy')}</span>
                    <span style={{ color: barColor }}>{maxKcal === "high" ? t('nutrition_high') : maxKcal === "ok" ? t('nutrition_ok') : t('nutrition_low')}</span>
                  </div>
                  <div className="nutr-bar-bg">
                    <div className="nutr-bar-fg" style={{ width: `${Math.min((totalKcal / 5000) * 100, 100)}%`, background: barColor }}/>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--tx3)", marginBottom: 8 }}>{t('nutrition_breakdown')}</div>
                {selRecipes.filter(r => r.kcal).map(r => {
                  const recKcal = (r.kcal || 0) * (getSel(sels, r.key).servings || 2) / 2;
                  const pct     = totalKcal > 0 ? Math.round((recKcal / totalKcal) * 100) : 0;
                  const displayName = lang === "en" && r.nameEN ? r.nameEN : r.name;
                  return (
                    <div key={r.key} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                        <span style={{ color: "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>{r.emoji} {displayName}</span>
                        <span style={{ color: "var(--tx2)", flexShrink: 0 }}>{recKcal} kcal ({pct}%)</span>
                      </div>
                      <div className="nutr-bar-bg" style={{ height: 6 }}>
                        <div className="nutr-bar-fg" style={{ width: `${pct}%`, background: r.color, height: 6 }}/>
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 12 }}>{t('nutrition_note')}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
