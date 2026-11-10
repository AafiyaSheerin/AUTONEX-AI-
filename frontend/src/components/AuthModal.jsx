import React, { useState } from "react";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("demo@hermora.com");
  const [password, setPassword] = useState("hermora123");
  const [name, setName] = useState("Aafiya Sheerin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  if (!isOpen) return null;

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8086";

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Authentication failed.");
      }
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Registration failed.");
      }
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setInfoMessage(data.message || `Password reset link sent to ${email}`);
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@hermora.com",
          name: "Aafiya Sheerin (Google)",
          google_id: "google_oauth_984129"
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Google authentication failed.");
      }
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="auth-header">
          <div className="auth-gem-icon">✦</div>
          <h2>AUTONEX Account</h2>
          <p className="auth-tagline">
            Secure shopping with delegated AI spending & 4-digit Security PIN protection
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setError(""); setInfoMessage(""); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab-btn ${tab === "register" ? "active" : ""}`}
            onClick={() => { setTab("register"); setError(""); setInfoMessage(""); }}
          >
            Register
          </button>
          <button
            className={`auth-tab-btn ${tab === "forgot" ? "active" : ""}`}
            onClick={() => { setTab("forgot"); setError(""); setInfoMessage(""); }}
          >
            Reset
          </button>
        </div>

        {error && <div className="auth-alert error-alert">{error}</div>}
        {infoMessage && <div className="auth-alert success-alert">{infoMessage}</div>}

        {tab !== "forgot" && (
          <div className="social-login-section">
            <button
              type="button"
              className="google-signin-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
            <div className="auth-divider">
              <span>or continue with email</span>
            </div>
          </div>
        )}

        {tab === "login" && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hermora.com"
                required
              />
            </div>

            <div className="input-group">
              <div className="label-with-link">
                <label>Password</label>
                <button
                  type="button"
                  className="inline-link-btn"
                  onClick={() => setTab("forgot")}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In to AUTONEX"}
            </button>

            <p className="demo-credentials-hint">
              💡 <strong>Demo tip:</strong> Defaults are set to <code>demo@hermora.com</code> (Pre-loaded with $200 Allowance).
            </p>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aafiya Sheerin"
                required
              />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="input-group">
              <label>Create Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="allowance-perk-callout">
              <span className="perk-icon">🛡️</span>
              <div>
                <strong>$200.00 Delegated Monthly Allowance</strong>
                <p>New accounts automatically receive a $200 safe sandbox spending cap for the AUTONEX AI buyer.</p>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account & Get Allowance"}
            </button>
          </form>
        )}

        {tab === "forgot" && (
          <form onSubmit={handleForgotPassword} className="auth-form">
            <p className="forgot-description">
              Enter your account email to receive a password reset link and verify your account.
            </p>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@hermora.com"
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>

            <button
              type="button"
              className="back-to-login-btn"
              onClick={() => setTab("login")}
            >
              ← Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
