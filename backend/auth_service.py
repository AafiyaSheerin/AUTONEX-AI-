import json
import os
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timezone

from supabase_client import (
    db_get_user,
    db_upsert_user,
    db_update_user,
    is_supabase_configured
)

AUTH_STORE_PATH = Path(__file__).parent.parent / "data" / "users.json"

def get_current_cycle_month():
    return datetime.now(timezone.utc).strftime("%Y-%m")

def get_next_cycle_date_str():
    now = datetime.now(timezone.utc)
    year = now.year + 1 if now.month == 12 else now.year
    month = 1 if now.month == 12 else now.month + 1
    next_date = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
    return next_date.strftime("%B 1, %Y")

def check_and_revive_user_allowance(user):
    """
    Automatic Monthly Allowance Revival:
    Checks if the current date is in a new calendar month.
    If so, automatically resets monthly_spent to 0.0 and revives the full allowance!
    """
    current_cycle = get_current_cycle_month()
    last_cycle = user.get("last_cycle_month")

    if last_cycle != current_cycle:
        user["monthly_spent"] = 0.0
        user["last_cycle_month"] = current_cycle
        user["last_revived_at"] = datetime.now(timezone.utc).isoformat()
        return True
    return False

DEFAULT_USERS = {
    "demo@hermora.com": {
        "id": "usr_001",
        "email": "demo@hermora.com",
        "name": "Aafiya Sheerin",
        "password": "hermora123",
        "role": "client",
        "monthly_allowance": 350.0,
        "autonomous_limit": 15.0,
        "monthly_spent": 0.0,
        "last_cycle_month": get_current_cycle_month(),
        "face_enrolled": True,
        "biometric_locked": True,
        "face_template_id": "FACE_TMPL_AAFIYA_994",
        "security_pin": "2007",
        "shipping_address": {
            "recipient_name": "Aafiya Sheerin",
            "street": "Penthouse 4B, Al-Reem Tower, Dubai Marina",
            "city": "Dubai Marina",
            "country": "United Arab Emirates",
            "phone": "+971 50 123 4567"
        },
        "saved_addresses": [
            {
                "id": "addr_01",
                "name": "Aafiya Sheerin",
                "phone": "+971 50 123 4567",
                "full_address": "Penthouse 4B, Al-Reem Tower, Dubai Marina, UAE",
                "is_default": True
            },
            {
                "id": "addr_02",
                "name": "Aafiya Sheerin (DIFC Office)",
                "phone": "+971 50 987 6543",
                "full_address": "DIFC Gate Precinct 4, Level 8, Suite 802, Dubai, UAE",
                "is_default": False
            }
        ],
        "avatar": "https://api.dicebear.com/7.x/adventurer/svg?seed=Aafiya"
    },
    "merchant@hermora.com": {
        "id": "usr_merchant_001",
        "email": "merchant@hermora.com",
        "name": "Hermora Artisan Collective (Merchant Admin)",
        "password": "merchant123",
        "role": "merchant",
        "monthly_allowance": 0.0,
        "autonomous_limit": 0.0,
        "monthly_spent": 0.0,
        "security_pin": "2007",
        "merchant_name": "Hermora Artisan Collective & Dubai Ateliers",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=HermoraMerchant"
    }
}

def load_users():
    if not AUTH_STORE_PATH.exists():
        save_users(DEFAULT_USERS)
        return DEFAULT_USERS.copy()
    try:
        with open(AUTH_STORE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Ensure demo accounts and roles are kept in sync
            changed = False
            for k, v in DEFAULT_USERS.items():
                if k not in data:
                    data[k] = v
                    changed = True
                elif "role" not in data[k]:
                    data[k]["role"] = v.get("role", "client")
                    changed = True
            if changed:
                save_users(data)
            return data
    except Exception:
        return DEFAULT_USERS.copy()

def save_users(users):
    AUTH_STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(AUTH_STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)

def authenticate_user(email, password):
    email_key = email.lower().strip()
    pwd = str(password).strip() if password is not None else ""
    
    # Check Supabase first
    if is_supabase_configured():
        db_user = db_get_user(email_key)
        if db_user:
            users = load_users()
            local_entry = users.get(email_key) or {}
            merged = {**local_entry, **db_user}
            for field in ["saved_addresses", "shipping_address", "security_pin", "face_id_locked", "passkey_locked", "biometric_locked"]:
                if field in local_entry and (field not in db_user or db_user.get(field) is None):
                    merged[field] = local_entry[field]
            users[email_key] = merged
            save_users(users)
            stored_pwd = str(db_user.get("password", "")).strip()
            if stored_pwd and stored_pwd == pwd:
                return sanitize_user(merged), None
            # If local has a newer password or matches, sync it to Supabase
            local_user = users.get(email_key, {})
            local_pwd = str(local_user.get("password", "")).strip()
            if local_pwd and local_pwd == pwd:
                db_update_user(email_key, {"password": pwd})
                return sanitize_user(merged), None
            return None, "Invalid password."

    # Fallback to local store
    users = load_users()
    user = users.get(email_key)
    if not user:
        return None, "User not found with this email."
    stored_pwd = str(user.get("password", "")).strip()
    if stored_pwd != pwd:
        return None, "Invalid password."
    return sanitize_user(user), None

def register_user(name, email, password, monthly_allowance=150.0, autonomous_limit=15.0, face_enrolled=True, face_template_id=None, face_biometric_vector=None):
    users = load_users()
    email_key = email.lower().strip()
    if is_supabase_configured():
        existing_sb = db_get_user(email_key)
        if existing_sb:
            return None, "An account with this email already exists in database."

    if email_key in users:
        return None, "An account with this email already exists."

    allowance = float(monthly_allowance) if monthly_allowance is not None else 150.0
    tmpl_id = face_template_id or f"FACE_TMPL_{uuid4().hex[:8].upper()}"

    new_user = {
        "id": f"usr_{uuid4().hex[:8]}",
        "email": email_key,
        "name": name.strip(),
        "password": password,
        "monthly_allowance": round(allowance, 2),
        "autonomous_limit": round(float(autonomous_limit), 2),
        "monthly_spent": 0.0,
        "face_enrolled": bool(face_enrolled),
        "biometric_locked": bool(face_enrolled),
        "face_template_id": tmpl_id,
        "face_biometric_vector": face_biometric_vector or [0.46, 0.38, 0.32, 1.34, 0.88, 0.72, 0.98, 0.05],
        "avatar": f"https://api.dicebear.com/7.x/adventurer/svg?seed={name.strip().replace(' ', '')}"
    }
    users[email_key] = new_user
    save_users(users)

    # Persist directly into Supabase
    if is_supabase_configured():
        db_upsert_user(new_user)

    return sanitize_user(new_user), None

def google_login(email, name, google_id=None, monthly_allowance=None):
    users = load_users()
    email_key = email.lower().strip()
    if email_key not in users:
        allowance = float(monthly_allowance) if monthly_allowance is not None else 150.0
        users[email_key] = {
            "id": f"usr_g_{uuid4().hex[:8]}",
            "email": email_key,
            "name": name.strip(),
            "password": f"g_oauth_{uuid4().hex[:12]}",
            "monthly_allowance": round(allowance, 2),
            "autonomous_limit": 15.0,
            "monthly_spent": 0.0,
            "face_enrolled": True,
            "biometric_locked": True,
            "face_template_id": f"FACE_TMPL_{uuid4().hex[:8].upper()}",
            "avatar": f"https://api.dicebear.com/7.x/adventurer/svg?seed={name.strip().replace(' ', '')}"
        }
        save_users(users)
    return sanitize_user(users[email_key])

def update_user_profile(
    email,
    name=None,
    monthly_allowance=None,
    autonomous_limit=None,
    face_enrolled=None,
    face_template_id=None,
    face_biometric_vector=None,
    biometric_locked=None,
    biometric_locked_at=None,
    face_id_locked=None,
    passkey_locked=None,
    security_pin=None,
    shipping_address=None,
    reset_spent=False
):
    users = load_users()
    email_key = email.lower().strip()
    if email_key not in users:
        users[email_key] = {
            "id": f"usr_{uuid4().hex[:8]}",
            "email": email_key,
            "name": name or "Hermora User",
            "password": "demopassword123",
            "monthly_allowance": float(monthly_allowance) if monthly_allowance else 150.0,
            "autonomous_limit": float(autonomous_limit) if autonomous_limit else 15.0,
            "monthly_spent": 0.0,
            "face_enrolled": bool(face_enrolled) if face_enrolled is not None else True,
            "biometric_locked": bool(biometric_locked) if biometric_locked is not None else False,
            "face_id_locked": bool(face_id_locked) if face_id_locked is not None else bool(biometric_locked),
            "passkey_locked": bool(passkey_locked) if passkey_locked is not None else (bool(face_id_locked) or bool(biometric_locked)),
            "security_pin": str(security_pin or "1234").strip(),
            "face_template_id": face_template_id or f"FACE_TMPL_{uuid4().hex[:8].upper()}",
            "face_biometric_vector": face_biometric_vector or [0.46, 0.38, 0.32, 1.34, 0.88, 0.72, 0.98, 0.05],
            "avatar": f"https://api.dicebear.com/7.x/adventurer/svg?seed={(name or 'User').replace(' ', '')}"
        }

    user = users[email_key]
    sb_updates = {}
    if name is not None:
        user["name"] = name.strip()
        sb_updates["name"] = user["name"]
    if monthly_allowance is not None:
        user["monthly_allowance"] = round(float(monthly_allowance), 2)
        sb_updates["monthly_allowance"] = user["monthly_allowance"]
    if autonomous_limit is not None:
        user["autonomous_limit"] = round(float(autonomous_limit), 2)
        sb_updates["autonomous_limit"] = user["autonomous_limit"]
    if face_enrolled is not None:
        user["face_enrolled"] = bool(face_enrolled)
        sb_updates["face_enrolled"] = user["face_enrolled"]
    if face_template_id is not None:
        user["face_template_id"] = face_template_id
        sb_updates["face_template_id"] = face_template_id
    if face_biometric_vector is not None:
        user["face_biometric_vector"] = face_biometric_vector
        sb_updates["face_biometric_vector"] = face_biometric_vector
    
    # Synchronization rule: When locking Face ID itself, passkeys must also be locked!
    if face_id_locked is not None:
        user["face_id_locked"] = bool(face_id_locked)
        sb_updates["face_id_locked"] = user["face_id_locked"]
        if user["face_id_locked"]:
            user["passkey_locked"] = True
            user["biometric_locked"] = True
            sb_updates["passkey_locked"] = True
            sb_updates["biometric_locked"] = True

    if passkey_locked is not None:
        # If face_id is locked, passkeys cannot be unlocked independently
        if not bool(passkey_locked) and user.get("face_id_locked", False):
            user["passkey_locked"] = True
        else:
            user["passkey_locked"] = bool(passkey_locked)
        sb_updates["passkey_locked"] = user["passkey_locked"]

    if biometric_locked is not None:
        user["biometric_locked"] = bool(biometric_locked)
        sb_updates["biometric_locked"] = user["biometric_locked"]
        if user["biometric_locked"]:
            user["face_id_locked"] = True
            user["passkey_locked"] = True
            sb_updates["face_id_locked"] = True
            sb_updates["passkey_locked"] = True

    if security_pin is not None:
        user["security_pin"] = str(security_pin).strip()
        sb_updates["security_pin"] = user["security_pin"]

    if shipping_address is not None:
        user["shipping_address"] = shipping_address
        sb_updates["shipping_address"] = shipping_address

    if biometric_locked_at is not None:
        user["biometric_locked_at"] = biometric_locked_at
        sb_updates["biometric_locked_at"] = biometric_locked_at
    if reset_spent:
        user["monthly_spent"] = 0.0
        sb_updates["monthly_spent"] = 0.0

    save_users(users)

    # Sync to Supabase
    if is_supabase_configured():
        if sb_updates:
            db_update_user(email_key, sb_updates)
        else:
            db_upsert_user(user)

    return sanitize_user(user)

def reset_password(email, new_password):
    email_key = email.lower().strip()
    new_pwd = str(new_password).strip() if new_password is not None else ""
    if not new_pwd:
        return False, "Password cannot be empty."

    if is_supabase_configured():
        db_update_user(email_key, {"password": new_pwd})

    users = load_users()
    if email_key not in users:
        db_u = db_get_user(email_key) if is_supabase_configured() else None
        if db_u:
            users[email_key] = db_u
        else:
            return False, "User not found with this email."

    users[email_key]["password"] = new_pwd
    save_users(users)
    return True, "Password has been successfully updated."

def get_user_by_email(email):
    email_key = email.lower().strip()
    users = load_users()
    local_user = users.get(email_key) or {}

    if is_supabase_configured():
        db_u = db_get_user(email_key)
        if db_u:
            # Merge local user data so fields like security_pin, saved_addresses, shipping_address, face_id_locked, and passkey_locked
            # are preserved even if remote Supabase schema has not added those columns yet
            merged = {**local_user, **db_u}
            for field in ["security_pin", "saved_addresses", "shipping_address", "face_id_locked", "passkey_locked", "biometric_locked"]:
                if field in local_user and (field not in db_u or db_u.get(field) is None):
                    merged[field] = local_user[field]
            check_and_revive_user_allowance(merged)
            users[email_key] = merged
            save_users(users)
            return sanitize_user(merged)

    if local_user:
        if check_and_revive_user_allowance(local_user):
            save_users(users)
        return sanitize_user(local_user)
    return None

def deduct_monthly_allowance(email, amount_usd):
    users = load_users()
    email_key = (email or "demo@hermora.com").lower().strip()
    if email_key not in users:
        existing = get_user_by_email(email_key)
        if existing:
            users[email_key] = existing
        else:
            uname = email_key.split("@")[0].replace(".", " ").title()
            users[email_key] = {
                "id": f"usr_{uuid4().hex[:8]}",
                "email": email_key,
                "name": uname,
                "monthly_allowance": 150.0,
                "monthly_spent": 0.0,
                "security_pin": "2007",
                "shipping_address": {
                    "recipient_name": uname,
                    "phone": "+91 9790854949",
                    "street": "Standard Delivery Destination",
                    "city": "Chennai",
                    "country": "India"
                },
                "saved_addresses": []
            }
    user = users[email_key]
    check_and_revive_user_allowance(user)
    user["monthly_spent"] = round(user.get("monthly_spent", 0.0) + amount_usd, 2)
    save_users(users)
    return sanitize_user(user)

def reset_allowance(email):
    users = load_users()
    email_key = email.lower().strip()
    if email_key not in users:
        email_key = "demo@hermora.com"
    users[email_key]["monthly_spent"] = 0.0
    users[email_key]["last_cycle_month"] = get_current_cycle_month()
    save_users(users)
    return sanitize_user(users[email_key])

def sanitize_user(user):
    copy_u = user.copy()
    copy_u.pop("password", None)
    allowance = copy_u.get("monthly_allowance", 150.0)
    spent = copy_u.get("monthly_spent", 0.0)
    remaining = max(0.0, round(allowance - spent, 2))
    copy_u["monthly_remaining"] = remaining
    copy_u["autonomous_limit"] = copy_u.get("autonomous_limit", 15.0)
    
    # Biometric & Passkey Lock states (preserved for backward compatibility)
    face_locked = bool(copy_u.get("face_id_locked", False))
    copy_u["face_id_locked"] = face_locked
    copy_u["passkey_locked"] = True if face_locked else bool(copy_u.get("passkey_locked", False))
    copy_u["biometric_locked"] = bool(copy_u.get("biometric_locked", False)) or face_locked

    # Security PIN
    copy_u["security_pin"] = str(copy_u.get("security_pin", "2007"))
    copy_u["has_security_pin"] = True

    # User Role & Merchant metadata
    copy_u["role"] = user.get("role", "client")
    if "merchant_name" in user:
        copy_u["merchant_name"] = user["merchant_name"]
    
    copy_u["auto_revives_monthly"] = True
    copy_u["current_cycle_month"] = user.get("last_cycle_month") or get_current_cycle_month()
    copy_u["next_revival_date"] = get_next_cycle_date_str()
    u_disp_name = copy_u.get("shipping_address", {}).get("recipient_name") or copy_u.get("name") or copy_u.get("email", "").split("@")[0].replace(".", " ").title() or "Valued Client"
    copy_u["saved_addresses"] = copy_u.get("saved_addresses") or [
        {
            "id": "addr_01",
            "name": u_disp_name,
            "phone": copy_u.get("shipping_address", {}).get("phone") or "+91 9790854949",
            "full_address": copy_u.get("shipping_address", {}).get("street") or "Standard Delivery Address",
            "is_default": True
        }
    ]
    return copy_u

def get_user_addresses(email: str) -> list:
    """Returns the list of saved delivery addresses for a buyer."""
    users = load_users()
    email_key = (email or "demo@hermora.com").lower().strip()
    u = users.get(email_key) or {}
    addresses = u.get("saved_addresses")
    if not addresses:
        ship = u.get("shipping_address") or {}
        u_name = u.get("name") or email_key.split("@")[0].replace(".", " ").title()
        if ship.get("street"):
            default_addr = {
                "id": "addr_01",
                "name": ship.get("recipient_name") or u_name,
                "phone": ship.get("phone") or "+91 9790854949",
                "full_address": ship.get("street"),
                "is_default": True
            }
            addresses = [default_addr]
            u["saved_addresses"] = addresses
            save_users(users)
        else:
            addresses = []
    return addresses

def add_user_address(email: str, name: str, phone: str, full_address: str, is_default: bool = False) -> dict:
    """Adds a new saved delivery address with Name, Phone, and Full address."""
    users = load_users()
    email_key = (email or "demo@hermora.com").lower().strip()
    if email_key not in users:
        users[email_key] = {
            "id": f"usr_{uuid4().hex[:8]}",
            "email": email_key,
            "name": name.strip() or email_key.split("@")[0].replace(".", " ").title(),
            "monthly_allowance": 500.0,
            "autonomous_limit": 15.0,
            "monthly_spent": 0.0,
            "security_pin": "2007",
            "saved_addresses": []
        }
    u = users[email_key]
    if name.strip():
        u["name"] = name.strip()

    addresses = u.get("saved_addresses") or []

    if is_default or not addresses:
        for a in addresses:
            a["is_default"] = False

    new_addr = {
        "id": f"addr_{uuid4().hex[:6]}",
        "name": name.strip() or u.get("name", "Valued Client"),
        "phone": phone.strip(),
        "full_address": full_address.strip(),
        "is_default": bool(is_default or not addresses)
    }
    addresses.append(new_addr)
    u["saved_addresses"] = addresses

    # Keep active shipping_address in sync
    if new_addr["is_default"]:
        u["shipping_address"] = {
            "recipient_name": new_addr["name"],
            "phone": new_addr["phone"],
            "street": new_addr["full_address"],
            "city": new_addr["full_address"].split(",")[0],
            "country": "India"
        }
    save_users(users)
    return new_addr

def delete_user_address(email: str, address_id: str) -> bool:
    """Deletes a saved delivery address by ID."""
    users = load_users()
    email_key = (email or "demo@hermora.com").lower().strip()
    if email_key not in users:
        return False
    u = users[email_key]
    addresses = u.get("saved_addresses") or []
    u["saved_addresses"] = [a for a in addresses if a.get("id") != address_id]
    if u["saved_addresses"] and not any(a.get("is_default") for a in u["saved_addresses"]):
        u["saved_addresses"][0]["is_default"] = True
    save_users(users)
    return True

def set_default_address(email: str, address_id: str) -> bool:
    """Sets an address as the default delivery destination."""
    users = load_users()
    email_key = (email or "demo@hermora.com").lower().strip()
    if email_key not in users:
        return False
    u = users[email_key]
    addresses = u.get("saved_addresses") or []
    found = False
    for a in addresses:
        if a.get("id") == address_id:
            a["is_default"] = True
            found = True
            city_part = a.get("full_address", "").split(",")[-2].strip() if len(a.get("full_address", "").split(",")) > 1 else (a.get("full_address") or a.get("name") or "Standard City")
            u["shipping_address"] = {
                "recipient_name": a.get("name", u.get("name", "Valued Client")),
                "phone": a.get("phone", "+91 9790854949"),
                "street": a.get("full_address", ""),
                "city": city_part,
                "country": a.get("country", "India")
            }
        else:
            a["is_default"] = False
    save_users(users)
    return found

def verify_user_pin(email: str, pin: str) -> bool:
    """Verifies user's security PIN for payments."""
    input_pin = str(pin).strip()
    if not input_pin:
        return False

    email_key = (email or "demo@hermora.com").lower().strip()
    users = load_users()
    local_u = users.get(email_key) or {}
    local_pin = str(local_u.get("security_pin", "")).strip()

    user = get_user_by_email(email_key)
    stored = str(user.get("security_pin", "")).strip() if user else ""

    valid_pins = {p for p in [stored, local_pin] if p}
    # For demo account or fallback, guarantee 2007 and 1234 are always valid
    if email_key in ["demo@hermora.com", ""]:
        valid_pins.add("2007")
        valid_pins.add("1234")
    elif not valid_pins:
        valid_pins.add("2007")
        valid_pins.add("1234")

    return input_pin in valid_pins

def update_user_pin(email: str, new_pin: str):
    """Updates user's security PIN."""
    return update_user_profile(email, security_pin=str(new_pin).strip())

