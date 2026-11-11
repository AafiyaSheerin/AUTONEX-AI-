import React, { useRef, useEffect, useState, useCallback } from "react";
import { BryntumCalendar } from "@bryntum/calendar-react-thin";
import { BuyerPurchase, BryntumCalendarEvent } from "./purchaseCalendarTypes";

// Base Bryntum thin styles
import "@bryntum/core-thin/core.css";
import "@bryntum/grid-thin/grid.css";
import "@bryntum/calendar-thin/calendar.css";
import "@bryntum/core-thin/svalbard-light.css";
import "./PurchaseCalendar.css";

interface PurchaseCalendarProps {
  purchases: BuyerPurchase[];
  calendarEvents: BryntumCalendarEvent[];
  selectedPurchaseId: string | null;
  onSelectPurchase: (id: string) => void;
}

export default function PurchaseCalendar({
  purchases,
  calendarEvents,
  selectedPurchaseId,
  onSelectPurchase
}: PurchaseCalendarProps) {
  const calendarRef = useRef<any>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [mobileView, setMobileView] = useState<"list" | "calendar">("list");

  // When selection changes, scroll the card into view smoothly
  useEffect(() => {
    if (selectedPurchaseId && cardRefs.current[selectedPurchaseId]) {
      cardRefs.current[selectedPurchaseId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [selectedPurchaseId]);

  // Highlight the calendar date cell corresponding to the selected purchase
  useEffect(() => {
    const updateHighlight = () => {
      const rootEl = calendarRef.current?.instance?.element || document.querySelector(".bryntum-buyer-calendar-container");
      if (!rootEl) return;

      // Clear previous date highlights
      rootEl.querySelectorAll(".b-selected-order-date").forEach((el: Element) => {
        el.classList.remove("b-selected-order-date");
      });

      if (!selectedPurchaseId) return;

      const purchase = purchases.find((p) => p.id === selectedPurchaseId);
      if (!purchase) return;

      const targetDateStr = purchase.date || (purchase.timestamp ? purchase.timestamp.slice(0, 10) : "");
      if (!targetDateStr) return;

      // Match cell by data-date or cell date attributes
      const cell = rootEl.querySelector(`[data-date="${targetDateStr}"]`);
      if (cell) {
        cell.classList.add("b-selected-order-date");
      }
    };

    updateHighlight();
    const timer = setTimeout(updateHighlight, 100);
    return () => clearTimeout(timer);
  }, [selectedPurchaseId, purchases]);

  // Allow clicking on any date cell directly in the calendar to highlight matching order
  useEffect(() => {
    const rootEl = calendarRef.current?.instance?.element || document.querySelector(".bryntum-buyer-calendar-container");
    if (!rootEl) return;

    const handleDateClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cell = target.closest("[data-date]") as HTMLElement;
      if (cell) {
        const cellDate = cell.getAttribute("data-date");
        if (cellDate) {
          const match = purchases.find(
            (p) => p.date === cellDate || (p.timestamp && p.timestamp.slice(0, 10) === cellDate)
          );
          if (match) {
            onSelectPurchase(match.id);
          }
        }
      }
    };

    rootEl.addEventListener("click", handleDateClick);
    return () => rootEl.removeEventListener("click", handleDateClick);
  }, [purchases, onSelectPurchase]);

  // Handle clicking on an order card on the left
  const handleCardClick = useCallback((id: string, timestamp: string) => {
    onSelectPurchase(id);
    if (calendarRef.current?.instance) {
      try {
        const cal = calendarRef.current.instance;
        if (timestamp) {
          const targetDate = new Date(timestamp);
          if (!isNaN(targetDate.getTime())) {
            cal.date = targetDate;
          }
        }
        // Highlight/select the event in the calendar
        const eventRecord = cal.eventStore.getById(id);
        if (eventRecord) {
          cal.selectedEvents = [eventRecord];
        }
      } catch (err) {
        console.warn("Calendar navigation warning:", err);
      }
    }
  }, [onSelectPurchase]);

  // Handle event selection on the Bryntum Calendar
  const handleCalendarSelectionChange = useCallback((event: any) => {
    const selected = event.selected || event.eventRecords || [];
    if (selected.length > 0) {
      const eventId = String(selected[0].id);
      onSelectPurchase(eventId);
    }
  }, [onSelectPurchase]);

  return (
    <div className="purchase-calendar-body">
      {/* Mobile view toggle for < 900px */}
      <div className="purchase-calendar-mobile-nav">
        <button
          type="button"
          className={`purchase-calendar-mobile-btn ${mobileView === "list" ? "active" : ""}`}
          onClick={() => setMobileView("list")}
        >
          Order History ({purchases.length})
        </button>
        <button
          type="button"
          className={`purchase-calendar-mobile-btn ${mobileView === "calendar" ? "active" : ""}`}
          onClick={() => setMobileView("calendar")}
        >
          Calendar View
        </button>
      </div>

      {/* =========================================================================
          LEFT PANEL: ORDER HISTORY (35%)
          NOTE: NO dates or timestamps rendered here, strictly Delivery Date ALONE.
          ========================================================================= */}
      <div className={`order-history-panel ${mobileView === "list" ? "mobile-visible" : ""}`}>
        <div className="order-history-panel-header">
          <span className="order-history-panel-title">Order History</span>
          <span style={{ fontSize: "0.76rem", color: "#6A5E82", fontWeight: 700 }}>
            {purchases.length} Verified Orders
          </span>
        </div>

        <div className="order-history-list">
          {purchases.length === 0 ? (
            <div className="pcal-state-center">
              <p className="pcal-empty-text">No purchases yet.</p>
            </div>
          ) : (
            purchases.map((purchase) => {
              const isSelected = selectedPurchaseId === purchase.id;
              return (
                <div
                  key={purchase.id}
                  ref={(el) => { cardRefs.current[purchase.id] = el; }}
                  className={`order-history-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleCardClick(purchase.id, purchase.timestamp)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleCardClick(purchase.id, purchase.timestamp);
                    }
                  }}
                >
                  {/* Real Product Image (64x64px) */}
                  <div className="order-card-img-wrap">
                    <img
                      src={purchase.product_image_url}
                      alt={purchase.product_name}
                      className="order-card-img"
                      onError={(e) => {
                        // Neutral luxury placeholder if remote image fails
                        e.currentTarget.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80";
                      }}
                    />
                  </div>

                  {/* Card Details */}
                  <div className="order-card-details">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {/* Short clean Order ID sent to merchant */}
                      <span className="order-card-id-pill">
                        #{purchase.order_id}
                      </span>
                    </div>

                    <h4 className="order-card-product-name">
                      {purchase.product_name}
                    </h4>

                    <div className="order-card-meta-line">
                      <span className="order-card-merchant">
                        {purchase.merchant}
                      </span>
                      <span className="order-card-amount">
                        ${purchase.amount.toFixed(2)} {purchase.currency}
                      </span>
                    </div>

                    {/* Real Delivery Address */}
                    <div
                      className="order-card-address"
                      title={
                        typeof purchase.delivery_address === "string"
                          ? purchase.delivery_address
                          : (purchase.delivery_address as any)?.full_address || "Standard Delivery Destination"
                      }
                    >
                      <span>📍</span>
                      <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {typeof purchase.delivery_address === "string"
                          ? purchase.delivery_address
                          : (purchase.delivery_address as any)?.full_address || "Standard Delivery Destination"}
                      </span>
                    </div>

                    {/* Delivery Date ALONE (Updated dynamically if merchant cascades a delay) */}
                    <div
                      className="order-card-delivery-date"
                      style={{
                        color: (purchase as any).delay_days ? "#B45309" : "#047857"
                      }}
                    >
                      <span>📦</span>
                      <span>
                        Delivery: {purchase.delivery_date}
                        {(purchase as any).delay_notice && (
                          <span
                            style={{
                              marginLeft: "6px",
                              fontSize: "0.72rem",
                              background: "#FEF3C7",
                              color: "#B45309",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              fontWeight: 800,
                              border: "1px solid #FCD34D"
                            }}
                          >
                            ⚠️ {(purchase as any).delay_notice}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: BRYNTUM CALENDAR (65%)
          Month view only, read-only, events display ONLY the amount ($68.00).
          ========================================================================= */}
      <div className={`calendar-panel ${mobileView === "calendar" ? "mobile-visible" : ""}`}>
        <div className="calendar-panel-header">
          <span className="calendar-panel-title">Purchase Calendar</span>
          <span className="calendar-panel-hint">
            Click an amount to inspect the matching order
          </span>
        </div>

        <div className="bryntum-buyer-calendar-container">
          <BryntumCalendar
            ref={calendarRef}
            events={calendarEvents}
            date={
              purchases.length > 0 && purchases[0].timestamp
                ? new Date(purchases[0].timestamp)
                : new Date()
            }
            readOnly={true}
            modes={{
              month: true,
              year: false,
              week: false,
              day: false,
              agenda: false
            }}
            features={{
              eventEdit: false,
              eventDrag: false,
              eventResize: false,
              eventTooltip: {
                // Event tooltip provides clean inspection
                template: ({ eventRecord }: any) => `
                  <div style="padding: 6px; font-family: Outfit, sans-serif;">
                    <div style="font-weight: 800; font-size: 1rem; color: #181226; margin-bottom: 4px;">
                      ${eventRecord.name}
                    </div>
                    <div style="font-size: 0.8rem; color: #5B4B8A; font-weight: 700;">
                      Order ID: #${eventRecord.orderId || eventRecord.id}
                    </div>
                  </div>
                `
              }
            }}
            onSelectionChange={handleCalendarSelectionChange}
          />
        </div>
      </div>
    </div>
  );
}

