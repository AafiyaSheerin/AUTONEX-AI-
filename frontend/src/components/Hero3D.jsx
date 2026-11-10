import React, { useRef, useEffect, useState, Suspense } from "react";
import * as THREE from "three";

// Fallback component for touch devices, reduced motion, small screens, or when WebGL fails
export function Hero3DFallback({ compact = false }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          width: compact ? "160px" : "280px",
          height: compact ? "160px" : "280px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, rgba(205, 189, 235, 0.8) 0%, rgba(244, 213, 217, 0.6) 50%, rgba(91, 75, 138, 0.25) 100%)",
          boxShadow: "0 20px 50px rgba(91, 75, 138, 0.2), inset 0 0 30px rgba(255, 255, 255, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "floatSlow 4s ease-in-out infinite"
        }}
      >
        <span style={{ fontSize: compact ? "3rem" : "5rem", filter: "drop-shadow(0 8px 16px rgba(91,75,138,0.3))" }}>
          🛡️
        </span>
      </div>
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}

// Full Three.js Canvas Scene (Ultra-lightweight < 1200 triangles, 60fps, no shadow maps)
function ThreeScene({ compact = false }) {
  const mountRef = useRef(null);
  const isVisibleRef = useRef(true);
  const pulseScaleRef = useRef(1.0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = false; // Zero shadow maps as required
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = compact ? 5.2 : 4.4;

    // Lighting (Pastel Studio Light)
    const ambientLight = new THREE.AmbientLight(0xfff9f2, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xcdbdeb, 1.8);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf4d5d9, 1.4);
    fillLight.position.set(-4, -2, 2);
    scene.add(fillLight);

    // Root Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Central Glass Pastel Shield / Orb
    const orbRadius = compact ? 0.9 : 1.1;
    const orbGeo = new THREE.IcosahedronGeometry(orbRadius, 2); // ~320 triangles
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xcdbdeb,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
      wireframe: false
    });
    const centralOrb = new THREE.Mesh(orbGeo, orbMat);
    rootGroup.add(centralOrb);

    // Inner Glowing Core
    const innerGeo = new THREE.IcosahedronGeometry(orbRadius * 0.55, 1);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x5b4b8a,
      roughness: 0.3,
      emissive: 0x3d2d66,
      emissiveIntensity: 0.4
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    centralOrb.add(innerCore);

    // 2. Orbiting Low-Poly Pastel Objects (6 to 8 items)
    const orbitingGroup = new THREE.Group();
    rootGroup.add(orbitingGroup);

    const orbitItems = [];
    const count = compact ? 4 : 7;
    const colors = [0xf4d5d9, 0xcfe3d4, 0xcdbdeb, 0xfff9f2, 0xf7e3b0, 0xa84e5b, 0x5b4b8a];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = orbRadius + 0.85 + (i % 2) * 0.25;
      const yOffset = Math.sin(i * 1.5) * 0.4;

      let geo;
      // Object shapes: Gem (octahedron), Ring (torus), Star sparkle (tetrahedron), Box
      if (i % 4 === 0) {
        geo = new THREE.OctahedronGeometry(0.18, 0); // Gem
      } else if (i % 4 === 1) {
        geo = new THREE.TorusGeometry(0.16, 0.05, 6, 12); // Ring
      } else if (i % 4 === 2) {
        geo = new THREE.TetrahedronGeometry(0.17, 0); // Sparkle
      } else {
        geo = new THREE.BoxGeometry(0.2, 0.22, 0.14); // Mini bag
      }

      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.25,
        metalness: 0.2
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(Math.cos(angle) * dist, yOffset, Math.sin(angle) * dist);
      orbitingGroup.add(mesh);
      orbitItems.push({ mesh, angle, dist, speed: 0.008 + (i % 3) * 0.003, yOffset });
    }

    // Pointer Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.35;
      targetY = y * 0.25;
    };

    // Soft Pulse on Click
    const handleClick = () => {
      pulseScaleRef.current = 1.18;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("click", handleClick);

    // Pause rendering when tab is hidden or offscreen
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let observer;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      });
      observer.observe(container);
    }

    // Animation Loop
    let animationFrameId;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisibleRef.current) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;

      // Idle Rotation
      rootGroup.rotation.y += delta * 0.45;

      // Mouse Parallax Lerp
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;
      rootGroup.rotation.x = mouseY;
      rootGroup.rotation.z = -mouseX * 0.5;

      // Click Pulse Lerp back to 1.0
      if (pulseScaleRef.current > 1.0) {
        pulseScaleRef.current += (1.0 - pulseScaleRef.current) * 0.12;
        centralOrb.scale.setScalar(pulseScaleRef.current);
      }

      // Orbiting Objects Update
      orbitItems.forEach((item) => {
        item.angle += item.speed;
        item.mesh.position.x = Math.cos(item.angle) * item.dist;
        item.mesh.position.z = Math.sin(item.angle) * item.dist;
        item.mesh.rotation.x += 0.02;
        item.mesh.rotation.y += 0.03;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      container.removeEventListener("click", handleClick);
      if (observer) observer.disconnect();
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [compact]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        cursor: "pointer",
        position: "relative"
      }}
    />
  );
}

// Error Boundary Wrapper
class ThreeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn("Hero3D WebGL fallback triggered:", err);
  }
  render() {
    if (this.state.hasError) {
      return <Hero3DFallback compact={this.props.compact} />;
    }
    return this.props.children;
  }
}

export default function Hero3D({ compact = false }) {
  const [shouldRender3D] = useState(() => {
    if (typeof window === "undefined") return false;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const isSmallScreen = window.innerWidth < 768;

    let hasWebGL = false;
    try {
      const canvas = document.createElement("canvas");
      hasWebGL = !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch {
      hasWebGL = false;
    }

    return Boolean(hasWebGL && !prefersReducedMotion && !isCoarse && !isSmallScreen);
  });

  return (
    <ThreeErrorBoundary compact={compact}>
      <Suspense fallback={<Hero3DFallback compact={compact} />}>
        {shouldRender3D ? (
          <ThreeScene compact={compact} />
        ) : (
          <Hero3DFallback compact={compact} />
        )}
      </Suspense>
    </ThreeErrorBoundary>
  );
}
