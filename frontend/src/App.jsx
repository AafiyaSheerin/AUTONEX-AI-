import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Storefront from "./components/Storefront";
import AuthPortal from "./components/AuthPortal";
import OnboardingModal from "./components/OnboardingModal";
import FaceIdModal from "./components/FaceIdModal";
import AgentDrawer from "./components/AgentDrawer";
import ReceiptModal from "./components/ReceiptModal";
import BiometricSecurityPage from "./components/BiometricSecurityPage";
import MerchantDashboard from "./components/MerchantDashboard";
import CustomCursor from "./components/CustomCursor";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? `http://${window.location.hostname}:8086`
    : "http://127.0.0.1:8086");

export default function App() {
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const saved = localStorage.getItem("hermora_active_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.role === "merchant") return "merchant";
      }
      return "client";
    } catch {
      return "client";
    }
  });
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem("hermora_active_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.role === "merchant") return "merchant";
      }
      return "store";
    } catch {
      return "store";
    }
  });
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [faceIdModalOpen, setFaceIdModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Initialize user from localStorage if previously signed in
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("hermora_active_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [requestText, setRequestText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [result, setResult] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    async function syncUser() {
      if (!user?.email) return;
      try {
        const res = await fetch(`${API_URL}/auth/me?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("hermora_active_user", JSON.stringify(data.user));
          if (data.user.role === "merchant") {
            setCurrentRole("merchant");
            setActiveTab("merchant");
          } else {
            setCurrentRole("client");
          }
        }
      } catch (err) {
        console.warn("Could not sync user state, using local cached user:", err);
      }
    }
    syncUser();
  }, [user?.email]);

  const handleAuthSuccess = (authenticatedUser, shouldOpenOnboarding = false) => {
    setUser(authenticatedUser);
    localStorage.setItem("hermora_active_user", JSON.stringify(authenticatedUser));
    setError("");
    setPaymentMessage("");
    if (authenticatedUser.role === "merchant") {
      setCurrentRole("merchant");
      setActiveTab("merchant");
    } else {
      setCurrentRole("client");
      setActiveTab("store");
      // If new registration, Google signup, or uncalibrated limits, open dedicated Biometric Security Page!
      if (shouldOpenOnboarding || !authenticatedUser.biometric_locked) {
        setActiveTab("security");
      }
    }
  };

  const handleOnboardingComplete = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("hermora_active_user", JSON.stringify(updatedUser));
    setOnboardingModalOpen(false);
    setPaymentMessage(`✓ AI Delegated Spending Cap set to $${updatedUser.monthly_allowance.toFixed(2)} USD. Security PIN configured.`);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentRole("client");
    setActiveTab("store");
    localStorage.removeItem("hermora_active_user");
    setResult(null);
    setError("");
    setPaymentMessage("");
  };

  const handleStartCheckout = async (customPrompt) => {
    const promptToRun = customPrompt || requestText;
    if (!promptToRun || !promptToRun.trim()) {
      setError("Please describe what product you want your AI buyer to find.");
      return;
    }

    setLoading(true);
    setError("");
    setPaymentMessage("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_request: promptToRun,
          user_email: user?.email || "demo@hermora.com"
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.detail || "AUTONEX could not process this request.");
      }

      setResult(data);
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to process shopping mission.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskAiToBuy = (product) => {
    const priceUsd = Math.ceil(Number(product.price));
    const missionPrompt = `Find me ${product.name} under $${priceUsd + 5} delivered within ${product.delivery_days} days. Quality is most important.`;
    setRequestText(missionPrompt);
    setAgentDrawerOpen(true);
    handleStartCheckout(missionPrompt);
  };

  const handleFaceVerificationSuccess = (data) => {
    if (result && result.transaction) {
      setResult((prev) => ({
        ...prev,
        transaction: {
          ...prev.transaction,
          ...data.transaction,
          face_verified: true,
          status: "READY_FOR_PAYMENT"
        }
      }));
    }
    setPaymentMessage("✓ Security PIN verified! PayPal Checkout unlocked.");
  };

  const handlePaymentSuccess = (verifyData) => {
    if (verifyData.transaction) {
      setResult((prev) => ({
        ...prev,
        transaction: verifyData.transaction
      }));
    }

    if (verifyData.remaining_allowance !== undefined) {
      setUser((prev) => {
        const next = {
          ...prev,
          monthly_remaining: verifyData.remaining_allowance
        };
        localStorage.setItem("hermora_active_user", JSON.stringify(next));
        return next;
      });
    }

    setPaymentMessage(
      `✓ PayPal Sandbox payment captured! Capture ID: ${verifyData.payment_id}. Deducted from your $${user?.monthly_allowance ? user.monthly_allowance.toFixed(2) : "150.00"} allowance.`
    );
  };

  const handleResetAllowance = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_URL}/auth/allowance/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("hermora_active_user", JSON.stringify(data.user));
        setPaymentMessage(`✓ Monthly allowance restored to full $${data.user.monthly_allowance.toFixed(2)} USD.`);
      }
    } catch (err) {
      console.warn("Error resetting allowance:", err);
    }
  };

  const handleSimulateMonthAdvance = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_URL}/auth/allowance/simulate-month-advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem("hermora_active_user", JSON.stringify(data.user));
        setPaymentMessage(data.message || `✓ Calendar advanced by 1 month. Allowance automatically revived to $${data.user.monthly_allowance.toFixed(2)} USD!`);
      }
    } catch (err) {
      console.warn("Error simulating month advance:", err);
    }
  };

  const handleViewReceipt = async () => {
    if (result?.receipt) {
      setReceiptData(result.receipt);
      setReceiptModalOpen(true);
      return;
    }
    const txId = result?.transaction_id || result?.transaction?.transaction_id || result?.transaction?.id || "latest";
    try {
      const res = await fetch(`${API_URL}/transactions/${txId}/receipt`);
      const data = await res.json();
      if (data.receipt) {
        setReceiptData(data.receipt);
        setReceiptModalOpen(true);
      } else {
        throw new Error(data.detail || "Receipt unavailable");
      }
    } catch (err) {
      console.warn("View receipt error:", err);
      setError("Could not load decision receipt.");
    }
  };

  const handleSaveAddress = async (addressData) => {
    try {
      const res = await fetch(`${API_URL}/auth/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email || "demo@hermora.com",
          username: addressData.recipient_name,
          recipient_name: addressData.recipient_name,
          street: addressData.street,
          city: addressData.city,
          country: addressData.country,
          phone: addressData.phone
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem("hermora_active_user", JSON.stringify(data.user));
        setPaymentMessage(`✓ Delivery destination saved: ${addressData.recipient_name} • ${addressData.street}`);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Error saving address:", err);
      return false;
    }
  };

  // Scroll reveal IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [activeTab, user]);

  // If user is not logged in, display the dedicated full-page Luxury Authentication Portal
  if (!user) {
    return (
      <div className="hermora-app-root">
        <CustomCursor />
        <AuthPortal onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="hermora-app-root">
      <CustomCursor />
      <Navbar
        user={user}
        onOpenAuth={() => handleLogout()}
        onLogout={handleLogout}
        onOpenAgent={() => setAgentDrawerOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetAllowance={handleResetAllowance}
        onOpenSetup={() => setActiveTab("security")}
        onSimulateMonthAdvance={handleSimulateMonthAdvance}
        currentRole={currentRole}
        onSaveAddress={handleSaveAddress}
        onUserUpdated={(newUser) => setUser(newUser)}
      />

      <main className="hermora-main-content">
        {currentRole === "merchant" || activeTab === "merchant" ? (
          <MerchantDashboard
            user={user}
            onLogout={handleLogout}
          />
        ) : activeTab === "security" ? (
          <BiometricSecurityPage
            user={user}
            onUserUpdated={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem("hermora_active_user", JSON.stringify(updatedUser));
              setPaymentMessage(`✓ Spending limit updated to $${updatedUser.monthly_allowance.toFixed(2)} USD (Guarded by Security PIN).`);
            }}
            onBackToStore={() => setActiveTab("store")}
            onOpenAgent={() => setAgentDrawerOpen(true)}
          />
        ) : (
          <Storefront
            onAskAiToBuy={handleAskAiToBuy}
            onOpenAgent={() => setAgentDrawerOpen(true)}
            onOpenSecurityPage={() => setActiveTab("security")}
            user={user}
          />
        )}
      </main>

      <AgentDrawer
        isOpen={agentDrawerOpen}
        onClose={() => setAgentDrawerOpen(false)}
        requestText={requestText}
        setRequestText={setRequestText}
        loading={loading}
        error={error}
        result={result}
        paymentMessage={paymentMessage}
        onStartCheckout={() => handleStartCheckout()}
        onOpenFaceId={() => setFaceIdModalOpen(true)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={(msg) => setError(msg)}
        onViewReceipt={handleViewReceipt}
        user={user}
      />

      <OnboardingModal
        isOpen={onboardingModalOpen}
        user={user}
        onComplete={handleOnboardingComplete}
        onClose={() => setOnboardingModalOpen(false)}
      />

      <FaceIdModal
        isOpen={faceIdModalOpen}
        onClose={() => setFaceIdModalOpen(false)}
        transaction={result?.transaction}
        user={user}
        onVerificationSuccess={handleFaceVerificationSuccess}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receipt={receiptData}
      />
    </div>
  );
}