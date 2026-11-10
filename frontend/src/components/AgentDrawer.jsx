import React, { useState, useEffect } from "react";
import PayPalButton from "./PayPalButton";
import SavedAddressModal from "./SavedAddressModal";

export default function AgentDrawer({
  isOpen,
  onClose,
  requestText,
  setRequestText,
  loading,
  error,
  result,
  paymentMessage,
  onStartCheckout,
  onOpenFaceId,
  onPaymentSuccess,
  onPaymentError,
  onViewReceipt,
  user
}) {
  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8086";

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState(user?.saved_addresses || []);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // Fetch live addresses when drawer opens (Unconditional Hook call)
  useEffect(() => {
    async function fetchAddresses() {
      if (!isOpen) return;
      try {
        const email = user?.email || "demo@hermora.com";
        const res = await fetch(`${API_URL}/auth/addresses?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success && data.addresses?.length > 0) {
          setSavedAddresses(data.addresses);
          const def = data.addresses.find((a) => a.is_default) || data.addresses[0];
          setSelectedAddressId(def.id);
        }
      } catch (err) {
        console.warn("Failed to load saved addresses for drawer:", err);
      }
    }
    fetchAddresses();
  }, [user?.email, isOpen, API_URL]);

  if (!isOpen) return null;

  const userFallbackName = user?.name || user?.email?.split("@")?.[0]?.replace(".", " ") || "Valued Client";
  const selectedAddress =
    savedAddresses.find((a) => a.id === selectedAddressId) ||
    savedAddresses[0] || {
      name: user?.shipping_address?.recipient_name || userFallbackName,
      phone: user?.shipping_address?.phone || "+91 9790854949",
      full_address: user?.shipping_address?.street || "Standard Delivery Address"
    };

  const deliveryAddress = selectedAddress.full_address;

  const transaction = result?.transaction;
  const mission = result?.mission;
  const product = transaction?.selected_product;
  const _policy = transaction?.policy_decision;
  const _upsell = transaction?.upsell_decision;
  const needsPinAuth = (
    transaction?.requires_pin ||
    transaction?.requires_face_id ||
    transaction?.status === "AWAITING_HUMAN_APPROVAL"
  ) && !transaction?.pin_verified;
  const pinVerified = transaction?.pin_verified || transaction?.face_verified;

  // Determine current 5-step progress (Derived strictly from existing state, display-only)
  let currentStepIndex = 1; // 1: Request, 2: Review, 3: PIN, 4: PayPal, 5: Receipt
  if (transaction?.status === "PAYMENT_VERIFIED" || paymentMessage?.includes("captured")) {
    currentStepIndex = 5;
  } else if (pinVerified && (transaction?.status === "READY_FOR_PAYMENT" || transaction?.status === "PAYMENT_PENDING")) {
    currentStepIndex = 4;
  } else if (needsPinAuth) {
    currentStepIndex = 3;
  } else if (result?.success) {
    currentStepIndex = 2;
  }

  const steps = [
    { num: 1, label: "Request" },
    { num: 2, label: "Review" },
    { num: 3, label: "PIN" },
    { num: 4, label: "PayPal" },
    { num: 5, label: "Receipt" }
  ];

  const remaining = user?.monthly_remaining ?? user?.monthly_allowance ?? 150.0;
  const total = user?.monthly_allowance ?? 150.0;
  const percentUsed = total > 0 ? Math.min(100, Math.max(0, ((total - remaining) / total) * 100)) : 0;

  return (
    <div
      className="agent-drawer-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(20, 16, 32, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        justifyContent: "flex-end"
      }}
    >
      <aside
        className="agent-drawer-panel page-3d-transition"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "520px",
          height: "100vh",
          background: "linear-gradient(180deg, #241F3A 0%, #1D182E 100%)",
          color: "#F5F0FF",
          borderLeft: "1px solid rgba(205, 189, 235, 0.2)",
          boxShadow: "-20px 0 60px rgba(10, 8, 18, 0.8)",
          display: "flex",
          flexDirection: "column",
          position: "relative"
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(205, 189, 235, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(36, 31, 58, 0.6)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(91, 75, 138, 0.5), rgba(205, 189, 235, 0.3))",
                border: "1px solid rgba(205, 189, 235, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                color: "#CDBDEB"
              }}
            >
              ✦
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-heading)", color: "#FFFFFF" }}>
                AUTONEX AI Shopper
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#B8B0CC" }}>
                Autonomous Shopping Agent with Spending Guardrails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI Buyer Drawer"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#B8B0CC",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        {/* 5-Step Visual Progress Indicator */}
        <div
          style={{
            padding: "12px 24px",
            background: "rgba(29, 24, 46, 0.8)",
            borderBottom: "1px solid rgba(205, 189, 235, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          {steps.map((st) => {
            const isCompleted = st.num < currentStepIndex;
            const isCurrent = st.num === currentStepIndex;
            return (
              <div key={st.num} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    background: isCompleted ? "var(--color-sage)" : isCurrent ? "var(--color-lavender)" : "rgba(255, 255, 255, 0.1)",
                    color: isCompleted ? "#1F4A2E" : isCurrent ? "var(--color-plum-night)" : "#B8B0CC",
                    border: isCurrent ? "2px solid #FFFFFF" : "none"
                  }}
                >
                  {isCompleted ? "✓" : st.num}
                </span>
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? "#FFFFFF" : isCompleted ? "var(--color-sage)" : "#B8B0CC"
                  }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Delegated Monthly Spending Strip with Ring Gauge */}
        <div
          style={{
            padding: "14px 24px",
            background: "rgba(91, 75, 138, 0.2)",
            borderBottom: "1px solid rgba(205, 189, 235, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Animated Ring Gauge */}
            <div style={{ position: "relative", width: "36px", height: "36px" }}>
              <svg width="36" height="36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#CDBDEB"
                  strokeWidth="3.5"
                  strokeDasharray="88"
                  strokeDashoffset={88 - (88 * (100 - percentUsed)) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
                🛡️
              </span>
            </div>
            <div>
              <span style={{ fontSize: "0.68rem", color: "#B8B0CC", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", display: "block" }}>
                DELEGATED MONTHLY SPENDING CAP
              </span>
              <strong style={{ fontSize: "0.95rem", color: "#FFFFFF", fontFamily: "var(--font-heading)" }}>
                ${remaining.toFixed(2)} USD Available
              </strong>
            </div>
          </div>
          <span style={{ background: "rgba(205, 189, 235, 0.15)", color: "#CDBDEB", border: "1px solid rgba(205, 189, 235, 0.3)", padding: "4px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
            🔐 Secure PIN Protected
          </span>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Mission Input Section */}
          <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(205, 189, 235, 0.15)", borderRadius: "16px", padding: "16px" }}>
            <label htmlFor="agent-mission-text" style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#F5F0FF", marginBottom: "8px" }}>
              What should your AI Shopper find?
            </label>

            {/* Quick Prompt Presets */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              <button
                type="button"
                onClick={() => setRequestText("Find me a premium silk abaya under $50 within 2 days. Quality matters most.")}
                style={{ background: "rgba(205, 189, 235, 0.15)", border: "1px solid rgba(205, 189, 235, 0.3)", color: "#F5F0FF", padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
              >
                👗 Silk Abaya ($50 max)
              </button>
              <button
                type="button"
                onClick={() => setRequestText("Find me an artisanal amber oud perfume under $70 delivered in 2 days.")}
                style={{ background: "rgba(205, 189, 235, 0.15)", border: "1px solid rgba(205, 189, 235, 0.3)", color: "#F5F0FF", padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
              >
                🌸 Amber Oud ($70 max)
              </button>
              <button
                type="button"
                onClick={() => setRequestText("Find me an everyday chiffon hijab under $15.")}
                style={{ background: "rgba(205, 189, 235, 0.15)", border: "1px solid rgba(205, 189, 235, 0.3)", color: "#F5F0FF", padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
              >
                🛡️ Micro-Spend (≤ $15)
              </button>
            </div>

            <textarea
              id="agent-mission-text"
              rows={3}
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="e.g. Find me a premium silk abaya under $45 delivered in 2 days. Quality is most important..."
              style={{
                width: "100%",
                background: "rgba(10, 8, 18, 0.6)",
                border: "1px solid rgba(205, 189, 235, 0.25)",
                borderRadius: "12px",
                padding: "12px 14px",
                color: "#FFFFFF",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                marginBottom: "12px"
              }}
            />

            <button
              type="button"
              className="btn-primary"
              onClick={onStartCheckout}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  <span>AI Shopper is evaluating catalog...</span>
                </>
              ) : (
                <>
                  <span className="sparkle-icon">✨</span>
                  <span>Start Autonomous Evaluation</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div style={{ background: "var(--status-blocked-bg)", color: "var(--status-blocked-text)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(168, 78, 91, 0.3)", fontSize: "0.85rem" }}>
              <strong>Evaluation Notice</strong>
              <p style={{ margin: "2px 0 0" }}>{error}</p>
            </div>
          )}

          {paymentMessage && (
            <div style={{ background: "var(--status-allowed-bg)", color: "var(--status-allowed-text)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(31, 74, 46, 0.3)", fontSize: "0.85rem" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{paymentMessage}</p>
            </div>
          )}

          {/* Results Stage */}
          {result?.success && transaction && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {mission?.interpretation_source && (
                <div
                  style={{
                    background: mission.interpretation_source === "GEMINI" ? "rgba(91, 75, 138, 0.3)" : "rgba(205, 189, 235, 0.15)",
                    border: "1px solid rgba(205, 189, 235, 0.3)",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <span style={{ fontSize: "1.2rem", color: "#CDBDEB" }}>
                    {mission.interpretation_source === "GEMINI" ? "✦" : "🛡️"}
                  </span>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#FFFFFF" }}>
                      {mission.interpretation_source === "GEMINI" ? "Gemini Intelligence Active" : "Safe Deterministic Engine Active"}
                    </strong>
                    <p style={{ margin: 0, fontSize: "0.76rem", color: "#B8B0CC" }}>
                      {mission.interpretation_source === "GEMINI"
                        ? "Evaluated and structured by Google Gemini LLM."
                        : "Interpreted locally with deterministic safety without external quota limits."}
                    </p>
                  </div>
                </div>
              )}

              {transaction.status === "NO_MATCH" && (
                <div style={{ background: "var(--status-approval-bg)", color: "var(--status-approval-text)", padding: "14px 16px", borderRadius: "12px" }}>
                  <strong>No Matching Product Found</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>{transaction.message || "No product in the catalog met all specified budget, delivery, or quality constraints."}</p>
                </div>
              )}

              {product && (
                <div
                  className="card-3d-tilt"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(205, 189, 235, 0.25)",
                    borderRadius: "18px",
                    padding: "18px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                    {product.image_emoji && (product.image_emoji.startsWith("data:image") || product.image_emoji.startsWith("http")) ? (
                      <img src={product.image_emoji} alt={product.name} style={{ width: "52px", height: "52px", objectFit: "contain", borderRadius: "10px" }} />
                    ) : (
                      <span style={{ fontSize: "2.5rem" }}>{product.image_emoji || "👗"}</span>
                    )}
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "0.72rem", color: "#B8B0CC", textTransform: "uppercase", fontWeight: 700 }}>
                        {transaction.merchant || "Luma Fashions"}
                      </span>
                      <h4 style={{ margin: "2px 0 0", fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-heading)", color: "#FFFFFF" }}>
                        {product.name}
                      </h4>
                    </div>
                    <span style={{ background: "var(--color-sage)", color: "#1F4A2E", padding: "4px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 800 }}>
                      {transaction.status}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                    <div style={{ background: "rgba(10, 8, 18, 0.5)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                      <span style={{ fontSize: "0.68rem", color: "#B8B0CC", display: "block" }}>Price</span>
                      <strong style={{ fontSize: "0.95rem", color: "#FFFFFF" }}>${transaction.price_usd || Number(product.price).toFixed(2)}</strong>
                    </div>
                    <div style={{ background: "rgba(10, 8, 18, 0.5)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                      <span style={{ fontSize: "0.68rem", color: "#B8B0CC", display: "block" }}>Delivery</span>
                      <strong style={{ fontSize: "0.95rem", color: "#FFFFFF" }}>{product.delivery_days} Days</strong>
                    </div>
                    <div style={{ background: "rgba(10, 8, 18, 0.5)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                      <span style={{ fontSize: "0.68rem", color: "#B8B0CC", display: "block" }}>Quality</span>
                      <strong style={{ fontSize: "0.95rem", color: "#FFFFFF" }}>{product.quality}</strong>
                    </div>
                  </div>

                  {/* Saved Delivery Destination Selector */}
                  <div style={{ background: "rgba(10, 8, 18, 0.5)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(205, 189, 235, 0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#CDBDEB" }}>📍 Delivery Destination</span>
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(true)}
                        style={{ background: "none", border: "none", color: "#CDBDEB", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                      >
                        ⚙️ Manage Addresses
                      </button>
                    </div>

                    <select
                      value={selectedAddressId || selectedAddress.id || ""}
                      onChange={(e) => {
                        if (e.target.value === "ADD_NEW") {
                          setShowAddressModal(true);
                        } else {
                          setSelectedAddressId(e.target.value);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "#241F3A",
                        border: "1px solid rgba(205, 189, 235, 0.3)",
                        borderRadius: "8px",
                        color: "#F5F0FF",
                        fontSize: "0.82rem",
                        outline: "none",
                        marginBottom: "10px"
                      }}
                    >
                      {savedAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          📍 {addr.name} — {addr.full_address} ({addr.phone}) {addr.is_default ? "★ Default" : ""}
                        </option>
                      ))}
                      <option value="ADD_NEW">➕ Add New Delivery Address...</option>
                    </select>

                    <div style={{ fontSize: "0.8rem", color: "#B8B0CC", lineHeight: "1.4" }}>
                      <strong style={{ color: "#FFFFFF" }}>{selectedAddress.name}</strong> • {selectedAddress.full_address} (📞 {selectedAddress.phone})
                    </div>
                  </div>
                </div>
              )}

              {/* PIN Authorization Stage */}
              {needsPinAuth && transaction.status !== "PAYMENT_VERIFIED" ? (
                <div
                  style={{
                    background: "rgba(247, 227, 176, 0.15)",
                    border: "1px solid #F7E3B0",
                    borderRadius: "16px",
                    padding: "18px",
                    textAlign: "center"
                  }}
                >
                  <span style={{ fontSize: "2rem", display: "block", marginBottom: "6px" }}>🔐</span>
                  <strong style={{ display: "block", fontSize: "1rem", color: "#F7E3B0", fontFamily: "var(--font-heading)" }}>
                    Security PIN Required
                  </strong>
                  <p style={{ fontSize: "0.82rem", color: "#B8B0CC", margin: "6px 0 16px" }}>
                    High-value transactions exceed your autonomous micro-limit ($15.00 USD). Authorize payment with your 4-digit Security PIN to proceed to PayPal.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={onOpenFaceId}
                    style={{ width: "100%" }}
                  >
                    Enter PIN to Authorize
                  </button>
                </div>
              ) : (
                (pinVerified || !needsPinAuth) &&
                (transaction.status === "READY_FOR_PAYMENT" || transaction.status === "PAYMENT_PENDING") &&
                transaction.status !== "PAYMENT_VERIFIED" && (
                  <div
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "16px",
                      padding: "20px",
                      color: "#393641",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)"
                    }}
                  >
                    {pinVerified && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--status-allowed-bg)", color: "var(--status-allowed-text)", padding: "6px 12px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "14px" }}>
                        <span>✓</span>
                        <span>Security PIN Confirmed & Authorized</span>
                      </div>
                    )}
                    <PayPalButton
                      transaction={transaction}
                      user={user}
                      deliveryAddress={deliveryAddress}
                      selectedAddress={selectedAddress}
                      onPaymentSuccess={onPaymentSuccess}
                      onError={onPaymentError}
                      onOpenFaceId={onOpenFaceId}
                    />
                  </div>
                )
              )}

              {/* Completed Payment State */}
              {transaction.status === "PAYMENT_VERIFIED" && (
                <div
                  style={{
                    background: "rgba(207, 227, 212, 0.15)",
                    border: "1px solid var(--color-sage)",
                    borderRadius: "16px",
                    padding: "20px",
                    textAlign: "center"
                  }}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--color-sage)", color: "#1F4A2E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", margin: "0 auto 10px" }}>
                    ✓
                  </div>
                  <strong style={{ fontSize: "1.05rem", color: "#FFFFFF", fontFamily: "var(--font-heading)" }}>
                    Payment Captured via PayPal Sandbox
                  </strong>
                  <p style={{ fontSize: "0.82rem", color: "#B8B0CC", margin: "4px 0 16px" }}>
                    Order ID: <code>{transaction.paypal_order_id}</code>
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={onViewReceipt}
                    style={{ width: "100%" }}
                  >
                    📄 View Agent Decision Receipt
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Embedded Saved Address Modal */}
      <SavedAddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        user={user}
        onAddressUpdated={(newAddrs) => {
          setSavedAddresses(newAddrs);
          const def = newAddrs.find((a) => a.is_default) || newAddrs[0];
          if (def) setSelectedAddressId(def.id);
        }}
      />
    </div>
  );
}
