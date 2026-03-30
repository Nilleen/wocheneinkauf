import { useState } from 'react';
import { FB } from '../firebase.js';

export default function LoginScreen() {
  const [loading, setLoading] = useState(null); // "google" | "guest" | null
  const [error,   setError]   = useState("");

  const handleGoogle = async () => {
    setLoading("google"); setError("");
    try { await FB.signInGoogle(); }
    catch (e) {
      if (e.code !== "auth/popup-closed-by-user") setError(e.message);
      setLoading(null);
    }
  };

  const handleGuest = async () => {
    setLoading("guest"); setError("");
    try { await FB.signInGuest(); }
    catch (e) { setError(e.message); setLoading(null); }
  };

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(160deg, #1a2e1f 0%, #2d4a35 60%, #1a2e1f 100%)",
      padding: "24px",
    }}>
      {/* Logo / Brand */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🛒</div>
        <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
          Wocheneinkauf
        </h1>
        <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, margin: "8px 0 0" }}>
          Family meal prep planner
        </p>
      </div>

      {/* Auth card */}
      <div style={{
        background: "var(--sur, #fff)", borderRadius: 20, padding: "28px 24px",
        width: "100%", maxWidth: 340, boxShadow: "0 8px 40px rgba(0,0,0,.35)",
      }}>
        <p style={{ fontSize: 13, color: "var(--tx2, #555)", textAlign: "center", margin: "0 0 20px", lineHeight: 1.5 }}>
          Sign in to plan meals and edit your weekly shopping together.
        </p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={!!loading}
          style={{
            width: "100%", padding: "13px 16px", borderRadius: 12, marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: loading === "google" ? "#e8f0fe" : "#fff",
            border: "1.5px solid #dadce0", cursor: "pointer", fontSize: 14, fontWeight: 600,
            color: "#3c4043", transition: "background .15s",
          }}>
          {loading === "google" ? "⏳ Signing in…" : (
            <>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--bdr, #e0e0e0)" }}/>
          <span style={{ fontSize: 11, color: "var(--tx3, #999)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--bdr, #e0e0e0)" }}/>
        </div>

        {/* Guest */}
        <button
          onClick={handleGuest}
          disabled={!!loading}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12,
            background: "var(--sur2, #f5f5f5)", border: "1.5px solid var(--bdr, #e0e0e0)",
            cursor: "pointer", fontSize: 14, color: "var(--tx2, #555)", fontWeight: 500,
            transition: "background .15s",
          }}>
          {loading === "guest" ? "⏳ Loading…" : "👀 Browse as Guest"}
        </button>

        <p style={{ fontSize: 11, color: "var(--tx3, #999)", textAlign: "center", margin: "12px 0 0", lineHeight: 1.5 }}>
          Guest access is read-only. Sign in to edit recipes, plan meals, and manage your pantry.
        </p>

        {error && (
          <div style={{ marginTop: 12, padding: "10px 12px", background: "#fde8e8", borderRadius: 10, fontSize: 12, color: "#c0392b" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
