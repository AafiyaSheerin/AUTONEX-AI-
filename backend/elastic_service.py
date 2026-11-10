import os
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

ELASTIC_URL = os.getenv("ELASTICSEARCH_URL", "").strip()
ELASTIC_API_KEY = os.getenv("ELASTICSEARCH_API_KEY", "").strip()

# In-memory storage for Elastic simulation / fallback
_IN_MEMORY_PRODUCT_INDEX = []
_IN_MEMORY_SECURITY_LOGS = [
    {
        "id": "sec_01",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "PIN_AUTHORIZATION_SUCCESS",
        "severity": "INFO",
        "details": {
            "authorized_by": "Aafiya Sheerin (demo@hermora.com)",
            "auth_method": "Security PIN Authorization",
            "order_id": "ORD_MIDNIGHT_ABAYA",
            "amount_usd": 42.00,
            "status": "UNLOCKED_PAYPAL_EXECUTION"
        }
    },
    {
        "id": "sec_02",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "AUTONOMOUS_LIMIT_CHECK",
        "severity": "INFO",
        "details": {
            "buyer": "Aafiya Sheerin",
            "transaction_value": 14.50,
            "autonomous_threshold": 15.00,
            "result": "PASS_AUTONOMOUS_MICRO_SPEND",
            "biometric_required": False
        }
    },
    {
        "id": "sec_03",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "PAYPAL_SANDBOX_TOKEN_VERIFIED",
        "severity": "INFO",
        "details": {
            "mode": "sandbox",
            "client_id": "BAA21NIAHiC0yfZ1O...EBTzc",
            "token_scope": "https://api.paypal.com/v1/payments/.*",
            "status": "VALID_ACTIVE"
        }
    },
    {
        "id": "sec_04",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "FRAUD_SHIELD_EVALUATION",
        "severity": "INFO",
        "details": {
            "anomaly_score": 0.02,
            "geo_consistency": "MATCH_DUBAI_UAE",
            "velocity_check": "NORMAL",
            "decision": "TRUSTED_AGENTIC_SESSION"
        }
    }
]

def is_elastic_configured() -> bool:
    return bool(ELASTIC_URL)

def get_elastic_client():
    """Returns official Elasticsearch client if installed and configured, else None."""
    if not is_elastic_configured():
        return None
    try:
        from elasticsearch import Elasticsearch
        if ELASTIC_API_KEY:
            return Elasticsearch(ELASTIC_URL, api_key=ELASTIC_API_KEY)
        return Elasticsearch(ELASTIC_URL)
    except Exception as e:
        print(f"[Elastic] Could not connect to cluster: {e}")
        return None

def index_all_products(products: list):
    """Indexes catalog products into Elastic search engine."""
    client = get_elastic_client()
    if client:
        try:
            for p in products:
                client.index(index="hermora_products", id=p.get("id"), document=p)
            print(f"[Elastic] Indexed {len(products)} products into hermora_products.")
            return {"success": True, "indexed": len(products), "mode": "live_cluster"}
        except Exception as err:
            print(f"[Elastic] Bulk index error, falling back to in-memory: {err}")

    # Fallback in-memory index
    global _IN_MEMORY_PRODUCT_INDEX
    _IN_MEMORY_PRODUCT_INDEX = list(products)
    return {"success": True, "indexed": len(products), "mode": "in_memory_elastic"}

def search_products(query: str, category: str = None, max_price: float = None, limit: int = 15):
    """Performs fuzzy, typo-tolerant full-text search across product catalog."""
    client = get_elastic_client()
    if client:
        try:
            must_clauses = [
                {
                    "multi_match": {
                        "query": query,
                        "fields": ["name^3", "tags^2", "description", "category"],
                        "fuzziness": "AUTO"
                    }
                }
            ]
            if category:
                must_clauses.append({"term": {"category.keyword": category}})
            if max_price:
                must_clauses.append({"range": {"price": {"lte": float(max_price)}}})

            res = client.search(
                index="hermora_products",
                query={"bool": {"must": must_clauses}},
                size=limit
            )
            hits = [h["_source"] for h in res["hits"]["hits"]]
            return {
                "success": True,
                "hits": hits,
                "total": res["hits"]["total"]["value"] if isinstance(res["hits"]["total"], dict) else len(hits),
                "source": "elasticsearch_cluster"
            }
        except Exception as err:
            print(f"[Elastic] Search error: {err}")

    # In-memory fallback with fuzzy string matching
    q_lower = query.lower().strip()
    words = [w for w in q_lower.split() if len(w) > 1]
    results = []

    for p in _IN_MEMORY_PRODUCT_INDEX:
        text = f"{p.get('name', '')} {p.get('description', '')} {p.get('category', '')} {' '.join(p.get('tags', []))}".lower()
        score = 0
        if q_lower in text:
            score += 10
        for w in words:
            if w in text:
                score += 2
        
        if score > 0:
            if category and p.get("category", "").lower() != category.lower():
                continue
            if max_price and float(p.get("price", 0)) > float(max_price):
                continue
            results.append((score, p))

    results.sort(key=lambda x: x[0], reverse=True)
    matched = [item[1] for item in results[:limit]]
    return {
        "success": True,
        "hits": matched,
        "total": len(matched),
        "source": "elastic_in_memory_engine"
    }

def index_security_log(event_type: str, details: dict, severity: str = "INFO"):
    """Indexes security events (Face ID locks, Passkey locks, PIN attempts, PayPal fraud checks)."""
    log_doc = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "severity": severity,
        "details": details
    }
    client = get_elastic_client()
    if client:
        try:
            client.index(index="hermora_security_events", document=log_doc)
        except Exception as e:
            print(f"[Elastic] Failed to log security event: {e}")

    _IN_MEMORY_SECURITY_LOGS.insert(0, log_doc)
    if len(_IN_MEMORY_SECURITY_LOGS) > 100:
        _IN_MEMORY_SECURITY_LOGS.pop()
    return log_doc

def get_security_logs(limit: int = 30):
    return _IN_MEMORY_SECURITY_LOGS[:limit]

def get_elastic_status():
    return {
        "configured": is_elastic_configured(),
        "url": ELASTIC_URL or "Not set (Running in-memory Elastic engine)",
        "indexed_products_count": len(_IN_MEMORY_PRODUCT_INDEX),
        "security_logs_count": len(_IN_MEMORY_SECURITY_LOGS),
        "engine": "Elasticsearch 8.x" if is_elastic_configured() else "Elastic Search Engine (Local Simulation)"
    }

