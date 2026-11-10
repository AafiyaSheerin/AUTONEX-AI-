import sys
from pathlib import Path

BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.append(str(BACKEND_PATH))

import auth_service
import payment_service


def test_locking_face_id_locks_passkeys():
    """Verify that when Face ID is locked, passkeys are automatically locked as well."""
    test_email = "dual_lock_test@hermora.com"
    # Ensure starting in unlocked state
    user = auth_service.update_user_profile(
        test_email,
        name="Dual Lock Tester",
        face_id_locked=False,
        passkey_locked=False,
        security_pin="1234"
    )
    assert user["face_id_locked"] is False
    assert user["passkey_locked"] is False

    # Lock Face ID
    locked_user = auth_service.update_user_profile(
        test_email,
        face_id_locked=True
    )
    # Both Face ID and Passkeys MUST be locked
    assert locked_user["face_id_locked"] is True
    assert locked_user["passkey_locked"] is True


def test_cannot_unlock_passkey_while_face_id_is_locked():
    """Verify that passkeys cannot be unlocked while Face ID remains locked."""
    test_email = "passkey_guard_test@hermora.com"
    auth_service.update_user_profile(
        test_email,
        face_id_locked=True
    )

    # Attempt to unlock passkey alone
    updated = auth_service.update_user_profile(
        test_email,
        passkey_locked=False
    )
    # Must remain locked because Face ID is locked
    assert updated["face_id_locked"] is True
    assert updated["passkey_locked"] is True


def test_payment_order_requires_pin_when_face_id_is_locked():
    """When Face ID and Passkeys are locked, payment order creation requires valid PIN."""
    test_email = "payment_pin_test@hermora.com"
    auth_service.update_user_profile(
        test_email,
        face_id_locked=True,
        security_pin="5678"
    )

    transaction = {
        "status": "READY_FOR_PAYMENT",
        "selected_product": {
            "name": "Luxury Silk Scarf",
            "price": 45.0
        },
        "audit_log": []
    }

    # 1. No PIN provided -> blocked
    result_no_pin = payment_service.create_payment_order(
        transaction=transaction,
        security_pin=None,
        user_email=test_email
    )
    assert result_no_pin["success"] is False
    assert result_no_pin.get("requires_pin") is True

    # 2. Invalid PIN provided -> blocked
    result_wrong_pin = payment_service.create_payment_order(
        transaction=transaction,
        security_pin="0000",
        user_email=test_email
    )
    assert result_wrong_pin["success"] is False
    assert result_wrong_pin.get("requires_pin") is True

    # 3. Valid PIN provided -> authorized!
    result_valid_pin = payment_service.create_payment_order(
        transaction=transaction,
        security_pin="5678",
        user_email=test_email
    )
    assert result_valid_pin["success"] is True
    assert result_valid_pin["status"] == "PAYMENT_PENDING"
    assert transaction.get("pin_verified") is True


def test_payment_verify_requires_pin_when_locked():
    """Payment capture requires PIN verification when Face ID / Passkeys are locked."""
    test_email = "verify_pin_test@hermora.com"
    auth_service.update_user_profile(
        test_email,
        face_id_locked=True,
        security_pin="9999"
    )

    transaction = {
        "status": "PAYMENT_PENDING",
        "paypal_order_id": "PAYPAL_SANDBOX_ORD_PINTEST",
        "audit_log": []
    }

    # Wrong PIN fails
    fail_res = payment_service.verify_payment(
        transaction=transaction,
        paypal_order_id="PAYPAL_SANDBOX_ORD_PINTEST",
        paypal_payment_id="PAYPAL_CAP_TEST",
        user_email=test_email,
        security_pin="1111"
    )
    assert fail_res["success"] is False

    # Correct PIN succeeds
    success_res = payment_service.verify_payment(
        transaction=transaction,
        paypal_order_id="PAYPAL_SANDBOX_ORD_PINTEST",
        paypal_payment_id="PAYPAL_CAP_TEST",
        user_email=test_email,
        security_pin="9999"
    )
    assert success_res["success"] is True
    assert success_res["status"] == "PAYMENT_VERIFIED"


def test_pin_verification_and_update():
    """Verify verify_user_pin and update_user_pin functions."""
    test_email = "pin_update_test@hermora.com"
    auth_service.update_user_profile(test_email, security_pin="1234")
    assert auth_service.verify_user_pin(test_email, "1234") is True
    assert auth_service.verify_user_pin(test_email, "9999") is False

    # Update PIN
    auth_service.update_user_pin(test_email, "4321")
    assert auth_service.verify_user_pin(test_email, "4321") is True
    assert auth_service.verify_user_pin(test_email, "1234") is False

