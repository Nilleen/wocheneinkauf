import { useState, useEffect } from 'react';
import { FLAGS, PROTEINS, SE } from '../constants.js';
import { getSel, detectProtein, scaleAmt, needAmt, normIngName, normShop, estimateRecipePrice } from '../utils.js';
import { ProteinTag, StarRating } from './SmallComponents.jsx';
import { weekShort } from '../utils.js';
import { REWE_PRICES } from '../constants.js';

export default function RecipeModal({ recipe, ingState, sels, onClose, onServChange, profile, onSetRating, onSetNote }) {
  const srv   = getSel(sels, recipe.key).servings || 2;
  const mult  = srv / 2;
  const ptype = detectProtein(recipe);
  const rating     = profile?.ratings?.[recipe.key] || 0;
  const note       = profile?.notes?.[recipe.key] || "";
  const lastCooked = profile?.lastCooked?.[recipe.key];
  const [showNotes, setShowNotes] = useState(false);
  const [localNote, setLocalNote] = useState(note);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const prep = recipe.prepMins || 0;
  const cook = recipe.cookMins || 0;
  const tot  = prep + cook || 1;
  const prepPct = Math.round((prep / tot) * 100);
  const cookPct = 100 - prepPct;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sup" onClick={e => e.stopPropagation()}>
        {recipe.photo ? (
          <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
            <img src={recipe.photo} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }}/>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.6))" }}/>
            <button onClick={onClose} className="btn"
              style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,.35)", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 18px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <ProteinTag type={ptype}/>
                <span style={{ background: "rgba(255,255,255,.2)", color: "#fff", borderRadius: 10, padding: "3px 8px", fontSize: 11 }}>{recipe.difficulty}</span>
                {recipe.kcal && <span style={{ background: "rgba(255,255,255,.2)", color: "#fff", borderRadius: 10, padding: "3px 8px", fontSize: 11 }}>🔥 {recipe.kcal} kcal/P</span>}
              </div>
              <h2 style={{ color: "#fff", fontWeight: "normal", fontSize: 18, textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>{recipe.name}</h2>
            </div>
          </div>
        ) : (
          <div style={{ padding: "20px 20px 14px", background: recipe.color, position: "relative" }}>
            <button onClick={onClose} className="btn"
              style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.2)", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{recipe.emoji}</div>
            <h2 style={{ color: "#fff", fontWeight: "normal", fontSize: 18, marginBottom: 6 }}>{recipe.name}</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ProteinTag type={ptype}/>
              <span style={{ fontSize: 12, background: "rgba(255,255,255,.2)", padding: "2px 8px", borderRadius: 10, color: "rgba(255,255,255,.9)" }}>{recipe.difficulty}</span>
              {recipe.kcal && <span style={{ fontSize: 12, background: "rgba(255,255,255,.2)", padding: "2px 8px", borderRadius: 10, color: "rgba(255,255,255,.9)" }}>🔥 {recipe.kcal}</span>}
              {FLAGS.prepCookSplit && recipe.prepMins && <span style={{ fontSize: 12, background: "rgba(255,255,255,.2)", padding: "2px 8px", borderRadius: 10, color: "rgba(255,255,255,.9)" }}>✋ {recipe.prepMins} · 🔥 {recipe.cookMins}</span>}
            </div>
          </div>
        )}

        <div style={{ padding: "10px 18px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <StarRating value={rating} onChange={v => { onSetRating(recipe.key, v); }}/>
            {lastCooked && <span style={{ fontSize: 11, color: "var(--tx3)" }}>Zuletzt: {weekShort(lastCooked)}</span>}
            <button className="btn" onClick={() => setShowNotes(n => !n)}
              style={{ marginLeft: "auto", fontSize: 12, color: "var(--tx2)", background: "var(--sur2)", border: "1px solid var(--bdr)", padding: "3px 10px", borderRadius: 8 }}>
              {showNotes ? "Notiz ausblenden" : "📝 Notiz"}
            </button>
          </div>
          {showNotes && (
            <div style={{ marginBottom: 8 }}>
              <textarea className="note-ta" rows={2} placeholder="Rezeptnotiz…" value={localNote}
                onChange={e => setLocalNote(e.target.value)}
                onBlur={() => onSetNote(recipe.key, localNote)} style={{ width: "100%" }}/>
            </div>
          )}
          {FLAGS.prepCookSplit && (prep || cook) && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--tx3)", marginBottom: 2 }}>
                <span>✋ Vorbereitung {prep} Min</span><span>🔥 Kochen {cook} Min</span>
              </div>
              <div className="timeline">
                <div className="tl-prep" style={{ width: `${prepPct}%` }}/>
                <div className="tl-cook" style={{ width: `${cookPct}%` }}/>
              </div>
            </div>
          )}
          <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5 }}>{recipe.description}</p>
        </div>

        {/* Serving scaler */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", background: "var(--sur2)", borderBottom: "1px solid var(--bdr)", margin: "10px 0 0" }}>
          <span style={{ fontSize: 13, color: "var(--tx2)", flex: 1 }}>Portionen</span>
          <button className="btn" onClick={() => onServChange(recipe.key, Math.max(1, srv - 1))}
            style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--sur)", border: "1px solid var(--bdr)", fontSize: 18, color: "var(--tx)" }}>−</button>
          <span style={{ fontSize: 15, fontWeight: "bold", minWidth: 28, textAlign: "center", color: "var(--tx)" }}>{srv}</span>
          <button className="btn" onClick={() => onServChange(recipe.key, Math.min(10, srv + 1))}
            style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--sur)", border: "1px solid var(--bdr)", fontSize: 18, color: "var(--tx)" }}>+</button>
          <span style={{ fontSize: 12, color: "var(--tx3)" }}>({srv === 2 ? "Basis" : srv > 2 ? `×${mult}` : ""})</span>
        </div>

        {/* Ingredients */}
        <div style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: 11, color: "var(--tx3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Zutaten</div>
          {recipe.ingredients.map((ing, i) => {
            const s = ingState[ing.id] || {};
            return (
              <div key={ing.id} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: i < recipe.ingredients.length - 1 ? "1px solid var(--bdr2)" : "none", gap: 10 }}>
                <span style={{ fontSize: 14, flex: 1, color: s.status === "full" ? "var(--tx3)" : "var(--tx)", textDecoration: s.status === "full" ? "line-through" : "none" }}>{ing.name}</span>
                <span style={{ fontSize: 13, color: "var(--tx2)", fontStyle: "italic" }}>{scaleAmt(ing.amount, mult)}</span>
                <span style={{ fontSize: 14 }}>{SE[s.status || "none"]}</span>
              </div>
            );
          })}
          {recipe.pantryItems && recipe.pantryItems.length > 0 && (
            <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--acbg)", borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: "var(--ac)", fontWeight: "bold", marginBottom: 4 }}>🏠 Aus deiner Küche</div>
              <div style={{ fontSize: 13, color: "var(--tx2)" }}>{recipe.pantryItems.join(" · ")}</div>
            </div>
          )}

          {/* Price breakdown */}
          {FLAGS.priceEstimates && (() => {
            const items = recipe.ingredients.map(ing => {
              const k = normIngName(ing.name);
              const price = REWE_PRICES[k];
              return { name: normShop(ing.name), key: k, price };
            });
            const known   = items.filter(i => i.price != null);
            const unknown = items.filter(i => i.price == null);
            const total   = known.reduce((s, i) => s + i.price, 0);
            if (!known.length) return null;
            return (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--sur2)", borderRadius: 10, border: "1px solid var(--bdr)" }}>
                <div style={{ fontSize: 12, color: "var(--tx2)", fontWeight: "bold", marginBottom: 6 }}>💰 Preisschätzung (REWE)</div>
                {known.map(i => (
                  <div key={i.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--tx2)", padding: "2px 0" }}>
                    <span>{i.name}</span><span>€{i.price.toFixed(2)}</span>
                  </div>
                ))}
                {unknown.length > 0 && <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 4 }}>+{unknown.length} unbekannt</div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: "bold", color: "var(--ac)", marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--bdr)" }}>
                  <span>Gesamt</span><span>~€{total.toFixed(2)}{unknown.length ? "*" : ""}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Instructions */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <div style={{ padding: "0 18px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--tx3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Zubereitung</div>
            {recipe.instructions.map(s => {
              const photoB64 = recipe.stepPhotos?.[s.step];
              return (
                <div key={s.step} style={{ marginBottom: 16, padding: "10px 14px", background: "var(--sur2)", borderRadius: 10 }}>
                  {photoB64 && <img src={`data:image/jpeg;base64,${photoB64}`} alt={`Schritt ${s.step}`} style={{ width: "100%", borderRadius: 10, height: 180, objectFit: "cover", marginBottom: 8 }}/>}
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: recipe.color, color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: "bold" }}>{s.step}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold", color: "var(--tx)", marginBottom: 3 }}>{s.title}</div>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--tx2)" }}>{s.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {recipe.instructionPhoto && !recipe.stepPhotos && (
          <div style={{ padding: "0 18px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--tx3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Rezeptkarte</div>
            <img src={recipe.instructionPhoto} alt="Rezeptanleitung" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--bdr)" }}/>
          </div>
        )}
      </div>
    </div>
  );
}
