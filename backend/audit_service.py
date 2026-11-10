from datetime import datetime, timezone

def create_audit_event(event_type, message, details=None):
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "message": message,
        "details": details or {}
    }

def add_audit_event(audit_log, event_type, message, details=None):
    event = create_audit_event(
        event_type=event_type,
        message=message,
        details=details
    )
    audit_log.append(event)
    return event