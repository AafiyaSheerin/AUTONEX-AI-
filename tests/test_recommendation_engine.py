import sys
from pathlib import Path

BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.append(str(BACKEND_PATH))

from recommendation_engine import score_product


def test_quality_priority_rewards_quality_more():
    product = {
        "name": "Test Product",
        "price": 3000,
        "quality": "Premium",
        "delivery_days": 2
    }

    quality_score = score_product(
        product=product,
        preferred_quality="Premium",
        priority="quality"
    )

    price_score = score_product(
        product=product,
        preferred_quality="Premium",
        priority="price"
    )

    assert quality_score > price_score


def test_price_priority_rewards_cheaper_product():
    cheap_product = {
        "name": "Cheap Product",
        "price": 2000,
        "quality": "Good",
        "delivery_days": 2
    }

    expensive_product = {
        "name": "Expensive Product",
        "price": 3800,
        "quality": "Good",
        "delivery_days": 2
    }

    cheap_score = score_product(
        product=cheap_product,
        preferred_quality="Good",
        priority="price"
    )

    expensive_score = score_product(
        product=expensive_product,
        preferred_quality="Good",
        priority="price"
    )

    assert cheap_score > expensive_score


def test_delivery_priority_rewards_faster_product():
    fast_product = {
        "name": "Fast Product",
        "price": 3000,
        "quality": "Good",
        "delivery_days": 1
    }

    slow_product = {
        "name": "Slow Product",
        "price": 3000,
        "quality": "Good",
        "delivery_days": 3
    }

    fast_score = score_product(
        product=fast_product,
        preferred_quality="Good",
        priority="delivery"
    )

    slow_score = score_product(
        product=slow_product,
        preferred_quality="Good",
        priority="delivery"
    )

    assert fast_score > slow_score


def test_midnight_abaya_matched_when_model_name_or_color_is_midnight():
    from recommendation_engine import recommend_product
    # When user asks for Midnight Abaya, color might be extracted as Midnight or Black
    res_midnight_color = recommend_product(
        product_type="Midnight Abaya",
        color="Midnight",
        max_price=47,
        max_delivery_days=2,
        preferred_quality="Premium",
        priority="quality"
    )
    assert res_midnight_color["selected"] is not None
    assert res_midnight_color["selected"]["name"] == "Midnight Abaya"

    res_black_color = recommend_product(
        product_type="Midnight Abaya",
        color="Black",
        max_price=47,
        max_delivery_days=2,
        preferred_quality="Premium",
        priority="quality"
    )
    assert res_black_color["selected"] is not None
    assert res_black_color["selected"]["name"] == "Midnight Abaya"
