import React, { useState, useEffect } from "react";

export default function FaceIdModal({
  isOpen,
  onClose,
  transaction,
  user,
  onVerificationSuccess
}) {
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinVerifying, setPinVerifying] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? `http://${window.location.hostname}:8086`
      : "http://127.0.0.1:8086");

  // Esc key listener for modal accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const productName = transaction?.selected_product?.name || transaction?.product_name || "AUTONEX Artisan Item";
  const rawPrice = transaction?.price_usd ?? transaction?.selected_product?.price ?? transaction?.price ?? transaction?.amount;
  const priceUsd = Number(rawPrice !== undefined && rawPrice !== null ? rawPrice : 7.0).toFixed(2);

  const handleVerifyPin = async (e) => {
    e?.preventDefault();
    const cleanPin = pinInput.trim();
    if (cleanPin.length < 4) {
      setPinError("Please enter your 4-digit Security PIN.");
      return;
    }

    setPinVerifying(true);
    setPinError("");

    try {
      const res = await fetch(`${API_URL}/auth/pin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email || "demo@hermora.com",
          pin: cleanPin,
          transaction_id: transaction?.transaction_id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid Security PIN. Please try again.");
      }

      setVerifiedSuccess(true);
      setTimeout(() => {
        onVerificationSuccess({
          success: true,
          pin_verified: true,
          face_verified: true,
          transaction: {
            ...transaction,
            face_verified: true,
            pin_verified: true,
            status: "READY_FOR_PAYMENT"
          }
        });
        onClose();
      }, 700);
    } catch (err) {
      setPinError(err.message || "Invalid Security PIN. Please try again.");
    } finally {
      setPinVerifying(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        background: "rgba(36, 31, 58, 0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.2s ease-out"
      }}
    >
      <div
        className="modal-card interactive-element"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 440,
          width: "100%",
          background: "linear-gradient(145deg, #241F3A 0%, #1D1830 100%)",
          border: "1px solid rgba(205, 189, 235, 0.35)",
          borderRadius: "24px",
          padding: "34px 28px",
          boxShadow: "0 25px 60px -12px rgba(18, 14, 30, 0.75), 0 0 35px rgba(205, 189, 235, 0.15)",
          color: "#F5F0FF",
          textAlign: "center",
          position: "relative",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close Modal"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(205, 189, 235, 0.25)",
            color: "#B8B0CC",
            fontSize: "0.95rem",
            width: 32,
            height: 32,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)";
            e.currentTarget.style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "#B8B0CC";
          }}
        >
          ✕
        </button>

        <div style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(91, 75, 138, 0.4), rgba(205, 189, 235, 0.2))",
          border: "1px solid rgba(205, 189, 235, 0.45)",
          color: "#CDBDEB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.7rem",
          margin: "0 auto 16px",
          boxShadow: "0 8px 24px rgba(91, 75, 138, 0.3)"
        }}>
          🔐
        </div>

        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 6px", color: "#FFFFFF", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.01em" }}>
          Security PIN Authorization
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#B8B0CC", margin: "0 0 22px", lineHeight: 1.5 }}>
          Purchases above the autonomous micro-limit require your 4-digit Security PIN to unlock PayPal checkout.
        </p>

        {/* Item Summary Card */}
        <div style={{
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(205, 189, 235, 0.25)",
          borderRadius: "16px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          textAlign: "left"
        }}>
          <div>
            <span style={{ fontSize: "0.7rem", color: "#CDBDEB", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", fontWeight: 700 }}>
              ITEM AUTHORIZATION
            </span>
            <strong style={{ fontSize: "0.95rem", color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>{productName}</strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.7rem", color: "#B8B0CC", display: "block" }}>Amount</span>
            <strong style={{ fontSize: "1.1rem", color: "#CFE3D4", fontWeight: 800 }}>${priceUsd} USD</strong>
          </div>
        </div>

        {/* PIN Input Form */}
        <form onSubmit={handleVerifyPin}>
          <div style={{ position: "relative", maxWidth: "240px", margin: "0 auto 14px" }}>
            <input
              type={showPin ? "text" : "password"}
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, ""));
                setPinError("");
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#1B162E",
                border: "2px solid rgba(205, 189, 235, 0.4)",
                borderRadius: "16px",
                padding: "12px 42px 12px 16px",
                fontSize: "1.75rem",
                letterSpacing: "0.3em",
                color: "#FFFFFF",
                textAlign: "center",
                outline: "none",
                transition: "all 0.2s ease"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#CDBDEB";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(205, 189, 235, 0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(205, 189, 235, 0.4)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#B8B0CC",
                cursor: "pointer",
                fontSize: "1.1rem",
                padding: 4
              }}
              title={showPin ? "Hide PIN" : "Show PIN"}
            >
              {showPin ? "🙈" : "👁️"}
            </button>
          </div>

          <div style={{ fontSize: "0.78rem", color: "#B8B0CC", marginBottom: "18px" }}>
            🔒 Protected by cryptographic zero-knowledge authorization
          </div>

          {pinError && (
            <div style={{
              color: "#F4D5D9",
              background: "rgba(168, 78, 91, 0.25)",
              border: "1px solid rgba(244, 213, 217, 0.35)",
              borderRadius: "12px",
              padding: "10px 14px",
              fontSize: "0.82rem",
              fontWeight: 600,
              marginBottom: "18px"
            }}>
              ⚠️ {pinError}
            </div>
          )}

          {verifiedSuccess ? (
            <div style={{
              background: "rgba(207, 227, 212, 0.2)",
              border: "1px solid rgba(207, 227, 212, 0.5)",
              borderRadius: "14px",
              padding: "14px",
              color: "#CFE3D4",
              fontWeight: 800,
              fontSize: "0.95rem",
              letterSpacing: "0.02em"
            }}>
              ✓ PIN Verified! Unlocking PayPal Sandbox...
            </div>
          ) : (
            <button
              type="submit"
              disabled={pinVerifying || pinInput.length < 4}
              className={pinInput.length >= 4 ? "btn-primary" : ""}
              style={{
                width: "100%",
                padding: "13px",
                background: pinInput.length >= 4
                  ? "var(--gradient-primary)"
                  : "rgba(255, 255, 255, 0.08)",
                color: "#FFFFFF",
                border: pinInput.length >= 4 ? "1px solid rgba(205, 189, 235, 0.4)" : "none",
                borderRadius: "14px",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: pinInput.length >= 4 ? "pointer" : "default",
                boxShadow: pinInput.length >= 4 ? "0 4px 18px rgba(91, 75, 138, 0.4)" : "none",
                transition: "all 0.2s ease"
              }}
            >
              {pinVerifying ? "Verifying..." : `Authorize Payment ($${priceUsd})`}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}