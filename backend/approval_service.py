from audit_service import add_audit_event


def request_approval(transaction):
    if transaction["status"] != "AWAITING_HUMAN_APPROVAL":
        return {
            "success": False,
            "status": transaction["status"],
            "message": "Transaction is not awaiting human approval."
        }

    return {
        "success": True,
        "status": "AWAITING_HUMAN_APPROVAL",
        "message": "Human approval is required before payment."
    }


def approve_transaction(transaction, approved_by):
    if transaction["status"] != "AWAITING_HUMAN_APPROVAL":
        return {
            "success": False,
            "status": transaction["status"],
            "message": "This transaction cannot be approved."
        }

    if not approved_by:
        return {
            "success": False,
            "status": "AWAITING_HUMAN_APPROVAL",
            "message": "Approval requires a valid human approver."
        }

    if (transaction.get("requires_pin") or transaction.get("requires_face_id")) and not (transaction.get("pin_verified") or transaction.get("face_verified")):
        return {
            "success": False,
            "status": "AWAITING_HUMAN_APPROVAL",
            "message": "Approval blocked: 4-digit Security PIN authorization is required."
        }

    transaction["status"] = "READY_FOR_PAYMENT"
    transaction["approved_by"] = approved_by

    if "audit_log" in transaction:
        add_audit_event(
            transaction["audit_log"],
            "HUMAN_APPROVAL",
            "Transaction approved by human.",
            {
                "approved_by": approved_by,
                "new_status": "READY_FOR_PAYMENT"
            }
        )

        add_audit_event(
            transaction["audit_log"],
            "TRANSACTION_STATE",
            "Transaction is now ready for payment.",
            {
                "status": "READY_FOR_PAYMENT"
            }
        )

    return {
        "success": True,
        "status": transaction["status"],
        "approved_by": approved_by,
        "message": "Transaction approved by human.",
        "transaction": transaction
    }