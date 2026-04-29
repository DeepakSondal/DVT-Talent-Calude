"""
DVT Talent AI — Stripe Seed Script
Run this ONCE after creating products in the Stripe dashboard.
Updates subscription_plans with your real Stripe Price IDs.

Usage:
    python scripts/seed_stripe_plans.py
"""
import asyncio
import stripe
import sys
import os

# Add backend root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from db.models import SubscriptionPlan, AsyncSessionLocal
from sqlalchemy import select

stripe.api_key = settings.stripe_secret_key

PLANS = [
    {
        "name": "Starter",
        "credits_per_month": 500,
        "price_usd_cents": 29900,
        "stripe_price_lookup_key": "dvt_starter_monthly",
        "features": [
            "500 credits / month",
            "Autopilot mode",
            "1 user seat",
            "Email support",
        ],
    },
    {
        "name": "Growth",
        "credits_per_month": 2500,
        "price_usd_cents": 99900,
        "stripe_price_lookup_key": "dvt_growth_monthly",
        "features": [
            "2,500 credits / month",
            "Autopilot + Copilot (HITL)",
            "5 user seats",
            "ATS integration",
            "Priority support",
        ],
    },
    {
        "name": "Enterprise",
        "credits_per_month": 10000,
        "price_usd_cents": 350000,
        "stripe_price_lookup_key": "dvt_enterprise_monthly",
        "features": [
            "Unlimited credits",
            "Autopilot + Copilot (HITL)",
            "25 user seats",
            "SSO (SAML/OIDC)",
            "Full ATS sync",
            "Dedicated Customer Success Manager",
        ],
        "is_one_time": False,
    },
    {
        "name": "Agent Starter Pack",
        "credits_per_month": 500,
        "price_usd_cents": 4900,
        "stripe_price_lookup_key": "dvt_credit_500",
        "features": ["500 credits", "No expiration", "Pay-as-you-go"],
        "is_one_time": True,
    },
    {
        "name": "Agent Growth Pack",
        "credits_per_month": 2000,
        "price_usd_cents": 14900,
        "stripe_price_lookup_key": "dvt_credit_2000",
        "features": ["2,000 credits", "No expiration", "Pay-as-you-go"],
        "is_one_time": True,
    },
    {
        "name": "Agent Pro Pack",
        "credits_per_month": 5000,
        "price_usd_cents": 29900,
        "stripe_price_lookup_key": "dvt_credit_5000",
        "features": ["5,000 credits", "No expiration", "Pay-as-you-go"],
        "is_one_time": True,
    },
]


async def seed():
    print("🔑 Using Stripe key:", settings.stripe_secret_key[:12] + "...")

    async with AsyncSessionLocal() as session:
        for plan_data in PLANS:
            name = plan_data["name"]

            # Fetch Stripe price by lookup key
            try:
                prices = stripe.Price.list(lookup_keys=[plan_data["stripe_price_lookup_key"]], expand=["data.product"])
                if not prices.data:
                    print(f"  ⚠️  No Stripe price found for lookup key '{plan_data['stripe_price_lookup_key']}'. "
                          f"Create it in your Stripe dashboard first.")
                    continue
                stripe_price_id = prices.data[0].id
            except stripe.StripeError as e:
                print(f"  ❌ Stripe error for {name}: {e}")
                continue

            # Upsert plan
            result = await session.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == name))
            existing: SubscriptionPlan = result.scalar_one_or_none()

            if existing:
                existing.stripe_price_id = stripe_price_id
                existing.credits_per_month = plan_data["credits_per_month"]
                existing.price_usd_cents = plan_data["price_usd_cents"]
                existing.features = plan_data["features"]
                existing.is_one_time = plan_data.get("is_one_time", False)
                existing.is_active = True
                print(f"  ✅ Updated: {name} → {stripe_price_id}")
            else:
                plan = SubscriptionPlan(
                    name=name,
                    stripe_price_id=stripe_price_id,
                    credits_per_month=plan_data["credits_per_month"],
                    price_usd_cents=plan_data["price_usd_cents"],
                    features=plan_data["features"],
                    is_one_time=plan_data.get("is_one_time", False),
                    is_active=True,
                )
                session.add(plan)
                print(f"  ✅ Created:  {name} → {stripe_price_id}")

        await session.commit()
        print("\n✅ Stripe plans seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
