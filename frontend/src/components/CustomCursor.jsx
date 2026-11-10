import React, { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const glowRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hoverType, setHoverType] = useState("default"); // "default" | "button" | "card" | "text"

  const isDisabled = typeof window !== "undefined" && (
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (isDisabled) return;

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let glowX = -100;
    let glowY = -100;
    let magneticTargetX = null;
    let magneticTargetY = null;
    let animFrameId = null;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) setIsVisible(true);

      // Check if hovering near an interactive element for magnetic pull & morphing
      const target = e.target;
      const interactiveEl = target && (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='button']") ||
        target.closest(".product-card") ||
        target.closest(".nav-link-btn") ||
        target.closest(".category-chip") ||
        target.closest(".interactive-element") ||
        target.closest(".funky-address-tag") ||
        target.closest(".allowance-reset-btn")
      );

      const isText = target && (
        target.closest("p") ||
        target.closest("h1") ||
        target.closest("h2") ||
        target.closest("h3") ||
        target.closest("span.text-selectable") ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) && !interactiveEl;

      if (interactiveEl) {
        setIsHovered(true);
        if (interactiveEl.classList.contains("product-card")) {
          setHoverType("card");
        } else {
          setHoverType("button");
        }

        // Calculate magnetic center
        const rect = interactiveEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dist = Math.hypot(mouseX - centerX, mouseY - centerY);
        if (dist < 120) {
          // Subtle magnetic attraction pull (30% toward center)
          magneticTargetX = mouseX + (centerX - mouseX) * 0.32;
          magneticTargetY = mouseY + (centerY - mouseY) * 0.32;
        } else {
          magneticTargetX = null;
          magneticTargetY = null;
        }
      } else if (isText) {
        setIsHovered(false);
        setHoverType("text");
        magneticTargetX = null;
        magneticTargetY = null;
      } else {
        setIsHovered(false);
        setHoverType("default");
        magneticTargetX = null;
        magneticTargetY = null;
      }
    };

    const onMouseDown = () => setIsClicked(true);
    const onMouseUp = () => setIsClicked(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    // Smooth fluid physics loop with magnetic interpolation
    const render = () => {
      const targetX = magneticTargetX !== null ? magneticTargetX : mouseX;
      const targetY = magneticTargetY !== null ? magneticTargetY : mouseY;

      // Cursor follows mouse with high-responsiveness lerp (0.24)
      currentX += (targetX - currentX) * 0.24;
      currentY += (targetY - currentY) * 0.24;

      // Glow aura follows with slightly softer trailing lag (0.15)
      glowX += (targetX - glowX) * 0.15;
      glowY += (targetY - glowY) * 0.15;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
      }

      animFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    animFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [isDisabled, isVisible]);

  if (isDisabled) return null;

  // Determine morph dimensions based on hover state
  let cursorWidth = 10;
  let cursorHeight = 10;
  let cursorRadius = "50%";
  let cursorBg = "#7663A8";
  let cursorBorder = "1.5px solid rgba(205, 189, 235, 0.9)";
  let cursorShadow = "0 0 14px rgba(118, 99, 168, 0.6)";

  if (isHovered) {
    if (hoverType === "card") {
      cursorWidth = 54;
      cursorHeight = 54;
      cursorRadius = "20px";
      cursorBg = "rgba(118, 99, 168, 0.22)";
      cursorBorder = "1.5px solid rgba(167, 139, 250, 0.85)";
      cursorShadow = "0 0 24px rgba(167, 139, 250, 0.5), inset 0 0 12px rgba(255, 255, 255, 0.3)";
    } else {
      cursorWidth = 44;
      cursorHeight = 44;
      cursorRadius = "50%";
      cursorBg = "rgba(118, 99, 168, 0.25)";
      cursorBorder = "1.5px solid rgba(167, 139, 250, 0.9)";
      cursorShadow = "0 0 22px rgba(118, 99, 168, 0.55), inset 0 0 10px rgba(255, 255, 255, 0.35)";
    }
  } else if (hoverType === "text") {
    cursorWidth = 4;
    cursorHeight = 20;
    cursorRadius = "3px";
    cursorBg = "#5B4B8A";
    cursorBorder = "none";
    cursorShadow = "0 0 8px rgba(91, 75, 138, 0.5)";
  }

  if (isClicked) {
    cursorWidth = Math.max(8, cursorWidth * 0.82);
    cursorHeight = Math.max(8, cursorHeight * 0.82);
  }

  return (
    <>
      {/* Ambient Soft Purple Glow Aura */}
      <div
        ref={glowRef}
        className="custom-cursor-glow"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: isHovered ? "72px" : "36px",
          height: isHovered ? "72px" : "36px",
          marginLeft: isHovered ? "-36px" : "-18px",
          marginTop: isHovered ? "-36px" : "-18px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167, 139, 250, 0.32) 0%, rgba(118, 99, 168, 0.12) 60%, rgba(118, 99, 168, 0) 100%)",
          pointerEvents: "none",
          zIndex: 99999998,
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.25s ease, width 0.3s ease, height 0.3s ease, margin 0.3s ease",
          willChange: "transform"
        }}
      />

      {/* Main Fluid Morphing Cursor Element */}
      <div
        ref={cursorRef}
        className={`custom-morphing-cursor ${isVisible ? "visible" : ""} ${isHovered ? "hovered" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: `${cursorWidth}px`,
          height: `${cursorHeight}px`,
          marginLeft: `-${cursorWidth / 2}px`,
          marginTop: `-${cursorHeight / 2}px`,
          borderRadius: cursorRadius,
          backgroundColor: cursorBg,
          border: cursorBorder,
          boxShadow: cursorShadow,
          backdropFilter: isHovered ? "blur(4px)" : "none",
          WebkitBackdropFilter: isHovered ? "blur(4px)" : "none",
          pointerEvents: "none",
          zIndex: 99999999,
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.2s ease, width 0.24s cubic-bezier(0.16, 1, 0.3, 1), height 0.24s cubic-bezier(0.16, 1, 0.3, 1), margin 0.24s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.24s ease, background-color 0.2s ease, border 0.2s ease, box-shadow 0.2s ease",
          willChange: "transform, width, height"
        }}
      />
    </>
  );
}
