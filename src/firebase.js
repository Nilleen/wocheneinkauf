import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey:            "AIzaSyC5l7U2aJzg8MBl6d7cyHb8Le6edDWLYw8",
  authDomain:        "mealprep-b7fd8.firebaseapp.com",
  databaseURL:       "https://mealprep-b7fd8-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "mealprep-b7fd8",
  storageBucket:     "mealprep-b7fd8.firebasestorage.app",
  messagingSenderId: "791535788612",
  appId:             "1:791535788612:web:78bdc7642e75912395d211",
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── FB HELPER ─────────────────────────────────────────────────────────────
// Path builders
const weekMeta   = (wid) => `mealprep/weeks/${wid}/meta`;
const weekSel    = (wid) => `mealprep/weeks/${wid}/selections`;
const weekState  = (wid) => `mealprep/weeks/${wid}/state`;
const pantryInv  = ()    => `mealprep/pantry/inventory`;
const pantryCustom = ()  => `mealprep/pantry/custom`;
const profile    = ()    => `mealprep/profile`;
const favs       = ()    => `mealprep/profile/favourites`;
const history    = ()    => `mealprep/history`;
const settings   = ()    => `mealprep/settings`;
const recipes    = ()    => `mealprep/recipes`;

async function getOnce(path)     { return (await get(ref(db, path))).val(); }
async function fbSet(path, val)  { return set(ref(db, path), val); }
async function fbUpdate(path, val) { return update(ref(db, path), val); }
async function fbRemove(path)    { return remove(ref(db, path)); }
function sub(path, cb, ecb) {
  const r = ref(db, path);
  const unsub = onValue(r, snap => cb(snap.val()), e => { if (ecb) ecb(e); });
  return unsub;
}

export const FB = {
  weekMeta, weekSel, weekState, pantryInv, pantryCustom,
  profile, favs, history, settings, recipes,
  getOnce, set: fbSet, update: fbUpdate, remove: fbRemove, sub,
};
