import React, { useState } from "react";
import AutoNextBot from "./AutoNextBot";

function TiltConditionCard({ icon, title, desc }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 12, y: -y * 12 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        background: isHovered ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)",
        padding: "14px 16px",
        borderRadius: "14px",
        border: isHovered ? "1px solid rgba(205, 189, 235, 0.45)" : "1px solid rgba(205, 189, 235, 0.15)",
        transform: `perspective(600px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) ${isHovered ? "translateY(-2px)" : ""}`,
        transformStyle: "preserve-3d",
        transition: isHovered ? "background 0.2s ease, border-color 0.2s ease" : "all 0.4s ease-out",
        boxShadow: isHovered ? "0 10px 24px -4px rgba(36, 31, 58, 0.4)" : "none",
        cursor: "default"
      }}
    >
      <span
        style={{
          fontSize: "1.35rem",
          display: "inline-block",
          transform: isHovered ? "scale(1.2) translateY(-2px)" : "scale(1)",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}
      >
        {icon}
      </span>
      <div>
        <strong style={{ display: "block", fontSize: "0.88rem", color: isHovered ? "#FFF9F2" : "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
          {title}
        </strong>
        <span style={{ fontSize: "0.78rem", color: isHovered ? "#E8DFD8" : "#B8B0CC", lineHeight: "1.4" }}>
          {desc}
        </span>
      </div>
    </div>
  );
}

export default function AuthPortal({ onAuthSuccess }) {
  const [authRole, setAuthRole] = useState("buyer"); // "buyer" | "merchant"
  const [tab, setTab] = useState("login"); // "login" | "register" | "forgot"
  const [email, setEmail] = useState("demo@hermora.com");
  const [password, setPassword] = useState("hermora123");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("Aafiya Sheerin");

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8086";

  const handleRoleSelect = (role) => {
    setAuthRole(role);
    setError("");
    setSuccessMsg("");
    if (role === "merchant") {
      setEmail("merchant@hermora.com");
      setPassword("merchant123");
    } else {
      setEmail("demo@hermora.com");
      setPassword("hermora123");
    }
  };

  const executeLogin = async (targetEmail, targetPassword) => {
    const finalEmail = targetEmail !== undefined ? targetEmail : email;
    const finalPassword = targetPassword !== undefined ? targetPassword : password;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: finalEmail, password: finalPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Invalid email or password.");
      }
      onAuthSuccess(data.user, false);
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e?.preventDefault();
    executeLogin();
  };

  const handleDemoSignIn = (roleToRun) => {
    const effectiveRole = roleToRun || authRole;
    if (effectiveRole === "merchant") {
      setEmail("merchant@hermora.com");
      setPassword("merchant123");
      executeLogin("merchant@hermora.com", "merchant123");
    } else {
      setEmail("demo@hermora.com");
      setPassword("hermora123");
      executeLogin("demo@hermora.com", "hermora123");
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          monthly_allowance: 150.0
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Registration failed.");
      }
      onAuthSuccess(data.user, true);
    } catch (err) {
      setError(err.message || "Failed to register.");
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
          email: email && email.includes("@") ? email : "user@gmail.com",
          name: name || "Google User",
          google_id: `g_${Math.random().toString(36).substring(2, 10)}`
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Google authentication failed.");
      }
      onAuthSuccess(data.user, true);
    } catch (err) {
      setError(err.message || "Google sign-in encountered an issue.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e) => {
    e?.preventDefault();
    if (!resetEmail || !resetEmail.trim()) {
      setError("Please enter your account email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Could not find account.");
      }
      setResetCode(data.reset_code || "RESET-OK");
      setResetStep(2);
      setSuccessMsg(data.message || `Reset instructions sent to ${resetEmail}`);
    } catch (err) {
      setError(err.message || "Failed to initiate password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmNewPassword = async (e) => {
    e?.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || "Failed to reset password.");
      }
      setSuccessMsg("✓ Password has been updated! You can now sign in.");
      setEmail(resetEmail);
      setPassword(newPassword);
      setTimeout(() => {
        setTab("login");
        setResetStep(1);
        setNewPassword("");
        setConfirmPassword("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-portal-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", background: "var(--grad-hero-aurora)", position: "relative" }}>
      <div
        className="auth-portal-container card-3d-tilt"
        style={{
          width: "100%",
          maxWidth: "1080px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: "0 30px 70px -15px rgba(36, 31, 58, 0.25), 0 0 0 1px rgba(232, 223, 216, 0.8)",
          background: "#FFFFFF"
        }}
      >
        {/* Left Side: Brand Panel with 3D Shield (Plum Night twilight surface) */}
        <div
          className="auth-brand-panel"
          style={{
            background: "linear-gradient(135deg, #241F3A 0%, #2E284A 50%, #3D355C 100%)",
            color: "#F5F0FF",
            padding: "40px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "rgba(205, 189, 235, 0.25)",
                  border: "1px solid rgba(205, 189, 235, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem"
                }}
              >
                ✦
              </div>
              <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif", letterSpacing: "0.02em", color: "#FFFFFF" }}>
                AUTONEX
              </h1>
            </div>

            <p style={{ margin: "6px 0 24px", fontSize: "0.92rem", color: "#B8B0CC", lineHeight: "1.5" }}>
              Authorize. Automate. Transact. — Autonomous Agentic Commerce & PayPal Security
            </p>

            {/* Embedded 3D Blinking AutoNext Bot */}
            <div style={{ display: "flex", justifyContent: "center", margin: "0 auto 16px" }}>
              <AutoNextBot mode="interactive" size={165} />
            </div>

            {/* 3 Interactive 3D Tilting Condition Cards with Secondary Action */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <TiltConditionCard
                icon="🛡️"
                title="Intelligent Spending Allowance"
                desc="Set dynamic monthly caps. High-value purchases strictly require PIN."
              />
              <TiltConditionCard
                icon="🔐"
                title="Secure PIN Authorization"
                desc="Cryptographic PIN authorization unlocks PayPal execution on approval."
              />
              <TiltConditionCard
                icon="💳"
                title="100% PayPal Sandbox Execution"
                desc="Real-time settlements, Zapier dispatch, Bryntum logistics, and audit receipts."
              />
            </div>
          </div>

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "0.78rem", color: "#B8B0CC", fontStyle: "italic" }}>
            “AI agents can shop for you, but they can never spend beyond your rules.”
          </div>
        </div>

        {/* Right Side: Auth Card with Role Switcher & Friendly Controls */}
        <div className="auth-card-panel" style={{ padding: "40px 36px", background: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            {/* Distinct Role Selector Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                background: "#F5EFFB",
                padding: "5px",
                borderRadius: "14px",
                marginBottom: "22px",
                border: "1px solid #E8DFD8"
              }}
            >
              <button
                type="button"
                className="interactive-element"
                onClick={() => handleRoleSelect("buyer")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: authRole === "buyer" ? "#5B4B8A" : "transparent",
                  color: authRole === "buyer" ? "#FFFFFF" : "#393641",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  fontFamily: "'Outfit', sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: authRole === "buyer" ? "0 4px 12px rgba(91, 75, 138, 0.25)" : "none",
                  transition: "all 0.18s ease"
                }}
              >
                <span>🛍️</span>
                <span>Buyer Portal</span>
              </button>

              <button
                type="button"
                className="interactive-element"
                onClick={() => handleRoleSelect("merchant")}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: authRole === "merchant" ? "#241F3A" : "transparent",
                  color: authRole === "merchant" ? "#FFFFFF" : "#393641",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  fontFamily: "'Outfit', sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: authRole === "merchant" ? "0 4px 12px rgba(36, 31, 58, 0.3)" : "none",
                  transition: "all 0.18s ease"
                }}
              >
                <span>💼</span>
                <span>Merchant Portal</span>
              </button>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.45rem", fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: "#241F3A" }}>
                {authRole === "merchant" ? "Merchant Portal" : "Welcome to AUTONEX"}
              </h2>
              <p style={{ margin: 0, fontSize: "0.86rem", color: "#5F5B6B" }}>
                {authRole === "merchant"
                  ? "Sign in as Merchant Admin to inspect AG Grid Ledger, dynamic Zapier notifications, Bryntum logistics & Elastic security."
                  : "Sign in to access your delegated AI shopper, luxury boutique storefront & biometric trust vault."}
              </p>
            </div>

            {/* View Mode Tabs */}
            <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E8DFD8", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => { setTab("login"); setError(""); setSuccessMsg(""); }}
                style={{
                  padding: "8px 14px",
                  background: "none",
                  border: "none",
                  borderBottom: tab === "login" ? "3px solid #5B4B8A" : "3px solid transparent",
                  color: tab === "login" ? "#5B4B8A" : "#858094",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Sign In
              </button>
              {authRole === "buyer" && (
                <button
                  type="button"
                  onClick={() => { setTab("register"); setError(""); setSuccessMsg(""); }}
                  style={{
                    padding: "8px 14px",
                    background: "none",
                    border: "none",
                    borderBottom: tab === "register" ? "3px solid #5B4B8A" : "3px solid transparent",
                    color: tab === "register" ? "#5B4B8A" : "#858094",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer"
                  }}
                >
                  Create Account
                </button>
              )}
              <button
                type="button"
                onClick={() => { setTab("forgot"); setError(""); setSuccessMsg(""); setResetStep(1); }}
                style={{
                  padding: "8px 14px",
                  background: "none",
                  border: "none",
                  borderBottom: tab === "forgot" ? "3px solid #5B4B8A" : "3px solid transparent",
                  color: tab === "forgot" ? "#5B4B8A" : "#858094",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Forgot Password
              </button>
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "#F4D5D9", color: "#7A2230", border: "1px solid rgba(168, 78, 91, 0.3)", borderRadius: "10px", fontSize: "0.84rem", fontWeight: 600, marginBottom: "16px" }}>
                ⚠️ {error}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: "10px 14px", background: "#CFE3D4", color: "#1F4A2E", border: "1px solid rgba(31, 74, 46, 0.3)", borderRadius: "10px", fontSize: "0.84rem", fontWeight: 600, marginBottom: "16px" }}>
                ✓ {successMsg}
              </div>
            )}

            {/* Social / Google Sign-in */}
            {tab !== "forgot" && authRole === "buyer" && (
              <div style={{ marginBottom: "20px" }}>
                <button
                  type="button"
                  className="interactive-element"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{
                    width: "100%",
                    minHeight: "46px",
                    background: "#FFFFFF",
                    border: "1px solid #E8DFD8",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    color: "#393641",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(57, 54, 65, 0.05)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
                <div style={{ textAlign: "center", position: "relative", margin: "16px 0 0" }}>
                  <span style={{ background: "#FFFFFF", padding: "0 10px", fontSize: "0.75rem", color: "#858094", position: "relative", zIndex: 1 }}>or use your credentials</span>
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#E8DFD8", zIndex: 0 }} />
                </div>
              </div>
            )}

            {/* Tab 1: Sign In */}
            {tab === "login" && (
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#393641", marginBottom: "6px" }}>
                    {authRole === "merchant" ? "Merchant Admin Email" : "Email Address"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={authRole === "merchant" ? "merchant@hermora.com" : "demo@hermora.com"}
                    required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E8DFD8", background: "#FFF9F2", fontSize: "0.92rem", color: "#393641", outline: "none" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#393641" }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setTab("forgot"); setResetEmail(email); setError(""); }}
                      style={{ background: "none", border: "none", color: "#5B4B8A", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ width: "100%", padding: "12px 40px 12px 14px", borderRadius: "10px", border: "1px solid #E8DFD8", background: "#FFF9F2", fontSize: "0.92rem", color: "#393641", outline: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#858094", fontSize: "1rem" }}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ width: "100%", marginTop: "6px" }}
                >
                  {loading
                    ? "Signing in..."
                    : authRole === "merchant"
                    ? "Sign In to Merchant Hub"
                    : "Sign In to Boutique"}
                </button>

                {/* 1-Click Demo Sign-in */}
                <div style={{ marginTop: "10px" }}>
                  {authRole === "merchant" ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleDemoSignIn("merchant")}
                      style={{ width: "100%" }}
                    >
                      💼 Use demo account (merchant@hermora.com)
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleDemoSignIn("buyer")}
                      style={{ width: "100%" }}
                    >
                      🛍️ Use demo account (demo@hermora.com)
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Tab 2: Register (Buyer Mode) */}
            {tab === "register" && (
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#393641", marginBottom: "6px" }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aafiya Sheerin"
                    required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E8DFD8", background: "#FFF9F2", fontSize: "0.92rem", color: "#393641", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#393641", marginBottom: "6px" }}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@hermora.com"
                    required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E8DFD8", background: "#FFF9F2", fontSize: "0.92rem", color: "#393641", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#393641", marginBottom: "6px" }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E8DFD8", background: "#FFF9F2", fontSize: "0.92rem", color: "#393641", outline: "none" }}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", marginTop: "6px" }}>
                  {loading ? "Creating Account..." : "Create Account & Get Allowance"}
                </button>
              </form>
            )}

            {/* Tab 3: Forgot Password with 3-Step Progress */}
            {tab === "forgot" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* 3-Step Progress Indicator */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F5EFFB", padding: "8px 14px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 700, color: "#5B4B8A" }}>
                  <span style={{ opacity: resetStep === 1 ? 1 : 0.6 }}>1. Email Request</span>
                  <span>→</span>
                  <span style={{ opacity: resetStep === 2 ? 1 : 0.6 }}>2. Enter Token & Password</span>
                  <span>→</span>
                  <span style={{ opacity: resetStep === 3 ? 1 : 0.6 }}>3. Completed</span>
                </div>

                {resetStep === 1 ? (
                  <form onSubmit={handleRequestResetCode} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#393641", marginBottom: "6px" }}>Account Email</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="demo@hermora.com"
                        required
                        style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E8DFD8", background: "#FFF9F2", fontSize: "0.92rem", color: "#393641", outline: "none" }}
                      />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
                      {loading ? "Sending..." : "Send Reset Instructions"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmNewPassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#393641", marginBottom: "6px" }}>Verification Token</label>
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        required
                        style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E8DFD8", background: "#FFF9F2", fontSize: "0.92rem", color: "#393641", outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#393641", marginBottom: "6px" }}>New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E8DFD8", background: "#FFF9F2", fontSize: "0.92rem", color: "#393641", outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#393641", marginBottom: "6px" }}>Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #E8DFD8", background: "#FFF9F2", fontSize: "0.92rem", color: "#393641", outline: "none" }}
                      />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%" }}>
                      {loading ? "Updating Password..." : "Submit New Password"}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => setTab("login")}
                  style={{ background: "none", border: "none", color: "#5B4B8A", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", marginTop: "4px" }}
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
