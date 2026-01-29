# 4. Use Stripe Checkout for Payments

Date: 2026-01-30

## Status

Accepted

## Context

Muse Frame requires payment processing for portrait orders:
- Fixed price per style ($10)
- One-time payments (no subscriptions)
- Guest checkout (no user accounts)
- Refund capability for failed generations

Options considered:
1. **Stripe Checkout** - Hosted payment page
2. **Stripe Elements** - Embedded payment form
3. **PayPal** - Alternative payment provider
4. **Paddle** - Merchant of record

## Decision

Use **Stripe Checkout** (hosted payment page).

Key reasons:
- Minimal integration effort (redirect-based)
- PCI compliance handled by Stripe
- Webhooks for reliable payment confirmation
- Built-in refund API
- No user account required (guest checkout)

## Consequences

### Positive
- Fast implementation with hosted UI
- Stripe handles PCI compliance
- Reliable webhooks for payment events
- Easy refunds via API
- Mobile-optimized checkout experience

### Negative
- Less UI customization than Stripe Elements
- Users leave site during checkout
- Stripe fees (2.9% + $0.30 per transaction)
