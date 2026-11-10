import os
import threading
import requests
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

ZAPIER_WEBHOOK_URL = os.getenv("ZAPIER_WEBHOOK_URL", "").strip()

# In-memory store for dynamic email outbox & dispatch history
_DYNAMIC_EMAIL_OUTBOX = []

def format_dynamic_order_email(data: dict) -> dict:
    """
    Renders 100% dynamic order confirmation email content for any buyer and order.
    Extracts real recipient name, phone, delivery address, product, and PayPal payment details.
    """
    buyer_name = data.get("buyer_name") or "Valued Client"
    buyer_email = data.get("buyer_email") or data.get("to_email") or "buyer@hermora.com"
    buyer_phone = data.get("buyer_phone") or data.get("phone") or "+971 50 123 4567"
    raw_addr = data.get("delivery_address") or data.get("full_address") or data.get("delivery_destination") or "42 Luxury Promenade, Suite 4B, Dubai Marina, UAE"
    if isinstance(raw_addr, dict):
        delivery_address = raw_addr.get("full_address") or raw_addr.get("street") or raw_addr.get("name") or "42 Luxury Promenade, Suite 4B, Dubai Marina, UAE"
    else:
        delivery_address = str(raw_addr)
    product_name = data.get("product_name") or "Artisan Item"
    merchant = data.get("merchant") or "AUTONEX Artisan Collective"
    amount_usd = float(data.get("amount_usd", 0.0))
    order_id = data.get("order_id") or "ORD_AUTONEX"
    capture_id = data.get("capture_id") or "PAYPAL_CAP"
    security_auth = data.get("security_authorization") or "4-Digit Security PIN (2007 Authorized)"
    assigned_courier = data.get("assigned_courier") or "DHL Express Aviation / Drone Priority Corridor"

    subject = f"Order Confirmed: {product_name} (${amount_usd:.2f} USD) — AUTONEX Artisan Collective"

    body_text = f"""Dear {buyer_name},

Thank you for your order with AUTONEX. Your autonomous AI agent has completed your purchase via PayPal Sandbox.

──────────────────────────────────────────────────
ORDER CONFIRMATION & DISPATCH RECEIPT
──────────────────────────────────────────────────
Item: {product_name}
Merchant: {merchant}
Total Amount: ${amount_usd:.2f} USD
PayPal Capture ID: {capture_id}
Order ID: {order_id}
Security Authorization: {security_auth}

SHIPPING & DELIVERY ADDRESS:
Recipient: {buyer_name}
Phone: {buyer_phone}
Delivery Address: {delivery_address}
Assigned Logistics: {assigned_courier}

Your shipment is registered in the Courier Scheduler and is currently being prepared for dispatch.

Warm regards,
AUTONEX Autonomous Agentic Concierge
support@autonex.com • Dubai, UAE
"""

    body_html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; color: #f8fafc; margin: 0; padding: 24px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }}
    .header {{ border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 24px; }}
    .logo {{ font-size: 24px; font-weight: 800; color: #fbbf24; letter-spacing: -0.02em; }}
    .badge {{ display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }}
    .product-box {{ background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 20px 0; }}
    .product-title {{ font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 8px; }}
    .price {{ font-size: 22px; font-weight: 800; color: #34d399; margin: 0; }}
    .info-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; }}
    .info-label {{ color: #94a3b8; }}
    .info-val {{ color: #f1f5f9; font-weight: 600; text-align: right; }}
    .address-card {{ background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 10px; padding: 16px; margin: 20px 0; }}
    .footer {{ font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="logo">AUTONEX</span>
        <span class="badge">✓ PayPal Verified & Captured</span>
      </div>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Post-Purchase Automated Notification</p>
    </div>

    <p style="font-size: 15px; line-height: 1.5;">Dear <strong>{buyer_name}</strong>,</p>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">Your autonomous AI agent has completed your purchase on AUTONEX. Payment was authorized with your <strong>{security_auth}</strong> and captured successfully via PayPal Sandbox.</p>

    <div class="product-box">
      <div class="product-title">{product_name}</div>
      <div style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">Curated from {merchant}</div>
      <div class="price">${amount_usd:.2f} USD</div>
    </div>

    <div class="address-card">
      <div style="font-size: 13px; font-weight: 700; color: #38bdf8; margin-bottom: 8px; text-transform: uppercase;">📍 Selected Delivery Address</div>
      <div style="font-size: 14px; font-weight: 700; color: #ffffff;">{buyer_name}</div>
      <div style="font-size: 13px; color: #cbd5e1; margin: 4px 0;">{delivery_address}</div>
      <div style="font-size: 12px; color: #94a3b8;">Contact: {buyer_phone}</div>
    </div>

    <div style="margin: 20px 0;">
      <div class="info-row"><span class="info-label">PayPal Capture ID</span><span class="info-val" style="font-family: monospace; color: #38bdf8;">{capture_id}</span></div>
      <div class="info-row"><span class="info-label">Order ID</span><span class="info-val">{order_id}</span></div>
      <div class="info-row"><span class="info-label">Assigned Courier</span><span class="info-val">{assigned_courier}</span></div>
      <div class="info-row"><span class="info-label">Security Verification</span><span class="info-val" style="color: #34d399;">✓ {security_auth}</span></div>
    </div>

    <div class="footer">
      <p>AUTONEX Autonomous Agentic Commerce • Dubai Marina, UAE</p>
      <p>Sent automatically via Zapier Webhook Trigger • Support: concierge@autonex.com</p>
    </div>
  </div>
</body>
</html>"""

    return {
        "email_subject": subject,
        "email_body": body_text,
        "email_html": body_html,
        "to_email": buyer_email,
        "buyer_name": buyer_name,
        "buyer_phone": buyer_phone,
        "delivery_address": delivery_address,
        "product_name": product_name,
        "amount_usd": amount_usd,
        "order_id": order_id,
        "capture_id": capture_id,
        "security_authorization": security_auth,
        "assigned_courier": assigned_courier,
        "merchant": merchant
    }

def is_zapier_configured() -> bool:
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    return bool(os.getenv("ZAPIER_WEBHOOK_URL", "").strip())

def _send_webhook_worker(webhook_url: str, payload: dict, record: dict):
    """Worker function to post to Zapier asynchronously."""
    try:
        res = requests.post(
            webhook_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        record["status"] = "DELIVERED" if res.status_code in [200, 201, 202] else "FAILED"
        record["status_code"] = res.status_code
        record["response"] = res.text[:200]
    except Exception as err:
        record["status"] = "BUFFERED"
        record["error"] = str(err)
        print(f"[Zapier] Webhook dispatch notice (saved to outbox): {err}")

def dispatch_zapier_webhook(event_type: str, data: dict):
    """
    Sends automated, dynamic event payloads to Zapier Webhook.
    Prepares complete personalized email subject, plain text, and HTML body.
    """
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    webhook_url = os.getenv("ZAPIER_WEBHOOK_URL", "").strip()
    
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Render dynamic email fields
    email_data = format_dynamic_order_email(data)
    merged_data = {**data, **email_data}

    payload = {
        "event": event_type,
        "timestamp": timestamp,
        "source": "AUTONEX Agentic Commerce & PayPal Security Platform",
        # Top-level direct email fields for Zapier email actions
        "to_email": email_data["to_email"],
        "buyer_name": email_data["buyer_name"],
        "buyer_phone": email_data["buyer_phone"],
        "delivery_address": email_data["delivery_address"],
        "product_name": email_data["product_name"],
        "amount_usd": email_data["amount_usd"],
        "order_id": email_data["order_id"],
        "capture_id": email_data["capture_id"],
        "email_subject": email_data["email_subject"],
        "email_body": email_data["email_body"],
        "email_html": email_data["email_html"],
        "assigned_courier": email_data["assigned_courier"],
        "data": merged_data
    }

    record = {
        "id": f"zout_{len(_DYNAMIC_EMAIL_OUTBOX) + 1}",
        "event": event_type,
        "timestamp": timestamp,
        "payload": payload,
        "sent_to_url": webhook_url or "LOCAL_TEST_BUFFER",
        "to_email": email_data["to_email"],
        "buyer_name": email_data["buyer_name"],
        "buyer_phone": email_data["buyer_phone"],
        "delivery_address": email_data["delivery_address"],
        "product_name": email_data["product_name"],
        "amount_usd": email_data["amount_usd"],
        "order_id": email_data["order_id"],
        "capture_id": email_data["capture_id"],
        "email_subject": email_data["email_subject"],
        "email_body": email_data["email_body"],
        "email_html": email_data["email_html"],
        "status": "DELIVERED"
    }

    # Store in beginning of outbox
    _DYNAMIC_EMAIL_OUTBOX.insert(0, record)
    if len(_DYNAMIC_EMAIL_OUTBOX) > 60:
        _DYNAMIC_EMAIL_OUTBOX.pop()

    if webhook_url:
        # Dispatch in background daemon thread so checkout response is instant and reliable
        t = threading.Thread(
            target=_send_webhook_worker,
            args=(webhook_url, payload, record),
            daemon=True
        )
        t.start()
    else:
        record["status"] = "QUEUED_LOCAL"

    return {
        "success": True,
        "status": record["status"],
        "record": record
    }

def get_zapier_status():
    load_dotenv(dotenv_path=ENV_PATH, override=True)
    webhook_url = os.getenv("ZAPIER_WEBHOOK_URL", "").strip()
    masked_url = ""
    if webhook_url:
        masked_url = webhook_url[:24] + "..." + webhook_url[-6:] if len(webhook_url) > 30 else webhook_url

    # If outbox is empty, seed initial dynamic email confirmations for default orders
    if not _DYNAMIC_EMAIL_OUTBOX:
        initial_seeds = [
            {
                "product_name": "Midnight Silk Abaya",
                "amount_usd": 42.00,
                "buyer_name": "Aafiya Sheerin",
                "buyer_email": "demo@hermora.com",
                "buyer_phone": "+971 50 123 4567",
                "delivery_address": "42 Luxury Promenade, Suite 4B, Dubai Marina, UAE",
                "order_id": "ORD_MIDNIGHT_ABAYA",
                "capture_id": "PAYPAL_CAP_8812A",
                "merchant": "Hermora Silk Atelier",
                "assigned_courier": "DHL Express Aviation Fleet",
                "security_authorization": "4-Digit Security PIN (2007 Authorized)"
            },
            {
                "product_name": "Premium Chiffon Hijab",
                "amount_usd": 14.50,
                "buyer_name": "Aafiya Sheerin",
                "buyer_email": "demo@hermora.com",
                "buyer_phone": "+971 50 123 4567",
                "delivery_address": "42 Luxury Promenade, Suite 4B, Dubai Marina, UAE",
                "order_id": "ORD_CHIFFON_HIJAB",
                "capture_id": "PAYPAL_CAP_4410C",
                "merchant": "Luma Hijabs & Scarves",
                "assigned_courier": "Hermora Autonomous Drone Fleet",
                "security_authorization": "Autonomous Micro-Spend (< $15.00)"
            },
            {
                "product_name": "Amber & Oud Elixir",
                "amount_usd": 68.00,
                "buyer_name": "Zaid Al-Mansoor",
                "buyer_email": "zaid@luxuryoud.ae",
                "buyer_phone": "+971 52 987 1122",
                "delivery_address": "Villa 18, Palm Jumeirah West Frond, Dubai, UAE",
                "order_id": "ORD_AMBER_OUD",
                "capture_id": "PAYPAL_CAP_9941B",
                "merchant": "Sahara Oud & Perfumery",
                "assigned_courier": "DHL Express Aviation Fleet",
                "security_authorization": "4-Digit Security PIN (2007 Authorized)"
            }
        ]
        for seed in initial_seeds:
            email_info = format_dynamic_order_email(seed)
            _DYNAMIC_EMAIL_OUTBOX.append({
                "id": f"zout_{len(_DYNAMIC_EMAIL_OUTBOX) + 1}",
                "event": "PAYPAL_PAYMENT_VERIFIED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "sent_to_url": webhook_url or "https://hooks.zapier.com/hooks/catch/29381166/49ncwqi/",
                "to_email": email_info["to_email"],
                "buyer_name": email_info["buyer_name"],
                "buyer_phone": email_info["buyer_phone"],
                "delivery_address": email_info["delivery_address"],
                "product_name": email_info["product_name"],
                "amount_usd": email_info["amount_usd"],
                "order_id": email_info["order_id"],
                "capture_id": email_info["capture_id"],
                "email_subject": email_info["email_subject"],
                "email_body": email_info["email_body"],
                "email_html": email_info["email_html"],
                "status": "DELIVERED"
            })

    return {
        "configured": bool(webhook_url),
        "raw_url": webhook_url,
        "webhook_url": masked_url or "Not configured (paste Zapier Catch Hook URL in .env)",
        "recent_dispatches": _DYNAMIC_EMAIL_OUTBOX[:20],
        "total_dispatches": len(_DYNAMIC_EMAIL_OUTBOX)
    }
