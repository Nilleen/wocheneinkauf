import { useState } from 'react';
import { FB } from '../firebase.js';
import { useAuth } from '../AuthContext.jsx';

// Shown when:
//  status === "setup"   → first-ever Google user, sets the join code
//  status === "pending" → signed in but not yet a member, must enter join code

export default function JoinCodeModal() {
  const { user, status, refreshMembership } = useAuth();
  const isSetup = status === "setup";

  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Please enter a code."); return; }
    setLoading(true); setError("");

    try {
      if (isSetup) {
        // First user — create household with this code
        await FB.setupHousehold(
          user.uid,
          user.displayName || "Owner",
          user.email || "",
          trimmed,
        );
        await refreshMembership();
      } else {
        // Joining — verify against stored code
        const stored = await FB.getJoinCode();
        if (!stored) { setError("No household has been set up yet. Ask the owner."); setLoading(false); return; }
        if (trimmed !== stored.toUpperCase()) { setError("Wrong code. Try again."); setLoading(false); return; }
        await FB.joinHousehold(user.uid, user.displayName || "Member", user.email || "");
        await refreshMembership();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSignOut = () => FB.signOut();

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "var(--sur, #fff)", borderRadius: 20, padding: "28px 24px",
        width: "100%", maxWidth: 340, boxShadow: "0 8px 40px rgba(0,0,0,.3)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{isSetup ? "🏠" : "🔑"}</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--tx)" }}>
            {isSetup ? "Set up your household" : "Enter join code"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 8, lineHeight: 1.5 }}>
            {isSetup
              ? "You're the first member! Choose a join code your household will use to sign in."
              : `Welcome, ${user?.displayName?.split(" ")[0] || "there"}! Enter the household join code to get full access.`}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder={isSetup ? "Create a code (e.g. SMITH2025)" : "Enter join code"}
            maxLength={20}
            autoFocus
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 12, marginBottom: 12,
              border: "1.5px solid var(--bdr, #ddd)", fontSize: 16, fontWeight: 700,
              letterSpacing: 2, textAlign: "center", textTransform: "uppercase",
              background: "var(--sur2)", color: "var(--tx)", boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{ padding: "8px 12px", background: "#fde8e8", borderRadius: 10, fontSize: 12, color: "#c0392b", marginBottom: 12 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none",
              background: loading ? "var(--bdr)" : "var(--ac, #2d4a35)",
              color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
            }}>
            {loading ? "⏳ Please wait…" : isSetup ? "Create household" : "Join household"}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button onClick={handleSignOut}
            style={{ background: "none", border: "none", fontSize: 12, color: "var(--tx3)", cursor: "pointer" }}>
            ← Sign in with a different account
          </button>
        </div>
      </div>
    </div>
  );
}
