import React, { useEffect, useRef, useState } from "react";

export default function PayPalButton({
  transaction,
  user,
  deliveryAddress,
  selectedAddress,
  onPaymentSuccess,
  onError,
  onOpenFaceId
}) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const paypalContainerRef = useRef(null);

  const isPinRequired = Boolean(
    (transaction?.requires_pin || transaction?.status === "AWAITING_HUMAN_APPROVAL") &&
    !transaction?.pin_verified
  );

  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [verifiedPin, setVerifiedPin] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? `http://${window.location.hostname}:8086`
      : "http://127.0.0.1:8086");

  useEffect(() => {
    let isMounted = true;

    async function loadPayPal() {
      try {
        const configRes = await fetch(`${API_URL}/config`);
        const config = await configRes.json();
        const clientId = config.paypal_client_id || "sb";

        if (window.paypal) {
          if (isMounted) setScriptLoaded(true);
          return;
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons`;
        script.async = true;
        script.onload = () => {
          if (isMounted) setScriptLoaded(true);
        };
        script.onerror = () => {
          console.warn("Could not load external PayPal SDK, using native sandbox button.");
          if (isMounted) setScriptLoaded(false);
        };
        document.body.appendChild(script);
      } catch (err) {
        console.warn("Config fetch error:", err);
      }
    }

    loadPayPal();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (scriptLoaded && window.paypal && paypalContainerRef.current) {
      paypalContainerRef.current.innerHTML = "";
      try {
        window.paypal
          .Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal"
            },
            createOrder: async () => {
              if (isPinRequired && !verifiedPin) {
                onOpenFaceId?.();
                throw new Error("Security PIN authorization is required before initiating PayPal payment.");
              }

              const res = await fetch(`${API_URL}/payment/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  transaction_id: transaction.transaction_id,
                  security_pin: verifiedPin || undefined,
                  user_email: user?.email || "demo@hermora.com"
                })
              });
              const data = await res.json();
              if (!res.ok || !data.success) {
                if (data.requires_pin || res.status === 403 || data.detail?.includes("PIN") || data.message?.includes("PIN")) {
                  setShowPinModal(true);
                }
                throw new Error(data.message || data.detail || "Failed to create PayPal order.");
              }
              return data.order_id;
            },
            onApprove: async (data) => {
              setLoading(true);
              try {
                const res = await fetch(`${API_URL}/payment/verify`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    transaction_id: transaction.transaction_id,
                    order_id: data.orderID,
                    payment_id: data.paymentID || `PAYPAL_CAP_${data.orderID}`,
                    user_email: user?.email || "demo@hermora.com",
                    security_pin: verifiedPin || undefined,
                    delivery_destination: selectedAddress || {
                      name: user?.shipping_address?.recipient_name || user?.name || "Aafiya Sheerin",
                      phone: user?.shipping_address?.phone || "+971 50 123 4567",
                      full_address: deliveryAddress || user?.shipping_address?.street || "42 Luxury Promenade, Suite 4B, Dubai Marina, Dubai, UAE"
                    },
                    buyer_name: selectedAddress?.name || user?.shipping_address?.recipient_name || user?.name || "Aafiya Sheerin"
                  })
                });
                const verifyData = await res.json();
                if (!res.ok || !verifyData.success) {
                  throw new Error(verifyData.message || verifyData.detail || "Payment verification failed.");
                }
                onPaymentSuccess(verifyData);
              } catch (err) {
                onError(err.message || "PayPal capture failed.");
              } finally {
                setLoading(false);
              }
            },
            onError: (err) => {
              console.error("PayPal Smart Button error:", err);
              onError(err?.message || "PayPal Checkout encountered an issue.");
            }
          })
          .render(paypalContainerRef.current);
      } catch (err) {
        console.warn("Error rendering PayPal Buttons:", err);
      }
    }
  }, [scriptLoaded, transaction?.transaction_id, transaction?.pin_verified, verifiedPin, isPinRequired]);

  const executePaymentWithPin = async (pinToUse) => {
    setPinLoading(true);
    setPinError("");
    try {
      const orderRes = await fetch(`${API_URL}/payment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transaction.transaction_id,
          security_pin: pinToUse,
          user_email: user?.email || "demo@hermora.com"
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.detail || orderData.message || "Invalid Security PIN.");
      }

      const verifyRes = await fetch(`${API_URL}/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transaction.transaction_id,
          order_id: orderData.order_id,
          payment_id: `PAYPAL_CAP_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          user_email: user?.email || "demo@hermora.com",
          security_pin: pinToUse,
          delivery_destination: selectedAddress || {
            name: user?.shipping_address?.recipient_name || user?.name || "Aafiya Sheerin",
            phone: user?.shipping_address?.phone || "+971 50 123 4567",
            full_address: deliveryAddress || user?.shipping_address?.street || "42 Luxury Promenade, Suite 4B, Dubai Marina, Dubai, UAE"
          },
          buyer_name: selectedAddress?.name || user?.shipping_address?.recipient_name || user?.name || "Aafiya Sheerin"
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.detail || verifyData.message || "Payment capture failed with provided PIN.");
      }

      setShowPinModal(false);
      setVerifiedPin(pinToUse);
      onPaymentSuccess(verifyData);
    } catch (err) {
      setPinError(err.message || "Invalid Security PIN. Please try again.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleDirectSandboxCapture = async () => {
    if (isPinRequired && !verifiedPin) {
      setEnteredPin("");
      setPinError("");
      setShowPinModal(true);
      return;
    }

    setLoading(true);
    try {
      const orderRes = await fetch(`${API_URL}/payment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transaction.transaction_id,
          security_pin: verifiedPin || undefined,
          user_email: user?.email || "demo@hermora.com"
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        if (orderData.requires_pin || orderRes.status === 403 || orderData.detail?.includes("PIN") || orderData.message?.includes("PIN")) {
          setShowPinModal(true);
        }
        throw new Error(orderData.message || orderData.detail || "Could not create PayPal Sandbox order.");
      }

      const verifyRes = await fetch(`${API_URL}/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transaction.transaction_id,
          order_id: orderData.order_id,
          payment_id: `PAYPAL_CAP_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          user_email: user?.email || "demo@hermora.com",
          security_pin: verifiedPin || undefined,
          delivery_destination: selectedAddress || {
            name: user?.shipping_address?.recipient_name || user?.name || "Aafiya Sheerin",
            phone: user?.shipping_address?.phone || "+971 50 123 4567",
            full_address: deliveryAddress || user?.shipping_address?.street || "42 Luxury Promenade, Suite 4B, Dubai Marina, Dubai, UAE"
          },
          buyer_name: selectedAddress?.name || user?.shipping_address?.recipient_name || user?.name || "Aafiya Sheerin"
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || verifyData.detail || "PayPal Sandbox verification failed.");
      }

      onPaymentSuccess(verifyData);
    } catch (err) {
      onError(err.message || "Unable to complete PayPal Sandbox payment.");
    } finally {
      setLoading(false);
    }
  };

  const rawPrice = transaction?.price_usd ?? transaction?.selected_product?.price;
  const amountUsd = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice).toFixed(2) : "0.00";
  const userMonthlyAllowance = user?.monthly_allowance ? Number(user.monthly_allowance).toFixed(2) : "500.00";

  return (
    <div className="paypal-smart-button-wrapper" style={{
      background: "#FAF8FD",
      border: "1px solid rgba(205, 189, 235, 0.4)",
      borderRadius: "18px",
      padding: "18px",
      boxShadow: "0 6px 20px rgba(36, 31, 58, 0.04)"
    }}>
      <div className="paypal-trust-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span className="paypal-shield-tag" style={{
          fontSize: "0.72rem",
          fontWeight: 800,
          color: "#5B4B8A",
          letterSpacing: "0.06em",
          textTransform: "uppercase"
        }}>
          🛡️ PAYPAL SECURE GATEWAY
        </span>
        <span className="paypal-amount-indicator" style={{
          fontSize: "1.1rem",
          fontWeight: 800,
          color: "#241F3A",
          fontFamily: "'Outfit', sans-serif"
        }}>
          ${amountUsd} USD
        </span>
      </div>

      {isPinRequired && !verifiedPin ? (
        <div style={{
          background: "rgba(247, 227, 176, 0.25)",
          border: "1px solid rgba(247, 227, 176, 0.8)",
          borderRadius: "12px",
          padding: "10px 14px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <span style={{ fontSize: "1.2rem" }}>🔐</span>
          <div style={{ textAlign: "left" }}>
            <strong style={{ color: "#7A4D05", fontSize: "0.82rem", display: "block" }}>
              Security PIN Authorization Required
            </strong>
            <span style={{ color: "#544D63", fontSize: "0.75rem" }}>
              Purchase exceeds autonomous cap. Authorize with your 4-digit PIN.
            </span>
          </div>
        </div>
      ) : (transaction?.pin_verified || verifiedPin) ? (
        <div style={{
          background: "rgba(207, 227, 212, 0.3)",
          border: "1px solid rgba(207, 227, 212, 0.8)",
          borderRadius: "12px",
          padding: "8px 14px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#1F4A2E",
          fontSize: "0.82rem",
          fontWeight: 700
        }}>
          <span>✓</span> Security PIN Verified & Authorized
        </div>
      ) : null}

      {/* Primary Payment Action */}
      {isPinRequired && !verifiedPin ? (
        <button
          type="button"
          className="paypal-express-btn btn-primary"
          style={{
            width: "100%",
            background: "var(--gradient-primary)",
            color: "#fff",
            border: "none",
            borderRadius: "14px",
            padding: "13px",
            fontWeight: 700,
            fontSize: "0.92rem",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(91, 75, 138, 0.3)"
          }}
          onClick={() => {
            setEnteredPin("");
            setPinError("");
            setShowPinModal(true);
          }}
          disabled={loading}
        >
          <span className="paypal-btn-label">
            🔐 Authorize & Pay (${amountUsd}) with Security PIN
          </span>
        </button>
      ) : (
        <>
          <div id="paypal-button-container" ref={paypalContainerRef} className="paypal-sdk-container" />
          <button
            type="button"
            className="paypal-express-btn"
            onClick={handleDirectSandboxCapture}
            disabled={loading}
            style={{
              width: "100%",
              background: "#FFC439",
              border: "1px solid #E0A800",
              borderRadius: "14px",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(255, 196, 57, 0.35)",
              marginTop: "8px"
            }}
          >
            <span className="paypal-logo-icon">
              <svg viewBox="0 0 100 32" width="75" height="22">
                <path
                  fill="#003087"
                  d="M12.8 5.5h6.2c3.5 0 6 1.4 5.4 5.3-.6 4-3.3 6.2-6.8 6.2h-2.5l-1.4 9.5H8.5l4.3-21z"
                />
                <path
                  fill="#0079C1"
                  d="M17.7 10.7c.4-2.8-1.5-4.2-4.1-4.2h-5l-3.3 21h4.8l1.3-8.4h2.2c3.2 0 5.6-2 6.1-5.6.3-1.6 0-2.4-2-2.8z"
                />
                <text x="35" y="21" fill="#003087" fontSize="16" fontWeight="bold" fontFamily="sans-serif">
                  PayPal
                </text>
              </svg>
            </span>
            <span className="paypal-btn-label" style={{ color: "#003087", fontWeight: 700, fontSize: "0.92rem" }}>
              {loading ? "Processing via PayPal..." : `Complete Sandbox Checkout ($${amountUsd})`}
            </span>
          </button>
        </>
      )}

      <p className="paypal-disclaimer" style={{ fontSize: "0.74rem", color: "#736B82", margin: "10px 0 0", textAlign: "center" }}>
        🔒 Encrypted Sandbox Transaction. Deducts directly from your ${userMonthlyAllowance} Monthly Allowance.
      </p>

      {/* Security PIN Verification Modal */}
      {showPinModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(36, 31, 58, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 9999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          animation: "fadeIn 0.2s ease-out"
        }} onClick={() => setShowPinModal(false)}>
          <div style={{
            background: "linear-gradient(145deg, #241F3A 0%, #1D1830 100%)",
            border: "1px solid rgba(205, 189, 235, 0.35)",
            borderRadius: "24px",
            padding: "30px",
            maxWidth: "400px",
            width: "100%",
            boxShadow: "0 25px 60px -12px rgba(18, 14, 30, 0.75)",
            textAlign: "center",
            color: "#F5F0FF"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: "52px",
              height: "52px",
              background: "rgba(205, 189, 235, 0.25)",
              color: "#CDBDEB",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              margin: "0 auto 12px",
              border: "1px solid rgba(205, 189, 235, 0.4)"
            }}>
              🔐
            </div>
            <h3 style={{ color: "#FFFFFF", margin: "0 0 6px", fontSize: "1.25rem", fontFamily: "'Outfit', sans-serif" }}>
              Security PIN Verification
            </h3>
            <p style={{ color: "#B8B0CC", fontSize: "0.82rem", margin: "0 0 14px", lineHeight: "1.4" }}>
              Enter your 4-digit security PIN to authorize this <strong>${amountUsd} USD</strong> payment.
            </p>
            <div style={{ fontSize: "0.78rem", color: "#B8B0CC", marginBottom: "16px" }}>
              🔒 256-bit encrypted PIN authorization
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (enteredPin.length >= 4) executePaymentWithPin(enteredPin);
            }}>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value.replace(/\D/g, ""));
                  setPinError("");
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#1B162E",
                  border: "2px solid rgba(205, 189, 235, 0.35)",
                  borderRadius: "14px",
                  padding: "12px",
                  fontSize: "1.6rem",
                  letterSpacing: "0.3em",
                  color: "#FFFFFF",
                  textAlign: "center",
                  outline: "none",
                  marginBottom: "14px"
                }}
              />

              {pinError && (
                <p style={{ color: "#F4D5D9", background: "rgba(168, 78, 91, 0.25)", border: "1px solid rgba(244, 213, 217, 0.3)", borderRadius: "10px", padding: "8px 12px", fontSize: "0.8rem", margin: "0 0 14px", fontWeight: 600 }}>
                  ⚠️ {pinError}
                </p>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(205, 189, 235, 0.25)",
                    borderRadius: "12px",
                    color: "#B8B0CC",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinLoading || enteredPin.length < 4}
                  style={{
                    flex: 1.5,
                    padding: "11px",
                    background: enteredPin.length >= 4 ? "var(--gradient-primary)" : "rgba(255, 255, 255, 0.12)",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    cursor: enteredPin.length >= 4 ? "pointer" : "default"
                  }}
                >
                  {pinLoading ? "Authorizing..." : "Authorize Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}