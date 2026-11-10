import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroMorphShowcase() {
  const mountRef = useRef(null);
  const [activeScene, setActiveScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Scene configuration
  const scenes = [
    { id: "credit-card", name: "Credit Card" },
    { id: "ai-bot", name: "AUTONEX AI Bot" },
    { id: "paypal-verified", name: "PayPal Verified" },
    { id: "pin-verified", name: "PIN Verified" },
    { id: "zero-trust", name: "Zero-Trust AI" }
  ];

  // Auto-advance scenes every 4 seconds unless hovered/paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % scenes.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [isPaused, scenes.length]);

  // Three.js Continuous Organic 3D Morphing Purple Blob
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 480;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6.4;

    // Rich Lavender & Violet Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfdf8ff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x9d7ce8, 2.6);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf4d5d9, 1.8);
    fillLight.position.set(-4, -3, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa78bfa, 2.8);
    rimLight.position.set(0, -4, -3);
    scene.add(rimLight);

    // Organic 3D Morphing Mesh using Icosahedron with vertex displacement (properly scaled to prevent canvas edge clipping)
    const baseRadius = 1.18;
    const geometry = new THREE.IcosahedronGeometry(baseRadius, 5); // Smooth high-res topology
    const posAttr = geometry.attributes.position;
    const vertexCount = posAttr.count;

    // Cache original normalized sphere coordinates
    const originalNormals = [];
    for (let i = 0; i < vertexCount; i++) {
      const v = new THREE.Vector3(
        posAttr.getX(i),
        posAttr.getY(i),
        posAttr.getZ(i)
      ).normalize();
      originalNormals.push(v);
    }

    // Translucent Physical Material for luxury depth & reflections
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#7663A8"),
      emissive: new THREE.Color("#2E1A47"),
      emissiveIntensity: 0.15,
      roughness: 0.22,
      metalness: 0.12,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
      transmission: 0.42,
      opacity: 0.88,
      transparent: true,
      ior: 1.45,
      reflectivity: 0.5
    });

    const morphBlob = new THREE.Mesh(geometry, material);
    scene.add(morphBlob);

    let animId = null;
    const clock = new THREE.Clock();

    const animate = () => {
      const t = prefersReducedMotion ? 0 : clock.getElapsedTime() * 0.75;

      // Continuously transform boundary between organic fluid shapes
      for (let i = 0; i < vertexCount; i++) {
        const norm = originalNormals[i];
        const nx = norm.x;
        const ny = norm.y;
        const nz = norm.z;

        // Multi-harmonic 3D displacement waves creating organic blob deformations
        const wave1 = Math.sin(nx * 1.8 + t) * Math.cos(ny * 1.8 + t * 0.85) * Math.sin(nz * 1.8 + t * 1.1);
        const wave2 = Math.sin(nx * 3.4 - t * 1.25) * Math.sin(ny * 3.4 + t * 0.95) * 0.32;
        const wave3 = Math.cos((nx + ny + nz) * 2.2 + t * 0.6) * 0.22;

        const displacement = (wave1 + wave2 + wave3) * 0.22;
        const currentRadius = baseRadius * (1 + displacement);

        posAttr.setXYZ(i, nx * currentRadius, ny * currentRadius, nz * currentRadius);
      }

      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();

      // Subtle floating movement centered inside viewport
      morphBlob.position.y = Math.sin(t * 0.7) * 0.04;
      morphBlob.rotation.y = t * 0.14;
      morphBlob.rotation.z = Math.sin(t * 0.4) * 0.05;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 480;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animId) cancelAnimationFrame(animId);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="hero-morph-showcase-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "540px",
        height: "500px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        overflow: "visible"
      }}
    >
      {/* Ambient Pulsing Purple Glow Aura */}
      <div
        className="hero-morph-glow-aura"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "440px",
          height: "440px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 45% 45%, rgba(167, 139, 250, 0.42) 0%, rgba(118, 99, 168, 0.22) 50%, rgba(91, 75, 138, 0) 75%)",
          filter: "blur(28px)",
          pointerEvents: "none",
          zIndex: 1,
          animation: "auraBreathe 5s ease-in-out infinite"
        }}
      />

      {/* Three.js Morphing Blob Canvas */}
      <div
        ref={mountRef}
        className="hero-morph-canvas-wrapper"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none"
        }}
      />

      {/* Sequential Animated Visual Showcase (Layered Seamlessly Inside the Shape) */}
      <div
        className="hero-showcase-viewport"
        style={{
          position: "relative",
          zIndex: 10,
          width: "360px",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto"
        }}
      >
        {/* ========================================================================= */}
        {/* SCENE 1: LUXURY FLOATING CREDIT CARD                                     */}
        {/* ========================================================================= */}
        <div
          className={`showcase-scene scene-credit-card ${activeScene === 0 ? "active" : ""}`}
          style={{
            position: "absolute",
            width: "320px",
            height: "192px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(36, 31, 58, 0.94) 0%, rgba(22, 17, 38, 0.96) 100%)",
            border: "1.5px solid rgba(205, 189, 235, 0.55)",
            boxShadow: "0 22px 50px rgba(18, 14, 30, 0.65), 0 0 30px rgba(167, 139, 250, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.12)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transform: activeScene === 0 ? "perspective(900px) rotateY(-8deg) rotateX(6deg) translateY(0)" : "perspective(900px) scale(0.9) translateY(20px)",
            opacity: activeScene === 0 ? 1 : 0,
            filter: activeScene === 0 ? "blur(0px)" : "blur(6px)",
            transition: "all 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 0 ? "auto" : "none",
            overflow: "hidden"
          }}
        >
          {/* Subtle Reflective Diagonal Light Sheen */}
          <div
            className="card-shine-glimmer"
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%)",
              animation: "cardSheenSweep 3.5s ease-in-out infinite",
              pointerEvents: "none"
            }}
          />

          {/* Top Row: EMV Chip + Contactless + Brand */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Gold EMV Chip */}
              <div
                style={{
                  width: "36px",
                  height: "28px",
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #F5D394 0%, #D4AF37 50%, #996515 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  position: "relative"
                }}
              >
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "rgba(0,0,0,0.25)" }} />
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "rgba(0,0,0,0.25)" }} />
              </div>
              {/* Contactless Waves SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDBDEB" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 4a12 12 0 0 1 0 16" />
                <path d="M8 8a7 7 0 0 1 0 8" />
              </svg>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.08em", color: "#F5F0FF", fontFamily: "'Outfit', sans-serif" }}>
                AUTONEX
              </span>
              <span style={{ display: "block", fontSize: "0.55rem", letterSpacing: "0.12em", color: "#CDBDEB", textTransform: "uppercase" }}>
                Atelier Vault
              </span>
            </div>
          </div>

          {/* Middle: Masked Card Number */}
          <div style={{ letterSpacing: "0.22em", fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF", fontFamily: "'Fira Code', 'Courier New', monospace", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            •••• •••• •••• 8824
          </div>

          {/* Bottom Row: Cardholder & Expiry & Network Emblem */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <span style={{ display: "block", fontSize: "0.52rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#B8B0CC" }}>
                Smart Governance
              </span>
              <strong style={{ fontSize: "0.76rem", color: "#FFFFFF", letterSpacing: "0.03em", fontFamily: "'Outfit', sans-serif" }}>
                Fix Spending Limits Every Month
              </strong>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#B8B0CC" }}>
                Expires
              </span>
              <strong style={{ fontSize: "0.78rem", color: "#FFFFFF", fontFamily: "'Fira Code', monospace" }}>
                08/29
              </strong>
            </div>
            {/* Dual Circle Luxury Card Network Emblem */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#F4D5D9", opacity: 0.88 }} />
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#A78BFA", opacity: 0.85, marginLeft: "-8px" }} />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 2: HERMORA AI BOT (PURPLE ASSISTANT)                               */}
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
            filter: activeScene === 1 ? "blur(0px)" : "blur(6px)",
            transition: "all 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 1 ? "auto" : "none"
          }}
        >
          {/* Animated 3D AI Bot Mascot */}
          <div
            style={{
              position: "relative",
              width: "140px",
              height: "140px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "botFloatSlow 3.8s ease-in-out infinite"
            }}
          >
            {/* Soft Energy Halo */}
            <div
              style={{
                position: "absolute",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(167, 139, 250, 0.45) 0%, transparent 70%)",
                filter: "blur(14px)",
                zIndex: -1
              }}
            />

            {/* Custom Luxury Purple Bot Head SVG */}
            <svg width="130" height="130" viewBox="0 0 180 180" fill="none">
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

              {/* Ears */}
              <rect x="12" y="75" width="22" height="34" rx="4" fill="#5B4B8A" />
              <rect x="146" y="75" width="22" height="34" rx="4" fill="#5B4B8A" />

              {/* Lightbulb Antenna */}
              <path d="M78 22a12 12 0 0 1 24 0v18H78V22z" fill="#5B4B8A" />
              <path
                d="M86 32l-5-5 3-3 5 5V18h2v11l5-5 3 3-5 5z"
                fill="#FFF4D0"
                filter="url(#heroBulbGlow)"
                className="bot-glowing-filament"
              />

              {/* Rounded Head */}
              <rect x="28" y="44" width="124" height="110" rx="24" fill="#5B4B8A" />
              <rect x="28" y="44" width="124" height="110" rx="24" fill="url(#heroBotShine)" />

              {/* Blushing Cheeks */}
              <circle cx="54" cy="116" r="8" fill="#F4D5D9" opacity="0.8" />
              <circle cx="126" cy="116" r="8" fill="#F4D5D9" opacity="0.8" />

              {/* Blinking / Winking Eyes */}
              <g className="bot-blinking-eyes">
                <path d="M48 90c0-3 3-6 7-6s7 3 7 6" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
                <path d="M118 90c0-3 3-6 7-6s7 3 7 6" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
              </g>

              {/* Smiling Mouth */}
              <path d="M76 118c3 4 8 7 14 7s11-3 14-7" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>

          {/* Subtitle Pill */}
          <div
            style={{
              marginTop: "12px",
              background: "rgba(36, 31, 58, 0.9)",
              border: "1px solid rgba(205, 189, 235, 0.4)",
              borderRadius: "14px",
              padding: "7px 16px",
              textAlign: "center",
              boxShadow: "0 8px 20px rgba(18, 14, 30, 0.4)"
            }}
          >
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
              AUTONEX AI Shopper Bot
            </div>
            <div style={{ fontSize: "0.74rem", color: "#CDBDEB", marginTop: "2px" }}>
              Autonomous Decision Intelligence
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 3: OFFICIAL PAYPAL VERIFIED                                        */}
        {/* ========================================================================= */}
        <div
          className={`showcase-scene scene-paypal ${activeScene === 2 ? "active" : ""}`}
          style={{
            position: "absolute",
            width: "300px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, rgba(36, 31, 58, 0.94) 0%, rgba(22, 17, 38, 0.96) 100%)",
            border: "1.5px solid rgba(205, 189, 235, 0.5)",
            boxShadow: "0 22px 50px rgba(18, 14, 30, 0.6), 0 0 25px rgba(0, 121, 193, 0.25)",
            padding: "24px 22px",
            textAlign: "center",
            transform: activeScene === 2 ? "scale(1) translateY(0)" : "scale(0.88) translateY(24px)",
            opacity: activeScene === 2 ? 1 : 0,
            filter: activeScene === 2 ? "blur(0px)" : "blur(6px)",
            transition: "all 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 2 ? "auto" : "none"
          }}
        >
          {/* Official PayPal Monogram & Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "14px" }}>
            <svg width="42" height="48" viewBox="0 0 100 115" fill="none">
              {/* Dark Blue Left P */}
              <path
                d="M28 10h34c16 0 28 9 28 25 0 14-9 24-22 25h-14l-8 45H22l18-95h-12z"
                fill="#003087"
              />
              {/* Light Blue Foreground P */}
              <path
                d="M40 30h34c16 0 26 9 26 23 0 14-9 24-22 25h-14l-6 32H35l14-80h-9z"
                fill="#0079C1"
              />
              {/* Overlap Shade */}
              <path
                d="M58 55c-2 0-4 0-6 0l-3 18h12c10 0 17-6 19-15-2-2-5-3-9-3h-13z"
                fill="#002066"
                opacity="0.4"
              />
            </svg>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
                <span style={{ color: "#0079C1" }}>Pay</span><span style={{ color: "#003087" }}>Pal</span>
              </div>
              <span style={{ fontSize: "0.68rem", color: "#CDBDEB", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700 }}>
                Sandbox Verified
              </span>
            </div>
          </div>

          {/* Glowing Green Verification Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(16, 185, 129, 0.16)",
              border: "1px solid rgba(16, 185, 129, 0.45)",
              color: "#34D399",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "0.82rem",
              fontWeight: 800,
              boxShadow: "0 0 14px rgba(16, 185, 129, 0.25)"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>100% Verified Settlements</span>
          </div>

          <div style={{ fontSize: "0.75rem", color: "#B8B0CC", marginTop: "12px", lineHeight: "1.4" }}>
            Instant smart-button checkout with encrypted buyer protection.
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 4: PIN VERIFIED                                                    */}
        {/* ========================================================================= */}
        <div
          className={`showcase-scene scene-pin ${activeScene === 3 ? "active" : ""}`}
          style={{
            position: "absolute",
            width: "300px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, rgba(36, 31, 58, 0.94) 0%, rgba(22, 17, 38, 0.96) 100%)",
            border: "1.5px solid rgba(205, 189, 235, 0.5)",
            boxShadow: "0 22px 50px rgba(18, 14, 30, 0.6), 0 0 25px rgba(244, 213, 217, 0.25)",
            padding: "24px 22px",
            textAlign: "center",
            transform: activeScene === 3 ? "scale(1) translateY(0)" : "scale(0.88) translateY(24px)",
            opacity: activeScene === 3 ? 1 : 0,
            filter: activeScene === 3 ? "blur(0px)" : "blur(6px)",
            transition: "all 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 3 ? "auto" : "none"
          }}
        >
          {/* Security Lock with Animated Checkmark */}
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              background: "rgba(167, 139, 250, 0.16)",
              border: "1.5px solid rgba(167, 139, 250, 0.45)",
              margin: "0 auto 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(167, 139, 250, 0.3)"
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CDBDEB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
            PIN Verified
          </div>

          {/* Animated Verification Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(52, 211, 153, 0.15)",
              border: "1px solid rgba(52, 211, 153, 0.4)",
              color: "#34D399",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              marginTop: "8px"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Cryptographic Authorization</span>
          </div>

          <div style={{ fontSize: "0.75rem", color: "#B8B0CC", marginTop: "12px", lineHeight: "1.4" }}>
            4-digit authorization guarantees AI agents never purchase high-value goods without consent.
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCENE 5: ZERO-TRUST AI WITH SCANNING SHIELD                              */}
        {/* ========================================================================= */}
        <div
          className={`showcase-scene scene-zero-trust ${activeScene === 4 ? "active" : ""}`}
          style={{
            position: "absolute",
            width: "300px",
            borderRadius: "22px",
            background: "linear-gradient(135deg, rgba(36, 31, 58, 0.94) 0%, rgba(22, 17, 38, 0.96) 100%)",
            border: "1.5px solid rgba(205, 189, 235, 0.5)",
            boxShadow: "0 22px 50px rgba(18, 14, 30, 0.6), 0 0 25px rgba(167, 139, 250, 0.3)",
            padding: "24px 22px",
            textAlign: "center",
            transform: activeScene === 4 ? "scale(1) translateY(0)" : "scale(0.88) translateY(24px)",
            opacity: activeScene === 4 ? 1 : 0,
            filter: activeScene === 4 ? "blur(0px)" : "blur(6px)",
            transition: "all 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: activeScene === 4 ? "auto" : "none",
            overflow: "hidden"
          }}
        >
          {/* Scanning Security Shield */}
          <div
            style={{
              position: "relative",
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              background: "rgba(91, 75, 138, 0.25)",
              border: "1.5px solid rgba(205, 189, 235, 0.5)",
              margin: "0 auto 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {/* Vertical Scanning Laser Beam */}
            <div
              className="shield-scan-beam"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, transparent, #34D399, transparent)",
                boxShadow: "0 0 8px #34D399",
                animation: "shieldScanSweep 2s ease-in-out infinite"
              }}
            />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CDBDEB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
            Zero-Trust AI
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(167, 139, 250, 0.18)",
              border: "1px solid rgba(167, 139, 250, 0.4)",
              color: "#CDBDEB",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 800,
              marginTop: "8px"
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34D399" }} />
            <span>Invariant Guarded</span>
          </div>

          <div style={{ fontSize: "0.75rem", color: "#B8B0CC", marginTop: "12px", lineHeight: "1.4" }}>
            Autonomous shopping strictly bound by predefined monthly caps and spending rules.
          </div>
        </div>
      </div>

      {/* Pagination Timeline Dots */}
      <div
        className="showcase-timeline-dots"
        style={{
          position: "absolute",
          bottom: "8px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          zIndex: 20
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
                width: isActive ? "28px" : "8px",
                height: "8px",
                borderRadius: "999px",
                background: isActive ? "linear-gradient(90deg, #A78BFA, #7663A8)" : "rgba(205, 189, 235, 0.35)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: isActive ? "0 0 10px rgba(167, 139, 250, 0.5)" : "none"
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

