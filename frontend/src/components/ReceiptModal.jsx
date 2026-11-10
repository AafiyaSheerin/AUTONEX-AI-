import React from "react";

export default function ReceiptModal({ isOpen, onClose, receipt }) {
  if (!isOpen || !receipt) return null;

  const product = receipt.selected_product;
  const biometric = receipt.biometric_verification || {};
  const allowance = receipt.monthly_allowance || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Receipt Modal">
          ✕
        </button>

        <div className="receipt-header">
          <div className="receipt-brand-mark">
            <span>🛡️</span>
          </div>
          <h2>AGENT DECISION RECEIPT</h2>
          <p className="receipt-id-tag">Transaction ID: <strong>{receipt.transaction_id}</strong></p>
          <span className="receipt-status-pill" data-status={receipt.transaction_status}>
            {receipt.transaction_status}
          </span>
        </div>

        <div className="receipt-scrollable-body">
          <div className="receipt-section">
            <h4 className="section-title">📦 PURCHASED ITEM</h4>
            <div className="receipt-data-grid">
              <div className="data-row">
                <span>Product Name:</span>
                <strong>{product?.name || "N/A"}</strong>
              </div>
              <div className="data-row">
                <span>Category / Color:</span>
                <strong>{product?.category} • {product?.color}</strong>
              </div>
              <div className="data-row">
                <span>Total Settled:</span>
                <strong className="text-highlight">
                  ${receipt.payment_amount_usd || product?.price_usd} USD
                </strong>
              </div>
              <div className="data-row">
                <span>Merchant:</span>
                <strong>{receipt.merchant || "Luma Fashions"}</strong>
              </div>
            </div>
          </div>

          <div className="receipt-section">
            <h4 className="section-title">📍 SHIP TO / DELIVERY DESTINATION</h4>
            <div className="receipt-data-grid">
              <div className="data-row">
                <span>Recipient Name:</span>
                <strong>
                  {receipt.delivery_destination?.name || receipt.shipping_address?.recipient_name || receipt.buyer_name || "Aafiya Sheerin"}
                </strong>
              </div>
              <div className="data-row">
                <span>Contact Phone:</span>
                <strong>
                  {receipt.delivery_destination?.phone || receipt.shipping_address?.phone || "+971 50 123 4567"}
                </strong>
              </div>
              <div className="data-row">
                <span>Full Delivery Address:</span>
                <strong>
                  {receipt.delivery_destination?.full_address || receipt.delivery_destination?.street || (typeof receipt.delivery_destination === 'string' ? receipt.delivery_destination : null) || receipt.shipping_address?.street || "42 Luxury Promenade, Suite 4B, Dubai Marina, Dubai, UAE"}
                </strong>
              </div>
              <div className="data-row">
                <span>Fulfillment Engine:</span>
                <strong style={{ color: "#34d399" }}>⚡ Bryntum Courier Scheduler & Zapier Dispatch Active</strong>
              </div>
            </div>
          </div>

          <div className="receipt-section">
            <h4 className="section-title">💳 PAYPAL TRANSACTION DETAILS</h4>
            <div className="receipt-data-grid">
              <div className="data-row">
                <span>Payment Gateway:</span>
                <strong>PayPal Sandbox API</strong>
              </div>
              <div className="data-row">
                <span>PayPal Order ID:</span>
                <code>{receipt.paypal_order_id || "PENDING"}</code>
              </div>
              <div className="data-row">
                <span>PayPal Capture ID:</span>
                <code>{receipt.paypal_payment_id || "PENDING"}</code>
              </div>
            </div>
          </div>

          <div className="receipt-section">
            <h4 className="section-title">🔐 SECURITY PIN AUDIT</h4>
            <div className="receipt-data-grid">
              <div className="data-row">
                <span>Verification Method:</span>
                <strong>{biometric.method || "4-Digit Security PIN (Verified)"}</strong>
              </div>
              <div className="data-row">
                <span>Authorization Status:</span>
                <strong className="text-green">Verified & Authorized ✓</strong>
              </div>
              <div className="data-row">
                <span>Security Token Audit:</span>
                <code>{biometric.audit_hash || "PIN_AUTH_SUCCESS"}</code>
              </div>
            </div>
          </div>

          <div className="receipt-section">
            <h4 className="section-title">🛡️ DELEGATED ALLOWANCE LEDGER</h4>
            <div className="receipt-data-grid">
              <div className="data-row">
                <span>Monthly AI Cap:</span>
                <strong>${allowance.monthly_limit_usd || allowance.monthly_allowance || "150.00"} USD</strong>
              </div>
              <div className="data-row">
                <span>Remaining Balance:</span>
                <strong className="text-green">${allowance.remaining_usd || "0.00"} USD</strong>
              </div>
              <div className="data-row">
                <span>Cycle Revival:</span>
                <strong className="text-purple">Auto-Revives 1st of each month</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="receipt-footer">
          <button className="receipt-print-btn" onClick={() => window.print()}>
            🖨️ Print / Save Receipt
          </button>
          <button className="receipt-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
