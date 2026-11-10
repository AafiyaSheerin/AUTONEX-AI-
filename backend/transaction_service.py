from catalog_service import load_catalog
from recommendation_engine import recommend_product
from policy_engine import (
    load_policy,
    evaluate_purchase,
    evaluate_upsell
)
from audit_service import add_audit_event
from auth_service import get_user_by_email

def process_shopping_mission(
    product_type,
    color,
    max_price,
    max_delivery_days,
    preferred_quality,
    priority,
    proposed_upsell=None,
    user_email="demo@hermora.com"
):
    audit_log = []

    add_audit_event(
        audit_log,
        "MISSION_RECEIVED",
        "Shopping mission received.",
        {
            "product_type": product_type,
            "color": color,
            "max_price": max_price,
            "max_delivery_days": max_delivery_days,
            "preferred_quality": preferred_quality,
            "priority": priority,
            "user_email": user_email
        }
    )

    catalog = load_catalog()

    recommendation = recommend_product(
        product_type=product_type,
        color=color,
        max_price=max_price,
        max_delivery_days=max_delivery_days,
        preferred_quality=preferred_quality,
        priority=priority
    )

    for rejected_product in recommendation["rejected_products"]:
        add_audit_event(
            audit_log,
            "PRODUCT_REJECTED",
            f"{rejected_product['product']} rejected.",
            {
                "product": rejected_product["product"],
                "reasons": rejected_product["reasons"]
            }
        )

    selected_product = recommendation["selected"]

    if selected_product is None:
        try:
            from channel3_service import search_channel3_inventory
            c3_query = f"{color or ''} {product_type}".strip()
            c3_result = search_channel3_inventory(query=c3_query, max_price=max_price)
            if c3_result.get("products") and len(c3_result["products"]) > 0:
                c3_match = c3_result["products"][0]
                selected_product = {
                    "id": c3_match.get("id"),
                    "name": c3_match.get("name"),
                    "category": product_type or "Luxury Wear",
                    "color": color or "Signature",
                    "price": float(c3_match.get("price", 49.99)),
                    "price_usd": float(c3_match.get("price", 49.99)),
                    "quality": "Channel3 Verified Luxury",
                    "delivery_days": c3_match.get("delivery_days", 2),
                    "merchant": c3_match.get("merchant", "Channel3 Multi-Merchant Network"),
                    "image_emoji": c3_match.get("image_emoji", "🛍️"),
                    "image_url": c3_match.get("image_url", ""),
                    "description": c3_match.get("description", ""),
                    "source": "Channel3 AI Agent Sourcing API",
                    "score": 9.6
                }
                add_audit_event(
                    audit_log,
                    "CHANNEL3_AUTONOMOUS_SOURCE",
                    f"Sourced via Channel3 Multi-Merchant API: {selected_product['name']} from {selected_product['merchant']} at ${selected_product['price']:.2f} USD.",
                    {
                        "source": "Channel3 AI Agent Commerce API",
                        "product": selected_product["name"],
                        "price": selected_product["price"],
                        "merchant": selected_product["merchant"]
                    }
                )
        except Exception as c3_err:
            print(f"[Channel3] Fallback search error: {c3_err}")

    if selected_product is None:
        add_audit_event(
            audit_log,
            "NO_MATCH",
            "No product satisfied all buyer constraints.",
            {
                "product_type": product_type,
                "color": color,
                "priority": priority
            }
        )

        return {
            "status": "NO_MATCH",
            "merchant": catalog["merchant"]["name"],
            "recommendation": recommendation,
            "audit_log": audit_log,
            "message": "No product matched the buyer's requirements."
        }

    raw_price = selected_product["price"]
    price_usd = round(float(raw_price), 2)
    selected_product["price_usd"] = price_usd

    add_audit_event(
        audit_log,
        "PRODUCT_SELECTED",
        f"{selected_product['name']} selected (${price_usd:.2f} USD).",
        {
            "product": selected_product["name"],
            "category": selected_product["category"],
            "color": selected_product["color"],
            "price": price_usd,
            "price_usd": price_usd,
            "quality": selected_product["quality"],
            "score": selected_product["score"],
            "priority": priority
        }
    )

    policy = load_policy()
    user = get_user_by_email(user_email)
    default_allowance = policy.get("monthly_allowance_usd", 150.0)
    remaining_allowance = user.get("monthly_remaining", user.get("monthly_allowance", default_allowance)) if user else default_allowance

    upsell_result = None

    if proposed_upsell is None and selected_product and selected_product.get("suggested_upsell"):
        proposed_upsell = selected_product["suggested_upsell"]

    if proposed_upsell:
        add_audit_event(
            audit_log,
            "UPSELL_PROPOSED",
            f"{proposed_upsell['name']} proposed by merchant (${proposed_upsell['price']:.2f} USD).",
            {
                "upsell": proposed_upsell["name"],
                "price": proposed_upsell["price"]
            }
        )

        upsell_decision = evaluate_upsell(
            base_price=price_usd,
            upsell_price=proposed_upsell["price"],
            policy=policy
        )

        upsell_result = {
            "name": proposed_upsell["name"],
            "price": proposed_upsell["price"],
            "decision": upsell_decision["decision"],
            "reason": upsell_decision["reason"],
            "percentage": upsell_decision.get("upsell_percentage", 0)
        }

        add_audit_event(
            audit_log,
            "UPSELL_POLICY_CHECK",
            upsell_decision["reason"],
            {
                "upsell": proposed_upsell["name"],
                "upsell_price": proposed_upsell["price"],
                "decision": upsell_decision["decision"],
                "percentage": upsell_decision.get("upsell_percentage", 0)
            }
        )

    policy_decision = evaluate_purchase(
        price_usd,
        policy,
        remaining_allowance_usd=remaining_allowance
    )

    add_audit_event(
        audit_log,
        "POLICY_CHECK",
        policy_decision["reason"],
        {
            "decision": policy_decision["decision"],
            "price_usd": price_usd,
            "remaining_monthly_allowance": remaining_allowance,
            "requires_pin": policy_decision.get("requires_pin", False)
        }
    )

    if policy_decision["decision"] == "ALLOW":
        status = "READY_FOR_PAYMENT"
    elif policy_decision["decision"] == "REQUIRE_APPROVAL":
        status = "AWAITING_HUMAN_APPROVAL"
    else:
        status = "BLOCKED"

    return {
        "status": status,
        "user_email": user_email,
        "merchant": selected_product.get("merchant", catalog["merchant"]["name"]) if selected_product else catalog["merchant"]["name"],
        "selected_product": selected_product,
        "price_usd": price_usd,
        "monthly_allowance_remaining": remaining_allowance,
        "requires_pin": policy_decision.get("requires_pin", False),
        "pin_verified": False,
        "requires_face_id": False,
        "face_verified": True,
        "policy_decision": policy_decision,
        "upsell_decision": upsell_result,
        "rejected_products": recommendation["rejected_products"],
        "recommendation": recommendation,
        "audit_log": audit_log
    }