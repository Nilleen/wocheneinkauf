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

// ── DB PATH BUILDERS ───────────────────────────────────────────────────────
const weekMeta     = (wid) => `mealprep/weeks/${wid}/meta`;
const weekSel      = (wid) => `mealprep/weeks/${wid}/selections`;
const weekState    = (wid) => `mealprep/weeks/${wid}/state`;
const pantryInv    = ()    => `mealprep/pantry/inventory`;
const pantryCustom = ()    => `mealprep/pantry/custom`;
const profile      = ()    => `mealprep/profile`;
const favs         = ()    => `mealprep/profile/favourites`;
const history      = ()    => `mealprep/history`;
const settings     = ()    => `mealprep/settings`;
const recipes      = ()    => `mealprep/recipes`;

// Household paths (for auth/membership)
const householdMembers = ()      => `householdMembers`;
const householdMeta    = ()      => `householdMeta`;
const memberPath       = (uid)   => `householdMembers/${uid}`;

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

async function checkMembership(uid) {
  return (await get(ref(db, memberPath(uid)))).val() != null;
}
async function getJoinCode() {
  return (await get(ref(db, `${householdMeta()}/joinCode`))).val();
}
async function getMemberCount() {
  const snap = await get(ref(db, householdMembers()));
  const val = snap.val();
  return val ? Object.keys(val).length : 0;
}
async function joinHousehold(uid, displayName, email) {
  await fbSet(memberPath(uid), { displayName: displayName || "Member", email: email || "", joinedAt: Date.now() });
}
async function setupHousehold(uid, displayName, email, joinCode) {
  // Sets the join code and adds the first member atomically
  await fbUpdate(householdMeta(), { joinCode, createdAt: Date.now() });
  await joinHousehold(uid, displayName, email);
}

export const FB = {
  // DB paths
  weekMeta, weekSel, weekState, pantryInv, pantryCustom,
  profile, favs, history, settings, recipes,
  householdMembers, householdMeta, memberPath,
  // DB ops
  getOnce, set: fbSet, update: fbUpdate, remove: fbRemove, sub,
  // Auth
  auth, signInGoogle, signInGuest, signOut, onAuthChange,
  checkMembership, getJoinCode, getMemberCount, joinHousehold, setupHousehold,
};
