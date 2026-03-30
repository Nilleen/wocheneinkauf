import { useReducer, useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { FLAGS, SEED } from './constants.js';
import { weekId, weekLabel, weekShort, getSel, fromFB, buildInit, buildDefSel, normIngName, normShop, haptic, parseAmt, scaleAmt } from './utils.js';
import { FB } from './firebase.js';
import { showToast } from './toast.js';
import { initialState, appReducer } from './store.js';
import { LangContext } from './LangContext.jsx';
import { useAuth } from './AuthContext.jsx';

import ToastManager    from './components/ToastManager.jsx';
import RecipeModal     from './components/RecipeModal.jsx';
import AddRecipeModal  from './components/AddRecipeModal.jsx';
import ThisWeekModal   from './components/ThisWeekModal.jsx';
import ConfirmModal    from './components/ConfirmModal.jsx';
import SettingsModal   from './components/SettingsModal.jsx';
import ClaudeModal     from './components/ClaudeModal.jsx';
import RecipesView     from './components/RecipesView.jsx';
import ChecklistView   from './components/ChecklistView.jsx';
import ShoppingView    from './components/ShoppingView.jsx';
import PantryView      from './components/PantryView.jsx';
import LoginScreen     from './components/LoginScreen.jsx';
import JoinCodeModal   from './components/JoinCodeModal.jsx';
import { SkeletonCards } from './components/SmallComponents.jsx';
import { AISLES } from './constants.js';

// ── AUTH GATE ─────────────────────────────────────────────────────────────
// Thin wrapper: handles auth routing only. AppContent holds all hooks.
// Splitting prevents a Rules-of-Hooks violation where hooks after the early
// return would change count between renders as auth status transitions.
export default function App() {
  const authState = useAuth();

  if (authState.status === "loading") return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a2e1f" }}>
      <div style={{ fontSize: 48 }}>🛒</div>
    </div>
  );
  if (authState.status === "none")    return <LoginScreen />;
  if (authState.status === "pending") return <JoinCodeModal />;

  // key resets AppContent (and all its hooks) cleanly when household changes
  return <AppContent authState={authState} key={authState.householdCode || "guest"} />;
}

// ── APP CONTENT ────────────────────────────────────────────────────────────
// All hooks live here — no early returns, so hook order is always stable.
function AppContent({ authState }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const lw = useRef(false);

  const isMember = authState.status === "member";

  const guardWrite = (fn) => (...args) => {
    if (!isMember) { showToast("🔒 Sign in with a join code to edit"); return; }
    return fn(...args);
  };

  // ── Online/offline detection ──
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── Dark mode ──
  useEffect(() => {
    const apply = m => {
      const sys = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", (m === "dark" || (m === "auto" && sys)) ? "dark" : "light");
    };
    apply(state.darkMode);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h  = () => apply(state.darkMode);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [state.darkMode]);

  const setDarkMode = m => { dispatch({ type: "SET_DARK_MODE", v: m }); if (isMember) FB.set(`${FB.settings()}/darkMode`, m); };
  const setLang     = m => { dispatch({ type: "SET_LANG",      v: m }); if (isMember) FB.set(`${FB.settings()}/lang`,     m); };

  // ── Android back button ──
  useEffect(() => {
    window.history.replaceState({ app: "base" }, "");
    window.history.pushState({ app: "modal" }, "");
    const handle = () => {
      const { selRecipe, showReset, showSettings, showThisWeek, showClaude, showAddRecipe } = state;
      if (selRecipe)    dispatch({ type: "CLOSE_RECIPE" });
      else if (showReset)     dispatch({ type: "HIDE_MODAL", modal: "showReset" });
      else if (showSettings)  dispatch({ type: "HIDE_MODAL", modal: "showSettings" });
      else if (showThisWeek)  dispatch({ type: "HIDE_MODAL", modal: "showThisWeek" });
      else if (showClaude)    dispatch({ type: "HIDE_MODAL", modal: "showClaude" });
      else if (showAddRecipe) dispatch({ type: "HIDE_MODAL", modal: "showAddRecipe" });
      window.history.pushState({ app: "modal" }, "");
    };
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, [state.selRecipe, state.showReset, state.showSettings, state.showThisWeek, state.showClaude, state.showAddRecipe]);

  // ── iOS PWA prompt ──
  useEffect(() => {
    if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone)
      dispatch({ type: "SHOW_MODAL", modal: "showPWA" });
  }, []);

  // ── Firebase init + subscribe (members only) ──
  // Guests see SEED recipes with no Firebase reads/writes.
  useEffect(() => {
    if (!isMember) {
      // Guest: load built-in SEED recipes directly, no Firebase needed
      const fb = {};
      SEED.forEach(r => {
        const ings = {};
        r.ingredients.forEach(i => { ings[i.id] = { name: i.name, amount: i.amount, aisle: i.aisle }; });
        fb[r.key] = { ...r, ingredients: ings };
      });
      dispatch({ type: "SET_RECIPES", v: fromFB(fb) });
      dispatch({ type: "SET_ING_STATE", v: buildInit(SEED) });
      dispatch({ type: "SET_SELS",      v: buildDefSel(SEED) });
      dispatch({ type: "SET_LOADING",   v: false });
      dispatch({ type: "SET_SYNC",      v: "synced" });
      return;
    }

    const { weekId: wid } = state;
    (async () => {
      const snap = await FB.getOnce(FB.recipes());
      if (!snap) {
        const fb = {};
        SEED.forEach(r => {
          const ings = {};
          r.ingredients.forEach(i => { ings[i.id] = { name: i.name, amount: i.amount, aisle: i.aisle }; });
          fb[r.key] = { name: r.name, emoji: r.emoji, color: r.color, kcal: r.kcal || null, prepMins: r.prepMins || null, cookMins: r.cookMins || null, description: r.description, time: r.time, difficulty: r.difficulty, order: r.order, pantryItems: r.pantryItems, instructions: r.instructions, ingredients: ings };
        });
        await FB.set(FB.recipes(), fb);
        await FB.set(FB.weekState(wid), buildInit(SEED));
        await FB.set(FB.weekSel(wid),   buildDefSel(SEED));
      } else {
        const patches = [];
        SEED.forEach(s => {
          const fb = snap[s.key];
          if (fb && (fb.prepMins == null || fb.cookMins == null))
            patches.push(FB.update(`${FB.recipes()}/${s.key}`, { prepMins: s.prepMins, cookMins: s.cookMins }));
        });
        if (patches.length) await Promise.all(patches);
      }
    })();

    const unsubs = [];
    const sub = (path, cb) => {
      const u = FB.sub(path, cb, e => { console.error(e); dispatch({ type: "SET_SYNC", v: "error" }); });
      unsubs.push(u);
    };

    sub(FB.recipes(), d => { dispatch({ type: "SET_SYNC", v: "synced" }); dispatch({ type: "SET_LOADING", v: false }); if (d) dispatch({ type: "SET_RECIPES", v: fromFB(d) }); });
    sub(FB.weekState(wid), d => { if (!lw.current && d) dispatch({ type: "SET_ING_STATE", v: d }); else if (!d) dispatch({ type: "SET_ING_STATE", v: buildInit(SEED) }); });
    sub(FB.weekSel(wid),   d => { if (d) dispatch({ type: "SET_SELS", v: d }); else dispatch({ type: "SET_SELS", v: buildDefSel(SEED) }); });
    sub(FB.favs(), d => dispatch({ type: "SET_PROFILE", v: { favourites: d || {} } }));
    sub(`${FB.profile()}/ratings`,    d => dispatch({ type: "SET_PROFILE", v: { ratings:    d || {} } }));
    sub(`${FB.profile()}/notes`,      d => dispatch({ type: "SET_PROFILE", v: { notes:      d || {} } }));
    sub(`${FB.profile()}/lastCooked`, d => dispatch({ type: "SET_PROFILE", v: { lastCooked: d || {} } }));
    sub(FB.pantryCustom(), d => dispatch({ type: "SET_CUSTOM_PANTRY", v: d || {} }));
    sub(FB.pantryInv(),    d => dispatch({ type: "SET_PANTRY_INV",    v: d || {} }));
    sub(FB.history(),      d => dispatch({ type: "SET_HISTORY",       v: d || {} }));
    sub(FB.settings(),     d => {
      if (d?.darkMode) dispatch({ type: "SET_DARK_MODE", v: d.darkMode });
      if (d?.lang)     dispatch({ type: "SET_LANG",      v: d.lang });
    });

    return () => unsubs.forEach(u => u());
  }, [state.weekId, isMember]);

  // ── Update handlers (all writes guarded) ──
  const updateIng = guardWrite(useCallback((id, field, value) => {
    lw.current = true;
    dispatch({ type: "PATCH_ING", id, patch: { [field]: value } });
    FB.update(`${FB.weekState(state.weekId)}/${id}`, { [field]: value }).then(() => setTimeout(() => lw.current = false, 400));
  }, [state.weekId]));

  const setIngStatus = guardWrite(useCallback((id, status) => {
    lw.current = true;
    dispatch({ type: "PATCH_ING", id, patch: { status } });
    FB.update(`${FB.weekState(state.weekId)}/${id}`, { status }).then(() => setTimeout(() => lw.current = false, 400));
  }, [state.weekId]));

  const saveIngName = guardWrite(useCallback((rk, id, name) => {
    FB.update(`${FB.recipes()}/${rk}/ingredients/${id}`, { name });
  }, []));

  const toggleSel = guardWrite(useCallback((key) => {
    const cur  = getSel(state.sels, key);
    const next = { ...cur, selected: !cur.selected };
    dispatch({ type: "PATCH_SEL", key, patch: { selected: next.selected } });
    FB.set(`${FB.weekSel(state.weekId)}/${key}`, next);
  }, [state.sels, state.weekId]));

  const changeServings = guardWrite(useCallback((key, srv) => {
    const cur  = getSel(state.sels, key);
    const next = { ...cur, servings: srv };
    dispatch({ type: "PATCH_SEL", key, patch: { servings: srv } });
    FB.set(`${FB.weekSel(state.weekId)}/${key}`, next);
  }, [state.sels, state.weekId]));

  const changeDay = guardWrite(useCallback((key, day) => {
    const cur  = getSel(state.sels, key);
    const next = { ...cur, day: day || null };
    dispatch({ type: "PATCH_SEL", key, patch: { day: day || null } });
    FB.set(`${FB.weekSel(state.weekId)}/${key}`, next);
  }, [state.sels, state.weekId]));

  const toggleFav = guardWrite(useCallback((key) => {
    const next = !state.profile.favourites?.[key];
    dispatch({ type: "SET_FAV", key, v: next });
    FB.set(`${FB.favs()}/${key}`, next || null);
    if (next) showToast(state.lang === "en" ? "⭐ Favourite saved" : "⭐ Favorit gespeichert");
  }, [state.profile.favourites, state.lang]));

  const setRating = guardWrite(useCallback((key, v) => {
    dispatch({ type: "SET_RATING", key, v });
    FB.set(`${FB.profile()}/ratings/${key}`, v);
  }, []));

  const setNote = guardWrite(useCallback((key, v) => {
    dispatch({ type: "SET_NOTE", key, v });
    FB.set(`${FB.profile()}/notes/${key}`, v);
  }, []));

  // ── Reset / archive ──
  const handleReset = () => {
    const { weekId: wid, ingState, recipes: recs, pantryInventory: pInv } = state;
    haptic([10, 50, 10]);
    const archiveSnap = { meta: { label: weekLabel(wid) }, selections: state.sels, state: ingState };
    FB.set(`${FB.history()}/${wid}`, archiveSnap);
    const selKeys = Object.keys(state.sels).filter(k => state.sels[k]?.selected);
    selKeys.forEach(k => FB.set(`${FB.profile()}/lastCooked/${k}`, wid));
    const idToNorm = {};
    recs.forEach(r => r.ingredients.forEach(i => { idToNorm[i.id] = normIngName(i.name); }));
    const fresh = {};
    Object.keys(ingState).forEach(id => {
      const k = idToNorm[id];
      const hasPantryQty = k && pInv?.[k]?.qty;
      fresh[id] = hasPantryQty
        ? { ...ingState[id], status: "full" }
        : { ...ingState[id], status: "none", have: "" };
    });
    lw.current = true;
    FB.set(FB.weekState(wid), fresh).then(() => setTimeout(() => lw.current = false, 500));
    dispatch({ type: "SET_ING_STATE", v: fresh });
    dispatch({ type: "HIDE_MODAL", modal: "showReset" });
    showToast(state.lang === "en" ? `✓ Reset — ${weekShort(wid)} archived` : `✓ Zurückgesetzt — ${weekShort(wid)} archiviert`);
  };

  // ── Mark recipe as cooked — deduct pantry inventory ──
  const handleMarkCooked = useCallback((recipeKey) => {
    const recipe = state.recipes.find(r => r.key === recipeKey);
    if (!recipe) return;
    const servings = getSel(state.sels, recipeKey).servings || 2;
    FB.set(`${FB.profile()}/lastCooked/${recipeKey}`, state.weekId);
    const toG  = (n, u) => { if (!u || u === "g") return n; if (u === "kg") return n * 1000; if (u === "el") return n * 15; if (u === "tl") return n * 5; return null; };
    const toMl = (n, u) => { if (u === "ml") return n; if (u === "l") return n * 1000; if (u === "el") return n * 15; if (u === "tl") return n * 5; return null; };
    recipe.ingredients.forEach(ing => {
      const k   = normIngName(ing.name);
      const inv = state.pantryInventory[k];
      if (!inv?.qty) return;
      const currentQty = parseFloat(inv.qty) || 0;
      const used = parseAmt(scaleAmt(ing.amount, servings / 2));
      if (!used) return;
      const invUnit  = (inv.unit || "g").toLowerCase();
      const usedUnit = used.unit.toLowerCase();
      let usedInUnit = null;
      if (invUnit === usedUnit)   usedInUnit = used.num;
      else if (invUnit === "g")   usedInUnit = toG(used.num, usedUnit);
      else if (invUnit === "ml")  usedInUnit = toMl(used.num, usedUnit);
      if (usedInUnit === null) return;
      const remaining = Math.max(0, Math.round((currentQty - usedInUnit) * 10) / 10);
      if (remaining === 0) FB.remove(`${FB.pantryInv()}/${k}`);
      else FB.set(`${FB.pantryInv()}/${k}`, { qty: String(remaining), unit: inv.unit, lastUpdated: Date.now() });
    });
    haptic([10, 50, 10]);
    showToast(state.lang === "en" ? "🍳 Cooked! Pantry updated" : "🍳 Gekocht! Vorrat aktualisiert");
  }, [state.recipes, state.sels, state.pantryInventory, state.weekId, state.lang]);

  // ── Week navigation ──
  const navigateWeek = async (dir) => {
    const newOffset = state.weekOffset + dir;
    const newWid    = weekId(newOffset);
    const selKeys   = Object.keys(state.sels).filter(k => state.sels[k]?.selected);
    if (dir > 0 && selKeys.length > 0) {
      const archiveSnap = { meta: { label: weekLabel(state.weekId) }, selections: state.sels, state: state.ingState };
      await FB.set(`${FB.history()}/${state.weekId}`, archiveSnap);
    }
    dispatch({ type: "SET_WEEK", offset: newOffset });
  };

  // ── Share ──
  const handleShare = async () => {
    let text = "🛒 Einkaufsliste\n\n";
    const selRecs = state.recipes.filter(r => getSel(state.sels, r.key).selected);
    const groups  = {};
    selRecs.forEach(r => r.ingredients.forEach(ing => {
      if (state.ingState[ing.id]?.status === "full") return;
      const a = ing.aisle || "other";
      if (!groups[a]) groups[a] = [];
      groups[a].push(`${normShop(ing.name)} – ${ing.amount}`);
    }));
    Object.entries(groups).sort((a, b) => (AISLES[a[0]]?.order || 99) - (AISLES[b[0]]?.order || 99))
      .forEach(([a, items]) => { text += `${AISLES[a]?.label || "Sonstiges"}\n${items.map(i => `• ${i}`).join("\n")}\n\n`; });
    try {
      if (navigator.share) await navigator.share({ title: "Einkaufsliste", text });
      else { await navigator.clipboard.writeText(text); showToast("📋 In Zwischenablage kopiert!"); }
    } catch (e) {}
  };

  const handleAddRecipe = async (recipe) => {
    await FB.set(`${FB.recipes()}/${recipe.key}`, recipe);
    const ingIds = Object.keys(recipe.ingredients || {});
    for (const id of ingIds) await FB.set(`${FB.weekState(state.weekId)}/${id}`, { have: "", status: "none", note: "" });
    await FB.set(`${FB.weekSel(state.weekId)}/${recipe.key}`, { selected: false, servings: 2 });
  };

  const { recipes, ingState, sels, profile, customPantry, pantryInventory, history, darkMode, lang, loading, sync, weekId: wid, weekOffset } = state;

  const selIngAll    = useMemo(() => recipes.filter(r => getSel(sels, r.key).selected).flatMap(r => r.ingredients), [recipes, sels]);
  const fullCount    = selIngAll.filter(i => ingState[i.id]?.status === "full").length;
  const missingCount = selIngAll.filter(i => ingState[i.id]?.status !== "full").length;
  const total        = selIngAll.length;
  const sc = { connecting: "#f0a500", synced: "#4a7c59", syncing: "#f0a500", error: "#c0392b" }[sync] || "#f0a500";
  const EN = lang === "en";
  const st = EN
    ? { connecting: "Connecting…", synced: "Synced ✓", syncing: "Saving…", error: "Error" }[sync]
    : { connecting: "Verbinde…",   synced: "Synchronisiert ✓", syncing: "Speichert…", error: "Fehler" }[sync];

  const TABS = [
    { id: "recipes",   icon: "📖", label: EN ? "Recipes"   : "Rezepte" },
    { id: "checklist", icon: "📋", label: EN ? "Checklist" : "Checkliste" },
    { id: "shopping",  icon: "🛒", label: `${EN ? "Shopping" : "Einkauf"}${missingCount > 0 ? ` (${missingCount})` : ""}` },
    { id: "pantry",    icon: "🥦", label: EN ? "Pantry"    : "Vorrat" },
  ];

  return (
    <LangContext.Provider value={lang}>
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <ToastManager/>

      {/* Modals */}
      {state.selRecipe && (
        <RecipeModal recipe={state.selRecipe} ingState={ingState} sels={sels} profile={profile}
          onClose={() => dispatch({ type: "CLOSE_RECIPE" })} onServChange={changeServings}
          onSetRating={setRating} onSetNote={setNote}/>
      )}
      {state.showAddRecipe && <AddRecipeModal onSave={handleAddRecipe} onClose={() => dispatch({ type: "HIDE_MODAL", modal: "showAddRecipe" })}/>}
      {state.showThisWeek && (
        <ThisWeekModal recipes={recipes} sels={sels} ingState={ingState} weekId={wid}
          onServChange={changeServings} onDayChange={changeDay} onToggleSel={toggleSel}
          onMarkCooked={handleMarkCooked} profile={profile}
          onClearAll={() => { recipes.forEach(r => { if (getSel(sels, r.key).selected) toggleSel(r.key); }); dispatch({ type: "HIDE_MODAL", modal: "showThisWeek" }); }}
          onClose={() => dispatch({ type: "HIDE_MODAL", modal: "showThisWeek" })}
          onOpenRecipe={r => { dispatch({ type: "OPEN_RECIPE", recipe: r }); dispatch({ type: "HIDE_MODAL", modal: "showThisWeek" }); }}/>
      )}
      {state.showReset && (
        <ConfirmModal emoji="🔄"
          title={EN ? "Reset all statuses?" : "Alle Status zurücksetzen?"}
          confirmLabel={EN ? "Reset & Archive" : "Zurücksetzen & Archivieren"}
          body={EN ? `Resets everything to ❌ and archives ${weekShort(wid)}.` : `Setzt alles auf ❌ und archiviert ${weekShort(wid)}.`}
          extra={Object.keys(history).length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: "var(--tx3)" }}>📚 {Object.keys(history).length} {EN ? "week(s) archived" : "Woche(n) archiviert"}</div>}
          onConfirm={handleReset}
          onCancel={() => dispatch({ type: "HIDE_MODAL", modal: "showReset" })}/>
      )}
      {state.showSettings && <SettingsModal darkMode={darkMode} onDarkMode={guardWrite(setDarkMode)} lang={lang} onLangChange={guardWrite(setLang)} history={history} authState={authState} onClose={() => dispatch({ type: "HIDE_MODAL", modal: "showSettings" })}/>}
      {state.showClaude  && <ClaudeModal recipes={recipes} ingState={ingState} sels={sels} onClose={() => dispatch({ type: "HIDE_MODAL", modal: "showClaude" })}/>}

      {/* Header */}
      <div style={{ background: "var(--hd)", padding: "14px 16px 10px", boxShadow: "0 2px 12px rgba(0,0,0,.18)", flexShrink: 0 }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ color: "var(--ht)", margin: 0, fontSize: 16, fontWeight: "normal" }}>{EN ? "🛒 Weekly Shop" : "🛒 Wocheneinkauf"}</h1>
              {FLAGS.weekNav && (
                <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 2 }}>
                  <button className="btn" onClick={() => navigateWeek(-1)}
                    style={{ fontSize: 20, color: "var(--hs)", background: "none", padding: "2px 8px", lineHeight: 1, minWidth: 36, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                  <span style={{ fontSize: 11, color: "var(--hs)", minWidth: 36, textAlign: "center" }}>{weekShort(wid)}</span>
                  <button className="btn" onClick={() => navigateWeek(1)}
                    style={{ fontSize: 20, color: "var(--hs)", background: "none", padding: "2px 8px", lineHeight: 1, minWidth: 36, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc, display: "inline-block", marginLeft: 4 }} className={(sync === "connecting" || sync === "syncing") ? "pls" : ""}/>
                </div>
              )}
              {!FLAGS.weekNav && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc, display: "inline-block" }} className={(sync === "connecting" || sync === "syncing") ? "pls" : ""}/>
                  <span style={{ color: "var(--hs)", fontSize: 11 }}>{st}</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button className="btn" onClick={() => dispatch({ type: "SHOW_MODAL", modal: "showThisWeek" })}
                style={{ fontSize: 18, color: "var(--hs)", background: "none", padding: "2px 6px" }} title="Diese Woche">📅</button>
              {state.view === "checklist" && (
                <button className="btn" onClick={() => dispatch({ type: "SHOW_MODAL", modal: "showReset" })}
                  style={{ fontSize: 18, color: "var(--hs)", background: "none", padding: "2px 6px" }} title="Reset">🔄</button>
              )}
              <button className="btn" onClick={() => dispatch({ type: "SHOW_MODAL", modal: "showAddRecipe" })}
                style={{ fontSize: 18, color: "var(--hs)", background: "none", padding: "2px 6px" }} title="Rezept hinzufügen">➕</button>
              <button className="btn" onClick={() => dispatch({ type: "SHOW_MODAL", modal: "showSettings" })}
                style={{ fontSize: 18, color: "var(--hs)", background: "none", padding: "2px 6px" }}>⚙️</button>
            </div>
          </div>
          {total > 0 && (
            <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
              <div className="prog" style={{ flex: 1 }}><div className="progf" style={{ width: `${(fullCount / total) * 100}%` }}/></div>
              <span style={{ fontSize: 11, color: "var(--hs)", flexShrink: 0 }}>{fullCount}/{total}</span>
            </div>
          )}
        </div>
      </div>

      {!isOnline && (
        <div style={{ background: "#555", color: "#fff", padding: "8px 16px", fontSize: 12, textAlign: "center", flexShrink: 0 }}>
          {EN ? "📴 Offline — changes will sync when reconnected" : "📴 Offline — Änderungen werden gespeichert sobald du wieder verbunden bist"}
        </div>
      )}
      {state.showPWA && (
        <div style={{ background: "var(--ac)", color: "#fff", padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ flex: 1 }}>{EN ? "📲 Add to home screen: Share → 'Add to Home Screen'" : "📲 Zum Startbildschirm: Teilen → \"Zum Home-Bildschirm\""}</span>
          <button className="btn" onClick={() => dispatch({ type: "HIDE_MODAL", modal: "showPWA" })} style={{ color: "#fff", fontSize: 18, background: "none" }}>✕</button>
        </div>
      )}
      {sync === "error" && (
        <div style={{ background: "var(--dan)", color: "#fff", padding: "8px 16px", fontSize: 12, textAlign: "center", flexShrink: 0 }}>
          {EN ? "❌ Firebase error — check database rules" : "❌ Firebase-Fehler — Datenbankregeln prüfen"}
        </div>
      )}

      {/* Guest banner */}
      {authState.status === "guest" && (
        <div style={{ background: "var(--acbg)", borderBottom: "1px solid var(--ac)", padding: "8px 16px", fontSize: 12, textAlign: "center", color: "var(--ac)", flexShrink: 0 }}>
          👀 {EN ? "Guest mode — sign in to save changes" : "Gastmodus — anmelden um Änderungen zu speichern"}
        </div>
      )}

      {/* Content */}
      <div className="scroll" style={{ paddingBottom: "calc(var(--nav) + var(--sab) + 32px)" }}>
        {loading ? (
          FLAGS.skeletonLoading ? <SkeletonCards/> : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tx3)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div><div>{EN ? "Loading recipes…" : "Lade Rezepte…"}</div>
            </div>
          )
        ) : (
          <>
            {state.view === "recipes" && (
              <RecipesView recipes={recipes} ingState={ingState} sels={sels} profile={profile}
                currentWeekId={wid} pantryInventory={pantryInventory}
                onToggleSel={toggleSel} onToggleFav={toggleFav} onServChange={changeServings}
                onDayChange={changeDay} onMarkCooked={handleMarkCooked}
                onOpenRecipe={r => dispatch({ type: "OPEN_RECIPE", recipe: r })}/>
            )}
            {state.view === "checklist" && (
              <ChecklistView recipes={recipes} ingState={ingState} sels={sels}
                updateIng={updateIng} setIngStatus={setIngStatus} saveIngName={saveIngName}/>
            )}
            {state.view === "shopping" && (
              <ShoppingView recipes={recipes} ingState={ingState} sels={sels}
                onShare={handleShare} setIngStatus={setIngStatus} pantryInventory={pantryInventory}
                onUpdatePantryInv={guardWrite((k, v) => v ? FB.set(`${FB.pantryInv()}/${k}`, v) : FB.remove(`${FB.pantryInv()}/${k}`))}/>

            )}
            {state.view === "pantry" && (
              <PantryView recipes={recipes} ingState={ingState} customPantry={customPantry}
                pantryInventory={pantryInventory} updateIng={updateIng} setIngStatus={setIngStatus}
                onAdd={guardWrite((id, d) => FB.set(`${FB.pantryCustom()}/${id}`, d))}
                onRemove={guardWrite(id => FB.remove(`${FB.pantryCustom()}/${id}`))}
                onUpdatePantryInv={guardWrite((k, v) => v ? FB.set(`${FB.pantryInv()}/${k}`, v) : FB.remove(`${FB.pantryInv()}/${k}`))}/>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {(state.view === "checklist" || state.view === "shopping") && (
        <button className="fab bounce-in" style={{ width: 44, height: 44, fontSize: 18 }}
          onClick={() => dispatch({ type: "SHOW_MODAL", modal: "showClaude" })} title="Claude öffnen">🤖</button>
      )}

      {/* Bottom nav */}
      <div className="bnav">
        {TABS.map(t => (
          <button key={t.id} className={`nbt${state.view === t.id ? " on" : ""}`}
            onClick={() => dispatch({ type: "SET_VIEW", view: t.id })}>
            <span className="ni">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
    </LangContext.Provider>
  );
}
