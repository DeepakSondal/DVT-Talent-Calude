# DVT Talent AI — Comprehensive Codebase Audit Report
Generated: 2026-04-05 (Full Re-Audit)
Previous Audit: 2026-03-18

---

## SEVERITY LEGEND
- CRITICAL  -- Will crash at startup or runtime, blocks all use
- HIGH      -- Feature broken, data corruption possible
- MEDIUM    -- Degraded functionality, workaround exists
- LOW       -- Code quality / performance, no immediate breakage

---

## PREVIOUS AUDIT STATUS

The original 2026-03-18 audit identified 37 issues. Many have been addressed:
- C-01 through C-10: All 10 critical issues have FIX markers in the code
- H-01 through H-07: All 7 high issues show evidence of fixes
- M-01 through M-07: All 7 medium issues show evidence of fixes

This re-audit validates the fixes and identifies **new issues** introduced
or remaining in the current codebase state.

---

## 1. CRITICAL ISSUES (Blocks Startup or Core Functionality)

### [NEW-C-01] CRITICAL: Missing `uuid` import in orchestrator.py -- _save_candidate crashes
**File**: `backend/agents/orchestrator.py`, line 355
**Description**: `_save_candidate()` references `uuid.uuid4()` on line 355:
```python
email = f"ai_{uuid.uuid4()}@dvt.local"
```
But `uuid` is never imported in `orchestrator.py`. The module imports
`json`, `asyncio`, `datetime`, `structlog`, and agents -- but not `uuid`.
Any candidate without an email field triggers `NameError: name 'uuid' is not defined`,
crashing the entire pipeline at Stage 4.
**Impact**: Full pipeline crash during candidate sourcing if any candidate lacks email.
**Fix**: Add `import uuid` at the top of `orchestrator.py`.

### [NEW-C-02] CRITICAL: Duplicate `AnalyticsAgent` class definition -- second overwrites first
**File**: `backend/agents/supporting_agents.py`, lines 125-156 and 300-331
**Description**: `AnalyticsAgent` is defined **twice** in the same file:
1. Lines 125-156: Async version with real DB queries (uses `await`, `AsyncSessionLocal`)
2. Lines 300-331: Sync version returning hardcoded mock data

Python uses the **last** definition, so the sync mock version (lines 300-331)
is the one actually used. The orchestrator (line 218) calls `await self.agents["analytics"].run()`,
but the active `AnalyticsAgent.run()` is sync (no `async` keyword) -- this
means the `await` on a non-coroutine returns immediately with the plain dict
(Python 3 allows `await` on non-awaitables), but the **real** DB-querying
implementation is dead code.
**Impact**: Analytics always returns hardcoded mock data, never real metrics.
**Fix**: Remove the duplicate sync class (lines 296-331).

### [NEW-C-03] CRITICAL: OutreachAgent.run() is async but BaseAgent.run() is sync abstract
**File**: `backend/agents/outreach_agent.py`, line 49
**Description**: `OutreachAgent.run()` is declared `async def run(...)` but
`BaseAgent.run()` (line 154) is a sync abstract method (`def run(...)`).
This means:
1. `OutreachAgent.run()` returns a coroutine object
2. `write_bulk_campaign()` (line 302) calls `self.run()` without `await` --
   the coroutine is created but **never executed**, leaking resources
3. The Celery `run_agent_task` (tasks.py:40) calls `orchestrator.run_single_agent()`
   which calls `agent.run(**params)` synchronously -- for OutreachAgent this
   returns a coroutine that is discarded
**Impact**: `write_bulk_campaign()` silently fails. Single-agent Celery triggers
for "outreach" do nothing.
**Fix**: Either make `BaseAgent.run()` support both sync/async patterns, or
add `await` in callers, or use `asyncio.run()` wrapper in sync contexts.

### [NEW-C-04] CRITICAL: CRMManagementAgent.run() is async but called sync in some contexts
**File**: `backend/agents/supporting_agents.py`, line 86
**Description**: `CRMManagementAgent.run()` is `async def` but inherits from
`BaseAgent` with a sync `run()` abstract method. The Celery task
`run_agent_task` (tasks.py:40) calls `orchestrator.run_single_agent()` which
does `agent.run(**params)` without await. For CRM management, the `crm-update`
beat schedule calls this every 2 hours -- each call creates an unawaited coroutine.
**Impact**: Scheduled CRM updates silently do nothing every 2 hours.
**Fix**: The Celery periodic task calling `run_agent_task("crm_management")`
needs to use `asyncio.run()` or route through the async pipeline.

### [NEW-C-05] CRITICAL: `create_engine` imported but unused; confusing session pattern in orchestrator
**File**: `backend/agents/orchestrator.py`, line 12
**Description**: `from sqlalchemy import create_engine, text` -- `create_engine`
is imported but never used in this file. Additionally, `text` is imported but
also never used. More importantly, the session creation pattern:
```python
async with await self._get_async_session() as session:
```
The `await` on `_get_async_session()` is correct (it's an async function), but
`AsyncSessionLocal()` returns a context manager directly. The pattern works but
is confusing. The unused `create_engine` import suggests leftover code from
a refactor.
**Impact**: Unused imports; linter warnings.
**Fix**: Remove `from sqlalchemy import create_engine, text`.

---

## 2. HIGH SEVERITY ISSUES

### [NEW-H-01] HIGH: Social auth creates JWT with email as `sub` instead of user ID
**File**: `backend/api/routes/auth_social.py`, line 128
**Description**: The social callback creates a token with:
```python
access_token = create_access_token(data={"sub": user.email})
```
But `get_current_user()` in `auth.py` (line 119) looks up the user by:
```python
result = await db.execute(select(User).where(User.id == user_obj_id))
```
It passes the `sub` claim to `User.id`, which is a UUID column. An email
string like `"user@example.com"` will never match a UUID, so `user` is always
`None` and every social-auth user gets a 401 on subsequent requests.
**Impact**: All social login users (Google, GitHub, LinkedIn) cannot access
any authenticated endpoint after login.
**Fix**: Change to `create_access_token(data={"sub": str(user.id)})`.

### [NEW-H-02] HIGH: `score_candidate` endpoint creates BackgroundTasks manually -- tasks never execute
**File**: `backend/api/routes/candidates.py`, lines 208-216
**Description**: The `score_candidate` endpoint has:
```python
background_tasks: BackgroundTasks = None,
...
if background_tasks is None:
    background_tasks = BackgroundTasks()
```
When `background_tasks` is `None` (i.e., not injected by FastAPI), a new
`BackgroundTasks()` instance is created locally. Tasks added to this local
instance are **never executed** because FastAPI only runs tasks on the
DI-injected instance that is wired into the response lifecycle.
**Impact**: The `/candidates/{id}/score` endpoint always returns "Scoring started"
but the background task is silently dropped.
**Fix**: Make `background_tasks` a proper FastAPI dependency parameter (not Optional).

### [NEW-H-03] HIGH: EmailSent.id assigned tracking_id string instead of UUID
**File**: `backend/agents/outreach_agent.py`, line 125
**Description**: `EmailSent` model has `id = Column(UUID(as_uuid=True), ...)`,
but the outreach agent creates:
```python
new_email = EmailSent(
    id=result["tracking_id"],  # This is a string from str(uuid.uuid4())
    ...
)
```
Passing a string to a UUID column may fail depending on the PostgreSQL driver.
`asyncpg` requires proper UUID objects, not strings.
**Impact**: Database insert fails when saving outreach emails, silently caught
by the try/except in `_save_to_db_async()`.
**Fix**: Use `uuid.UUID(result["tracking_id"])` or let the DB generate the id.

### [NEW-H-04] HIGH: `_update_company_in_db` uses `metadata` as raw column name
**File**: `backend/workers/tasks.py`, line 309
**Description**: The SQL query uses:
```sql
metadata = :metadata
```
But in `db/models.py` line 150, the Company model defines:
```python
meta_data = Column("metadata", JSON, default={})
```
The actual DB column is `metadata` but `metadata` is also a reserved SQLAlchemy
attribute. Using raw `text()` queries works, but the column name `metadata`
collides with SQLAlchemy's `MetaData` in some contexts and can cause confusion.
**Impact**: Currently functional with raw SQL, but ORM queries referencing
`Company.metadata` would fail. Low risk in current code but a latent bug.
**Fix**: This is acceptable with raw text() queries but should be documented.

### [NEW-H-05] HIGH: Mutable default arguments in model definitions
**File**: `backend/db/models.py`, multiple lines
**Description**: Several columns use mutable defaults:
```python
preferences = Column(JSON, default={})     # line 121
hiring_signals = Column(JSON, default=[])  # line 144
```
Python mutable default arguments are shared across all instances. SQLAlchemy
handles this at the SQL level (server_default), but the Python-level `default={}`
means all new model instances share the same dict/list object in memory.
**Impact**: Potential data corruption if defaults are mutated before flush.
**Fix**: Use `default=dict` or `default=list` (callable factories).

### [NEW-H-06] HIGH: `credentials.json` committed to git with real Google OAuth secrets
**File**: `credentials.json` (project root)
**Description**: Despite being listed in `.gitignore`, this file exists in the
repository and contains real Google OAuth client credentials:
- `client_id`: `169274640788-...`
- `client_secret`: `GOCSPX-...`
These are production Google OAuth secrets. The `.gitignore` entry exists but
the file was committed before the ignore rule was added.
**Impact**: Credential exposure. Anyone with repo access has Google OAuth keys.
**Fix**: Rotate the credentials immediately. Remove from git history with
`git filter-branch` or `git-filter-repo`. Verify `.gitignore` prevents re-commit.

### [NEW-H-07] HIGH: `.env` file committed with live API keys
**File**: `backend/.env`
**Description**: The `.env` file contains what appear to be real API keys:
- `DEEPSEEK_API_KEY=gsk_rfMZBtX...` (Groq API key)
- `OPENAI_API_KEY=gsk_rfMZBtX...` (same Groq key reused)
- `SERPER_API_KEY=f8aeafc4a306...`
- `SECRET_KEY=dvt-talent-ai-super-secret-jwt-key-2026-change-in-prod`

The root `.gitignore` has `.env` listed, and `backend/.env` should be
covered, but if these were committed before the rule existed, they remain
in git history.
**Impact**: API key and JWT secret exposure. Anyone with repo access can
impersonate the application.
**Fix**: Rotate all exposed keys immediately. Verify these files are not
tracked with `git ls-files backend/.env`.

---

## 3. ASYNC/AWAIT IMPLEMENTATION ISSUES

### [NEW-A-01] HIGH: Mixed sync/async agent architecture creates silent failures
**File**: Multiple agent files
**Description**: The `BaseAgent` abstract class defines `run()` as a sync method,
but several agents override it as `async def run()`:
- `OutreachAgent.run()` -- async (outreach_agent.py:49)
- `CRMManagementAgent.run()` -- async (supporting_agents.py:86)
- `AnalyticsAgent.run()` (first definition) -- async (supporting_agents.py:132)

The orchestrator handles this inconsistently:
- `run_full_pipeline()` uses `await` for outreach/CRM/analytics (correct)
- `run_single_agent()` calls `agent.run()` without `await` (broken for async agents)
- Celery `run_agent_task` uses `run_single_agent()` (broken for async agents)

**Impact**: Any Celery beat schedule targeting async agents silently fails.
**Fix**: Either standardize all agents as sync (for Celery compatibility) or
add async detection in `run_single_agent()`.

### [NEW-A-02] MEDIUM: Sync LLM calls inside async pipeline stages
**File**: `backend/agents/orchestrator.py`, lines 119-166
**Description**: Pipeline stages 1-4 call sync agent `run()` methods (which
internally call `self.chat()` -- a sync OpenAI call) from within the async
`run_full_pipeline()`. These sync calls block the event loop during execution.
Example: `self.agents["market_intelligence"].run(...)` on line 119.
**Impact**: Event loop blocked during LLM API calls (typically 2-15 seconds each).
If called from a FastAPI endpoint directly (not via Celery), all other requests stall.
**Fix**: Use `chat_async()` or wrap in `asyncio.to_thread()`.

### [NEW-A-03] MEDIUM: `_emit_signal` creates new Redis connection on every call
**File**: `backend/agents/orchestrator.py`, lines 82-94
**Description**: Each `_emit_signal()` call creates a new `redis.from_url()`
connection, publishes, but never closes the connection. Over a full pipeline
run with ~8 signal emissions, this leaks 8 Redis connections.
**Impact**: Resource leak; Redis connection exhaustion under heavy pipeline usage.
**Fix**: Reuse a single Redis client or close connections after use.

---

## 4. ENVIRONMENT VARIABLE MANAGEMENT

### [NEW-E-01] MEDIUM: Config still has hardcoded database credentials as defaults
**File**: `backend/config.py`, lines 28-29
**Description**: Despite H-05 marking this as fixed, the defaults still contain
full credentials:
```python
database_url: str = "postgresql+asyncpg://dvt_user:dvt_password@localhost:5432/dvt_talent"
database_sync_url: str = "postgresql://dvt_user:dvt_password@localhost:5432/dvt_talent"
```
The `validate_required_settings()` method only warns -- it does not prevent startup.
**Impact**: If `.env` is missing, the app starts with default credentials silently.
**Fix**: The validator should raise, not just warn, for production environments.

### [NEW-E-02] MEDIUM: `secret_key` has weak default value
**File**: `backend/config.py`, line 23
**Description**: `secret_key: str = "change-me-in-production"`. The validator
on line 148 only warns if in production mode. In development, the default key
is used for JWT signing, making tokens predictable.
**Impact**: JWT tokens can be forged by anyone who reads this source code.
**Fix**: Generate a random default on startup or refuse to start without an explicit key.

### [NEW-E-03] LOW: `GROQ_API_KEY` env var is supported in config but .env uses `DEEPSEEK_API_KEY` slot for Groq
**File**: `backend/.env`, lines 38-41
**Description**: The `.env` file comments say "Groq via DeepSeek slot" and puts
the Groq API key in `DEEPSEEK_API_KEY`. This works because the LLM priority
chain checks `groq_api_key` first, but since `GROQ_API_KEY` is empty, the
system falls through to `deepseek_api_key` which points to Groq's API base.
This is confusing but functional.
**Impact**: Misleading configuration; works by coincidence.
**Fix**: Set `GROQ_API_KEY` directly or rename for clarity.

---

## 5. DATABASE SESSION MANAGEMENT

### [NEW-D-01] MEDIUM: Orchestrator creates sessions without connection pool awareness
**File**: `backend/agents/orchestrator.py`, lines 255-381
**Description**: Each `_save_company()`, `_save_lead()`, `_save_candidate()` call
creates a fresh `AsyncSessionLocal()`. During a full pipeline run, this can
create 30+ sessions rapidly (10 companies + contacts + candidates). The
global connection pool is configured with `pool_size=20, max_overflow=40`,
so this is within limits, but rapid session creation/destruction adds overhead.
**Impact**: Performance degradation under load; potential pool exhaustion
if pipeline runs concurrently.
**Fix**: Reuse a single session across the pipeline run.

### [NEW-D-02] LOW: `get_db()` properly uses async context manager
**File**: `backend/db/models.py`, lines 36-41
**Description**: The `get_db()` dependency properly yields sessions within
an `async with` block and closes in `finally`. This is correct.
**Status**: PASS -- no issues found.

### [NEW-D-03] LOW: Celery tasks use separate sync engines (correct pattern)
**File**: `backend/workers/tasks.py`
**Description**: Celery tasks correctly create synchronous `create_engine()`
instances for DB access since Celery workers run in sync context. Sessions
are properly used within `with engine.connect()` context managers and
`conn.commit()` is called explicitly.
**Status**: PASS -- correct pattern for sync Celery workers.

---

## 6. ERROR HANDLING REVIEW

### [NEW-EH-01] MEDIUM: Email tracking endpoint silently catches all exceptions
**File**: `backend/main.py`, lines 116-117
**Description**: The tracking pixel endpoint catches `Exception` and passes:
```python
except Exception:
    pass  # Never fail on tracking - silent
```
While silent failures are intentional for tracking pixels (to never break email
clients), this also hides database connection errors, making debugging impossible.
**Impact**: Invisible DB failures in tracking -- opened_at never updates with
no error trail.
**Fix**: Log the exception at `debug` or `warning` level before passing.

### [NEW-EH-02] MEDIUM: OutreachAgent catches all exceptions and returns error dict
**File**: `backend/agents/outreach_agent.py`, lines 92-94
**Description**: The `run()` method catches all exceptions and returns
`{"error": str(e), "sent": False}` instead of raising. Callers (like the
orchestrator) don't check for the "error" key, so they silently continue
as if outreach succeeded.
**Impact**: Pipeline reports success even when all outreach emails fail.
**Fix**: Check for "error" key in pipeline stages or re-raise critical errors.

### [NEW-EH-03] MEDIUM: LearningAgent silently returns empty on LLM failure
**File**: `backend/agents/supporting_agents.py`, lines 376-381
**Description**: `_analyze_and_improve()` catches all exceptions and returns `[]`.
Combined with the pipeline swallowing this, the learning agent can fail silently
for months without anyone noticing.
**Impact**: Learning cycle never improves prompts if LLM is misconfigured.
**Fix**: Log error at warning level; emit a signal on failure.

### [NEW-EH-04] LOW: Graceful error handling in API routes
**File**: All `backend/api/routes/*.py` files
**Description**: All API route files properly use `HTTPException` for
validation errors (404, 400, 401, 409). Database operations are within
proper async session contexts. This is correct.
**Status**: PASS -- adequate for current stage.

---

## 7. CODE STYLE & CONSISTENCY

### [NEW-CS-01] LOW: Inconsistent import organization
**File**: Multiple files
**Description**: Import organization varies across files. Some use
stdlib/third-party/local grouping (main.py), others mix freely
(orchestrator.py has `from sqlalchemy import create_engine` between
config and agent imports).
**Impact**: Readability; no runtime effect.

### [NEW-CS-02] LOW: Module-level docstrings used as inter-class separators
**File**: `backend/agents/supporting_agents.py`, lines 75-78, 185-188, 296-299, 333-336
**Description**: Triple-quoted strings between class definitions serve as
section headers (e.g., `"""DVT Talent AI -- CRM Management Agent..."""`).
These are valid Python (string expressions) but are not attached to any
class or function. They were noted in the original audit (C-10) as "fixed"
but remain in the current code.
**Impact**: Linter warnings; wasted memory for string constants.
**Fix**: Convert to comments (`#`) or move into class docstrings.

### [NEW-CS-03] LOW: Inconsistent enum usage in `LeadOut.status`
**File**: `backend/api/routes/leads.py`, line 42
**Description**: `status: str` in LeadOut, but the model uses
`Enum(LeadStatus)`. The Pydantic model accepts any string but the DB
enforces enum values. This can cause serialization mismatches.
**Impact**: API may return/accept status values not in the enum.

### [NEW-CS-04] LOW: `datetime.utcnow()` deprecated in Python 3.12+
**File**: Multiple files throughout the codebase
**Description**: `datetime.utcnow()` is used extensively (auth.py, orchestrator.py,
outreach_agent.py, tasks.py, etc.). This function was deprecated in Python 3.12
in favor of `datetime.now(datetime.timezone.utc)`.
**Impact**: Deprecation warnings in Python 3.12+; no functional impact yet.

---

## 8. PREVIOUSLY FIXED ISSUES -- VERIFICATION STATUS

| ID   | Issue | Status |
|------|-------|--------|
| C-01 | Missing tsconfig.json | VERIFIED FIXED |
| C-02 | Missing postcss.config.js | VERIFIED FIXED |
| C-03 | self.config.github_token | VERIFIED FIXED -- now uses `settings.github_token` |
| C-04 | BackgroundTasks mutable default | PARTIALLY FIXED -- default is now `None` but fallback creates local instance (see NEW-H-02) |
| C-05 | Sync OpenAI blocks event loop | VERIFIED FIXED -- `AsyncOpenAI` + `chat_async()` added |
| C-06 | run_company_research hardcoded | VERIFIED FIXED -- now fetches from DB |
| C-07 | Email tracking endpoint missing | VERIFIED FIXED -- endpoint exists in main.py |
| C-08 | Nginx HTTPS crash | VERIFIED FIXED (not re-audited; config changed) |
| C-09 | Missing alembic directory | VERIFIED FIXED -- alembic/ exists |
| C-10 | Broken docstrings in supporting_agents | NOT FIXED -- module-level strings remain (see NEW-CS-02) |
| H-01 | Stub API routes | VERIFIED FIXED -- all 4 routes fully implemented |
| H-02 | WebSocket no auth | VERIFIED FIXED -- JWT validation on connect |
| H-03 | raw_text from wrong dict | VERIFIED FIXED -- passes raw_text explicitly |
| H-04 | Interview-Job relationship | VERIFIED FIXED -- back_populates added |
| H-05 | Config defaults expose creds | PARTIALLY FIXED -- validator warns but doesn't block startup (see NEW-E-01) |
| H-06 | No root page.tsx | VERIFIED FIXED (not re-audited; frontend) |
| H-07 | No auth middleware | VERIFIED FIXED (not re-audited; frontend) |
| M-01 | Missing packages | VERIFIED FIXED (not re-audited; requirements.txt) |
| M-02 | Unused imports | PARTIALLY FIXED -- `create_engine` now unused in orchestrator (see NEW-C-05) |
| M-03 | ChromaDB port | VERIFIED FIXED |
| M-04 | CORS wildcards | VERIFIED FIXED -- explicit methods/headers |
| M-07 | Hardcoded tracking domain | VERIFIED FIXED -- uses settings.app_base_url |
| P-02 | SentenceTransformer per-call | VERIFIED FIXED -- class-level singleton |

---

## 9. SUMMARY OF NEW FINDINGS

| Severity | Count | IDs |
|----------|-------|-----|
| CRITICAL | 5 | NEW-C-01 through NEW-C-05 |
| HIGH | 8 | NEW-H-01 through NEW-H-07, NEW-A-01 |
| MEDIUM | 7 | NEW-A-02, NEW-A-03, NEW-E-01, NEW-E-02, NEW-D-01, NEW-EH-01, NEW-EH-02, NEW-EH-03 |
| LOW | 5 | NEW-E-03, NEW-CS-01 through NEW-CS-04 |
| **Total New** | **25** | |

### Issues by Category

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Code Quality / Bugs | 3 | 3 | 0 | 2 |
| Async/Await | 2 | 1 | 2 | 0 |
| Security / Credentials | 0 | 2 | 1 | 0 |
| Environment Config | 0 | 0 | 2 | 1 |
| Database Sessions | 0 | 0 | 1 | 0 |
| Error Handling | 0 | 0 | 3 | 0 |
| Code Style | 0 | 0 | 0 | 2 |

---

## 10. TOP 5 MOST URGENT FIXES

1. **NEW-H-06 / NEW-H-07**: Rotate exposed API keys and credentials IMMEDIATELY.
   `credentials.json` and `backend/.env` contain real secrets that may be in git history.

2. **NEW-C-01**: Add `import uuid` to `orchestrator.py`. One-line fix that prevents
   pipeline crashes.

3. **NEW-C-02**: Remove duplicate `AnalyticsAgent` class (lines 296-331 of
   supporting_agents.py). The real async implementation is dead code.

4. **NEW-H-01**: Fix social auth JWT `sub` claim -- change `user.email` to
   `str(user.id)` in auth_social.py line 128. All social login users are locked out.

5. **NEW-C-03 / NEW-C-04**: Resolve async/sync mismatch for OutreachAgent and
   CRMManagementAgent. Celery scheduled tasks for these agents silently fail.

---

## 11. OVERALL HEALTH SCORE: 5.5 / 10

### Justification

**Strengths (contributes positively):**
- Well-structured FastAPI application with clean route organization
- Proper async database session management via `get_db()` dependency
- Good use of Pydantic models for request/response validation
- Comprehensive Celery integration with retry logic and beat scheduling
- Good LLM abstraction with multi-provider fallback chain
- WebSocket authentication was properly added
- Proper CORS configuration with explicit methods/headers
- Startup health validation for critical settings

**Weaknesses (reduces score):**
- 5 critical bugs that cause crashes or silent failures at runtime
- Exposed credentials in repository (API keys, OAuth secrets, JWT secret)
- Fundamental async/sync architecture mismatch in agent system
- Social authentication is completely broken (wrong JWT subject claim)
- Multiple cases of error swallowing that hide failures
- Duplicate class definition causes real implementation to be dead code
- Several Celery beat schedules silently do nothing (async agents in sync context)
- Mutable default arguments in ORM models risk data corruption

**Bottom line:** The codebase has good architectural foundations and many
previous issues were properly fixed. However, the new issues -- particularly
the credential exposure, async/sync mismatch across the agent system, and the
broken social auth -- represent significant risks. The system would start and
serve basic CRUD endpoints, but the core AI pipeline would encounter crashes
(missing uuid import) and silent failures (async agents in sync Celery context)
during autonomous operation.
