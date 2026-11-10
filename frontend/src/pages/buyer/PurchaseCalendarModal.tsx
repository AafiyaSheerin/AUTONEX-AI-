import React, { useState, useEffect, useRef, useCallback } from "react";
import PurchaseCalendar from "./PurchaseCalendar";
import {
  BuyerPurchase,
  BryntumCalendarEvent,
  BuyerPurchaseCalendarResponse
} from "./purchaseCalendarTypes";
import "./PurchaseCalendar.css";

interface PurchaseCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  API_URL?: string;
  triggerButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function PurchaseCalendarModal({
  isOpen,
  onClose,
  userEmail = "demo@hermora.com",
  API_URL,
  triggerButtonRef
}: PurchaseCalendarModalProps) {
  const resolvedApiUrl =
    API_URL ||
    import.meta.env.VITE_API_URL ||
    (typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
      ? `http://${window.location.hostname}:8086`
      : "http://127.0.0.1:8086");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<BuyerPurchase[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<BryntumCalendarEvent[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Fetch verified purchase history on modal open
  const fetchPurchaseHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${resolvedApiUrl}/buyer/purchase-calendar`, {
        headers: {
          "X-User-Email": userEmail
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to load purchase history (status ${res.status})`);
      }
      const data: BuyerPurchaseCalendarResponse = await res.json();
      if (data.success) {
        setPurchases(data.purchases || []);
        setCalendarEvents(data.calendar_events || []);
        if (data.purchases && data.purchases.length > 0) {
          setSelectedPurchaseId(data.purchases[0].id);
        } else {
          setSelectedPurchaseId(null);
        }
      } else {
        throw new Error("Unable to parse purchase calendar data.");
      }
    } catch (err: any) {
      setError(err?.message || "Could not retrieve purchase history.");
    } finally {
      setLoading(false);
    }
  }, [resolvedApiUrl, userEmail]);

  useEffect(() => {
    if (isOpen) {
      fetchPurchaseHistory();
      // Focus modal on open
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    } else {
      // Return focus to trigger button upon close
      triggerButtonRef?.current?.focus();
    }
  }, [isOpen, fetchPurchaseHistory, triggerButtonRef]);

  // Keyboard accessibility: Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside listener
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const selectedPurchase = purchases.find((p) => p.id === selectedPurchaseId);
  const orderedDateDisplay = selectedPurchase?.date
    ? new Date(selectedPurchase.date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : selectedPurchase?.timestamp
    ? new Date(selectedPurchase.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : null;

  if (!isOpen) return null;

  return (
    <div
      className="purchase-calendar-backdrop"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="purchase-calendar-dialog"
        tabIndex={-1}
        aria-labelledby="purchase-calendar-heading"
      >
        {/* Header Bar */}
        <div className="purchase-calendar-header">
          <div className="purchase-calendar-title-wrap">
            <h2 id="purchase-calendar-heading" className="purchase-calendar-title">
              Purchase Calendar
            </h2>
            <p className="purchase-calendar-subtitle">
              How often your agent buys, and what the policy decided.
            </p>
          </div>

          <div className="purchase-calendar-header-actions">
            {/* Ordered Date Badge (Clean high-contrast replacement for counter) */}
            <div className="purchase-calendar-counter-badge">
              <span className="counter-dot" />
              <span>ORDERED DATE: {orderedDateDisplay || "None Selected"}</span>
            </div>

            {/* Close Button (X) */}
            <button
              type="button"
              className="purchase-calendar-close-btn"
              onClick={onClose}
              aria-label="Close Purchase Calendar Modal"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content / Loading / Error */}
        {loading ? (
          <div className="pcal-state-center">
            <div className="pcal-spinner" />
            <p className="pcal-empty-text">Loading verified purchase history...</p>
          </div>
        ) : error ? (
          <div className="pcal-state-center">
            <p style={{ color: "#D32F2F", fontWeight: 700, margin: 0 }}>
              {error}
            </p>
            <button
              type="button"
              className="pcal-retry-btn"
              onClick={fetchPurchaseHistory}
            >
              ↻ Retry
            </button>
          </div>
        ) : (
          <PurchaseCalendar
            purchases={purchases}
            calendarEvents={calendarEvents}
            selectedPurchaseId={selectedPurchaseId}
            onSelectPurchase={(id) => setSelectedPurchaseId(id)}
          />
        )}
      </div>
    </div>
  );
}

