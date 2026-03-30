import { createContext, useContext, useState, useEffect } from 'react';
import { FB } from './firebase.js';

// Auth states:
//  loading   → checking Firebase auth
//  none      → not signed in at all → show LoginScreen
//  pending   → signed in (Google or anonymous) but no household code yet → show JoinCodeModal
//  guest     → anonymous + valid household code (read-only)
//  member    → Google + full household member (read+write)

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ status: "loading", user: null, householdCode: null });

  useEffect(() => {
    const unsub = FB.onAuthChange(async (user) => {
      if (!user) {
        setAuth({ status: "none", user: null, householdCode: null });
        return;
      }
      if (user.isAnonymous) {
        // Guest — read-only preview, no code required
        setAuth({ status: "guest", user, householdCode: null });
        return;
      }
      // Google user — check if they already belong to a household
      const record = await FB.getMemberRecord(user.uid);
      if (record?.code) {
        FB.setHouseholdCode(record.code);
        setAuth({ status: "member", user, householdCode: record.code });
      } else {
        // Signed in but not yet part of a household → show code entry
        setAuth({ status: "pending", user, householdCode: null });
      }
    });
    return unsub;
  }, []);

  // Called by JoinCodeModal when the user submits a code.
  // Handles both Google (create/join) and anonymous (read-only view) users.
  const enterHouseholdCode = async (code) => {
    const { user } = auth;
    if (!user) return;
    const c = code.trim().toUpperCase();
    if (!c) throw new Error("Please enter a code.");

    const exists = await FB.householdExists(c);

    if (user.isAnonymous) {
      // Guests can only VIEW existing households
      if (!exists) throw new Error("Household not found. Check the code and try again.");
      FB.setHouseholdCode(c);
      setAuth(a => ({ ...a, status: "guest", householdCode: c }));
    } else {
      // Google user: join existing or create new
      if (exists) {
        await FB.joinHousehold(user.uid, user.displayName || "Member", user.email || "", c);
      } else {
        await FB.setupHousehold(user.uid, user.displayName || "Owner", user.email || "", c);
      }
      FB.setHouseholdCode(c);
      setAuth(a => ({ ...a, status: "member", householdCode: c }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...auth, enterHouseholdCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth     = () => useContext(AuthContext);
// Returns true only for full household members (write access)
export const useCanWrite = () => useContext(AuthContext)?.status === "member";
