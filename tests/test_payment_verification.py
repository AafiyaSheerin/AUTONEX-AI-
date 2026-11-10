import sys
from pathlib import Path

BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.append(str(BACKEND_PATH))

import payment_service


def test_valid_payment_is_verified():
    transaction = {
        "status": "PAYMENT_PENDING",
        "paypal_order_id": "PAYPAL_SANDBOX_ORD_TEST123",
        "audit_log": []
    }

    result = payment_service.verify_payment(
        transaction=transaction,
        paypal_order_id="PAYPAL_SANDBOX_ORD_TEST123",
        paypal_payment_id="PAYPAL_SANDBOX_CAP_TEST456"
    )

    assert result["success"] is True
    assert result["status"] == "PAYMENT_VERIFIED"
    assert transaction["status"] == "PAYMENT_VERIFIED"
    assert transaction["paypal_payment_id"] == "PAYPAL_SANDBOX_CAP_TEST456"

    event_types = [
        event["event_type"]
        for event in transaction["audit_log"]
    ]

    assert "PAYMENT_VERIFIED" in event_types
    assert "TRANSACTION_STATE" in event_types


def test_payment_cannot_be_verified_before_order_creation():
    transaction = {
        "status": "READY_FOR_PAYMENT",
        "audit_log": []
    }

    result = payment_service.verify_payment(
        transaction=transaction,
        paypal_payment_id="pay_test123"
    )

    assert result["success"] is False
    assert result["status"] == "READY_FOR_PAYMENT"


def test_missing_order_id_blocks_verification():
    transaction = {
        "status": "PAYMENT_PENDING",
        "audit_log": []
    }

    result = payment_service.verify_payment(
        transaction=transaction,
        paypal_payment_id="pay_test123"
    )

    assert result["success"] is False
    assert result["status"] == "PAYMENT_PENDING"
    assert "missing" in result["message"].lower()