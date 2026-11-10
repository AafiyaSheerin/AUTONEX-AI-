import os
import json
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

LOCAL_LOGS_FILE = Path(__file__).resolve().parent.parent / "data" / "face_auth_logs.json"


def get_supabase_config():
    """Dynamically get Supabase URL and Key, reloading from .env if needed."""
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    key = os.getenv("SUPABASE_KEY", "").strip() or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not (url and key and url.startswith("http")):
        load_dotenv(dotenv_path=ENV_PATH, override=True)
        url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
        key = os.getenv("SUPABASE_KEY", "").strip() or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    return url, key


import time
_SUPABASE_LAST_DNS_FAIL = 0

def is_supabase_configured() -> bool:
    """Returns True if valid Supabase URL and Key are provided and host is not in failure backoff."""
    global _SUPABASE_LAST_DNS_FAIL
    if time.time() - _SUPABASE_LAST_DNS_FAIL < 60:
        return False
    url, key = get_supabase_config()
    return bool(url and key and url.startswith("http"))


def _supabase_request(endpoint: str, method: str = "GET", body: dict | list | None = None, prefer: str | None = None):
    """
    Executes a direct PostgREST request to Supabase using Python's standard library.
    No extra dependencies required.
    """
    url_base, key = get_supabase_config()
    if not (url_base and key):
        return None, "Supabase not configured"

    url = f"{url_base}/rest/v1/{endpoint.lstrip('/')}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if prefer:
        headers["Prefer"] = prefer

    data = None
    if body is not None:
        data = json.dumps(body, default=str).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            content = resp.read().decode("utf-8")
            if not content:
                return {}, None
            return json.loads(content), None
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode("utf-8", errors="replace")
        print(f"[Supabase HTTP {e.code}] Error on {method} {url}: {error_msg}")
        return None, f"HTTP {e.code}: {error_msg}"
    except Exception as e:
        global _SUPABASE_LAST_DNS_FAIL
        if "getaddrinfo" in str(e) or "Errno 11001" in str(e) or "timed out" in str(e):
            _SUPABASE_LAST_DNS_FAIL = time.time()
        print(f"[Supabase Connection Error] {e}")
        return None, str(e)

# =========================================================================
# USER OPERATIONS
# =========================================================================

def db_get_user(email: str):
    """Fetches user from Supabase users table."""
    if not is_supabase_configured():
        return None
    encoded_email = urllib.parse.quote(email.lower().strip())
    data, err = _supabase_request(f"users?email=eq.{encoded_email}&select=*")
    if data and isinstance(data, list) and len(data) > 0:
        return data[0]
    return None

def db_upsert_user(user_data: dict):
    """Inserts or updates user in Supabase users table."""
    if not is_supabase_configured():
        return None
    
    # Clean fields matching schema
    payload = {
        "id": user_data.get("id"),
        "email": user_data.get("email", "").lower().strip(),
        "name": user_data.get("name"),
        "password": user_data.get("password"),
        "monthly_allowance": float(user_data.get("monthly_allowance", 150.0)),
        "monthly_spent": float(user_data.get("monthly_spent", 0.0)),
        "autonomous_limit": float(user_data.get("autonomous_limit", 15.0)),
        "face_enrolled": bool(user_data.get("face_enrolled", False)),
        "biometric_locked": bool(user_data.get("biometric_locked", False)),
        "face_id_locked": bool(user_data.get("face_id_locked", False)),
        "passkey_locked": bool(user_data.get("passkey_locked", False)),
        "security_pin": str(user_data.get("security_pin", "1234")),
        "biometric_locked_at": user_data.get("biometric_locked_at"),
        "face_template_id": user_data.get("face_template_id"),
        "face_biometric_vector": user_data.get("face_biometric_vector"),
        "avatar": user_data.get("avatar"),
        "last_cycle_month": user_data.get("last_cycle_month"),
        "last_revived_at": user_data.get("last_revived_at"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    data, err = _supabase_request(
        "users",
        method="POST",
        body=payload,
        prefer="resolution=merge-duplicates,return=representation"
    )
    if data and isinstance(data, list) and len(data) > 0:
        return data[0]
    return None

def db_update_user(email: str, updates: dict):
    """Updates user fields in Supabase users table, gracefully handling missing remote columns."""
    if not is_supabase_configured():
        return None
    encoded_email = urllib.parse.quote(email.lower().strip())
    payload = updates.copy()
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    import re
    # Retry stripping unsupported columns if remote Supabase schema hasn't migrated yet
    for _ in range(4):
        data, err = _supabase_request(
            f"users?email=eq.{encoded_email}",
            method="PATCH",
            body=payload,
            prefer="return=representation"
        )
        if not err and data and isinstance(data, list) and len(data) > 0:
            return data[0]
        if err:
            match = re.search(r"Could not find the '([^']+)' column", err) or re.search(r"column users\.([a-zA-Z0-9_]+) does not exist", err)
            if match:
                missing_col = match.group(1)
                if missing_col in payload:
                    print(f"[Supabase Schema Warning] Remote table lacks '{missing_col}' column. Saving locally and proceeding.")
                    del payload[missing_col]
                    continue
            break
    return None

# =========================================================================
# FACE AUTHENTICATION & BIOMETRIC LOGS
# =========================================================================

def db_log_face_auth(
    user_email: str,
    event_type: str,
    status: str,
    confidence_score: float | str | None = None,
    similarity: float | None = None,
    audit_hash: str | None = None,
    face_vector: list | None = None,
    photo_data: str | None = None,
    transaction_id: str | None = None,
    message: str | None = None
):
    """
    Stores an immutable biometric face authentication record in Supabase face_auth_logs.
    Captures geometry vectors, confidence levels, audit hashes, and snapshot frames.
    """
    # Parse numeric confidence if passed as string (e.g. '99.4%')
    numeric_conf = None
    if confidence_score is not None:
        try:
            numeric_conf = float(str(confidence_score).replace("%", "").strip())
        except Exception:
            numeric_conf = None

    # Truncate photo_data if excessively large to avoid payload overflow
    stored_photo = photo_data
    if stored_photo and len(stored_photo) > 100000:
        stored_photo = stored_photo[:100000] + "...[TRUNCATED]"

    payload = {
        "user_email": user_email.lower().strip(),
        "event_type": event_type, # 'ENROLLMENT', 'VERIFICATION', 'LIMIT_LOCK'
        "status": status,         # 'MATCH_CONFIRMED', 'REJECTED_MISMATCH', 'ENROLLED'
        "confidence_score": numeric_conf,
        "similarity": similarity,
        "audit_hash": audit_hash,
        "face_vector": face_vector,
        "photo_data": stored_photo,
        "transaction_id": transaction_id,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # Also persist to local backup file
    try:
        LOCAL_LOGS_FILE.parent.mkdir(parents=True, exist_ok=True)
        local_logs = []
        if LOCAL_LOGS_FILE.exists():
            with open(LOCAL_LOGS_FILE, "r", encoding="utf-8") as f:
                local_logs = json.load(f)
        log_entry = dict(payload)
        log_entry["id"] = log_entry.get("id") or f"loc_{uuid4().hex[:12]}"
        local_logs.insert(0, log_entry)
        # keep last 50
        local_logs = local_logs[:50]
        with open(LOCAL_LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump(local_logs, f, indent=2)
    except Exception as e:
        print(f"[Local Log Backup Error]: {e}")

    if not is_supabase_configured():
        print(f"[Biometric DB (Local Only)] {event_type} - {status} for {user_email} (Hash: {audit_hash})")
        return [payload]

    data, err = _supabase_request(
        "face_auth_logs",
        method="POST",
        body=payload,
        prefer="return=representation"
    )
    if err:
        print(f"[Supabase Face Auth Log Error]: {err}")
    return data or [payload]

def db_get_face_auth_logs(user_email: str, limit: int = 25):
    """Retrieves recent biometric face authentication history for a user."""
    logs = []
    # 1. Fetch from Supabase if configured
    if is_supabase_configured():
        encoded_email = urllib.parse.quote(user_email.lower().strip())
        data, err = _supabase_request(
            f"face_auth_logs?user_email=eq.{encoded_email}&order=created_at.desc&limit={limit}"
        )
        if data and isinstance(data, list):
            logs.extend(data)

    # 2. Merge with local backup if needed
    if LOCAL_LOGS_FILE.exists():
        try:
            with open(LOCAL_LOGS_FILE, "r", encoding="utf-8") as f:
                local_logs = json.load(f)
            existing_ids = {l.get("id") or l.get("audit_hash") for l in logs}
            for l in local_logs:
                if l.get("user_email", "").lower() == user_email.lower().strip():
                    lid = l.get("id") or l.get("audit_hash")
                    if lid not in existing_ids:
                        logs.append(l)
                        existing_ids.add(lid)
        except Exception:
            pass

    # Sort descending by created_at
    logs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return logs[:limit]

# =========================================================================
# TRANSACTIONS
# =========================================================================

def db_save_transaction(tx: dict):
    """Saves transaction state in Supabase transactions table."""
    if not is_supabase_configured():
        return None

    payload = {
        "transaction_id": tx.get("transaction_id"),
        "user_email": (tx.get("user_email") or "demo@hermora.com").lower().strip(),
        "product_name": tx.get("selected_product", {}).get("name") if isinstance(tx.get("selected_product"), dict) else str(tx.get("selected_product") or ""),
        "amount_usd": float(tx.get("price_usd") or tx.get("total_amount") or 0.0),
        "status": tx.get("status", "CREATED"),
        "requires_face_id": bool(tx.get("requires_face_id", True)),
        "face_verified": bool(tx.get("face_verified", False)),
        "biometric_audit_hash": tx.get("biometric_verification", {}).get("audit_hash") if isinstance(tx.get("biometric_verification"), dict) else None,
        "paypal_order_id": tx.get("paypal_order_id"),
        "paypal_capture_id": tx.get("paypal_capture_id"),
        "audit_log": tx.get("audit_log", []),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    data, err = _supabase_request(
        "transactions",
        method="POST",
        body=payload,
        prefer="resolution=merge-duplicates,return=representation"
    )
    return data

def db_get_transaction(transaction_id: str):
    """Loads transaction from Supabase transactions table."""
    if not is_supabase_configured():
        return None
    encoded_id = urllib.parse.quote(transaction_id)
    data, err = _supabase_request(f"transactions?transaction_id=eq.{encoded_id}&select=*")
    if data and isinstance(data, list) and len(data) > 0:
        return data[0]
    return None
