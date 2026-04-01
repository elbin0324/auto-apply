# Billing Design Spec

## Overview

Add Stripe-based subscription billing to the auto-apply platform. Free signup gives access to the platform (browse jobs, upload resume, configure profile) but applying to jobs and engaging autopilot require an active paid subscription.

## Plan Tiers

| Plan | Price | Monthly Quota |
|------|-------|---------------|
| Starter | $19/mo | 25 applications |
| Pro | $49/mo | 100 applications |
| Premium | $99/mo | 500 applications |

- Monthly billing only (no annual)
- Quotas are stored in a backend config mapping, adjustable without deploy
- Quota resets on subscription anniversary (Stripe's billing period), not calendar month

## Billing Model

- **Pure subscription** — no credit packs or top-ups
- **Upgrade self-service** — users can upgrade mid-cycle (Stripe prorates automatically)
- **Cancel/downgrade via support only** — no self-service cancel/downgrade UI
- **Quota exceeded behavior** — soft stop with upgrade prompt showing current usage and next tier info

## Whitelisted Users

- `is_whitelisted` boolean on users table (default false)
- Whitelisted users bypass all billing checks (no subscription required, no quota limit)
- Toggled via admin endpoint: `POST /api/admin/users/{id}/whitelist`

## Database Changes

### Modify `subscriptions` table

Keep existing columns, make these changes:

| Column | Change |
|--------|--------|
| `plan` | Remove `"free"` as a value. Valid: `"starter"`, `"pro"`, `"premium"` |
| `applications_used` | **Add** — int, default 0. Tracks usage within current billing period |
| `credits_remaining` | **Drop** |
| `credits_used_total` | **Drop** |

### Drop `credit_transactions` table

Not needed for pure subscription model.

### Add to `users` table

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `is_whitelisted` | boolean | false | Bypass billing checks |

### Quota computation

Remaining quota is computed on the fly, not stored:

```
remaining = PLAN_QUOTAS[subscription.plan] - subscription.applications_used
```

`applications_used` resets to 0 when Stripe fires `invoice.paid` at each billing cycle renewal.

## Stripe Setup

### Products (create in Stripe)

- `auto_apply_starter` — Starter plan, $19/mo recurring
- `auto_apply_pro` — Pro plan, $49/mo recurring
- `auto_apply_premium` — Premium plan, $99/mo recurring

### Config (backend)

Existing config fields to use:
- `stripe_secret_key`
- `stripe_publishable_key`
- `stripe_webhook_secret`

Price ID fields — simplify to 3 (remove credit pack IDs):
- `stripe_starter_price_id`
- `stripe_pro_price_id`
- `stripe_premium_price_id`

## Backend API

### New billing router (`backend/routers/billing.py`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/billing/plans` | GET | None | Available plans with prices and quotas |
| `/api/billing/subscription` | GET | JWT | Current user's subscription status + usage |
| `/api/billing/checkout` | POST | JWT | Create Stripe Checkout Session, return URL |
| `/api/billing/portal` | POST | JWT | Create Stripe Customer Portal session |
| `/api/billing/webhooks/stripe` | POST | Stripe signature | Webhook handler |

### Webhook events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update subscription row, set plan + period |
| `invoice.paid` | Reset `applications_used` to 0, update period dates |
| `customer.subscription.updated` | Handle mid-cycle upgrades (update plan) |
| `customer.subscription.deleted` | Mark subscription status as `"canceled"` |
| `invoice.payment_failed` | Set subscription status to `"past_due"` |

### Application gating logic

Added to both the apply endpoint and the start-autopilot endpoint:

1. If `user.is_whitelisted` — skip all checks, proceed
2. If no active subscription — return 403 with error code `"no_subscription"`
3. If `applications_used >= PLAN_QUOTAS[plan]` — return 403 with error code `"quota_exceeded"` + next tier info
4. Otherwise — proceed

`applications_used` is incremented once per application sent (not when autopilot starts, but each time an individual application is dispatched). For manual apply, increment on apply. For autopilot, increment each time a task is queued.

## Frontend Changes

### New components

| Component | Purpose |
|-----------|---------|
| `/billing` page | Plan selection with 3 tiers, redirects to Stripe Checkout |
| Upgrade modal | Shown on quota exceeded — usage info + upgrade button |
| Usage bar | "68 / 100 applications used" — on dashboard + settings |

### Modified components

| Component | Change |
|-----------|--------|
| Apply button | Gate: no subscription → redirect `/billing`; quota exceeded → upgrade modal |
| Autopilot button | Same gating logic as Apply |
| Settings subscription card | Show current plan, usage bar, Stripe Portal link for payment management |
| Landing pricing section | Update to 3 paid tiers (no free tier applications) |

### Removed

- All credit pack references (schemas, UI, config)
- Cancel/downgrade UI (users contact support)

## Schemas

### Update `billing.py`

**Keep:** `PlanInfo` (update fields), `CheckoutSession`
**Remove:** `CreditPurchase`, `TransactionItem`, `TransactionHistory`
**Add:** `PlanDetail` (name, price, quota), `SubscriptionStatus` (plan, status, applications_used, quota, remaining, current_period_end)

## Config changes

**Remove from `config.py`:**
- `stripe_credits_10_price_id`
- `stripe_credits_50_price_id`
- `stripe_credits_100_price_id`
- `stripe_credits_250_price_id`

**Add to `config.py`:**
- `stripe_starter_price_id`

**Add plan quota mapping:**
```python
PLAN_QUOTAS = {
    "starter": 25,
    "pro": 100,
    "premium": 500,
}
```
