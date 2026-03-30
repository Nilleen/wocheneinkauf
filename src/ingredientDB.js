// ── INGREDIENT DATABASE ─────────────────────────────────────────────────────
// Single source of truth: normalized name, display names (DE/EN), aisle,
// REWE price, package size, aliases, splits (50/50), pantry base flag.
//
// Keys are the normalized form (mirrors normIngName in utils.js).
// findIngredient() resolves any variant spelling → canonical DB entry.
// syncIngredientDB() seeds Firebase non-destructively (never overwrites).

// Inline normalization — mirrors normIngName() in utils.js.
// Defined here to avoid a circular import (utils.js imports from this file).
function _norm(n) {
  return (n || "").toLowerCase()
    .replace(/,?\s*bio\b/gi, "")
    .replace(/karotten-/g, "karotte-")
    .replace(/äpfel/g, "apfel")
    .replace(/tomaten\b/g, "tomate")
    .replace(/zwiebeln\b/g, "zwiebel")
    .replace(/karotten\b/g, "karotte")
    .replace(/kartoffeln\b/g, "kartoffel")
    .replace(/\s+/g, " ").trim();
}

// ── LOOKUP ─────────────────────────────────────────────────────────────────

// Find a DB entry for any raw ingredient name.
// Resolution order: exact key → alias match → fuzzy substring.
// Returns the entry object or null.
export function findIngredient(rawName, db) {
  if (!db || !rawName) return null;
  const norm = _norm(rawName);
  // 1. Direct key
  if (db[norm]) return db[norm];
  // 2. Alias (normalized comparison)
  for (const entry of Object.values(db)) {
    if (entry.aliases?.some(a => _norm(a) === norm)) return entry;
  }
  // 3. Fuzzy substring (key length > 3 to avoid noise)
  for (const [key, entry] of Object.entries(db)) {
    if (key.length > 3 && (norm.includes(key) || key.includes(norm))) return entry;
  }
  return null;
}

// Returns split target names for a compound ingredient, or null.
// Always 50/50 quantity split. Checks DB first, then auto-detects & and /.
export function splitIngredientName(name, db) {
  const entry = findIngredient(name, db);
  if (entry?.splits) return entry.splits;
  if (/\s*&\s*/.test(name))
    return name.split(/\s*&\s*/).map(s => s.trim()).filter(Boolean);
  // "/" split — skip fractions like "1/2"
  if (/\s*\/\s*/.test(name) && !/^\d+\s*\/\s*\d+/.test(name.trim()))
    return name.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
  return null;
}

// Returns only entries missing from currentDB — for non-destructive Firebase sync.
export function syncIngredientDB(currentDB) {
  const toWrite = {};
  INGREDIENT_SEED.forEach(ing => {
    if (!currentDB[ing.key]) toWrite[ing.key] = ing;
  });
  return toWrite;
}

// ── SEED DATA ──────────────────────────────────────────────────────────────
// ~250 common German cooking ingredients.
// Fields: key, nameDE, nameEN, aisle, price (€/pkg), pkgSize, pkgUnit ("g"|"ml"),
//         aliases [], splits [] | null, pantryBase, priceSource ("rewe"|"estimate")

export const INGREDIENT_SEED = [

  // ── PRODUCE ───────────────────────────────────────────────────────────────
  { key:"karotte", nameDE:"Karotte", nameEN:"Carrot", aisle:"produce", price:0.59, pkgSize:null, pkgUnit:"g", aliases:["karotten","möhre","möhren"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kartoffel", nameDE:"Kartoffeln", nameEN:"Potatoes", aisle:"produce", price:1.29, pkgSize:null, pkgUnit:"g", aliases:["kartoffeln"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"mehligkochende kartoffel", nameDE:"Mehligkochende Kartoffeln", nameEN:"Floury potatoes", aisle:"produce", price:1.29, pkgSize:null, pkgUnit:"g", aliases:["mehligkochende kartoffeln","mehlkartoffel","mehlkartoffeln"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"festkochende kartoffel", nameDE:"Festkochende Kartoffeln", nameEN:"Waxy potatoes", aisle:"produce", price:1.29, pkgSize:null, pkgUnit:"g", aliases:["festkochende kartoffeln"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"süßkartoffel", nameDE:"Süßkartoffel", nameEN:"Sweet potato", aisle:"produce", price:0.99, pkgSize:null, pkgUnit:"g", aliases:["süßkartoffeln","sweet potato"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"zwiebel", nameDE:"Zwiebel", nameEN:"Onion", aisle:"produce", price:0.59, pkgSize:null, pkgUnit:"g", aliases:["zwiebeln","gemüsezwiebel","gemüsezwiebeln"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"rote zwiebel", nameDE:"Rote Zwiebel", nameEN:"Red onion", aisle:"produce", price:0.79, pkgSize:null, pkgUnit:"g", aliases:["rote zwiebeln"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"schalotte", nameDE:"Schalotte", nameEN:"Shallot", aisle:"produce", price:0.89, pkgSize:null, pkgUnit:"g", aliases:["schalotten"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"knoblauchzehe", nameDE:"Knoblauchzehe", nameEN:"Garlic clove", aisle:"produce", price:0.59, pkgSize:null, pkgUnit:"g", aliases:["knoblauch","knoblauchzehen","knoblauchknolle"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"ingwer", nameDE:"Ingwer", nameEN:"Ginger", aisle:"produce", price:0.49, pkgSize:null, pkgUnit:"g", aliases:["ingwerwurzel","frischer ingwer"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"tomate", nameDE:"Tomate", nameEN:"Tomato", aisle:"produce", price:0.99, pkgSize:500, pkgUnit:"g", aliases:["tomaten","strauchtomaten","strauchtomatend"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"cocktailtomate", nameDE:"Cocktailtomaten", nameEN:"Cherry tomatoes", aisle:"produce", price:1.49, pkgSize:250, pkgUnit:"g", aliases:["cocktailtomaten","cherrytomaten","cherrytomate","kirschtomaten","cherry tomaten"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"paprika", nameDE:"Paprika", nameEN:"Bell pepper", aisle:"produce", price:0.99, pkgSize:null, pkgUnit:"g", aliases:["paprika rot","paprika gelb","paprika grün","rote paprika","gelbe paprika","grüne paprika","spitzpaprika"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"zucchini", nameDE:"Zucchini", nameEN:"Courgette", aisle:"produce", price:0.89, pkgSize:null, pkgUnit:"g", aliases:["zucchinis"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"aubergine", nameDE:"Aubergine", nameEN:"Aubergine", aisle:"produce", price:0.99, pkgSize:null, pkgUnit:"g", aliases:["auberginen"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"brokkoli", nameDE:"Brokkoli", nameEN:"Broccoli", aisle:"produce", price:0.99, pkgSize:null, pkgUnit:"g", aliases:["brokkoliröschen","broccoli"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"blumenkohlröschen", nameDE:"Blumenkohlröschen", nameEN:"Cauliflower florets", aisle:"produce", price:1.49, pkgSize:null, pkgUnit:"g", aliases:["blumenkohl röschen","blumenkohl"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"spinat", nameDE:"Spinat", nameEN:"Spinach", aisle:"produce", price:1.29, pkgSize:null, pkgUnit:"g", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"babyspinat", nameDE:"Babyspinat", nameEN:"Baby spinach", aisle:"produce", price:1.49, pkgSize:null, pkgUnit:"g", aliases:["baby spinat","junger spinat"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"lauch", nameDE:"Lauch", nameEN:"Leek", aisle:"produce", price:0.89, pkgSize:null, pkgUnit:"g", aliases:["porree","lauchstange"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"frühlingszwiebel", nameDE:"Frühlingszwiebel", nameEN:"Spring onion", aisle:"produce", price:0.69, pkgSize:null, pkgUnit:"g", aliases:["frühlingszwiebeln","frühlingslauch","lauchzwiebel","lauchzwiebeln"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"radieschen", nameDE:"Radieschen", nameEN:"Radishes", aisle:"produce", price:0.79, pkgSize:null, pkgUnit:"g", aliases:["radies"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"gurke", nameDE:"Gurke", nameEN:"Cucumber", aisle:"produce", price:0.79, pkgSize:null, pkgUnit:"g", aliases:["salatgurke","gurken"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"sellerie", nameDE:"Sellerie", nameEN:"Celery", aisle:"produce", price:0.89, pkgSize:null, pkgUnit:"g", aliases:["stangensellerie","knollensellerie"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"fenchel", nameDE:"Fenchel", nameEN:"Fennel", aisle:"produce", price:0.99, pkgSize:null, pkgUnit:"g", aliases:["fenchelknolle"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"rote beete", nameDE:"Rote Beete", nameEN:"Beetroot", aisle:"produce", price:0.89, pkgSize:null, pkgUnit:"g", aliases:["rote bete","frische rote beete","rote bete vorgekocht","rote beete vorgekocht"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kürbis", nameDE:"Kürbis", nameEN:"Squash", aisle:"produce", price:1.49, pkgSize:null, pkgUnit:"g", aliases:["hokkaido","hokkaido kürbis","butternut kürbis","butternutkürbis","muskatkürbis"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"champignon", nameDE:"Champignons", nameEN:"Mushrooms", aisle:"produce", price:1.29, pkgSize:null, pkgUnit:"g", aliases:["champignons","pilze","braune champignons","kräuterseitlinge"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"avocado", nameDE:"Avocado", nameEN:"Avocado", aisle:"produce", price:0.99, pkgSize:null, pkgUnit:"g", aliases:["avocados","reife avocado"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"mais", nameDE:"Mais", nameEN:"Corn", aisle:"dry", price:0.79, pkgSize:null, pkgUnit:"g", aliases:["maiskörner","maiskorner","zuckermais","mais dose","dosenmaiskörner"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"feldsalat", nameDE:"Feldsalat", nameEN:"Lamb's lettuce", aisle:"produce", price:1.29, pkgSize:null, pkgUnit:"g", aliases:["rapunzelsalat","vogerlsalat"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"salatherz (romana)", nameDE:"Salatherz (Romana)", nameEN:"Romaine lettuce heart", aisle:"produce", price:1.29, pkgSize:null, pkgUnit:"g", aliases:["romanasalat","romaine","römersalat","salatherz"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"blattsalatmischung", nameDE:"Blattsalatmischung", nameEN:"Mixed leaf salad", aisle:"produce", price:1.29, pkgSize:null, pkgUnit:"g", aliases:["gemischter salat","salat mix","blattsalat","rucola mix","salat mischung"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"apfel", nameDE:"Apfel", nameEN:"Apple", aisle:"produce", price:0.99, pkgSize:null, pkgUnit:"g", aliases:["äpfel","apfel boskoop","braeburn","granny smith"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"zitrone", nameDE:"Zitrone", nameEN:"Lemon", aisle:"produce", price:0.49, pkgSize:null, pkgUnit:"g", aliases:["zitronen"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"limette", nameDE:"Limette", nameEN:"Lime", aisle:"produce", price:0.29, pkgSize:null, pkgUnit:"g", aliases:["limetten"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"orange", nameDE:"Orange", nameEN:"Orange", aisle:"produce", price:0.59, pkgSize:null, pkgUnit:"g", aliases:["orangen","blutorange"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"mango", nameDE:"Mango", nameEN:"Mango", aisle:"produce", price:0.99, pkgSize:null, pkgUnit:"g", aliases:["mangos","reife mango"], splits:null, pantryBase:false, priceSource:"estimate" },
  { key:"ananas", nameDE:"Ananas", nameEN:"Pineapple", aisle:"produce", price:1.49, pkgSize:null, pkgUnit:"g", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  // Fresh herbs
  { key:"petersilie", nameDE:"Petersilie", nameEN:"Parsley", aisle:"produce", price:0.69, pkgSize:null, pkgUnit:"g", aliases:["glatte petersilie","krause petersilie","petersilie glatt"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"schnittlauch", nameDE:"Schnittlauch", nameEN:"Chives", aisle:"produce", price:0.79, pkgSize:null, pkgUnit:"g", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"basilikum", nameDE:"Basilikum", nameEN:"Basil", aisle:"produce", price:0.79, pkgSize:null, pkgUnit:"g", aliases:["frisches basilikum","topf basilikum"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"minze", nameDE:"Minze", nameEN:"Mint", aisle:"produce", price:0.79, pkgSize:null, pkgUnit:"g", aliases:["pfefferminze","frische minze"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"koriander frisch", nameDE:"Koriander (frisch)", nameEN:"Fresh coriander", aisle:"produce", price:0.79, pkgSize:null, pkgUnit:"g", aliases:["frischer koriander","koriandergrün","cilantro"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"dill", nameDE:"Dill", nameEN:"Dill", aisle:"produce", price:0.79, pkgSize:null, pkgUnit:"g", aliases:["frischer dill"], splits:null, pantryBase:false, priceSource:"rewe" },
  // Compound ingredients — explicit 50/50 splits
  { key:"blumenkohlröschen & karotten", nameDE:"Blumenkohlröschen & Karotten", nameEN:"Cauliflower & carrots", aisle:"produce", price:null, pkgSize:null, pkgUnit:"g", aliases:["blumenkohlröschen und karotten","karotten & blumenkohlröschen"], splits:["Blumenkohlröschen","Karotte"], pantryBase:false, priceSource:"estimate" },
  { key:"petersilie/schnittlauch", nameDE:"Petersilie/Schnittlauch", nameEN:"Parsley/Chives", aisle:"produce", price:null, pkgSize:null, pkgUnit:"g", aliases:["petersilie und schnittlauch","schnittlauch/petersilie"], splits:["Petersilie","Schnittlauch"], pantryBase:false, priceSource:"estimate" },
  { key:"petersilie glatt/thymian", nameDE:"Petersilie/Thymian", nameEN:"Parsley/Thyme", aisle:"produce", price:null, pkgSize:null, pkgUnit:"g", aliases:["thymian/petersilie","petersilie/thymian"], splits:["Petersilie","Thymian"], pantryBase:false, priceSource:"estimate" },
  { key:"rosmarin/thymian", nameDE:"Rosmarin/Thymian", nameEN:"Rosemary/Thyme", aisle:"spices", price:null, pkgSize:null, pkgUnit:"g", aliases:["thymian/rosmarin"], splits:["Rosmarin","Thymian"], pantryBase:false, priceSource:"estimate" },
  { key:"karotte-lauch-mix", nameDE:"Karotten-Lauch-Mix", nameEN:"Carrot & leek mix", aisle:"produce", price:null, pkgSize:null, pkgUnit:"g", aliases:["karotten lauch mix","karotten-lauch mix","karotte-lauch mix"], splits:["Karotte","Lauch"], pantryBase:false, priceSource:"estimate" },
  { key:"basilikum/oregano", nameDE:"Basilikum/Oregano", nameEN:"Basil/Oregano", aisle:"spices", price:null, pkgSize:null, pkgUnit:"g", aliases:["oregano/basilikum","basilikum und oregano"], splits:["Basilikum","Oregano"], pantryBase:false, priceSource:"estimate" },

  // ── MEAT & FISH ───────────────────────────────────────────────────────────
  { key:"hähnchenbrustfilet", nameDE:"Hähnchenbrustfilet", nameEN:"Chicken breast fillet", aisle:"meat", price:3.49, pkgSize:250, pkgUnit:"g", aliases:["hähnchenbrust","hähnchenbrustfilet in lake","hähnchenbrust in lake","chicken breast","vorw. festk. kartoffeln"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"hähnchenschenkel", nameDE:"Hähnchenschenkel", nameEN:"Chicken thighs", aisle:"meat", price:2.99, pkgSize:400, pkgUnit:"g", aliases:["hähnchenkeule","hähnchenkeulen","hähnchenoberschenkel"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"lachsfilet", nameDE:"Lachsfilet", nameEN:"Salmon fillet", aisle:"meat", price:4.99, pkgSize:200, pkgUnit:"g", aliases:["lachs","lachssteak","atlantischer lachs"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"schweineschnitzel", nameDE:"Schweineschnitzel", nameEN:"Pork schnitzel", aisle:"meat", price:3.29, pkgSize:250, pkgUnit:"g", aliases:["schnitzel","schweinefleisch schnitzel","paniertes schweineschnitzel"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"schweinefilet", nameDE:"Schweinefilet", nameEN:"Pork tenderloin", aisle:"meat", price:4.49, pkgSize:300, pkgUnit:"g", aliases:["schweinefilets","schweinelende","schweine filet"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"rinderhackfleisch", nameDE:"Rinderhackfleisch", nameEN:"Minced beef", aisle:"meat", price:3.49, pkgSize:400, pkgUnit:"g", aliases:["hackfleisch vom rind","rinder hack","hackfleischzubereitung vom weiderind","gemischtes hackfleisch","hackfleisch gemischt","hackfleisch","gemischte hackfleischzubereitung","hackfleischzubereitung","rinderhackfleischzubereitung"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"rinderfilet", nameDE:"Rinderfilet", nameEN:"Beef fillet", aisle:"meat", price:8.99, pkgSize:200, pkgUnit:"g", aliases:["rindersteak","rinder filet","beef steak"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"bacon", nameDE:"Bacon", nameEN:"Bacon", aisle:"meat", price:1.49, pkgSize:150, pkgUnit:"g", aliases:["speck","frühstücksspeck","bacon scheiben","baconscheiben","speckscheiben","speckwürfel"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"garnelen", nameDE:"Garnelen", nameEN:"Prawns", aisle:"meat", price:4.99, pkgSize:200, pkgUnit:"g", aliases:["shrimps","crevetten","tiefkühlgarnelen","riesengarnelen"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kabeljau", nameDE:"Kabeljau", nameEN:"Cod", aisle:"meat", price:3.99, pkgSize:200, pkgUnit:"g", aliases:["dorsch","kabeljaufilet"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"thunfisch", nameDE:"Thunfisch (Dose)", nameEN:"Tuna (can)", aisle:"dry", price:0.99, pkgSize:140, pkgUnit:"g", aliases:["thunfisch dose","thunfisch im eigenen saft","dose thunfisch"], splits:null, pantryBase:false, priceSource:"rewe" },

  // ── DAIRY & EGGS ──────────────────────────────────────────────────────────
  { key:"milch", nameDE:"Milch", nameEN:"Milk", aisle:"dairy", price:0.89, pkgSize:1000, pkgUnit:"ml", aliases:["vollmilch","halbfettmilch","frischmilch"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"butter", nameDE:"Butter", nameEN:"Butter", aisle:"dairy", price:1.79, pkgSize:250, pkgUnit:"g", aliases:["süßrahmbutter"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kochsahne", nameDE:"Kochsahne", nameEN:"Cooking cream", aisle:"dairy", price:0.59, pkgSize:200, pkgUnit:"ml", aliases:["sahne leicht","kochsahne leicht","cuisine","küchenrahm","schlagsahne","sahne"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"saure sahne", nameDE:"Saure Sahne", nameEN:"Sour cream", aisle:"dairy", price:0.69, pkgSize:200, pkgUnit:"g", aliases:["sauerrahm"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"frischkäse", nameDE:"Frischkäse", nameEN:"Cream cheese", aisle:"dairy", price:0.99, pkgSize:200, pkgUnit:"g", aliases:["philadelphia","doppelrahmfrischkäse","frischkäse natur"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"mozzarella", nameDE:"Mozzarella", nameEN:"Mozzarella", aisle:"dairy", price:0.99, pkgSize:125, pkgUnit:"g", aliases:["mozzarella kugel","buffalo mozzarella","büffelmozzarella"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"hartkäse, gerieben", nameDE:"Hartkäse, gerieben", nameEN:"Hard cheese, grated", aisle:"dairy", price:1.89, pkgSize:200, pkgUnit:"g", aliases:["hartkäse gerieben","hartkäse (gerieben)","hartkäse ital. art gerieben","hartkäse ital art gerieben","reibekäse","geriebener käse","parmesan","parmigiano"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"hirtenkäse leicht", nameDE:"Hirtenkäse leicht", nameEN:"Light feta cheese", aisle:"dairy", price:2.49, pkgSize:200, pkgUnit:"g", aliases:["hirtenkäse","feta","feta käse","schafskäse","griechischer käse"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"camembert", nameDE:"Camembert", nameEN:"Camembert", aisle:"dairy", price:1.99, pkgSize:250, pkgUnit:"g", aliases:["normandie camembert","weichkäse"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"gouda", nameDE:"Gouda", nameEN:"Gouda", aisle:"dairy", price:1.29, pkgSize:200, pkgUnit:"g", aliases:["gouda scheiben","junger gouda"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"naturjoghurt", nameDE:"Naturjoghurt", nameEN:"Natural yoghurt", aisle:"dairy", price:0.69, pkgSize:500, pkgUnit:"g", aliases:["joghurt natur","griechischer joghurt","joghurt"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"sahnejoghurt", nameDE:"Sahnejoghurt", nameEN:"Cream yoghurt", aisle:"dairy", price:0.79, pkgSize:500, pkgUnit:"g", aliases:["joghurt sahnig"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"schmand", nameDE:"Schmand", nameEN:"Schmand", aisle:"dairy", price:0.69, pkgSize:200, pkgUnit:"g", aliases:["schmand 24%"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"crème fraîche", nameDE:"Crème fraîche", nameEN:"Crème fraîche", aisle:"dairy", price:0.89, pkgSize:200, pkgUnit:"g", aliases:["creme fraiche","fraîche","crème fraiche"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"quark", nameDE:"Quark", nameEN:"Quark", aisle:"dairy", price:0.79, pkgSize:250, pkgUnit:"g", aliases:["magerquark","speisequark","topfen"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"buttermilch", nameDE:"Buttermilch", nameEN:"Buttermilk", aisle:"dairy", price:0.69, pkgSize:500, pkgUnit:"ml", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kräuterbutter", nameDE:"Kräuterbutter", nameEN:"Herb butter", aisle:"dairy", price:0.99, pkgSize:125, pkgUnit:"g", aliases:["butter mit kräutern"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"eier", nameDE:"Eier", nameEN:"Eggs", aisle:"dairy", price:2.29, pkgSize:null, pkgUnit:null, aliases:["ei","large eier","eier m","hühnereier"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"buttermilch-zitronen-dressing", nameDE:"Buttermilch-Zitronen-Dressing", nameEN:"Buttermilk lemon dressing", aisle:"dairy", price:1.49, pkgSize:null, pkgUnit:null, aliases:["buttermilch zitronen dressing","zitronen dressing","buttermilchdressing"], splits:null, pantryBase:false, priceSource:"estimate" },

  // ── DRY GOODS & GRAINS ────────────────────────────────────────────────────
  { key:"couscous", nameDE:"Couscous", nameEN:"Couscous", aisle:"dry", price:0.89, pkgSize:500, pkgUnit:"g", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"basmatireis", nameDE:"Basmatireis", nameEN:"Basmati rice", aisle:"dry", price:1.19, pkgSize:1000, pkgUnit:"g", aliases:["basmati reis","basmati"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"jasminreis", nameDE:"Jasminreis", nameEN:"Jasmine rice", aisle:"dry", price:0.99, pkgSize:1000, pkgUnit:"g", aliases:["jasmin reis"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"reis", nameDE:"Reis", nameEN:"Rice", aisle:"dry", price:0.99, pkgSize:1000, pkgUnit:"g", aliases:["langkornreis","parboiled reis"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"nudeln", nameDE:"Nudeln", nameEN:"Pasta", aisle:"dry", price:0.89, pkgSize:500, pkgUnit:"g", aliases:["pasta"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"spaghetti", nameDE:"Spaghetti", nameEN:"Spaghetti", aisle:"dry", price:0.89, pkgSize:500, pkgUnit:"g", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"penne", nameDE:"Penne", nameEN:"Penne", aisle:"dry", price:0.89, pkgSize:500, pkgUnit:"g", aliases:["penne rigate"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"farfalle", nameDE:"Farfalle", nameEN:"Farfalle", aisle:"dry", price:0.89, pkgSize:500, pkgUnit:"g", aliases:["schmetterlingsnudeln"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"tagliatelle", nameDE:"Tagliatelle", nameEN:"Tagliatelle", aisle:"dry", price:1.19, pkgSize:500, pkgUnit:"g", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"lasagneplatten", nameDE:"Lasagneplatten", nameEN:"Lasagne sheets", aisle:"dry", price:1.49, pkgSize:500, pkgUnit:"g", aliases:["lasagneblätter","lasagne blätter","lasagne platten"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"quinoa", nameDE:"Quinoa", nameEN:"Quinoa", aisle:"dry", price:2.49, pkgSize:400, pkgUnit:"g", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"bulgur", nameDE:"Bulgur", nameEN:"Bulgur", aisle:"dry", price:1.29, pkgSize:500, pkgUnit:"g", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"polenta", nameDE:"Polenta", nameEN:"Polenta", aisle:"dry", price:1.29, pkgSize:500, pkgUnit:"g", aliases:["maisgrieß"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"haferflocken", nameDE:"Haferflocken", nameEN:"Oats", aisle:"dry", price:0.89, pkgSize:500, pkgUnit:"g", aliases:["kernige haferflocken","zarte haferflocken"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kichererbsen", nameDE:"Kichererbsen", nameEN:"Chickpeas", aisle:"dry", price:0.79, pkgSize:400, pkgUnit:"g", aliases:["kicher erbsen","dose kichererbsen","kichererbsen dose"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"linsen", nameDE:"Linsen", nameEN:"Lentils", aisle:"dry", price:0.89, pkgSize:500, pkgUnit:"g", aliases:["rote linsen","braune linsen","grüne linsen","tellerlinsen","linsen rot"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"weiße bohnen", nameDE:"Weiße Bohnen", nameEN:"White beans", aisle:"dry", price:0.69, pkgSize:400, pkgUnit:"g", aliases:["weiße bohnen dose","cannellini bohnen","cannellini"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kidneybohnen", nameDE:"Kidneybohnen", nameEN:"Kidney beans", aisle:"dry", price:0.69, pkgSize:400, pkgUnit:"g", aliases:["kidney bohnen","rote bohnen","kidneybohnen dose"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"dosentomaten", nameDE:"Dosentomaten", nameEN:"Canned tomatoes", aisle:"dry", price:0.79, pkgSize:400, pkgUnit:"g", aliases:["gehackte tomaten","tomaten dose","passierte tomaten","geschälte tomaten","tomaten gehackt"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"tomatenmark", nameDE:"Tomatenmark", nameEN:"Tomato paste", aisle:"dry", price:0.49, pkgSize:200, pkgUnit:"g", aliases:["tomatenpüree","tomaten mark","tomatenpüree"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kokosmilch", nameDE:"Kokosmilch", nameEN:"Coconut milk", aisle:"dry", price:1.29, pkgSize:400, pkgUnit:"ml", aliases:["kokos milch","kokosmilch dose","kokoscreme"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"semmelbrösel", nameDE:"Semmelbrösel", nameEN:"Breadcrumbs", aisle:"dry", price:0.59, pkgSize:400, pkgUnit:"g", aliases:["paniermehl","semmelmehl","panade"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"mehl", nameDE:"Mehl", nameEN:"Flour", aisle:"dry", price:0.69, pkgSize:1000, pkgUnit:"g", aliases:["weizenmehl","typ 405","typ 550","dinkelmehl","weizenmehl 405"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"speisestärke", nameDE:"Speisestärke", nameEN:"Cornstarch", aisle:"dry", price:0.79, pkgSize:400, pkgUnit:"g", aliases:["kartoffelstärke","maizena","stärke"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"sesamsamen", nameDE:"Sesamsamen", nameEN:"Sesame seeds", aisle:"dry", price:0.99, pkgSize:100, pkgUnit:"g", aliases:["sesam","sesamkörner","weiße sesamsamen"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"pekannusskerne", nameDE:"Pekannusskerne", nameEN:"Pecan nuts", aisle:"dry", price:2.49, pkgSize:100, pkgUnit:"g", aliases:["pecan","pekannüsse","pekannuss"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"walnüsse", nameDE:"Walnüsse", nameEN:"Walnuts", aisle:"dry", price:1.99, pkgSize:150, pkgUnit:"g", aliases:["walnusskerne","walnuss"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"mandeln", nameDE:"Mandeln", nameEN:"Almonds", aisle:"dry", price:1.99, pkgSize:200, pkgUnit:"g", aliases:["ganze mandeln","mandelkerne","gehobelte mandeln","mandelblättchen"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"cashews", nameDE:"Cashews", nameEN:"Cashews", aisle:"dry", price:2.49, pkgSize:150, pkgUnit:"g", aliases:["cashewkerne","cashewnüsse"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"cranberries, getrocknet", nameDE:"Cranberries, getrocknet", nameEN:"Dried cranberries", aisle:"dry", price:1.29, pkgSize:125, pkgUnit:"g", aliases:["getrocknete cranberries","cranberry getrocknet","cranberries"], splits:null, pantryBase:false, priceSource:"rewe" },

  // ── BREAD & BAKERY ────────────────────────────────────────────────────────
  { key:"mini-fladenbrot", nameDE:"Mini-Fladenbrot", nameEN:"Mini flatbread", aisle:"bread", price:0.99, pkgSize:null, pkgUnit:null, aliases:["minifladenbrot","mini fladenbrot","fladenbrötchen"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"fladenbrot", nameDE:"Fladenbrot", nameEN:"Flatbread", aisle:"bread", price:1.29, pkgSize:null, pkgUnit:null, aliases:["pita","pitabrot","fladenbrot groß"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"ciabatta", nameDE:"Ciabatta", nameEN:"Ciabatta", aisle:"bread", price:1.29, pkgSize:null, pkgUnit:null, aliases:["ciabatta brot","ciabatta brötchen"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"baguette", nameDE:"Baguette", nameEN:"Baguette", aisle:"bread", price:0.99, pkgSize:null, pkgUnit:null, aliases:["französisches baguette"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"toastbrot", nameDE:"Toastbrot", nameEN:"Toast bread", aisle:"bread", price:1.19, pkgSize:null, pkgUnit:null, aliases:["toast","weißbrot","sandwichbrot","sandwich brot"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"laugenbrötchen", nameDE:"Laugenbrötchen", nameEN:"Pretzel rolls", aisle:"bread", price:0.49, pkgSize:null, pkgUnit:null, aliases:["laugengebäck","laugenstange"], splits:null, pantryBase:false, priceSource:"rewe" },

  // ── SPICES & SEASONINGS ───────────────────────────────────────────────────
  { key:"gemüsebrühpulver", nameDE:"Gemüsebrühpulver", nameEN:"Vegetable stock powder", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["gemüsebrühe pulver","brühpulver","instantbrühe","klare brühe","gemüsebrühe"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"rinderbrühe", nameDE:"Rinderbrühe", nameEN:"Beef stock", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["rinderfond","rinder brühe","rinderbrühwürfel"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"hühnerbrühe", nameDE:"Hühnerbrühe", nameEN:"Chicken stock", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hühnerfond","huhn brühe","geflügelbrühe","hühnerbrühwürfel"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"currypulver", nameDE:"Currypulver", nameEN:"Curry powder", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["curry","curry pulver","madras curry"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"paprikapulver", nameDE:"Paprikapulver", nameEN:"Paprika powder", aisle:"spices", price:0.79, pkgSize:null, pkgUnit:null, aliases:["paprika pulver","edelsüß paprika","geräuchertes paprikapulver","smoked paprika","paprikapulver edelsüß"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"muskatnuss, gemahlen", nameDE:"Muskatnuss, gemahlen", nameEN:"Nutmeg, ground", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["muskat","muskatnuss","gemahlene muskatnuss"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kumin, gemahlen", nameDE:"Kumin, gemahlen", nameEN:"Cumin, ground", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["kreuzkümmel","kümmel gemahlen","cumin","cumin gemahlen","cumin, ground"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"koriander, gemahlen", nameDE:"Koriander, gemahlen", nameEN:"Coriander, ground", aisle:"spices", price:0.79, pkgSize:null, pkgUnit:null, aliases:["koriander pulver","gemahlener koriander","koriander gemahlen"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"zimt", nameDE:"Zimt", nameEN:"Cinnamon", aisle:"spices", price:0.79, pkgSize:null, pkgUnit:null, aliases:["zimt gemahlen","ceylon zimt"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kurkuma", nameDE:"Kurkuma", nameEN:"Turmeric", aisle:"spices", price:0.79, pkgSize:null, pkgUnit:null, aliases:["kurkuma gemahlen","gelbwurz","turmeric"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"chiliflocken", nameDE:"Chiliflocken", nameEN:"Chili flakes", aisle:"spices", price:0.79, pkgSize:null, pkgUnit:null, aliases:["chili flocken","peperoncini","rote chili flocken","chili","chilipulver"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"chilischote", nameDE:"Chilischote", nameEN:"Chili pepper", aisle:"produce", price:0.49, pkgSize:null, pkgUnit:null, aliases:["chili schote","rote chilischote","peperoni","chili schoten"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"oregano", nameDE:"Oregano", nameEN:"Oregano", aisle:"spices", price:0.69, pkgSize:null, pkgUnit:null, aliases:["oregano getrocknet","getrockneter oregano"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"thymian", nameDE:"Thymian", nameEN:"Thyme", aisle:"spices", price:0.79, pkgSize:null, pkgUnit:null, aliases:["thymian getrocknet","getrockneter thymian","frischer thymian"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"rosmarin", nameDE:"Rosmarin", nameEN:"Rosemary", aisle:"spices", price:0.79, pkgSize:null, pkgUnit:null, aliases:["rosmarin getrocknet","frischer rosmarin"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"lorbeerblatt", nameDE:"Lorbeerblatt", nameEN:"Bay leaf", aisle:"spices", price:0.69, pkgSize:null, pkgUnit:null, aliases:["lorbeer","lorbeerblätter"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"kapern", nameDE:"Kapern", nameEN:"Capers", aisle:"spices", price:1.29, pkgSize:100, pkgUnit:"g", aliases:["kapernäpfel","kleine kapern"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"aprikosenchutney", nameDE:"Aprikosenchutney", nameEN:"Apricot chutney", aisle:"spices", price:1.89, pkgSize:null, pkgUnit:null, aliases:["aprikosen chutney"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"würziges zwiebel-chutney", nameDE:"Würziges Zwiebel-Chutney", nameEN:"Spicy onion chutney", aisle:"spices", price:1.49, pkgSize:null, pkgUnit:null, aliases:["zwiebel chutney","onion chutney","zwiebelchutney"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"wildpreiselbeerenmarmelade", nameDE:"Wildpreiselbeerenmarmelade", nameEN:"Wild cranberry jam", aisle:"spices", price:1.49, pkgSize:null, pkgUnit:null, aliases:["preiselbeeren marmelade","preiselbeermarmelade","wild cranberry","preiselbeer konfitüre"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"pflaumenkonfitüre", nameDE:"Pflaumenkonfitüre", nameEN:"Plum jam", aisle:"spices", price:1.49, pkgSize:null, pkgUnit:null, aliases:["pflaumenmarmelade","plum jam","pflaumekonfit"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"ravigote sauce", nameDE:"Ravigote Sauce", nameEN:"Ravigote sauce", aisle:"spices", price:1.99, pkgSize:null, pkgUnit:null, aliases:["ravigote"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"senf", nameDE:"Senf", nameEN:"Mustard", aisle:"spices", price:0.69, pkgSize:200, pkgUnit:"g", aliases:["tafelsenf","delikatess senf","gewöhnlicher senf"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"mittelscharfer senf", nameDE:"Mittelscharfer Senf", nameEN:"Medium-hot mustard", aisle:"spices", price:0.69, pkgSize:200, pkgUnit:"g", aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"dijonsenf", nameDE:"Dijonsenf", nameEN:"Dijon mustard", aisle:"spices", price:1.29, pkgSize:200, pkgUnit:"g", aliases:["dijon senf","französischer senf"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"mayonnaise", nameDE:"Mayonnaise", nameEN:"Mayonnaise", aisle:"spices", price:0.99, pkgSize:250, pkgUnit:"g", aliases:["mayo","majonäse"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"ketchup", nameDE:"Ketchup", nameEN:"Ketchup", aisle:"spices", price:0.99, pkgSize:500, pkgUnit:"g", aliases:["tomatenketchup","tomaten ketchup"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"sojasoße", nameDE:"Sojasoße", nameEN:"Soy sauce", aisle:"spices", price:0.99, pkgSize:150, pkgUnit:"ml", aliases:["soja soße","soja sauce","sojasauce"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"worcestershiresauce", nameDE:"Worcestershire Sauce", nameEN:"Worcestershire sauce", aisle:"spices", price:1.49, pkgSize:150, pkgUnit:"ml", aliases:["worcester sauce","worcestershire"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"sriracha", nameDE:"Sriracha Sauce", nameEN:"Sriracha sauce", aisle:"spices", price:2.49, pkgSize:200, pkgUnit:"ml", aliases:["sriracha sauce","hot sauce","chili sauce sriracha"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"tabasco", nameDE:"Tabasco", nameEN:"Tabasco", aisle:"spices", price:2.99, pkgSize:60, pkgUnit:"ml", aliases:["tobasco"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"hummus", nameDE:"Hummus", nameEN:"Hummus", aisle:"spices", price:1.49, pkgSize:200, pkgUnit:"g", aliases:["hummus dip"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"tahini", nameDE:"Tahini", nameEN:"Tahini", aisle:"spices", price:2.49, pkgSize:300, pkgUnit:"g", aliases:["tahin","sesampaste"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"pesto", nameDE:"Pesto", nameEN:"Pesto", aisle:"spices", price:1.99, pkgSize:190, pkgUnit:"g", aliases:["pesto verde","pesto rosso","basilikum pesto"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"garam masala", nameDE:"Garam Masala", nameEN:"Garam masala", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:[], splits:null, pantryBase:false, priceSource:"rewe" },

  // ── HELLO FRESH SPICE BLENDS ──────────────────────────────────────────────
  { key:"gewürzmischung hello curry", nameDE:"Gewürzmischung Hello Curry", nameEN:"Spice blend (curry)", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hello curry","hello fresh curry"], splits:null, pantryBase:false, priceSource:"estimate" },
  { key:"gewürzmischung hello paprika", nameDE:"Gewürzmischung Hello Paprika", nameEN:"Spice blend (paprika)", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hello paprika"], splits:null, pantryBase:false, priceSource:"estimate" },
  { key:"gewürzmischung hello italiano", nameDE:"Gewürzmischung Hello Italiano", nameEN:"Spice blend (Italian herbs)", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hello italiano","hello italian herb"], splits:null, pantryBase:false, priceSource:"estimate" },
  { key:"gewürzmischung hello muskat", nameDE:"Gewürzmischung Hello Muskat", nameEN:"Spice blend (nutmeg)", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hello muskat"], splits:null, pantryBase:false, priceSource:"estimate" },
  { key:"gewürzmischung hello mediterranee", nameDE:"Gewürzmischung Hello Méditerranée", nameEN:"Spice blend (Mediterranean)", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hello mediterranee","hello mediterranean","gewürzmischung hello mediterranée"], splits:null, pantryBase:false, priceSource:"estimate" },
  { key:"gewürzmischung hello smoky bbq", nameDE:"Gewürzmischung Hello Smoky BBQ", nameEN:"Spice blend (smoky BBQ)", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hello smoky bbq","hello bbq"], splits:null, pantryBase:false, priceSource:"estimate" },
  { key:"gewürzmischung hello chinese", nameDE:"Gewürzmischung Hello Chinese", nameEN:"Spice blend (Chinese)", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hello chinese","5 spice","fünf gewürze"], splits:null, pantryBase:false, priceSource:"estimate" },
  { key:"gewürzmischung hello mexican", nameDE:"Gewürzmischung Hello Mexican", nameEN:"Spice blend (Mexican)", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hello mexican","hello mexico"], splits:null, pantryBase:false, priceSource:"estimate" },
  { key:"gewürzmischung hello garam masala", nameDE:"Gewürzmischung Hello Garam Masala", nameEN:"Spice blend (garam masala)", aisle:"spices", price:0.89, pkgSize:null, pkgUnit:null, aliases:["hello garam masala"], splits:null, pantryBase:false, priceSource:"estimate" },

  // ── OILS & VINEGAR ────────────────────────────────────────────────────────
  { key:"olivenöl", nameDE:"Olivenöl", nameEN:"Olive oil", aisle:"oils", price:2.29, pkgSize:500, pkgUnit:"ml", aliases:["natives olivenöl","extra vergine","olivenöl extra vergine"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"trüffelöl", nameDE:"Trüffelöl", nameEN:"Truffle oil", aisle:"oils", price:3.99, pkgSize:250, pkgUnit:"ml", aliases:["truffle oil","öl mit trüffelgeschmack"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"sesamöl", nameDE:"Sesamöl", nameEN:"Sesame oil", aisle:"oils", price:2.49, pkgSize:250, pkgUnit:"ml", aliases:["geröstetes sesamöl"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"balsamicocreme", nameDE:"Balsamicocreme", nameEN:"Balsamic glaze", aisle:"oils", price:1.99, pkgSize:250, pkgUnit:"ml", aliases:["balsamic-crème","balsamic crème","balsamic creme","balsamico creme","balsamico crème","crema di balsamico","balsamico-crème"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"balsamico", nameDE:"Balsamicoessig", nameEN:"Balsamic vinegar", aisle:"oils", price:1.29, pkgSize:500, pkgUnit:"ml", aliases:["balsamessig","aceto balsamico","balsamico essig"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"weißweinessig", nameDE:"Weißweinessig", nameEN:"White wine vinegar", aisle:"oils", price:0.89, pkgSize:500, pkgUnit:"ml", aliases:["weißer weinessig"], splits:null, pantryBase:false, priceSource:"rewe" },
  { key:"apfelessig", nameDE:"Apfelessig", nameEN:"Apple cider vinegar", aisle:"oils", price:0.89, pkgSize:500, pkgUnit:"ml", aliases:["cidre essig","apfelweinessig"], splits:null, pantryBase:false, priceSource:"rewe" },

  // ── PANTRY BASES (kitchen staples) ────────────────────────────────────────
  { key:"salz", nameDE:"Salz", nameEN:"Salt", aisle:"spices", price:0.49, pkgSize:null, pkgUnit:null, aliases:["meersalz","jodsalz"], splits:null, pantryBase:true, priceSource:"rewe" },
  { key:"pfeffer", nameDE:"Pfeffer", nameEN:"Pepper", aisle:"spices", price:0.79, pkgSize:null, pkgUnit:null, aliases:["schwarzer pfeffer","weißer pfeffer","pfefferkörner","bunter pfeffer"], splits:null, pantryBase:true, priceSource:"rewe" },
  { key:"zucker", nameDE:"Zucker", nameEN:"Sugar", aisle:"dry", price:0.69, pkgSize:null, pkgUnit:null, aliases:["weißer zucker","feiner zucker","normaler zucker"], splits:null, pantryBase:true, priceSource:"rewe" },
  { key:"brauner zucker", nameDE:"Brauner Zucker", nameEN:"Brown sugar", aisle:"dry", price:0.89, pkgSize:null, pkgUnit:null, aliases:["rohrzucker","dunkelbrauner zucker"], splits:null, pantryBase:true, priceSource:"rewe" },
  { key:"öl", nameDE:"Öl", nameEN:"Oil", aisle:"oils", price:1.49, pkgSize:null, pkgUnit:null, aliases:["pflanzenöl","sonnenblumenöl","rapsöl","neutrales öl"], splits:null, pantryBase:true, priceSource:"rewe" },
  { key:"wasser", nameDE:"Wasser", nameEN:"Water", aisle:"other", price:0.00, pkgSize:null, pkgUnit:null, aliases:[], splits:null, pantryBase:true, priceSource:"rewe" },
  { key:"essig", nameDE:"Essig", nameEN:"Vinegar", aisle:"oils", price:0.89, pkgSize:null, pkgUnit:null, aliases:["haushaltsessig","speiseessig"], splits:null, pantryBase:true, priceSource:"rewe" },
  { key:"honig", nameDE:"Honig", nameEN:"Honey", aisle:"spices", price:2.49, pkgSize:250, pkgUnit:"g", aliases:["flüssiger honig","akazienhonig","blütenhonig"], splits:null, pantryBase:true, priceSource:"rewe" },
  { key:"zitronensaft", nameDE:"Zitronensaft", nameEN:"Lemon juice", aisle:"spices", price:0.59, pkgSize:null, pkgUnit:null, aliases:["frischer zitronensaft","saft einer zitrone"], splits:null, pantryBase:true, priceSource:"rewe" },
];
