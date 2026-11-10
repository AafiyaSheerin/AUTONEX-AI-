import json
from pathlib import Path

POLICY_PATH = (
    Path(__file__).parent.parent
    / "data"
    / "user_policy.json"
)

def load_policy():
    with open(POLICY_PATH, "r", encoding="utf-8") as file:
        return json.load(file)

def save_policy(policy):
    with open(POLICY_PATH, "w", encoding="utf-8") as file:
        json.dump(policy, file, indent=2)

def update_policy_limits(monthly_allowance_usd, autonomous_limit_usd=15.0):
    policy = load_policy()
    policy["monthly_allowance_usd"] = round(float(monthly_allowance_usd), 2)
    policy["monthly_allowance"] = round(float(monthly_allowance_usd), 2)
    if autonomous_limit_usd is not None:
        policy["autonomous_spend_limit_usd"] = round(float(autonomous_limit_usd), 2)
        policy["autonomous_spend_limit"] = round(float(autonomous_limit_usd), 2)
    save_policy(policy)
    return policy

def evaluate_purchase(price, policy, remaining_allowance_usd=None):
    autonomous_limit = policy.get("autonomous_spend_limit_usd", policy.get("autonomous_spend_limit", 15.0))
    approval_limit = policy.get("approval_limit_usd", policy.get("approval_limit", 500.0))

    price_usd = round(float(price), 2)
    auto_limit_usd = float(autonomous_limit)
    appr_limit_usd = float(approval_limit)

    if remaining_allowance_usd is not None and price_usd > remaining_allowance_usd:
        return {
            "decision": "BLOCK",
            "reason": (
                f"Purchase of ${price_usd:.2f} USD exceeds your remaining "
                f"monthly allowance of ${remaining_allowance_usd:.2f} USD."
            ),
            "price_usd": price_usd,
            "requires_face_id": False
        }

    if price_usd <= auto_limit_usd:
        return {
            "decision": "ALLOW",
            "reason": (
                f"Purchase of ${price_usd:.2f} USD is within your autonomous "
                f"spending limit (${auto_limit_usd:.2f} USD)."
            ),
            "price_usd": price_usd,
            "requires_face_id": False
        }

    if price_usd <= appr_limit_usd:
        return {
            "decision": "REQUIRE_APPROVAL",
            "reason": (
                f"Purchase of ${price_usd:.2f} USD exceeds autonomous micro-limit (${auto_limit_usd:.2f} USD). "
                "Requires 4-Digit Security PIN authorization before PayPal payment."
            ),
            "price_usd": price_usd,
            "requires_pin": True,
            "requires_face_id": False
        }

    return {
        "decision": "BLOCK",
        "reason": (
            f"Purchase of ${price_usd:.2f} USD exceeds the maximum "
            f"allowed spending limit (${appr_limit_usd:.2f} USD)."
        ),
        "price_usd": price_usd,
        "requires_face_id": False
    }

def evaluate_upsell(base_price, upsell_price, policy):
    max_percentage = policy.get("max_upsell_percentage", 10)

    if base_price <= 0:
        return {
            "decision": "BLOCK",
            "reason": "Invalid base product price."
        }

    upsell_percentage = (upsell_price / base_price) * 100

    if upsell_percentage <= max_percentage:
        return {
            "decision": "ALLOW",
            "reason": (
                f"Upsell is {upsell_percentage:.1f}% of the base purchase (${base_price:.2f} USD), "
                f"within the {max_percentage}% limit."
            ),
            "upsell_percentage": round(upsell_percentage, 1)
        }

    return {
        "decision": "BLOCK",
        "reason": (
            f"Upsell is {upsell_percentage:.1f}% of the base purchase (${base_price:.2f} USD), "
            f"exceeding the {max_percentage}% limit."
        ),
        "upsell_percentage": round(upsell_percentage, 1)
    }