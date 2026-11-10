from catalog_service import load_catalog

def normalize_text(value):
    return str(value).strip().lower()

def filter_products(
    products,
    product_type,
    color,
    max_price,
    max_delivery_days
):
    eligible = []
    rejected = []

    requested_type = normalize_text(product_type)
    requested_color = normalize_text(color)

    for product in products:
        reasons = []

        product_category = normalize_text(product.get("category", ""))
        product_name = normalize_text(product.get("name", ""))
        product_tags = [normalize_text(t) for t in product.get("tags", [])]
        product_color = normalize_text(product.get("color", ""))

        is_type_match = False
        if requested_type == product_category:
            is_type_match = True
        elif product_category in requested_type or requested_type in product_category:
            is_type_match = True
        elif requested_type in product_name:
            is_type_match = True
        elif any(requested_type in tag or tag in requested_type for tag in product_tags):
            is_type_match = True
        else:
            req_words = [
                w for w in requested_type.split()
                if len(w) > 3 and w not in ["with", "need", "want", "find", "best", "good", "nice", "type"]
            ]
            if req_words and any(
                w in product_category or w in product_name or any(w in tag for tag in product_tags)
                for w in req_words
            ):
                is_type_match = True

        if not is_type_match:
            reasons.append(f"category does not match requested {product_type}")

        IGNORED_COLORS = ["any", "", "all", "none", "n/a", "na", "not specified", "unspecified", "no color", "null", "undefined"]
        
        color_matches = False
        if requested_color in IGNORED_COLORS:
            color_matches = True
        elif not product_color or product_color in IGNORED_COLORS:
            color_matches = True
        elif product_color == requested_color or requested_color in product_color or product_color in requested_color:
            color_matches = True
        elif requested_color in product_name or any(requested_color in tag for tag in product_tags):
            color_matches = True
        elif requested_color in ["midnight", "onyx", "charcoal", "obsidian", "pitch"] and product_color in ["black", "dark blue", "navy"]:
            color_matches = True
        elif requested_color in ["ivory", "cream", "pearl"] and product_color in ["white", "beige"]:
            color_matches = True
        elif requested_color in ["emerald", "sage", "olive"] and product_color in ["green"]:
            color_matches = True
        elif requested_color in ["ruby", "burgundy", "crimson", "wine", "maroon"] and product_color in ["red"]:
            color_matches = True
        elif requested_color in ["gold", "rose gold"] and product_color in ["gold", "yellow", "pink"]:
            color_matches = True

        if not color_matches:
            reasons.append(f"color does not match requested {color}")

        if product["price"] > max_price:
            reasons.append("price exceeds budget")

        if product["delivery_days"] > max_delivery_days:
            reasons.append(
                f"delivery takes {product['delivery_days']} days, which exceeds the {max_delivery_days}-day limit"
            )

        if product["stock"] <= 0:
            reasons.append("product is out of stock")

        if reasons:
            rejected.append({
                "product": product["name"],
                "reasons": reasons
            })
        else:
            eligible.append(product)

    return eligible, rejected

def score_product(
    product,
    preferred_quality,
    priority
):
    quality_scores = {
        "premium": 3,
        "good": 2,
        "standard": 1
    }

    product_quality = normalize_text(product["quality"])
    preferred_quality_normalized = normalize_text(preferred_quality)
    priority = normalize_text(priority)

    quality_score = quality_scores.get(product_quality, 0)

    if product_quality == preferred_quality_normalized:
        quality_score += 2

    price_score = max(0, 5 - (product["price"] / 1000))
    delivery_score = max(0, 5 - product["delivery_days"])

    if priority == "quality":
        final_score = quality_score * 3 + delivery_score + price_score
    elif priority == "price":
        final_score = price_score * 3 + quality_score + delivery_score
    elif priority == "delivery":
        final_score = delivery_score * 3 + quality_score + price_score
    else:
        final_score = quality_score + price_score + delivery_score

    return round(final_score, 2)

def recommend_product(
    product_type,
    color,
    max_price,
    max_delivery_days,
    preferred_quality,
    priority
):
    catalog = load_catalog()

    eligible, rejected = filter_products(
        products=catalog["products"],
        product_type=product_type,
        color=color,
        max_price=max_price,
        max_delivery_days=max_delivery_days
    )

    scored_products = []

    for product in eligible:
        product_with_score = product.copy()
        product_with_score["score"] = score_product(
            product=product,
            preferred_quality=preferred_quality,
            priority=priority
        )
        scored_products.append(product_with_score)

    scored_products.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    selected = scored_products[0] if scored_products else None

    return {
        "selected": selected,
        "eligible_products": scored_products,
        "rejected_products": rejected
    }