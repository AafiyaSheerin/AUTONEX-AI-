import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function SavedAddressModal({ isOpen, onClose, user, onAddressUpdated }) {
  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? `http://${window.location.hostname}:8086`
      : "http://127.0.0.1:8086");

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State with the exact 3 required fields
  const [name, setName] = useState(user?.name || "Aafiya Sheerin");
  const [phone, setPhone] = useState("+971 50 123 4567");
  const [fullAddress, setFullAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchAddresses = async () => {
    if (!isOpen) return;
    try {
      const email = user?.email || "demo@hermora.com";
      const res = await fetch(`${API_URL}/auth/addresses?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.addresses) {
        setAddresses(data.addresses);
        if (onAddressUpdated) onAddressUpdated(data.addresses);
      }
    } catch (err) {
      console.warn("Failed to fetch addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen, user?.email]);

  // Esc key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMsg("Please enter the recipient Name.");
      return;
    }
    if (!phone.trim()) {
      setMsg("Please enter a valid Phone number.");
      return;
    }
    if (!fullAddress.trim()) {
      setMsg("Please enter the Full delivery address.");
      return;
    }

    setSubmitting(true);
    setMsg("");
    try {
      const email = user?.email || "demo@hermora.com";
      const res = await fetch(`${API_URL}/auth/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name.trim(),
          phone: phone.trim(),
          full_address: fullAddress.trim(),
          is_default: isDefault
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg("✓ Address saved successfully!");
        setFullAddress("");
        setShowAddForm(false);
        setAddresses(data.addresses || []);
        if (onAddressUpdated) onAddressUpdated(data.addresses || []);
      } else {
        setMsg(data.detail || data.message || "Failed to save address.");
      }
    } catch (err) {
      setMsg(err.message || "Network error while saving address.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (addrId) => {
    try {
      const email = user?.email || "demo@hermora.com";
      const res = await fetch(`${API_URL}/auth/addresses/${addrId}/default?email=${encodeURIComponent(email)}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses || []);
        if (onAddressUpdated) onAddressUpdated(data.addresses || []);
      }
    } catch (err) {
      console.warn("Error setting default address:", err);
    }
  };

  const handleDelete = async (addrId) => {
    try {
      const email = user?.email || "demo@hermora.com";
      const res = await fetch(`${API_URL}/auth/addresses/${addrId}?email=${encodeURIComponent(email)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses || []);
        if (onAddressUpdated) onAddressUpdated(data.addresses || []);
      }
    } catch (err) {
      console.warn("Error deleting address:", err);
    }
  };

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        background: "rgba(36, 31, 58, 0.65)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "clamp(24px, 5vh, 60px) 16px",
        boxSizing: "border-box",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <div
        className="interactive-element"
        style={{
          width: "100%",
          maxWidth: "540px",
          margin: "0 auto",
          background: "#FFFFFF",
          border: "1px solid rgba(205, 189, 235, 0.4)",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 25px 60px -12px rgba(36, 31, 58, 0.25), 0 0 35px rgba(205, 189, 235, 0.15)",
          color: "#393641",
          position: "relative",
          boxSizing: "border-box",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: "rgba(205, 189, 235, 0.35)",
                border: "1px solid rgba(205, 189, 235, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem"
              }}
            >
              📍
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: "#241F3A", letterSpacing: "-0.01em" }}>
                Saved Delivery Addresses
              </h3>
              <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "#736B82" }}>
                Autonomous AI Agent purchase destinations & Zapier courier dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "#F5F0FF",
              border: "1px solid rgba(205, 189, 235, 0.4)",
              color: "#5B4B8A",
              fontSize: "1rem",
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#EBE5F7";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F5F0FF";
            }}
          >
            ✕
          </button>
        </div>

        {/* Existing Saved Addresses List */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#5B4B8A", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Active Addresses ({addresses.length})
            </span>
            <button
              type="button"
              onClick={() => { setShowAddForm(!showAddForm); setMsg(""); }}
              style={{
                background: showAddForm ? "#F5F0FF" : "var(--gradient-primary)",
                border: showAddForm ? "1px solid rgba(205, 189, 235, 0.5)" : "none",
                color: showAddForm ? "#5B4B8A" : "#FFFFFF",
                padding: "7px 14px",
                borderRadius: "10px",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: showAddForm ? "none" : "0 4px 12px rgba(91, 75, 138, 0.25)"
              }}
            >
              {showAddForm ? "✕ Cancel" : "➕ Add New Address"}
            </button>
          </div>

          {loading ? (
            <p style={{ fontSize: "0.85rem", color: "#736B82" }}>Loading verified destinations...</p>
          ) : addresses.length === 0 ? (
            <div style={{ background: "#FAF8FD", border: "1px dashed rgba(205, 189, 235, 0.6)", padding: "20px", borderRadius: "14px", textAlign: "center", color: "#736B82", fontSize: "0.86rem" }}>
              No saved addresses found. Add a destination below.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    background: addr.is_default ? "rgba(207, 227, 212, 0.25)" : "#FAF8FD",
                    border: `1px solid ${addr.is_default ? "rgba(207, 227, 212, 0.9)" : "rgba(205, 189, 235, 0.3)"}`,
                    borderRadius: "16px",
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <strong style={{ color: "#241F3A", fontSize: "0.95rem", fontFamily: "'Outfit', sans-serif" }}>
                        {addr.name}
                      </strong>
                      {addr.is_default && (
                        <span style={{
                          background: "#CFE3D4",
                          color: "#1F4A2E",
                          border: "1px solid rgba(207, 227, 212, 0.8)",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "0.7rem",
                          fontWeight: 700
                        }}>
                          ★ Default
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#544D63", fontSize: "0.84rem", lineHeight: "1.45" }}>
                      {addr.full_address}
                    </div>
                    <div style={{ color: "#736B82", fontSize: "0.78rem", marginTop: "4px" }}>
                      📞 {addr.phone}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                    {!addr.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        style={{
                          background: "none",
                          border: "1px solid rgba(91, 75, 138, 0.35)",
                          color: "#5B4B8A",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F5F0FF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "none";
                        }}
                      >
                        Set Default
                      </button>
                    )}
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#A84E5B",
                          fontSize: "0.74rem",
                          cursor: "pointer",
                          padding: "2px 4px"
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Address Form (The 3 explicit fields requested by user) */}
        {showAddForm && (
          <form
            onSubmit={handleAddAddress}
            style={{
              background: "#FAF8FD",
              border: "1px solid rgba(205, 189, 235, 0.45)",
              borderRadius: "16px",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              marginBottom: "16px"
            }}
          >
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#5B4B8A", fontFamily: "'Outfit', sans-serif" }}>
              ➕ Add New Delivery Address
            </div>

            {/* Field 1: Name */}
            <div>
              <label style={{ fontSize: "0.78rem", color: "#393641", display: "block", marginBottom: "4px", fontWeight: 600 }}>
                1. Name (Full Name / Recipient):
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aafiya Sheerin"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#FFFFFF",
                  border: "1px solid rgba(205, 189, 235, 0.5)",
                  borderRadius: "10px",
                  padding: "9px 12px",
                  color: "#241F3A",
                  fontSize: "0.88rem",
                  outline: "none"
                }}
              />
            </div>

            {/* Field 2: Phone number */}
            <div>
              <label style={{ fontSize: "0.78rem", color: "#393641", display: "block", marginBottom: "4px", fontWeight: 600 }}>
                2. Phone number:
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +971 50 123 4567"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#FFFFFF",
                  border: "1px solid rgba(205, 189, 235, 0.5)",
                  borderRadius: "10px",
                  padding: "9px 12px",
                  color: "#241F3A",
                  fontSize: "0.88rem",
                  outline: "none"
                }}
              />
            </div>

            {/* Field 3: Full delivery address */}
            <div>
              <label style={{ fontSize: "0.78rem", color: "#393641", display: "block", marginBottom: "4px", fontWeight: 600 }}>
                3. Full delivery address:
              </label>
              <textarea
                required
                rows={3}
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="e.g. Penthouse 4B, Al-Reem Tower, 42 Luxury Promenade, Dubai Marina, Dubai, UAE"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#FFFFFF",
                  border: "1px solid rgba(205, 189, 235, 0.5)",
                  borderRadius: "10px",
                  padding: "9px 12px",
                  color: "#241F3A",
                  fontSize: "0.88rem",
                  resize: "vertical",
                  fontFamily: "inherit",
                  outline: "none"
                }}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#393641", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                style={{ accentColor: "#5B4B8A" }}
              />
              Set as my default delivery destination
            </label>

            {msg && (
              <p style={{ margin: 0, fontSize: "0.84rem", color: msg.startsWith("✓") ? "#1F4A2E" : "#A84E5B", fontWeight: 600 }}>
                {msg}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  flex: 1,
                  background: "#F5F0FF",
                  border: "1px solid rgba(205, 189, 235, 0.4)",
                  color: "#5B4B8A",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1.5,
                  background: "var(--gradient-primary)",
                  border: "none",
                  color: "#FFFFFF",
                  padding: "10px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(91, 75, 138, 0.25)"
                }}
              >
                {submitting ? "Saving..." : "💾 Save Address"}
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: "18px", textAlign: "right" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#F5F0FF",
              border: "1px solid rgba(205, 189, 235, 0.4)",
              color: "#5B4B8A",
              padding: "9px 22px",
              borderRadius: "10px",
              fontSize: "0.86rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#EBE5F7";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F5F0FF";
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
}