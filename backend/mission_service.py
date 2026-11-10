def validate_mission(mission):
    required_fields = {
        "product_type",
        "max_price",
        "max_delivery_days",
        "preferred_quality"
    }

    missing_fields = required_fields - mission.keys()

    if missing_fields:
        return {
            "valid": False,
            "reason": f"Missing mission fields: {sorted(missing_fields)}"
        }

    if mission["max_price"] <= 0:
        return {
            "valid": False,
            "reason": "Maximum price must be greater than zero."
        }

    if mission["max_delivery_days"] <= 0:
        return {
            "valid": False,
            "reason": "Delivery days must be greater than zero."
        }

    return {
        "valid": True,
        "reason": "Mission is valid."
    }