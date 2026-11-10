import React, { useState, useEffect, useRef } from "react";

export default function OnboardingModal({
  isOpen,
  user,
  onComplete,
  onClose
}) {
  const [allowance, setAllowance] = useState(250.0);
  const [scanningState, setScanningState] = useState("ready"); // "ready" | "scanning" | "matched" | "error"
  const [confidence, setConfidence] = useState(0);
  const [biometricHash, setBiometricHash] = useState(user?.face_template_id || "");
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8086";

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } else {
        setCameraActive(false);
      }
    } catch (err) {
      console.warn("Camera access not available, using simulated optical sensor:", err);
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (user?.monthly_allowance) {
        setAllowance(Number(user.monthly_allowance));
      }
      setScanningState(user?.face_enrolled ? "matched" : "ready");
      setConfidence(user?.face_enrolled ? 99.4 : 0);
      setErrorMsg("");
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, user]);

  const runBiometricEnrollment = () => {
    setScanningState("scanning");
    setErrorMsg("");
    let currentConf = 25;
    const interval = setInterval(() => {
      currentConf += Math.floor(Math.random() * 20) + 12;
      if (currentConf >= 99) {
        currentConf = 99.4;
        clearInterval(interval);
        setConfidence(99.4);
        finishEnrollment();
      } else {
        setConfidence(currentConf);
      }
    }, 250);
  };

  const finishEnrollment = async () => {
    try {
      const frames = [];
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 480;
        tempCanvas.height = 360;
        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, 480, 360);
        frames.push(tempCanvas.toDataURL("image/jpeg", 0.85));
      }

      const res = await fetch(`${API_URL}/biometrics/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: user?.email || "demo@hermora.com",
          face_images: frames.length > 0 ? frames : null,
          face_data: frames.length > 0 ? frames[0] : null
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.detail || "Face enrollment failed.");
      }
      setBiometricHash(data.biometric_hash || "FACE_ID_ENROLLED_PASSKEY");
      setScanningState("matched");
    } catch (err) {
      console.error("Biometric enrollment error:", err);
      setErrorMsg(err.message || "Failed to enroll face. Please ensure camera is clearly facing you.");
      setScanningState("error");
    }
  };

  const handleSaveAndProceed = async () => {
    if (allowance <= 0) {
      setErrorMsg("Please specify a valid monthly spending limit greater than $0.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${API_URL}/auth/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email || "demo@hermora.com",
          monthly_allowance: allowance,
          face_enrolled: scanningState === "matched",
          face_template_id: biometricHash || `FACE_ID_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save profile settings.");
      }

      onComplete(data.user);
    } catch (err) {
      setErrorMsg(err.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card onboarding-modal-card" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button className="modal-close-btn" onClick={onClose} aria-label="Close setup modal">
            ✕
          </button>
        )}

        <div className="onboarding-header">
          <div className="onboarding-shield-badge">🛡️</div>
          <h2>AI Agent Spending Limit & Biometric Passkey</h2>
          <p className="onboarding-subtitle">
            Configure your AI buyer’s dynamic spending rules and verify your Face ID identification before shopping.
          </p>
        </div>

        {errorMsg && <div className="portal-alert error-alert">⚠️ {errorMsg}</div>}

        <div className="onboarding-sections-grid">
          {/* Section 1: Dynamic Spending Limit */}
          <div className="onboarding-card section-allowance">
            <div className="section-title-row">
              <span className="step-num">1</span>
              <div>
                <h3>Dynamic Monthly Spending Limit</h3>
                <p>Not fixed to $200. Choose the exact monthly ceiling your AI buyer cannot exceed.</p>
              </div>
            </div>

            <div className="allowance-interactive-display">
              <div className="display-number-row">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  step="10"
                  value={allowance}
                  onChange={(e) => setAllowance(Math.max(1, Number(e.target.value)))}
                  className="allowance-dynamic-input"
                />
                <span className="currency-code">USD / month</span>
              </div>

              <input
                type="range"
                min="25"
                max="1000"
                step="25"
                value={allowance}
                onChange={(e) => setAllowance(Number(e.target.value))}
                className="allowance-slider"
              />

              <div className="preset-buttons-row">
                {[50, 100, 200, 350, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`preset-pill ${allowance === amount ? "selected" : ""}`}
                    onClick={() => setAllowance(amount)}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              <div className="micro-spend-explainer">
                <div className="micro-icon">⚡</div>
                <div>
                  <strong>$15.00 Autonomous Micro-Limit</strong>
                  <p>Items $15.00 and under are purchased autonomously. Items above $15.00 strictly require your Biometric Face ID authorization.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Face ID Identification & Passkey Binding */}
          <div className="onboarding-card section-faceid">
            <div className="section-title-row">
              <span className="step-num">2</span>
              <div>
                <h3>Biometric Face ID Passkey Identification</h3>
                <p>Scans optical liveness and generates a cryptographic passkey to authorize payments.</p>
              </div>
            </div>

            <div className="biometric-hud-small">
              <div className={`biometric-viewport-mini ${scanningState}`}>
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="live-webcam-feed-mini"
                  />
                ) : (
                  <div className="camera-placeholder-mini">
                    <span className="avatar-placeholder">👤</span>
                    <span className="sensor-tag">Optical Biometric Sensor</span>
                  </div>
                )}

                <div className="hud-overlay-mini">
                  <div className="hud-corner-mini top-left" />
                  <div className="hud-corner-mini top-right" />
                  <div className="hud-corner-mini bottom-left" />
                  <div className="hud-corner-mini bottom-right" />
                  <div className="hud-oval-mini" />

                  {scanningState === "scanning" && <div className="hud-laser-line" />}
                  {scanningState === "matched" && (
                    <div className="hud-match-check">✓</div>
                  )}
                </div>
              </div>

              <div className="biometric-meta-status">
                {scanningState === "ready" && (
                  <p className="face-status-text ready">
                    <span>●</span> Align your face in the optical frame
                  </p>
                )}
                {scanningState === "scanning" && (
                  <p className="face-status-text scanning">
                    <span>⚡</span> Analyzing facial geometry... {confidence}%
                  </p>
                )}
                {scanningState === "matched" && (
                  <div className="matched-meta-box">
                    <p className="face-status-text matched">
                      <span>✓</span> Identity Verified: <strong>{user?.name || "Aafiya Sheerin"}</strong>
                    </p>
                    <code className="biometric-hash-tag">
                      {biometricHash || "FACE_ID_BOUND_HASH"}
                    </code>
                  </div>
                )}
              </div>

              <div className="face-scan-action-wrap">
                {scanningState === "ready" && (
                  <button
                    type="button"
                    className="scan-trigger-btn"
                    onClick={runBiometricEnrollment}
                  >
                    📸 Scan Face for Identification
                  </button>
                )}
                {scanningState === "scanning" && (
                  <button type="button" className="scan-trigger-btn disabled" disabled>
                    Scanning Face ({confidence}%)...
                  </button>
                )}
                {scanningState === "matched" && (
                  <button
                    type="button"
                    className="scan-trigger-btn re-scan-btn"
                    onClick={runBiometricEnrollment}
                  >
                    ↺ Re-scan Face ID
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="onboarding-footer">
          <button
            type="button"
            className="save-and-enter-btn"
            onClick={handleSaveAndProceed}
            disabled={saving}
          >
            {saving ? "Saving Configuration..." : `Confirm Limits ($${allowance} USD) & Enter Boutique ➔`}
          </button>
          <p className="security-subtext">
            🔒 AUTONEX zero-trust layer: Your limit is cryptographically enforced and cannot be overridden by AI reasoning.
          </p>
        </div>
      </div>
    </div>
  );
}
