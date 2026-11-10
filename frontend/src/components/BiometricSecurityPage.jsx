import React, { useState, useEffect, useRef } from "react";
import PurchaseCalendarModal from "../pages/buyer/PurchaseCalendarModal";

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? `http://${window.location.hostname}:8086`
    : "http://127.0.0.1:8086");

export default function BiometricSecurityPage({
  user,
  onUserUpdated,
  onBackToStore,
  onOpenAgent: _onOpenAgent
}) {
  // Spending limits state
  const [monthlyAllowance, setMonthlyAllowance] = useState(
    user?.monthly_allowance || 500.0
  );
  const [autonomousLimit, setAutonomousLimit] = useState(
    user?.autonomous_limit || 15.0
  );
  const [customMonthlyInput, setCustomMonthlyInput] = useState(
    String(user?.monthly_allowance || 500.0)
  );

  // Security PIN state
  const [securityPin, setSecurityPin] = useState(user?.security_pin || "2007");
  const [showPin, setShowPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [pinFeedback, setPinFeedback] = useState("");
  const [pinUpdating, setPinUpdating] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const purchaseCalendarBtnRef = useRef(null);
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitsFeedback, setLimitsFeedback] = useState("");
  const initializedUserEmailRef = useRef(null);

  // Sync initial state once when user profile loads or changes account, without overwriting active edits
  useEffect(() => {
    if (user && user.email !== initializedUserEmailRef.current) {
      initializedUserEmailRef.current = user.email;
      if (user.security_pin) {
        setSecurityPin(user.security_pin);
      }
      if (user.monthly_allowance !== undefined && user.monthly_allowance !== null) {
        setMonthlyAllowance(Number(user.monthly_allowance));
        setCustomMonthlyInput(String(user.monthly_allowance));
      }
      if (user.autonomous_limit !== undefined && user.autonomous_limit !== null) {
        setAutonomousLimit(Number(user.autonomous_limit));
      }
    }
  }, [user]);

  const handleUpdatePin = async (e) => {
    e?.preventDefault();
    const cleanPin = newPinInput.trim();
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setPinFeedback("PIN must be 4 to 6 digits.");
      return;
    }

    setPinUpdating(true);
    try {
      const res = await fetch(`${API_URL}/auth/pin/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email || "demo@hermora.com",
          new_pin: cleanPin
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update PIN");
      setSecurityPin(cleanPin);
      setNewPinInput("");
      setPinFeedback("✓ Security PIN updated successfully! Payments will use this PIN.");
      if (data.user) onUserUpdated?.(data.user);
      setTimeout(() => setPinFeedback(""), 4000);
    } catch (err) {
      setPinFeedback(`Error: ${err.message}`);
    } finally {
      setPinUpdating(false);
    }
  };

  const handleSaveLimits = async () => {
    setSavingLimits(true);
    setLimitsFeedback("");
    try {
      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email || "demo@hermora.com",
          monthly_allowance: Number(monthlyAllowance),
          autonomous_limit: Number(autonomousLimit)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update spending limits.");
      setLimitsFeedback("✓ Spending limits updated and saved.");
      if (data.user) onUserUpdated?.(data.user);
      setTimeout(() => setLimitsFeedback(""), 3500);
    } catch (err) {
      setLimitsFeedback(`Error: ${err.message}`);
    } finally {
      setSavingLimits(false);
    }
  };

  const remaining = user?.monthly_remaining ?? user?.monthly_allowance ?? 500.0;
  const spent = (user?.monthly_allowance || 500.0) - remaining;
  const percentUsed = user?.monthly_allowance ? Math.min(100, Math.max(0, (spent / user.monthly_allowance) * 100)) : 0;

  return (
    <div className="security-page-root" style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 20px 80px", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Top Banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 32,
        flexWrap: "wrap",
        gap: 16
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "rgba(205, 189, 235, 0.25)",
              border: "1px solid rgba(205, 189, 235, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(18, 14, 30, 0.3)"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CDBDEB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
              Security PIN & Spending Controls
            </h1>
          </div>
          <p style={{ color: "#CDBDEB", fontSize: "0.96rem", margin: "8px 0 0", lineHeight: "1.5" }}>
            Govern autonomous AI purchases with granular micro-limits and 4-digit Security PIN verification.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>
        {/* Card 1: Security PIN Configuration (Plum Night Twilight Card) */}
        <div className="interactive-element" style={{
          background: "linear-gradient(145deg, #241F3A 0%, #1D1830 100%)",
          border: "1px solid rgba(205, 189, 235, 0.35)",
          borderRadius: 24,
          padding: 30,
          boxShadow: "0 18px 45px rgba(18, 14, 30, 0.5)",
          color: "#F5F0FF",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "rgba(205, 189, 235, 0.25)",
              border: "1px solid rgba(205, 189, 235, 0.4)",
              color: "#CDBDEB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CDBDEB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5M10 11l-7 7v4h4l7-7" />
                <circle cx="16.5" cy="7.5" r="3.5" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
                Payment Security PIN
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#B8B0CC" }}>
                Guaranteed PIN authorization for orders above micro-limits
              </span>
            </div>
          </div>

          <div style={{
            background: "#1B162E",
            border: "1px solid rgba(205, 189, 235, 0.3)",
            borderRadius: 18,
            padding: "18px 22px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: "#B8B0CC", display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                CURRENT ACTIVE PIN
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <strong style={{ fontSize: "1.85rem", letterSpacing: "0.25em", color: "#CDBDEB", fontFamily: "monospace" }}>
                  {showPin ? (securityPin || "••••") : "••••"}
                </strong>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{
                    background: "rgba(205, 189, 235, 0.15)",
                    border: "1px solid rgba(205, 189, 235, 0.3)",
                    color: "#CDBDEB",
                    borderRadius: 8,
                    padding: "3px 8px",
                    fontSize: "0.72rem",
                    cursor: "pointer"
                  }}
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <span style={{
              background: "#CFE3D4",
              color: "#1F4A2E",
              border: "1px solid rgba(207, 227, 212, 0.8)",
              borderRadius: 20,
              padding: "5px 14px",
              fontSize: "0.74rem",
              fontWeight: 800,
              letterSpacing: "0.04em"
            }}>
              ACTIVE
            </span>
          </div>

          <form onSubmit={handleUpdatePin}>
            <label style={{ fontSize: "0.82rem", color: "#EBE5F7", display: "block", marginBottom: 8, fontWeight: 600 }}>
              Update Security PIN (4-6 digits)
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                maxLength={6}
                placeholder="Enter new 4-digit PIN"
                value={newPinInput}
                onChange={(e) => {
                  setNewPinInput(e.target.value.replace(/\D/g, ""));
                  setPinFeedback("");
                }}
                style={{
                  flex: 1,
                  background: "#151125",
                  border: "1px solid rgba(205, 189, 235, 0.35)",
                  borderRadius: 12,
                  padding: "11px 16px",
                  color: "#FFFFFF",
                  fontSize: "1.05rem",
                  letterSpacing: "0.2em",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                disabled={pinUpdating || newPinInput.length < 4}
                className={newPinInput.length >= 4 ? "btn-primary" : ""}
                style={{
                  background: newPinInput.length >= 4 ? "var(--gradient-primary)" : "rgba(255, 255, 255, 0.12)",
                  color: "#FFFFFF",
                  border: newPinInput.length >= 4 ? "1px solid rgba(205, 189, 235, 0.4)" : "none",
                  borderRadius: 12,
                  padding: "11px 20px",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: newPinInput.length >= 4 ? "pointer" : "default",
                  boxShadow: newPinInput.length >= 4 ? "0 4px 14px rgba(91, 75, 138, 0.35)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                {pinUpdating ? "Saving..." : "Save PIN"}
              </button>
            </div>
          </form>

          {pinFeedback && (
            <div style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 12,
              fontSize: "0.82rem",
              fontWeight: 600,
              background: pinFeedback.startsWith("✓") ? "rgba(207, 227, 212, 0.2)" : "rgba(168, 78, 91, 0.25)",
              color: pinFeedback.startsWith("✓") ? "#CFE3D4" : "#F4D5D9",
              border: `1px solid ${pinFeedback.startsWith("✓") ? "rgba(207, 227, 212, 0.5)" : "rgba(244, 213, 217, 0.4)"}`
            }}>
              {pinFeedback}
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255, 255, 255, 0.12)" }}>
            <span style={{ fontSize: "0.8rem", color: "#B8B0CC", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: 1.5 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CDBDEB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span><strong>PIN Protection Invariant:</strong> Any purchase that exceeds the ${autonomousLimit.toFixed(2)} autonomous micro-limit is halted until you enter your 4-digit PIN.</span>
            </span>
          </div>

          {/* Dedicated Purchase History Trigger Button */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed rgba(255, 255, 255, 0.15)" }}>
            <button
              ref={purchaseCalendarBtnRef}
              type="button"
              onClick={() => setCalendarModalOpen(true)}
              className="purchase-history-trigger-btn"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px 18px",
                background: "linear-gradient(135deg, rgba(205, 189, 235, 0.18) 0%, rgba(91, 75, 138, 0.3) 100%)",
                border: "1px solid rgba(205, 189, 235, 0.5)",
                color: "#FFFFFF",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.9rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(18, 14, 30, 0.3)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(205, 189, 235, 0.3) 0%, rgba(91, 75, 138, 0.45) 100%)";
                e.currentTarget.style.borderColor = "#CDBDEB";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(205, 189, 235, 0.18) 0%, rgba(91, 75, 138, 0.3) 100%)";
                e.currentTarget.style.borderColor = "rgba(205, 189, 235, 0.5)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDBDEB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Purchase History</span>
            </button>
          </div>
        </div>

        {/* Card 2: Delegated Spending Caps (Porcelain Boutique Card) */}
        <div className="interactive-element" style={{
          background: "#FFFFFF",
          border: "1px solid rgba(205, 189, 235, 0.4)",
          borderRadius: 24,
          padding: 30,
          boxShadow: "0 10px 30px rgba(36, 31, 58, 0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "rgba(91, 75, 138, 0.12)",
              border: "1px solid rgba(91, 75, 138, 0.25)",
              color: "#5B4B8A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B4B8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#241F3A", fontFamily: "'Outfit', sans-serif" }}>
                Delegated Spending Caps
              </h2>
              <span style={{ fontSize: "0.8rem", color: "#736B82" }}>
                Autonomous Micro-Limits & Monthly Budgets
              </span>
            </div>
          </div>

          {/* Allowance Gauge */}
          <div style={{ marginBottom: 24, background: "#FAF8FD", padding: "16px 18px", borderRadius: 16, border: "1px solid rgba(205, 189, 235, 0.35)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.86rem" }}>
              <span style={{ color: "#544D63", fontWeight: 600 }}>Remaining Monthly Allowance:</span>
              <strong style={{ color: "#5B4B8A", fontWeight: 700 }}>${remaining.toFixed(2)} / ${monthlyAllowance.toFixed(2)} USD</strong>
            </div>
            <div style={{ width: "100%", height: 10, background: "rgba(205, 189, 235, 0.3)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: `${percentUsed}%`, height: "100%", background: "var(--gradient-primary)", borderRadius: 6, transition: "width 0.4s ease" }} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.82rem", color: "#241F3A", display: "block", marginBottom: 8, fontWeight: 600 }}>
              Monthly Allowance ($ USD)
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[150, 350, 500, 1000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setMonthlyAllowance(preset);
                    setCustomMonthlyInput(String(preset));
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    background: monthlyAllowance === preset ? "#5B4B8A" : "#FAF8FD",
                    border: monthlyAllowance === preset ? "2px solid #5B4B8A" : "1px solid rgba(205, 189, 235, 0.45)",
                    color: monthlyAllowance === preset ? "#FFFFFF" : "#544D63",
                    borderRadius: 10,
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  ${preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={10}
              max={5000}
              value={customMonthlyInput}
              onChange={(e) => {
                setCustomMonthlyInput(e.target.value);
                setMonthlyAllowance(Number(e.target.value) || 0);
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#FAF8FD",
                border: "1px solid rgba(205, 189, 235, 0.5)",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#241F3A",
                fontSize: "0.98rem",
                fontWeight: 600,
                outline: "none"
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: "0.82rem", color: "#241F3A", fontWeight: 600 }}>
                Autonomous Micro-Limit
              </label>
              <strong style={{ fontSize: "0.95rem", color: "#5B4B8A", fontWeight: 700 }}>${autonomousLimit.toFixed(2)} USD</strong>
            </div>
            <span style={{ fontSize: "0.76rem", color: "#736B82", display: "block", marginBottom: 10 }}>
              Purchases below this amount execute autonomously. Purchases above require PIN.
            </span>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={autonomousLimit}
              onChange={(e) => setAutonomousLimit(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#5B4B8A", cursor: "pointer" }}
            />
          </div>

          <button
            onClick={handleSaveLimits}
            disabled={savingLimits}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "13px",
              background: "var(--gradient-primary)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 14,
              fontSize: "0.92rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(91, 75, 138, 0.3)",
              transition: "all 0.2s ease"
            }}
          >
            {savingLimits ? "Saving Limits..." : "Save Spending Limits"}
          </button>

          {limitsFeedback && (
            <div style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 12,
              fontSize: "0.82rem",
              fontWeight: 600,
              background: limitsFeedback.startsWith("✓") ? "rgba(207, 227, 212, 0.3)" : "#FFF7E6",
              color: limitsFeedback.startsWith("✓") ? "#1F4A2E" : "#D97706",
              border: `1px solid ${limitsFeedback.startsWith("✓") ? "rgba(207, 227, 212, 0.8)" : "#F5D9A8"}`
            }}>
              {limitsFeedback}
            </div>
          )}
        </div>
      </div>

      {/* Back to Boutique Primary Action */}
      <div style={{ marginTop: 44, display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onBackToStore}
          className="btn-primary interactive-element"
          style={{
            background: "linear-gradient(135deg, #5B4B8A 0%, #7663A8 100%)",
            color: "#FFFFFF",
            border: "1px solid rgba(205, 189, 235, 0.4)",
            borderRadius: 16,
            padding: "16px 42px",
            fontWeight: 800,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 8px 26px rgba(91, 75, 138, 0.4)",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.25s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(91, 75, 138, 0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 26px rgba(91, 75, 138, 0.4)";
          }}
        >
          <span>← Back to Boutique</span>
        </button>
      </div>

      {/* Purchase Calendar & Order History Modal (Rendered strictly when open) */}
      <PurchaseCalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        userEmail={user?.email || "demo@hermora.com"}
        triggerButtonRef={purchaseCalendarBtnRef}
      />
    </div>
  );
}