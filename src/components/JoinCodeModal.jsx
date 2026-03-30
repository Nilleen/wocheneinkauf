import { useState } from 'react';
import { FB } from '../firebase.js';
import { useAuth } from '../AuthContext.jsx';

// Shown when status === "pending" for both Google and anonymous users.
// Google: joins an existing household OR creates a new one with the entered code.
// Guest:  gets read-only access to an existing household only.

export default function JoinCodeModal() {
  const { user, enterHouseholdCode } = useAuth();
  const isGuest = user?.isAnonymous;

  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Please enter a code."); return; }
    setLoading(true);
    setError("");
    try {
      await enterHouseholdCode(trimmed);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

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
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--tx)" }}>
            Enter household code
          </h2>
          <p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 8, lineHeight: 1.5 }}>
            {isGuest
              ? "Enter your household's code to browse recipes and the shopping list."
              : "Enter your household code to join. New to the app? Choose any code — it becomes your household's shared password."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder={isGuest ? "Household code" : "e.g. WIKIS or SMITH2025"}
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
            <div style={{
              padding: "8px 12px", background: "#fde8e8", borderRadius: 10,
              fontSize: 12, color: "#c0392b", marginBottom: 12,
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none",
              background: loading ? "var(--bdr)" : "var(--ac, #2d4a35)",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: loading ? "default" : "pointer",
            }}>
            {loading ? "⏳ Please wait…" : isGuest ? "Browse household" : "Continue →"}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            onClick={() => FB.signOut()}
            style={{ background: "none", border: "none", fontSize: 12, color: "var(--tx3)", cursor: "pointer" }}>
            ← Sign in with a different account
          </button>
        </div>
      </div>
    </div>
  );
}
