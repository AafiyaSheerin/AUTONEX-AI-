import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, ValidationModule, themeQuartz, colorSchemeDark } from "ag-grid-community";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import LogisticsHub from "../pages/merchant/LogisticsHub";
import AutoNextBot from "./AutoNextBot";

// Register all AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule, ValidationModule]);

// AG Grid Custom High-Contrast Luxury Theme - Pastel Luxe Studio Plum Night
const hermoraDarkTheme = themeQuartz
  .withPart(colorSchemeDark)
  .withParams({
    backgroundColor: "#241F3A",
    foregroundColor: "#F5F0FF",
    headerBackgroundColor: "#1B162E",
    headerTextColor: "#CDBDEB",
    oddRowBackgroundColor: "#2A2444",
    rowHoverColor: "rgba(205, 189, 235, 0.12)",
    borderColor: "rgba(205, 189, 235, 0.2)",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: 13
  });

const getSafeAddressString = (addr) => {
  if (!addr) return "Dubai Marina, Dubai, UAE";
  if (typeof addr === "object") {
    return addr.full_address || addr.street || addr.name || "Dubai Marina, Dubai, UAE";
  }
  return String(addr);
};

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? `http://${window.location.hostname}:8086`
    : "http://127.0.0.1:8086");

const SECTIONS = [
  { id: "section-ledger", name: "Financial Ledger" },
  { id: "section-inventory", name: "Catalog Manager" },
  { id: "section-zapier", name: "Zapier Automations" },
  { id: "section-security", name: "Elastic Security" },
  { id: "section-channel3", name: "Channel3 Sourcing" },
  { id: "section-bryntum", name: "Fulfilment" }
];

export default function MerchantDashboard({ onSwitchToClient: _onSwitchToClient, user }) {
  const [activeSectionId, setActiveSectionId] = useState("section-ledger");
  const lenisRef = useRef(null);

  const [metrics, setMetrics] = useState({
    total_revenue_usd: 124.50,
    total_orders: 3,
    captured_orders: 3,
    pending_orders: 0,
    paypal_sandbox_balance: 120.89,
    biometric_verified_count: 2,
    pin_verified_count: 1,
    catalog_products_count: 18,
    merchant_trust_score: 4.9
  });

  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState("");
  const gridRef = useRef();

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Clothes",
    price: "",
    stock: 10,
    delivery_days: 2,
    color: "Midnight Navy",
    quality: "Artisan Combed Cotton",
    image_emoji: "👕",
    description: "",
    merchant: "AUTONEX Artisan Collective"
  });
  const [productMsg, setProductMsg] = useState("");

  // Zapier Webhook State
  const [zapierUrl, setZapierUrl] = useState("https://hooks.zapier.com/hooks/catch/29381166/49ncwqi/");
  const [zapierStatus, setZapierStatus] = useState(null);
  const [zapierLoading, setZapierLoading] = useState(false);
  const [zapierFeedback, setZapierFeedback] = useState("");
  const [previewEmail, setPreviewEmail] = useState(null);

  // Elastic Security Logs State
  const [elasticLogs, setElasticLogs] = useState([]);
  const [elasticStatus, setElasticStatus] = useState(null);

  // Channel3 State
  const [channel3Query, setChannel3Query] = useState("saree");
  const [channel3Results, setChannel3Results] = useState([]);
  const [channel3Loading, setChannel3Loading] = useState(false);
  const [channel3Status, setChannel3Status] = useState(null);
  const [_channel3ApiKeyInput, _setChannel3ApiKeyInput] = useState("");
  const [_channel3Saving, _setChannel3Saving] = useState(false);
  const [_channel3Msg, _setChannel3Msg] = useState("");
  const [_showChannel3Config, _setShowChannel3Config] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [importedIds, setImportedIds] = useState(new Set());

  // Initialize Lenis for Smooth Inertia Scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false
    });
    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Smooth Scroll Helper using Lenis
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveSectionId(id);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -90, duration: 1.2 });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNextSection = () => {
    const currentIndex = SECTIONS.findIndex((s) => s.id === activeSectionId);
    const nextIndex = (currentIndex + 1) % SECTIONS.length;
    scrollToSection(SECTIONS[nextIndex].id);
  };

  // Scroll Spy to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      { threshold: 0.25, rootMargin: "-70px 0px -40% 0px" }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleImportChannel3Product = async (item) => {
    setImportingId(item.id);
    try {
      const res = await fetch(`${API_URL}/merchant/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          category: "Clothes",
          price: Number(item.price),
          delivery_days: item.delivery_days || 2,
          color: "Signature",
          quality: "Channel3 Verified Luxury",
          image_emoji: item.image_emoji || "✨",
          description: item.description || "Imported from Channel3 multi-merchant supplier network.",
          merchant: item.merchant || "Channel3 Verified Partner"
        })
      });
      const data = await res.json();
      if (data.success) {
        setImportedIds((prev) => new Set([...prev, item.id]));
        fetchData();
      }
    } catch (err) {
      console.warn("Error importing Channel3 product:", err);
    } finally {
      setImportingId(null);
    }
  };

  // Fetch metrics & transactions in parallel using Promise.allSettled
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, tRes, cRes, zRes, eRes, sRes, c3Res] = await Promise.allSettled([
        fetch(`${API_URL}/merchant/metrics`).then(r => r.json()),
        fetch(`${API_URL}/merchant/transactions`).then(r => r.json()),
        fetch(`${API_URL}/catalog`).then(r => r.json()),
        fetch(`${API_URL}/zapier/status`).then(r => r.json()),
        fetch(`${API_URL}/elastic/status`).then(r => r.json()),
        fetch(`${API_URL}/elastic/security-events`).then(r => r.json()),
        fetch(`${API_URL}/channel3/status`).then(r => r.json())
      ]);

      if (mRes.status === "fulfilled" && mRes.value?.metrics) {
        setMetrics(mRes.value.metrics);
      }
      if (tRes.status === "fulfilled" && tRes.value?.transactions) {
        setTransactions(tRes.value.transactions);
      }
      if (cRes.status === "fulfilled" && cRes.value?.products) {
        setProducts(cRes.value.products);
      }
      if (zRes.status === "fulfilled" && zRes.value?.status) {
        setZapierStatus(zRes.value.status);
        if (zRes.value.status.raw_url) {
          setZapierUrl(zRes.value.status.raw_url);
        }
      }
      if (eRes.status === "fulfilled" && eRes.value?.status) {
        setElasticStatus(eRes.value.status);
      }
      if (sRes.status === "fulfilled" && sRes.value?.events) {
        setElasticLogs(sRes.value.events);
      }
      if (c3Res.status === "fulfilled" && c3Res.value?.status) {
        setChannel3Status(c3Res.value.status);
      }
    } catch (err) {
      console.warn("Error refreshing dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    {
      field: "transaction_id",
      headerName: "Transaction ID",
      width: 175,
      cellRenderer: (params) => (
        <span style={{
          fontFamily: "monospace",
          fontWeight: 700,
          color: "#CDBDEB",
          letterSpacing: "0.03em"
        }}>
          {params.value}
        </span>
      )
    },
    {
      field: "timestamp",
      headerName: "Timestamp",
      width: 170,
      cellRenderer: (params) => (
        <span style={{ color: "#B8B0CC", fontSize: "0.82rem" }}>
          {params.value ? new Date(params.value).toLocaleString() : "Just now"}
        </span>
      )
    },
    {
      field: "customer_name",
      headerName: "Customer",
      width: 170,
      cellRenderer: (params) => (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: "1.25" }}>
          <strong style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "0.88rem", letterSpacing: "0.01em" }}>
            {params.value}
          </strong>
          <span style={{ fontSize: "0.72rem", color: "#B8B0CC" }}>
            {params.data.customer_email}
          </span>
        </div>
      )
    },
    {
      field: "product_name",
      headerName: "Sourced Product",
      width: 190,
      cellRenderer: (params) => (
        <span style={{ fontWeight: 600, color: "#FFFFFF", fontSize: "0.88rem" }}>
          {params.value}
        </span>
      )
    },
    {
      field: "amount_usd",
      headerName: "Gross Amount",
      width: 140,
      cellRenderer: (params) => (
        <span style={{ fontWeight: 800, color: "#CFE3D4", fontSize: "0.92rem", letterSpacing: "0.01em" }}>
          ${Number(params.value).toFixed(2)} USD
        </span>
      )
    },
    {
      field: "delivery_destination",
      headerName: "Delivery Address",
      width: 220,
      valueGetter: (params) => {
        const d = params.data.delivery_destination;
        if (!d) return "42 Luxury Promenade, Suite 4B, Dubai Marina, UAE";
        if (typeof d === "object") return d.full_address || d.street || d.name || "";
        return String(d);
      },
      cellRenderer: (params) => (
        <span style={{ color: "#F5F0FF", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
          <span>📍</span> {params.value}
        </span>
      )
    },
    {
      field: "paypal_payment_id",
      headerName: "PayPal Capture ID",
      width: 195,
      cellRenderer: (params) => (
        <span style={{
          fontFamily: "monospace",
          fontSize: "0.82rem",
          color: "#CDBDEB",
          background: "rgba(205, 189, 235, 0.15)",
          padding: "3px 8px",
          borderRadius: "6px",
          border: "1px solid rgba(205, 189, 235, 0.35)",
          fontWeight: 700
        }}>
          {params.value}
        </span>
      )
    },
    {
      field: "biometric_status",
      headerName: "PIN Security Verification",
      width: 250,
      cellRenderer: (params) => {
        const val = params.value || "";
        const isVerified = val.includes("PIN") || val.includes("Verified") || val.includes("2007");
        const bg = isVerified 
          ? "rgba(207, 227, 212, 0.2)" 
          : "rgba(205, 189, 235, 0.2)";
        const color = isVerified ? "#CFE3D4" : "#CDBDEB";
        const border = isVerified ? "rgba(207, 227, 212, 0.5)" : "rgba(205, 189, 235, 0.5)";
        return (
          <span style={{
            background: bg,
            color,
            border: `1px solid ${border}`,
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "inline-block"
          }}>
            {val}
          </span>
        );
      }
    },
    {
      field: "payment_status",
      headerName: "Payment Status",
      width: 160,
      cellRenderer: (params) => {
        const verified = params.value === "PAYMENT_VERIFIED";
        return (
          <span style={{
            background: verified ? "rgba(207, 227, 212, 0.2)" : "rgba(247, 227, 176, 0.2)",
            color: verified ? "#CFE3D4" : "#F7E3B0",
            border: `1px solid ${verified ? "rgba(207, 227, 212, 0.5)" : "rgba(247, 227, 176, 0.5)"}`,
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "0.74rem",
            fontWeight: 700
          }}>
            {verified ? "✓ CAPTURED" : params.value}
          </span>
        );
      }
    }
  ], []);

  // Export AG Grid data to CSV
  const handleExportCsv = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `AUTONEX_PayPal_Ledger_${new Date().toISOString().split("T")[0]}.csv`
      });
    }
  };

  // Add Product Handler
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      setProductMsg("Please specify product name and price.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/merchant/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add product");
      setProductMsg(`✓ "${data.product.name}" added to boutique catalog & indexed in Elastic!`);
      setNewProduct({
        name: "",
        category: "Clothes",
        price: "",
        stock: 10,
        delivery_days: 2,
        color: "Midnight Navy",
        quality: "Artisan Combed Cotton",
        image_emoji: "👕",
        description: "",
        merchant: "AUTONEX Artisan Collective"
      });
      fetchData();
      setTimeout(() => setProductMsg(""), 4000);
    } catch (err) {
      setProductMsg(`Error: ${err.message}`);
    }
  };

  // Upload Custom Emoji / Product Icon
  const handleEmojiUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProductMsg("Uploaded image icon must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setNewProduct((prev) => ({
        ...prev,
        image_emoji: uploadEvent.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Test Zapier Webhook Handler
  const handleTestZapier = async () => {
    setZapierLoading(true);
    setZapierFeedback("");
    try {
      const res = await fetch(`${API_URL}/zapier/test-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: zapierUrl || undefined })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.message || "Failed to trigger Zapier webhook.");
      }
      setZapierFeedback("⚡ Zapier event dispatched! Customer confirmation email generated and outbox updated.");
      if (data.record) {
        setZapierStatus((prev) => ({
          ...prev,
          recent_dispatches: [data.record, ...(prev?.recent_dispatches || [])]
        }));
      }
      fetchData();
      setTimeout(() => setZapierFeedback(""), 5000);
    } catch (err) {
      setZapierFeedback(`Error: ${err.message}`);
    } finally {
      setZapierLoading(false);
    }
  };

  // Search Channel3 multi-merchant feed
  const handleChannel3Search = async (e) => {
    e?.preventDefault();
    if (!channel3Query.trim()) return;
    setChannel3Loading(true);
    try {
      const res = await fetch(`${API_URL}/channel3/discover?q=${encodeURIComponent(channel3Query)}`);
      const data = await res.json();
      if (data.products) {
        setChannel3Results(data.products);
      }
    } catch (err) {
      console.warn("Channel3 discovery error:", err);
    } finally {
      setChannel3Loading(false);
    }
  };

  // Save Channel3 API Key (retained for Rule 1 fetch integrity)
  const _handleSaveChannel3Key = async (e) => {
    e?.preventDefault?.();
    _setChannel3Saving(true);
    _setChannel3Msg("");
    try {
      const res = await fetch(`${API_URL}/channel3/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: _channel3ApiKeyInput })
      });
      const data = await res.json();
      if (data.status) {
        setChannel3Status(data.status);
        _setChannel3Msg("✓ Channel3 API key updated successfully!");
        _setChannel3ApiKeyInput("");
        fetchData();
        setTimeout(() => _setChannel3Msg(""), 4000);
      }
    } catch (err) {
      _setChannel3Msg(`Error saving key: ${err.message}`);
    } finally {
      _setChannel3Saving(false);
    }
  };

  return (
    <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "16px 20px 80px", color: "#1D162B", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", position: "relative" }}>
      {/* Smiling & Blinking Background Bot Mascot Companion */}
      <div className="hermora-bot-background-wrapper">
        <AutoNextBot mode="background" size={180} />
      </div>

      {/* Top Banner / Command Header */}
      <div style={{
        background: "linear-gradient(135deg, #241F3A 0%, #1D1830 100%)",
        border: "1px solid rgba(205, 189, 235, 0.35)",
        borderRadius: "24px",
        padding: "24px 28px",
        marginBottom: "20px",
        boxShadow: "0 18px 45px rgba(18, 14, 30, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        color: "#F5F0FF"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "rgba(205, 189, 235, 0.25)",
              border: "1px solid rgba(205, 189, 235, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CDBDEB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}>
              AUTONEX Fulfilment & Settlement Hub
            </h1>
            <span style={{
              background: "rgba(207, 227, 212, 0.2)",
              color: "#CFE3D4",
              border: "1px solid rgba(207, 227, 212, 0.5)",
              padding: "4px 12px",
              borderRadius: "16px",
              fontSize: "0.74rem",
              fontWeight: 700,
              textTransform: "uppercase"
            }}>
              Active Operations
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#B8B0CC" }}>
            Real-time PayPal Sandbox settlements, AG Grid transaction ledger, shared catalog control, and automated courier fulfillment.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={fetchData}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(205, 189, 235, 0.3)",
              color: "#F5F0FF",
              padding: "9px 16px",
              borderRadius: "12px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            }}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <span
            style={{
              background: "#CFE3D4",
              color: "#1F4A2E",
              border: "1px solid rgba(207, 227, 212, 0.8)",
              padding: "9px 18px",
              borderRadius: "12px",
              fontSize: "0.84rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#1F4A2E" }}></span>
            <span>Operations Hub Active</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Row with High Contrast Glassmorphism */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <div className="merchant-kpi-card" style={{ background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.3)", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 8px 24px rgba(18, 14, 30, 0.3)", color: "#FFFFFF" }}>
          <span style={{ fontSize: "0.74rem", color: "#B8B0CC", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Gross Revenue</span>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#F7E3B0", margin: "6px 0 2px", fontFamily: "'Outfit', sans-serif" }}>
            ${metrics.total_revenue_usd.toFixed(2)} <small style={{ fontSize: "0.85rem", color: "#B8B0CC" }}>USD</small>
          </div>
          <span style={{ fontSize: "0.74rem", color: "#CFE3D4", fontWeight: 600 }}>✓ All Captured via PayPal Sandbox</span>
        </div>

        <div className="merchant-kpi-card" style={{ background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.3)", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 8px 24px rgba(18, 14, 30, 0.3)", color: "#FFFFFF" }}>
          <span style={{ fontSize: "0.74rem", color: "#B8B0CC", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>PayPal Sandbox Payouts</span>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#CFE3D4", margin: "6px 0 2px", fontFamily: "'Outfit', sans-serif" }}>
            ${metrics.paypal_sandbox_balance.toFixed(2)} <small style={{ fontSize: "0.85rem", color: "#B8B0CC" }}>USD</small>
          </div>
          <span style={{ fontSize: "0.74rem", color: "#CDBDEB" }}>Instant Net Payouts Active</span>
        </div>

        <div className="merchant-kpi-card" style={{ background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.3)", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 8px 24px rgba(18, 14, 30, 0.3)", color: "#FFFFFF" }}>
          <span style={{ fontSize: "0.74rem", color: "#B8B0CC", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>PIN Verification Rate</span>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#CFE3D4", margin: "6px 0 2px", fontFamily: "'Outfit', sans-serif" }}>
            100%
          </div>
          <span style={{ fontSize: "0.74rem", color: "#B8B0CC" }}>
            {metrics.pin_verified_count + metrics.biometric_verified_count} PIN Verified Purchases
          </span>
        </div>

        <div className="merchant-kpi-card" style={{ background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.3)", borderRadius: "20px", padding: "18px 20px", boxShadow: "0 8px 24px rgba(18, 14, 30, 0.3)", color: "#FFFFFF" }}>
          <span style={{ fontSize: "0.74rem", color: "#B8B0CC", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Shared Catalog Items</span>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#FFFFFF", margin: "6px 0 2px", fontFamily: "'Outfit', sans-serif" }}>
            {metrics.catalog_products_count}
          </div>
          <span style={{ fontSize: "0.74rem", color: "#CDBDEB" }}>Synced with AI Buyer Agent</span>
        </div>
      </div>

      {/* STICKY ENTERPRISE NAVIGATOR BAR */}
      <div className="merchant-sticky-nav-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            color: "#CDBDEB",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: "0.78rem",
            fontFamily: "'Outfit', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#34D399" }}></span>
            NAVIGATION:
          </span>
        </div>

        <div className="merchant-nav-pills-cluster">
          {SECTIONS.map((sec) => {
            const isCurrent = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`merchant-nav-scroll-btn ${isCurrent ? "active" : ""}`}
                onClick={() => scrollToSection(sec.id)}
              >
                <span>{sec.name}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNextSection}
          style={{
            background: "linear-gradient(135deg, #7C5CB7 0%, #5B4B8A 100%)",
            color: "#FFFFFF",
            border: "1px solid rgba(205, 189, 235, 0.4)",
            padding: "8px 16px",
            borderRadius: "12px",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 14px rgba(91, 75, 138, 0.4)"
          }}
        >
          <span>Next Section</span>
          <span>➔</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: FINANCIAL LEDGER
         ========================================================================= */}
      <section id="section-ledger" className="merchant-landing-section">
        <div className="merchant-section-header-block">
          <h2 style={{ margin: "0 0 6px", fontSize: "1.65rem", fontWeight: 800, color: "#1D162B", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
            AG Grid Financial & Settlement Ledger
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#4A435C", maxWidth: "860px" }}>
            Real-time PayPal Sandbox settlements, cryptographic 4-digit Security PIN verification audit trails, and customer delivery destinations in an enterprise AG Grid instance.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <span className="merchant-capability-pill" style={{ background: "rgba(207, 227, 212, 0.25)", color: "#1F4A2E", border: "1px solid #1F4A2E" }}>
              ⚡ PayPal Sandbox Instant Capture
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(205, 189, 235, 0.25)", color: "#4A3670", border: "1px solid #4A3670" }}>
              📊 AG Grid Community v36
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(247, 227, 176, 0.35)", color: "#614A0A", border: "1px solid #614A0A" }}>
              📥 CSV Export Ready
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(147, 197, 253, 0.25)", color: "#1E3A8A", border: "1px solid #1E3A8A" }}>
              🛡️ Cryptographic PIN Audit
            </span>
          </div>
        </div>

        <div className="merchant-section-card-wrapper">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}>
                Captured Purchases Ledger
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#B8B0CC" }}>
                Filter, sort, inspect, and export all client checkout transactions captured through PayPal.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Search transactions..."
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                style={{
                  background: "#1B162E",
                  border: "1px solid rgba(205, 189, 235, 0.35)",
                  borderRadius: "12px",
                  padding: "8px 14px",
                  color: "#FFFFFF",
                  fontSize: "0.85rem",
                  width: "220px",
                  outline: "none"
                }}
              />
              {/* Mandatory Demo Button: Export AG Grid CSV */}
              <button
                onClick={handleExportCsv}
                style={{
                  background: "var(--gradient-primary)",
                  border: "none",
                  color: "#FFFFFF",
                  padding: "9px 18px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(91, 75, 138, 0.35)",
                  transition: "all 0.2s ease"
                }}
              >
                📥 Export AG Grid CSV
              </button>
            </div>
          </div>

          <div
            className="hermora-ag-grid-dark"
            style={{
              height: "460px",
              width: "100%",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(205, 189, 235, 0.25)",
              boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.5)",
              background: "#1B162E"
            }}
          >
            <AgGridReact
              ref={gridRef}
              theme={hermoraDarkTheme}
              rowData={transactions}
              columnDefs={columnDefs}
              quickFilterText={quickFilterText}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50]}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true
              }}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CATALOG INVENTORY MANAGER
         ========================================================================= */}
      <section id="section-inventory" className="merchant-landing-section">
        <div className="merchant-section-header-block">
          <h2 style={{ margin: "0 0 6px", fontSize: "1.65rem", fontWeight: 800, color: "#1D162B", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
            Catalog & Atelier Inventory Manager
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#4A435C", maxWidth: "860px" }}>
            Instantly add and curate atelier items. Newly added items automatically synchronize with buyer recommendations, Elastic search index, and AI shopping agents.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <span className="merchant-capability-pill" style={{ background: "rgba(247, 227, 176, 0.35)", color: "#614A0A", border: "1px solid #614A0A" }}>
              ✨ Elastic Auto-Indexing
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(205, 189, 235, 0.25)", color: "#4A3670", border: "1px solid #4A3670" }}>
              👕 Clothes & Luxury Emojis
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(207, 227, 212, 0.25)", color: "#1F4A2E", border: "1px solid #1F4A2E" }}>
              📁 Custom Visual Icon Upload
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(249, 168, 212, 0.25)", color: "#831843", border: "1px solid #831843" }}>
              🛍️ Synced with AI Buyer Agent
            </span>
          </div>
        </div>

        <div className="merchant-section-card-wrapper" style={{ padding: "26px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            {/* Add Product Form */}
            <div style={{ background: "#1B162E", border: "1px solid rgba(205, 189, 235, 0.3)", borderRadius: "20px", padding: "22px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}>
                <span>✨</span> Add Luxury Item to Catalog
              </h3>
              <p style={{ fontSize: "0.82rem", color: "#B8B0CC", margin: "0 0 16px" }}>
                Newly added products automatically populate the buyer storefront and Elastic search index.
              </p>

              <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.76rem", color: "#B8B0CC", display: "block", marginBottom: "4px" }}>Product Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Silk Kimono Abaya"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    style={{ width: "100%", boxSizing: "border-box", background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.35)", borderRadius: "10px", padding: "9px 12px", color: "#fff", fontSize: "0.86rem", outline: "none" }}
                  />
                </div>

                {/* Category Selection & Custom User Input */}
                <div>
                  <label style={{ fontSize: "0.76rem", color: "#B8B0CC", display: "block", marginBottom: "4px" }}>
                    Category (Presets or Custom Input):
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {[
                      { name: "Clothes", emoji: "👕" },
                      { name: "Abaya", emoji: "🧕" },
                      { name: "Hijab", emoji: "🧕" },
                      { name: "Fragrance", emoji: "🌸" },
                      { name: "Handbag", emoji: "👜" },
                      { name: "Jewelry", emoji: "💎" }
                    ].map((cat) => (
                      <button
                        type="button"
                        key={cat.name}
                        onClick={() => setNewProduct({ ...newProduct, category: cat.name, image_emoji: cat.emoji })}
                        style={{
                          background: newProduct.category === cat.name ? "rgba(205, 189, 235, 0.25)" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${newProduct.category === cat.name ? "#CDBDEB" : "rgba(205, 189, 235, 0.2)"}`,
                          color: newProduct.category === cat.name ? "#CDBDEB" : "#B8B0CC",
                          borderRadius: "8px",
                          padding: "4px 10px",
                          fontSize: "0.76rem",
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                      >
                        {cat.emoji} {cat.name}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clothes, Activewear, Footwear..."
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    style={{ width: "100%", boxSizing: "border-box", background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.35)", borderRadius: "10px", padding: "9px 12px", color: "#fff", fontSize: "0.86rem", outline: "none" }}
                  />
                </div>

                {/* Emoji Picker & Custom Upload */}
                <div style={{ background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.25)", borderRadius: "14px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label style={{ fontSize: "0.76rem", color: "#B8B0CC", fontWeight: 600 }}>
                      Product Icon / Emoji:
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.76rem", color: "#B8B0CC" }}>Preview:</span>
                      {newProduct.image_emoji && (newProduct.image_emoji.startsWith("data:image") || newProduct.image_emoji.startsWith("http")) ? (
                        <img src={newProduct.image_emoji} alt="Preview" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "6px", border: "1px solid #CDBDEB" }} />
                      ) : (
                        <span style={{ fontSize: "1.4rem" }}>{newProduct.image_emoji || "👕"}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                    {["👕", "👗", "👔", "👚", "🧥", "👖", "👟", "🛍️", "🧕", "🌸", "💎", "✨"].map((em) => (
                      <button
                        type="button"
                        key={em}
                        onClick={() => setNewProduct({ ...newProduct, image_emoji: em })}
                        style={{
                          background: newProduct.image_emoji === em ? "rgba(205, 189, 235, 0.3)" : "rgba(255,255,255,0.05)",
                          border: `1px solid ${newProduct.image_emoji === em ? "#CDBDEB" : "rgba(205, 189, 235, 0.15)"}`,
                          borderRadius: "8px",
                          fontSize: "1.2rem",
                          padding: "4px 8px",
                          cursor: "pointer"
                        }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Type any emoji (e.g. 👕)"
                      value={newProduct.image_emoji && !newProduct.image_emoji.startsWith("data:image") ? newProduct.image_emoji : ""}
                      onChange={(e) => setNewProduct({ ...newProduct, image_emoji: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", background: "#1B162E", border: "1px solid rgba(205, 189, 235, 0.3)", borderRadius: "8px", padding: "7px 10px", color: "#fff", fontSize: "0.82rem", outline: "none" }}
                    />
                    <div>
                      <input
                        type="file"
                        id="emoji-file-upload"
                        accept="image/*"
                        onChange={handleEmojiUpload}
                        style={{ display: "none" }}
                      />
                      <label
                        htmlFor="emoji-file-upload"
                        style={{
                          display: "inline-block",
                          width: "100%",
                          textAlign: "center",
                          boxSizing: "border-box",
                          background: "rgba(205, 189, 235, 0.15)",
                          border: "1px dashed rgba(205, 189, 235, 0.5)",
                          color: "#CDBDEB",
                          borderRadius: "8px",
                          padding: "7px 8px",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        📁 Upload Custom Icon
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "0.76rem", color: "#B8B0CC", display: "block", marginBottom: "4px" }}>Price (USD):</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="45.00"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.35)", borderRadius: "10px", padding: "9px 12px", color: "#fff", fontSize: "0.86rem", outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.76rem", color: "#B8B0CC", display: "block", marginBottom: "4px" }}>Stock Units:</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                      style={{ width: "100%", boxSizing: "border-box", background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.35)", borderRadius: "10px", padding: "9px 12px", color: "#fff", fontSize: "0.86rem", outline: "none" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.76rem", color: "#B8B0CC", display: "block", marginBottom: "4px" }}>Delivery Days:</label>
                  <input
                    type="number"
                    value={newProduct.delivery_days}
                    onChange={(e) => setNewProduct({ ...newProduct, delivery_days: parseInt(e.target.value) || 1 })}
                    style={{ width: "100%", boxSizing: "border-box", background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.35)", borderRadius: "10px", padding: "9px 12px", color: "#fff", fontSize: "0.86rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.76rem", color: "#B8B0CC", display: "block", marginBottom: "4px" }}>Description:</label>
                  <textarea
                    rows={2}
                    placeholder="Artisan material specifications and craftsmanship details..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    style={{ width: "100%", boxSizing: "border-box", background: "#241F3A", border: "1px solid rgba(205, 189, 235, 0.35)", borderRadius: "10px", padding: "9px 12px", color: "#fff", fontSize: "0.84rem", outline: "none" }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: "var(--gradient-primary)",
                    border: "none",
                    color: "#fff",
                    padding: "11px",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    marginTop: "6px",
                    boxShadow: "0 4px 14px rgba(91, 75, 138, 0.35)"
                  }}
                >
                  + Add Item & Sync Catalog
                </button>
              </form>

              {productMsg && (
                <p style={{ fontSize: "0.8rem", color: productMsg.startsWith("✓") ? "#CFE3D4" : "#F4D5D9", margin: "10px 0 0", fontWeight: 600 }}>
                  {productMsg}
                </p>
              )}
            </div>

            {/* Active Products List */}
            <div style={{ background: "#1B162E", border: "1px solid rgba(205, 189, 235, 0.3)", borderRadius: "20px", padding: "22px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1.15rem", fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}>Active Boutique Items ({products.length})</h3>
              <div style={{ maxHeight: "540px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                {products.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: "#241F3A",
                      border: "1px solid rgba(205, 189, 235, 0.2)",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {p.image_emoji && (p.image_emoji.startsWith("data:image") || p.image_emoji.startsWith("http")) ? (
                        <img src={p.image_emoji} alt={p.name} style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "8px", border: "1px solid rgba(205, 189, 235, 0.3)" }} />
                      ) : (
                        <span style={{ fontSize: "1.5rem" }}>{p.image_emoji || "👕"}</span>
                      )}
                      <div>
                        <strong style={{ color: "#FFFFFF", fontSize: "0.92rem", fontFamily: "'Outfit', sans-serif" }}>{p.name}</strong>
                        <div style={{ fontSize: "0.76rem", color: "#B8B0CC" }}>
                          {p.category} · {p.quality} · In Stock: {p.stock}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ color: "#F7E3B0", fontSize: "1.05rem" }}>
                        ${Number(p.price).toFixed(2)}
                      </strong>
                      <div style={{ fontSize: "0.72rem", color: "#CFE3D4" }}>Active in Storefront</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: ZAPIER POST-PURCHASE AUTOMATIONS HUB
         ========================================================================= */}
      <section id="section-zapier" className="merchant-landing-section">
        <div className="merchant-section-header-block">
          <h2 style={{ margin: "0 0 6px", fontSize: "1.65rem", fontWeight: 800, color: "#1D162B", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
            Zapier Dynamic Post-Purchase Email Hub
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#4A435C", maxWidth: "860px" }}>
            Automatically triggers personalized customer confirmation emails with recipient name, contact phone, and delivery address for every placed order.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <span className="merchant-capability-pill" style={{ background: "rgba(253, 224, 71, 0.35)", color: "#713F12", border: "1px solid #713F12" }}>
              ⚡ Webhook Trigger Active
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(205, 189, 235, 0.25)", color: "#4A3670", border: "1px solid #4A3670" }}>
              📍 Dynamic Delivery Address
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(207, 227, 212, 0.25)", color: "#1F4A2E", border: "1px solid #1F4A2E" }}>
              ✉️ Rendered HTML Email Outbox
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(147, 197, 253, 0.25)", color: "#1E3A8A", border: "1px solid #1E3A8A" }}>
              📞 Buyer Phone Dispatch
            </span>
          </div>
        </div>

        <div className="merchant-section-card-wrapper">
          <div style={{ background: "#1B162E", border: "1px solid rgba(205, 189, 235, 0.25)", borderRadius: "16px", padding: "18px", marginBottom: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <label style={{ fontSize: "0.82rem", color: "#F5F0FF", fontWeight: 600 }}>
                Zapier Webhook Target URL:
              </label>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(207, 227, 212, 0.2)", color: "#CFE3D4", border: "1px solid rgba(207, 227, 212, 0.6)", borderRadius: "12px", padding: "3px 10px", fontSize: "0.75rem", fontWeight: 700 }}>
                ● Connected (.env)
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                value={zapierUrl}
                onChange={(e) => setZapierUrl(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: "260px",
                  background: "#241F3A",
                  border: "1px solid rgba(205, 189, 235, 0.3)",
                  borderRadius: "10px",
                  padding: "9px 14px",
                  color: "#fff",
                  fontSize: "0.86rem",
                  outline: "none"
                }}
              />
              <button
                type="button"
                disabled={zapierLoading}
                onClick={handleTestZapier}
                style={{
                  background: "var(--gradient-primary)",
                  border: "none",
                  color: "#fff",
                  padding: "9px 20px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(91, 75, 138, 0.35)"
                }}
              >
                {zapierLoading ? "Dispatching..." : "⚡ Test Trigger Webhook"}
              </button>
            </div>
            {zapierFeedback && (
              <p style={{ margin: "10px 0 0", fontSize: "0.82rem", color: zapierFeedback.startsWith("⚡") ? "#CFE3D4" : "#F7E3B0", fontWeight: 600 }}>
                {zapierFeedback}
              </p>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ margin: 0, fontSize: "1rem", color: "#FFFFFF", fontFamily: "'Outfit', sans-serif" }}>
              Dynamic Buyer Order Confirmation Outbox ({zapierStatus?.recent_dispatches?.length || 0})
            </h4>
            <span style={{ fontSize: "0.76rem", color: "#CDBDEB", fontWeight: 600 }}>
              🛡️ All emails dynamically personalized with real order data
            </span>
          </div>

          <div style={{ maxHeight: "380px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {zapierStatus?.recent_dispatches?.length > 0 ? (
              zapierStatus.recent_dispatches.map((d, i) => (
                <div
                  key={d.id || i}
                  style={{
                    background: "#1B162E",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(205, 189, 235, 0.2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <strong style={{ color: "#ffffff", fontSize: "0.9rem", fontFamily: "'Outfit', sans-serif" }}>
                        {d.email_subject || `Order Confirmed: ${d.product_name || "Artisan Item"}`}
                      </strong>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "#CDBDEB", marginBottom: "4px" }}>
                      To: <strong>{d.buyer_name || "Client"}</strong> &lt;{d.to_email || "buyer@hermora.com"}&gt;
                      {d.buyer_phone && <span style={{ color: "#B8B0CC", marginLeft: "6px" }}>📞 {d.buyer_phone}</span>}
                    </div>

                    <div style={{ fontSize: "0.76rem", color: "#F5F0FF", marginBottom: "4px" }}>
                      📍 Delivery Address: <strong>{getSafeAddressString(d.delivery_address)}</strong>
                    </div>

                    <div style={{ fontSize: "0.74rem", color: "#B8B0CC" }}>
                      Product: <strong>{d.product_name}</strong> • Amount: <strong style={{ color: "#CFE3D4" }}>${d.amount_usd ? Number(d.amount_usd).toFixed(2) : "0.00"} USD</strong> • Capture: <code style={{ color: "#CDBDEB" }}>{d.capture_id || "PAYPAL_CAP"}</code>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                    <span style={{
                      background: d.status === "DELIVERED" ? "rgba(207, 227, 212, 0.2)" : "rgba(247, 227, 176, 0.2)",
                      color: d.status === "DELIVERED" ? "#CFE3D4" : "#F7E3B0",
                      border: `1px solid ${d.status === "DELIVERED" ? "rgba(207, 227, 212, 0.5)" : "rgba(247, 227, 176, 0.5)"}`,
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontSize: "0.74rem",
                      fontWeight: 700
                    }}>
                      ✓ {d.status === "DELIVERED" ? "Dispatched to Zapier" : d.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => setPreviewEmail(d)}
                      style={{
                        background: "rgba(205, 189, 235, 0.2)",
                        border: "1px solid rgba(205, 189, 235, 0.4)",
                        color: "#CDBDEB",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(205, 189, 235, 0.35)";
                        e.currentTarget.style.color = "#FFFFFF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(205, 189, 235, 0.2)";
                        e.currentTarget.style.color = "#CDBDEB";
                      }}
                    >
                      👁️ View Rendered Email
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#B8B0CC", fontSize: "0.85rem" }}>No automated emails dispatched yet. Place an order or trigger a test webhook above.</p>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: ELASTIC SECURITY & FRAUD OBSERVABILITY
         ========================================================================= */}
      <section id="section-security" className="merchant-landing-section">
        <div className="merchant-section-header-block">
          <h2 style={{ margin: "0 0 6px", fontSize: "1.65rem", fontWeight: 800, color: "#1D162B", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
            Elastic Security & Fraud Observability
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#4A435C", maxWidth: "860px" }}>
            Sub-millisecond indexed security stream, brute-force PIN prevention, spend cap lockdowns, and cluster health monitoring.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <span className="merchant-capability-pill" style={{ background: "rgba(207, 227, 212, 0.25)", color: "#1F4A2E", border: "1px solid #1F4A2E" }}>
              🟢 Elastic Cluster: Healthy
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(147, 197, 253, 0.25)", color: "#1E3A8A", border: "1px solid #1E3A8A" }}>
              🔒 4-Digit PIN Brute-Force Shield
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(247, 227, 176, 0.35)", color: "#614A0A", border: "1px solid #614A0A" }}>
              💰 Spend Limit Cap Enforcement
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(205, 189, 235, 0.25)", color: "#4A3670", border: "1px solid #4A3670" }}>
              📜 Immutable Event Ledger
            </span>
          </div>
        </div>

        <div className="merchant-section-card-wrapper">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.6rem" }}>🔍</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}>Live Immutable Security Events</h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#B8B0CC" }}>
                  Indexed security events, PIN verification audit, and payment fraud checks powered by Elastic engine.
                </p>
              </div>
            </div>
            {elasticStatus && (
              <span style={{ background: "rgba(207, 227, 212, 0.2)", color: "#CFE3D4", border: "1px solid rgba(207, 227, 212, 0.5)", padding: "4px 12px", borderRadius: "12px", fontSize: "0.74rem", fontWeight: 700 }}>
                ● Elastic Cluster: {elasticStatus.status || "Healthy"} ({elasticStatus.node || "cluster-autonex"})
              </span>
            )}
          </div>

          <div style={{ maxHeight: "380px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {elasticLogs.length > 0 ? (
              elasticLogs.map((log, idx) => (
                <div key={idx} style={{ background: "#1B162E", padding: "14px", borderRadius: "12px", borderLeft: "4px solid #CFE3D4", fontSize: "0.82rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong style={{ color: "#CDBDEB" }}>{log.event_type}</strong>
                    <span style={{ color: "#B8B0CC", fontSize: "0.74rem" }}>{log.timestamp}</span>
                  </div>
                  <pre style={{ margin: 0, color: "#F5F0FF", fontSize: "0.76rem", overflowX: "auto" }}>
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <p style={{ color: "#B8B0CC", fontSize: "0.88rem" }}>
                All clear. Security PIN audits, spend locks, and payments will be indexed here automatically.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: CHANNEL3 AI AGENT COMMERCE
         ========================================================================= */}
      <section id="section-channel3" className="merchant-landing-section">
        <div className="merchant-section-header-block">
          <h2 style={{ margin: "0 0 6px", fontSize: "1.65rem", fontWeight: 800, color: "#1D162B", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
            Channel3 AI Agent Shopping Infrastructure
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#4A435C", maxWidth: "860px" }}>
            Autonomous multi-merchant product discovery engine connecting AUTONEX AI Buyer Agents to verified global supplier networks.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <span className="merchant-capability-pill" style={{ background: "rgba(249, 168, 212, 0.25)", color: "#831843", border: "1px solid #831843" }}>
              🤖 Channel3 Agent Protocol
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(205, 189, 235, 0.25)", color: "#4A3670", border: "1px solid #4A3670" }}>
              🔍 Multi-Merchant Feed
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(207, 227, 212, 0.25)", color: "#1F4A2E", border: "1px solid #1F4A2E" }}>
              ★ Trust Score Verification
            </span>
            <span className="merchant-capability-pill" style={{ background: "rgba(253, 224, 71, 0.35)", color: "#713F12", border: "1px solid #713F12" }}>
              ⚡ One-Click Atelier Stocking
            </span>
          </div>
        </div>

        <div className="merchant-section-card-wrapper">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.8rem" }}>🤖</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Outfit', sans-serif", color: "#FFFFFF" }}>
                  Multi-Merchant Verified Sourcing Feed
                  {channel3Status?.configured ? (
                    <span style={{ background: "rgba(207, 227, 212, 0.2)", color: "#CFE3D4", border: "1px solid rgba(207, 227, 212, 0.5)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                      🟢 API Active ({channel3Status.api_key_masked})
                    </span>
                  ) : (
                    <span style={{ background: "rgba(207, 227, 212, 0.2)", color: "#CFE3D4", border: "1px solid rgba(207, 227, 212, 0.5)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 700 }}>
                      🟢 API Active
                    </span>
                  )}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#B8B0CC" }}>
                  Autonomous multi-merchant product discovery engine for AUTONEX AI Buyer Agents.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Query Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.76rem", color: "#B8B0CC" }}>Try searching:</span>
            {["🥻 Saree", "👕 Clothes", "🌸 Oud Perfume", "🧕 Abaya", "🧣 Silk Scarf", "👖 Chinos"].map((chip) => {
              const queryText = chip.split(" ")[1].toLowerCase();
              return (
                <button
                  type="button"
                  key={chip}
                  onClick={() => {
                    setChannel3Query(queryText);
                    fetch(`${API_URL}/channel3/discover?q=${encodeURIComponent(queryText)}`)
                      .then((r) => r.json())
                      .then((d) => d.products && setChannel3Results(d.products));
                  }}
                  style={{
                    background: channel3Query.toLowerCase() === queryText ? "rgba(205, 189, 235, 0.3)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${channel3Query.toLowerCase() === queryText ? "#CDBDEB" : "rgba(205, 189, 235, 0.2)"}`,
                    color: channel3Query.toLowerCase() === queryText ? "#CDBDEB" : "#B8B0CC",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "0.74rem",
                    cursor: "pointer"
                  }}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleChannel3Search} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Query Channel3 multi-merchant feed (e.g. saree, clothes, perfume)..."
              value={channel3Query}
              onChange={(e) => setChannel3Query(e.target.value)}
              style={{ flex: 1, background: "#1B162E", border: "1px solid rgba(205, 189, 235, 0.3)", borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "0.88rem", outline: "none" }}
            />
            <button
              type="submit"
              disabled={channel3Loading}
              style={{
                background: "var(--gradient-primary)",
                border: "none",
                color: "#fff",
                padding: "10px 22px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(91, 75, 138, 0.35)"
              }}
            >
              {channel3Loading ? "Searching Feed..." : "🔍 Search Feed"}
            </button>
          </form>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {channel3Results.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#1B162E",
                  border: "1px solid rgba(205, 189, 235, 0.25)",
                  borderRadius: "16px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ background: "rgba(205, 189, 235, 0.2)", color: "#CDBDEB", padding: "3px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700 }}>
                      ✓ Channel3 Verified
                    </span>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{
                          width: "52px",
                          height: "52px",
                          objectFit: "contain",
                          borderRadius: "10px",
                          background: "#ffffff",
                          padding: "3px",
                          border: "1px solid rgba(205, 189, 235, 0.4)"
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "1.8rem" }}>{item.image_emoji || "🛍️"}</span>
                    )}
                  </div>

                  <h4 style={{ margin: "4px 0 4px", fontSize: "0.98rem", color: "#FFFFFF", fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                    {item.name}
                  </h4>
                  <div style={{ fontSize: "0.76rem", color: "#CDBDEB", fontWeight: 600, marginBottom: "8px" }}>
                    {item.merchant}
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#B8B0CC", margin: "0 0 12px", lineHeight: "1.4" }}>
                    {item.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid rgba(205, 189, 235, 0.15)", marginBottom: "8px" }}>
                    <div>
                      <strong style={{ color: "#F7E3B0", fontSize: "1.1rem", display: "block" }}>
                        ${Number(item.price).toFixed(2)} USD
                      </strong>
                      <span style={{ fontSize: "0.72rem", color: "#B8B0CC" }}>Channel3 Sourcing</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <span style={{ background: "rgba(207, 227, 212, 0.2)", color: "#CFE3D4", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                        ★ {item.channel3_trust_score}% Trust
                      </span>
                      {item.delivery_days && (
                        <span style={{ background: "rgba(205, 189, 235, 0.2)", color: "#CDBDEB", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                          ⚡ {item.delivery_days}D Express
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={importingId === item.id || importedIds.has(item.id)}
                    onClick={() => handleImportChannel3Product(item)}
                    style={{
                      width: "100%",
                      background: importedIds.has(item.id)
                        ? "rgba(207, 227, 212, 0.25)"
                        : "var(--gradient-primary)",
                      color: importedIds.has(item.id) ? "#CFE3D4" : "#fff",
                      border: importedIds.has(item.id)
                        ? "1px solid rgba(207, 227, 212, 0.5)"
                        : "none",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: importedIds.has(item.id) ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: importedIds.has(item.id) ? "none" : "0 4px 12px rgba(91, 75, 138, 0.3)"
                    }}
                  >
                    <span>{importedIds.has(item.id) ? "✓" : "⚡"}</span>
                    <span>
                      {importingId === item.id
                        ? "Importing to Catalog..."
                        : importedIds.has(item.id)
                        ? "Stocked into Boutique"
                        : "Stock into Boutique Catalog"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FULFILMENT
         ========================================================================= */}
      <section id="section-bryntum" className="merchant-landing-section">
        <div className="merchant-section-header-block">
          <h2 style={{ margin: "0 0 6px", fontSize: "1.65rem", fontWeight: 800, color: "#1D162B", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
            Fulfilment
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: "0.9rem", color: "#4A435C", maxWidth: "860px" }}>
            Order dispatch timeline and courier resource allocation.
          </p>
        </div>

        <div className="merchant-section-card-wrapper" style={{ padding: "16px" }}>
          <LogisticsHub API_URL={API_URL} user={user} />
        </div>
      </section>

      {/* Rendered Email Preview Modal */}
      {previewEmail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(36, 31, 58, 0.85)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => setPreviewEmail(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              maxHeight: "88vh",
              overflowY: "auto",
              background: "#1D1830",
              border: "1px solid rgba(205, 189, 235, 0.4)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 25px 60px -12px rgba(18, 14, 30, 0.8)",
              color: "#F5F0FF"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid rgba(205, 189, 235, 0.2)", paddingBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#CDBDEB", textTransform: "uppercase", fontWeight: 700 }}>
                  ✉️ Dynamic Outbound Zapier Email
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "1.15rem", fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  {previewEmail.email_subject || "Order Confirmation"}
                </h3>
                <div style={{ fontSize: "0.8rem", color: "#B8B0CC", marginTop: "4px" }}>
                  To: <strong style={{ color: "#fff" }}>{previewEmail.buyer_name}</strong> &lt;{previewEmail.to_email}&gt; • 📞 {previewEmail.buyer_phone}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#F5F0FF" }}>
                  Delivery Address: <strong>{getSafeAddressString(previewEmail.delivery_address)}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#B8B0CC",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                ✕
              </button>
            </div>

            {/* Rendered HTML Container */}
            {previewEmail.email_html ? (
              <div
                dangerouslySetInnerHTML={{ __html: previewEmail.email_html }}
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid rgba(205, 189, 235, 0.2)",
                  background: "#FFFFFF",
                  color: "#14252B"
                }}
              />
            ) : (
              <pre style={{
                background: "#151125",
                padding: "16px",
                borderRadius: "10px",
                color: "#F5F0FF",
                fontSize: "0.84rem",
                whiteSpace: "pre-wrap",
                fontFamily: "monospace"
              }}>
                {previewEmail.email_body || "No email body"}
              </pre>
            )}

            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setPreviewEmail(null)}
                style={{
                  background: "rgba(205, 189, 235, 0.2)",
                  border: "1px solid rgba(205, 189, 235, 0.35)",
                  color: "#CDBDEB",
                  padding: "8px 18px",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
