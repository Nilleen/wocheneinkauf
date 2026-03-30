# CLAUDE.md — Wocheneinkauf (Weekly Meal Prep App)

Complete onboarding guide for a fresh Claude Code instance. Read this in full before making any changes.

---

## What This App Does

**Wocheneinkauf** ("Weekly Shopping" in German) is a mobile-first Progressive Web App for weekly meal planning and grocery shopping. It is used by a household (currently one family) to:

- Browse and select recipes for the week
- Auto-generate a shopping list from selected recipes, grouped by supermarket aisle
- Track pantry inventory (what you already have at home)
- Check off items during shopping, which automatically updates pantry stock
- Track ingredient availability status (have / partial / missing)
- Estimate grocery costs (REWE supermarket prices)
- Archive past weeks for history
- Share the household plan between multiple users in real-time

The app is in German by default, with English toggle. The target store is REWE (German supermarket chain). The primary users are a couple who use the same household code to sync their shopping in real time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 (JSX, no TypeScript) |
| Build tool | Vite 5 |
| State management | `useReducer` + `useContext` (no Redux/Zustand) |
| Database & Auth | Firebase Realtime Database + Firebase Auth (SDK v10 modular) |
| Hosting / CI | Netlify (auto-deploy on push to `master`) |
| Source control | GitHub (`Nilleen/wocheneinkauf`) |
| PWA | Service worker in `public/sw.js`, Web App Manifest in `public/manifest.json` |
| Styling | Inline styles + CSS variables in `src/index.css` (no Tailwind, no CSS modules) |
| i18n | Custom flat key-value system in `src/i18n.js`, accessed via `useT()` hook |

**No environment variables are used.** The Firebase config is hardcoded in `src/firebase.js` — this is intentional and safe because Firebase API keys are public identifiers; security is enforced by Firebase security rules.

---

## Architecture Overview

```
src/
├── main.jsx              Entry point — wraps App in AuthProvider
├── App.jsx               Auth gate (thin) + AppContent (all app logic + hooks)
├── AuthContext.jsx       Auth state machine + household code management
├── firebase.js           All Firebase operations, path builders, auth helpers
├── store.js              useReducer state + appReducer (all app state)
├── constants.js          SEED recipes, prices, aisles, FLAGS, translations map
├── utils.js              Pure helper functions (week IDs, ingredient normalisation, pricing)
├── i18n.js               EN/DE translation strings (flat key-value)
├── LangContext.jsx        LangContext + useT() + useLang() hooks
├── toast.js              Module-level toast singleton (showToast exported globally)
└── components/           20 UI components (see below)
```

### Critical Architecture Decisions

1. **`App.jsx` is split into two components**: `App` (auth gate only, no hooks after early returns) and `AppContent` (all hooks, no early returns). This prevents a React rules-of-hooks violation that caused white screens when auth status transitioned.

2. **Firebase paths are household-scoped**: All app data lives under `/households/{CODE}/data/...`. The active household code is stored in a module-level variable `_code` in `firebase.js`, set via `FB.setHouseholdCode(code)` after auth resolves.

3. **No TypeScript** — the codebase uses plain JSX/JS throughout.

4. **All styles are inline** — CSS variables defined in `index.css` are used for theming (dark/light mode). No component has a separate `.css` file.

5. **State is a single `useReducer`** — all app state (recipes, pantry, week selections, UI modals) lives in one reducer in `store.js`. Firebase subscriptions dispatch actions into it.

---

## Firebase Setup

### Project
- **Project ID**: `mealprep-b7fd8`
- **Database URL**: `https://mealprep-b7fd8-default-rtdb.europe-west1.firebasedatabase.app`
- **Location**: Belgium (europe-west1)
- **Auth providers enabled**: Google Sign-In, Anonymous

### Database Structure

```
/
├── householdMembers/
│   └── {uid}/
│       ├── code: "WIKIS"        ← quick lookup index: which household this user belongs to
│       ├── displayName: "..."
│       ├── email: "..."
│       └── joinedAt: timestamp
│
└── households/
    └── {CODE}/                  ← CODE is the household's join code (e.g. "WIKIS")
        ├── meta/
        │   ├── joinCode: "WIKIS"
        │   └── createdAt: timestamp
        ├── members/
        │   └── {uid}/{ displayName, email, joinedAt, role? }
        └── data/
            ├── recipes/         ← custom + seed recipes for this household
            ├── weeks/
            │   └── {YYYY-WNN}/
            │       ├── meta/    ← week label, start/end dates
            │       ├── selections/ ← which recipes are selected + servings + day
            │       └── state/   ← ingredient have/status/note per ingredient ID
            ├── pantry/
            │   ├── inventory/   ← { normKey: { qty, unit, lastUpdated } }
            │   └── custom/      ← user-added custom pantry items
            ├── profile/
            │   ├── favourites/
            │   ├── ratings/
            │   ├── notes/
            │   └── lastCooked/
            ├── history/         ← archived weeks
            └── settings/        ← darkMode, lang
```

### Security Rules (database.rules.json)
- `householdMembers/{uid}`: readable/writable only by that uid (non-anonymous)
- `households/{code}/meta`: readable by anyone authenticated; writable only by members of that code
- `households/{code}/members/{uid}`: writable by the uid themselves or existing members
- `households/{code}/data`: readable by any authenticated user; writable only by members of that code
- Anonymous users (guests) can read but not write anything

**IMPORTANT**: After changing `database.rules.json`, you must manually paste the new rules into Firebase Console → Realtime Database → Rules tab and click Publish. The file in the repo is just documentation/source-of-truth — it is NOT automatically deployed.

---

## Auth Flow

States: `loading` → `none` → `pending` → `member` | `guest`

```
App loads
  └─ loading (spinner shown)
       ├─ Not signed in → none → LoginScreen (Google button + Guest button)
       │    ├─ Google sign-in → check householdMembers/{uid}
       │    │    ├─ Has record with code → member (full access)
       │    │    └─ No record → pending → JoinCodeModal
       │    │         ├─ Enter existing code → joinHousehold() → member
       │    │         └─ Enter new code → setupHousehold() → member
       │    └─ Guest → guest (anonymous) → AppContent (read-only, SEED recipes only)
       └─ Signed in previously → repeats check above
```

**Guest users** see SEED recipes in read-only mode. No Firebase reads/writes happen for guests. `_code` remains null.

**Members** have full read/write. All Firebase paths use `_code` (set via `FB.setHouseholdCode()`).

**Household setup write order** (critical for Firebase rules to pass):
1. Write `householdMembers/{uid}` first (enables rule `householdMembers/{uid}/code === code`)
2. Write `households/{code}/members/{uid}` (rules allow: `$uid === auth.uid`)
3. Write `households/{code}/meta` (rules now pass because step 1 established membership)

---

## Netlify Deployment

- **Site**: mealprepwik (on Netlify)
- **Repo**: `Nilleen/wocheneinkauf` on GitHub
- **Branch**: `master` → auto-deploys to production on every merge
- **Build command**: `npm install && npm run build`
- **Publish dir**: `dist`
- **Node version**: 20
- **Secrets scanner**: disabled (`SECRETS_SCAN_SMART_DETECTION_ENABLED = "false"`) because Firebase API keys look like secrets but are intentionally public

### Deploy Workflow
1. All development happens on branch `claude/thirsty-kapitsa` (or a new branch per session)
2. Changes are committed and pushed to that branch
3. User creates a PR on GitHub: `https://github.com/Nilleen/wocheneinkauf/compare/master...claude/thirsty-kapitsa`
4. User merges the PR → Netlify auto-deploys
5. The `gh` CLI is NOT available in this environment — use the GitHub URL above to create PRs

---

## Project Structure — File by File

### `src/main.jsx`
Entry point. Wraps `<App>` with `<AuthProvider>`. Registers service worker.

### `src/App.jsx`
Two components:
- `App` — auth gate only. Renders spinner/LoginScreen/JoinCodeModal based on `authState.status`. Renders `<AppContent key={householdCode}>` for authenticated users. The `key` prop ensures AppContent remounts cleanly on household change.
- `AppContent` — all app logic. Contains all `useEffect`, `useCallback`, `useMemo` hooks. No early returns (required for rules-of-hooks). Handles Firebase subscriptions, write handlers, week navigation, reset/archive, mark-as-cooked.

### `src/AuthContext.jsx`
- `AuthProvider` — listens to `onAuthStateChanged`, checks `householdMembers/{uid}` for membership, sets auth state.
- `enterHouseholdCode(code)` — exported via context. Called by JoinCodeModal. Creates or joins a household.
- `useAuth()` — returns `{ status, user, householdCode, enterHouseholdCode }`
- `useCanWrite()` — returns `true` only when `status === "member"`

### `src/firebase.js`
- Module-level `_code` variable holds active household code
- `FB.setHouseholdCode(code)` — call this when user authenticates
- All path builders (`weekMeta`, `weekSel`, etc.) use `_code` internally via `hd(sub)` helper
- `FB.sub(path, cb, errorCb)` — subscribes to Firebase realtime updates
- `FB.setupHousehold(uid, name, email, code)` — creates new household (sequential writes for rule compliance)
- `FB.joinHousehold(uid, name, email, code)` — adds user to existing household

### `src/store.js`
Single `useReducer` for all app state. Key state fields:
- `recipes` — array of recipe objects (from Firebase)
- `ingState` — `{ [ingId]: { status, have, note } }` — per-ingredient status for current week
- `sels` — `{ [recipeKey]: { selected, servings, day } }` — recipe selections for current week
- `profile` — `{ favourites, ratings, notes, lastCooked }` — user preferences
- `pantryInventory` — `{ [normKey]: { qty, unit, lastUpdated } }` — what's in the pantry
- `customPantry` — `{ [id]: { name, ... } }` — user-added pantry items
- `weekId` — current ISO week string e.g. `"2026-W14"`

### `src/constants.js`
- `FLAGS` — feature flags (all currently true). Toggle to disable features.
- `AISLES` — shopping aisle definitions with display labels
- `REWE_PRICES` — price estimates for ~60 common ingredients (EUR, normalized names)
- `REWE_PKG_SIZES` — package sizes for proportional price calculation
- `AISLE_OVERRIDES` — force ingredients to correct aisles (e.g. "mais" → "dry")
- `ING_ALIASES` — normalize ingredient name variants (e.g. "balsamic-crème" → "Balsamicocreme")
- `ING_SPLITS` — split compound ingredients into separate shopping items
- `ING_TRANS_EN` — German ingredient names → English display names
- `SPICES` — HelloFresh spice blend names → REWE equivalent products
- `PROTEINS` — recipe protein type metadata (emoji, color, label)
- `DAYS` — day-of-week with German `label` and English `labelEN`
- `SEED` — 5 hardcoded starter recipes. Seeded to Firebase on first use if no recipes exist.

### `src/utils.js`
Pure functions:
- `weekId(offset)` — ISO week string for current week ± offset
- `weekLabel(wid)` / `weekShort(wid)` — format week ID for display
- `normIngName(name)` — normalize ingredient name for use as DB key (lowercase, remove "bio", normalize plurals)
- `normShop(name)` — normalize for shopping display (apply aliases, spice mappings)
- `expandIngredient(ing)` — split compound ingredients (ING_SPLITS)
- `parseAmt(str)` — parse amount string like "300g" → `{ num: 300, unit: "g" }`
- `scaleAmt(str, factor)` — scale an amount string by a factor
- `combineAmts(arr)` — sum array of amount strings by unit
- `needAmt(ing, recipeKey, sels)` — scaled amount needed based on selected servings
- `estimateRecipePrice(recipe, servings)` — returns `{ total, perPortion, unknownNames, hasFuzzy }`
- `fuzzyPriceLookup(normName)` — looks up REWE price with substring fallback
- `toBaseUnit(num, unit)` — convert g/kg/ml/l/EL/TL to base unit for price math
- `getSel(sels, key)` — get selection for recipe key (with defaults)
- `fromFB(data)` — convert Firebase recipe data to app recipe array format
- `buildInit(recipes)` — build initial ingState from recipes
- `buildDefSel(recipes)` — build default sels object from recipes
- `haptic(pattern)` — trigger vibration if FLAGS.haptics is on

### `src/i18n.js`
Flat `T` object with `en` and `de` keys. All UI strings. Keys are snake_case. Variables use `{varName}` syntax. Example: `T.en.recipes_selected = "{count} Recipe{s} selected for {week}"`.

### `src/LangContext.jsx`
- `LangContext` — React context holding current language string ("en" or "de")
- `useLang()` — returns current language string
- `useT()` — returns `t(key, vars?)` function for translations

### `src/toast.js`
Module-level singleton. Import `showToast(message)` anywhere to show a toast. `ToastManager` component calls `setToastSetter` to register its state setter.

---

## Components Reference

| Component | Purpose |
|---|---|
| `LoginScreen` | Auth landing page. Google sign-in button + "Continue as Guest". Dark green gradient background. |
| `JoinCodeModal` | Shown when `status === "pending"`. Google users: enter code to join/create. Guests: not shown (guests skip directly to app). |
| `RecipesView` | Main recipe browser with search, filters (protein, time, difficulty), sort options, favourites filter |
| `RecipeCard` | Single recipe card with image, stats, select button, portions control, day picker, 🍳 cooked button with confirmation |
| `RecipeModal` | Full recipe detail sheet: ingredients, instructions, price estimate, note editor, rating |
| `ChecklistView` | Ingredient checklist for current week — tap to mark have/need |
| `ShoppingView` | Shopping list grouped by aisle. Tap to check, swipe left to mark available. Confirm purchases → syncs to pantry |
| `PantryView` | Pantry inventory. Tap to toggle stocked. Tap quantity number to edit inline. +/− buttons. Unit dropdown. |
| `ThisWeekModal` | Week overview: selected recipes, servings, day assignments, nutrition, price total, 🍳 cooked buttons |
| `SettingsModal` | Dark mode, language, account info, join code display (for members), week history |
| `HistoryModal` | View archived past weeks |
| `AddRecipeModal` | Create custom recipe: name, emoji, time, difficulty, kcal, protein type, ingredients (number + unit + aisle) |
| `AddPantryModal` | Add a custom pantry item |
| `ClaudeModal` | Copy app context to paste into Claude AI for recipe updates |
| `ConfirmModal` | Generic yes/no confirmation dialog |
| `IngRow` | Ingredient row used in ChecklistView — status toggle, have/note inputs |
| `SwipeItem` | Swipeable wrapper component for shopping list items |
| `SmallComponents` | `SkeletonCards` loading placeholder, other shared tiny components |
| `ToastManager` | Renders toast notifications, registers with toast.js singleton |
| `QuickRatingSheet` | Quick star rating bottom sheet |

---

## Coding Conventions

### Style
- **Inline styles everywhere** — `style={{ fontSize: 14, color: "var(--tx)" }}`
- **CSS variables** for theming: `--tx` (text), `--tx2`, `--tx3`, `--ac` (accent green), `--acbg`, `--sur` (surface), `--sur2`, `--bdr` (border), `--bdr2`, `--hd` (header), `--ht` (header text), `--hs` (header secondary), `--dan` (danger red)
- **No Tailwind, no SCSS, no CSS modules**
- CSS class names are minimal: `btn`, `card`, `overlay`, `sheet`, `sup`, `sbar`, `fbar`, `aisle-h`, `scroll`, `bnav`, `nbt`, `fab`, `prog`, `progf`, `pls`, `nutr-bar-bg`, `nutr-bar-fg`

### React Patterns
- Functional components only, no class components
- `useReducer` for all global state, `useState` for local UI state
- `useCallback` for write handlers (passed down as props)
- `guardWrite(fn)` wrapper in AppContent — checks `isMember` before calling fn, shows toast if not
- No custom hooks beyond `useAuth`, `useCanWrite`, `useT`, `useLang`
- **Never put hooks after early returns** — caused a white screen bug. AppContent has no early returns.

### Firebase Operations
- Always use `FB.set(path, value)`, `FB.update(path, patch)`, `FB.remove(path)`
- Paths are always built via path builder functions (e.g., `FB.weekState(wid)`) — never hardcode paths
- Subscriptions via `FB.sub(path, callback, errorCallback)`
- All writes go through `guardWrite()` in AppContent to block guest writes

### Ingredient Keys
- Ingredient names are normalized with `normIngName()` before use as database keys
- This removes "bio", normalizes German plurals, lowercases
- Always use `normIngName(name)` as the pantry inventory key, never the raw name

### Naming
- Recipe keys: `r1`, `r2`, ... for seed recipes; `custom_TIMESTAMP` for user-created
- Ingredient IDs: `r1_1`, `r1_2`, ... (recipe key + underscore + index)
- Week IDs: ISO format `YYYY-WNN` (e.g., `2026-W14`)
- Household codes: uppercase strings chosen by users (e.g., `WIKIS`)

---

## Current State of the App

### Working Features
- ✅ Multi-user households with join codes
- ✅ Google Sign-In + Guest (read-only) mode
- ✅ Full EN/DE language toggle
- ✅ Recipe browser with search, filters, sort
- ✅ Recipe selection for the week with servings and day assignment
- ✅ Ingredient checklist (mark have/partial/missing)
- ✅ Shopping list grouped by aisle (combined and by-recipe views)
- ✅ Confirming purchases syncs quantities to pantry inventory
- ✅ Swipe left on shopping item = instantly mark as available + sync pantry
- ✅ Pantry inventory with inline editable qty, +/− buttons, unit selector
- ✅ Pantry preserved across weekly resets (items with qty stay "full")
- ✅ REWE price estimates with per-portion breakdown
- ✅ Mark recipe as cooked (with confirmation) — deducts pantry inventory
- ✅ Cooked button in both RecipeCard and ThisWeekModal
- ✅ Week history archiving
- ✅ Dark/light/auto theme
- ✅ PWA (installable, offline support via service worker)
- ✅ Firebase Realtime sync across devices
- ✅ Firebase security rules (members only write, guests read-only)

### Known Issues / Limitations
- **Existing custom recipes without units**: The Couscous Lachsbowl (and any custom recipe created before the unit-field update) has amounts stored as plain numbers without units (e.g., "600" instead of "600g"). This breaks price estimation proportional calculations and pantry deduction on cook. These need to be manually re-entered in the Add Recipe modal.
- **Firebase rules must be manually deployed**: Changes to `database.rules.json` require manual copy-paste into Firebase Console. There is no automated rules deployment.
- **Guest mode shows SEED recipes only**: Guests see the hardcoded SEED recipes, not the household's custom/imported recipes. This is intentional for privacy.
- **No recipe images for custom recipes**: The photo field exists on recipes but the Add Recipe modal doesn't support image upload.
- **Balsamic-Crème alias issue**: Known but deferred — the ingredient alias system occasionally miscategorizes this item.
- **Recipe names in pantry are truncated to 3 words**: A cosmetic improvement, but very long recipe names may still be unclear.

---

## Deferred / Future Features

These were noted during development but not yet implemented:

- **Favicon** — the app currently uses a generic icon. A custom favicon hasn't been designed.
- **Shorten recipe names in pantry** (partially done — first 3 words shown)
- **Recipe photo upload** for custom recipes
- **Push notifications** for shopping list sharing
- **Barcode scanner** for pantry items
- **Multiple household support per user** — currently a user belongs to exactly one household
- **Recipe import from URL** — was discussed but not implemented

---

## Important Decisions Made

1. **Multi-tenant by household code, not by user**: The household code is the primary identifier. Anyone with the code can join. This was chosen for simplicity — the app is for a family, not enterprise users.

2. **No TypeScript**: The project started without it and adding it mid-project was deemed unnecessary complexity for this use case.

3. **Inline styles, not Tailwind**: Avoids build complexity and keeps bundle size small. CSS variables handle theming cleanly.

4. **Firebase Realtime Database, not Firestore**: Chosen for simplicity and real-time sync. Realtime DB is more straightforward for a small household app.

5. **Single `useReducer` for all state**: Avoids prop drilling and keeps the data flow predictable. All Firebase callbacks dispatch into one reducer.

6. **`guardWrite` pattern**: Rather than checking auth in every individual handler, all write callbacks are wrapped with `guardWrite()` in AppContent. Guests see a toast instead of a silent failure or error.

7. **Secrets scanner disabled on Netlify**: Firebase API keys are public identifiers by design. Firebase security is enforced by database rules, not key secrecy. The scanner false-positive was blocking all deployments.

8. **Sequential writes for household setup**: Firebase rules depend on the member index existing before meta can be written. The three-step sequential write (index → member → meta) is intentional and must not be changed to a concurrent multi-path update.

9. **`key={householdCode}` on AppContent**: Forces React to remount AppContent when the household changes, resetting all hooks and Firebase subscriptions to a clean state. This was the fix for the white screen caused by hooks-after-early-returns.

---

## Development Setup

```bash
# Clone and install
git clone https://github.com/Nilleen/wocheneinkauf.git
cd wocheneinkauf
npm install

# Run dev server (port 5173)
npm run dev

# Build for production
npm run build
```

No `.env` file is needed. Firebase config is in `src/firebase.js`.

### Branch Strategy
- `master` — production branch, auto-deploys to Netlify
- `claude/thirsty-kapitsa` — current development branch (may differ per session)
- Always work on a feature branch and PR into master

### Making a PR (gh CLI not available)
Open this URL in a browser:
```
https://github.com/Nilleen/wocheneinkauf/compare/master...YOUR_BRANCH_NAME
```

---

## Firebase Console Access

- **Console**: https://console.firebase.google.com/project/mealprep-b7fd8
- **Realtime Database**: https://console.firebase.google.com/project/mealprep-b7fd8/database
- **Authentication**: https://console.firebase.google.com/project/mealprep-b7fd8/authentication
- **Required auth providers**: Google, Anonymous (must be enabled in Firebase Console)
- **Authorized domains**: Must include the Netlify domain in Firebase Auth settings

---

## CSS Variable Reference

| Variable | Use |
|---|---|
| `--tx` | Primary text |
| `--tx2` | Secondary text |
| `--tx3` | Tertiary/muted text |
| `--ac` | Accent color (dark green `#2d4a35`) |
| `--acbg` | Accent background (light green tint) |
| `--sur` | Surface / card background |
| `--sur2` | Secondary surface |
| `--bdr` | Border color |
| `--bdr2` | Secondary border |
| `--hd` | Header background |
| `--ht` | Header title text |
| `--hs` | Header secondary text |
| `--dan` | Danger red |
| `--nav` | Bottom nav height |
| `--sab` | Safe area bottom (iOS) |
| `--wn` | Warning color |
