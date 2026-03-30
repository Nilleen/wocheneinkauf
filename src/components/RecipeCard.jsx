import { useState, useRef } from 'react';
import { FLAGS, PROTEINS, DAYS } from '../constants.js';
import { getSel, detectProtein, formatPrice, weekShort, haptic } from '../utils.js';
import { showToast } from '../toast.js';
import { ProteinTag, StarRating, WeekChip } from './SmallComponents.jsx';
import { useT, useLang } from '../LangContext.jsx';

export default function RecipeCard({ recipe, ingState, sels, profile, currentWeekId, pantryInventory, onToggleSel, onToggleFav, onServChange, onDayChange, onOpenRecipe, onLongPress, onMarkCooked }) {
  const t    = useT();
  const lang = useLang();
  const sel    = getSel(sels, recipe.key);
  const isSel  = sel.selected;
  const servings = sel.servings || 2;
  const ptype  = detectProtein(recipe);
  const p      = PROTEINS[ptype];
  const isFav  = !!profile?.favourites?.[recipe.key];
  const rating = profile?.ratings?.[recipe.key] || 0;
  const lastCooked = profile?.lastCooked?.[recipe.key];
  const done   = recipe.ingredients.filter(i => ingState[i.id]?.status === "full").length;
  const pct    = recipe.ingredients.length ? Math.round((done / recipe.ingredients.length) * 100) : 0;
  const price  = FLAGS.priceEstimates ? formatPrice(recipe, servings) : null;
  const [flash, setFlash] = useState("");
  const [cookConfirm, setCookConfirm] = useState(false);
  const cookedThisWeek = lastCooked === currentWeekId;
  const longPressTimer = useRef();
  const startX = useRef(0);
  const moved  = useRef(false);

  const displayName = lang === "en" && recipe.nameEN ? recipe.nameEN : recipe.name;

  const handleTouchStart = e => {
    startX.current = e.touches[0].clientX;
    moved.current  = false;
    longPressTimer.current = setTimeout(() => { haptic([10, 30, 10]); onLongPress && onLongPress(recipe); }, 600);
  };
  const handleTouchMove = e => {
    const dx = Math.abs(e.touches[0].clientX - startX.current);
    if (dx > 10) { moved.current = true; clearTimeout(longPressTimer.current); }
  };
  const handleTouchEnd = e => {
    clearTimeout(longPressTimer.current);
    if (!moved.current) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (FLAGS.swipeGestures && Math.abs(dx) > 50) {
      if (dx > 0 && !isSel)  { onToggleSel(recipe.key); setFlash("flash-green"); haptic(12); showToast(t('toast_selected')); setTimeout(() => setFlash(""), 400); }
      else if (dx < 0 && isSel) { onToggleSel(recipe.key); setFlash("flash-red");  haptic(12); showToast(t('toast_deselected'));  setTimeout(() => setFlash(""), 400); }
    }
  };

  return (
    <div className={`card ${flash}`} style={{ transition: "transform .15s" }}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {recipe.photo && (
        <div style={{ height: 160, overflow: "hidden", position: "relative", cursor: "pointer" }} onClick={() => onOpenRecipe(recipe)}>
          <img src={recipe.photo} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }}/>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.5))" }}/>
          <span style={{ position: "absolute", bottom: 10, left: 12, fontSize: 20 }}>{recipe.emoji}</span>
          <span className="ptag" style={{ position: "absolute", top: 10, left: 10, background: p.color }}>{p.emoji} {t('protein_' + ptype)}</span>
          {recipe.kcal && <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.45)", color: "#fff", borderRadius: 10, padding: "3px 8px", fontSize: 11 }}>🔥 {recipe.kcal}</span>}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ width: 6, background: isSel ? recipe.color : "var(--bdr)", flexShrink: 0, transition: "background .3s" }}/>
        <div style={{ padding: "12px 14px", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
            {!recipe.photo && <span style={{ fontSize: 22, flexShrink: 0 }}>{recipe.emoji}</span>}
            <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onOpenRecipe(recipe)}>
              <div style={{ fontSize: 15, fontWeight: "bold", color: "var(--tx)", marginBottom: 2, lineHeight: 1.3 }}>{displayName}</div>
              {!recipe.photo && <ProteinTag type={ptype}/>}
              <div style={{ fontSize: 11, color: "var(--tx2)", marginTop: 2 }}>
                {lang === "en"
                  ? (recipe.difficulty === "Einfach" ? t('diff_easy') : recipe.difficulty === "Mittel" ? t('diff_medium') : recipe.difficulty)
                  : recipe.difficulty}
                {FLAGS.prepCookSplit && recipe.prepMins ? ` · ✋ ${recipe.prepMins} · 🔥 ${recipe.cookMins} Min` : ` · ⏱ ${recipe.time}`}
                {recipe.kcal ? ` · 🔥 ${recipe.kcal}` : ""}
              </div>
            </div>
            <button className="btn" onClick={() => onToggleFav(recipe.key)}
              style={{ fontSize: 20, background: "none", padding: "0 4px", color: isFav ? "#f0a500" : "var(--tx3)", flexShrink: 0 }}>
              {isFav ? "⭐" : "☆"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            {rating > 0 && <StarRating value={rating} size={12}/>}
            {lastCooked && <span style={{ fontSize: 10, color: "var(--tx3)" }}>{lang === "en" ? "Last" : "Zuletzt"} {weekShort(lastCooked)}</span>}
            {isSel && <WeekChip wid={currentWeekId}/>}
            {isSel && sel.day && (
              <span style={{ fontSize: 10, color: "var(--ac)", background: "var(--acbg)", padding: "2px 6px", borderRadius: 8, fontWeight: "bold" }}>
                {(() => { const d = DAYS.find(d => d.id === sel.day); return lang === "en" && d?.labelEN ? d.labelEN : d?.label; })()}
              </span>
            )}
            {price && (
              <span title={lang === "en" ? "Estimated total cost of all ingredients" : "Geschätzte Gesamtkosten aller Zutaten inkl. Grundausstattung"}
                style={{ fontSize: 10, color: "var(--ac)", background: "var(--acbg)", padding: "2px 6px", borderRadius: 8 }}>
                💰 {price}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 4, background: "var(--bdr)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: recipe.color, transition: "width .4s" }}/>
            </div>
            <span style={{ fontSize: 11, color: "var(--tx3)", flexShrink: 0 }}>{done}/{recipe.ingredients.length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className={`btn${FLAGS.springAnimations ? " pulse-select" : ""}`}
              onClick={() => { onToggleSel(recipe.key); haptic(12); if (!isSel) showToast(t('toast_selected')); }}
              style={{ flex: 1, padding: "7px 12px", borderRadius: 10, fontSize: 13, fontWeight: "bold", background: isSel ? recipe.color : "var(--sur2)", color: isSel ? "#fff" : "var(--tx2)", border: `1.5px solid ${isSel ? recipe.color : "var(--bdr)"}` }}>
              {isSel ? t('btn_selected') : t('btn_select')}
            </button>
            {isSel && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--sur2)", borderRadius: 10, padding: "5px 10px", border: "1px solid var(--bdr)" }}>
                <button className="btn" onClick={() => { haptic(8); onServChange(recipe.key, Math.max(1, servings - 1)); }}
                  style={{ fontSize: 18, background: "none", color: "var(--tx)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ fontSize: 13, minWidth: 22, textAlign: "center", color: "var(--tx)", fontWeight: "bold" }}>{servings}</span>
                <button className="btn" onClick={() => { haptic(8); onServChange(recipe.key, Math.min(10, servings + 1)); }}
                  style={{ fontSize: 18, background: "none", color: "var(--tx)", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                <span style={{ fontSize: 10, color: "var(--tx3)" }}>{t('portions_abbrev')}</span>
              </div>
            )}
            {isSel && onMarkCooked && (
              cookedThisWeek ? (
                <div style={{ padding: "7px 10px", borderRadius: 10, fontSize: 13, background: "var(--acbg)", border: "1px solid var(--ac)", color: "var(--ac)", flexShrink: 0, lineHeight: 1.3, textAlign: "center" }}>
                  ✓🍳
                </div>
              ) : cookConfirm ? (
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: 10, color: "var(--tx3)", maxWidth: 70, lineHeight: 1.2 }}>
                    {lang === "en" ? "Deduct pantry?" : "Vorrat abziehen?"}
                  </span>
                  <button className="btn" onClick={() => { haptic([10,30,10]); onMarkCooked(recipe.key); setCookConfirm(false); }}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ac)", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>✓</button>
                  <button className="btn" onClick={() => setCookConfirm(false)}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sur2)", border: "1px solid var(--bdr)", color: "var(--tx2)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              ) : (
                <button className="btn"
                  title={lang === "en" ? "Mark as cooked & deduct pantry" : "Als gekocht markieren & Vorrat abziehen"}
                  onClick={e => { e.stopPropagation(); setCookConfirm(true); }}
                  style={{ padding: "7px 10px", borderRadius: 10, fontSize: 14, background: "var(--sur2)", border: "1px solid var(--bdr)", flexShrink: 0 }}>
                  🍳
                </button>
              )
            )}
          </div>
          {isSel && onDayChange && (
            <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
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
      </div>
    </div>
  );
}
