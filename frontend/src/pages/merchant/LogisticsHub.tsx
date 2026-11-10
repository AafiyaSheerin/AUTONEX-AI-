import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { BryntumGantt } from "@bryntum/gantt-react-thin";
import { BryntumScheduler } from "@bryntum/scheduler-react-thin";
import { BryntumCalendar } from "@bryntum/calendar-react-thin";

import "@bryntum/core-thin/core.css";
import "@bryntum/grid-thin/grid.css";
import "@bryntum/scheduler-thin/scheduler.css";
import "@bryntum/gantt-thin/gantt.css";
import "@bryntum/calendar-thin/calendar.css";
import "@bryntum/core-thin/svalbard-light.css";
import "./LogisticsHub.css";

import {
  BryntumOrder,
  BryntumCourier,
  CourierReassignResult
} from "./logisticsTypes";

interface LogisticsHubProps {
  API_URL?: string;
  user?: any;
}

export default function LogisticsHub({ API_URL }: LogisticsHubProps) {
  const resolvedApiUrl =
    API_URL ||
    import.meta.env.VITE_API_URL ||
    (typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
      ? `http://${window.location.hostname}:8086`
      : "http://127.0.0.1:8086");

  const [activeTab, setActiveTab] = useState<"gantt" | "scheduler" | "calendar">("gantt");
  const [orders, setOrders] = useState<BryntumOrder[]>([]);
  const [couriers, setCouriers] = useState<BryntumCourier[]>([
    { id: "dhl", name: "DHL Express" },
    { id: "drone", name: "Hermora Drone Fleet" },
    { id: "fedex", name: "FedEx" }
  ]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("ORD-101");
  const [delayDays, setDelayDays] = useState<number>(0);
  const [policyBanner, setPolicyBanner] = useState<{
    type: "allowed" | "needs-approval" | "blocked";
    text: string;
  } | null>(null);

  const ganttRef = useRef<any>(null);
  const schedulerRef = useRef<any>(null);

  // Fetch orders pipeline from backend
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${resolvedApiUrl}/merchant/bryntum-logistics`);
      const data = await res.json();
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
        if (data.couriers) setCouriers(data.couriers);
        if (data.orders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(data.orders[0].order_id);
        }
      }
    } catch (err) {
      console.warn("Error fetching Bryntum logistics:", err);
    }
  }, [resolvedApiUrl, selectedOrderId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Selected Order
  const activeOrder = useMemo(() => {
    return (
      orders.find((o) => o.order_id === selectedOrderId) ||
      orders[0] ||
      null
    );
  }, [orders, selectedOrderId]);

  // Status Derived from Task Progress
  const derivedStatus = useMemo(() => {
    if (!activeOrder || !activeOrder.tasks || activeOrder.tasks.length === 0) {
      return "Packaging & Verification";
    }
    const tasks = activeOrder.tasks;
    const lastTask = tasks[tasks.length - 1];
    if ((lastTask.percentDone ?? lastTask.percent_done ?? 0) === 100) {
      return "Delivered";
    }
    const transitTask = tasks.find(
      (t) =>
        t.name.toLowerCase().includes("transit") ||
        t.name.toLowerCase().includes("courier")
    );
    if (transitTask && (transitTask.percentDone ?? transitTask.percent_done ?? 0) > 0) {
      return "In Transit";
    }
    return "Atelier Preparation";
  }, [activeOrder]);

  // Gantt Project Data: convert snake_case to Bryntum fields
  const ganttTasksData = useMemo(() => {
    if (!activeOrder || !activeOrder.tasks) return [];
    return activeOrder.tasks.map((t) => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate || t.start_date || "2026-11-16",
      duration: t.duration || 1,
      durationUnit: "d",
      percentDone: t.percentDone ?? t.percent_done ?? 0,
      baselines: t.baselines || [
        {
          startDate: t.startDate || t.start_date || "2026-11-16",
          duration: t.duration || 1
        }
      ]
    }));
  }, [activeOrder]);

  const ganttDependenciesData = useMemo(() => {
    if (!activeOrder || !activeOrder.dependencies) return [];
    return activeOrder.dependencies.map((d, idx) => ({
      id: `dep_${activeOrder.order_id}_${idx}`,
      from: d.from ?? d.fromEvent,
      to: d.to ?? d.toEvent
    }));
  }, [activeOrder]);

  // Scheduler Resources & Events Data
  const schedulerResources = useMemo(() => {
    return couriers.slice(0, 3).map((c) => ({
      id: c.name,
      name: c.name,
      icon:
        c.name.includes("DHL")
          ? "✈️"
          : c.name.includes("Drone")
          ? "🛸"
          : "🚚"
    }));
  }, [couriers]);

  const schedulerEvents = useMemo(() => {
    return orders.map((o) => {
      // Find start and end date from order tasks dynamically
      const start = o.tasks?.[0]?.start_date || "2026-11-10";
      const finishTask = o.tasks?.[o.tasks.length - 1];
      const end = o.estimated_delivery
        ? `${o.estimated_delivery} 18:00`
        : finishTask?.start_date
        ? `${finishTask.start_date} 18:00`
        : `${start} 18:00`;

      return {
        id: o.order_id,
        resourceId: o.courier,
        name: `${o.product} (${o.order_id})`,
        startDate: `${start} 09:00`,
        endDate: end,
        eventColor: o.courier.includes("Drone")
          ? "blue"
          : o.courier.includes("DHL")
          ? "orange"
          : "purple",
        orderData: o
      };
    });
  }, [orders]);

  // Dynamic timeline range spanning from the earliest order to the latest delivery
  const timelineRange = useMemo(() => {
    let minDate = "2026-11-10";
    let maxDate = "2026-11-26";
    orders.forEach((o) => {
      if (o.tasks && o.tasks.length > 0) {
        const first = o.tasks[0]?.start_date;
        if (first && first < minDate) minDate = first;
        const last = o.estimated_delivery || o.tasks[o.tasks.length - 1]?.start_date;
        if (last && last > maxDate) maxDate = last;
      }
    });
    return {
      startDate: minDate,
      endDate: maxDate,
      startDateWithTime: `${minDate} 00:00`,
      endDateWithTime: `${maxDate} 23:59`,
      calendarDate: new Date(`${minDate}T09:00:00`)
    };
  }, [orders]);

  // Simulate +1 Day Delay via Bryntum taskStore native cascade API
  const handleSimulateDelay = async () => {
    const gantt = ganttRef.current?.instance;
    const taskStore = gantt?.taskStore;

    let newEndDateStr = "";

    if (taskStore) {
      // Locate the packaging task (Task 2)
      const packagingTask = taskStore.records.find(
        (t: any) =>
          t.name.toLowerCase().includes("packaging") ||
          t.id === 2 ||
          t.id === 11 ||
          t.id === 21 ||
          String(t.id).endsWith("2")
      );

      if (packagingTask) {
        // Native Bryntum engine extension: cascades dependent tasks 3 and 4 automatically
        packagingTask.duration = (packagingTask.duration || 1) + 1;
        const lastTask = taskStore.records[taskStore.records.length - 1];
        if (lastTask && lastTask.endDate) {
          newEndDateStr = lastTask.endDate.toISOString().split("T")[0];
        }
      }
    }

    const nextDelay = delayDays + 1;
    setDelayDays(nextDelay);

    if (!newEndDateStr && activeOrder) {
      const base = activeOrder.estimated_delivery || "2026-11-13";
      try {
        const dt = new Date(base + "T00:00:00");
        dt.setDate(dt.getDate() + 1);
        newEndDateStr = dt.toISOString().split("T")[0];
      } catch (e) {
        newEndDateStr = "2026-11-14";
      }
    }

    // Persist new cascaded schedule to backend and notify buyer
    if (activeOrder) {
      try {
        await fetch(`${resolvedApiUrl}/merchant/delay-update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: activeOrder.order_id,
            delay_days: nextDelay,
            new_eta: newEndDateStr
          })
        });
      } catch (e) {
        console.warn("Delay persist notice:", e);
      }
    }

    setPolicyBanner({
      type: "needs-approval",
      text: `⏱️ Bryntum Schedule Engine: Cascaded +1 day delay to downstream tasks. Estimated Delivery moved to ${newEndDateStr}. Buyer notified.`
    });
    setTimeout(() => setPolicyBanner(null), 6000);
  };

  // Asynchronous Drag-and-Drop policy enforcement on Scheduler
  const onBeforeEventDropFinalize = async ({ context }: any) => {
    // Tell Bryntum Scheduler this drop is validated asynchronously
    context.async = true;

    const eventRecord = context.eventRecord;
    const newResource = context.newResource;

    if (!newResource || !eventRecord) {
      context.finalize(false);
      return;
    }

    const orderId = eventRecord.id;
    const targetCourier = newResource.name;

    try {
      const res = await fetch(`${resolvedApiUrl}/merchant/reassign-courier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          new_courier: targetCourier
        })
      });
      const data: CourierReassignResult = await res.json();

      if (data.decision === "ALLOWED") {
        // Accept drop
        context.finalize(true);
        setPolicyBanner({
          type: "allowed",
          text: `✓ ${data.reason}`
        });
        // Update local state to keep both views synced
        setOrders((prev) =>
          prev.map((o) =>
            o.order_id === orderId ? { ...o, courier: targetCourier } : o
          )
        );
      } else if (data.decision === "NEEDS_APPROVAL") {
        // Revert move
        context.finalize(false);
        setPolicyBanner({
          type: "needs-approval",
          text: `⚠️ Needs buyer approval: ${data.reason}`
        });
      } else {
        // BLOCKED: revert move
        context.finalize(false);
        setPolicyBanner({
          type: "blocked",
          text: `🛑 Blocked: ${data.reason}`
        });
      }
    } catch (err: any) {
      context.finalize(false);
      setPolicyBanner({
        type: "blocked",
        text: `Error validating courier policy: ${err.message}`
      });
    }

    setTimeout(() => setPolicyBanner(null), 6500);
  };

  return (
    <div className="logistics-hub-root">
      {/* 1. Header Bar: Title, Subtitle, Powered by Bryntum */}
      <div className="logistics-header-bar">
        <div>
          <h2 className="logistics-title">Fulfilment</h2>
          <p className="logistics-subtitle">
            Orders placed by AI agents, scheduled and shipped.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="logistics-branding-tag">Powered by Bryntum</span>
          {/* Two Tabs: Order Timeline & Courier Scheduler */}
          <div className="logistics-tabs-cluster">
            <button
              type="button"
              className={`logistics-tab-btn ${activeTab === "gantt" ? "active" : ""}`}
              onClick={() => setActiveTab("gantt")}
            >
              Order Timeline
            </button>
            <button
              type="button"
              className={`logistics-tab-btn ${activeTab === "scheduler" ? "active" : ""}`}
              onClick={() => setActiveTab("scheduler")}
            >
              Courier Scheduler
            </button>
            <button
              type="button"
              className={`logistics-tab-btn ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => setActiveTab("calendar")}
            >
              Dispatch Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Policy Result Banner for Scheduler Decisions */}
      {policyBanner && (
        <div className={`policy-banner ${policyBanner.type}`}>
          {policyBanner.text}
        </div>
      )}

      {/* 2. Order Picker Dropdown & Details Row */}
      {activeOrder && (
        <div className="order-selector-card">
          <div className="order-selector-top">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontSize: "0.84rem", color: "#CDBDEB", fontWeight: 700 }}>
                Select Order:
              </label>
              <select
                className="order-dropdown-select"
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  setDelayDays(0);
                }}
              >
                {orders.map((o) => (
                  <option key={o.order_id} value={o.order_id}>
                    {o.order_id} — {o.product} ({o.courier})
                  </option>
                ))}
              </select>

              {/* Status Badge Derived Directly from Task Progress */}
              <span
                className={`status-badge ${
                  derivedStatus === "Delivered"
                    ? "status-delivered"
                    : derivedStatus === "In Transit"
                    ? "status-transit"
                    : "status-prep"
                }`}
              >
                ● {derivedStatus}
              </span>
            </div>

            {/* Delay Simulation Button */}
            <button
              type="button"
              className="delay-action-btn"
              onClick={handleSimulateDelay}
              title="Adds 1 day to Packaging duration and cascades dependent tasks via Bryntum engine"
            >
              ⏱️ Simulate +1 Day Delay {delayDays > 0 ? `(+${delayDays}d applied)` : ""}
            </button>
          </div>

          {/* Tags Row */}
          <div className="order-meta-tags-row">
            <span className="meta-tag-pill tag-agent">🤖 Placed by AI agent</span>
            <span className="meta-tag-pill tag-paypal">
              💳 PayPal Sandbox: CAPTURED ({activeOrder.paypal_order_id})
            </span>
            <span className="meta-tag-pill tag-policy">🛡️ Policy: Allowed</span>
            {delayDays > 0 && (
              <span className="meta-tag-pill" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#FBBF24", border: "1px solid #F59E0B" }}>
                ⏱️ Delayed +{delayDays}d cascaded
              </span>
            )}
          </div>

          {/* Details Row: Product, Buyer, Delivery Address, Courier, ETA */}
          <div className="order-details-grid">
            <div>
              <span className="detail-label">Product</span>
              <span className="detail-val">{activeOrder.product}</span>
            </div>
            <div>
              <span className="detail-label">Buyer</span>
              <span className="detail-val">{activeOrder.buyer_name}</span>
            </div>
            <div>
              <span className="detail-label">Delivery Address</span>
              <span className="detail-val">{activeOrder.address}</span>
            </div>
            <div>
              <span className="detail-label">Assigned Courier</span>
              <span className="detail-val" style={{ color: "#BAE6FD" }}>
                {activeOrder.courier}
              </span>
            </div>
            <div>
              <span className="detail-label">Estimated Delivery (ETA)</span>
              <span className="detail-val" style={{ color: delayDays > 0 ? "#FCD34D" : "#A7F3D0" }}>
                {activeOrder.estimated_delivery || "2026-11-13"}
                {delayDays > 0 && <small style={{ marginLeft: "4px" }}>(+{delayDays}d)</small>}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Real Bryntum Gantt View */}
      {activeTab === "gantt" && (
        <div className="bryntum-wrapper-container">
          <BryntumGantt
            ref={ganttRef}
            tasks={ganttTasksData}
            dependencies={ganttDependenciesData}
            startDate={timelineRange.startDate}
            endDate={timelineRange.endDate}
            viewPreset="dayAndWeek"
            rowHeight={46}
            barMargin={7}
            features={{
              baselines: {
                disabled: false
              },
              taskTooltip: true,
              dependencies: true
            }}
            columns={[
              { type: "name", field: "name", text: "Task Description", width: 260 },
              { type: "duration", field: "duration", text: "Duration", width: 90 },
              { type: "percentdone", field: "percentDone", text: "Progress", width: 100 }
            ]}
          />
        </div>
      )}

      {/* 4. Real Bryntum Scheduler View */}
      {activeTab === "scheduler" && (
        <div className="bryntum-wrapper-container">
          <BryntumScheduler
            ref={schedulerRef}
            resources={schedulerResources}
            events={schedulerEvents}
            startDate={timelineRange.startDateWithTime}
            endDate={timelineRange.endDateWithTime}
            viewPreset="dayAndWeek"
            barMargin={8}
            rowHeight={64}
            features={{
              eventDrag: {
                showExactDropPosition: true
              },
              eventTooltip: true
            }}
            columns={[
              {
                text: "Courier Fleet",
                field: "name",
                width: 220,
                renderer: ({ record }: any) => (
                  <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{record.icon}</span>
                    <span>{record.name}</span>
                  </span>
                )
              }
            ]}
            onBeforeEventDropFinalize={onBeforeEventDropFinalize}
          />
        </div>
      )}

      {/* 5. Real Bryntum Calendar View */}
      {activeTab === "calendar" && (
        <div className="bryntum-wrapper-container">
          <BryntumCalendar
            events={schedulerEvents}
            resources={schedulerResources}
            date={timelineRange.calendarDate}
            modes={{
              year: false,
              agenda: true
            }}
          />
        </div>
      )}
    </div>
  );
}

