import { useState, useMemo } from 'react';
import { normIngName, haptic } from '../utils.js';
import { useT } from '../LangContext.jsx';
import AddPantryModal from './AddPantryModal.jsx';

export default function PantryView({ recipes, ingState, customPantry, pantryInventory, onAdd, onRemove, updateIng, setIngStatus, onUpdatePantryInv }) {
  const t = useT();
  const [q,       setQ]       = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const lq = q.toLowerCase();

  const allItems = useMemo(() => {
    const map = {};
    recipes.forEach(r => {
      r.ingredients.forEach(ing => {
        const k = normIngName(ing.name);
        if (!map[k]) { map[k] = { id: ing.id, ids: [ing.id], name: ing.name, color: r.color, recipes: [r.name], aisle: ing.aisle || "other", needAmt: ing.amount }; }
        else { if (!map[k].ids.includes(ing.id)) map[k].ids.push(ing.id); if (!map[k].recipes.includes(r.name)) map[k].recipes.push(r.name); }
      });
    });
    return Object.values(map).filter(i => !lq || i.name.toLowerCase().includes(lq)).sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, lq]);

  const custom     = useMemo(() => Object.entries(customPantry || {}).filter(([, v]) => !lq || v.name.toLowerCase().includes(lq)), [customPantry, lq]);
  const stocked    = allItems.filter(i => { const s = ingState[i.id] || {}; return s.status === "full" || s.status === "partial"; });
  const notStocked = allItems.filter(i => { const s = ingState[i.id] || {}; return !s.status || s.status === "none"; });

  const setItemStatus = (item, next) => {
    item.ids.forEach(id => {
      setIngStatus(id, next);
      if (next === "full" && !(ingState[id]?.have || "").trim()) updateIng(id, "have", "✓");
      if (next === "none") updateIng(id, "have", "");
    });
    if (next === "full") haptic(12);
  };

  const UNITS = ["g","kg","ml","l","Stück","EL","TL","Pck"];
  const QTY_STEP = { kg: 0.1, l: 0.1, Stück: 1, EL: 1, TL: 1, Pck: 1 };

  function QtyEditor({ item }) {
    const normKey = normIngName(item.name);
    const inv     = pantryInventory[normKey];
    const qty     = parseFloat(inv?.qty) || 0;
    const unit    = inv?.unit || "g";
    const step    = QTY_STEP[unit] ?? 50;
    const [editing, setEditing] = useState(false);
    const [draft,   setDraft]   = useState("");

    const update = (newQty, newUnit = unit) => {
      const rounded = Math.max(0, Math.round(newQty * 10) / 10);
      if (rounded === 0) onUpdatePantryInv(normKey, null);
      else onUpdatePantryInv(normKey, { qty: String(rounded), unit: newUnit, lastUpdated: Date.now() });
    };

    const commitDraft = () => {
      const n = parseFloat(draft.replace(",", "."));
      if (!isNaN(n)) update(n);
      setEditing(false);
    };

    const btnStyle = { width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--bdr)", background: "var(--sur2)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--tx2)", flexShrink: 0, lineHeight: 1 };

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
        <button style={btnStyle} onClick={() => update(qty - step)}>−</button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 50 }}>
          {editing ? (
            <input
              autoFocus type="text" inputMode="decimal"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={e => { if (e.key === "Enter") commitDraft(); if (e.key === "Escape") setEditing(false); }}
              style={{ width: 46, textAlign: "center", fontSize: 13, fontWeight: "bold", border: "1.5px solid var(--ac)", borderRadius: 6, padding: "2px 0", background: "var(--sur)", color: "var(--tx)" }}
            />
          ) : (
            <span
              onClick={() => { setDraft(String(qty || "")); setEditing(true); }}
              style={{ fontSize: 13, fontWeight: "bold", color: qty > 0 ? "var(--ac)" : "var(--tx3)", lineHeight: 1.2, cursor: "text", minWidth: 30, textAlign: "center", padding: "1px 4px", borderRadius: 4, border: "1px dashed transparent" }}
              title="Tap to edit">
              {qty > 0 ? qty : "—"}
            </span>
          )}
          <select value={unit} onChange={e => update(qty, e.target.value)}
            style={{ fontSize: 10, border: "none", background: "transparent", color: "var(--tx3)", padding: 0, cursor: "pointer", width: "100%", textAlign: "center" }}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <button style={btnStyle} onClick={() => update(qty + step)}>+</button>
      </div>
    );
  }

  function ItemRow({ item }) {
    const s     = ingState[item.id] || {};
    const isHave = s.status === "full" || s.status === "partial";
    return (
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10 }}>
        <div style={{ width: 4, height: 32, borderRadius: 2, background: isHave ? item.color : "var(--bdr)", flexShrink: 0, transition: "background .2s" }}/>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setItemStatus(item, isHave ? "none" : "full")}>
          <div style={{ fontSize: 14, color: isHave ? "var(--tx)" : "var(--tx3)", fontWeight: isHave ? "bold" : "normal" }}>{item.name}</div>
          <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 1, lineHeight: 1.3 }}>{item.recipes.slice(0, 3).map(n => n.split(" ").slice(0, 3).join(" ")).join(", ")}{item.recipes.length > 3 ? ` +${item.recipes.length - 3}` : ""}</div>
        </div>
        <QtyEditor item={item}/>
        <button onClick={() => setItemStatus(item, isHave ? "none" : "full")}
          style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", flexShrink: 0, width: 28, textAlign: "center" }}>
          {isHave ? "✅" : "☐"}
        </button>
      </div>
    );
  }

  const stockedCount = stocked.length;
  const totalCount   = allItems.length;

  return (
    <div style={{ padding: "12px 12px 20px", maxWidth: 660, margin: "0 auto" }}>
      {showAdd && <AddPantryModal onAdd={data => { onAdd("cp_" + Date.now(), data); setShowAdd(false); }} onClose={() => setShowAdd(false)}/>}
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <input className="sbar" style={{ flex: 1, marginBottom: 0 }} placeholder={t('search_pantry')} value={q} onChange={e => setQ(e.target.value)}/>
        <button className="btn" onClick={() => setShowAdd(true)} style={{ padding: "9px 14px", borderRadius: 10, background: "var(--ac)", color: "#fff", fontSize: 13, fontWeight: "bold", flexShrink: 0 }}>{t('btn_add')}</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", padding: "8px 12px", background: "var(--acbg)", borderRadius: 10, border: "1px solid var(--bdr)" }}>
        <div style={{ flex: 1, height: 6, background: "var(--bdr)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: totalCount ? `${(stockedCount / totalCount) * 100}%` : "0%", background: "var(--ac)", transition: "width .4s", borderRadius: 3 }}/>
        </div>
        <span style={{ fontSize: 12, color: "var(--ac)", fontWeight: "bold", flexShrink: 0 }}>{t('stocked_count', { stocked: stockedCount, total: totalCount })}</span>
      </div>
      <p style={{ fontSize: 11, color: "var(--tx3)", marginBottom: 10, paddingLeft: 2 }}>{t('hint_pantry')}</p>

      {custom.length > 0 && (
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ padding: "8px 14px", background: "var(--sur2)", borderBottom: "1px solid var(--bdr)", fontSize: 11, fontWeight: "bold", color: "var(--tx2)", letterSpacing: .5, textTransform: "uppercase" }}>{t('section_custom', { count: custom.length })}</div>
          {custom.map(([id, item], i) => (
            <div key={id} style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: i < custom.length - 1 ? "1px solid var(--bdr2)" : "none" }}>
              <div style={{ width: 4, height: 32, borderRadius: 2, background: "var(--ac)", flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: "var(--tx)" }}>{item.name}</div>
                {(item.amount || item.qty) && <div style={{ fontSize: 11, color: "var(--tx3)" }}>{item.qty ? `${item.qty}${item.unit || ""}` : item.amount}</div>}
              </div>
              <button className="btn" onPointerDown={e => { e.stopPropagation(); onRemove(id); }}
                style={{ fontSize: 22, color: "var(--tx3)", background: "none", padding: "0 6px", lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {stocked.length > 0 && (
        <div className="card" style={{ marginBottom: 10 }}>
          <div style={{ padding: "8px 14px", background: "var(--acbg)", borderBottom: "1px solid var(--bdr)", fontSize: 11, fontWeight: "bold", color: "var(--ac)", letterSpacing: .5, textTransform: "uppercase" }}>{t('section_stocked', { count: stocked.length })}</div>
          {stocked.map((item, i) => <div key={item.id} style={{ borderBottom: i < stocked.length - 1 ? "1px solid var(--bdr2)" : "none" }}><ItemRow item={item}/></div>)}
        </div>
      )}

      {notStocked.length > 0 && (
        <div className="card">
          <div style={{ padding: "8px 14px", background: "var(--sur2)", borderBottom: "1px solid var(--bdr)", fontSize: 11, fontWeight: "bold", color: "var(--tx2)", letterSpacing: .5, textTransform: "uppercase" }}>{t('section_not_stocked', { count: notStocked.length })}</div>
          {notStocked.map((item, i) => <div key={item.id} style={{ borderBottom: i < notStocked.length - 1 ? "1px solid var(--bdr2)" : "none" }}><ItemRow item={item}/></div>)}
        </div>
      )}
      {allItems.length === 0 && q && <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--tx3)" }}>{t('no_items')}</div>}
    </div>
  );
}
