from auth_service import get_user_by_email

def generate_decision_receipt(transaction):
    selected = transaction.get("selected_product")
    user_email = transaction.get("user_email", "demo@hermora.com")
    user = get_user_by_email(user_email)
    user_limit = user.get("monthly_allowance", 200.0) if user else 200.0

    shipping = transaction.get("shipping_address") or (user.get("shipping_address") if user else None) or {
        "recipient_name": user.get("name", "Aafiya Sheerin") if user else "Aafiya Sheerin",
        "street": "42 Luxury Promenade, Suite 4B",
        "city": "Dubai Marina",
        "country": "United Arab Emirates",
        "phone": "+971 50 123 4567"
    }

    receipt = {
        "transaction_id": transaction.get("transaction_id", "PENDING"),
        "transaction_status": transaction.get("status", "UNKNOWN"),
        "user_email": user_email,
        "shipping_address": shipping,
        "delivery_destination": transaction.get("delivery_destination", shipping),
        "buyer_name": transaction.get("buyer_name", shipping.get("recipient_name")),
        "merchant": transaction.get("merchant", "Hermora Boutique"),
        "selected_product": None,
        "rejected_products": transaction.get("rejected_products", []),
        "upsell_decision": transaction.get("upsell_decision"),
        "policy_decision": transaction.get("policy_decision"),
        "requires_pin": transaction.get("requires_pin", False) or transaction.get("requires_face_id", False),
        "pin_verified": transaction.get("pin_verified", False) or transaction.get("face_verified", False),
        "biometric_verification": transaction.get("biometric_verification", {
            "verified": transaction.get("pin_verified", False) or transaction.get("face_verified", False),
            "method": "4-Digit Security PIN" if (transaction.get("pin_verified") or transaction.get("face_verified")) else "None",
            "confidence": "100% Authorized" if (transaction.get("pin_verified") or transaction.get("face_verified")) else "N/A",
            "audit_hash": transaction.get("biometric_verification", {}).get("audit_hash", "PIN_AUTH_SUCCESS")
        }),
        "monthly_allowance": {
            "monthly_limit_usd": user_limit,
            "remaining_usd": transaction.get("monthly_allowance_remaining", user.get("monthly_remaining", user_limit) if user else user_limit)
        },
        "payment_gateway": "PayPal Sandbox",
        "paypal_order_id": transaction.get("paypal_order_id"),
        "paypal_payment_id": transaction.get("paypal_payment_id"),
        "payment_amount_usd": transaction.get("payment_amount", selected.get("price_usd", selected.get("price", 0.0)) if selected else 0.0),
        "payment_currency": "USD",
        "decision_timeline": []
    }

    if selected:
        price_usd = selected.get("price_usd", selected.get("price", 0.0))
        receipt["selected_product"] = {
            "name": selected.get("name"),
            "category": selected.get("category"),
            "color": selected.get("color"),
            "price_usd": round(float(price_usd), 2),
            "quality": selected.get("quality"),
            "delivery_days": selected.get("delivery_days"),
            "score": selected.get("score")
        }

    for event in transaction.get("audit_log", []):
        receipt["decision_timeline"].append({
            "event": event.get("event_type"),
            "message": event.get("message"),
            "details": event.get("details", {}),
            "timestamp": event.get("timestamp")
        })

    return receipt