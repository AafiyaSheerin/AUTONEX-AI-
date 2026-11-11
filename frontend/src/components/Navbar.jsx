import React, { useState, useEffect } from "react";
import SavedAddressModal from "./SavedAddressModal";

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  onOpenAgent,
  activeTab,
  setActiveTab,
  onResetAllowance,
  onOpenSetup: _onOpenSetup,
  onSimulateMonthAdvance,
  currentRole = "client",
  onSaveAddress: _onSaveAddress,
  onUserUpdated
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 
    (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? `http://${window.location.hostname}:8086`
      : "http://127.0.0.1:8086");

  // Keep addresses in sync with backend on mount
  useEffect(() => {
    async function syncAddresses() {
      if (!user?.email) return;
      try {
        const res = await fetch(`${API_URL}/auth/addresses?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (data.success && data.addresses?.length > 0) {
          const def = data.addresses.find((a) => a.is_default) || data.addresses[0];
          const updatedUser = {
            ...user,
            saved_addresses: data.addresses,
            shipping_address: def
              ? {
                  recipient_name: def.name,
                  phone: def.phone,
                  street: def.full_address,
                  city: def.full_address.split(",")?.[0] || def.name,
                  country: "India"
                }
              : user.shipping_address
          };
          localStorage.setItem("hermora_active_user", JSON.stringify(updatedUser));
          if (onUserUpdated) onUserUpdated(updatedUser);
        }
      } catch (err) {
        console.warn("Could not sync addresses on navbar mount:", err);
      }
    }
    syncAddresses();
  }, [user?.email]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const remaining = user?.monthly_remaining ?? user?.monthly_allowance ?? 150.0;
  const total = user?.monthly_allowance ?? 150.0;
  const spent = total - remaining;
  const percentUsed = total > 0 ? Math.min(100, Math.max(0, (spent / total) * 100)) : 0;

  return (
    <>
      <header className={`navbar-container ${isScrolled ? "is-scrolled" : ""}`}>
        <div className="navbar-inner">
          {/* Brand Logo & Tagline */}
          <div
            className="navbar-brand"
            onClick={() => currentRole === "client" && setActiveTab("store")}
            style={{ cursor: currentRole === "client" ? "pointer" : "default" }}
          >
            <div className="brand-logo-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 19 21 12 17 5 21 12 2" fill="rgba(255,255,255,0.25)" />
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-name">AUTONEX</span>
              {currentRole !== "merchant" && (
                <span className="brand-subtitle">
                  AUTHORIZE. AUTOMATE. TRANSACT.
                </span>
              )}
            </div>
          </div>

          {/* Navigation Links with Sliding Indicator */}
          <nav className="navbar-links">
            {currentRole === "client" && (
              <div className="nav-tabs-wrapper">
                <button
                  type="button"
                  className={`nav-link-btn ${activeTab === "store" ? "active" : ""}`}
                  onClick={() => setActiveTab("store")}
                >
                  <span>Storefront</span>
                </button>
                {activeTab === "security" && (
                  <button type="button" className="nav-link-btn active">
                    <span>Security & PIN</span>
                  </button>
                )}
              </div>
            )}
          </nav>

          {/* Right Action Cluster */}
          <div className="navbar-actions">
            {currentRole === "merchant" ? (
              <div className="merchant-nav-cluster">
                <button
                  type="button"
                  onClick={onLogout}
                  className="nav-signout-btn"
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                {/* AI Spending Allowance Badge */}
                <div className="allowance-badge" title="Monthly Delegated Spending Limit for AI Agent">
                  <div className="allowance-info">
                    <span className="allowance-label">
                      AI Allowance
                    </span>
                    <span className="allowance-amount">
                      ${remaining.toFixed(2)} <small>/ ${total.toFixed(0)}</small>
                    </span>
                  </div>
                  <div className="allowance-bar-bg">
                    <div
                      className="allowance-bar-fill"
                      style={{ width: `${100 - percentUsed}%` }}
                    />
                  </div>
                  {remaining < total && (
                    <button
                      className="allowance-reset-btn"
                      onClick={onResetAllowance}
                      title={`Reset spend to full allowance ($${total.toFixed(0)})`}
                    >
                      ↺
                    </button>
                  )}
                </div>

                {/* Prominent Multimedia Shipping Address Hub */}
                <div
                  className="shipping-address-badge interactive-element"
                  onClick={() => setShowAddressModal(true)}
                  title="Click to view delivery route and manage addresses"
                >
                  <div className="shipping-badge-icon-box">
                    <span className="beacon-ping" />
                    <span className="beacon-dot" />
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="shipping-badge-info">
                    <span className="shipping-badge-label">SHIPPING ADDRESS</span>
                    <div className="shipping-badge-value">
                      <span className="shipping-badge-city">
                        {(() => {
                          const def = user?.saved_addresses?.find((a) => a.is_default) || user?.saved_addresses?.[0];
                          if (def && def.full_address) {
                            const label = def.full_address;
                            return label.length > 22 ? `${label.slice(0, 20)}...` : label;
                          }
                          const s = user?.shipping_address?.street || user?.shipping_address?.city;
                          if (s && !s.includes("Dubai Marina") && !s.includes("Penthouse 4B") && !s.includes("42 Luxury Promenade")) {
                            return s.length > 22 ? `${s.slice(0, 20)}...` : s;
                          }
                          return "Add Delivery Address";
                        })()}
                      </span>
                      <span className="shipping-edit-hint">Change</span>
                    </div>
                  </div>
                </div>

                {/* Shop with AI Primary CTA */}
                <button
                  className="ai-trigger-btn"
                  onClick={() => onOpenAgent()}
                  title="Open AUTONEX AI Personal Shopper"
                >
                  <span className="ai-btn-text">Shop with AI</span>
                </button>

                {/* User Profile & Saved Address Dropdown */}
                {user ? (
                  <div className="user-profile-wrapper">
                    <button
                      className="user-profile-btn"
                      onClick={() => setProfileOpen(!profileOpen)}
                      aria-expanded={profileOpen}
                    >
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name || "Aafiya")}`}
                        alt={user.name}
                        className="user-avatar"
                      />
                      <span className="user-name-label">{(user.name || "User").split(" ")[0]}</span>
                      <span className="dropdown-caret">{profileOpen ? "▴" : "▾"}</span>
                    </button>

                    {profileOpen && (
                      <div className="profile-dropdown-card">
                        <div className="dropdown-header">
                          <p className="dropdown-name">{user.name}</p>
                          <p className="dropdown-email">{user.email}</p>
                        </div>
                        <div className="dropdown-divider" />
                        <div className="dropdown-stat">
                          <span>Monthly Limit:</span>
                          <strong>${total.toFixed(2)} USD</strong>
                        </div>
                        <div className="dropdown-stat">
                          <span>Available Spend:</span>
                          <strong className="text-mint">${remaining.toFixed(2)} USD</strong>
                        </div>
                        <div className="dropdown-stat">
                          <span>Security PIN:</span>
                          <strong className="text-aqua">Protected ✓</strong>
                        </div>
                        <div className="dropdown-stat">
                          <span>Shipping Address:</span>
                          <strong className="text-aqua" style={{ fontSize: "0.74rem" }}>
                            {(() => {
                              const def = user?.saved_addresses?.find((a) => a.is_default) || user?.saved_addresses?.[0];
                              if (def) return def.full_address.length > 26 ? `${def.full_address.slice(0, 24)}...` : def.full_address;
                              const s = user?.shipping_address?.street || user?.shipping_address?.city;
                              return s || "Add Delivery Address";
                            })()}
                          </strong>
                        </div>
                        <div className="dropdown-divider" />
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            setShowAddressModal(true);
                            setProfileOpen(false);
                          }}
                          style={{ color: "#31B6A5", fontWeight: 700 }}
                        >
                          Manage Delivery Addresses
                        </button>
                        <button
                          className="dropdown-item setup-item"
                          onClick={() => {
                            setActiveTab("security");
                            setProfileOpen(false);
                          }}
                        >
                          Security PIN & Limits
                        </button>
                        <button
                          className="dropdown-item reset-item"
                          onClick={() => {
                            onResetAllowance();
                            setProfileOpen(false);
                          }}
                        >
                          Restore Full Allowance (${total.toFixed(0)})
                        </button>
                        <button
                          className="dropdown-item simulate-cycle-item"
                          onClick={() => {
                            onSimulateMonthAdvance?.();
                            setProfileOpen(false);
                          }}
                          title="Simulate advancing the calendar by 1 month to see automatic allowance renewal"
                        >
                          Test 1-Month Advance (Auto-Revives)
                        </button>
                        <div className="dropdown-divider" />
                        <button
                          className="dropdown-item logout-item"
                          onClick={() => {
                            onLogout();
                            setProfileOpen(false);
                          }}
                          style={{
                            color: "#DC2626",
                            fontWeight: 800,
                            background: "rgba(239, 68, 68, 0.08)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            borderRadius: 10,
                            padding: "10px 14px",
                            textAlign: "center",
                            marginTop: 6,
                            cursor: "pointer",
                            width: "100%",
                            display: "block",
                            fontSize: "0.86rem"
                          }}
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="auth-btn-signin" onClick={onOpenAuth}>
                    Sign In
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Saved Address Modal with guaranteed top clearance */}
      <SavedAddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        user={user}
        onAddressUpdated={(newAddrs) => {
          if (user) {
            const def = newAddrs.find((a) => a.is_default) || newAddrs[0];
            const updatedUser = {
              ...user,
              saved_addresses: newAddrs,
              shipping_address: def
                ? {
                    recipient_name: def.name,
                    phone: def.phone,
                    street: def.full_address,
                    city: def.full_address.split(",")[0] || def.name,
                    country: "India"
                  }
                : user.shipping_address
            };
            localStorage.setItem("hermora_active_user", JSON.stringify(updatedUser));
            if (onUserUpdated) onUserUpdated(updatedUser);
            if (_onSaveAddress && def) {
              _onSaveAddress(updatedUser.shipping_address);
            }
          }
        }}
      />
    </>
  );
}
