# Security Specification & Threat Model

This system secures UTM & Deep Link Requirement tracker logs via Attribute-Based Access Control (ABAC) in Google Cloud Firestore.

## 1. Core Data Invariants

1. **Authorization Anchor**: Only authenticated workspace users can access documents. Anonymous write operations are strictly blocked by default.
2. **Identification Uniformity**: Any user-created link request must have its `requestedEmail` set to the initiating user's verified token email.
3. **Identifier Safety**: All document ID patterns checked via `isValidId()` to prevent resource/poison lookup attacks.
4. **State Transition Anchoring**: Requesters are blocked from unilaterally completing, resolving, or rejecting their own requests without admin ops intervention.
5. **System-Only Exclusivity**: Tracking configurations, final deep links, and admin replies require verified administrative credentials to prevent routing injection risks.

---

## 2. The "Dirty Dozen" Threat Payloads

The following payloads represent malicious state injections that the Firestore security system must reject:

### Payload 1: Privilege Escalation
An authenticated requester attempts to set `status` to `'Completed'` during document creation.
```json
{
  "id": "REQ-001",
  "campaignName": "Malicious Promo",
  "targetUrl": "https://malicious.com",
  "source": "Meta",
  "businessUnit": "Marketing",
  "medium": "cpc",
  "status": "Completed",
  "requestedBy": "Attacker",
  "requestedEmail": "attacker@mycompany.com",
  "requestedAt": "2026-06-01T12:00:00Z"
}
```

### Payload 2: Email Spoofing / Identity Hijacking
An authenticated user attempts to request a campaign under a different user's email address.
```json
{
  "id": "REQ-002",
  "campaignName": "Spoof Promo",
  "targetUrl": "https://spoof.com",
  "source": "Google",
  "businessUnit": "Sales",
  "medium": "cpc",
  "status": "Pending",
  "requestedBy": "Attacker",
  "requestedEmail": "victim@mycompany.com",
  "requestedAt": "2026-06-01T12:00:00Z"
}
```

### Payload 3: Invalid Identifier Injection (ID Poisoning)
An attacker injects a non-compliant, massive document key containing invalid query characters.
```json
{
  "id": "REQ_X%20_BAD_CHARACTERS_WAY_TOO_LONG_JUNK_KEY_LOGS_999999999",
  "campaignName": "Junk",
  "targetUrl": "https://test.com",
  "source": "SMS",
  "businessUnit": "HR",
  "medium": "sms",
  "status": "Pending",
  "requestedBy": "Attacker",
  "requestedEmail": "attacker@mycompany.com",
  "requestedAt": "2026-06-01T12:00:00Z"
}
```

### Payload 4: Arbitrary Custom Role Assignment
An attacker registers or self-proclaims administrative roles directly in their profile or documents.
```json
{
  "id": "REQ-003",
  "isAdmin": true,
  "role": "admin"
}
```

### Payload 5: Sibling Document Query Harvesting
A random authenticated user queries another user's requests collections globally without filtering by their owned user identifier.
```json
{
  "query": "SELECT * FROM linkRequests"
}
```

### Payload 6: Unverified Email Override
A user tries to call creation paths whilst their Google token is unverified (email_verified == false).
```json
{
  "id": "REQ-004",
  "campaignName": "Unverified Token Write"
}
```

### Payload 7: Denial of Wallet Read Attack
Malformed lists or extreme payload size (1MB strings) injected with unbounded keys to trigger memory limits.
```json
{
  "id": "REQ-005",
  "campaignName": "M".repeat(950000)
}
```

### Payload 8: Settle Status Bypass
Re-editing a finalized (`'Completed'` or `'Rejected'`) link request.
```json
{
  "status": "Pending",
  "createdLink": "https://attacker.com/override"
}
```

### Payload 9: Temporal Integrity Forgery
Setting `createdAt` to a future timestamp instead of the authoritative server time `request.time`.
```json
{
  "requestedAt": "2028-01-01T00:00:00Z"
}
```

### Payload 10: Immutable Campaign Fields Override
An authenticated requester attempts to update the campaign name on an already submitted and locked query request.
```json
{
  "campaignName": "Attacker Overrides Locked Name"
}
```

### Payload 11: Unauthorized Notification Dispatch
An authenticated attacker attempts to write malicious notificaton signals into another user's mailbox.
```json
{
  "id": "NOT-001",
  "requestId": "REQ-001",
  "recipientEmail": "target@mycompany.com",
  "message": "Click this phishing link! https://phish.com"
}
```

### Payload 12: Orphan Document Generation
Inserting child tracking specifications referencing non-existing parent campaign IDs.
```json
{
  "id": "REQ-999",
  "projectId": "MISSING_PARENT_ID"
}
```

---

## 3. Threat Verifier Test Suite

The associated `firestore.rules` validation guards against these 12 malicious vectors by asserting:
1. Strict type matches and field constraints inside `isValidLinkRequest()`
2. `request.auth.token.email == incoming().requestedEmail` Identity lock
3. Multi-tier validation rules on update denying state shortcutting, reserving status changes only to admin ops or matching status modifiers.
