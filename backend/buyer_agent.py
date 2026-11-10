import os
import sys
import json
import re
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from dotenv import load_dotenv
try:
    from google import genai
except ImportError:
    genai = None

from mission_service import validate_mission

load_dotenv()

MODEL_NAMES = [
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3.8-flash"
]

MAX_RETRIES = 1

def is_model_not_found_or_unsupported(error_text):
    text = error_text.lower()
    return (
        "404" in error_text
        or "not_found" in text
        or "not found" in text
        or "no longer available" in text
        or "not supported" in text
        or "is not supported" in text
        or "unknown model" in text
    )

def is_retryable_gemini_error(error_text):
    text = error_text.lower()
    return (
        "429" in error_text
        or "resource_exhausted" in text
        or "quota" in text
        or "rate limit" in text
        or "503" in error_text
        or "504" in error_text
        or "deadline expired" in text
        or "unavailable" in text
        or "high demand" in text
    )

def call_gemini_with_retry(client, prompt):
    last_error = None
    for model_name in MODEL_NAMES:
        for attempt in range(MAX_RETRIES):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                return response
            except Exception as exc:
                last_error = exc
                error_text = str(exc)
                if is_model_not_found_or_unsupported(error_text):
                    break
                if not is_retryable_gemini_error(error_text):
                    break
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2 ** (attempt + 1))
                else:
                    break

    raise Exception(f"Gemini unavailable after retries: {last_error}")

def parse_with_local_fallback(user_request):
    text = user_request.lower()

    mission = {
        "product_type": "Abaya",
        "color": "Any",
        "max_price": 60,
        "max_delivery_days": 7,
        "preferred_quality": "Good",
        "priority": "quality"
    }

    if "clothes" in text or "clothing" in text:
        mission["product_type"] = "Clothes"
    elif "shirt" in text or "t-shirt" in text or "tshirt" in text:
        mission["product_type"] = "Clothes"
    elif "blazer" in text or "jacket" in text:
        mission["product_type"] = "Clothes"
    elif "pants" in text or "trousers" in text or "chinos" in text:
        mission["product_type"] = "Clothes"
    elif "abaya" in text:
        mission["product_type"] = "Abaya"
    elif "hijab" in text:
        mission["product_type"] = "Hijab"
    elif "dress" in text:
        mission["product_type"] = "Dress"
    elif "headphone" in text or "earbud" in text or "earphone" in text:
        mission["product_type"] = "Headphones"
    elif "watch" in text:
        mission["product_type"] = "Smartwatch"
    elif "keyboard" in text:
        mission["product_type"] = "Keyboard"
    elif "webcam" in text or "camera" in text:
        mission["product_type"] = "Webcam"
    else:
        words = text.split()
        if len(words) > 0:
            mission["product_type"] = words[0].capitalize()

    known_colors = [
        "black",
        "white",
        "blue",
        "red",
        "green",
        "beige",
        "brown",
        "grey",
        "gray"
    ]

    for color in known_colors:
        if color in text:
            if color == "gray":
                color = "grey"
            mission["color"] = color.capitalize()
            break

    price_match = re.search(r"(?:\$\s*|under\s+|below\s+|less than\s+)(\d{1,6})", text)
    if price_match:
        extracted = int(price_match.group(1))
        if extracted > 300:
            mission["max_price"] = max(1, round(extracted / 85.0))
        else:
            mission["max_price"] = extracted

    delivery_match = re.search(r"(?:within|in)\s+(\d+)\s+days?", text)
    if delivery_match:
        mission["max_delivery_days"] = int(delivery_match.group(1))

    if "premium" in text:
        mission["preferred_quality"] = "Premium"
    elif "standard" in text:
        mission["preferred_quality"] = "Standard"
    elif "good" in text:
        mission["preferred_quality"] = "Good"

    if (
        "quality matters most" in text
        or "best quality" in text
        or "quality first" in text
        or "quality" in text
    ):
        mission["priority"] = "quality"
    elif (
        "cheapest" in text
        or "lowest price" in text
        or "price matters most" in text
    ):
        mission["priority"] = "price"
    elif (
        "fastest" in text
        or "delivery matters most" in text
        or "arrive fastest" in text
    ):
        mission["priority"] = "delivery"

    val = validate_mission(mission)
    if not val.get("valid"):
        return {
            "success": False,
            "mission": None,
            "error": val.get("reason", "Invalid mission.")
        }

    mission["original_request"] = user_request
    mission["interpretation_source"] = "LOCAL_FALLBACK"

    return {
        "success": True,
        "mission": mission,
        "error": None
    }

def parse_shopping_request(user_request):
    if not user_request or not user_request.strip():
        return {
            "success": False,
            "mission": None,
            "error": "Shopping request cannot be empty."
        }

    api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY") or "").strip()

    if not api_key:
        return parse_with_local_fallback(user_request)

    try:
        from google.genai import types

        http_opts = types.HttpOptions(
            retry_options=types.HttpRetryOptions(attempts=1),
            timeout=12000
        )

        client = genai.Client(
            api_key=api_key,
            http_options=http_opts
        )

        prompt = f"""
You are the Buyer Agent for Hermora luxury shopping platform.
Convert the following shopping mission into a clean structured JSON format:

Request: {user_request}

Return ONLY valid JSON matching this schema:
{{
    "product_type": "string describing product category or specific name (e.g. 'Abaya', 'Headphones', 'Midnight Abaya')",
    "color": "explicit color if mentioned separately from model names (e.g. 'black abaya' -> 'Black'). For named items like 'Midnight Abaya', return 'Black' or 'Any' unless another distinct color is requested. If unspecified, return 'Any'",
    "max_price": number (the price/budget limit in USD, e.g. 38 or 47. Must be a positive number),
    "max_delivery_days": number (delivery limit in days, e.g. 2 or 7. Must be a positive integer),
    "preferred_quality": "Premium", "Good", or "Standard",
    "priority": "quality", "price", or "delivery"
}}
"""

        response = call_gemini_with_retry(client, prompt)
        raw_response = response.text.strip().replace("```json", "").replace("```", "").strip()

        mission = json.loads(raw_response)

        # Rescue missing/zero max_price from request text if needed
        if mission.get("max_price", 0) <= 0:
            price_match = re.search(r"(?:\$\s*|under\s+|below\s+|less than\s+)(\d{1,6})", user_request.lower())
            if price_match:
                mission["max_price"] = int(price_match.group(1))

        # Normalize empty/n/a colors to 'Any'
        if not mission.get("color") or str(mission.get("color")).lower() in ["n/a", "na", "none", "null", "undefined"]:
            mission["color"] = "Any"

        val = validate_mission(mission)
        if not val.get("valid"):
            return {
                "success": False,
                "mission": None,
                "error": val.get("reason", "Invalid mission constraints.")
            }

        mission["original_request"] = user_request
        mission["interpretation_source"] = "GEMINI"

        return {
            "success": True,
            "mission": mission,
            "error": None
        }

    except json.JSONDecodeError:
        return parse_with_local_fallback(user_request)
    except Exception:
        fallback_result = parse_with_local_fallback(user_request)
        if fallback_result.get("success"):
            return fallback_result

        return {
            "success": False,
            "mission": None,
            "error": "Buyer Agent failed to interpret shopping request."
        }