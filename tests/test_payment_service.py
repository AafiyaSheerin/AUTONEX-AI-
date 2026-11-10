import sys
from pathlib import Path

BACKEND_PATH = Path(__file__).parent.parent / "backend"
sys.path.append(str(BACKEND_PATH))

import payment_service


def test_payment_blocked_before_human_approval():
    transaction = {
        "status": "AWAITING_HUMAN_APPROVAL",
        "selected_product": {
            "name": "Midnight Abaya",
            "price": 3599
        },
        "audit_log": []
    }

    result = payment_service.create_payment_order(transaction)

    assert result["success"] is False
    assert result["status"] == "AWAITING_HUMAN_APPROVAL"
    assert transaction["status"] == "AWAITING_HUMAN_APPROVAL"


def test_blocked_transaction_cannot_create_payment():
    transaction = {
        "status": "BLOCKED",
        "selected_product": {
            "name": "Expensive Product",
            "price": 6000
        },
        "audit_log": []
    }

    result = payment_service.create_payment_order(transaction)

    assert result["success"] is False
    assert result["status"] == "BLOCKED"
    assert transaction["status"] == "BLOCKED"


def test_ready_transaction_can_create_payment():
    transaction = {
        "status": "READY_FOR_PAYMENT",
        "merchant": "Luma",
        "selected_product": {
            "name": "Midnight Abaya",
            "price": 3599
        },
        "audit_log": []
    }

    result = payment_service.create_payment_order(transaction)

    assert result["success"] is True
    assert result["status"] == "PAYMENT_PENDING"
    assert "order_id" in result
    assert result["currency"] == "USD"
    assert transaction["status"] == "PAYMENT_PENDING"
    assert transaction["paypal_order_id"] == result["order_id"]


def test_payment_creation_is_recorded_in_audit():
    transaction = {
        "status": "READY_FOR_PAYMENT",
        "merchant": "Luma",
        "selected_product": {
            "name": "Midnight Abaya",
            "price": 3599
        },
        "audit_log": []
    }

    result = payment_service.create_payment_order(transaction)

    assert result["success"] is True

    event_types = [
        event["event_type"]
        for event in transaction["audit_log"]
    ]

    assert "PAYMENT_ORDER_CREATED" in event_types
    assert "TRANSACTION_STATE" in event_types


def test_missing_product_blocks_payment():
    transaction = {
        "status": "READY_FOR_PAYMENT",
        "audit_log": []
    }

    result = payment_service.create_payment_order(transaction)

    assert result["success"] is False
    assert result["message"] == "Selected product is missing."