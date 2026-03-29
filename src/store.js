import { weekId } from './utils.js';
import { getSel } from './utils.js';

export const initialState = {
  view: "recipes",
  loading: true,
  sync: "connecting",
  recipes: [],
  ingState: {},
  sels: {},
  profile: { favourites: {}, ratings: {}, notes: {}, lastCooked: {} },
  customPantry: {},
  pantryInventory: {},
  history: {},
  darkMode: "auto",
  weekId: weekId(0),
  weekOffset: 0,
  // modals
  selRecipe: null,
  showReset: false,
  showSettings: false,
  showThisWeek: false,
  showAddRecipe: false,
  showClaude: false,
  showPWA: false,
};

export function appReducer(state, action) {
  switch (action.type) {
    case "SET_VIEW":        return { ...state, view: action.view };
    case "SET_LOADING":     return { ...state, loading: action.v };
    case "SET_SYNC":        return { ...state, sync: action.v };
    case "SET_RECIPES":     return { ...state, recipes: action.v };
    case "SET_ING_STATE":   return { ...state, ingState: action.v };
    case "SET_SELS":        return { ...state, sels: action.v };
    case "SET_PROFILE":     return { ...state, profile: { ...state.profile, ...action.v } };
    case "SET_CUSTOM_PANTRY": return { ...state, customPantry: action.v };
    case "SET_PANTRY_INV":  return { ...state, pantryInventory: action.v };
    case "SET_HISTORY":     return { ...state, history: action.v };
    case "SET_DARK_MODE":   return { ...state, darkMode: action.v };
    case "SET_WEEK":        return { ...state, weekOffset: action.offset, weekId: weekId(action.offset) };
    case "PATCH_ING": {
      const upd = { ...state.ingState[action.id], ...action.patch };
      return { ...state, ingState: { ...state.ingState, [action.id]: upd } };
    }
    case "PATCH_SEL": {
      return { ...state, sels: { ...state.sels, [action.key]: { ...getSel(state.sels, action.key), ...action.patch } } };
    }
    case "SET_FAV":    return { ...state, profile: { ...state.profile, favourites: { ...state.profile.favourites, [action.key]: action.v } } };
    case "SET_RATING": return { ...state, profile: { ...state.profile, ratings:    { ...state.profile.ratings,    [action.key]: action.v } } };
    case "SET_NOTE":   return { ...state, profile: { ...state.profile, notes:      { ...state.profile.notes,      [action.key]: action.v } } };
    case "OPEN_RECIPE":  return { ...state, selRecipe: action.recipe };
    case "CLOSE_RECIPE": return { ...state, selRecipe: null };
    case "SHOW_MODAL":   return { ...state, [action.modal]: true };
    case "HIDE_MODAL":   return { ...state, [action.modal]: false };
    default: return state;
  }
}
