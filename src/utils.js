import { SPICES, ING_ALIASES, ING_SPLITS, REWE_PRICES, FLAGS } from './constants.js';

// ── ISO WEEK UTILITIES ─────────────────────────────────────────────────────
export function getISOWeek(d = new Date()) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return { week: Math.ceil(((dt - yearStart) / 86400000 + 1) / 7), year: dt.getUTCFullYear() };
}
export function weekId(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() + offset * 7);
  const { week, year } = getISOWeek(d);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
export function weekLabel(wid) {
  const m = wid.match(/(\d{4})-W(\d{2})/); if (!m) return wid;
  const year = parseInt(m[1]), week = parseInt(m[2]);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() || 7) - 1;
  const mon = new Date(jan4); mon.setDate(jan4.getDate() - dayOfWeek + (week - 1) * 7);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const DE_MONTHS = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const fmt = x => `${x.getDate()}. ${DE_MONTHS[x.getMonth()]}`;
  return `KW ${week} · ${fmt(mon)}–${fmt(sun)} ${year}`;
}
export function weekShort(wid) {
  const m = wid.match(/(\d{4})-W(\d{2})/); return m ? `W${parseInt(m[2])}` : `${wid}`;
}

// ── INGREDIENT NORMALISATION ──────────────────────────────────────────────
export function normIngName(n) {
  const l = (n || "").toLowerCase()
    .replace(/,?\s*bio\b/gi, "")
    .replace(/karotten-/g, "karotte-")
    .replace(/äpfel/g, "apfel")
    .replace(/tomaten\b/g, "tomate")
    .replace(/zwiebeln\b/g, "zwiebel")
    .replace(/karotten\b/g, "karotte")
    .replace(/kartoffeln\b/g, "kartoffel")
    .replace(/\s+/g, " ").trim();
  return l;
}
export function normShop(n) {
  const l = (n || "").toLowerCase().trim();
  if (SPICES[l]) return SPICES[l];
  const alias = ING_ALIASES[l];
  if (alias) return alias;
  return n.replace(/,?\s*bio\b/gi, "").replace(/\s+/g, " ").trim();
}
export function expandIngredient(ing) {
  const l = (ing.name || "").toLowerCase().trim();
  const targets = ING_SPLITS[l];
  if (targets) {
    return targets.map((t, i) => ({ ...ing, id: `${ing.id}_x${i}`, name: t, _fromSplit: ing.id }));
  }
  return [ing];
}
export function normStr(s) {
  return (s || "").toLowerCase()
    .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss")
    .replace(/[^a-z0-9\s]/g,"").trim();
}

// ── PRICE HELPERS ─────────────────────────────────────────────────────────
export function estimateRecipePrice(recipe, pantryInventory = {}) {
  let total = 0, unknown = false;
  recipe.ingredients.forEach(ing => {
    const k = normIngName(ing.name);
    if (pantryInventory[k]?.qty > 0) return;
    const price = REWE_PRICES[k];
    if (price != null) total += price;
    else unknown = true;
  });
  return { total: Math.round(total * 100) / 100, unknown };
}
export function formatPrice(recipe, pantryInventory = {}) {
  const { total, unknown } = estimateRecipePrice(recipe, pantryInventory);
  if (total === 0 && unknown) return "~?";
  return `~€${total.toFixed(2)}${unknown ? "*" : ""}`;
}

// ── PARSE / SCALE / COMBINE AMOUNTS ──────────────────────────────────────
export function parseAmt(s) {
  if (!s) return null;
  const t = s.trim().replace(",", ".");
  const m = t.match(/^([0-9.]+)\s*([a-zA-ZäöüÄÖÜ]*)$/);
  return m ? { num: parseFloat(m[1]), unit: m[2].toLowerCase() } : null;
}
export function scaleAmt(s, f) {
  if (!s || f === 1) return s;
  const p = parseAmt(s); if (!p) return s;
  const n = Math.round(p.num * f * 10) / 10;
  const ns = String(n).replace(".", ",");
  const PIECE_UNITS2 = ["stück","stuck","pck","pkg","bund","scheibe","scheiben","zehe","zehen","dose","glas"];
  return s.replace(/([\d,]+(?:\.\d+)?)\s*([a-zA-ZäöüÄÖÜ]*)/, (_, _n, u) => {
    if (!u) return ns;
    const lc = u.toLowerCase();
    return PIECE_UNITS2.includes(lc)
      ? `${ns} ${u.charAt(0).toUpperCase() + u.slice(1).toLowerCase()}`
      : `${ns}${lc}`;
  });
}
export function combineAmts(arr) {
  const bu = {}, up = [];
  arr.forEach(a => { const p = parseAmt(a); if (p) bu[p.unit] = (bu[p.unit] || 0) + p.num; else up.push(a); });
  const PIECE_UNITS = ["stück","stuck","pck","pkg","bund","scheibe","scheiben","zehe","zehen","dose","glas","pkg"];
  const fmtUnit = (n, u) => { if (!u) return n; const lc = u.toLowerCase(); return PIECE_UNITS.includes(lc) ? `${n} Stück` : `${n}${lc}`; };
  const parts = Object.entries(bu).map(([u, n]) => { const r = Math.round(n * 10) / 10; const sv = String(r).replace(".", ","); return fmtUnit(sv, u); });
  return [...parts, ...up].join(" + ");
}

// ── PROTEIN DETECTION ─────────────────────────────────────────────────────
export function detectProtein(r) {
  const t = (r.name + " " + r.ingredients.map(i => i.name).join(" ")).toLowerCase();
  if (/lachs|forelle|fisch|salmon|thunfisch/.test(t)) return "fish";
  if (/schwein|schnitzel/.test(t)) return "pork";
  if (/rind|hackfleisch|frikadell/.test(t)) return "beef";
  if (/hähnchen|huhn|chicken/.test(t)) return "chicken";
  return "vegetarian";
}
export function computeAutoStatus(have, need) {
  if (!have || !have.trim()) return null;
  const hp = parseAmt(have), np = parseAmt(need);
  if (hp && np) { if (hp.num >= np.num) return "full"; if (hp.num > 0) return "partial"; return "none"; }
  return have.trim() ? "full" : "none";
}

// ── STATE HELPERS ─────────────────────────────────────────────────────────
export function fromFB(fb) {
  return Object.entries(fb).map(([key, r]) => ({
    key, name: r.name, emoji: r.emoji, color: r.color, kcal: r.kcal || null,
    prepMins: r.prepMins || null, cookMins: r.cookMins || null,
    description: r.description || "", time: r.time || "", difficulty: r.difficulty || "", order: r.order || 0,
    photo: r.photo || null, instructionPhoto: r.instructionPhoto || null,
    stepPhotos: r.stepPhotos || null,
    pantryItems: Array.isArray(r.pantryItems) ? r.pantryItems : Object.values(r.pantryItems || {}),
    instructions: Array.isArray(r.instructions) ? r.instructions : Object.values(r.instructions || {}),
    ingredients: r.ingredients
      ? Object.entries(r.ingredients).map(([id, i]) => ({ id, name: i.name, amount: i.amount, aisle: i.aisle || "other" }))
      : [],
  })).sort((a, b) => a.order - b.order);
}
export function buildInit(seed) {
  const s = {}; seed.forEach(r => r.ingredients.forEach(i => { s[i.id] = { have: "", status: "none", note: "" }; })); return s;
}
export function buildDefSel(seed) {
  const s = {}; seed.forEach(r => { s[r.key] = { selected: false, servings: 2 }; }); return s;
}
export function getSel(sels, key) { return sels[key] || { selected: false, servings: 2 }; }
export function needAmt(ing, rkey, sels) { return scaleAmt(ing.amount, (getSel(sels, rkey).servings || 2) / 2); }

// ── HAPTICS ───────────────────────────────────────────────────────────────
export function haptic(pattern = 12) {
  if (FLAGS.haptics && navigator.vibrate) navigator.vibrate(pattern);
}
