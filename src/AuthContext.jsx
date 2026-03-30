import { createContext, useContext, useState, useEffect } from 'react';
import { FB } from './firebase.js';

// Auth states:
//  loading   → spinner
//  guest     → anonymous, read-only
//  pending   → Google-signed-in but no household membership yet
//  member    → full read+write access
//  setup     → first Google user ever, needs to create household

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ status: "loading", user: null });

  useEffect(() => {
    const unsub = FB.onAuthChange(async (user) => {
      if (!user) {
        setAuth({ status: "none", user: null });
        return;
      }
      if (user.isAnonymous) {
        setAuth({ status: "guest", user });
        return;
      }
      // Google (or other) sign-in — check household membership
      const count = await FB.getMemberCount();
      if (count === 0) {
        // No household set up yet — this user becomes the owner
        setAuth({ status: "setup", user });
        return;
      }
      const isMember = await FB.checkMembership(user.uid);
      setAuth({ status: isMember ? "member" : "pending", user });
    });
    return unsub;
  }, []);

  const refreshMembership = async () => {
    const { user } = auth;
    if (!user || user.isAnonymous) return;
    const isMember = await FB.checkMembership(user.uid);
    setAuth(a => ({ ...a, status: isMember ? "member" : "pending" }));
  };

  return (
    <AuthContext.Provider value={{ ...auth, refreshMembership }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Returns true only for full household members
export const useCanWrite = () => useContext(AuthContext)?.status === "member";
