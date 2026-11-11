import React, { useState, useEffect } from "react";

export default function HeroMorphShowcase() {
  const [activeScene, setActiveScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 5 Swift-Morphing Showcase Elements
  const scenes = [
    { id: "credit-card", name: "PayPal Card", icon: "💳" },
    { id: "ai-bot", name: "AUTONEX Bot", icon: "🤖" },
    { id: "paypal-verified", name: "PayPal 100%", icon: "✓" },
    { id: "pin-verified", name: "PIN Shield", icon: "🔒" },
    { id: "speed-ai", name: "High-Speed AI", icon: "⚡" }
  ];

  // Auto-advance scenes every 3.8 seconds unless hovered/paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % scenes.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused, scenes.length]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveScene((prev) => (prev - 1 + scenes.length) % scenes.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveScene((prev) => (prev + 1) % scenes.length);
  };

  return (
    <div
      className="hero-morph-showcase-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "540px",
        height: "440px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        boxSizing: "border-box"
      }}
    >
      {/* Clean Ambient Soft Glow (Zero Distorted Background Jelly / Blobs) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(380px, 90vw)",
          height: "320px",
          borderRadius: "28px",
          background: "radial-gradient(ellipse at center, rgba(167, 139, 250, 0.12) 0%, rgba(91, 75, 138, 0.04) 55%, transparent 75%)",
          filter: "blur(24px)",
          pointerEvents: "none",
          zIndex: 1
        }}
      />

      {/* Interactive Navigation Arrow - Left */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous Showcase Slide"
        title="Previous Card"
        className="showcase-nav-arrow showcase-nav-arrow-left"
      >
        ❮
      </button>

      {/* Interactive Navigation Arrow - Right */}
      <button
        type="button"
        onClick={handleNext}
        aria-label="Next Showcase Slide"
        title="Next Card"
        className="showcase-nav-arrow showcase-nav-arrow-right"
      >
        ❯
      </button>

      {/* Showcase Viewport */}
      <div
        className="hero-showcase-viewport"
        style={{
          position: "relative",
          zIndex: 10,
          width: "min(360px, 94vw)",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
          maxWidth: "100%"
        }}
      >
        {/* ========================================================================= */}
        {/* SCENE 1: PAYPAL VERIFIED CREDIT CARD                                     */}
        {/* ========================================================================= */}
        <div
          className={`showcase-scene scene-credit-card ${activeScene === 0 ? "active" : ""}`}
          style={{
            position: "absolute",
            width: "min(320px, calc(100vw - 44px))",
            minHeight: "196px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(24, 20, 42, 0.98) 0%, rgba(13, 10, 26, 0.98) 100%)",
            border: "1.5px solid rgba(0, 121, 193, 0.6)",
            boxShadow: activeScene === 0 
              ? "0 20px 45px rgba(18, 14, 30, 0.7), 0 0 30px rgba(0, 121, 193, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.08)"
              : "none",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transform: activeScene === 0 ? "perspective(900px) rotateY(-6deg) rotateX(4deg) translateY(0)" : "perspective(900px) scale(0.88) translateY(24px)",
            opacity: activeScene === 0 ? 1 : 0,
            filter: activeScene === 0 ? "blur(0px)" : "blur(8px)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 0 ? "auto" : "none",
            overflow: "hidden",
            boxSizing: "border-box"
          }}
        >
          {/* Reflective Light Sheen */}
          <div
            className="card-shine-glimmer"
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.16) 50%, transparent 60%)",
              animation: "cardSheenSweep 3.2s ease-in-out infinite",
              pointerEvents: "none"
            }}
          />

          {/* Top Row: EMV Chip + Waves + PayPal Verified */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Gold EMV Chip */}
              <div
                style={{
                  width: "34px",
                  height: "26px",
                  borderRadius: "5px",
                  background: "linear-gradient(135deg, #F5D394 0%, #D4AF37 50%, #996515 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  position: "relative"
                }}
              >
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "rgba(0,0,0,0.25)" }} />
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "rgba(0,0,0,0.25)" }} />
              </div>
              {/* Contactless Waves */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BAE6FD" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 4a12 12 0 0 1 0 16" />
                <path d="M8 8a7 7 0 0 1 0 8" />
              </svg>
            </div>

            {/* Official PayPal Monogram */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="20" height="24" viewBox="0 0 100 115" fill="none">
                <path d="M28 10h34c16 0 28 9 28 25 0 14-9 24-22 25h-14l-8 45H22l18-95h-12z" fill="#003087" />
                <path d="M40 30h34c16 0 26 9 26 23 0 14-9 24-22 25h-14l-6 32H35l14-80h-9z" fill="#0079C1" />
              </svg>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
                  <span style={{ color: "#38BDF8" }}>Pay</span><span style={{ color: "#60A5FA" }}>Pal</span>
                </span>
                <span style={{ display: "block", fontSize: "0.52rem", letterSpacing: "0.08em", color: "#34D399", fontWeight: 700, textTransform: "uppercase" }}>
                  ✓ Verified
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Masked Card Number & Verification Badge */}
          <div style={{ margin: "10px 0" }}>
            <div style={{ letterSpacing: "0.18em", fontSize: "0.98rem", fontWeight: 700, color: "#FFFFFF", fontFamily: "'Fira Code', 'Courier New', monospace", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
              •••• •••• •••• 8824
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "6px", padding: "2px 6px", marginTop: "4px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34D399" }} />
              <span style={{ fontSize: "0.58rem", color: "#34D399", fontWeight: 700 }}>PayPal Instant Capture</span>
            </div>
          </div>

          {/* Bottom Row: Cardholder & Expiry & PayPal Verified Stamp */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <span style={{ display: "block", fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#B8B0CC" }}>
                Authorized Buyer
              </span>
              <strong style={{ fontSize: "0.72rem", color: "#FFFFFF", letterSpacing: "0.02em", fontFamily: "'Outfit', sans-serif" }}>
                AUTONEX Agent Vault
              </strong>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#B8B0CC" }}>
                Expires
              </span>
              <strong style={{ fontSize: "0.74rem", color: "#FFFFFF", fontFamily: "'Fira Code', monospace" }}>
                08/29
              </strong>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                background: "rgba(0, 121, 193, 0.25)",
                border: "1px solid rgba(0, 121, 193, 0.6)",
                padding: "2px 6px",
                borderRadius: "6px"
              }}
            >
              <span style={{ color: "#34D399", fontSize: "0.68rem", fontWeight: 900 }}>✓</span>
              <span style={{ color: "#FFFFFF", fontSize: "0.64rem", fontWeight: 800 }}>PayPal</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 2: AUTONEX AI BOT (PURPLE ASSISTANT MASCOT)                         */}
        {/* ========================================================================= */}
        <div
          className={`showcase-scene scene-ai-bot ${activeScene === 1 ? "active" : ""}`}
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: activeScene === 1 ? "scale(1) translateY(0)" : "scale(0.88) translateY(24px)",
            opacity: activeScene === 1 ? 1 : 0,
            filter: activeScene === 1 ? "blur(0px)" : "blur(8px)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 1 ? "auto" : "none"
          }}
        >
          {/* Animated AI Bot Mascot with Slow Float */}
          <div
            style={{
              position: "relative",
              width: "130px",
              height: "130px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "botFloatSlow 3.5s ease-in-out infinite"
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(167, 139, 250, 0.45) 0%, transparent 70%)",
                filter: "blur(14px)",
                zIndex: -1
              }}
            />

            <svg width="120" height="120" viewBox="0 0 180 180" fill="none">
              <defs>
                <filter id="heroBulbGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <radialGradient id="heroBotShine" cx="50%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#5B4B8A" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect x="12" y="75" width="22" height="34" rx="4" fill="#5B4B8A" />
              <rect x="146" y="75" width="22" height="34" rx="4" fill="#5B4B8A" />

              <path d="M78 22a12 12 0 0 1 24 0v18H78V22z" fill="#5B4B8A" />
              <path
                d="M86 32l-5-5 3-3 5 5V18h2v11l5-5 3 3-5 5z"
                fill="#FFF4D0"
                filter="url(#heroBulbGlow)"
                className="bot-glowing-filament"
              />

              <rect x="28" y="44" width="124" height="110" rx="24" fill="#5B4B8A" />
              <rect x="28" y="44" width="124" height="110" rx="24" fill="url(#heroBotShine)" />

              <circle cx="54" cy="116" r="8" fill="#F4D5D9" opacity="0.8" />
              <circle cx="126" cy="116" r="8" fill="#F4D5D9" opacity="0.8" />

              <g className="bot-blinking-eyes">
                <path d="M48 90c0-3 3-6 7-6s7 3 7 6" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M118 90c0-3 3-6 7-6s7 3 7 6" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
              </g>

              <path d="M76 118c3 4 8 7 14 7s11-3 14-7" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>

          <div
            style={{
              marginTop: "10px",
              background: "rgba(36, 31, 58, 0.9)",
              border: "1px solid rgba(205, 189, 235, 0.4)",
              borderRadius: "14px",
              padding: "6px 14px",
              textAlign: "center",
              boxShadow: "0 8px 20px rgba(18, 14, 30, 0.4)"
            }}
          >
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
              AUTONEX AI Shopper Bot
            </div>
            <div style={{ fontSize: "0.7rem", color: "#CDBDEB", marginTop: "2px" }}>
              Autonomous Decision Intelligence
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 3: OFFICIAL PAYPAL VERIFIED                                         */}
        {/* ========================================================================= */}
        <div
          className={`showcase-scene scene-paypal ${activeScene === 2 ? "active" : ""}`}
          style={{
            position: "absolute",
            width: "min(300px, calc(100vw - 44px))",
            borderRadius: "22px",
            background: "linear-gradient(135deg, rgba(36, 31, 58, 0.96) 0%, rgba(22, 17, 38, 0.98) 100%)",
            border: "1.5px solid rgba(0, 121, 193, 0.6)",
            boxShadow: activeScene === 2 
              ? "0 20px 45px rgba(18, 14, 30, 0.65), 0 0 28px rgba(0, 121, 193, 0.3)"
              : "none",
            padding: "20px 18px",
            textAlign: "center",
            transform: activeScene === 2 ? "scale(1) translateY(0)" : "scale(0.88) translateY(24px)",
            opacity: activeScene === 2 ? 1 : 0,
            filter: activeScene === 2 ? "blur(0px)" : "blur(8px)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 2 ? "auto" : "none",
            boxSizing: "border-box"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
            <svg width="38" height="42" viewBox="0 0 100 115" fill="none">
              <path d="M28 10h34c16 0 28 9 28 25 0 14-9 24-22 25h-14l-8 45H22l18-95h-12z" fill="#003087" />
              <path d="M40 30h34c16 0 26 9 26 23 0 14-9 24-22 25h-14l-6 32H35l14-80h-9z" fill="#0079C1" />
              <path d="M58 55c-2 0-4 0-6 0l-3 18h12c10 0 17-6 19-15-2-2-5-3-9-3h-13z" fill="#002066" opacity="0.4" />
            </svg>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
                <span style={{ color: "#0079C1" }}>Pay</span><span style={{ color: "#003087" }}>Pal</span>
              </div>
              <span style={{ fontSize: "0.64rem", color: "#CDBDEB", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>
                Sandbox Verified
              </span>
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(16, 185, 129, 0.16)",
              border: "1px solid rgba(16, 185, 129, 0.45)",
              color: "#34D399",
              padding: "5px 12px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              boxShadow: "0 0 14px rgba(16, 185, 129, 0.25)"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>100% Verified Settlements</span>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#B8B0CC", marginTop: "10px", lineHeight: "1.4" }}>
            Instant smart-button checkout with encrypted buyer protection.
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 4: PIN VERIFIED                                                     */}
        {/* ========================================================================= */}
        <div
          className={`showcase-scene scene-pin ${activeScene === 3 ? "active" : ""}`}
          style={{
            position: "absolute",
            width: "min(300px, calc(100vw - 44px))",
            borderRadius: "22px",
            background: "linear-gradient(135deg, rgba(36, 31, 58, 0.96) 0%, rgba(22, 17, 38, 0.98) 100%)",
            border: "1.5px solid rgba(205, 189, 235, 0.5)",
            boxShadow: activeScene === 3 
              ? "0 20px 45px rgba(18, 14, 30, 0.65), 0 0 25px rgba(205, 189, 235, 0.25)"
              : "none",
            padding: "20px 18px",
            textAlign: "center",
            transform: activeScene === 3 ? "scale(1) translateY(0)" : "scale(0.88) translateY(24px)",
            opacity: activeScene === 3 ? 1 : 0,
            filter: activeScene === 3 ? "blur(0px)" : "blur(8px)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 3 ? "auto" : "none",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "rgba(167, 139, 250, 0.16)",
              border: "1.5px solid rgba(167, 139, 250, 0.45)",
              margin: "0 auto 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 18px rgba(167, 139, 250, 0.3)"
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CDBDEB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div style={{ fontSize: "1.22rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
            PIN Verified
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(52, 211, 153, 0.15)",
              border: "1px solid rgba(52, 211, 153, 0.4)",
              color: "#34D399",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "0.74rem",
              fontWeight: 800,
              marginTop: "8px"
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Cryptographic Authorization</span>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#B8B0CC", marginTop: "10px", lineHeight: "1.4" }}>
            4-digit authorization guarantees AI agents never purchase high-value goods without consent.
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 5: HIGH-SPEED AI (SUB-SECOND EXECUTION)                              */}
        {/* ========================================================================= */}
        <div
          className={`showcase-scene scene-speed ${activeScene === 4 ? "active" : ""}`}
          style={{
            position: "absolute",
            width: "min(300px, calc(100vw - 44px))",
            borderRadius: "22px",
            background: "linear-gradient(135deg, rgba(36, 31, 58, 0.96) 0%, rgba(22, 17, 38, 0.98) 100%)",
            border: "1.5px solid rgba(245, 158, 11, 0.55)",
            boxShadow: activeScene === 4 
              ? "0 20px 45px rgba(18, 14, 30, 0.65), 0 0 28px rgba(245, 158, 11, 0.3)"
              : "none",
            padding: "20px 18px",
            textAlign: "center",
            transform: activeScene === 4 ? "scale(1) translateY(0)" : "scale(0.88) translateY(24px)",
            opacity: activeScene === 4 ? 1 : 0,
            filter: activeScene === 4 ? "blur(0px)" : "blur(8px)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 4 ? "auto" : "none",
            overflow: "hidden",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              position: "relative",
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "rgba(245, 158, 11, 0.16)",
              border: "1.5px solid rgba(245, 158, 11, 0.5)",
              margin: "0 auto 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              boxShadow: "0 0 20px rgba(245, 158, 11, 0.35)"
            }}
          >
            <div
              className="shield-scan-beam"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, transparent, #FBBF24, transparent)",
                boxShadow: "0 0 8px #FBBF24",
                animation: "shieldScanSweep 1.6s ease-in-out infinite"
              }}
            />
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(251, 191, 36, 0.35)" />
            </svg>
          </div>

          <div style={{ fontSize: "1.22rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
            High-Speed AI
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(245, 158, 11, 0.18)",
              border: "1px solid rgba(245, 158, 11, 0.45)",
              color: "#FBBF24",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "0.74rem",
              fontWeight: 800,
              marginTop: "8px"
            }}
          >
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#FBBF24", boxShadow: "0 0 6px #FBBF24" }} />
            <span>⚡ Sub-Second Speed</span>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#B8B0CC", marginTop: "10px", lineHeight: "1.4" }}>
            Autonomous agent reasoning with sub-second decision speeds and instant PayPal capture.
          </div>
        </div>
      </div>

      {/* Interactive Navigation Timeline Pills */}
      <div
        className="showcase-timeline-dots"
        style={{
          position: "absolute",
          bottom: "6px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "6px",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          maxWidth: "96%",
          overflowX: "auto",
          padding: "4px 0"
        }}
      >
        {scenes.map((scene, idx) => {
          const isActive = activeScene === idx;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => setActiveScene(idx)}
              title={`Switch to ${scene.name}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                height: "24px",
                padding: isActive ? "0 10px" : "0 7px",
                borderRadius: "999px",
                background: isActive 
                  ? "linear-gradient(90deg, #38BDF8, #60A5FA)" 
                  : "rgba(36, 31, 58, 0.8)",
                border: isActive ? "none" : "1px solid rgba(205, 189, 235, 0.3)",
                color: isActive ? "#0F172A" : "#CDBDEB",
                fontSize: "0.68rem",
                fontWeight: isActive ? 800 : 600,
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: isActive ? "0 0 12px rgba(56, 189, 248, 0.5)" : "none",
                whiteSpace: "nowrap"
              }}
            >
              <span>{scene.icon}</span>
              {isActive && <span>{scene.name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
