# DVT Talent AI — Stripe Billing Setup Guide

This document covers end-to-end setup of the production Stripe billing system.

---

## Prerequisites

- A [Stripe account](https://stripe.com) (free to create)
- The Stripe CLI installed: `npm install -g stripe` or [download binary](https://stripe.com/docs/stripe-cli)
- Backend running with `STRIPE_SECRET_KEY` set in `.env`

---

## Step 1: Configure Your Stripe Keys

Copy the keys from [stripe.com/dashboard/apikeys](https://dashboard.stripe.com/apikeys) and paste into your `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_live_...         # or sk_test_... for development
STRIPE_PUBLISHABLE_KEY=pk_live_...    # or pk_test_... for development
STRIPE_WEBHOOK_SECRET=whsec_...       # Set after Step 4
```

> [!CAUTION]
> **Never commit your live `STRIPE_SECRET_KEY` to Git.** The `.env` file is already in `.gitignore`.

---

## Step 2: Create Products & Prices in Stripe

In the [Stripe Dashboard](https://dashboard.stripe.com/products), create **3 products** with the following lookup keys:

| Product Name | Price / Month | Lookup Key |
|---|---|---|
| Starter | $299 | `dvt_starter_monthly` |
| Growth | $999 | `dvt_growth_monthly` |
| Enterprise | $3,500 | `dvt_enterprise_monthly` |

**How to set lookup keys:**
1. Create a product → Add a recurring price
2. In "Advanced options" → set the **Lookup key** exactly as shown above
3. Save

---

## Step 3: Run the Database Migration

Apply the Alembic migration that creates the `subscription_plans`, `credit_transactions`, and updates the `tenants` table:

```bash
cd backend
alembic upgrade head
```

---

## Step 4: Seed Plans from Stripe

Run the seed script to pull real Stripe Price IDs into the database:

```bash
cd backend
python scripts/seed_stripe_plans.py
```

Expected output:
```
🔑 Using Stripe key: sk_test_51...
  ✅ Created: Starter     → price_1xxxxxx
  ✅ Created: Growth      → price_1yyyyyyy
  ✅ Created: Enterprise  → price_1zzzzzzz

✅ Stripe plans seeded successfully.
```

---

## Step 5: Configure the Webhook

### Local Development (Stripe CLI)

The Stripe CLI forwards live webhook events to your local server:

```bash
# Login
stripe login

# Forward events to local backend
stripe listen --forward-to http://localhost:8000/api/v1/billing/webhook

# The CLI will print your webhook signing secret — copy it to .env
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Production (VPS / Docker)

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set the URL: `https://yourdomain.com/api/v1/billing/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** → paste as `STRIPE_WEBHOOK_SECRET` in `.env`
6. Restart the backend

---

## Step 6: Verify the Integration

### Test a Checkout Flow (Stripe Test Mode)

1. Open your DVT dashboard → click **Billing** in the sidebar
2. Click **Upgrade** on any plan
3. You are redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
5. Complete the checkout
6. You are redirected back to `/dashboard/billing?success=1`
7. Your credits balance should update in the header

### Verify Webhook Delivery

In Stripe Dashboard → Webhooks → your endpoint → check **Recent deliveries** and confirm `checkout.session.completed` returned `200 OK`.

---

## API Endpoints Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/billing/plans` | None | List all active plans |
| `POST` | `/api/v1/billing/create-checkout` | JWT | Create Stripe Checkout session |
| `POST` | `/api/v1/billing/portal` | JWT | Open Stripe Customer Portal |
| `POST` | `/api/v1/billing/webhook` | Stripe sig | Handle Stripe events |
| `GET` | `/api/v1/billing/credits` | JWT | Get balance + transaction history |

---

## Credit System Logic

| Event | Credits Effect |
|---|---|
| `checkout.session.completed` | `+plan.credits_per_month` added to tenant balance |
| `invoice.paid` (monthly renewal) | Balance **reset** to `plan.credits_per_month` |
| `customer.subscription.deleted` | Balance set to `0` |
| Agent task runs | `-1` credit per agent execution |
| Credit exhausted | `InsufficientCreditsError` raised → pipeline halted |

> [!NOTE]
> Credit deduction **fails open** by default — if the billing database is unreachable, agent tasks continue. This prevents billing DB outages from blocking paying customers. Change `return True` to `raise` in `billing_service.py` for hard enforcement.

---

## Running the Tests

```bash
cd backend
pytest tests/test_billing.py -v
```

Expected:
```
PASSED tests/test_billing.py::test_deduct_credits_success
PASSED tests/test_billing.py::test_deduct_credits_insufficient
PASSED tests/test_billing.py::test_deduct_credits_db_error_fails_open
PASSED tests/test_billing.py::test_webhook_invalid_signature
PASSED tests/test_billing.py::test_webhook_checkout_completed
```

---

## File Structure

```
backend/
├── api/routes/
│   └── billing.py               # All /billing/* endpoints
├── services/
│   └── billing_service.py       # deduct_credits() helper + InsufficientCreditsError
├── alembic/versions/
│   └── 003_billing_stripe.py    # Migration: adds billing tables
├── scripts/
│   └── seed_stripe_plans.py     # Seeds plans from Stripe Price IDs
└── tests/
    └── test_billing.py          # Unit + integration tests

frontend/src/app/dashboard/
├── billing/
│   └── page.tsx                 # Billing UI: plan cards, credits bar, history
└── ...

frontend/src/components/layout/
└── sidebar-layout.tsx           # Live credits in header, Billing nav item
```
