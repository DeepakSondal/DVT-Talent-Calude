# Security Policy — DVT Talent AI

## 🛡️ Best Practices for Credential Management

To maintain the security of the DVT Talent AI Command Center, follow these guidelines for managing API keys, database credentials, and other sensitive information.

### 1. Never Commit Secrets to Version Control
- Avoid committing `.env` files, `credentials.json`, `token.json`, or any file containing private keys.
- Ensure the `.gitignore` file is updated with any new sensitive file patterns.
- If you accidentally commit a secret, **consider it compromised**. Rotate it immediately.

### 2. Credential Rotation
We recommend rotating critical API keys (OpenAI, Groq, Serper, etc.) every 90 days.
- **To rotate a key**:
  1. Generate a new key in the provider's dashboard.
  2. Update the `.env` file on your production server.
  3. Restart the backend services (`docker compose restart api worker`).
  4. Revoke the old key from the provider's dashboard.

### 3. Using Environment Variables
Always use `backend/config.py` (which uses Pydantic Settings) to access configurations. This ensures secrets are pulled from Environment Variables or `.env` files, not hardcoded in the logic.

```python
# GOOD
from config import settings
api_key = settings.openai_api_key

# BAD
api_key = "sk-..." 
```

### 4. Git Safety Tools
We recommend using **git-secrets** or **gitleaks** to prevent accidental commits of sensitive data.

### 5. Reporting Vulnerabilities
If you discover a security vulnerability, please do NOT open a public issue. Instead, email the security lead at `security@dvttalent.com`.

---
*Maintained by the DVT Talent AI Engineering Team*
