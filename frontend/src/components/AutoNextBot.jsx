import React, { useState, useEffect, useRef } from "react";

export default function AutoNextBot({
  mode = "interactive", // "interactive" | "background" | "mini"
  size,
  className = ""
}) {
  const isMini = mode === "mini";
  const isBackground = mode === "background";

  const defaultSize = isMini ? 34 : isBackground ? 220 : 180;
  const dimension = size || defaultSize;

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [bubbleText, setBubbleText] = useState("AUTONEX AI: Zero-Trust Active 🛡️");
  const botRef = useRef(null);

  // Subtle 3D tilt tracking user's cursor
  useEffect(() => {
    if (isMini || typeof window === "undefined") return;

    let animId = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e) => {
      if (!botRef.current) return;
      const rect = botRef.current.getBoundingClientRect();
      const botCenterX = rect.left + rect.width / 2;
      const botCenterY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - botCenterX) / window.innerWidth;
      const deltaY = (e.clientY - botCenterY) / window.innerHeight;

      // Limit angle to subtle natural tilt (-14 to +14 deg)
      targetX = Math.max(-14, Math.min(14, deltaX * 28));
      targetY = Math.max(-10, Math.min(10, deltaY * 20));
    };

    const updateTilt = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      setMousePos({ x: currentX, y: currentY });
      animId = requestAnimationFrame(updateTilt);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    animId = requestAnimationFrame(updateTilt);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isMini]);

  const greetings = [
    "AUTONEX AI: Zero-Trust Active 🛡️",
    "All PIN Verifications Secure 🔐",
    "Ready to Assist Shopping 🛍️",
    "PayPal Sandbox Connected 💳",
    "Boutique Trust Invariant: 100% ✨"
  ];

  const handleBotClick = () => {
    setIsWinking(true);
    const nextGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    setBubbleText(nextGreeting);
    setTimeout(() => setIsWinking(false), 800);
  };

  return (
    <div
      ref={botRef}
      className={`hermora-bot-root ${isMini ? "mode-mini" : isBackground ? "mode-background" : "mode-interactive"} ${className}`}
      style={{
        width: isMini ? 32 : dimension,
        height: isMini ? 32 : dimension + (isBackground ? 0 : 36),
        maxWidth: isMini ? 32 : undefined,
        maxHeight: isMini ? 32 : undefined,
        overflow: isMini ? "hidden" : "visible",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        perspective: isMini ? "none" : 800,
        cursor: isMini || isBackground ? "default" : "pointer"
      }}
      onClick={!isMini && !isBackground ? handleBotClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={isMini ? "AUTONEX AI Assistant" : "Click me to interact with AUTONEX AI!"}
    >
      {/* Interactive Speech Bubble Badge */}
      {!isMini && !isBackground && (
        <div
          className="bot-speech-bubble"
          style={{
            background: "rgba(36, 31, 58, 0.92)",
            color: "#F5F0FF",
            border: "1px solid rgba(205, 189, 235, 0.35)",
            borderRadius: 14,
            padding: "5px 12px",
            fontSize: "0.74rem",
            fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: "0.02em",
            boxShadow: "0 6px 18px rgba(36, 31, 58, 0.2)",
            marginBottom: 8,
            whiteSpace: "nowrap",
            transition: "all 0.25s ease",
            transform: isHovered ? "scale(1.05) translateY(-2px)" : "scale(1)",
            pointerEvents: "none"
          }}
        >
          {bubbleText}
        </div>
      )}

      {/* Main Bot SVG Container with 3D Tilt */}
      <div
        className="bot-body-tilt"
        style={{
          width: isMini ? 32 : dimension,
          height: isMini ? 32 : dimension,
          maxWidth: isMini ? 32 : undefined,
          maxHeight: isMini ? 32 : undefined,
          transform: isMini
            ? "none"
            : `rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
          transformStyle: "preserve-3d",
          transition: isMini ? "none" : "transform 0.08s ease-out"
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 180 180"
          fill="none"
          shapeRendering="auto"
          width={isMini ? 32 : "100%"}
          height={isMini ? 32 : "100%"}
          style={isMini ? { width: 32, height: 32, maxWidth: 32, maxHeight: 32, display: "block" } : undefined}
          className="hermora-bot-svg"
        >
          <defs>
            <filter id="bulbGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="headShineGrad" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00897B" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F4D5D9" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#F4D5D9" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g className="bot-float-container">
            {/* Side Ears / Antennae Ports */}
            <g transform="translate(0 66)">
              <mask id="sidesMask" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="10" y="8" width="165" height="60">
                <g fill="#fff">
                  <rect x="10" y="31" width="36" height="30" rx="4" />
                  <rect x="20" y="15" width="26" height="30" rx="4" />
                  <rect x="139" y="23" width="36" height="30" rx="4" />
                  <rect x="134" y="8" width="36" height="60" rx="4" />
                </g>
              </mask>
              <g mask="url(#sidesMask)">
                <path d="M0 0h180v76H0V0Z" fill="#00897b" />
                <path d="M0 0h180v76H0V0Z" fill="#fff" fillOpacity=".3" />
                <path fill="#000" fillOpacity=".12" d="M0 47h180v29H0z" />
                <circle cx="161" cy="20" r="5" fill="#fff" fillOpacity=".7" />
                <circle cx="161" cy="36" r="5" fill="#fff" fillOpacity=".7" />
              </g>
            </g>

            {/* Top Lightbulb with Animated Glowing Filament */}
            <g transform="translate(41)">
              <mask id="topBulbMask" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="22" y="0" width="56" height="52">
                <g fill="#fff">
                  <path fillRule="evenodd" clipRule="evenodd" d="M32 16A16 16 0 0 1 48 0h4a16 16 0 0 1 16 16v16a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V16Z" />
                  <rect x="22" y="40" width="56" height="12" rx="1" />
                </g>
              </mask>
              <g mask="url(#topBulbMask)">
                <path d="M0 0h100v52H0V0Z" fill="#00897b" />
                <path d="M0 0h100v52H0V0Z" fill="#fff" fillOpacity=".35" />
                <path fill="#fff" fillOpacity=".4" d="M20-3h60v43H20z" />
                <path d="M49 3.5c4.93 0 9.37 2.13 12.44 5.52" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                {/* Glowing Filament with Bloom */}
                <path
                  className="bot-glowing-filament"
                  d="m49.83 26-9-9L38 19.83l10 10V40h4V29.97l10.14-10.14L59.31 17l-9 9h-.48Z"
                  fill="#FFF4D0"
                  filter="url(#bulbGlowFilter)"
                />
              </g>
            </g>

            {/* Main Rounded Teal Head */}
            <g transform="translate(25 44)">
              <mask id="headMask" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="0" y="0" width="130" height="120">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0 18A18 18 0 0 1 18 0h94a18 18 0 0 1 18 18v27.15a40 40 0 0 1-2.28 13.31L110.24 108a18 18 0 0 1-16.98 12H36.74a18 18 0 0 1-16.98-12L2.28 58.45A40 40 0 0 1 0 45.15V18Z"
                  fill="#fff"
                />
              </mask>
              <g mask="url(#headMask)">
                <path d="M-2-2h134v124H-2V-2Z" fill="#00897b" />
                {/* 3D Curvature Sheen */}
                <rect x="0" y="0" width="130" height="120" fill="url(#headShineGrad)" />
                <path d="M0 0h130v26H0z" fill="#ffffff" fillOpacity="0.12" />
              </g>
            </g>

            {/* Cheerful Blushing Cheeks */}
            <g>
              <ellipse cx="53" cy="132" rx="10" ry="6" fill="url(#blushGrad)" className="bot-blush-left" />
              <ellipse cx="127" cy="132" rx="10" ry="6" fill="url(#blushGrad)" className="bot-blush-right" />
            </g>

            {/* Happy Animated Smiling Mouth */}
            <g className="bot-smiling-mouth">
              <path
                d="M79.05 132.44a2 2 0 1 1 3.9-.88C83.72 134.96 86.4 137 90 137c3.6 0 6.28-2.04 7.05-5.44a2 2 0 1 1 3.9.88C99.75 137.7 95.43 141 90 141s-9.76-3.3-10.95-8.56Z"
                fill="#14252B"
              />
            </g>

            {/* Fixed Eyebrows on Forehead */}
            <g className="bot-eyebrows">
              <path d="M56 95L68 93" stroke="#14252B" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M124 96L112 93" stroke="#14252B" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Smooth Animated Blinking & Winking Eyes */}
            <g className={isWinking ? "bot-winking-eye" : "bot-blinking-eyes"}>
              {/* Left Eye */}
              <path d="M58 107c0-3.31 2.9-6 7-6 3.1 0 6 2.69 6 6" stroke="#14252B" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

              {/* Right Eye (Winks on click!) */}
              {isWinking ? (
                <path d="M110 107h14" stroke="#14252B" strokeWidth="5" strokeLinecap="round" />
              ) : (
                <path d="M122 107c0-3.31-2.9-6-6-6-4.1 0-7 2.69-7 6" stroke="#14252B" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* Gentle Floating Shadow Pedestal */}
      {!isMini && (
        <div
          className="bot-shadow-pedestal"
          style={{
            width: dimension * 0.55,
            height: 10,
            borderRadius: "50%",
            background: "radial-gradient(ellipse at center, rgba(36, 31, 58, 0.15) 0%, rgba(36, 31, 58, 0) 70%)",
            marginTop: 4,
            transition: "all 0.3s ease"
          }}
        />
      )}
    </div>
  );
}
