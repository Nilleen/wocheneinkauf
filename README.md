# 🥗 Wocheneinkauf — Weekly Meal Prep App

A mobile-first Progressive Web App for weekly meal planning and grocery shopping, built for a real household and used weekly.

**Live app:** [mealprepwiki.netlify.app](https://mealprepwiki.netlify.app)

---

## What it does

Plan your meals for the week, generate a grouped shopping list automatically, and track what's already in your pantry — all synced in real time between household members.

- Browse and select recipes for the week with servings and day assignments
- Auto-generate a shopping list grouped by supermarket aisle
- Check off items while shopping — pantry inventory updates automatically
- Track what you have at home and mark recipes as cooked (deducts pantry stock)
- Shared in real time between household members via a join code
- Full English / German language toggle
- Works offline and is installable as a PWA

---

## Screenshots

> 📱 Mobile-first — all screenshots at 390×844 (iPhone 14 size)

### Recipe browser
![Recipe browser](docs/screenshots/recipes.png)

### Shopping list
![Shopping list grouped by aisle](docs/screenshots/shopping.png)

### Pantry inventory
![Pantry inventory with inline quantity editing](docs/screenshots/pantry.png)

### Week overview
![Week overview with selected recipes](docs/screenshots/week.png)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (JSX) + Vite 5 |
| State | `useReducer` + `useContext` — no Redux |
| Database & Auth | Firebase Realtime Database + Firebase Auth |
| Hosting | Netlify (auto-deploy on push to `master`) |
| PWA | Service worker + Web App Manifest |
| Styling | Inline styles + CSS variables (no Tailwind) |
| i18n | Custom EN/DE translation system |

---

## Key features built from scratch

- **Real-time multi-user sync** — two people can shop simultaneously; the list updates live via Firebase subscriptions
- **Ingredient intelligence** — compound ingredients (e.g. "Basil / Oregano") are split into separate shopping items; aliases merge duplicates (e.g. "Balsamic-Crème" and "Balsamicocreme" become one pantry entry)
- **Smart pantry deduction** — marking a recipe as cooked automatically subtracts the correct scaled quantities from pantry inventory
- **Shopping list persistence** — checked items survive tab navigation within a session; auto-clear on new week
- **Price estimation** — REWE supermarket price estimates with per-portion breakdown, using proportional package-size calculations
- **Offline-first PWA** — installable on phone, works without internet after first load

---

## Architecture highlights

- Auth flows through `AuthContext` → `AppContent` split to avoid React hooks-after-early-returns violations
- All Firebase paths are household-scoped under `/households/{CODE}/data/...` for multi-tenant isolation
- Single `useReducer` handles all app state; Firebase subscriptions dispatch into it
- `guardWrite()` wrapper blocks guest users from any write operation with a toast, rather than checking auth in each handler individually

---

## Running locally

```bash
git clone https://github.com/Nilleen/wocheneinkauf.git
cd wocheneinkauf
npm install
npm run dev
```

No `.env` file needed — Firebase config is intentionally public (security enforced by Firebase rules, not key secrecy).

---

## Project background

Built as a personal household tool that my partner and I actually use every week. Started as a simple recipe list and grew into a full meal planning system over several iterations — adding real-time sync, pantry tracking, ingredient intelligence, and PWA support along the way.
