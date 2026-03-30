# Changelog

All notable changes to Wocheneinkauf are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

Releases are triggered by pushing a git tag: `git tag v1.x && git push --tags`

---

## [Unreleased]

### Added
- Vite build system — eliminates in-browser Babel, ~3× faster load time
- Proper file structure: `src/` with separate components, utils, constants, firebase module
- PWA support: `manifest.json`, `sw.js` (cache-first service worker), `icon.svg`
- GitHub Actions workflow: auto-creates GitHub Release + changelog on tag push
- Netlify tag-only deploys: pushes to `master` no longer trigger a build
- Day assignment (Mo–So) per recipe — plan which recipe you cook on which day
- "Aus Vorrat kochbar" filter in recipe view — shows recipes where ≥70% of ingredients are stocked
- Offline indicator banner — notifies when device is offline
- Price now includes ALL ingredients (incl. pantry staples), scales with selected portion count
- Price note clarifies estimate is for all ingredients regardless of pantry

### Changed
- Firebase SDK migrated from CDN compat scripts to npm modular SDK (`firebase@10`)
- `index.html` is now a clean Vite entry shell
- Serving counter `−`/`+` buttons have larger tap targets (30×30px minimum)
- Week navigation arrows `‹`/`›` have larger tap targets (36×32px minimum)
- Price label in recipe cards now shows 💰 and includes all ingredients

---

## [1.0.0] - 2024-01-01

### Added
- Initial release built with Claude Chat
- Recipe library with 5 HelloFresh-style seed recipes
- Weekly meal planner with ISO week navigation
- Smart shopping list grouped by REWE aisle
- Ingredient checklist with status tracking (❌ / ⚠️ / ✅)
- Pantry inventory with quantity tracking
- Serving scaler per recipe
- Price estimates based on REWE prices
- Nutrition dashboard (kcal overview)
- Prep/cook time timeline
- Star ratings and personal notes per recipe
- Favourite recipes
- Dark / light / auto theme
- Firebase Realtime Database sync across devices
- PWA-ready (add to home screen)
- Swipe gestures on shopping list
- "Claude context" button to copy weekly state for Claude Chat
- Custom recipe creation
- Week history archive
- HelloFresh spice blend → REWE equivalent mapping
- Ingredient alias and split normalisation
