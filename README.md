CLAUDE.md — Wocheneinkauf (Weekly Meal Prep App)

Complete onboarding guide for a fresh Claude Code instance. Read this in full before making any changes.
What This App Does

Wocheneinkauf ("Weekly Shopping" in German) is a mobile-first Progressive Web App for weekly meal planning and grocery shopping. It is used by a household (currently one family) to:

    Browse and select recipes for the week
    Auto-generate a shopping list from selected recipes, grouped by supermarket aisle
    Track pantry inventory (what you already have at home)
    Check off items during shopping, which automatically updates pantry stock
    Track ingredient availability status (have / partial / missing)
    Estimate grocery costs (REWE supermarket prices)
    Archive past weeks for history
    Share the household plan between multiple users in real-time

The app is in German by default, with English toggle. The target store is REWE (German supermarket chain). The primary users are a couple who use the same household code to sync their shopping in real time.
Tech Stack
Layer 	Technology
Frontend framework 	React 18 (JSX, no TypeScript)
Build tool 	Vite 5
State management 	useReducer + useContext (no Redux/Zustand)
Database & Auth 	Firebase Realtime Database + Firebase Auth (SDK v10 modular)
Hosting / CI 	Netlify (auto-deploy on push to master)
Source control 	GitHub (Nilleen/wocheneinkauf)
PWA 	Service worker in public/sw.js, Web App Manifest in public/manifest.json
Styling 	Inline styles + CSS variables in src/index.css (no Tailwind, no CSS modules)
i18n 	Custom flat key-value system in src/i18n.js, accessed via useT() hook
