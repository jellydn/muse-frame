# PRD: Production Readiness & Security Hardening

## Introduction

This PRD addresses critical technical debt, security vulnerabilities, and infrastructure concerns identified in the codebase concerns audit. These issues prevent safe production deployment and must be resolved before the application can handle real customer traffic and payments.

## Goals

- Eliminate all HIGH priority security vulnerabilities
- Fix critical bugs that cause data loss or silent failures
- Replace fragile in-memory infrastructure with production-ready alternatives
- Implement basic production monitoring and logging
- Ensure the application can handle real customer data safely

## Current State Assessment

Based on CONCERNS.md audit, the following issues block production:

### Critical Security (Must Fix)
1. Admin dashboard has no route-level auth - client-side password only
2. Admin server functions exposed without authentication
3. Order status pages have no access control (sequential IDs)
4. Default admin secret hardcoded as fallback

### Critical Bugs (Must Fix)
1. Database update queries missing `.run()` calls - operations silently fail
2. Admin update queries not awaited - race conditions
3. Modal API URL is hardcoded placeholder - will fail in production

### Critical Infrastructure (Must Fix)
1. In-memory job queue - jobs lost on server restart
2. No rate limiting - vulnerable to abuse
3. No webhook retry handling - orders may never process
4. No logging infrastructure - impossible to debug production issues

## User Stories

### US-P01: Implement Server-Side Admin Authentication

**Description:** As a system, I need server-side admin authentication so that admin routes and server functions are protected from unauthorized access.

**Acceptance Criteria:**

- [ ] Create `lib/server/auth.ts` with session verification
- [ ] Implement middleware that validates admin session on all /admin/* routes
- [ ] Add authentication check to all admin server functions (getAdminOrders, adminRetryGeneration, adminRefundOrder)
- [ ] Use HTTP-only cookie with signed token (not plain password)
- [ ] Session expires after 1 hour of inactivity
- [ ] Invalid session redirects to login with error message
- [ ] Remove client-side password comparison from login.tsx
- [ ] Remove hardcoded admin secret fallback from env.ts
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

**Security Impact:** Currently, anyone who knows the admin URL can access the dashboard. Server functions can be called directly without authentication.

### US-P02: Replace In-Memory Queue with Persistent Queue

**Description:** As a system, I need a persistent job queue so that generation jobs survive server restarts and can be monitored.

**Acceptance Criteria:**

- [ ] Choose persistent queue solution (BullMQ with Redis, or database-backed queue)
- [ ] Create migration schema for queue jobs table (if using database)
- [ ] Update `lib/server/queue.ts` to use persistent storage
- [ ] Implement job status tracking (pending, active, completed, failed)
- [ ] Add job retry with exponential backoff
- [ ] Add timeout handling (fail jobs after 5 minutes)
- [ ] Implement queue health check endpoint
- [ ] Handle queue shutdown gracefully on server stop
- [ ] Migrate any existing in-memory queue implementation
- [ ] Typecheck passes

**Operational Impact:** Currently, all pending jobs are lost on server restart. No visibility into failed jobs or processing time.

### US-P03: Add Rate Limiting

**Description:** As a system, I need rate limiting on public endpoints so that the application is protected from abuse and DoS attacks.

**Acceptance Criteria:**

- [ ] Install and configure rate limiting library (e.g., @upstash/ratelimit or custom)
- [ ] Apply rate limiting to upload endpoint (10 uploads per IP per hour)
- [ ] Apply rate limiting to checkout creation (5 checkouts per email per hour)
- [ ] Apply rate limiting to admin login (5 attempts per IP per 15 minutes)
- [ ] Apply rate limiting to webhook endpoint (from Stripe only, whitelist IPs)
- [ ] Return 429 Too Many Requests with Retry-After header
- [ ] Log rate limit violations for monitoring
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

**Security Impact:** Without rate limiting, a single user can exhaust resources, spam generation requests, or brute-force admin access.

### US-P04: Fix Database Update Bugs

**Description:** As a system, I need all database operations to properly await and execute so that data is persisted correctly.

**Acceptance Criteria:**

- [ ] Audit all database update/delete operations for missing `.run()` calls
- [ ] Fix `lib/server/admin.ts:94-98` - add `.run()` to update operations
- [ ] Fix `lib/server/admin.ts:127-133` - add `.run()` to refund operations
- [ ] Ensure all database mutations use `await` keyword
- [ ] Add integration test for admin retry that verifies database persistence
- [ ] Add integration test for admin refund that verifies database persistence
- [ ] Typecheck passes
- [ ] All tests pass

**Data Impact:** Admin retry and refund operations currently fail to persist changes to database, causing silent failures.

### US-P05: Move Modal API URL to Environment Variable

**Description:** As a system, I need external service URLs configurable via environment so that the application works in production.

**Acceptance Criteria:**

- [ ] Add `MODAL_API_URL` to `lib/env.ts` with validation
- [ ] Update `lib/server/modal.ts:23` to use environment variable
- [ ] Add error handling if MODAL_API_URL is not configured
- [ ] Update deployment documentation with required environment variables
- [ ] Add example `.env.example` file with all required variables
- [ ] Typecheck passes

**Deployment Impact:** Production will fail without updating hardcoded placeholder URL.

### US-P06: Implement Webhook Retry Handling

**Description:** As a system, I need reliable webhook processing so that orders are correctly processed even on transient failures.

**Acceptance Criteria:**

- [ ] Add webhook event log table to database (id, eventId, type, payload, processed, retryCount, createdAt)
- [ ] Check for duplicate webhook events using Stripe event ID
- [ ] Implement retry logic for failed webhook processing
- [ ] Store failed webhooks for manual retry
- [ ] Log all webhook events with timestamp and result
- [ ] Return 500 only for transient errors (return 200 for logged errors)
- [ ] Add admin interface to view/failed webhooks
- [ ] Typecheck passes

**Order Impact:** If webhook processing fails, customers pay but never receive their portrait. This causes chargebacks and support burden.

### US-P07: Add Structured Logging

**Description:** As an operator, I need structured logs so that I can debug production issues and monitor system health.

**Acceptance Criteria:**

- [ ] Choose logging library (pino, winston, or built-in with formatting)
- [ ] Define log levels: error, warn, info, debug
- [ ] Add request ID tracing for all operations
- [ ] Log all critical events: payment received, generation started/failed, email sent
- [ ] Include correlation IDs (orderId, stripeSessionId) in all related logs
- [ ] Sanitize sensitive data (never log full credit card, email, or upload paths)
- [ ] Configure log output (JSON in production, pretty in dev)
- [ ] Typecheck passes

**Operational Impact:** Currently only console.log exists - no structured data, no request tracing, impossible to debug production issues.

### US-P08: Add Order Status Access Control

**Description:** As a system, I need to protect order status pages so that users can only view their own orders.

**Acceptance Criteria:**

- [ ] Add email verification to order status page
- [ ] Store order access token in database or signed URL parameter
- [ ] Option A: Require email confirmation (user enters email to view order)
- [ ] Option B: Use signed URL tokens with expiration
- [ ] Return 404 for orders that don't match access credentials
- [ ] Log unauthorized access attempts
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

**Privacy Impact:** Anyone with sequential order ID can view customer email addresses and order details. Major privacy violation.

### US-P09: Add Basic Health Checks

**Description:** As a system, I need health check endpoints so that deployment platforms can monitor application status.

**Acceptance Criteria:**

- [ ] Create `/api/health` endpoint that returns 200 OK
- [ ] Check database connectivity in health endpoint
- [ ] Check R2 storage connectivity in health endpoint
- [ ] Check queue health in health endpoint
- [ ] Return JSON with status: "healthy" | "degraded" | "unhealthy"
- [ ] Return 503 if any critical dependency is down
- [ ] Add uptime/startTime to health response
- [ ] Typecheck passes

**Deployment Impact:** Health checks are required for load balancers, Kubernetes, and most hosting platforms.

### US-P10: Implement Graceful Shutdown

**Description:** As a system, I need graceful shutdown so that in-flight jobs complete before server termination.

**Acceptance Criteria:**

- [ ] Add signal handlers for SIGTERM and SIGINT
- [ ] Stop accepting new requests on shutdown signal
- [ ] Wait for in-flight jobs to complete (with timeout)
- [ ] Persist queue state before shutdown
- [ ] Close database connections gracefully
- [ ] Log shutdown progress
- [ ] Force exit after grace period (30 seconds)
- [ ] Typecheck passes

**Reliability Impact:** Without graceful shutdown, server restarts kill in-flight generations, causing failed orders and customer frustration.

## Functional Requirements

### Security
- FR-S1: All admin routes require server-side authentication validation
- FR-S2: All admin server functions check for valid admin session
- FR-S3: Order status pages protected by access control
- FR-S4: Rate limiting applied to all user-facing endpoints
- FR-S5: No hardcoded credentials or URLs in code

### Reliability
- FR-R1: Job queue persists to database or Redis
- FR-R2: Webhook processing is idempotent and retry-safe
- FR-R3: Database operations properly awaited and executed
- FR-R4: Server shuts down gracefully without data loss

### Observability
- FR-O1: All critical operations emit structured logs
- FR-O2: Logs include correlation IDs for request tracing
- FR-O3: Health check endpoint monitors all dependencies
- FR-O4: Failed webhooks logged and visible in admin

## Non-Goals (Out of Scope)

- No full observability stack (Datadog, New Relic, etc.)
- No distributed tracing (OpenTelemetry)
- No log aggregation service (Loki, ELK)
- No advanced authentication (OAuth, MFA)
- No real-time monitoring dashboards
- No alerting/notifications system
- No automated failover or multi-region deployment
- No CDN configuration (beyond what R2 provides)

## Technical Considerations

### Persistent Queue Options

**Option A: BullMQ with Redis**
- Pros: Battle-tested, feature-rich, good monitoring
- Cons: Requires Redis infrastructure, additional service to manage

**Option B: Database-Backed Queue (Drizzle)**
- Pros: No additional infrastructure, SQLite works
- Cons: Must implement polling, less performant at scale

**Recommendation for MVP:** Start with database-backed queue using Drizzle. Migrate to BullMQ if scale demands it.

### Rate Limiting Implementation

```typescript
// Simple in-memory rate limiter for MVP
const rateLimiter = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const record = rateLimiter.get(key)

  if (!record || now > record.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}
```

### Webhook Idempotency

```typescript
// Check for duplicate Stripe events
const existingEvent = await db.select()
  .from(webhookEvents)
  .where(eq(webhookEvents.eventId, stripeEvent.id))

if (existingEvent.length > 0) {
  return new Response('Event already processed', { status: 200 })
}
```

### Admin Session Token

```typescript
// Use signed JWT instead of plain password
import { sign, verify } from 'jsonwebtoken'

const sessionToken = sign(
  { admin: true, exp: Math.floor(Date.now() / 1000) + 3600 },
  import.meta.env.VITE_ADMIN_SECRET
)
```

## Database Schema Additions

```typescript
// Webhook event log
export const webhookEvents = sqliteTable('webhook_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: text('event_id').notNull().unique(),
  type: text('type').notNull(),
  payload: text('payload').notNull(), // JSON string
  processed: integer('processed', { mode: 'boolean' }).notNull().default(false),
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Queue jobs (if using database-backed queue)
export const queueJobs = sqliteTable('queue_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull(),
  status: text('status').notNull(), // pending, active, completed, failed
  attemptCount: integer('attempt_count').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})
```

## Environment Variables Required

```bash
# Existing
VITE_STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_WEBHOOK_SECRET=whsec_...
VITE_RESEND_API_KEY=re_...
VITE_R2_ACCOUNT_ID=...
VITE_R2_ACCESS_KEY_ID=...
VITE_R2_SECRET_ACCESS_KEY=...
VITE_R2_BUCKET_NAME=...
VITE_ADMIN_PASSWORD=...

# New
VITE_MODAL_API_URL=https://your-app.modal.run/generate
VITE_ADMIN_SESSION_SECRET= # For signing JWTs
VITE_CRON_SECRET= # For cleanup job endpoint
```

## Success Metrics

- All HIGH priority security issues resolved
- No hardcoded credentials or URLs
- All database operations properly awaited
- Job queue survives server restart
- Rate limiting prevents abuse
- Failed webhooks logged and visible
- Health check returns 200 OK
- Graceful shutdown completes within 30 seconds

## Dependencies

- Depends on existing queue, database, and auth implementations
- May require Redis deployment if using BullMQ
- Requires environment variable updates in deployment

## Open Questions

- Should we use Redis for queue now, or start with database-backed?
- What rate limits are appropriate for MVP validation?
- Should order access control use email confirmation or signed tokens?
- How long should admin sessions be valid?
- Should we add request body size limits?
