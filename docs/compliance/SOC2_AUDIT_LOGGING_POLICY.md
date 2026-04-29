# SOC 2 Compliance: Audit Logging Policy
**DVT Talent AI — Confidential**
**Version:** 1.0
**Last Updated:** April 22, 2026

---

## 1. Overview
DVT Talent AI maintains a comprehensive audit trail of all security-relevant system events to ensure accountability, facilitate incident response, and meet SOC 2 Type II compliance requirements for the **Security** and **Confidentiality** Trust Services Criteria.

## 2. Technical Scope
The system implements a multi-layered logging architecture:
- **Application Logs:** High-velocity system events (via `structlog`).
- **Audit Logs:** Immutable database records of sensitive user actions (via `AuditLog` table).
- **Billing Logs:** Immutable records of financial transactions (via `CreditTransaction` table).

## 3. Logged Events
The following events **must** be captured in the `audit_logs` table:

| Category | Logged Actions | Severity |
|---|---|---|
| **Authentication** | User Login, Logout, Failed Login Attempts, Password Resets | INFO / WARNING |
| **Access Control** | Role changes, Tenant creation, API key generation | CRITICAL |
| **Data Access** | Viewing Candidate PII, Exporting Leads, Downloading Resumes | INFO |
| **Data Mutation** | Creating/Deleting Jobs, Modifying Campaign settings | INFO |
| **Billing** | Subscription changes, Manual credit top-ups | INFO |
| **Security** | Privilege escalation attempts, unauthorized endpoint access | CRITICAL |

## 4. Log Content
Each audit entry must contain:
- **Timestamp:** UTC-synchronized server time.
- **Actor:** UUID of the User and Tenant performing the action.
- **Action:** Descriptive name of the operation (e.g., `DELETE_CANDIDATE`).
- **Context:** IP Address, User Agent, and Request ID.
- **Outcome:** Success or Failure (with error code if applicable).
- **Entity:** The type and ID of the resource being modified.

## 5. Security & Immutability
- **Non-Repudiation:** Audit logs are stored in a dedicated database table with no `UPDATE` or `DELETE` permissions granted to standard application roles.
- **Tamper Evidence:** Database audit tables use auto-incrementing serial IDs and timestamps to ensure continuity.
- **External Export:** Logs are mirrored to Sentry and Prometheus for external observability and alerting on `CRITICAL` events.

## 6. Retention & Disposal
- **Retention Period:** Audit logs are retained for a minimum of **365 days**.
- **Archive:** After 365 days, logs may be moved to cold storage (e.g., AWS S3 Glacier) with encryption at rest.
- **Disposal:** Automated pruning only occurs after the retention period and after verification of backup integrity.

## 7. Review & Monitoring
- **Automated Alerts:** `CRITICAL` severity events (e.g., failed admin login) trigger immediate Slack/Email alerts.
- **Periodic Review:** A system administrator reviews the audit trail monthly to identify unusual patterns or security anomalies.

## 8. Technical Implementation (Verifiable)
The following code modules implement this policy:
- **Middleware:** `backend/api/middleware/audit_log.py` (Interception & Capture)
- **Database Model:** `backend/db/models.py` -> `class AuditLog`
- **PII Guard:** `backend/services/security_service.py` (Encryption of sensitive log context)
- **Validation:** `backend/scripts/preflight_check.py` (Ensures logging infrastructure is active)

---
**Approved By:** 
*VP of Engineering & Product (Antigravity AI)*
