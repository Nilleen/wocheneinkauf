import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove, onValue } from 'firebase/database';
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInAnonymously, signOut as fbSignOut, onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyC5l7U2aJzg8MBl6d7cyHb8Le6edDWLYw8",
  authDomain:        "mealprep-b7fd8.firebaseapp.com",
  databaseURL:       "https://mealprep-b7fd8-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "mealprep-b7fd8",
  storageBucket:     "mealprep-b7fd8.firebasestorage.app",
  messagingSenderId: "791535788612",
  appId:             "1:791535788612:web:78bdc7642e75912395d211",
};

const app  = initializeApp(firebaseConfig);
const db   = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ── ACTIVE HOUSEHOLD CODE ──────────────────────────────────────────────────
// Set once after auth resolves; all path builders depend on it.
let _code = null;
function setHouseholdCode(code) { _code = code; }
function getHouseholdCode()     { return _code; }

// ── DB PATH BUILDERS (household-scoped) ───────────────────────────────────
const hd           = (sub)       => `households/${_code}/data/${sub}`;
const weekMeta     = (wid)       => hd(`weeks/${wid}/meta`);
const weekSel      = (wid)       => hd(`weeks/${wid}/selections`);
const weekState    = (wid)       => hd(`weeks/${wid}/state`);
const pantryInv    = ()          => hd(`pantry/inventory`);
const pantryCustom = ()          => hd(`pantry/custom`);
const profile      = ()          => hd(`profile`);
const favs         = ()          => hd(`profile/favourites`);
const history      = ()          => hd(`history`);
const settings     = ()          => hd(`settings`);
const recipes      = ()          => hd(`recipes`);
const ingredients  = ()          => hd(`ingredientDB`);

// ── HOUSEHOLD PATHS ────────────────────────────────────────────────────────
const hhMeta       = (code)      => `households/${code || _code}/meta`;
const hhMembers    = (code)      => `households/${code || _code}/members`;
const hhMemberPath = (code, uid) => `households/${code || _code}/members/${uid}`;
// Quick lookup index: /householdMembers/{uid} → { code, displayName, ... }
const memberIndex  = (uid)       => `householdMembers/${uid}`;

// ── DB HELPERS ─────────────────────────────────────────────────────────────
async function getOnce(path)       { return (await get(ref(db, path))).val(); }
async function fbSet(path, val)    { return set(ref(db, path), val); }
async function fbUpdate(path, val) { return update(ref(db, path), val); }
async function fbRemove(path)      { return remove(ref(db, path)); }
function sub(path, cb, ecb) {
  const unsub = onValue(ref(db, path), snap => cb(snap.val()), e => { if (ecb) ecb(e); });
  return unsub;
}

// ── AUTH HELPERS ───────────────────────────────────────────────────────────
const signInGoogle  = () => signInWithPopup(auth, googleProvider);
const signInGuest   = () => signInAnonymously(auth);
const signOut       = () => fbSignOut(auth);
const onAuthChange  = (cb) => onAuthStateChanged(auth, cb);

// Returns true if a household with this code already exists
async function householdExists(code) {
  return (await get(ref(db, hhMeta(code)))).exists();
}

// Returns the member index record { code, displayName, ... } or null
async function getMemberRecord(uid) {
  return getOnce(memberIndex(uid));
}

// Returns active household code (for display in Settings)
async function getJoinCode() {
  return _code || null;
}

// Add a Google user as a member of an existing household.
// Writes member index FIRST so subsequent Firebase rule checks resolve membership.
async function joinHousehold(uid, displayName, email, code) {
  const c = code.toUpperCase();
  // 1. Member index (uid → code; this makes rule checks pass for subsequent writes)
  await fbSet(memberIndex(uid), { code: c, displayName: displayName || "Member", email: email || "", joinedAt: Date.now() });
  // 2. Member record inside the household node
  await fbSet(hhMemberPath(c, uid), { displayName: displayName || "Member", email: email || "", joinedAt: Date.now() });
}

// Create a brand-new household. Sequential writes so each step's rules pass.
async function setupHousehold(uid, displayName, email, code) {
  const c = code.toUpperCase();
  // 1. Member index — after this, rule `householdMembers/{uid}/code === c` is TRUE
  await fbSet(memberIndex(uid), { code: c, displayName: displayName || "Owner", email: email || "", joinedAt: Date.now() });
  // 2. Member record (rules allow because $uid === auth.uid)
  await fbSet(hhMemberPath(c, uid), { displayName: displayName || "Owner", email: email || "", joinedAt: Date.now(), role: "owner" });
  // 3. Household meta (rules now allow because member index proves membership)
  await fbSet(hhMeta(c), { joinCode: c, createdAt: Date.now() });
}

export const FB = {
  // Household code
  setHouseholdCode, getHouseholdCode,
  // DB path builders
  weekMeta, weekSel, weekState, pantryInv, pantryCustom,
  profile, favs, history, settings, recipes, ingredients,
  hhMeta, hhMembers, hhMemberPath, memberIndex,
  // DB ops
  getOnce, set: fbSet, update: fbUpdate, remove: fbRemove, sub,
  // Auth
  auth, signInGoogle, signInGuest, signOut, onAuthChange,
  householdExists, getMemberRecord, getJoinCode, joinHousehold, setupHousehold,
};
