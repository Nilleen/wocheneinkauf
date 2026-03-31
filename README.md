# Wocheneinkauf — Weekly Meal Prep App

A mobile-first Progressive Web App for weekly meal planning and grocery shopping, built for a real household and used weekly.

**Live app:** [mealprepwiki.netlify.app](https://mealprepwiki.netlify.app)

<table align="center">
  <tr>
    <td><img src="https://github.com/user-attachments/assets/4cceb53e-764f-424b-a5c1-195721b87d6c" width="250" /></td>
    <td><img src="https://github.com/user-attachments/assets/2d9f1a17-2749-4593-84ed-1b030483925f" width="250" /></td>
    <td><img src="https://github.com/user-attachments/assets/d1afe0d6-81b3-4ecf-8453-245dbc391c65" width="250" /></td>
  </tr>
</table>

---

## What it does

**Wocheneinkauf** ("Weekly Shopping" in German) is used by a household to plan and shop for the week:

- Browse and select recipes for the week with servings and day assignments
- Auto-generate a shopping list from selected recipes, grouped by supermarket aisle
- Track pantry inventory — check off items while shopping and stock updates automatically
- Mark recipes as cooked, which deducts the correct scaled quantities from pantry
- Estimate grocery costs based on REWE supermarket prices
- Share the plan in real time between household members via a join code
- Full English / German language toggle
- Archive past weeks for history
- Works offline and is installable as a PWA

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (JSX, no TypeScript) + Vite 5 |
| State | `useReducer` + `useContext` — no Redux/Zustand |
| Database & Auth | Firebase Realtime Database + Firebase Auth (SDK v10 modular) |
| Hosting | Netlify (auto-deploy on push to `master`) |
| PWA | Service worker + Web App Manifest |
| Styling | Inline styles + CSS variables — no Tailwind, no CSS modules |
| i18n | Custom flat key-value system with `useT()` hook |

---

## Key features built from scratch

- **Real-time multi-user sync** — two people can shop simultaneously; the list updates live via Firebase subscriptions
- **Ingredient intelligence** — compound ingredients (e.g. "Basil / Oregano") are split into separate shopping items; aliases merge duplicates (e.g. "Balsamic-Crème" and "Balsamicocreme" become one pantry entry)
- **Smart pantry deduction** — marking a recipe as cooked automatically subtracts the correct scaled quantities from pantry inventory
- **Shopping list persistence** — checked items survive tab navigation within a session; auto-clear on new week
- **Price estimation** — REWE price estimates with per-portion breakdown using proportional package-size calculations
- **Offline-first PWA** — installable on phone, works without internet after first load

---

## Architecture highlights

- `App` / `AppContent` split prevents React hooks-after-early-returns violations that caused white screens on auth state transitions
- All Firebase paths are household-scoped under `/households/{CODE}/data/...` for multi-tenant isolation
- Single `useReducer` handles all app state; Firebase subscriptions dispatch into it
- `guardWrite()` wrapper blocks guest users from any write operation with a toast notification, instead of checking auth in every handler

---

## Running locally

```bash
git clone https://github.com/Nilleen/wocheneinkauf.git
cd wocheneinkauf
npm install
npm run dev
```

No `.env` file needed — Firebase config is intentionally public (security is enforced by Firebase rules, not key secrecy).

---

## Project background

Built as a personal household tool that my partner and I actually use every week. Started as a simple recipe list and grew into a full meal planning system over several iterations — adding real-time sync, pantry tracking, ingredient intelligence, and PWA support along the way.
