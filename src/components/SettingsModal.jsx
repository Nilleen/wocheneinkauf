import { useState, useEffect } from 'react';
import { useT } from '../LangContext.jsx';
import { FB } from '../firebase.js';
import HistoryModal from './HistoryModal.jsx';

export default function SettingsModal({ darkMode, onDarkMode, lang, onLangChange, history, authState, onClose }) {
  const t = useT();
  const [showH,    setShowH]    = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  const isMember = authState?.status === "member";
  const isGuest  = authState?.status === "guest";
  const user     = authState?.user;

  // Load join code for members
  useEffect(() => {
    if (!isMember) return;
    FB.getJoinCode().then(c => { if (c) setJoinCode(c); });
  }, [isMember]);

  const copyCode = () => {
    navigator.clipboard?.writeText(joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (showH) return <HistoryModal history={history} onClose={() => setShowH(false)}/>;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet sup" onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px", borderBottom: "1px solid var(--bdr)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontWeight: "normal", fontSize: 18, color: "var(--tx)" }}>{t('settings_title')}</h2>
          <button className="btn" onClick={onClose} style={{ fontSize: 22, color: "var(--tx3)", background: "none" }}>✕</button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>

          {/* ── Account ──────────────────────────────────────────── */}
          <div style={{ fontSize: 11, color: "var(--tx3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            {t('section_account')}
          </div>
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--sur)", border: "1.5px solid var(--bdr)", display: "flex", alignItems: "center", gap: 12 }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }}/>
              : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ac)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {isGuest ? "👀" : "👤"}
                </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {isGuest ? t('guest_label') : (user?.displayName || user?.email || "—")}
              </div>
              <div style={{ fontSize: 11, color: "var(--tx3)" }}>
                {isGuest ? t('guest_readonly') : (isMember ? t('member_label') : t('pending_label'))}
              </div>
            </div>
            <button className="btn" onClick={() => FB.signOut()}
              style={{ fontSize: 12, padding: "6px 12px", borderRadius: 10, background: "var(--sur2)", border: "1px solid var(--bdr)", color: "var(--tx2)", flexShrink: 0 }}>
              {isGuest ? t('btn_sign_in') : t('btn_sign_out')}
            </button>
          </div>

          {/* Join code — only visible to members */}
          {isMember && joinCode && (
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--acbg)", border: "1.5px solid var(--ac)" }}>
              <div style={{ fontSize: 11, color: "var(--ac)", fontWeight: 700, marginBottom: 6 }}>
                🔑 {t('join_code_label')}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, letterSpacing: 3, color: "var(--tx)", flex: 1 }}>
                  {joinCode}
                </span>
                <button className="btn" onClick={copyCode}
                  style={{ fontSize: 12, padding: "6px 12px", borderRadius: 10, background: codeCopied ? "var(--ac)" : "var(--sur)", color: codeCopied ? "#fff" : "var(--tx2)", border: "1px solid var(--bdr)" }}>
                  {codeCopied ? "✓ Copied!" : t('btn_copy_code')}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--tx3)", marginTop: 6 }}>{t('join_code_hint')}</div>
            </div>
          )}

          {/* ── Appearance ───────────────────────────────────────── */}
          <div style={{ fontSize: 11, color: "var(--tx3)", letterSpacing: 1, textTransform: "uppercase", margin: "12px 0 4px" }}>{t('section_appearance')}</div>
          {[["auto", t('theme_auto')], ["light", t('theme_light')], ["dark", t('theme_dark')]].map(([m, l]) => (
            <button key={m} className="btn" onClick={() => onDarkMode(m)}
              style={{ padding: "12px 16px", borderRadius: 12, textAlign: "left", fontSize: 14, background: darkMode === m ? "var(--acbg)" : "var(--sur)", color: darkMode === m ? "var(--ac)" : "var(--tx)", border: `1.5px solid ${darkMode === m ? "var(--ac)" : "var(--bdr)"}` }}>
              {l}{darkMode === m && <span style={{ float: "right" }}>✓</span>}
            </button>
          ))}

          {/* ── Language ─────────────────────────────────────────── */}
          <div style={{ fontSize: 11, color: "var(--tx3)", letterSpacing: 1, textTransform: "uppercase", margin: "12px 0 4px" }}>{t('section_language')}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["en", "🇬🇧 English"], ["de", "🇩🇪 Deutsch"]].map(([l, label]) => (
              <button key={l} className="btn" onClick={() => onLangChange(l)}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 12, fontSize: 14, background: lang === l ? "var(--acbg)" : "var(--sur)", color: lang === l ? "var(--ac)" : "var(--tx)", border: `1.5px solid ${lang === l ? "var(--ac)" : "var(--bdr)"}`, fontWeight: lang === l ? "bold" : "normal" }}>
                {label}{lang === l && <span style={{ float: "right" }}>✓</span>}
              </button>
            ))}
          </div>

          {/* ── Data ─────────────────────────────────────────────── */}
          <div style={{ fontSize: 11, color: "var(--tx3)", letterSpacing: 1, textTransform: "uppercase", margin: "12px 0 4px" }}>{t('section_data')}</div>
          <button className="btn" onClick={() => setShowH(true)}
            style={{ padding: "12px 16px", borderRadius: 12, textAlign: "left", fontSize: 14, background: "var(--sur)", color: "var(--tx)", border: "1.5px solid var(--bdr)" }}>
            {t('btn_history', { count: Object.keys(history || {}).length })}
          </button>
          <div style={{ fontSize: 10, color: "var(--tx3)", marginTop: 8 }}>{t('version')}</div>
        </div>
      </div>
    </div>
  );
}
