# PRD: MVP Admin Dashboard & Cleanup Features

## Introduction

This PRD covers the final MVP features needed to complete the Muse Frame application: the admin dashboard for order management and the automated cleanup job for user privacy. These features enable operational oversight and GDPR-compliant data retention.

## Goals

- Enable admin monitoring of all orders with filtering and statistics
- Provide manual retry capability for failed generations
- Enable Stripe refunds for customer support
- Automatically delete uploaded photos after 7 days for privacy compliance
- Complete the MVP feature set for validation phase

## User Stories

### US-018: Admin Orders List

**Description:** As an admin, I want to view all orders with filtering and statistics so that I can monitor system health and customer activity.

**Acceptance Criteria:**

- [ ] Create `routes/admin/orders.tsx` page protected by admin auth
- [ ] Display table with columns: ID, Email, Style, Status, Created Date
- [ ] Status filter dropdown: All | Pending | Paid | Generating | Complete | Failed | Refunded
- [ ] Show summary statistics: total orders, success rate (complete/total)
- [ ] Orders sorted by created date descending (newest first)
- [ ] Each status shows color-coded badge (green=complete, red=failed, yellow=generating)
- [ ] Empty state message when no orders match filter
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-019: Admin Retry Generation

**Description:** As an admin, I want to retry failed portrait generations so that customers receive their orders without manual intervention.

**Acceptance Criteria:**

- [ ] Add "Retry" button in orders table for orders with status `failed`
- [ ] Button disabled for non-failed orders
- [ ] Create `lib/server/admin.ts` with `retryGeneration(orderId)` server function
- [ ] Function re-queues generation job using existing queue system
- [ ] Updates order status to `generating`
- [ ] Logs retry attempt with timestamp (add retryCount field if needed)
- [ ] Refreshes orders list after successful retry
- [ ] Shows success/error toast notification to admin
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-020: Admin Refund Order

**Description:** As an admin, I want to trigger Stripe refunds so that I can handle customer complaints and exceptional cases.

**Acceptance Criteria:**

- [ ] Add "Refund" button in orders table for orders with status `paid` or `failed`
- [ ] Button disabled for refunded orders
- [ ] Create `refundOrder(orderId)` server function in `lib/server/admin.ts`
- [ ] Function calls Stripe Refund API with payment intent ID from order
- [ ] Updates order status to `refunded` in database
- [ ] Stores refund metadata: timestamp, reason (default: "admin_manual")
- [ ] Refreshes orders list after successful refund
- [ ] Shows confirmation dialog before refunding
- [ ] Shows success/error toast notification
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-021: Photo Cleanup Job

**Description:** As a system, I need to automatically delete uploaded photos after 7 days so that user privacy is maintained and storage costs are controlled.

**Acceptance Criteria:**

- [ ] Create `lib/server/cleanup.ts` with `cleanupOldUploads()` function
- [ ] Function queries orders where `createdAt < 7 days ago` AND `uploadPath IS NOT NULL`
- [ ] Deletes original upload files from Cloudflare R2
- [ ] Clears `uploadPath` field in database (sets to NULL)
- [ ] Returns count of deleted files
- [ ] Logs cleanup results to console
- [ ] Create API route `routes/api/cron/cleanup.ts` for scheduled invocation
- [ ] API route requires cron secret (via `X-Cron-Secret` header or env var)
- [ ] Returns 200 OK with cleanup summary
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Admin orders page displays all orders with sortable/filterable table
- FR-2: Status filter persists in URL query params
- FR-3: Summary statistics show at top of admin page (total orders, success rate)
- FR-4: Retry button only visible for failed orders, triggers queue job
- FR-5: Refund button confirms before calling Stripe Refund API
- FR-6: Refund updates order status and stores refund metadata
- FR-7: Cleanup job runs via API endpoint protected by cron secret
- FR-8: Cleanup job deletes files older than 7 days and clears database reference
- FR-9: All admin actions show feedback to user (toast notifications)

## Non-Goals (Out of Scope)

- No admin audit log UI (console logs only)
- No bulk operations (retry/refund multiple orders at once)
- No scheduled/cron infrastructure setup (API endpoint only, deployment config separate)
- No admin user management (single admin password)
- No refund partial amounts (full refund only)
- No cleanup of generated output images (only original uploads)

## Design Considerations

### Admin Orders Table Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin Dashboard                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Statistics: 127 Total Orders | 89% Success Rate | 12 Failed                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Filter: [All ▼]  Search: [________]                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ID    │ Email           │ Style    │ Status     │ Created      │ Actions    │
├───────┼─────────────────┼──────────┼────────────┼──────────────┼────────────┤
│ #127  │ user@aol.com    │ Princess │ Complete   │ 2 min ago    │ [Download] │
│ #126  │ test@gmail.com  │ Fantasy  │ Generating │ 5 min ago    │ [View]     │
│ #125  │ buyer@outlook   │ Heroes   │ Failed     │ 10 min ago   │ [Retry]    │
│ #124  │ sample@yahoo.com│ Grad     │ Paid       │ 15 min ago   │ [Refund]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Status Badge Colors

- `complete`: Green background, dark text
- `paid`: Blue background, dark text
- `generating`: Yellow/orange, dark text
- `failed`: Red background, white text
- `refunded`: Gray background, dark text
- `pending`: Gray outline, dark text

### Button States

- Retry: Enabled for `failed`, disabled otherwise
- Refund: Enabled for `paid`, `failed`, disabled for `refunded` and `complete`
- Download: Enabled only for `complete` orders

## Technical Considerations

### Admin Server Functions

Create `lib/server/admin.ts` with:

```typescript
'use server'

import { db } from '~/db'
import { orders } from '~/db/schema'
import { retryGeneration } from '~/lib/server/queue'
import Stripe from 'stripe'

// Get all orders with optional status filter
export async function getAdminOrders(status?: string) {
  // Implementation
}

// Retry failed generation
export async function adminRetryGeneration(orderId: number) {
  // Update status to generating
  // Queue generation job
  // Log retry
}

// Refund order via Stripe
export async function adminRefundOrder(orderId: number) {
  // Get order stripeSessionId
  // Call Stripe refund API
  // Update status to refunded
  // Log refund
}
```

### Stripe Refund API

```typescript
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  reason: 'requested_by_customer', // or 'duplicate', 'fraudulent'
})
```

### Cleanup Job Query

```typescript
// Drizzle query for old uploads
const oldOrders = await db.select()
  .from(orders)
  .where(
    and(
      isNotNull(orders.uploadPath),
      lt(orders.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    )
  )
```

### Cron Endpoint Protection

Use environment variable for cron secret:
```typescript
const cronSecret = import.meta.env.VITE_CRON_SECRET
const headerSecret = request.headers.get('X-Cron-Secret')
if (headerSecret !== cronSecret) {
  return new Response('Unauthorized', { status: 401 })
}
```

## Database Schema Changes

No new tables required, but consider adding:

```typescript
// Optional: Track retry attempts
retryCount: integer('retry_count').notNull().default(0),
lastRetryAt: integer('last_retry_at', { mode: 'timestamp' }),

// Optional: Track refunds
refundedAt: integer('refunded_at', { mode: 'timestamp' }),
refundReason: text('refund_reason'),
refundId: text('refund_id'), // Stripe refund ID
```

## Success Metrics

- Admin can view all orders with < 2 second page load
- Retry successfully re-queues generation in < 1 second
- Refund completes with Stripe in < 5 seconds
- Cleanup job processes 1000 orders in < 30 seconds
- No storage growth from orphaned upload files

## Open Questions

- Should retry button have a cooldown (prevent spam retries)?
- Should refunds require a reason text input from admin?
- What should happen to output files on refund (keep or delete)?
- Should cleanup job also remove failed generation artifacts?

## Dependencies

- Requires existing admin authentication (US-017)
- Requires existing queue system (US-013)
- Requires existing Stripe integration (US-010)
- Requires Cloudflare R2 configured with delete permissions
