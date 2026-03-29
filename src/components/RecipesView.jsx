import { useState, useMemo } from 'react';
import { FLAGS, PROTEINS } from '../constants.js';
import { getSel, detectProtein, weekShort, normIngName } from '../utils.js';
import { FB } from '../firebase.js';
import RecipeCard from './RecipeCard.jsx';
import QuickRatingSheet from './QuickRatingSheet.jsx';

export default function RecipesView({ recipes, ingState, sels, profile, currentWeekId, pantryInventory, onToggleSel, onToggleFav, onServChange, onDayChange, onOpenRecipe }) {
  const [q,            setQ]           = useState("");
  const [pFilter,      setPFilter]     = useState("all");
  const [diffFilter,   setDiffFilter]  = useState("all");
  const [timeFilter,   setTimeFilter]  = useState("all");
  const [activeFilter, setActiveFilter]= useState(false);
  const [kcalFilter,   setKcalFilter]  = useState("all");
  const [sortBy,       setSortBy]      = useState("order");
  const [favOnly,      setFavOnly]     = useState(false);
  const [pantryReady,  setPantryReady] = useState(false);
  const [longPressRecipe, setLongPressRecipe] = useState(null);

  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return recipes.filter(r => {
      if (favOnly && !profile?.favourites?.[r.key]) return false;
      if (pantryReady) {
        const total = r.ingredients.length;
        if (total === 0) return false;
        const haveCount = r.ingredients.filter(i => {
          const k = normIngName(i.name);
          return ingState[i.id]?.status === "full" || pantryInventory?.[k]?.qty > 0;
        }).length;
        if (haveCount / total < 0.7) return false;
      }
      if (pFilter !== "all" && detectProtein(r) !== pFilter) return false;
      if (diffFilter !== "all" && r.difficulty !== diffFilter) return false;
      if (timeFilter !== "all") {
        const parts = r.time.match(/\d+/g) || ["0"];
        const t = parseInt(parts[parts.length - 1]);
        if (timeFilter === "25" && t > 25) return false;
        if (timeFilter === "35" && t > 35) return false;
        if (timeFilter === "45" && t > 45) return false;
      }
      if (activeFilter && FLAGS.prepCookSplit) {
        if ((r.prepMins || 99) > 20) return false;
      }
      if (kcalFilter !== "all" && r.kcal) {
        if (kcalFilter === "700" && r.kcal > 700) return false;
        if (kcalFilter === "850" && r.kcal > 850) return false;
        if (kcalFilter === "950" && r.kcal > 950) return false;
      }
      if (!lq) return true;
      if (r.name.toLowerCase().includes(lq)) return true;
      if (r.description.toLowerCase().includes(lq)) return true;
      if (r.ingredients.some(i => i.name.toLowerCase().includes(lq))) return true;
      return false;
    }).sort((a, b) => {
      if (sortBy === "order")   return a.order - b.order;
      if (sortBy === "time")    { const tm = x => { const p = (x.time || "0").match(/\d+/g) || ["0"]; return parseInt(p[p.length - 1]); }; return tm(a) - tm(b); }
      if (sortBy === "kcal")    return (a.kcal || 999) - (b.kcal || 999);
      if (sortBy === "rating")  return (profile?.ratings?.[b.key] || 0) - (profile?.ratings?.[a.key] || 0);
      if (sortBy === "stocked") {
        const pctA = a.ingredients.filter(i => ingState[i.id]?.status === "full").length / a.ingredients.length;
        const pctB = b.ingredients.filter(i => ingState[i.id]?.status === "full").length / b.ingredients.length;
        return pctB - pctA;
      }
      return 0;
    });
  }, [recipes, ingState, sels, profile, pantryInventory, q, pFilter, diffFilter, timeFilter, activeFilter, kcalFilter, sortBy, favOnly, pantryReady]);

  const selectedCount = recipes.filter(r => getSel(sels, r.key).selected).length;
  const anyFilter = favOnly || pantryReady || pFilter !== "all" || diffFilter !== "all" || timeFilter !== "all" || kcalFilter !== "all" || activeFilter;

  return (
    <div style={{ padding: "12px 12px 20px", maxWidth: 660, margin: "0 auto" }}>
      {longPressRecipe && (
        <QuickRatingSheet recipe={longPressRecipe} profile={profile}
          onSetRating={(k, v) => { FB.set(`${FB.favs()}/${k}/rating`, v); }}
          onSetNote={(k, v) => { FB.set(`${FB.favs()}/${k}/notes`, v); }}
          onClose={() => setLongPressRecipe(null)}/>
      )}
      <input className="sbar" placeholder="🔍 Rezepte, Zutaten, Protein…" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 8 }}/>
      <div style={{ marginBottom: 12 }}>
        <div className="fbar" style={{ gap: 6, paddingBottom: 8 }}>
          <button className={`chip${favOnly ? " on" : ""}`} onClick={() => setFavOnly(f => !f)}>⭐ Favoriten</button>
          <button className={`chip${pantryReady ? " on" : ""}`} onClick={() => setPantryReady(f => !f)}>🧺 Aus Vorrat</button>
          <div style={{ width: 1, background: "var(--bdr)", flexShrink: 0, alignSelf: "stretch", margin: "4px 0" }}/>
          {FLAGS.prepCookSplit && <button className={`chip${activeFilter ? " on" : ""}`} onClick={() => setActiveFilter(f => !f)}>⚡ Aktiv ≤20 Min</button>}
          <button className={`chip${timeFilter === "25" ? " on" : ""}`} onClick={() => setTimeFilter(timeFilter === "25" ? "all" : "25")}>⚡ &lt;25 Min</button>
          <button className={`chip${timeFilter === "35" ? " on" : ""}`} onClick={() => setTimeFilter(timeFilter === "35" ? "all" : "35")}>⏱ &lt;35 Min</button>
          <div style={{ width: 1, background: "var(--bdr)", flexShrink: 0, alignSelf: "stretch", margin: "4px 0" }}/>
          <button className={`chip${kcalFilter === "700" ? " on" : ""}`} onClick={() => setKcalFilter(kcalFilter === "700" ? "all" : "700")}>🔥 &lt;700</button>
          <button className={`chip${kcalFilter === "850" ? " on" : ""}`} onClick={() => setKcalFilter(kcalFilter === "850" ? "all" : "850")}>🔥 &lt;850</button>
          <div style={{ width: 1, background: "var(--bdr)", flexShrink: 0, alignSelf: "stretch", margin: "4px 0" }}/>
          {Object.entries(PROTEINS).map(([k, p]) => (
            <button key={k} className={`chip${pFilter === k ? " on" : ""}`}
              onClick={() => setPFilter(pFilter === k ? "all" : k)}
              style={pFilter === k ? { borderColor: p.color, background: p.color + "22", color: p.color } : {}}>
              {p.emoji} {p.label}
            </button>
          ))}
          <div style={{ width: 1, background: "var(--bdr)", flexShrink: 0, alignSelf: "stretch", margin: "4px 0" }}/>
          <button className={`chip${diffFilter === "Einfach" ? " on" : ""}`} onClick={() => setDiffFilter(diffFilter === "Einfach" ? "all" : "Einfach")}>🟢 Einfach</button>
          <button className={`chip${diffFilter === "Mittel"  ? " on" : ""}`} onClick={() => setDiffFilter(diffFilter === "Mittel"  ? "all" : "Mittel")}>🟡 Mittel</button>
          <div style={{ width: 1, background: "var(--bdr)", flexShrink: 0, alignSelf: "stretch", margin: "4px 0" }}/>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: 20, fontSize: 12, border: "1.5px solid var(--bdr)", color: "var(--tx)", flexShrink: 0, background: "var(--sur)" }}>
            <option value="order">🔢 Standard</option>
            <option value="stocked">✅ Vorrätig</option>
            <option value="time">⏱ Zeit</option>
            <option value="kcal">🔥 kcal</option>
            <option value="rating">⭐ Bewertung</option>
          </select>
        </div>
        {anyFilter && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
            <span style={{ fontSize: 11, color: "var(--tx3)" }}>Aktiv:</span>
            {favOnly      && <span style={{ fontSize: 11, background: "var(--acbg)", color: "var(--ac)", padding: "2px 8px", borderRadius: 10 }}>⭐ Fav</span>}
            {pantryReady  && <span style={{ fontSize: 11, background: "var(--acbg)", color: "var(--ac)", padding: "2px 8px", borderRadius: 10 }}>🧺 Vorrat ≥70%</span>}
            {activeFilter && <span style={{ fontSize: 11, background: "var(--acbg)", color: "var(--ac)", padding: "2px 8px", borderRadius: 10 }}>⚡ Aktiv</span>}
            {pFilter !== "all" && <span style={{ fontSize: 11, background: PROTEINS[pFilter].color + "22", color: PROTEINS[pFilter].color, padding: "2px 8px", borderRadius: 10 }}>{PROTEINS[pFilter].emoji} {PROTEINS[pFilter].label}</span>}
            {diffFilter !== "all" && <span style={{ fontSize: 11, background: "var(--acbg)", color: "var(--ac)", padding: "2px 8px", borderRadius: 10 }}>{diffFilter}</span>}
            {timeFilter !== "all" && <span style={{ fontSize: 11, background: "var(--acbg)", color: "var(--ac)", padding: "2px 8px", borderRadius: 10 }}>{"<" + timeFilter + " Min"}</span>}
            {kcalFilter !== "all" && <span style={{ fontSize: 11, background: "var(--acbg)", color: "var(--ac)", padding: "2px 8px", borderRadius: 10 }}>{"<" + kcalFilter + " kcal"}</span>}
            <button className="btn"
              onClick={() => { setFavOnly(false); setPantryReady(false); setPFilter("all"); setDiffFilter("all"); setTimeFilter("all"); setKcalFilter("all"); setActiveFilter(false); }}
              style={{ fontSize: 11, color: "var(--dan)", background: "none", padding: "2px 4px", marginLeft: "auto" }}>× Alles zurücksetzen</button>
          </div>
        )}
      </div>
      {selectedCount > 0 && (
        <div style={{ fontSize: 12, color: "var(--ac)", marginBottom: 10, padding: "6px 12px", background: "var(--acbg)", borderRadius: 8 }}>
          ✅ {selectedCount} Rezept{selectedCount > 1 ? "e" : ""} ausgewählt für <strong>{weekShort(currentWeekId)}</strong>
        </div>
      )}
      {filtered.map(recipe => (
        <RecipeCard key={recipe.key} recipe={recipe} ingState={ingState} sels={sels} profile={profile}
          currentWeekId={currentWeekId} pantryInventory={pantryInventory}
          onToggleSel={onToggleSel} onToggleFav={onToggleFav} onServChange={onServChange}
          onDayChange={onDayChange} onOpenRecipe={onOpenRecipe} onLongPress={r => setLongPressRecipe(r)}/>
      ))}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tx3)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div>Keine Rezepte gefunden.</div>
        </div>
      )}
    </div>
  );
}
