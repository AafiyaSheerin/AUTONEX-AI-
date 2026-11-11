import React, { useState, useEffect } from "react";
import HeroMorphShowcase from "./HeroMorphShowcase";

function TypewriterHeading() {
  const fullText = "Authorize. Automate. Transact.";
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setDisplayText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(timer);
      }
    }, 45);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ marginBottom: "18px" }}>
      <h1
        className="hero-title"
        style={{
          fontSize: "clamp(2.6rem, 5.8vw, 4.2rem)",
          fontWeight: 900,
          fontFamily: "'Outfit', sans-serif",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          margin: "0 0 10px",
          background: "linear-gradient(120deg, #3B2A63 0%, #5B4B8A 45%, #7663A8 75%, #A84E5B 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}
      >
        AUTONEX
      </h1>
      <div
        className="hero-tagline typewriter-heading"
        style={{
          fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)",
          fontWeight: 700,
          fontFamily: "'Outfit', 'Fira Code', 'Courier New', monospace",
          color: "var(--color-plum-night)",
          lineHeight: 1.25,
          letterSpacing: "-0.015em",
          display: "flex",
          alignItems: "center"
        }}
      >
        <span>{displayText}</span>
        <span
          className="typing-cursor"
          style={{
            display: "inline-block",
            width: "3px",
            height: "1.15em",
            marginLeft: "4px",
            backgroundColor: "#5B4B8A",
            animation: "blinkCursor 0.9s infinite",
            verticalAlign: "middle"
          }}
        >
          &nbsp;
        </span>
      </div>
    </div>
  );
}



export default function Storefront({ onAskAiToBuy, onOpenAgent: _onOpenAgent, onOpenSecurityPage, user }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8086";

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await fetch(`${API_URL}/catalog`);
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
          const cats = ["All", ...new Set(data.products.map((p) => p.category))];
          setCategories(cats);
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [API_URL]);

  const filteredProducts = products.filter((p) => {
    const matchCategory =
      selectedCategory === "All" ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchCategory && matchSearch;
  });

  // Card 3D tilt handler
  const handleCardMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };

  const handleCardMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)";
  };

  return (
    <div className="storefront-page" style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px 80px", width: "100%", boxSizing: "border-box" }}>
      {/* Hero Section with 3D Centerpiece */}
      <section
        className="storefront-hero"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "36px",
          padding: "30px 0 24px",
          position: "relative",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        <div className="hero-content">
          <div
            className="hero-pill-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-lavender)",
              color: "var(--color-plum-night)",
              fontWeight: 700,
              fontSize: "0.76rem",
              letterSpacing: "0.05em",
              marginBottom: "16px"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
            <span>INTELLIGENT AGENTIC COMMERCE & PAYPAL GOVERNANCE</span>
          </div>

          <TypewriterHeading />

          <p
            className="hero-subtitle"
            style={{
              fontSize: "1.05rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.55,
              margin: "0 0 28px",
              maxWidth: "560px"
            }}
          >
            Experience the future of boutique shopping. Browse handpicked atelier collections or delegate purchases to your{" "}
            <strong>AUTONEX AI Shopper Agent</strong>, guarded by real-time spending caps and cryptographic Security PIN verification.
          </p>

          <div className="hero-cta-cluster" style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px" }}>
            <a
              href="#catalog-grid"
              className="btn-primary"
              style={{
                textDecoration: "none",
                padding: "13px 26px",
                fontSize: "0.95rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span>Explore Collection ({products.length})</span>
              <span className="arrow-down">↓</span>
            </a>
          </div>

        </div>

        {/* Main Hero Organic 3D Morphing Shape & Sequential Showcase */}
        <div
          className="hero-3d-wrapper hero-morph-wrapper"
          style={{
            minHeight: "500px",
            width: "100%",
            maxWidth: "540px",
            margin: "0 auto",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible"
          }}
        >
          <HeroMorphShowcase />
        </div>
      </section>

      {/* Security PIN & Spending Vault Promo Card */}
      <section className="vault-promo-container" style={{ margin: "24px 0 36px" }}>
        <div
          className="vault-promo-card card-3d-tilt"
          onClick={() => onOpenSecurityPage?.()}
          role="button"
          tabIndex={0}
          style={{
            background: "linear-gradient(135deg, #FFF5F6 0%, #F4D5D9 40%, #FFF9F2 100%)",
            border: "1px solid rgba(168, 78, 91, 0.2)",
            borderRadius: "22px",
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            cursor: "pointer",
            boxShadow: "var(--shadow-md)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "280px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "var(--color-violet)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                boxShadow: "0 4px 14px rgba(91, 75, 138, 0.25)"
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--color-deep-rose)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                SECURITY PIN & SPENDING VAULT
              </div>
              <h3 style={{ margin: "2px 0 4px", fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-plum-night)" }}>
                Intelligent Spending Caps & PIN Guardrails
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                Configure your monthly spending cap and protect all high-value purchases with your 4-digit Security PIN.
                {user?.monthly_allowance ? (
                  <span> Active Limit: <strong>${user.monthly_allowance.toFixed(2)} USD</strong> (PIN Protected ✓)</span>
                ) : (
                  <span> Dynamically calibrated limits with instant cryptographic verification.</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSecurityPage?.();
            }}
          >
            <span>Open Security Vault</span>
            <span>→</span>
          </button>
        </div>
      </section>

      {/* Catalog Search & Category Filters */}
      <section className="catalog-toolbar" id="catalog-grid" style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "18px"
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-plum-night)" }}>
              Artisan Boutique Catalog
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--color-text-secondary)" }}>
              Verified luxury fashion, fine perfumery, and exclusive atelier collections.
            </p>
          </div>

          <div style={{ position: "relative", minWidth: "280px" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}>🔍</span>
            <input
              type="text"
              placeholder="Search silk abayas, amber oud, kaftans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 38px 12px 38px",
                borderRadius: "14px",
                border: "1px solid var(--color-border)",
                background: "#FFFFFF",
                fontSize: "0.92rem",
                color: "var(--color-charcoal)",
                outline: "none",
                boxShadow: "var(--shadow-sm)"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Horizontally scrollable Category Chips */}
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px" }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "9px 20px",
                  borderRadius: "var(--radius-full)",
                  border: isActive ? "2px solid var(--color-violet)" : "1px solid var(--color-border)",
                  background: isActive ? "var(--color-lavender)" : "#FFFFFF",
                  color: isActive ? "var(--color-violet)" : "var(--color-charcoal)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  fontFamily: "var(--font-heading)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? "0 4px 12px rgba(91, 75, 138, 0.15)" : "none"
                }}
              >
                <span>{cat === "All" ? "All Collections" : cat}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Catalog Grid Section with 3D Tilt Cards */}
      <section className="catalog-grid-section">
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
            {[1, 2, 3, 4, 5, 6].map((skel) => (
              <div
                key={skel}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "20px",
                  padding: "20px",
                  height: "360px",
                  border: "1px solid var(--color-border)",
                  animation: "pulse 1.5s infinite"
                }}
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid var(--color-border)",
              borderRadius: "22px",
              padding: "48px 24px",
              textAlign: "center",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <div style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 14px",
              borderRadius: "16px",
              background: "rgba(91, 75, 138, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5B4B8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.25rem", fontFamily: "var(--font-heading)", color: "var(--color-plum-night)" }}>
              No items match your criteria
            </h3>
            <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)", fontSize: "0.88rem" }}>
              Try searching for different terms or reset your filters.
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div
            className="products-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px"
            }}
          >
            {filteredProducts.map((product) => {
              const priceUsd = Number(product.price).toFixed(2);
              return (
                <article
                  key={product.id}
                  className="product-card card-3d-tilt"
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--color-border)",
                    borderRadius: "22px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "var(--shadow-md)",
                    transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.4, 1), box-shadow 0.2s ease",
                    transformStyle: "preserve-3d"
                  }}
                >
                  <div
                    style={{
                      height: "190px",
                      background: "linear-gradient(135deg, #FFF9F2 0%, #F5ECF7 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      transform: "translateZ(20px)"
                    }}
                  >
                    {product.image_emoji && (product.image_emoji.startsWith("data:image") || product.image_emoji.startsWith("http")) ? (
                      <img
                        src={product.image_emoji}
                        alt={product.name}
                        style={{ maxHeight: "150px", maxWidth: "90%", objectFit: "contain", borderRadius: "10px" }}
                      />
                    ) : (
                      <span style={{ fontSize: "4.5rem", filter: "drop-shadow(0 8px 16px rgba(91,75,138,0.15))" }}>
                        {product.image_emoji || "👗"}
                      </span>
                    )}

                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        background: "rgba(255, 255, 255, 0.92)",
                        color: "var(--color-violet)",
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        border: "1px solid var(--color-border)"
                      }}
                    >
                      {product.quality} Quality
                    </span>

                    {product.delivery_days <= 2 && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "12px",
                          right: "12px",
                          background: "var(--color-sage)",
                          color: "#1F4A2E",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.7rem",
                          fontWeight: 700
                        }}
                      >
                        ⚡ {product.delivery_days}D Express
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                          {product.merchant || "Luma Fashions"}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-deep-rose)", fontWeight: 700 }}>
                          ★ 4.9 Verified
                        </span>
                      </div>

                      <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--color-plum-night)" }}>
                        {product.name}
                      </h3>
                      <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {product.description}
                      </p>

                      <div style={{ display: "flex", gap: "10px", fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "14px" }}>
                        <span>🎨 {product.color}</span>
                        <span>•</span>
                        <span>📦 {product.stock} in stock</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
                        <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Price</span>
                        <strong style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-plum-night)", fontFamily: "var(--font-heading)" }}>
                          ${priceUsd} <small style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>USD</small>
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => onAskAiToBuy(product)}
                        title="Have the AUTONEX AI evaluate and buy this item safely"
                        style={{ width: "100%" }}
                      >
                        <span>✨</span>
                        <span>Ask AI to Buy</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
